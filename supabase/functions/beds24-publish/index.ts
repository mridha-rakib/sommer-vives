import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type JsonRecord = Record<string, unknown>;

type PublishBody = {
  listing_id?: string;
  channels?: string[];
  calendar_days?: number;
  mode?: "native" | "middleware";
};

type ListingRecord = JsonRecord & {
  id: string;
  name: string;
  owner_id: string;
  slug?: string | null;
  description?: string | null;
  long_description?: string | null;
  address?: string | null;
  city?: string | null;
  region?: string | null;
  country?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  max_guests?: number | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  base_price_per_night?: number | null;
  weekend_price_per_night?: number | null;
  cleaning_fee?: number | null;
  currency?: string | null;
  min_nights?: number | null;
  max_nights?: number | null;
  check_in_time?: string | null;
  check_out_time?: string | null;
  amenities?: string[] | null;
  images?: string[] | null;
  hero_image?: string | null;
  property_type?: string | null;
  sqm?: number | null;
  deposit?: number | null;
  sync_status?: string | null;
  last_sync_at?: string | null;
  sync_error_message?: string | null;
  channel_manager_partner?: string | null;
  external_listing_id?: string | null;
  external_property_id?: string | null;
  beds24_last_channels?: string[] | null;
  beds24_last_publish_payload?: JsonRecord | null;
  beds24_last_response?: JsonRecord | null;
};

type SeasonRule = {
  start_month: number;
  start_day: number;
  end_month: number;
  end_day: number;
  price_per_night: number;
  price_type: string;
  price_percentage: number | null;
  min_nights: number | null;
  priority: number | null;
  status: string;
};

type DailyOverride = {
  date: string;
  price: number;
  price_type: string;
  price_percentage: number | null;
};

type CalendarSegment = {
  from: string;
  to: string;
  price1: number;
  minStay?: number;
  maxStay?: number;
};

const CHANNELS = ["airbnb", "booking", "vrbo"];
const NATIVE_API_BASE_URL = "https://beds24.com/api/v2";
const WEEKEND_MULTIPLIER = 1.25;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function asNumber(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function parsePositiveInteger(value: unknown) {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function moneyFromMinorUnits(value: unknown) {
  const parsed = asNumber(value);
  return parsed === null ? null : Math.round(parsed) / 100;
}

function cleanRecord<T extends JsonRecord>(record: T): JsonRecord {
  const cleaned: JsonRecord = {};
  for (const [key, value] of Object.entries(record)) {
    if (value === null || value === undefined || value === "") continue;
    if (Array.isArray(value) && value.length === 0) continue;
    cleaned[key] = value;
  }
  return cleaned;
}

function hasValue(value: unknown): boolean {
  if (value === null || value === undefined || value === "" || value === 0) return false;
  if (Array.isArray(value) && value.length === 0) return false;
  return true;
}

function validateListing(listing: ListingRecord, channels: string[]) {
  const blockers: string[] = [];
  const warnings: string[] = [];

  if (!hasValue(listing.description)) blockers.push("Kort beskrivelse mangler");
  if (!hasValue(listing.base_price_per_night)) blockers.push("Basispris mangler");
  if (!hasValue(listing.max_guests)) blockers.push("Max gæster mangler");
  if ((listing.images?.length || 0) < 1) blockers.push("Mindst ét billede mangler");
  if ((listing.images?.length || 0) < 5) warnings.push(`Kun ${listing.images?.length || 0} billeder (min. 5 anbefalet)`);
  if ((listing.amenities?.length || 0) < 5) warnings.push(`Kun ${listing.amenities?.length || 0} faciliteter (min. 5 anbefalet)`);
  if (!hasValue(listing.bedrooms)) warnings.push("Soveværelser mangler");
  if (!hasValue(listing.bathrooms)) warnings.push("Badeværelser mangler");

  for (const channel of channels) {
    if (!CHANNELS.includes(channel)) blockers.push(`Ukendt kanal: ${channel}`);
    if (!listing[`channel_${channel}_ready`]) warnings.push(`${channel} er ikke markeret som klar`);
  }

  return { blockers: Array.from(new Set(blockers)), warnings: Array.from(new Set(warnings)) };
}

function normalizeChannels(channels: unknown) {
  if (!Array.isArray(channels) || channels.length === 0) return CHANNELS;
  return channels.map(asString).filter(Boolean);
}

function normalizePropertyType(value: unknown) {
  const normalized = asString(value).toLowerCase().replace(/[\s_-]+/g, "");
  if (["apartment", "lejlighed", "flat", "condo"].includes(normalized)) return "apartment";
  if (["villa"].includes(normalized)) return "villa";
  if (["cabin", "hytte"].includes(normalized)) return "cabin";
  if (["cottage", "sommerhus", "holidayhome", "holidayhouse"].includes(normalized)) return "cottage";
  if (["hotel"].includes(normalized)) return "hotel";
  return "house";
}

function buildPayload(listing: ListingRecord, channels: string[]) {
  return {
    source: "sommervibes",
    listing: {
      id: listing.id,
      name: listing.name,
      slug: listing.slug,
      description: listing.description,
      long_description: listing.long_description,
      address: listing.address,
      city: listing.city,
      region: listing.region,
      country: listing.country || "DK",
      latitude: listing.latitude,
      longitude: listing.longitude,
      max_guests: listing.max_guests,
      bedrooms: listing.bedrooms,
      bathrooms: listing.bathrooms,
      base_price_per_night: listing.base_price_per_night,
      weekend_price_per_night: listing.weekend_price_per_night,
      cleaning_fee: listing.cleaning_fee,
      currency: listing.currency || "DKK",
      min_nights: listing.min_nights,
      max_nights: listing.max_nights,
      check_in_time: listing.check_in_time,
      check_out_time: listing.check_out_time,
      amenities: listing.amenities || [],
      images: listing.images || [],
      hero_image: listing.hero_image,
    },
    channels: channels.map((channel) => ({
      channel,
      ready: !!listing[`channel_${channel}_ready`],
      title: asString(listing[`channel_${channel}_title`]) || listing.name,
      description: asString(listing[`channel_${channel}_description`]) || listing.description,
      room_setup: channel === "booking" ? listing.channel_booking_room_setup || null : null,
      policies: channel === "booking" ? listing.channel_booking_policies || null : null,
    })),
  };
}

function buildBeds24PropertyPayload(listing: ListingRecord) {
  const propertyId = parsePositiveInteger(listing.external_property_id);
  const roomId = parsePositiveInteger(listing.external_listing_id);
  const roomName = asString(listing.channel_booking_title) || asString(listing.channel_airbnb_title) || listing.name;

  const roomType = cleanRecord({
    id: roomId || undefined,
    name: roomName,
    qty: 1,
    maxPeople: listing.max_guests || undefined,
    minStay: listing.min_nights || undefined,
    maxStay: listing.max_nights || undefined,
    rackRate: moneyFromMinorUnits(listing.base_price_per_night) || undefined,
    cleaningFee: moneyFromMinorUnits(listing.cleaning_fee) || undefined,
    securityDeposit: moneyFromMinorUnits(listing.deposit) || undefined,
    roomSize: listing.sqm || undefined,
  });

  return [
    cleanRecord({
      id: propertyId || undefined,
      name: listing.name,
      propertyType: normalizePropertyType(listing.property_type),
      currency: listing.currency || "DKK",
      address: listing.address || undefined,
      city: listing.city || undefined,
      state: listing.region || undefined,
      country: listing.country || "DK",
      latitude: listing.latitude || undefined,
      longitude: listing.longitude || undefined,
      description: listing.long_description || listing.description || undefined,
      roomTypes: [roomType],
    }),
  ];
}

function firstResponseItem(responseBody: unknown): JsonRecord | null {
  if (Array.isArray(responseBody)) return (responseBody[0] as JsonRecord) || null;
  if (responseBody && typeof responseBody === "object") {
    const record = responseBody as JsonRecord;
    if (Array.isArray(record.data)) return (record.data[0] as JsonRecord) || null;
    return record;
  }
  return null;
}

function extractBeds24Ids(responseBody: unknown, listing: ListingRecord) {
  const item = firstResponseItem(responseBody);
  const roomTypes = item && Array.isArray(item.roomTypes) ? item.roomTypes as JsonRecord[] : [];
  const propertyId = asString(item?.id) || asString(item?.propertyId) || asString(listing.external_property_id) || null;
  const room = roomTypes[0] || null;
  const roomId = asString(room?.id) || asString(room?.roomId) || asString(listing.external_listing_id) || null;
  return { propertyId, roomId };
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function formatDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function dateValue(year: number, month: number, day: number) {
  return month * 100 + day + year * 10000;
}

function isDateInSeason(date: Date, rule: SeasonRule) {
  const current = dateValue(0, date.getUTCMonth() + 1, date.getUTCDate());
  const start = dateValue(0, rule.start_month, rule.start_day);
  const end = dateValue(0, rule.end_month, rule.end_day);
  return start <= end ? current >= start && current <= end : current >= start || current <= end;
}

function calculateNightPriceMinor(
  date: Date,
  listing: ListingRecord,
  seasonRules: SeasonRule[],
  overridesByDate: Map<string, DailyOverride>,
) {
  const dateKey = formatDate(date);
  const isWeekend = date.getUTCDay() === 5 || date.getUTCDay() === 6;
  const base = Number(listing.base_price_per_night || 0);
  const season = seasonRules
    .filter((rule) => rule.status === "active" && isDateInSeason(date, rule))
    .sort((a, b) => (b.priority || 0) - (a.priority || 0))[0] || null;

  let seasonPrice = base;
  if (season) {
    seasonPrice = season.price_type === "percentage" && season.price_percentage !== null
      ? Math.round(base * (1 + season.price_percentage / 100))
      : Number(season.price_per_night || base);
  }

  const override = overridesByDate.get(dateKey);
  const price = override
    ? override.price_type === "percentage" && override.price_percentage !== null
      ? Math.round(seasonPrice * (1 + override.price_percentage / 100))
      : Number(override.price || seasonPrice)
    : seasonPrice;

  return Math.round(price * (isWeekend ? WEEKEND_MULTIPLIER : 1));
}

function groupCalendarSegments(
  listing: ListingRecord,
  seasonRules: SeasonRule[],
  overrides: DailyOverride[],
  days: number,
) {
  const overridesByDate = new Map(overrides.map((override) => [override.date, override]));
  const segments: CalendarSegment[] = [];
  const start = new Date();
  start.setUTCHours(12, 0, 0, 0);
  const baseMinStay = listing.min_nights || 1;
  const maxStay = listing.max_nights || undefined;

  for (let offset = 0; offset < days; offset += 1) {
    const date = addDays(start, offset);
    const price1 = moneyFromMinorUnits(calculateNightPriceMinor(date, listing, seasonRules, overridesByDate)) || 0;
    const activeSeason = seasonRules
      .filter((rule) => rule.status === "active" && isDateInSeason(date, rule))
      .sort((a, b) => (b.priority || 0) - (a.priority || 0))[0] || null;
    const minStay = activeSeason?.min_nights || baseMinStay;
    const dateKey = formatDate(date);
    const previous = segments[segments.length - 1];

    if (previous && previous.price1 === price1 && previous.minStay === minStay && previous.maxStay === maxStay) {
      previous.to = dateKey;
    } else {
      segments.push(cleanRecord({ from: dateKey, to: dateKey, price1, minStay, maxStay }) as CalendarSegment);
    }
  }

  return segments;
}

async function beds24Fetch(baseUrl: string, path: string, token: string, init: RequestInit = {}) {
  const response = await fetch(`${baseUrl.replace(/\/+$/, "")}${path}`, {
    ...init,
    headers: {
      accept: "application/json",
      "Content-Type": "application/json",
      token,
      ...(init.headers || {}),
    },
  });
  const text = await response.text();
  let body: unknown = text;
  try { body = text ? JSON.parse(text) : {}; } catch (_) { /* keep raw response text */ }

  if (!response.ok) {
    const message = typeof body === "object" && body && "error" in body
      ? asString((body as JsonRecord).error)
      : "";
    throw new Error(message || `Beds24 ${path} failed with HTTP ${response.status}`);
  }

  return {
    body,
    headers: {
      remaining: response.headers.get("x-five-min-limit-remaining"),
      resetsIn: response.headers.get("x-five-min-limit-resets-in"),
      requestCost: response.headers.get("x-request-cost"),
    },
  };
}

async function getBeds24Token(baseUrl: string) {
  const directToken = Deno.env.get("BEDS24_API_TOKEN") || Deno.env.get("BEDS24_TOKEN");
  if (directToken) return directToken;

  const refreshToken = Deno.env.get("BEDS24_REFRESH_TOKEN");
  if (!refreshToken) {
    throw new Error("Beds24 API is not configured. Set BEDS24_API_TOKEN or BEDS24_REFRESH_TOKEN for native API V2 publishing.");
  }

  const response = await fetch(`${baseUrl.replace(/\/+$/, "")}/authentication/token`, {
    method: "GET",
    headers: { accept: "application/json", refreshToken },
  });
  const body = await response.json().catch(() => ({})) as JsonRecord;
  if (!response.ok || !body.token) {
    throw new Error(asString(body.error) || `Beds24 token refresh failed with HTTP ${response.status}`);
  }
  return asString(body.token);
}

async function publishViaMiddleware(payload: JsonRecord) {
  const beds24Url = Deno.env.get("BEDS24_PUBLISH_URL") || Deno.env.get("BEDS24_API_URL");
  const beds24Token = Deno.env.get("BEDS24_API_TOKEN") || Deno.env.get("BEDS24_TOKEN");

  if (!beds24Url || !beds24Token) {
    throw new Error("Beds24 middleware is not configured. Set BEDS24_PUBLISH_URL and BEDS24_API_TOKEN.");
  }

  const response = await fetch(beds24Url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${beds24Token}`,
    },
    body: JSON.stringify(payload),
  });

  const responseText = await response.text();
  let responseBody: unknown = responseText;
  try { responseBody = JSON.parse(responseText); } catch (_) { /* keep text */ }

  if (!response.ok) {
    const message = typeof responseBody === "object" && responseBody
      ? asString((responseBody as JsonRecord).error) || asString((responseBody as JsonRecord).message)
      : asString(responseBody);
    throw new Error(message || `Beds24 middleware failed with HTTP ${response.status}`);
  }

  return {
    mode: "middleware",
    response: responseBody,
    propertyId: asString((responseBody as JsonRecord)?.listing_id) || asString((responseBody as JsonRecord)?.external_property_id) || null,
    roomId: asString((responseBody as JsonRecord)?.room_id) || asString((responseBody as JsonRecord)?.external_listing_id) || null,
  };
}

async function publishViaNativeApi(
  supabase: ReturnType<typeof createClient>,
  listing: ListingRecord,
  channels: string[],
  calendarDays: number,
) {
  const baseUrl = Deno.env.get("BEDS24_API_BASE_URL") || NATIVE_API_BASE_URL;
  const token = await getBeds24Token(baseUrl);
  const propertyPayload = buildBeds24PropertyPayload(listing);
  const propertyResult = await beds24Fetch(baseUrl, "/properties", token, {
    method: "POST",
    body: JSON.stringify(propertyPayload),
  });

  const ids = extractBeds24Ids(propertyResult.body, listing);
  const roomId = parsePositiveInteger(ids.roomId);
  let calendarResult: { body: unknown; headers: JsonRecord } | null = null;
  const publishWarnings: string[] = [];

  if (roomId) {
    const today = formatDate(new Date());
    const end = formatDate(addDays(new Date(), calendarDays));
    const [{ data: seasons, error: seasonError }, { data: overrides, error: overrideError }] = await Promise.all([
      supabase
        .from("season_rules")
        .select("start_month, start_day, end_month, end_day, price_per_night, price_type, price_percentage, min_nights, priority, status")
        .eq("listing_id", listing.id)
        .eq("status", "active"),
      supabase
        .from("daily_price_overrides")
        .select("date, price, price_type, price_percentage")
        .eq("listing_id", listing.id)
        .gte("date", today)
        .lte("date", end),
    ]);
    if (seasonError) throw seasonError;
    if (overrideError) throw overrideError;

    const calendarPayload = [{
      roomId,
      calendar: groupCalendarSegments(
        listing,
        (seasons || []) as SeasonRule[],
        (overrides || []) as DailyOverride[],
        calendarDays,
      ),
    }];

    calendarResult = await beds24Fetch(baseUrl, "/inventory/rooms/calendar", token, {
      method: "POST",
      body: JSON.stringify(calendarPayload),
    });
  } else {
    publishWarnings.push("Beds24 did not return a room id; calendar price sync was skipped. Save the Beds24 Room ID and publish again.");
  }

  if (channels.includes("booking")) {
    publishWarnings.push("Booking.com mapping cannot be completed through the Beds24 API; finish channel mapping in Beds24 after property/room sync.");
  }

  return {
    mode: "native",
    response: {
      property: propertyResult.body,
      calendar: calendarResult?.body || null,
      api_limits: {
        property: propertyResult.headers,
        calendar: calendarResult?.headers || null,
      },
      warnings: publishWarnings,
    },
    propertyId: ids.propertyId,
    roomId: ids.roomId,
    warnings: publishWarnings,
  };
}

async function getActor(req: Request) {
  const authHeader = req.headers.get("Authorization") || "";
  const client = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  );
  const { data: { user } } = await client.auth.getUser();
  if (!user) return { user: null, roles: [] as string[] };

  const { data: roles } = await client
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id);

  return { user, roles: (roles || []).map((row: { role: string }) => row.role) };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const { user, roles } = await getActor(req);
  if (!user) return json({ error: "Unauthorized" }, 401);
  if (!roles.includes("admin") && !roles.includes("super_admin")) return json({ error: "Admin access required" }, 403);

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const body = await req.json().catch(() => ({})) as PublishBody;
  const listingId = body.listing_id;
  const channels = normalizeChannels(body.channels);
  const calendarDays = Math.min(730, Math.max(30, Math.round(Number(body.calendar_days || 365))));

  if (!listingId) return json({ error: "listing_id required" }, 400);

  const { data: listingData, error: listingError } = await supabase
    .from("listings")
    .select("*")
    .eq("id", listingId)
    .single();

  if (listingError || !listingData) return json({ error: "Listing not found" }, 404);
  const listing = listingData as ListingRecord;

  const validation = validateListing(listing, channels);
  if (validation.blockers.length > 0) {
    return json({ error: "Pre-flight validation failed", blockers: validation.blockers, warnings: validation.warnings }, 422);
  }

  const snapshot = {
    sync_status: listing.sync_status,
    last_sync_at: listing.last_sync_at,
    sync_error_message: listing.sync_error_message,
    external_listing_id: listing.external_listing_id,
    external_property_id: listing.external_property_id,
    channel_manager_partner: listing.channel_manager_partner,
    beds24_last_channels: listing.beds24_last_channels,
    beds24_last_publish_payload: listing.beds24_last_publish_payload,
    beds24_last_response: listing.beds24_last_response,
  };
  const now = new Date().toISOString();
  const payload = buildPayload(listing, channels);

  await supabase.from("listings").update({
    sync_status: "pending",
    last_sync_at: now,
    sync_error_message: null,
    channel_manager_partner: "beds24",
    beds24_last_channels: channels,
    beds24_last_publish_payload: payload,
  }).eq("id", listingId);

  await supabase.from("audit_log").insert({
    action: "beds24_publish_initiated",
    entity_type: "listing",
    entity_id: listingId,
    actor_user_id: user.id,
    actor_email: user.email,
    before_data: snapshot,
    after_data: { sync_status: "pending", sent_at: now, channels, warnings: validation.warnings, calendar_days: calendarDays },
  });

  try {
    const explicitMode = body.mode || Deno.env.get("BEDS24_INTEGRATION_MODE");
    const useMiddleware = explicitMode === "middleware"
      || (!explicitMode && !!Deno.env.get("BEDS24_PUBLISH_URL"));
    const result = useMiddleware
      ? await publishViaMiddleware(payload)
      : await publishViaNativeApi(supabase, listing, channels, calendarDays);

    const warnings = Array.from(new Set([...(validation.warnings || []), ...((result as JsonRecord).warnings as string[] || [])]));
    const updated = {
      sync_status: result.roomId ? "synced" : "pending",
      last_sync_at: new Date().toISOString(),
      sync_error_message: result.roomId ? null : "Beds24 property was updated, but room id is missing. Calendar sync needs a Beds24 Room ID.",
      channel_manager_partner: "beds24",
      external_listing_id: result.roomId || listing.external_listing_id,
      external_property_id: result.propertyId || listing.external_property_id,
      beds24_last_channels: channels,
      beds24_last_response: result.response as JsonRecord,
    };

    await supabase.from("listings").update(updated).eq("id", listingId);
    await supabase.from("audit_log").insert({
      action: "beds24_status_synced",
      entity_type: "listing",
      entity_id: listingId,
      actor_user_id: user.id,
      actor_email: user.email,
      before_data: { sync_status: "pending" },
      after_data: { ...updated, warnings },
    });

    return json({ success: true, mode: result.mode, listing: updated, response: result.response, warnings });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const rollback = {
      ...snapshot,
      sync_status: snapshot.sync_status || "error",
      sync_error_message: message,
      last_sync_at: new Date().toISOString(),
    };

    await supabase.from("listings").update(rollback).eq("id", listingId);
    await supabase.from("audit_log").insert({
      action: "beds24_status_error",
      entity_type: "listing",
      entity_id: listingId,
      actor_user_id: user.id,
      actor_email: user.email,
      before_data: { sync_status: "pending" },
      after_data: { ...rollback, error: message, rolled_back: true, channels },
    });

    return json({ error: message, rolled_back: true, listing: rollback }, 502);
  }
});
