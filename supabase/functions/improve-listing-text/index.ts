import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { listing } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `Du er en ekspert i at skrive premium boligannoncetekster til dansk sommerhusudlejning.
Du modtager data om en bolig og skal forbedre teksten så den er:
- Professionel og konverteringsorienteret
- Lokker med oplevelser, ikke bare facts
- Bruger sansende og levende sprog
- Passer til et dansk premium-segment

Svar i JSON med denne struktur:
{
  "title": "forbedret offentlig titel",
  "tagline": "kort tagline (max 80 tegn)",
  "description": "kort beskrivelse (2-3 sætninger)",
  "long_description": "detaljeret beskrivelse (4-6 sætninger)",
  "highlights": ["highlight 1", "highlight 2", "highlight 3", "highlight 4", "highlight 5"]
}

Svar KUN med valid JSON, ingen markdown.`;

    const userPrompt = `Forbedr teksten for denne listing:

Navn: ${listing.name}
Nuværende titel: ${listing.description || 'Ingen'}
Tagline: ${listing.tagline || 'Ingen'}
Lang beskrivelse: ${listing.long_description || 'Ingen'}
Region: ${listing.region || 'Ukendt'}
Max gæster: ${listing.max_guests || '?'}
Soveværelser: ${listing.bedrooms || '?'}
Badeværelser: ${listing.bathrooms || '?'}
m²: ${listing.sqm || '?'}
Faciliteter: ${(listing.amenities || []).join(', ') || 'Ingen'}
Nuværende highlights: ${(listing.highlights || []).join(', ') || 'Ingen'}
Boligtype: ${listing.property_type || 'sommerhus'}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "For mange forespørgsler. Prøv igen om lidt." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI-tjenesten er midlertidigt utilgængelig." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content || "";
    
    // Parse JSON from response, handling potential markdown wrapping
    let improved;
    try {
      const jsonStr = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      improved = JSON.parse(jsonStr);
    } catch {
      throw new Error("Could not parse AI response as JSON");
    }

    return new Response(JSON.stringify({ improved }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in improve-listing-text:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
