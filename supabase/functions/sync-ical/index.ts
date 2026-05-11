import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ICalEvent { uid: string; dtstart: string; dtend: string; summary: string; }
interface ImportConflict {
  uid: string;
  provider: string;
  summary: string;
  start_date: string;
  end_date: string;
  conflict_type: "booking" | "block";
  conflict_id: string;
  conflict_summary: string;
}

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

function rangesOverlap(startA: string, endA: string, startB: string, endB: string): boolean {
  return startA < endB && endA > startB;
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

  const results: Record<string, { status: string; count: number; imported?: number; skipped?: number; conflicts?: ImportConflict[]; error?: string }> = {};

  for (const feed of syncSettings) {
    if (!feed.feed_url) { results[feed.id] = { status: "skipped", count: 0, error: "No feed URL" }; continue; }

    try {
      const response = await fetch(feed.feed_url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const text = await response.text();
      const events = parseICS(text);

      const normalizedEvents = events.map(e => ({
        uid: e.uid,
        start_date: icalDateToISO(e.dtstart),
        end_date: icalDateToISO(e.dtend),
        summary: e.summary || `${feed.provider} Reservation`,
      })).filter(e => e.start_date && e.end_date && e.start_date < e.end_date);

      const earliest = normalizedEvents.reduce<string | null>((min, e) => !min || e.start_date < min ? e.start_date : min, null);
      const latest = normalizedEvents.reduce<string | null>((max, e) => !max || e.end_date > max ? e.end_date : max, null);

      const [bookingRes, blockRes] = await Promise.all([
        earliest && latest
          ? supabase.from("bookings")
              .select("id, check_in, check_out, guest_name, status")
              .eq("property_id", feed.listing_id)
              .in("status", ["confirmed", "pending"])
              .lt("check_in", latest)
              .gt("check_out", earliest)
          : Promise.resolve({ data: [] }),
        earliest && latest
          ? supabase.from("listing_blocks")
              .select("id, start_date, end_date, source, summary, reason")
              .eq("listing_id", feed.listing_id)
              .lt("start_date", latest)
              .gt("end_date", earliest)
              .neq("source", `${feed.provider}_import`)
          : Promise.resolve({ data: [] }),
      ]);

      const conflicts: ImportConflict[] = [];
      const importableEvents = normalizedEvents.filter(e => {
        const booking = (bookingRes.data || []).find((b: any) => rangesOverlap(e.start_date, e.end_date, b.check_in, b.check_out));
        if (booking) {
          conflicts.push({
            uid: e.uid,
            provider: feed.provider,
            summary: e.summary,
            start_date: e.start_date,
            end_date: e.end_date,
            conflict_type: "booking",
            conflict_id: booking.id,
            conflict_summary: `${booking.guest_name || "Booking"} (${booking.status || "unknown"})`,
          });
          return false;
        }

        const block = (blockRes.data || []).find((b: any) => rangesOverlap(e.start_date, e.end_date, b.start_date, b.end_date));
        if (block) {
          conflicts.push({
            uid: e.uid,
            provider: feed.provider,
            summary: e.summary,
            start_date: e.start_date,
            end_date: e.end_date,
            conflict_type: "block",
            conflict_id: block.id,
            conflict_summary: block.summary || block.reason || block.source || "Blokering",
          });
          return false;
        }

        return true;
      });

      // Delete old imports for this listing from this provider, then insert fresh
      await supabase.from("listing_blocks").delete()
        .eq("listing_id", feed.listing_id)
        .eq("source", `${feed.provider}_import`);

      const blocks = importableEvents.map(e => ({
        listing_id: feed.listing_id,
        owner_id: feed.owner_id,
        start_date: e.start_date,
        end_date: e.end_date,
        source: `${feed.provider}_import`,
        external_uid: e.uid,
        summary: e.summary,
      }));

      if (blocks.length > 0) {
        const { error } = await supabase.from("listing_blocks").insert(blocks);
        if (error) throw new Error(error.message);
      }

      const nextConfig = {
        ...((feed.config && typeof feed.config === "object") ? feed.config : {}),
        last_import_count: blocks.length,
        last_skipped_count: conflicts.length,
        last_conflicts: conflicts,
        last_conflict_at: conflicts.length > 0 ? new Date().toISOString() : null,
        last_error: null,
      };

      await supabase.from("sync_settings").update({
        last_synced_at: new Date().toISOString(),
        config: nextConfig,
      }).eq("id", feed.id);

      results[feed.id] = {
        status: conflicts.length > 0 ? "success_with_conflicts" : "success",
        count: events.length,
        imported: blocks.length,
        skipped: conflicts.length,
        conflicts,
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      await supabase.from("sync_settings").update({
        config: {
          ...((feed.config && typeof feed.config === "object") ? feed.config : {}),
          last_error: msg,
          last_error_at: new Date().toISOString(),
        },
      }).eq("id", feed.id);
      results[feed.id] = { status: "error", count: 0, error: msg };
    }
  }

  return new Response(JSON.stringify({ results }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } });
});
