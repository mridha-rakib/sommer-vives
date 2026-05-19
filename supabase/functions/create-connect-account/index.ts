import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@18.5.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function requireAdmin(req: Request) {
  const client = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: req.headers.get("Authorization") || "" } } },
  );
  const { data: { user } } = await client.auth.getUser();
  if (!user) return false;
  const { data } = await client.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle();
  return !!data;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "POST required" }, 405);
  if (!(await requireAdmin(req))) return json({ error: "Admin access required" }, 403);

  const { ownerId, returnUrl, refreshUrl } = await req.json();
  if (!ownerId) return json({ error: "ownerId required" }, 400);

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: profile } = await supabase.from("profiles").select("email, full_name").eq("id", ownerId).maybeSingle();
  const { data: existing } = await supabase
    .from("owner_bank_settings")
    .select("*")
    .eq("owner_id", ownerId)
    .maybeSingle();

  const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", { apiVersion: "2025-08-27.basil" });
  let accountId = existing?.stripe_connect_account_id as string | null;

  if (!accountId) {
    const account = await stripe.accounts.create({
      type: "express",
      country: "DK",
      email: profile?.email || undefined,
      capabilities: {
        transfers: { requested: true },
      },
      business_type: "individual",
      metadata: { owner_id: ownerId },
    });
    accountId = account.id;
  }

  const origin = req.headers.get("origin") || Deno.env.get("SITE_URL") || Deno.env.get("VITE_SITE_URL") || "https://sommervibes.dk";
  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    type: "account_onboarding",
    return_url: returnUrl || `${origin}/admin/oekonomi`,
    refresh_url: refreshUrl || `${origin}/admin/oekonomi`,
  });

  const payload = {
    owner_id: ownerId,
    account_holder: existing?.account_holder || profile?.full_name || null,
    stripe_connect_account_id: accountId,
    stripe_connect_status: "onboarding_started",
    stripe_connect_onboarding_url: accountLink.url,
    updated_at: new Date().toISOString(),
  };

  if (existing?.id) {
    await supabase.from("owner_bank_settings").update(payload).eq("id", existing.id);
  } else {
    await supabase.from("owner_bank_settings").insert(payload);
  }

  return json({ success: true, account_id: accountId, onboarding_url: accountLink.url });
});
