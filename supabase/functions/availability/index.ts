import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const url = new URL(req.url);
  const listingId = url.searchParams.get("listing_id");
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");

  if (!listingId || !from || !to) {
    return new Response(JSON.stringify({ error: "listing_id, from, to required" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  // Get bookings (confirmed AND pending)
  const { data: bookings } = await supabase
    .from("bookings").select("check_in, check_out")
    .eq("property_id", listingId).in("status", ["confirmed", "pending"])
    .lte("check_in", to).gte("check_out", from);

  // Get listing blocks
  const { data: blocks } = await supabase
    .from("listing_blocks").select("start_date, end_date")
    .eq("listing_id", listingId)
    .lte("start_date", to).gte("end_date", from);

  // Get active holds (not expired, not released)
  const { data: holds } = await supabase
    .from("availability_holds").select("start_date, end_date")
    .eq("listing_id", listingId).eq("released", false)
    .gt("expires_at", new Date().toISOString())
    .lte("start_date", to).gte("end_date", from);

  // Merge all busy dates
  const blockedDates = new Set<string>();
  for (const b of (bookings || [])) {
    const start = new Date(b.check_in); const end = new Date(b.check_out);
    const cursor = new Date(start);
    while (cursor < end) { blockedDates.add(cursor.toISOString().split("T")[0]); cursor.setDate(cursor.getDate() + 1); }
  }
  for (const bl of (blocks || [])) {
    const start = new Date(bl.start_date); const end = new Date(bl.end_date);
    const cursor = new Date(start);
    while (cursor < end) { blockedDates.add(cursor.toISOString().split("T")[0]); cursor.setDate(cursor.getDate() + 1); }
  }
  for (const h of (holds || [])) {
    const start = new Date(h.start_date); const end = new Date(h.end_date);
    const cursor = new Date(start);
    while (cursor < end) { blockedDates.add(cursor.toISOString().split("T")[0]); cursor.setDate(cursor.getDate() + 1); }
  }

  return new Response(JSON.stringify({
    listing_id: listingId, from, to,
    blocked_dates: Array.from(blockedDates).sort(),
  }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
});
