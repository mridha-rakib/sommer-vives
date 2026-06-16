import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function normalizeRef(value: string) {
  return value.trim().toUpperCase().replace(/\s+/g, "");
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "POST required" }, 405);

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      return json({ error: "Backend not configured" }, 500);
    }

    const authHeader = req.headers.get("Authorization") || "";
    if (!authHeader) return json({ error: "Not authenticated" }, 401);

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: userData, error: userError } = await userClient.auth.getUser();
    if (userError || !userData.user) return json({ error: "Not authenticated" }, 401);
    const user = userData.user;
    const userEmail = (user.email || "").toLowerCase();
    if (!userEmail) return json({ error: "No email on account" }, 400);

    const body = await req.json().catch(() => ({}));
    const reference = typeof body.reference === "string" ? normalizeRef(body.reference) : "";
    const bookingEmail = typeof body.booking_email === "string" ? normalizeEmail(body.booking_email) : "";
    if (!reference) return json({ error: "Enter your booking reference" }, 400);
    if (!bookingEmail) return json({ error: "Enter the email used at booking" }, 400);

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // Find by case_number first, then by id prefix as fallback
    let { data: byCase } = await admin
      .from("bookings")
      .select("id, case_number, guest_email, status")
      .eq("case_number", reference)
      .maybeSingle();

    if (!byCase) {
      const { data: byId } = await admin
        .from("bookings")
        .select("id, case_number, guest_email, status")
        .ilike("id", `${reference.toLowerCase()}%`)
        .limit(2);
      if (byId && byId.length === 1) byCase = byId[0] as typeof byCase;
    }

    if (!byCase) return json({ error: "We could not find a booking with that reference" }, 404);

    const onBookingEmail = (byCase.guest_email || "").toLowerCase();
    if (onBookingEmail !== bookingEmail) {
      return json({ error: "Reference and email do not match" }, 403);
    }

    if (onBookingEmail !== userEmail) {
      const { error: updateError } = await admin
        .from("bookings")
        .update({ guest_email: userEmail })
        .eq("id", byCase.id);
      if (updateError) {
        console.error("[GUEST-LINK-BOOKING] update error:", updateError.message);
        return json({ error: "Unable to link booking" }, 500);
      }
    }

    return json({ success: true, booking_id: byCase.id, case_number: byCase.case_number });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Something went wrong";
    console.error("[GUEST-LINK-BOOKING]", message);
    return json({ error: message }, 500);
  }
});
