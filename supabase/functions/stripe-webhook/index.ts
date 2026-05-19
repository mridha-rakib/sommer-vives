import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@18.5.0";

type PayoutBooking = {
  owner_id: string;
  property_id: string;
  owner_payout?: number | string | null;
  total_amount?: number | string | null;
  currency?: string | null;
  case_number?: string | null;
};

type JsonRecord = Record<string, unknown>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseServiceClient = SupabaseClient<any, "public", any>;

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
        const orderId = session.metadata?.order_id;
        if (orderId) {
          await markOrderPaymentFailed(supabase, session, orderId);
          break;
        }
        const bookingId = session.metadata?.booking_id;
        if (bookingId) {
          await supabase.from("bookings").update({ payment_status: "failed" }).eq("id", bookingId);
        }
        break;
      }
      case "checkout.session.expired": {
        const session = event.data.object as Stripe.Checkout.Session;
        const orderId = session.metadata?.order_id;
        if (orderId) {
          await markOrderPaymentFailed(supabase, session, orderId);
          break;
        }
        const bookingId = session.metadata?.booking_id;
        if (bookingId) {
          await supabase.from("bookings").update({ status: "cancelled", payment_status: "expired" }).eq("id", bookingId);
          await supabase.from("availability_holds").update({ released: true }).eq("booking_id", bookingId);
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

async function handleCheckoutCompleted(supabase: SupabaseServiceClient, session: Stripe.Checkout.Session) {
  const orderId = session.metadata?.order_id;
  if (orderId) {
    await processOrderPayment(supabase, session, orderId);
    return;
  }

  const bookingId = session.metadata?.booking_id;
  if (!bookingId) {
    const { data: b } = await supabase.from("bookings").select("id").eq("stripe_session_id", session.id).single();
    if (!b) { console.log(`[STRIPE-WEBHOOK] No booking for session ${session.id}`); return; }
    return await processPayment(supabase, session, b.id);
  }
  await processPayment(supabase, session, bookingId);
}

async function triggerAutomationEvent(event: string, eventId: string, payload: JsonRecord) {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) return;

  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/execute-automations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${serviceRoleKey}`,
      },
      body: JSON.stringify({ event, eventId, payload }),
    });

    if (!response.ok) {
      console.error(`[STRIPE-WEBHOOK] Automation event ${event} failed: ${await response.text()}`);
    }
  } catch (error) {
    console.error(`[STRIPE-WEBHOOK] Automation event ${event} failed:`, error);
  }
}

async function buildOrderAutomationPayload(
  supabase: SupabaseServiceClient,
  order: JsonRecord,
  session: Stripe.Checkout.Session,
  packagePurchaseId: string | null,
) {
  const payload: JsonRecord = {
    order_id: order.id,
    package_purchase_id: packagePurchaseId,
    user_id: order.user_id || null,
    user_type: order.user_type || null,
    guest_id: order.guest_id || null,
    booking_id: order.booking_id || null,
    property_id: order.property_id || null,
    total_amount: order.total || 0,
    currency: order.currency || "DKK",
    payment_status: "paid",
    stripe_session_id: session.id,
    recipient_email: session.customer_details?.email || null,
    recipient_name: session.customer_details?.name || null,
    link: order.booking_id ? `/admin/sager/${order.property_id}` : "/admin/oekonomi",
  };

  if (typeof order.booking_id === "string" && order.booking_id) {
    const { data: booking } = await supabase
      .from("bookings")
      .select("id, owner_id, property_id, guest_name, guest_email, guest_phone, check_in, check_out, total_amount")
      .eq("id", order.booking_id)
      .maybeSingle();

    if (booking) {
      Object.assign(payload, {
        linked_type: "booking",
        linked_id: booking.id,
        owner_id: booking.owner_id,
        listing_id: booking.property_id,
        property_id: booking.property_id,
        guest_name: booking.guest_name,
        guest_email: booking.guest_email,
        guest_phone: booking.guest_phone,
        check_in: booking.check_in,
        check_out: booking.check_out,
        start_date: booking.check_in,
        end_date: booking.check_out,
        total_amount: booking.total_amount || order.total || 0,
        link: `/admin/sager/${booking.property_id}`,
      });
    }
  }

  return payload;
}

async function ensureOrderFulfillments(
  supabase: SupabaseServiceClient,
  order: JsonRecord,
  packagePurchaseId: string | null,
) {
  const { data: orderItems, error } = await supabase
    .from("order_items")
    .select("*")
    .eq("order_id", order.id);
  if (error) {
    console.error(`[STRIPE-WEBHOOK] Failed to load order items for ${order.id}: ${error.message}`);
    return;
  }

  for (const item of (orderItems || []) as JsonRecord[]) {
    const { data: existingFulfillment } = await supabase
      .from("order_fulfillments")
      .select("id")
      .eq("order_item_id", item.id)
      .maybeSingle();

    if (!existingFulfillment) {
      const { error: fulfillmentError } = await supabase.from("order_fulfillments").insert({
        order_id: order.id,
        order_item_id: item.id,
        booking_id: order.booking_id || null,
        package_purchase_id: packagePurchaseId,
        user_type: order.user_type || "guest",
        item_type: item.item_type || "addon",
        reference_id: item.reference_id || null,
        label: item.label || "Order item",
        status: "pending",
        notes: `Auto-created after payment ${order.id}`,
      });

      if (fulfillmentError) {
        console.error(`[STRIPE-WEBHOOK] Failed to create fulfillment for item ${item.id}: ${fulfillmentError.message}`);
      }
    }

    const taskMarker = `fulfillment:${item.id}`;
    const { data: existingTask } = await supabase
      .from("system_tasks")
      .select("id")
      .eq("notes", taskMarker)
      .maybeSingle();
    if (existingTask) continue;

    const linkedType = order.booking_id ? "booking" : null;
    const linkedId = order.booking_id || null;
    await supabase.from("system_tasks").insert({
      title: `Opfyld ordre: ${item.label || "tilkøb"}`,
      description: `Ordre ${String(order.id).slice(0, 8)} · ${item.item_type || "tilkøb"}`,
      linked_type: linkedType,
      linked_id: linkedId,
      linked_name: item.label || null,
      priority: "normal",
      source: "system",
      category: item.item_type === "service_package" ? "pakke" : "tilkoeb",
      notes: taskMarker,
    });
  }
}

async function processOrderPayment(supabase: SupabaseServiceClient, session: Stripe.Checkout.Session, orderId: string) {
  const { data: order } = await supabase.from("orders").select("*").eq("id", orderId).single();
  if (!order) { console.error(`[STRIPE-WEBHOOK] Order ${orderId} not found`); return; }
  if (session.payment_status !== "paid") { return; }

  await supabase.from("orders").update({
    status: "confirmed",
    payment_status: "paid",
    stripe_session_id: session.id,
    stripe_payment_intent_id: typeof session.payment_intent === "string" ? session.payment_intent : null,
  }).eq("id", orderId);

  const packagePurchaseId = session.metadata?.package_purchase_id;
  if (packagePurchaseId) {
    await supabase.from("package_purchases").update({
      status: "completed",
      payment_status: "paid",
      completed_at: new Date().toISOString(),
    }).eq("id", packagePurchaseId);
  }

  const { data: existingInvoice } = await supabase
    .from("invoices")
    .select("id")
    .eq("order_id", orderId)
    .maybeSingle();

  if (!existingInvoice) {
    await supabase.from("invoices").insert({
      order_id: orderId,
      invoice_number: "",
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

  await ensureOrderFulfillments(supabase, order as JsonRecord, packagePurchaseId || null);
  await triggerAutomationEvent(
    "payment_received",
    `order_paid:${orderId}`,
    await buildOrderAutomationPayload(supabase, order as JsonRecord, session, packagePurchaseId || null),
  );

  console.log(`[STRIPE-WEBHOOK] Order ${orderId} payment processed`);
}

async function markOrderPaymentFailed(
  supabase: SupabaseServiceClient,
  session: Stripe.Checkout.Session,
  orderId: string,
) {
  await supabase.from("orders").update({
    status: "cancelled",
    payment_status: "failed",
    stripe_session_id: session.id,
  }).eq("id", orderId);

  const packagePurchaseId = session.metadata?.package_purchase_id;
  if (packagePurchaseId) {
    await supabase.from("package_purchases").update({
      status: "cancelled",
      payment_status: "failed",
    }).eq("id", packagePurchaseId);
  }
}

async function processPayment(supabase: SupabaseServiceClient, session: Stripe.Checkout.Session, bookingId: string) {
  const { data: booking } = await supabase.from("bookings").select("*").eq("id", bookingId).single();
  if (!booking) { console.error(`[STRIPE-WEBHOOK] Booking ${bookingId} not found`); return; }
  if (session.payment_status !== "paid") { return; }

  const { data: existingPayment } = await supabase
    .from("payments")
    .select("*")
    .eq("stripe_checkout_session_id", session.id)
    .maybeSingle();
  if (existingPayment?.status === "completed" || existingPayment?.status === "refunded") {
    return;
  }

  const amountPaid = session.amount_total || 0;
  if (amountPaid <= 0) { return; }

  const totalAmount = Number(booking.total_amount || 0);
  const previousPaid = Number(booking.amount_paid || 0);
  const nextPaid = Math.min(totalAmount || previousPaid + amountPaid, previousPaid + amountPaid);
  const nextRemaining = Math.max(0, totalAmount - nextPaid);
  const paymentStatus = nextRemaining > 0 ? "partially_paid" : "paid";

  await supabase.from("bookings").update({
    status: "confirmed",
    payment_status: paymentStatus,
    stripe_session_id: session.id,
    amount_paid: nextPaid,
    amount_remaining: nextRemaining,
  }).eq("id", bookingId);

  await supabase.from("availability_holds").update({ released: true }).eq("booking_id", bookingId);

  const paymentIntentId = typeof session.payment_intent === "string"
    ? session.payment_intent : session.payment_intent?.id || null;
  const paymentPayload = {
    booking_id: bookingId, owner_id: booking.owner_id,
    amount: amountPaid, currency: (session.currency || "dkk").toUpperCase(),
    status: "completed", payment_method: "stripe",
    stripe_checkout_session_id: session.id,
    stripe_payment_intent_id: paymentIntentId,
    paid_at: new Date().toISOString(), note: "Stripe webhook payment",
  };

  if (existingPayment?.id) {
    await supabase.from("payments").update(paymentPayload).eq("id", existingPayment.id);
  } else {
    await supabase.from("payments").insert(paymentPayload);
  }

  if (nextRemaining === 0) {
    await ensurePendingOwnerPayout(supabase, { ...booking, amount_paid: nextPaid, amount_remaining: nextRemaining }, bookingId);
    await sendBookingConfirmationEmail(supabase, bookingId);
  }

  const automationPayload = {
    linked_type: "booking",
    linked_id: bookingId,
    booking_id: bookingId,
    listing_id: booking.property_id,
    property_id: booking.property_id,
    owner_id: booking.owner_id,
    guest_name: booking.guest_name,
    guest_email: booking.guest_email,
    guest_phone: booking.guest_phone,
    check_in: booking.check_in,
    check_out: booking.check_out,
    start_date: booking.check_in,
    end_date: booking.check_out,
    total_amount: totalAmount,
    amount_paid: nextPaid,
    amount_remaining: nextRemaining,
    payment_status: paymentStatus,
    stripe_session_id: session.id,
    link: `/admin/sager/${booking.property_id}`,
  };
  await triggerAutomationEvent("payment_received", `booking_payment:${bookingId}:${session.id}`, automationPayload);
  await triggerAutomationEvent("booking_confirmed", `booking_confirmed:${bookingId}`, automationPayload);

  // Create block for confirmed dates
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
      summary: "Booking bekræftet",
    });
  }

  console.log(`[STRIPE-WEBHOOK] Booking ${bookingId} payment processed`);
}

async function sendBookingConfirmationEmail(supabase: SupabaseServiceClient, bookingId: string) {
  const sentAt = new Date().toISOString();
  const { data: booking } = await supabase
    .from("bookings")
    .update({ confirmation_email_sent_at: sentAt })
    .eq("id", bookingId)
    .is("confirmation_email_sent_at", null)
    .select("*")
    .maybeSingle();

  if (!booking?.guest_email) return;

  const [{ data: listing }, { data: lineItems }] = await Promise.all([
    supabase
      .from("listings")
      .select("name, address, check_in_time, check_out_time")
      .eq("id", booking.property_id)
      .maybeSingle(),
    supabase
      .from("booking_line_items")
      .select("label, quantity, unit_price, total, item_type")
      .eq("booking_id", bookingId),
  ]);

  const functionUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/send-booking-email`;
  const response = await fetch(functionUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
    },
    body: JSON.stringify({
      to: booking.guest_email,
      guest_name: booking.guest_name || "Gæst",
      house_name: listing?.name || "SommerVibes booking",
      start_date: booking.check_in,
      end_date: booking.check_out,
      guests: booking.guests_count || 1,
      total_price: booking.total_amount || 0,
      booking_id: booking.id,
      line_items: lineItems || [],
      check_in_time: listing?.check_in_time || null,
      check_out_time: listing?.check_out_time || null,
      address: listing?.address || null,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[STRIPE-WEBHOOK] Booking email failed for ${bookingId}: ${errorText}`);
    await supabase.from("bookings").update({ confirmation_email_sent_at: null }).eq("id", bookingId);
  }
}

async function ensurePendingOwnerPayout(
  supabase: SupabaseServiceClient,
  booking: PayoutBooking,
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
