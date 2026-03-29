import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@18.5.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const url = new URL(req.url);
  const sessionId = url.searchParams.get("session_id");
  const bookingId = url.searchParams.get("booking_id");

  if (!sessionId || !bookingId) {
    return new Response(JSON.stringify({ error: "session_id and booking_id required" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", { apiVersion: "2025-08-27.basil" });

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {
      return new Response(JSON.stringify({ error: "Betaling ikke gennemført", status: session.payment_status }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: booking } = await supabase.from("bookings").select("*").eq("id", bookingId).single();
    if (!booking) {
      return new Response(JSON.stringify({ error: "Booking not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (booking.status === "confirmed") {
      return new Response(JSON.stringify({ success: true, booking, already_confirmed: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const amountPaid = session.amount_total || 0;
    await supabase.from("bookings").update({
      status: "confirmed", payment_status: "paid",
      stripe_session_id: sessionId, amount_paid: amountPaid, amount_remaining: 0,
    }).eq("id", bookingId);

    // Release holds
    await supabase.from("availability_holds").update({ released: true }).eq("booking_id", bookingId);

    // Create payment record
    const paymentIntentId = typeof session.payment_intent === 'string'
      ? session.payment_intent : session.payment_intent?.id || null;
    await supabase.from("payments").insert({
      booking_id: bookingId, owner_id: booking.owner_id,
      amount: amountPaid, currency: (session.currency || "dkk").toUpperCase(),
      status: "completed", payment_method: "stripe",
      stripe_checkout_session_id: sessionId,
      stripe_payment_intent_id: paymentIntentId,
      paid_at: new Date().toISOString(), note: "Stripe checkout betaling",
    });

    // Create listing block for confirmed dates
    await supabase.from("listing_blocks").insert({
      listing_id: booking.property_id, owner_id: booking.owner_id,
      start_date: booking.check_in, end_date: booking.check_out,
      source: "direct_booking", external_uid: `booking-${bookingId}`,
      summary: `Booking bekræftet`,
    });

    return new Response(JSON.stringify({ success: true, booking: { ...booking, status: "confirmed" } }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: msg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
