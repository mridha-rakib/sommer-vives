import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const WEEKEND_MULTIPLIER = 1.25;
const DA_DAYS = ["Søndag", "Mandag", "Tirsdag", "Onsdag", "Torsdag", "Fredag", "Lørdag"];

interface SeasonRule {
  id: string; listing_id: string; name: string;
  start_month: number; start_day: number; end_month: number; end_day: number;
  price_per_night: number; price_type: string; price_percentage: number | null;
  min_nights: number | null; priority: number | null; status: string;
  check_in_days: number[] | null; check_out_days: number[] | null;
}

interface DailyOverride {
  listing_id: string; date: string; price: number;
  price_type: string; price_percentage: number | null; note: string | null;
}

interface AddOn {
  id: string; name: string; description: string | null;
  price: number; price_type: string; is_active: boolean; sort_order: number;
}

interface FeeRule {
  id: string; name: string; description: string | null;
  amount: number; fee_type: string; is_mandatory: boolean; is_active: boolean;
  condition_min_nights: number | null; condition_max_nights: number | null;
}

interface DiscountRule {
  id: string; name: string; description: string | null; code: string | null;
  discount_type: string; discount_value: number; min_nights: number; max_nights: number | null;
  is_active: boolean; combinable_with_codes: boolean; sort_order: number;
  starts_at: string | null; ends_at: string | null;
}

interface ValidationError { code: string; message: string; field?: string; }

interface NightLine {
  date: string; day_name: string; price: number;
  source: "base" | "season" | "override"; season_name?: string;
  is_weekend: boolean; base_price: number; multiplier: number;
}

interface AppliedRule {
  type: "season" | "override" | "weekend_surcharge" | "min_nights" | "check_in_days" | "check_out_days" | "discount";
  name: string; detail: string;
}

function fmtDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function isDateInSeason(date: Date, rule: SeasonRule): boolean {
  const month = date.getMonth() + 1, day = date.getDate();
  const dateVal = month * 100 + day;
  const startVal = rule.start_month * 100 + rule.start_day;
  const endVal = rule.end_month * 100 + rule.end_day;
  if (startVal <= endVal) return dateVal >= startVal && dateVal <= endVal;
  return dateVal >= startVal || dateVal <= endVal;
}

function applyPercentage(base: number, pct: number): number {
  return Math.round(base * (1 + pct / 100));
}

function normalizeCode(code: unknown): string {
  return String(code || "").trim().toLowerCase();
}

function isDiscountEligible(rule: DiscountRule, nights: number, now: Date): boolean {
  if (!rule.is_active) return false;
  if (nights < rule.min_nights) return false;
  if (rule.max_nights !== null && nights > rule.max_nights) return false;
  if (rule.starts_at && new Date(rule.starts_at) > now) return false;
  if (rule.ends_at && new Date(rule.ends_at) < now) return false;
  return true;
}

function calculateDiscount(rule: DiscountRule, subtotal: number): number {
  if (subtotal <= 0) return 0;
  const raw = rule.discount_type === "fixed"
    ? Math.round(rule.discount_value)
    : Math.round(subtotal * (rule.discount_value / 100));
  return Math.max(0, Math.min(raw, subtotal));
}

function calcNightPrice(
  date: Date, basePricePerNight: number, seasonRules: SeasonRule[],
  dailyOverrides: DailyOverride[], listingId: string
): NightLine {
  const dateStr = fmtDate(date);
  const dayOfWeek = date.getDay();
  const isWeekend = dayOfWeek === 5 || dayOfWeek === 6;

  const override = dailyOverrides.find(o => o.listing_id === listingId && o.date === dateStr);
  const matchingSeasons = seasonRules
    .filter(r => r.listing_id === listingId && r.status === "active" && isDateInSeason(date, r))
    .sort((a, b) => (b.priority || 0) - (a.priority || 0));
  const activeSeason = matchingSeasons[0] || null;

  let seasonPrice: number;
  if (activeSeason) {
    seasonPrice = activeSeason.price_type === "percentage" && activeSeason.price_percentage !== null
      ? applyPercentage(basePricePerNight, activeSeason.price_percentage)
      : activeSeason.price_per_night;
  } else {
    seasonPrice = basePricePerNight;
  }

  let priceBeforeMultiplier: number;
  let source: "base" | "season" | "override";
  let seasonName: string | undefined;

  if (override) {
    priceBeforeMultiplier = override.price_type === "percentage" && override.price_percentage !== null
      ? applyPercentage(seasonPrice, override.price_percentage)
      : override.price;
    source = "override";
  } else if (activeSeason) {
    priceBeforeMultiplier = seasonPrice;
    source = "season";
    seasonName = activeSeason.name;
  } else {
    priceBeforeMultiplier = basePricePerNight;
    source = "base";
  }

  const multiplier = isWeekend ? WEEKEND_MULTIPLIER : 1;
  const finalPrice = Math.round(priceBeforeMultiplier * multiplier);

  return {
    date: dateStr, day_name: DA_DAYS[dayOfWeek], price: finalPrice,
    source, season_name: seasonName, is_weekend: isWeekend,
    base_price: priceBeforeMultiplier, multiplier,
  };
}

function validateBooking(
  checkIn: Date, checkOut: Date, nights: number, minNights: number,
  checkInDays: number[] | null, checkOutDays: number[] | null,
  guestCount: number, maxGuests: number
): ValidationError[] {
  const errors: ValidationError[] = [];
  if (nights < 1) { errors.push({ code: "INVALID_DATES", message: "Check-out skal være efter check-in.", field: "dates" }); return errors; }
  if (nights < minNights) { errors.push({ code: "MIN_NIGHTS", message: `Minimum ${minNights} ${minNights === 1 ? "nat" : "nætter"} for dette ophold.`, field: "dates" }); }
  if (checkInDays && checkInDays.length > 0 && !checkInDays.includes(checkIn.getDay())) {
    errors.push({ code: "CHECK_IN_DAY", message: `Check-in er kun mulig: ${checkInDays.map(d => DA_DAYS[d]).join(", ")}.`, field: "check_in" });
  }
  if (checkOutDays && checkOutDays.length > 0 && !checkOutDays.includes(checkOut.getDay())) {
    errors.push({ code: "CHECK_OUT_DAY", message: `Check-out er kun mulig: ${checkOutDays.map(d => DA_DAYS[d]).join(", ")}.`, field: "check_out" });
  }
  if (guestCount > maxGuests) { errors.push({ code: "MAX_GUESTS", message: `Maks ${maxGuests} gæster for dette ophold.`, field: "guests" }); }
  if (guestCount < 1) { errors.push({ code: "MIN_GUESTS", message: "Mindst 1 gæst påkrævet.", field: "guests" }); }
  return errors;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { listing_id, start_date, end_date, guests, selected_addon_ids, discount_code } = body;
    const requestedDiscountCode = normalizeCode(discount_code);

    if (!listing_id || !start_date || !end_date) {
      return new Response(
        JSON.stringify({ error: "listing_id, start_date, end_date required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { data: listing, error: listingErr } = await supabase
      .from("listings").select("*").eq("id", listing_id).eq("is_active", true).single();

    if (listingErr || !listing) {
      return new Response(JSON.stringify({ error: "Listing not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const [seasonRes, overrideRes, addOnRes, feeRes, discountRes] = await Promise.all([
      supabase.from("season_rules").select("*").eq("listing_id", listing.id).eq("status", "active"),
      supabase.from("daily_price_overrides").select("*").eq("listing_id", listing.id).gte("date", start_date).lte("date", end_date),
      supabase.from("add_ons").select("*").eq("listing_id", listing.id).eq("is_active", true).order("sort_order"),
      supabase.from("fee_rules").select("*").eq("listing_id", listing.id).eq("is_active", true).order("sort_order"),
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

    const nightBreakdown: NightLine[] = [];
    const cursor = new Date(start_date + "T12:00:00Z");
    const endDt = new Date(end_date + "T12:00:00Z");
    let nightTotal = 0;

    while (cursor < endDt) {
      const line = calcNightPrice(cursor, listing.base_price_per_night, seasonRules, dailyOverrides, listing.id);
      nightBreakdown.push(line);
      nightTotal += line.price;
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }

    const nights = nightBreakdown.length;
    const guestCount = guests || 1;

    const checkInDate = new Date(start_date + "T12:00:00Z");
    const checkOutDate = new Date(end_date + "T12:00:00Z");
    const matchingSeasons = seasonRules
      .filter(r => isDateInSeason(checkInDate, r))
      .sort((a, b) => (b.priority || 0) - (a.priority || 0));
    const activeSeason = matchingSeasons[0] || null;
    const minNights = activeSeason?.min_nights || 2;
    const checkInDays = activeSeason?.check_in_days || null;
    const checkOutDays = activeSeason?.check_out_days || null;

    const validationErrors = validateBooking(checkInDate, checkOutDate, nights, minNights, checkInDays, checkOutDays, guestCount, listing.max_guests);

    // Fees
    const applicableFees: { id: string; name: string; amount: number; fee_type: string; description: string | null }[] = [];
    let feeTotal = 0;
    for (const fee of feeRules) {
      if (!fee.is_mandatory) continue;
      if (fee.condition_min_nights !== null && nights < fee.condition_min_nights) continue;
      if (fee.condition_max_nights !== null && nights > fee.condition_max_nights) continue;
      let amount: number;
      switch (fee.fee_type) {
        case "per_night": amount = fee.amount * nights; break;
        case "per_guest": amount = fee.amount * guestCount; break;
        default: amount = fee.amount;
      }
      if (amount > 0) {
        applicableFees.push({ id: fee.id, name: fee.name, amount, fee_type: fee.fee_type, description: fee.description });
        feeTotal += amount;
      }
    }

    // Add-ons
    const selectedAddonIds: string[] = selected_addon_ids || [];
    const selectedAddons: { id: string; name: string; unit_price: number; price_type: string; quantity: number; total: number }[] = [];
    let addonTotal = 0;
    for (const addon of addOns) {
      if (!selectedAddonIds.includes(addon.id)) continue;
      let quantity = 1, total: number;
      switch (addon.price_type) {
        case "per_guest": quantity = guestCount; total = addon.price * quantity; break;
        case "per_night": quantity = nights; total = addon.price * quantity; break;
        default: total = addon.price;
      }
      selectedAddons.push({ id: addon.id, name: addon.name, unit_price: addon.price, price_type: addon.price_type, quantity, total });
      addonTotal += total;
    }

    const subtotal = nightTotal + feeTotal + addonTotal;
    const now = new Date();
    const eligibleRules = discountRules.filter(rule => isDiscountEligible(rule, nights, now));
    const automaticCandidates = eligibleRules.filter(rule => !rule.code && (!requestedDiscountCode || rule.combinable_with_codes));
    const automaticDiscount = automaticCandidates
      .map(rule => ({ rule, amount: calculateDiscount(rule, subtotal) }))
      .sort((a, b) => b.amount - a.amount)[0] || null;

    let codeDiscount: { rule: DiscountRule; amount: number } | null = null;
    if (requestedDiscountCode) {
      const matchingRule = discountRules.find(rule => normalizeCode(rule.code) === requestedDiscountCode) || null;
      if (!matchingRule) {
        validationErrors.push({ code: "INVALID_DISCOUNT_CODE", message: "Rabatkoden findes ikke.", field: "discount_code" });
      } else if (!isDiscountEligible(matchingRule, nights, now)) {
        validationErrors.push({ code: "DISCOUNT_NOT_ELIGIBLE", message: "Rabatkoden gælder ikke for dette ophold.", field: "discount_code" });
      } else {
        codeDiscount = { rule: matchingRule, amount: calculateDiscount(matchingRule, subtotal) };
      }
    }

    const discounts = [automaticDiscount, codeDiscount].filter(Boolean) as { rule: DiscountRule; amount: number }[];
    const discountTotal = discounts.reduce((sum, item) => sum + item.amount, 0);
    const grandTotal = Math.max(0, subtotal - discountTotal);

    // Applied rules
    const appliedRules: AppliedRule[] = [];
    if (activeSeason) {
      appliedRules.push({
        type: "season", name: activeSeason.name,
        detail: activeSeason.price_type === "percentage"
          ? `${activeSeason.price_percentage! > 0 ? "+" : ""}${activeSeason.price_percentage}% af basispris`
          : `${(activeSeason.price_per_night / 100).toLocaleString("da-DK")} kr/nat`,
      });
    }
    const weekendNights = nightBreakdown.filter(n => n.is_weekend).length;
    if (weekendNights > 0) {
      appliedRules.push({ type: "weekend_surcharge", name: "Weekendtillæg", detail: `+25% på ${weekendNights} ${weekendNights === 1 ? "nat" : "nætter"} (fre/lør)` });
    }
    const overrideNights = nightBreakdown.filter(n => n.source === "override").length;
    if (overrideNights > 0) {
      appliedRules.push({ type: "override", name: "Dagspristilpasning", detail: `${overrideNights} ${overrideNights === 1 ? "nat" : "nætter"} med særpris` });
    }
    appliedRules.push({ type: "min_nights", name: "Minimum nætter", detail: `${minNights} ${minNights === 1 ? "nat" : "nætter"}` });
    if (checkInDays?.length) appliedRules.push({ type: "check_in_days", name: "Check-in dage", detail: checkInDays.map(d => DA_DAYS[d]).join(", ") });
    if (checkOutDays?.length) appliedRules.push({ type: "check_out_days", name: "Check-out dage", detail: checkOutDays.map(d => DA_DAYS[d]).join(", ") });

    // Line items
    const lineItems: { label: string; amount: number; type: string }[] = [];
    lineItems.push({ label: `Ophold (${nights} ${nights === 1 ? "nat" : "nætter"})`, amount: nightTotal, type: "night" });
    for (const fee of applicableFees) lineItems.push({ label: fee.name, amount: fee.amount, type: "fee" });
    for (const addon of selectedAddons) lineItems.push({ label: `${addon.name} (${addon.quantity}×)`, amount: addon.total, type: "addon" });
    for (const discount of discounts) {
      lineItems.push({ label: discount.rule.name, amount: -discount.amount, type: "discount" });
      appliedRules.push({
        type: "discount",
        name: discount.rule.name,
        detail: discount.rule.discount_type === "fixed"
          ? `${(discount.amount / 100).toLocaleString("da-DK")} kr rabat`
          : `${discount.rule.discount_value}% rabat`,
      });
    }

    return new Response(
      JSON.stringify({
        valid: validationErrors.length === 0,
        validation_errors: validationErrors,
        listing: {
          id: listing.id, name: listing.name, slug: listing.slug,
          max_guests: listing.max_guests,
          check_in_time: listing.check_in_time || "15:00",
          check_out_time: listing.check_out_time || "10:00",
          owner_id: listing.owner_id,
        },
        nights: nightBreakdown, night_count: nights, night_total: nightTotal,
        fees: applicableFees, fee_total: feeTotal,
        selected_addons: selectedAddons, addon_total: addonTotal,
        discounts: discounts.map(d => ({
          id: d.rule.id,
          name: d.rule.name,
          code: d.rule.code,
          amount: d.amount,
          discount_type: d.rule.discount_type,
          discount_value: d.rule.discount_value,
        })),
        discount_total: discountTotal,
        discount_code: requestedDiscountCode || null,
        available_addons: addOns.map(a => ({ id: a.id, name: a.name, description: a.description, price: a.price, price_type: a.price_type })),
        line_items: lineItems, grand_total: grandTotal,
        currency: listing.currency || "DKK",
        applied_rules: appliedRules, min_nights: minNights,
        check_in_days: checkInDays, check_out_days: checkOutDays,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: msg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
