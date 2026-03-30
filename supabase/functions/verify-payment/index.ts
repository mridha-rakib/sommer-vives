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
    const { orderId, sessionId } = await req.json();
    if (!orderId && !sessionId) {
      return new Response(JSON.stringify({ error: "Missing orderId or sessionId" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY")!;
    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Find the order
    let order;
    if (orderId) {
      const { data } = await supabase.from("orders").select("*").eq("id", orderId).single();
      order = data;
    } else {
      const { data } = await supabase.from("orders").select("*").eq("stripe_session_id", sessionId).single();
      order = data;
    }

    if (!order || !order.stripe_session_id) {
      return new Response(JSON.stringify({ error: "Order not found", status: "unknown" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check Stripe session
    const session = await stripe.checkout.sessions.retrieve(order.stripe_session_id);

    let paymentStatus = order.payment_status;
    let orderStatus = order.status;

    if (session.payment_status === "paid") {
      paymentStatus = "paid";
      orderStatus = "confirmed";
    } else if (session.status === "expired") {
      paymentStatus = "failed";
      orderStatus = "cancelled";
    }

    // Update order
    await supabase
      .from("orders")
      .update({
        payment_status: paymentStatus,
        status: orderStatus,
        stripe_payment_intent_id: session.payment_intent as string || null,
      })
      .eq("id", order.id);

    // Create invoice if paid
    if (paymentStatus === "paid") {
      const { data: existingInvoice } = await supabase
        .from("invoices")
        .select("id")
        .eq("order_id", order.id)
        .maybeSingle();

      if (!existingInvoice) {
        await supabase.from("invoices").insert({
          order_id: order.id,
          invoice_number: "", // trigger will set it
          subtotal: order.subtotal,
          tax: order.tax,
          total: order.total,
          currency: order.currency,
          status: "paid",
          paid_at: new Date().toISOString(),
          recipient_email: session.customer_details?.email || null,
          recipient_name: session.customer_details?.name || null,
        });
      }
    }

    return new Response(
      JSON.stringify({ status: paymentStatus, orderStatus, orderId: order.id }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err: any) {
    console.error("Verify payment error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
