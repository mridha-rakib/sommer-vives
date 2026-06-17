// Returns the Stripe publishable key to the frontend at runtime.
// Publishable keys are safe to expose to the browser.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

Deno.serve((req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const publishableKey = Deno.env.get("STRIPE_PUBLISHABLE_KEY") ?? "";

  if (!publishableKey) {
    return new Response(
      JSON.stringify({ error: "STRIPE_PUBLISHABLE_KEY is not configured" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  return new Response(
    JSON.stringify({ publishableKey }),
    {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=300",
      },
    },
  );
});
