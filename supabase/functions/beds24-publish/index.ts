import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type PublishBody = {
  listing_id?: string;
  channels?: string[];
};

const CHANNELS = ["airbnb", "booking", "vrbo"];

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function hasValue(value: unknown): boolean {
  if (value === null || value === undefined || value === "" || value === 0) return false;
  if (Array.isArray(value) && value.length === 0) return false;
  return true;
}

function validateListing(listing: any, channels: string[]) {
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

function buildPayload(listing: any, channels: string[]) {
  return {
    source: "sommervibes",
    listing: {
      id: listing.id,
      name: listing.name,
      slug: listing.slug,
      description: listing.description,
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
    channels: channels.map(channel => ({
      channel,
      ready: !!listing[`channel_${channel}_ready`],
      title: listing[`channel_${channel}_title`] || listing.name,
      description: listing[`channel_${channel}_description`] || listing.description,
      room_setup: channel === "booking" ? listing.channel_booking_room_setup : null,
      policies: channel === "booking" ? listing.channel_booking_policies : null,
    })),
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { global: { headers: { Authorization: req.headers.get("Authorization") || "" } } },
  );

  const body = await req.json().catch(() => ({})) as PublishBody;
  const listingId = body.listing_id;
  const channels = (body.channels?.length ? body.channels : CHANNELS).filter(Boolean);

  if (!listingId) return json({ error: "listing_id required" }, 400);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return json({ error: "Unauthorized" }, 401);

  const { data: listing, error: listingError } = await supabase
    .from("listings")
    .select("*")
    .eq("id", listingId)
    .single();

  if (listingError || !listing) return json({ error: "Listing not found" }, 404);

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
    after_data: { sync_status: "pending", sent_at: now, channels, warnings: validation.warnings },
  });

  try {
    const beds24Url = Deno.env.get("BEDS24_PUBLISH_URL") || Deno.env.get("BEDS24_API_URL");
    const beds24Token = Deno.env.get("BEDS24_API_TOKEN") || Deno.env.get("BEDS24_TOKEN");

    if (!beds24Url || !beds24Token) {
      throw new Error("Beds24 API is not configured. Set BEDS24_PUBLISH_URL and BEDS24_API_TOKEN.");
    }

    const response = await fetch(beds24Url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${beds24Token}`,
      },
      body: JSON.stringify(payload),
    });

    const responseText = await response.text();
    let responseBody: any = responseText;
    try { responseBody = JSON.parse(responseText); } catch (_) { /* keep text */ }

    if (!response.ok) {
      throw new Error(typeof responseBody === "string" ? responseBody : responseBody?.error || `Beds24 HTTP ${response.status}`);
    }

    const updated = {
      sync_status: "synced",
      last_sync_at: new Date().toISOString(),
      sync_error_message: null,
      channel_manager_partner: "beds24",
      external_listing_id: responseBody?.listing_id || responseBody?.external_listing_id || listing.external_listing_id,
      external_property_id: responseBody?.property_id || responseBody?.external_property_id || listing.external_property_id,
      beds24_last_channels: channels,
      beds24_last_response: responseBody,
    };

    await supabase.from("listings").update(updated).eq("id", listingId);
    await supabase.from("audit_log").insert({
      action: "beds24_status_synced",
      entity_type: "listing",
      entity_id: listingId,
      actor_user_id: user.id,
      actor_email: user.email,
      before_data: { sync_status: "pending" },
      after_data: updated,
    });

    return json({ success: true, listing: updated, response: responseBody, warnings: validation.warnings });
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
