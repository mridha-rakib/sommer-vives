import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";
import webpush from "npm:web-push@3.6.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type ChatMessage = {
  id: string;
  message: string;
  sender_type: string;
  sender_name: string | null;
  recipient_id: string | null;
  attachment_name: string | null;
};

type PushSubscriptionRow = {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
};

type WebPushError = {
  statusCode?: number;
  message?: string;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "POST required" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const url = Deno.env.get("SUPABASE_URL");
    const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const vapidPublic = Deno.env.get("VAPID_PUBLIC_KEY");
    const vapidPrivate = Deno.env.get("VAPID_PRIVATE_KEY");
    const vapidSubject = Deno.env.get("VAPID_SUBJECT") || "mailto:support@sommervibes.dk";

    if (!url || !serviceRole || !vapidPublic || !vapidPrivate) {
      return new Response(JSON.stringify({
        skipped: true,
        reason: "push_not_configured",
        missing: {
          SUPABASE_URL: !url,
          SUPABASE_SERVICE_ROLE_KEY: !serviceRole,
          VAPID_PUBLIC_KEY: !vapidPublic,
          VAPID_PRIVATE_KEY: !vapidPrivate,
        },
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    webpush.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate);
    const supabase = createClient(url, serviceRole, { auth: { persistSession: false } });
    const { messageId } = await req.json().catch(() => ({}));
    if (!messageId) throw new Error("messageId is required");

    const { data: message, error } = await supabase
      .from("chat_messages")
      .select("id, message, sender_type, sender_name, recipient_id, attachment_name")
      .eq("id", messageId)
      .single();

    if (error || !message) throw error || new Error("Message not found");
    const m = message as ChatMessage;

    let recipientIds: string[] = [];
    let urlPath = "/";
    let title = "Ny besked";

    if (m.sender_type === "admin") {
      if (m.recipient_id) recipientIds = [m.recipient_id];
      const { data: recipientRoles } = m.recipient_id
        ? await supabase.from("user_roles").select("role").eq("user_id", m.recipient_id)
        : { data: [] };
      const isOwner = (recipientRoles || []).some((row: { role: string }) => row.role === "owner");
      urlPath = isOwner ? "/owner/messages" : "/guest/messages";
      title = "Ny besked fra SommerVibes";
    } else {
      const { data: admins } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "admin");
      recipientIds = (admins || []).map((row: { user_id: string }) => row.user_id);
      urlPath = "/admin/beskeder";
      title = m.sender_type === "owner" ? "Ny besked fra ejer" : "Ny besked fra gæst";
    }

    if (recipientIds.length === 0) {
      return new Response(JSON.stringify({ sent: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: prefs } = await supabase
      .from("notification_preferences")
      .select("user_id, push_enabled")
      .in("user_id", recipientIds);
    const disabled = new Set((prefs || [])
      .filter((pref: { push_enabled: boolean | null }) => pref.push_enabled === false)
      .map((pref: { user_id: string }) => pref.user_id));
    const enabledRecipients = recipientIds.filter(id => !disabled.has(id));

    const { data: subs } = await supabase
      .from("push_subscriptions")
      .select("id, user_id, endpoint, p256dh, auth")
      .in("user_id", enabledRecipients)
      .is("disabled_at", null);

    if (enabledRecipients.length === 0) {
      return new Response(JSON.stringify({ sent: 0, recipients: 0, reason: "push_disabled" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = m.message || (m.attachment_name ? `Vedhæftet fil: ${m.attachment_name}` : "Ny besked");
    const payload = JSON.stringify({
      title,
      body: (m.sender_name ? `${m.sender_name}: ` : "") + body.slice(0, 140),
      url: urlPath,
      tag: "sv-chat",
    });

    let sent = 0;
    let disabledCount = 0;
    let failed = 0;
    await Promise.all(((subs || []) as PushSubscriptionRow[]).map(async (sub) => {
      try {
        await webpush.sendNotification({
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        }, payload);
        sent += 1;
        await supabase.from("push_subscriptions").update({ last_used_at: new Date().toISOString() }).eq("id", sub.id);
      } catch (err: unknown) {
        const pushError = err as WebPushError;
        if (pushError?.statusCode === 404 || pushError?.statusCode === 410) {
          disabledCount += 1;
          await supabase.from("push_subscriptions").update({ disabled_at: new Date().toISOString() }).eq("id", sub.id);
        } else {
          failed += 1;
          console.error(`[PUSH] Failed for subscription ${sub.id}: ${pushError?.message || "Unknown error"}`);
        }
      }
    }));

    return new Response(JSON.stringify({
      sent,
      failed,
      disabled: disabledCount,
      recipients: enabledRecipients.length,
      subscriptions: (subs || []).length,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
