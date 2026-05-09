import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  let bookingId: string | null = null;
  let action = "cancel";

  if (req.method === "POST") {
    const body = await req.json();
    bookingId = body.booking_id;
    action = body.action || "cancel";
  } else {
    const url = new URL(req.url);
    bookingId = url.searchParams.get("booking_id");
    action = url.searchParams.get("action") || "cancel";
  }

  if (!bookingId) {
    return new Response(JSON.stringify({ error: "booking_id required" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  // Verify caller auth
  const authHeader = req.headers.get("authorization");
  if (authHeader) {
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabase.auth.getClaims(token);
    if (!data?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
  }

  const { data: booking } = await supabase
    .from("bookings").select("id, status, property_id, check_in, check_out")
    .eq("id", bookingId).single();

  if (!booking) {
    return new Response(JSON.stringify({ error: "Booking not found" }),
      { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  if (action === "delete") {
    await supabase.from("booking_line_items").delete().eq("booking_id", bookingId);
    await supabase.from("availability_holds").delete().eq("booking_id", bookingId);
    await supabase.from("listing_blocks").delete().eq("external_uid", `booking-${bookingId}`);
    await supabase.from("bookings").delete().eq("id", bookingId);
    return new Response(JSON.stringify({ success: true, deleted: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  if (booking.status !== "cancelled") {
    await supabase.from("bookings").update({ status: "cancelled" }).eq("id", bookingId);
  }
  await supabase.from("availability_holds").update({ released: true }).eq("booking_id", bookingId);
  await supabase.from("listing_blocks").delete().eq("external_uid", `booking-${bookingId}`);

  return new Response(JSON.stringify({ success: true, cancelled: true }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } });
});
