import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@18.5.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", { apiVersion: "2025-08-27.basil" });
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  if (!webhookSecret) {
    return new Response(JSON.stringify({ error: "Webhook secret not configured" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return new Response(JSON.stringify({ error: "Missing stripe-signature header" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  const body = await req.text();
  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: `Webhook signature failed: ${msg}` }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  console.log(`[STRIPE-WEBHOOK] Event: ${event.type}, ID: ${event.id}`);

  try {
    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded":
        await handleCheckoutCompleted(supabase, event.data.object as Stripe.Checkout.Session);
        break;
      case "checkout.session.async_payment_failed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const bookingId = session.metadata?.booking_id;
        if (bookingId) {
          await supabase.from("bookings").update({ payment_status: "failed" }).eq("id", bookingId);
        }
        break;
      }
      default:
        console.log(`[STRIPE-WEBHOOK] Unhandled event: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: msg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});

async function handleCheckoutCompleted(supabase: ReturnType<typeof createClient>, session: Stripe.Checkout.Session) {
  const bookingId = session.metadata?.booking_id;
  if (!bookingId) {
    const { data: b } = await supabase.from("bookings").select("id").eq("stripe_session_id", session.id).single();
    if (!b) { console.log(`[STRIPE-WEBHOOK] No booking for session ${session.id}`); return; }
    return await processPayment(supabase, session, b.id);
  }
  await processPayment(supabase, session, bookingId);
}

async function processPayment(supabase: ReturnType<typeof createClient>, session: Stripe.Checkout.Session, bookingId: string) {
  const { data: booking } = await supabase.from("bookings").select("*").eq("id", bookingId).single();
  if (!booking) { console.error(`[STRIPE-WEBHOOK] Booking ${bookingId} not found`); return; }
  if (booking.status === "confirmed" && booking.payment_status === "paid") { return; }
  if (session.payment_status !== "paid") { return; }

  const amountPaid = session.amount_total || 0;
  await supabase.from("bookings").update({
    status: "confirmed", payment_status: "paid",
    stripe_session_id: session.id, amount_paid: amountPaid, amount_remaining: 0,
  }).eq("id", bookingId);

  await supabase.from("availability_holds").update({ released: true }).eq("booking_id", bookingId);

  const paymentIntentId = typeof session.payment_intent === "string"
    ? session.payment_intent : session.payment_intent?.id || null;
  await supabase.from("payments").insert({
    booking_id: bookingId, owner_id: booking.owner_id,
    amount: amountPaid, currency: (session.currency || "dkk").toUpperCase(),
    status: "completed", payment_method: "stripe",
    stripe_checkout_session_id: session.id,
    stripe_payment_intent_id: paymentIntentId,
    paid_at: new Date().toISOString(), note: "Stripe webhook payment",
  });

  // Create block for confirmed dates
  await supabase.from("listing_blocks").insert({
    listing_id: booking.property_id, owner_id: booking.owner_id,
    start_date: booking.check_in, end_date: booking.check_out,
    source: "direct_booking", external_uid: `booking-${bookingId}`,
    summary: "Booking bekræftet",
  });

  console.log(`[STRIPE-WEBHOOK] Booking ${bookingId} confirmed`);
}
