import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type JsonRecord = Record<string, unknown>;

function json(body: JsonRecord, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function asObject(value: unknown): JsonRecord {
  return value && typeof value === "object" && !Array.isArray(value) ? value as JsonRecord : {};
}

function generateToken() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, byte => byte.toString(16).padStart(2, "0")).join("");
}

function buildFeedUrl(supabaseUrl: string, listingId: string, token: string) {
  const url = new URL(`${supabaseUrl}/functions/v1/ical-export`);
  url.searchParams.set("listing_id", listingId);
  url.searchParams.set("token", token);
  return url.toString();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "POST required" }, 405);

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const authorization = req.headers.get("Authorization") || "";

    if (!authorization) return json({ error: "Authentication required" }, 401);

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authorization } },
    });
    const { data: authData, error: authError } = await userClient.auth.getUser();
    if (authError || !authData.user) return json({ error: "Authentication required" }, 401);

    const { listingId, rotate = false } = await req.json().catch(() => ({}));
    const shouldRotate = rotate === true;
    if (!listingId || typeof listingId !== "string") return json({ error: "listingId is required" }, 400);

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const { data: listing } = await supabase
      .from("listings")
      .select("id, owner_id")
      .eq("id", listingId)
      .maybeSingle();
    if (!listing) return json({ error: "Listing not found" }, 404);

    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", authData.user.id);
    const isAdmin = (roles || []).some((row) => row.role === "admin" || row.role === "super_admin");
    if (!isAdmin && listing.owner_id !== authData.user.id) {
      return json({ error: "Not authorized for this listing" }, 403);
    }

    const { data: existingSetting } = await supabase
      .from("sync_settings")
      .select("*")
      .eq("listing_id", listing.id)
      .eq("provider", "sommer_vibes_export")
      .limit(1)
      .maybeSingle();

    const existingConfig = asObject(existingSetting?.config);
    const existingToken = typeof existingConfig.export_token === "string" ? existingConfig.export_token : "";
    const token = shouldRotate || !existingToken ? generateToken() : existingToken;
    const feedUrl = buildFeedUrl(supabaseUrl, listing.id, token);
    const config = {
      ...existingConfig,
      export_token: token,
      export_token_rotated_at: shouldRotate || !existingToken ? new Date().toISOString() : existingConfig.export_token_rotated_at || null,
    };

    if (existingSetting) {
      const { error: updateError } = await supabase
        .from("sync_settings")
        .update({
          owner_id: listing.owner_id,
          feed_url: feedUrl,
          direction: "export",
          is_active: true,
          config,
        })
        .eq("id", existingSetting.id);
      if (updateError) throw updateError;
    } else {
      const { error: insertError } = await supabase.from("sync_settings").insert({
        listing_id: listing.id,
        owner_id: listing.owner_id,
        provider: "sommer_vibes_export",
        feed_url: feedUrl,
        direction: "export",
        is_active: true,
        config,
      });
      if (insertError) throw insertError;
    }

    return json({ success: true, listingId: listing.id, token, feedUrl });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return json({ error: message }, 500);
  }
});
