import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@18.5.0";

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

async function getActor(req: Request) {
  const authHeader = req.headers.get("Authorization") || "";
  if (!authHeader) return { user: null, roles: [] as string[] };

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

  return { user, roles: (roles || []).map((r: { role: string }) => r.role) };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "POST required" }, 405);

  const { bookingId, amount, successUrl, cancelUrl } = await req.json();
  if (!bookingId) return json({ error: "bookingId required" }, 400);

  const { user, roles } = await getActor(req);
  if (!user) return json({ error: "Authentication required" }, 401);

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: booking, error } = await supabase
    .from("bookings")
    .select("*, properties:property_id(title)")
    .eq("id", bookingId)
    .single();

  if (error || !booking) return json({ error: "Booking not found" }, 404);

  const isAdmin = roles.includes("admin") || roles.includes("super_admin");
  const isOwner = booking.owner_id === user.id;
  const isGuest = String(booking.guest_email || "").toLowerCase() === String(user.email || "").toLowerCase();
  if (!isAdmin && !isOwner && !isGuest) return json({ error: "Not allowed" }, 403);

  const remaining = Math.max(0, Math.round(Number(booking.amount_remaining || 0)));
  const requestedAmount = amount === undefined || amount === null ? remaining : Math.round(Number(amount));
  if (!Number.isFinite(requestedAmount) || requestedAmount <= 0) {
    return json({ error: "No outstanding amount to pay" }, 400);
  }
  if (requestedAmount > remaining) {
    return json({ error: "Payment amount exceeds outstanding balance" }, 400);
  }

  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
  if (!stripeKey) return json({ error: "Stripe not configured" }, 500);

  const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
  const origin = req.headers.get("origin") || Deno.env.get("SITE_URL") || Deno.env.get("VITE_SITE_URL") || "https://sommervibes.dk";
  const bookingLabel = booking.case_number || booking.id;
  const propertyName = booking.properties?.title || "SommerVibes booking";

  const session = await stripe.checkout.sessions.create({
    customer_email: booking.guest_email || undefined,
    line_items: [{
      price_data: {
        currency: String(booking.currency || "dkk").toLowerCase(),
        product_data: {
          name: `Restbetaling - ${propertyName}`,
          description: `Booking ${bookingLabel}`,
        },
        unit_amount: requestedAmount,
      },
      quantity: 1,
    }],
    mode: "payment",
    client_reference_id: booking.id,
    success_url: successUrl || `${origin}/guest/payment?booking_id=${booking.id}&payment=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: cancelUrl || `${origin}/guest/payment?booking_id=${booking.id}&payment=cancelled`,
    metadata: {
      booking_id: booking.id,
      source: "guest_balance_payment",
      payment_kind: requestedAmount < remaining ? "partial" : "remaining_balance",
      outstanding_before: String(remaining),
    },
  });

  if (!session.url) return json({ error: "Stripe did not return a checkout URL" }, 502);

  await supabase.from("bookings").update({
    stripe_session_id: session.id,
    payment_status: Number(booking.amount_paid || 0) > 0 ? "partially_paid" : "pending",
  }).eq("id", booking.id);

  await supabase.from("payments").insert({
    booking_id: booking.id,
    owner_id: booking.owner_id,
    amount: requestedAmount,
    currency: String(booking.currency || "DKK").toUpperCase(),
    status: "pending",
    payment_method: "stripe",
    stripe_checkout_session_id: session.id,
    note: requestedAmount < remaining ? "Stripe delbetaling oprettet" : "Stripe restbetaling oprettet",
  });

  return json({ success: true, checkout_url: session.url, session_id: session.id, amount: requestedAmount });
});
