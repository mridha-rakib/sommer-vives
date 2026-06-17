import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import Stripe from "https://esm.sh/stripe@18.5.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type BookingPaymentRecord = {
  id: string;
  owner_id: string;
  property_id: string;
  check_in: string;
  check_out: string;
  owner_payout?: number | string | null;
  total_amount?: number | string | null;
  amount_paid?: number | string | null;
  amount_remaining?: number | string | null;
  currency?: string | null;
  case_number?: string | null;
  payment_status?: string | null;
  status?: string | null;
};

type JsonRecord = Record<string, unknown>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseServiceClient = SupabaseClient<any, "public", any>;

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
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
      console.error(`[VERIFY-PAYMENT] Automation event ${event} failed: ${await response.text()}`);
    }
  } catch (error) {
    console.error(`[VERIFY-PAYMENT] Automation event ${event} failed:`, error);
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
    console.error(`[VERIFY-PAYMENT] Failed to load order items for ${order.id}: ${error.message}`);
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
        console.error(`[VERIFY-PAYMENT] Failed to create fulfillment for item ${item.id}: ${fulfillmentError.message}`);
      }
    }

    const taskMarker = `fulfillment:${item.id}`;
    const { data: existingTask } = await supabase
      .from("system_tasks")
      .select("id")
      .eq("notes", taskMarker)
      .maybeSingle();
    if (existingTask) continue;

    await supabase.from("system_tasks").insert({
      title: `Opfyld ordre: ${item.label || "tilkøb"}`,
      description: `Ordre ${String(order.id).slice(0, 8)} · ${item.item_type || "tilkøb"}`,
      linked_type: order.booking_id ? "booking" : null,
      linked_id: order.booking_id || null,
      linked_name: item.label || null,
      priority: "normal",
      source: "system",
      category: item.item_type === "service_package" ? "pakke" : "tilkoeb",
      notes: taskMarker,
    });
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "POST required" }, 405);

  try {
    const { orderId, sessionId, bookingId, paymentIntentId } = await req.json();
    if (!orderId && !sessionId && !bookingId && !paymentIntentId) {
      return json({ error: "Missing orderId, bookingId, sessionId, or paymentIntentId" }, 400);
    }

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) return json({ error: "Stripe not configured" }, 500);

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    if (bookingId && paymentIntentId) {
      return await verifyBookingPaymentIntent(supabase, stripe, bookingId, paymentIntentId);
    }

    if (bookingId) {
      return await verifyBookingPayment(supabase, stripe, bookingId, sessionId);
    }

    return await verifyOrderPayment(supabase, stripe, orderId, sessionId);
  } catch (err) {
    console.error("Verify payment error:", err);
    const message = err instanceof Error ? err.message : String(err);
    return json({ error: message }, 500);
  }
});

async function verifyOrderPayment(
  supabase: SupabaseServiceClient,
  stripe: Stripe,
  orderId?: string,
  sessionId?: string,
) {
  let order;
  if (orderId) {
    const { data } = await supabase.from("orders").select("*").eq("id", orderId).single();
    order = data;
  } else {
    const { data } = await supabase.from("orders").select("*").eq("stripe_session_id", sessionId).single();
    order = data;
  }

  if (!order || !order.stripe_session_id) {
    return json({ error: "Order not found", status: "unknown" }, 404);
  }

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

  await supabase
    .from("orders")
    .update({
      payment_status: paymentStatus,
      status: orderStatus,
      stripe_payment_intent_id: typeof session.payment_intent === "string" ? session.payment_intent : null,
    })
    .eq("id", order.id);

  const packagePurchaseId = session.metadata?.package_purchase_id;
  if (packagePurchaseId && paymentStatus === "paid") {
    await supabase.from("package_purchases").update({
      status: "completed",
      payment_status: "paid",
      completed_at: new Date().toISOString(),
    }).eq("id", packagePurchaseId);
  } else if (packagePurchaseId && paymentStatus === "failed") {
    await supabase.from("package_purchases").update({
      status: "cancelled",
      payment_status: "failed",
    }).eq("id", packagePurchaseId);
  }

  if (paymentStatus === "paid") {
    const { data: existingInvoice } = await supabase
      .from("invoices")
      .select("id")
      .eq("order_id", order.id)
      .maybeSingle();

    if (!existingInvoice) {
      await supabase.from("invoices").insert({
        order_id: order.id,
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
      `order_paid:${order.id}`,
      await buildOrderAutomationPayload(supabase, order as JsonRecord, session, packagePurchaseId || null),
    );
  }

  return json({ status: paymentStatus, orderStatus, orderId: order.id });
}

async function verifyBookingPayment(
  supabase: SupabaseServiceClient,
  stripe: Stripe,
  bookingId: string,
  sessionId?: string,
) {
  const { data: booking } = await supabase
    .from("bookings")
    .select("*")
    .eq("id", bookingId)
    .single();

  if (!booking) return json({ error: "Booking not found", status: "unknown" }, 404);

  const checkoutSessionId = sessionId || booking.stripe_session_id;
  if (!checkoutSessionId) return json({ error: "Missing Stripe session", status: "unknown" }, 400);

  const session = await stripe.checkout.sessions.retrieve(checkoutSessionId);
  if (session.metadata?.booking_id && session.metadata.booking_id !== booking.id) {
    return json({ error: "Session does not belong to this booking" }, 403);
  }

  if (session.status === "expired") {
    await supabase
      .from("bookings")
      .update({ status: "cancelled", payment_status: "expired" })
      .eq("id", booking.id);
    await supabase.from("availability_holds").update({ released: true }).eq("booking_id", booking.id);
    return json({ status: "expired", bookingStatus: "cancelled", bookingId: booking.id });
  }

  if (session.payment_status !== "paid") {
    return json({ status: booking.payment_status || "pending", bookingStatus: booking.status, bookingId: booking.id });
  }

  const { data: existingPayment } = await supabase
    .from("payments")
    .select("*")
    .eq("stripe_checkout_session_id", session.id)
    .maybeSingle();

  if (existingPayment?.status === "completed" || existingPayment?.status === "refunded") {
    return json({ status: booking.payment_status || "paid", bookingStatus: booking.status, bookingId: booking.id });
  }

  const amountPaid = session.amount_total || 0;
  if (amountPaid <= 0) return json({ status: booking.payment_status || "pending", bookingStatus: booking.status, bookingId: booking.id });

  const totalAmount = Number(booking.total_amount || 0);
  const previousPaid = Number(booking.amount_paid || 0);
  const nextPaid = Math.min(totalAmount || previousPaid + amountPaid, previousPaid + amountPaid);
  const nextRemaining = Math.max(0, totalAmount - nextPaid);
  const paymentStatus = nextRemaining > 0 ? "partially_paid" : "paid";
  const paymentIntentId = typeof session.payment_intent === "string"
    ? session.payment_intent
    : session.payment_intent?.id || null;

  await supabase.from("bookings").update({
    status: "confirmed",
    payment_status: paymentStatus,
    stripe_session_id: session.id,
    amount_paid: nextPaid,
    amount_remaining: nextRemaining,
  }).eq("id", booking.id);

  await supabase.from("availability_holds").update({ released: true }).eq("booking_id", booking.id);

  const paymentPayload = {
    booking_id: booking.id,
    owner_id: booking.owner_id,
    amount: amountPaid,
    currency: (session.currency || "dkk").toUpperCase(),
    status: "completed",
    payment_method: "stripe",
    stripe_checkout_session_id: session.id,
    stripe_payment_intent_id: paymentIntentId,
    paid_at: new Date().toISOString(),
    note: "Stripe payment verification",
  };

  if (existingPayment?.id) {
    await supabase.from("payments").update(paymentPayload).eq("id", existingPayment.id);
  } else {
    await supabase.from("payments").insert(paymentPayload);
  }

  await ensureListingBlock(supabase, booking);
  if (nextRemaining === 0) {
    await ensurePendingOwnerPayout(supabase, { ...booking, amount_paid: nextPaid, amount_remaining: nextRemaining }, booking.id);
    await sendBookingConfirmationEmail(supabase, booking.id);
  }

  const automationPayload = {
    linked_type: "booking",
    linked_id: booking.id,
    booking_id: booking.id,
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
  await triggerAutomationEvent("payment_received", `booking_payment:${booking.id}:${session.id}`, automationPayload);
  await triggerAutomationEvent("booking_confirmed", `booking_confirmed:${booking.id}`, automationPayload);

  return json({ status: paymentStatus, bookingStatus: "confirmed", bookingId: booking.id });
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

  const response = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/send-booking-email`, {
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
    console.error(`[VERIFY-PAYMENT] Booking email failed for ${bookingId}: ${errorText}`);
    await supabase.from("bookings").update({ confirmation_email_sent_at: null }).eq("id", bookingId);
  }
}

async function ensureListingBlock(supabase: SupabaseServiceClient, booking: BookingPaymentRecord) {
  const { data: existingBlock } = await supabase
    .from("listing_blocks")
    .select("id")
    .eq("external_uid", `booking-${booking.id}`)
    .maybeSingle();

  if (existingBlock) return;

  await supabase.from("listing_blocks").insert({
    listing_id: booking.property_id,
    owner_id: booking.owner_id,
    start_date: booking.check_in,
    end_date: booking.check_out,
    source: "direct_booking",
    external_uid: `booking-${booking.id}`,
    summary: "Booking bekræftet",
  });
}

async function ensurePendingOwnerPayout(
  supabase: SupabaseServiceClient,
  booking: BookingPaymentRecord,
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

async function verifyBookingPaymentIntent(
  supabase: SupabaseServiceClient,
  stripe: Stripe,
  bookingId: string,
  paymentIntentId: string,
) {
  const { data: booking } = await supabase.from("bookings").select("*").eq("id", bookingId).single();
  if (!booking) return json({ error: "Booking not found", status: "unknown" }, 404);

  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
  if (paymentIntent.metadata?.booking_id && paymentIntent.metadata.booking_id !== bookingId) {
    return json({ error: "PaymentIntent does not belong to this booking" }, 403);
  }

  if (paymentIntent.status !== "succeeded") {
    return json({ status: paymentIntent.status, bookingStatus: booking.status, bookingId });
  }

  const { data: existingPayment } = await supabase
    .from("payments").select("*").eq("stripe_payment_intent_id", paymentIntentId).maybeSingle();

  if (existingPayment?.status === "completed") {
    return json({ status: "paid", bookingStatus: booking.status, bookingId });
  }

  const amountPaid = paymentIntent.amount_received || paymentIntent.amount;
  const totalAmount = Number(booking.total_amount || 0);
  const previousPaid = Number(booking.amount_paid || 0);
  const nextPaid = Math.min(totalAmount || previousPaid + amountPaid, previousPaid + amountPaid);
  const nextRemaining = Math.max(0, totalAmount - nextPaid);
  const paymentStatus = nextRemaining > 0 ? "partially_paid" : "paid";

  await supabase.from("bookings").update({
    status: "confirmed",
    payment_status: paymentStatus,
    stripe_session_id: paymentIntentId,
    amount_paid: nextPaid,
    amount_remaining: nextRemaining,
  }).eq("id", bookingId);

  await supabase.from("availability_holds").update({ released: true }).eq("booking_id", bookingId);

  const paymentPayload = {
    booking_id: bookingId,
    owner_id: booking.owner_id,
    amount: amountPaid,
    currency: (paymentIntent.currency || "dkk").toUpperCase(),
    status: "completed",
    payment_method: "stripe",
    stripe_payment_intent_id: paymentIntentId,
    paid_at: new Date().toISOString(),
    note: "Stripe PaymentIntent verification",
  };

  if (existingPayment?.id) {
    await supabase.from("payments").update(paymentPayload).eq("id", existingPayment.id);
  } else {
    await supabase.from("payments").insert(paymentPayload);
  }

  await ensureListingBlock(supabase, booking as BookingPaymentRecord);

  if (nextRemaining === 0) {
    await ensurePendingOwnerPayout(supabase, { ...booking, amount_paid: nextPaid, amount_remaining: nextRemaining } as BookingPaymentRecord, bookingId);
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
    check_in: booking.check_in,
    check_out: booking.check_out,
    start_date: booking.check_in,
    end_date: booking.check_out,
    total_amount: totalAmount,
    amount_paid: nextPaid,
    payment_status: paymentStatus,
    stripe_payment_intent_id: paymentIntentId,
    link: `/admin/sager/${booking.property_id}`,
  };

  await triggerAutomationEvent("payment_received", `booking_payment:${bookingId}:${paymentIntentId}`, automationPayload);
  await triggerAutomationEvent("booking_confirmed", `booking_confirmed:${bookingId}`, automationPayload);

  return json({ status: paymentStatus, bookingStatus: "confirmed", bookingId });
}
