import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@18.5.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const WEEKEND_MULTIPLIER = 1.25;
const HOLD_MINUTES = 30;
const SOURCE_CHANNELS = new Set(["direct", "airbnb", "booking_com", "vrbo", "other"]);

interface SeasonRule {
  id: string; listing_id: string; name: string;
  start_month: number; start_day: number; end_month: number; end_day: number;
  price_per_night: number; price_type: string; price_percentage: number | null;
  min_nights: number | null; priority: number | null; status: string;
  check_in_days: number[] | null; check_out_days: number[] | null;
}

interface DailyOverride {
  listing_id: string; date: string; price: number;
  price_type: string; price_percentage: number | null;
}

interface DiscountRule {
  id: string; name: string; description: string | null; code: string | null;
  discount_type: string; discount_value: number; min_nights: number; max_nights: number | null;
  is_active: boolean; combinable_with_codes: boolean; sort_order: number;
  starts_at: string | null; ends_at: string | null;
  min_days_before_checkin: number | null; max_days_before_checkin: number | null;
}

interface AddOn {
  id: string;
  name: string;
  price: number;
  price_type: string;
}

interface FeeRule {
  name: string;
  fee_type: string;
  amount: number;
  is_mandatory: boolean;
  applies_to_channels: string[] | null;
  condition_min_nights: number | null;
  condition_max_nights: number | null;
}

interface BookingLineItem {
  booking_id: string;
  item_type: "night" | "fee" | "addon" | "discount";
  label: string;
  quantity: number;
  unit_price: number;
  total: number;
}

interface StripeCheckoutLineItem {
  price_data: {
    currency: string;
    product_data: {
      name: string;
      description?: string;
    };
    unit_amount: number;
  };
  quantity: number;
}

type JsonRecord = Record<string, unknown>;

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
      console.error(`[CREATE-BOOKING] Automation event ${event} failed: ${await response.text()}`);
    }
  } catch (error) {
    console.error(`[CREATE-BOOKING] Automation event ${event} failed:`, error);
  }
}

function normalizeCode(code: unknown): string {
  return String(code || "").trim().toLowerCase();
}

function normalizeSourceChannel(channel: unknown): string {
  const value = String(channel || "direct").trim().toLowerCase();
  return SOURCE_CHANNELS.has(value) ? value : "direct";
}

function appliesToChannel(channels: string[] | null | undefined, sourceChannel: string): boolean {
  if (!channels || channels.length === 0) return true;
  return channels.includes(sourceChannel);
}

function getDaysBeforeCheckin(checkIn: Date, now: Date): number {
  const checkInDay = Date.UTC(checkIn.getUTCFullYear(), checkIn.getUTCMonth(), checkIn.getUTCDate());
  const nowDay = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return Math.round((checkInDay - nowDay) / (24 * 60 * 60 * 1000));
}

function isDiscountEligible(rule: DiscountRule, nights: number, now: Date, daysBeforeCheckin: number): boolean {
  if (!rule.is_active) return false;
  if (nights < rule.min_nights) return false;
  if (rule.max_nights !== null && nights > rule.max_nights) return false;
  if (rule.starts_at && new Date(rule.starts_at) > now) return false;
  if (rule.ends_at && new Date(rule.ends_at) < now) return false;
  if (rule.min_days_before_checkin !== null && daysBeforeCheckin < rule.min_days_before_checkin) return false;
  if (rule.max_days_before_checkin !== null && daysBeforeCheckin > rule.max_days_before_checkin) return false;
  return true;
}

function calculateDiscount(rule: DiscountRule, subtotal: number): number {
  if (subtotal <= 0) return 0;
  const raw = rule.discount_type === "fixed"
    ? Math.round(rule.discount_value)
    : Math.round(subtotal * (rule.discount_value / 100));
  return Math.max(0, Math.min(raw, subtotal));
}

function calculateFeeAmount(
  fee: FeeRule,
  nights: number,
  guestCount: number,
  petCount: number,
  percentageBase: number
): number {
  switch (fee.fee_type) {
    case "per_night": return fee.amount * nights;
    case "per_guest": return fee.amount * guestCount;
    case "per_pet": return fee.amount * petCount;
    case "percentage": return Math.round(percentageBase * ((fee.amount / 100) / 100));
    default: return fee.amount;
  }
}

function isDateInSeason(date: Date, rule: SeasonRule): boolean {
  const m = date.getMonth() + 1, d = date.getDate();
  const v = m * 100 + d, s = rule.start_month * 100 + rule.start_day, e = rule.end_month * 100 + rule.end_day;
  return s <= e ? (v >= s && v <= e) : (v >= s || v <= e);
}

function calcNightPrice(date: Date, base: number, seasons: SeasonRule[], overrides: DailyOverride[], listingId: string): number {
  const dateStr = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
  const isWknd = date.getDay() === 5 || date.getDay() === 6;
  const override = overrides.find(o => o.listing_id === listingId && o.date === dateStr);
  const season = seasons.filter(r => r.listing_id === listingId && r.status === 'active' && isDateInSeason(date, r))
    .sort((a,b) => (b.priority||0)-(a.priority||0))[0] || null;
  let seasonPrice = base;
  if (season) {
    seasonPrice = season.price_type === 'percentage' && season.price_percentage !== null
      ? Math.round(base * (1 + season.price_percentage / 100)) : season.price_per_night;
  }
  let price: number;
  if (override) {
    price = override.price_type === 'percentage' && override.price_percentage !== null
      ? Math.round(seasonPrice * (1 + override.price_percentage / 100)) : override.price;
  } else { price = seasonPrice; }
  return Math.round(price * (isWknd ? WEEKEND_MULTIPLIER : 1));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "POST required" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  const body = await req.json();
  const { listing_id, start_date, end_date, guest_name, guest_email, guest_phone, guest_message, guests, pets, selected_addon_ids, discount_code, source, source_channel, channel, payment_option, deposit_amount, use_payment_intent } = body;
  const bookingSource = source || "direct";
  const bookingChannel = normalizeSourceChannel(source_channel || channel || bookingSource);
  const requestedDiscountCode = normalizeCode(discount_code);

  if (!listing_id || !start_date || !end_date || !guest_name || !guest_email) {
    return new Response(JSON.stringify({ error: "Missing required fields" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  // Look up listing
  const { data: listing } = await supabase
    .from("listings").select("*").eq("id", listing_id).eq("is_active", true).single();

  if (!listing) {
    return new Response(JSON.stringify({ error: "Listing not found" }),
      { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  // Check conflicts: bookings + listing_blocks
  const [bookingConflict, blockConflict] = await Promise.all([
    supabase.from("bookings").select("id")
      .eq("property_id", listing_id).in("status", ["confirmed", "pending"])
      .lt("check_in", end_date).gt("check_out", start_date).limit(1),
    supabase.from("listing_blocks").select("id")
      .eq("listing_id", listing_id)
      .lt("start_date", end_date).gt("end_date", start_date).limit(1),
  ]);

  if ((bookingConflict.data?.length || 0) > 0 || (blockConflict.data?.length || 0) > 0) {
    return new Response(JSON.stringify({ error: "Datoerne er desværre ikke tilgængelige. Prøv andre datoer." }),
      { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  // Check active holds from other sessions
  const { data: holdConflicts } = await supabase
    .from("availability_holds").select("id")
    .eq("listing_id", listing_id).eq("released", false)
    .gt("expires_at", new Date().toISOString())
    .lt("start_date", end_date).gt("end_date", start_date).limit(1);

  if ((holdConflicts?.length || 0) > 0) {
    return new Response(JSON.stringify({ error: "En anden gæst er i gang med at booke disse datoer. Prøv igen om et par minutter." }),
      { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  // Server-side price calculation
  const [seasonRes, overrideRes, addOnRes, feeRes, discountRes] = await Promise.all([
    supabase.from("season_rules").select("*").eq("listing_id", listing.id).eq("status", "active"),
    supabase.from("daily_price_overrides").select("*").eq("listing_id", listing.id).gte("date", start_date).lte("date", end_date),
    supabase.from("add_ons").select("*").eq("listing_id", listing.id).eq("is_active", true),
    supabase.from("fee_rules").select("*").eq("listing_id", listing.id).eq("is_active", true),
    supabase.from("discount_rules").select("*")
      .eq("is_active", true)
      .or(`listing_id.eq.${listing.id},and(listing_id.is.null,owner_id.eq.${listing.owner_id})`)
      .order("sort_order"),
  ]);

  const seasonRules = (seasonRes.data || []) as SeasonRule[];
  const dailyOverrides = (overrideRes.data || []) as DailyOverride[];
  const addOns = (addOnRes.data || []) as AddOn[];
  const feeRules = (feeRes.data || []) as FeeRule[];
  const discountRules = (discountRes.data || []) as DiscountRule[];

  const cursor = new Date(start_date + "T12:00:00Z");
  const endDt = new Date(end_date + "T12:00:00Z");
  let nightTotal = 0;
  const nightLineItems: { date: string; price: number }[] = [];
  while (cursor < endDt) {
    const price = calcNightPrice(cursor, listing.base_price_per_night, seasonRules, dailyOverrides, listing.id);
    const ds = `${cursor.getFullYear()}-${String(cursor.getMonth()+1).padStart(2,'0')}-${String(cursor.getDate()).padStart(2,'0')}`;
    nightLineItems.push({ date: ds, price });
    nightTotal += price;
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  const nights = nightLineItems.length;
  const guestCount = Math.max(1, Number(guests || 1));
  const petCount = Math.max(0, Number(pets || 0));

  // Add-ons
  const selIds: string[] = selected_addon_ids || [];
  const addonItems: { addon_id: string; name: string; unit_price: number; quantity: number; total: number }[] = [];
  let addonTotal = 0;
  for (const ao of addOns) {
    if (!selIds.includes(ao.id)) continue;
    let qty = 1, total: number;
    switch (ao.price_type) {
      case "per_guest": qty = guestCount; total = ao.price * qty; break;
      case "per_night": qty = nights; total = ao.price * qty; break;
      default: total = ao.price;
    }
    addonItems.push({ addon_id: ao.id, name: ao.name, unit_price: ao.price, quantity: qty, total });
    addonTotal += total;
  }

  // Fees
  const feePercentageBase = nightTotal + addonTotal;
  const feeItems: { name: string; amount: number; fee_type: string }[] = [];
  let feeTotal = 0;
  for (const fee of feeRules) {
    if (!fee.is_mandatory) continue;
    if (!appliesToChannel(fee.applies_to_channels, bookingChannel)) continue;
    if (fee.condition_min_nights !== null && nights < fee.condition_min_nights) continue;
    if (fee.condition_max_nights !== null && nights > fee.condition_max_nights) continue;
    const amount = calculateFeeAmount(fee, nights, guestCount, petCount, feePercentageBase);
    if (amount > 0) { feeItems.push({ name: fee.name, amount, fee_type: fee.fee_type }); feeTotal += amount; }
  }

  const subtotal = nightTotal + feeTotal + addonTotal;
  const now = new Date();
  const checkInDate = new Date(start_date + "T12:00:00Z");
  const daysBeforeCheckin = getDaysBeforeCheckin(checkInDate, now);
  const eligibleRules = discountRules.filter(rule => isDiscountEligible(rule, nights, now, daysBeforeCheckin));
  const automaticCandidates = eligibleRules.filter(rule => !rule.code && (!requestedDiscountCode || rule.combinable_with_codes));
  const automaticDiscount = automaticCandidates
    .map(rule => ({ rule, amount: calculateDiscount(rule, subtotal) }))
    .sort((a, b) => b.amount - a.amount)[0] || null;

  let codeDiscount: { rule: DiscountRule; amount: number } | null = null;
  if (requestedDiscountCode) {
    const matchingRule = discountRules.find(rule => normalizeCode(rule.code) === requestedDiscountCode) || null;
    if (!matchingRule) {
      return new Response(JSON.stringify({ error: "Rabatkoden findes ikke." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (!isDiscountEligible(matchingRule, nights, now, daysBeforeCheckin)) {
      return new Response(JSON.stringify({ error: "Rabatkoden gælder ikke for dette ophold." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    codeDiscount = { rule: matchingRule, amount: calculateDiscount(matchingRule, subtotal) };
  }

  const discounts = [automaticDiscount, codeDiscount].filter(Boolean) as { rule: DiscountRule; amount: number }[];
  const discountTotal = discounts.reduce((sum, item) => sum + item.amount, 0);
  const totalPrice = Math.max(0, subtotal - discountTotal);
  const ownerPayout = Math.round(totalPrice * 0.85);
  const platformEarnings = Math.max(0, totalPrice - ownerPayout);
  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");

  if (bookingSource !== "manual" && totalPrice > 0 && !stripeKey) {
    return new Response(JSON.stringify({ error: "Stripe not configured" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  // Upsert guest
  let guestId: string | null = null;
  const trimEmail = (guest_email || "").trim().toLowerCase();
  if (trimEmail) {
    const { data: existingGuest } = await supabase
      .from("guests").select("id").eq("email", trimEmail).maybeSingle();
    if (existingGuest) {
      guestId = existingGuest.id;
      await supabase.from("guests").update({ name: guest_name, phone: guest_phone || null }).eq("id", existingGuest.id);
    } else {
      const { data: newGuest } = await supabase.from("guests").insert({
        name: guest_name, email: trimEmail, phone: guest_phone || null,
      }).select("id").single();
      if (newGuest) guestId = newGuest.id;
    }
  }

  // Create booking
  const { data: booking, error } = await supabase
    .from("bookings")
    .insert({
      property_id: listing_id,
      owner_id: listing.owner_id,
      check_in: start_date,
      check_out: end_date,
      guest_name, guest_email, guest_phone: guest_phone || null,
      notes: guest_message || null,
      guests_count: guestCount,
      base_price: nightTotal,
      cleaning_fee: 0,
      service_fee: feeTotal,
      total_amount: totalPrice,
      platform_fee_percent: 15,
      platform_earnings: platformEarnings,
      owner_payout: ownerPayout,
      source_channel: bookingChannel,
      status: bookingSource === "manual" ? "confirmed" : "pending",
      payment_status: bookingSource === "manual" ? "manual" : "pending",
      amount_paid: bookingSource === "manual" ? totalPrice : 0,
      amount_remaining: bookingSource === "manual" ? 0 : totalPrice,
      guest_id: guestId,
    })
    .select()
    .single();

  if (error) {
    return new Response(JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  // Save line items
  const lineItems: BookingLineItem[] = [];
  lineItems.push({ booking_id: booking.id, item_type: "night", label: `Ophold (${nights} nætter)`, quantity: nights, unit_price: Math.round(nightTotal / nights), total: nightTotal });
  for (const fi of feeItems) lineItems.push({ booking_id: booking.id, item_type: "fee", label: fi.name, quantity: 1, unit_price: fi.amount, total: fi.amount });
  for (const ai of addonItems) lineItems.push({ booking_id: booking.id, item_type: "addon", label: ai.name, quantity: ai.quantity, unit_price: ai.unit_price, total: ai.total });
  for (const d of discounts) lineItems.push({ booking_id: booking.id, item_type: "discount", label: d.rule.name, quantity: 1, unit_price: -d.amount, total: -d.amount });
  if (lineItems.length > 0) await supabase.from("booking_line_items").insert(lineItems);

  const automationPayload = {
    linked_type: "booking",
    linked_id: booking.id,
    booking_id: booking.id,
    listing_id: listing.id,
    property_id: listing.id,
    owner_id: listing.owner_id,
    guest_name,
    guest_email,
    guest_phone: guest_phone || null,
    house_name: listing.name,
    check_in: start_date,
    check_out: end_date,
    start_date,
    end_date,
    guests: guestCount,
    nights,
    total_amount: totalPrice,
    source_channel: bookingChannel,
    link: `/admin/sager/${listing.id}`,
  };

  // Manual or fully discounted bookings: done without Stripe.
  if (bookingSource === "manual" || totalPrice <= 0) {
    const finalStatus = bookingSource === "manual" ? "confirmed" : "confirmed";
    const finalPaymentStatus = bookingSource === "manual" ? "manual" : "comped";
    const { data: finalBooking } = await supabase.from("bookings").update({
      status: finalStatus,
      payment_status: finalPaymentStatus,
      amount_paid: totalPrice,
      amount_remaining: 0,
    }).eq("id", booking.id).select().single();

    const { data: existingBlock } = await supabase
      .from("listing_blocks")
      .select("id")
      .eq("external_uid", `booking-${booking.id}`)
      .maybeSingle();
    if (!existingBlock) {
      await supabase.from("listing_blocks").insert({
        listing_id: listing.id,
        owner_id: listing.owner_id,
        start_date,
        end_date,
        source: bookingSource === "manual" ? "manual_booking" : "direct_booking",
        external_uid: `booking-${booking.id}`,
        summary: "Booking bekræftet",
      });
    }

    await triggerAutomationEvent("booking_created", `booking_created:${booking.id}`, automationPayload);
    await triggerAutomationEvent("booking_confirmed", `booking_confirmed:${booking.id}`, {
      ...automationPayload,
      status: finalStatus,
      payment_status: finalPaymentStatus,
    });

    return new Response(JSON.stringify({ success: true, booking: finalBooking || booking, total_price: totalPrice, payment_required: false }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  // Create availability hold
  const holdToken = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + HOLD_MINUTES * 60 * 1000).toISOString();
  await supabase.from("availability_holds").insert({
    listing_id: listing.id, start_date, end_date,
    hold_token: holdToken, expires_at: expiresAt,
    booking_id: booking.id, released: false, session_id: holdToken,
  });

  // Create Stripe payment (PaymentIntent or Checkout Session)
  try {
    const stripe = new Stripe(stripeKey!, { apiVersion: "2025-08-27.basil" });
    const origin = req.headers.get("origin") || Deno.env.get("SITE_URL") || Deno.env.get("VITE_SITE_URL") || "https://sommervibes.dk";
    // Always compute deposit server-side; never trust the client-supplied deposit_amount.
    const serverDepositAmount = Math.round(totalPrice * 0.3);
    const checkoutAmount = payment_option === "deposit"
      ? Math.min(totalPrice, Math.max(1, serverDepositAmount))
      : totalPrice;

    const paymentMeta = {
      booking_id: booking.id,
      listing_id,
      source: "direct_booking",
      hold_token: holdToken,
      discount_code: requestedDiscountCode || "",
      payment_kind: checkoutAmount < totalPrice ? "deposit" : "full",
      outstanding_after_checkout: String(Math.max(0, totalPrice - checkoutAmount)),
    };

    // ── PaymentIntent mode (embedded Stripe Elements) ──
    if (use_payment_intent) {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: checkoutAmount,
        currency: "dkk",
        receipt_email: guest_email,
        metadata: paymentMeta,
        automatic_payment_methods: { enabled: true },
      }, {
        // Idempotency key prevents duplicate charges if the edge function is retried.
        idempotencyKey: `booking:pi:${booking.id}:${checkoutAmount}`,
      });

      await supabase.from("bookings").update({ stripe_payment_intent_id: paymentIntent.id }).eq("id", booking.id);
      await triggerAutomationEvent("booking_created", `booking_created:${booking.id}`, {
        ...automationPayload,
        stripe_payment_intent_id: paymentIntent.id,
        checkout_amount: checkoutAmount,
        payment_status: "pending",
      });

      return new Response(JSON.stringify({
        success: true,
        booking,
        client_secret: paymentIntent.client_secret,
        payment_required: true,
        total_price: totalPrice,
        checkout_amount: checkoutAmount,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ── Hosted Checkout Session mode (fallback) ──
    const stripeLineItems: StripeCheckoutLineItem[] = [];
    if (checkoutAmount < totalPrice) {
      stripeLineItems.push({
        price_data: { currency: "dkk", product_data: { name: `${listing.name} — depositum`, description: `${start_date} → ${end_date} · restbeløb betales senere` }, unit_amount: checkoutAmount },
        quantity: 1,
      });
    } else if (discountTotal > 0) {
      stripeLineItems.push({
        price_data: { currency: "dkk", product_data: { name: `${listing.name} — samlet booking`, description: `${start_date} → ${end_date} · ${guestCount} gæster · inkl. rabat` }, unit_amount: totalPrice },
        quantity: 1,
      });
    } else {
      stripeLineItems.push({
        price_data: { currency: "dkk", product_data: { name: `${listing.name} — ${nights} nætter`, description: `${start_date} → ${end_date} · ${guestCount} gæster` }, unit_amount: nightTotal },
        quantity: 1,
      });
      for (const fi of feeItems) stripeLineItems.push({ price_data: { currency: "dkk", product_data: { name: fi.name }, unit_amount: fi.amount }, quantity: 1 });
      for (const ai of addonItems) stripeLineItems.push({ price_data: { currency: "dkk", product_data: { name: ai.name }, unit_amount: ai.unit_price }, quantity: ai.quantity });
    }

    const session = await stripe.checkout.sessions.create({
      customer_email: guest_email,
      line_items: stripeLineItems,
      mode: "payment",
      client_reference_id: booking.id,
      expires_at: Math.floor(Date.now() / 1000) + HOLD_MINUTES * 60,
      success_url: `${origin}/booking-success?session_id={CHECKOUT_SESSION_ID}&booking_id=${booking.id}`,
      cancel_url: `${origin}/booking-cancelled?booking_id=${booking.id}`,
      metadata: paymentMeta,
    }, {
      idempotencyKey: `booking:cs:${booking.id}:${checkoutAmount}`,
    });

    if (!session.url) throw new Error("Stripe did not return a checkout URL");

    await supabase.from("bookings").update({ stripe_session_id: session.id }).eq("id", booking.id);
    await triggerAutomationEvent("booking_created", `booking_created:${booking.id}`, {
      ...automationPayload,
      stripe_session_id: session.id,
      checkout_amount: checkoutAmount,
      payment_status: "pending",
    });

    return new Response(JSON.stringify({ success: true, booking, checkout_url: session.url, total_price: totalPrice, checkout_amount: checkoutAmount }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (stripeError) {
    await supabase.from("availability_holds").update({ released: true }).eq("hold_token", holdToken);
    await supabase.from("bookings").update({ status: "cancelled" }).eq("id", booking.id);
    const msg = stripeError instanceof Error ? stripeError.message : String(stripeError);
    return new Response(JSON.stringify({ error: msg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
