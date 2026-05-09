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
    const { property, type } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    let systemPrompt = "";
    let userPrompt = "";

    if (type === "pricing") {
      systemPrompt = `Du er en ekspert i dansk sommerhusudlejning og prissætning. 
Analyser ejendommen og giv konkrete prisanbefalinger baseret på:
- Beliggenhed og region
- Kapacitet og faciliteter
- Sæsonudsving i Danmark
- Markedstendenser

Svar ALTID på dansk. Vær konkret med tal og procenter.`;

      userPrompt = `Analyser dette sommerhus og giv prisanbefalinger:

Titel: ${property.title}
Region: ${property.region}
Kapacitet: ${property.capacity} personer
Soveværelser: ${property.bedrooms}
Badeværelser: ${property.bathrooms}
Nuværende pris/nat: ${property.price_per_night || 'Ikke sat'} kr
Nuværende pris/uge: ${property.price_per_week || 'Ikke sat'} kr
Faciliteter: ${property.amenities?.join(', ') || 'Ingen angivet'}

Giv venligst:
1. Anbefalet basispris pr. nat (lavsæson)
2. Anbefalet højsæsonpris (sommer, jul, påske)
3. Anbefalede weekendtillæg
4. Minimum antal nætter per sæson
5. Kort begrundelse for anbefalingerne`;

    } else if (type === "improvements") {
      systemPrompt = `Du er en ekspert i at optimere sommerhusannoncer for maksimal udlejning.
Analyser ejendommen og giv konkrete forbedringsforslag der kan:
- Øge bookingrate
- Retfærdiggøre højere priser
- Forbedre gæsteoplevelsen

Svar ALTID på dansk. Vær konkret og handlingsorienteret.`;

      userPrompt = `Analyser dette sommerhus og giv forbedringsforslag:

Titel: ${property.title}
Beskrivelse: ${property.description || 'Ingen beskrivelse'}
Region: ${property.region}
Kapacitet: ${property.capacity} personer
Soveværelser: ${property.bedrooms}
Badeværelser: ${property.bathrooms}
Faciliteter: ${property.amenities?.join(', ') || 'Ingen angivet'}
Husregler: ${property.house_rules || 'Ingen angivet'}
Antal billeder: ${property.images?.length || 0}

Giv venligst:
1. 3-5 konkrete forbedringsforslag (faciliteter, indretning)
2. Tips til at forbedre annonceteksten
3. Forslag til bedre billeder
4. Hvilke tilkøbspakker der ville give mest værdi
5. Potentiel indkomststigning ved implementering`;
    }

    console.log(`Generating ${type} recommendations for property: ${property.title}`);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "For mange forespørgsler. Prøv igen om lidt." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI-tjenesten er midlertidigt utilgængelig." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const recommendation = data.choices?.[0]?.message?.content || "Kunne ikke generere anbefalinger.";

    console.log(`Successfully generated ${type} recommendations`);

    return new Response(JSON.stringify({ recommendation }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in property-ai-recommendations:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
