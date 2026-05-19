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

  const { payoutId } = await req.json();
  if (!payoutId) return json({ error: "payoutId required" }, 400);

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: payout, error } = await supabase.from("payouts").select("*").eq("id", payoutId).single();
  if (error || !payout) return json({ error: "Payout not found" }, 404);
  if (payout.status === "completed") return json({ success: true, already_completed: true, payout });

  if (payout.booking_id) {
    const { data: booking } = await supabase
      .from("bookings")
      .select("amount_remaining, payment_status")
      .eq("id", payout.booking_id)
      .maybeSingle();
    if (booking && Number(booking.amount_remaining || 0) > 0) {
      return json({ error: "Booking still has an outstanding balance" }, 400);
    }
  }

  const { data: bank } = await supabase
    .from("owner_bank_settings")
    .select("*")
    .eq("owner_id", payout.owner_id)
    .maybeSingle();

  const accountId = bank?.stripe_connect_account_id as string | null;
  if (!accountId) return json({ error: "Owner has no Stripe Connect account" }, 400);

  const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", { apiVersion: "2025-08-27.basil" });
  const account = await stripe.accounts.retrieve(accountId);
  await supabase.from("owner_bank_settings").update({
    stripe_connect_status: account.details_submitted ? "active" : "restricted",
    stripe_connect_charges_enabled: !!account.charges_enabled,
    stripe_connect_payouts_enabled: !!account.payouts_enabled,
  }).eq("owner_id", payout.owner_id);

  if (!account.payouts_enabled) {
    return json({ error: "Stripe Connect account is not ready for payouts" }, 400);
  }

  try {
    const transferAmount = Math.round(Number(payout.amount || 0));
    if (!Number.isFinite(transferAmount) || transferAmount <= 0) {
      return json({ error: "Payout amount must be greater than zero" }, 400);
    }

    const transfer = await stripe.transfers.create({
      amount: transferAmount,
      currency: String(payout.currency || "dkk").toLowerCase(),
      destination: accountId,
      metadata: {
        payout_id: payout.id,
        owner_id: payout.owner_id,
        property_id: payout.property_id || "",
      },
    });

    const now = new Date().toISOString();
    const { data: updated } = await supabase.from("payouts").update({
      status: "completed",
      stripe_transfer_id: transfer.id,
      stripe_payout_id: transfer.id,
      payout_date: now,
      executed_at: now,
      failure_reason: null,
    }).eq("id", payout.id).select().single();

    return json({ success: true, transfer_id: transfer.id, payout: updated });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await supabase.from("payouts").update({
      status: "failed",
      failure_reason: message,
    }).eq("id", payout.id);
    return json({ error: message }, 500);
  }
});
