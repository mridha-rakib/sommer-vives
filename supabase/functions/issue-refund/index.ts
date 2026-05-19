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
  const authHeader = req.headers.get("Authorization") || "";
  const client = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
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

  const { paymentId, amount, reason, note } = await req.json();
  if (!paymentId) return json({ error: "paymentId required" }, 400);

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: payment, error } = await supabase
    .from("payments")
    .select("*, bookings(*)")
    .eq("id", paymentId)
    .single();
  if (error || !payment) return json({ error: "Payment not found" }, 404);
  if (!payment.stripe_payment_intent_id) return json({ error: "Payment has no Stripe payment intent" }, 400);
  if (payment.status === "refunded") return json({ error: "Payment is already refunded" }, 400);

  const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", { apiVersion: "2025-08-27.basil" });
  const intent = await stripe.paymentIntents.retrieve(payment.stripe_payment_intent_id);
  const charge = typeof intent.latest_charge === "string" ? await stripe.charges.retrieve(intent.latest_charge) : intent.latest_charge;
  const alreadyRefunded = charge?.amount_refunded || 0;
  const paymentAmount = intent.amount_received || intent.amount || Number(payment.amount || 0);
  const refundable = Math.max(0, paymentAmount - alreadyRefunded);
  const refundAmount = amount === undefined || amount === null ? refundable : Math.round(Number(amount));

  if (!Number.isFinite(refundAmount) || refundAmount <= 0) return json({ error: "No refundable amount" }, 400);
  if (refundAmount > refundable) return json({ error: "Refund amount exceeds refundable balance" }, 400);

  const refund = await stripe.refunds.create({
    payment_intent: payment.stripe_payment_intent_id,
    amount: refundAmount,
    reason: reason || "requested_by_customer",
    metadata: { payment_id: payment.id, booking_id: payment.booking_id },
  });

  const refundedTotal = Number(payment.refunded_amount || 0) + refundAmount;
  const fullyRefunded = refundedTotal >= paymentAmount;
  await supabase.from("payments").update({
    status: fullyRefunded ? "refunded" : "completed",
    refunded_amount: refundedTotal,
    stripe_refund_id: refund.id,
    refunded_at: new Date().toISOString(),
    note: [
      payment.note,
      note ? `Refundering: ${note}` : "Refunderet via Stripe",
    ].filter(Boolean).join(" · "),
  }).eq("id", payment.id);

  if (payment.bookings) {
    const previousPaid = Number(payment.bookings.amount_paid || 0);
    const previousRemaining = Number(payment.bookings.amount_remaining || 0);
    const total = Number(payment.bookings.total_amount || 0);
    const nextPaid = Math.max(0, previousPaid - refundAmount);
    const nextRemaining = Math.min(total, previousRemaining + refundAmount);
    await supabase.from("bookings").update({
      amount_paid: nextPaid,
      amount_remaining: nextRemaining,
      payment_status: nextPaid <= 0 ? "refunded" : "partially_paid",
    }).eq("id", payment.booking_id);

    const { data: payout } = await supabase
      .from("payouts")
      .select("*")
      .eq("booking_id", payment.booking_id)
      .maybeSingle();

    if (payout && payout.status !== "completed") {
      const nextOwnerPayout = Math.round(nextPaid * 0.85);
      await supabase.from("payouts").update({
        amount: nextOwnerPayout,
        status: nextOwnerPayout > 0 ? "pending" : "failed",
        failure_reason: nextOwnerPayout > 0 ? null : "Booking fully refunded before payout",
      }).eq("id", payout.id);
    }
  }

  return json({ success: true, refund_id: refund.id, amount: refundAmount });
});
