import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import Stripe from "https://esm.sh/stripe@18.5.0";

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
    if (!stripeKey) {
      return new Response(JSON.stringify({ error: "Stripe not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { bookingId, successUrl, cancelUrl } = await req.json();

    if (!bookingId || !successUrl || !cancelUrl) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch booking
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select("*")
      .eq("id", bookingId)
      .single();

    if (bookingError || !booking) {
      return new Response(
        JSON.stringify({ error: "Booking not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const checkoutAmount = Math.round(Number(booking.amount_remaining ?? booking.total_amount ?? 0));
    if (!Number.isFinite(checkoutAmount) || checkoutAmount <= 0) {
      return new Response(
        JSON.stringify({ error: "No outstanding amount to pay" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      success_url: successUrl,
      cancel_url: cancelUrl,
      customer_email: booking.guest_email || undefined,
      metadata: {
        booking_id: bookingId,
        property_id: booking.property_id,
        owner_id: booking.owner_id,
      },
      line_items: [
        {
          price_data: {
            currency: (booking.currency || "DKK").toLowerCase(),
            unit_amount: checkoutAmount,
            product_data: {
              name: `Booking ${booking.case_number || bookingId.slice(0, 8)}`,
              description: `${booking.check_in} - ${booking.check_out} · ${booking.nights || ""} nætter`,
            },
          },
          quantity: 1,
        },
      ],
    });

    // Update booking with stripe session
    await supabase
      .from("bookings")
      .update({
        stripe_session_id: session.id,
        payment_status: "checkout_started",
      })
      .eq("id", bookingId);

    if (!session.url) {
      return new Response(
        JSON.stringify({ error: "Stripe did not return a checkout URL" }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({ url: session.url, sessionId: session.id }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("Checkout error:", err);
    const message = err instanceof Error ? err.message : String(err);
    return new Response(
      JSON.stringify({ error: message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
