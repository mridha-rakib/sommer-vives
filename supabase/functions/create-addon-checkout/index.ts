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
    if (!stripeKey) {
      return new Response(JSON.stringify({ error: "Stripe not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { items, bookingId, userType, successUrl, cancelUrl } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return new Response(JSON.stringify({ error: "No items provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user if authenticated
    let userId: string | null = null;
    let userEmail: string | null = null;
    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
      const { data } = await anonClient.auth.getUser(token);
      if (data.user) {
        userId = data.user.id;
        userEmail = data.user.email || null;
      }
    }

    // If booking, fetch guest email
    let guestId: string | null = null;
    let propertyId: string | null = null;
    if (bookingId) {
      const { data: booking } = await supabase
        .from("bookings")
        .select("guest_email, guest_id, property_id")
        .eq("id", bookingId)
        .single();
      if (booking) {
        userEmail = userEmail || booking.guest_email;
        guestId = booking.guest_id;
        propertyId = booking.property_id;
      }
    }

    // Calculate totals
    const lineItems: any[] = [];
    const orderItems: any[] = [];
    let subtotal = 0;

    for (const item of items) {
      const itemTotal = Math.round(item.price * (item.quantity || 1));
      subtotal += itemTotal;

      lineItems.push({
        price_data: {
          currency: "dkk",
          unit_amount: Math.round(item.price * 100), // Stripe uses cents
          product_data: {
            name: item.name,
            description: item.description || undefined,
          },
        },
        quantity: item.quantity || 1,
      });

      orderItems.push({
        item_type: item.itemType || "addon",
        reference_id: item.referenceId || null,
        label: item.name,
        description: item.description || null,
        quantity: item.quantity || 1,
        unit_price: Math.round(item.price * 100),
        total: Math.round(itemTotal * 100),
      });
    }

    // Create order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_type: userType || "guest",
        user_id: userId,
        guest_id: guestId,
        booking_id: bookingId || null,
        property_id: propertyId,
        subtotal: Math.round(subtotal * 100),
        total: Math.round(subtotal * 100),
        currency: "DKK",
        status: "pending",
        payment_status: "pending",
      })
      .select()
      .single();

    if (orderError) {
      console.error("Order creation error:", orderError);
      return new Response(JSON.stringify({ error: "Failed to create order" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Insert order items
    const itemsWithOrder = orderItems.map((item) => ({
      ...item,
      order_id: order.id,
    }));
    await supabase.from("order_items").insert(itemsWithOrder);

    // Create Stripe session
    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    const origin = req.headers.get("origin") || "https://sommerdroem.lovable.app";
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      success_url: successUrl || `${origin}/guest?payment=success&order=${order.id}`,
      cancel_url: cancelUrl || `${origin}/guest?payment=cancelled&order=${order.id}`,
      customer_email: userEmail || undefined,
      metadata: {
        order_id: order.id,
        booking_id: bookingId || "",
        user_type: userType || "guest",
      },
      line_items: lineItems,
    });

    // Update order with stripe session
    await supabase
      .from("orders")
      .update({
        stripe_session_id: session.id,
        payment_status: "pending",
      })
      .eq("id", order.id);

    return new Response(
      JSON.stringify({ url: session.url, sessionId: session.id, orderId: order.id }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err: any) {
    console.error("Addon checkout error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
