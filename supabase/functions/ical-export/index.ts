import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function dateToIcal(dateStr: string): string { return dateStr.replace(/-/g, ""); }
function nowIcal(): string { return new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+Z$/, "Z"); }
function tokenFromConfig(config: unknown): string[] {
  if (!config || typeof config !== "object" || Array.isArray(config)) return [];
  const values = [
    (config as Record<string, unknown>).export_token,
    (config as Record<string, unknown>).ical_export_token,
    (config as Record<string, unknown>).token,
  ];
  return values.filter((value): value is string => typeof value === "string" && value.length > 0);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const url = new URL(req.url);
  const listingId = url.searchParams.get("listing_id");
  const token = url.searchParams.get("token");

  if (!listingId || !token) return new Response("Missing listing_id or token", { status: 400 });

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  const { data: listing } = await supabase
    .from("listings").select("id, name, owner_id").eq("id", listingId).single();

  if (!listing) return new Response("Listing not found", { status: 404 });

  const { data: syncSettings } = await supabase
    .from("sync_settings")
    .select("id, direction, is_active, config")
    .eq("listing_id", listingId)
    .eq("is_active", true);

  const validToken = (syncSettings || []).some((setting) => {
    const direction = String(setting.direction || "").toLowerCase();
    if (direction && direction !== "export" && direction !== "both") return false;
    return token === setting.id || tokenFromConfig(setting.config).includes(token);
  });

  if (!validToken) return new Response("Invalid export token", { status: 403 });

  // Get confirmed bookings
  const { data: bookings } = await supabase
    .from("bookings").select("id, check_in, check_out, guest_name")
    .eq("property_id", listingId).eq("status", "confirmed");

  // Get blocks (not from ical import to avoid loops)
  const { data: blocks } = await supabase
    .from("listing_blocks").select("id, start_date, end_date, summary, source")
    .eq("listing_id", listingId).neq("source", "ical_import");

  const events: string[] = [];
  const dtstamp = nowIcal();

  for (const b of bookings || []) {
    events.push(
      `BEGIN:VEVENT\r\nUID:booking-${b.id}@sommervibes.dk\r\nDTSTAMP:${dtstamp}\r\nDTSTART;VALUE=DATE:${dateToIcal(b.check_in)}\r\nDTEND;VALUE=DATE:${dateToIcal(b.check_out)}\r\nSUMMARY:Booking - ${b.guest_name || "Gæst"}\r\nEND:VEVENT`
    );
  }

  for (const bl of blocks || []) {
    events.push(
      `BEGIN:VEVENT\r\nUID:block-${bl.id}@sommervibes.dk\r\nDTSTAMP:${dtstamp}\r\nDTSTART;VALUE=DATE:${dateToIcal(bl.start_date)}\r\nDTEND;VALUE=DATE:${dateToIcal(bl.end_date)}\r\nSUMMARY:${bl.summary || "Blokeret"}\r\nEND:VEVENT`
    );
  }

  const ical = [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//SommerVibes//Booking//DA",
    "CALSCALE:GREGORIAN", "METHOD:PUBLISH",
    `X-WR-CALNAME:SommerVibes ${listing.name}`,
    ...events, "END:VCALENDAR",
  ].join("\r\n");

  return new Response(ical, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${listing.name}.ics"`,
      ...corsHeaders,
    },
  });
});
