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

    const { data: existingPayment } = await supabase
      .from("payments")
      .select("*")
      .eq("stripe_checkout_session_id", sessionId)
      .maybeSingle();

    if (existingPayment?.status === "completed" || existingPayment?.status === "refunded") {
      return new Response(JSON.stringify({ success: true, booking, already_confirmed: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const amountPaid = session.amount_total || 0;
    const totalAmount = Number(booking.total_amount || 0);
    const previousPaid = Number(booking.amount_paid || 0);
    const nextPaid = Math.min(totalAmount || previousPaid + amountPaid, previousPaid + amountPaid);
    const nextRemaining = Math.max(0, totalAmount - nextPaid);
    const paymentStatus = nextRemaining > 0 ? "partially_paid" : "paid";

    await supabase.from("bookings").update({
      status: "confirmed",
      payment_status: paymentStatus,
      stripe_session_id: sessionId,
      amount_paid: nextPaid,
      amount_remaining: nextRemaining,
    }).eq("id", bookingId);

    // Release holds
    await supabase.from("availability_holds").update({ released: true }).eq("booking_id", bookingId);

    // Create payment record
    const paymentIntentId = typeof session.payment_intent === 'string'
      ? session.payment_intent : session.payment_intent?.id || null;
    const paymentPayload = {
      booking_id: bookingId, owner_id: booking.owner_id,
      amount: amountPaid, currency: (session.currency || "dkk").toUpperCase(),
      status: "completed", payment_method: "stripe",
      stripe_checkout_session_id: sessionId,
      stripe_payment_intent_id: paymentIntentId,
      paid_at: new Date().toISOString(), note: "Stripe checkout betaling",
    };

    if (existingPayment?.id) {
      await supabase.from("payments").update(paymentPayload).eq("id", existingPayment.id);
    } else {
      await supabase.from("payments").insert(paymentPayload);
    }

    if (nextRemaining === 0) {
      await ensurePendingOwnerPayout(supabase, { ...booking, amount_paid: nextPaid, amount_remaining: nextRemaining }, bookingId);
    }

    // Create listing block for confirmed dates
    const { data: existingBlock } = await supabase
      .from("listing_blocks")
      .select("id")
      .eq("external_uid", `booking-${bookingId}`)
      .maybeSingle();
    if (!existingBlock) {
      await supabase.from("listing_blocks").insert({
        listing_id: booking.property_id, owner_id: booking.owner_id,
        start_date: booking.check_in, end_date: booking.check_out,
        source: "direct_booking", external_uid: `booking-${bookingId}`,
        summary: `Booking bekræftet`,
      });
    }

    return new Response(JSON.stringify({ success: true, booking: { ...booking, status: "confirmed", payment_status: paymentStatus, amount_paid: nextPaid, amount_remaining: nextRemaining } }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: msg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});

async function ensurePendingOwnerPayout(
  supabase: ReturnType<typeof createClient>,
  booking: {
    owner_id?: string;
    property_id?: string;
    owner_payout?: number | string | null;
    total_amount?: number | string | null;
    currency?: string | null;
    case_number?: string | null;
  },
  bookingId: string,
) {
  const { data: existingPayout } = await supabase
    .from("payouts")
    .select("id")
    .eq("booking_id", bookingId)
    .maybeSingle();
  if (existingPayout) return;

  const ownerPayout = Math.max(0, Math.round(Number(booking.owner_payout || 0) || Number(booking.total_amount || 0) * 0.85));
  if (ownerPayout <= 0) return;

  await supabase.from("payouts").insert({
    booking_id: bookingId,
    owner_id: booking.owner_id,
    property_id: booking.property_id,
    amount: ownerPayout,
    currency: booking.currency || "DKK",
    status: "pending",
    description: `Booking ${booking.case_number || bookingId.slice(0, 8)}`,
  });
}
