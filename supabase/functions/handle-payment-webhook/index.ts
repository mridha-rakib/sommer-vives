import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

    if (!stripeKey) {
      return new Response("Stripe not configured", { status: 500 });
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    const body = await req.text();
    const sig = req.headers.get("stripe-signature");

    let event: Stripe.Event;

    if (webhookSecret && sig) {
      try {
        event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
      } catch (err: any) {
        console.error("Webhook signature verification failed:", err.message);
        return new Response(`Webhook Error: ${err.message}`, { status: 400 });
      }
    } else {
      event = JSON.parse(body) as Stripe.Event;
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const bookingId = session.metadata?.booking_id;

        if (bookingId) {
          // Update booking payment status
          await supabase
            .from("bookings")
            .update({
              payment_status: "paid",
              status: "confirmed",
              amount_paid: (session.amount_total || 0) / 100,
              amount_remaining: 0,
              stripe_session_id: session.id,
            })
            .eq("id", bookingId);

          // Create payment record
          const booking = (await supabase.from("bookings").select("*").eq("id", bookingId).single()).data;
          if (booking) {
            await supabase.from("payments").insert({
              booking_id: bookingId,
              owner_id: booking.owner_id,
              amount: (session.amount_total || 0) / 100,
              currency: (session.currency || "dkk").toUpperCase(),
              status: "completed",
              payment_method: session.payment_method_types?.[0] || "card",
              stripe_checkout_session_id: session.id,
              stripe_payment_intent_id: typeof session.payment_intent === 'string' ? session.payment_intent : null,
              paid_at: new Date().toISOString(),
            });

            // Create pending payout for owner
            const ownerPayout = Number(booking.owner_payout || booking.total_amount * 0.85);
            await supabase.from("payouts").insert({
              owner_id: booking.owner_id,
              property_id: booking.property_id,
              amount: ownerPayout,
              currency: booking.currency || "DKK",
              status: "pending",
              description: `Booking ${booking.case_number || bookingId.slice(0, 8)}`,
            });
          }

          console.log(`Booking ${bookingId} marked as paid`);
        }
        break;
      }

      case "checkout.session.expired": {
        const session = event.data.object as Stripe.Checkout.Session;
        const bookingId = session.metadata?.booking_id;
        if (bookingId) {
          await supabase
            .from("bookings")
            .update({ payment_status: "expired" })
            .eq("id", bookingId);
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("Webhook error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
