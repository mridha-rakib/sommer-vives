import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function fallbackRecommendation(property: any, type: "pricing" | "improvements") {
  const capacity = Number(property?.capacity || property?.max_guests || 4);
  const nightlyPrice = Number(property?.price_per_night || property?.base_price_per_night || 0);
  const weeklyPrice = Number(property?.price_per_week || 0);
  const lowSeason = nightlyPrice || Math.max(750, capacity * 175);
  const highSeason = Math.round(lowSeason * 1.35);
  const weekend = Math.round(lowSeason * 1.15);
  const amenities = Array.isArray(property?.amenities) ? property.amenities : [];
  const imageCount = Array.isArray(property?.images) ? property.images.length : 0;

  if (type === "pricing") {
    return [
      "### Prisstrategi",
      `- Basispris: ca. ${lowSeason.toLocaleString("da-DK")} kr. pr. nat i lavsæson.`,
      `- Højsæson: ca. ${highSeason.toLocaleString("da-DK")} kr. pr. nat i sommer, påske og jul.`,
      `- Weekend: ca. ${weekend.toLocaleString("da-DK")} kr. pr. nat fredag/lørdag.`,
      "- Minimum ophold: 2 nætter udenfor sæson og 5-7 nætter i højsæson.",
      weeklyPrice > 0
        ? `- Ugepris er sat til ${weeklyPrice.toLocaleString("da-DK")} kr.; sammenlign med natpris x 7, så rabatten er tydelig.`
        : "- Overvej en ugepris med 8-12 % rabat for at øge længere ophold.",
    ].join("\n");
  }

  return [
    "### Forbedringsforslag",
    imageCount < 10
      ? `- Tilføj flere billeder. Der er ${imageCount} nu; sigt efter mindst 10-15 billeder.`
      : "- Billedegrundlaget er solidt; prioriter hero-billede og rækkefølge.",
    property?.description && property.description.length >= 100
      ? "- Skærp de første linjer i beskrivelsen med beliggenhed, stemning og vigtigste fordel."
      : "- Udbyg beskrivelsen med beliggenhed, stemning, sovefordeling og praktiske detaljer.",
    amenities.length > 0
      ? `- Fremhæv de stærkeste faciliteter tidligt: ${amenities.slice(0, 4).join(", ")}.`
      : "- Tilføj faciliteter, så gæster kan filtrere og forstå værdien hurtigere.",
    "- Gennemgå husregler og check-in-info, så gæsten kan booke uden ekstra spørgsmål.",
  ].join("\n");
}

function fallbackResponse(property: any, type: "pricing" | "improvements", message: string, status = 200) {
  return new Response(JSON.stringify({
    recommendation: fallbackRecommendation(property, type),
    source: "fallback",
    warning: message,
  }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  let requestProperty: any = null;
  let requestType: "pricing" | "improvements" | null = null;

  try {
    const { property, type } = await req.json();
    requestProperty = property;
    if (type !== "pricing" && type !== "improvements") {
      return new Response(JSON.stringify({ error: "Invalid recommendation type" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    requestType = type;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      return fallbackResponse(property, type, "LOVABLE_API_KEY is not configured");
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
        return fallbackResponse(property, type, "For mange forespørgsler. Viser standardanbefalinger.");
      }
      if (response.status === 402) {
        return fallbackResponse(property, type, "AI-tjenesten er midlertidigt utilgængelig. Viser standardanbefalinger.");
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return fallbackResponse(property, type, "AI gateway error");
    }

    const data = await response.json();
    const recommendation = data.choices?.[0]?.message?.content || "Kunne ikke generere anbefalinger.";

    console.log(`Successfully generated ${type} recommendations`);

    return new Response(JSON.stringify({ recommendation }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in property-ai-recommendations:", error);
    if (requestProperty && requestType) {
      return fallbackResponse(requestProperty, requestType, error instanceof Error ? error.message : "Unknown error");
    }

    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : "Unknown error",
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
