import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ICalEvent { uid: string; dtstart: string; dtend: string; summary: string; }

function parseICS(text: string): ICalEvent[] {
  const events: ICalEvent[] = [];
  const lines = text.replace(/\r\n /g, "").split(/\r?\n/);
  let current: Partial<ICalEvent> | null = null;
  for (const line of lines) {
    if (line === "BEGIN:VEVENT") { current = {}; }
    else if (line === "END:VEVENT" && current) {
      if (current.uid && current.dtstart && current.dtend) events.push(current as ICalEvent);
      current = null;
    } else if (current) {
      const [key, ...rest] = line.split(":"); const value = rest.join(":");
      const baseKey = key.split(";")[0];
      if (baseKey === "UID") current.uid = value;
      else if (baseKey === "DTSTART") current.dtstart = value;
      else if (baseKey === "DTEND") current.dtend = value;
      else if (baseKey === "SUMMARY") current.summary = value;
    }
  }
  return events;
}

function icalDateToISO(d: string): string {
  return `${d.substring(0, 4)}-${d.substring(4, 6)}-${d.substring(6, 8)}`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  // Fetch all active sync settings
  const { data: syncSettings } = await supabase
    .from("sync_settings").select("*")
    .eq("is_active", true).eq("direction", "inbound");

  if (!syncSettings || syncSettings.length === 0) {
    return new Response(JSON.stringify({ message: "No active sync feeds" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  const results: Record<string, { status: string; count: number; error?: string }> = {};

  for (const feed of syncSettings) {
    if (!feed.feed_url) { results[feed.id] = { status: "skipped", count: 0, error: "No feed URL" }; continue; }

    try {
      const response = await fetch(feed.feed_url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const text = await response.text();
      const events = parseICS(text);

      // Delete old imports for this listing from this provider, then insert fresh
      await supabase.from("listing_blocks").delete()
        .eq("listing_id", feed.listing_id)
        .eq("source", `${feed.provider}_import`);

      const blocks = events.map(e => ({
        listing_id: feed.listing_id,
        owner_id: feed.owner_id,
        start_date: icalDateToISO(e.dtstart),
        end_date: icalDateToISO(e.dtend),
        source: `${feed.provider}_import`,
        external_uid: e.uid,
        summary: e.summary || `${feed.provider} Reservation`,
      }));

      if (blocks.length > 0) {
        const { error } = await supabase.from("listing_blocks").insert(blocks);
        if (error) throw new Error(error.message);
      }

      // Update last synced
      await supabase.from("sync_settings").update({ last_synced_at: new Date().toISOString() }).eq("id", feed.id);

      results[feed.id] = { status: "success", count: events.length };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      results[feed.id] = { status: "error", count: 0, error: msg };
    }
  }

  return new Response(JSON.stringify({ results }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } });
});
