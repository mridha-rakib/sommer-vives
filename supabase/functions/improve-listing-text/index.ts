import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type ActionType =
  | 'improve_title'
  | 'improve_description'
  | 'improve_long_description'
  | 'generate_highlights'
  | 'channel_airbnb'
  | 'channel_booking'
  | 'channel_vrbo'
  | 'translate_en'
  | 'translate_de'
  | 'improve_all'; // legacy

const SOMMERVIBES_TONE = `Du skriver for SommerVibes – en premium dansk sommerhusudlejningsplatform.
Tonen er:
- Premium og professionel, men varm og nede på jorden
- Sanseligt og levende sprog der maler billeder
- Fokuseret på oplevelser, følelser og "drømmeferie"-appel
- Aldrig generisk, cheesy eller overdrevet corporate
- Altid autentisk og troværdig
- "Vi"-form, som et moderne bureau`;

function buildPrompt(action: ActionType, listing: any): { system: string; user: string } {
  const base = `Bolig: ${listing.name}
Region: ${listing.region || 'Ukendt'}
Type: ${listing.property_type || 'sommerhus'}
Max gæster: ${listing.max_guests || '?'}, Soveværelser: ${listing.bedrooms || '?'}, Bad: ${listing.bathrooms || '?'}, m²: ${listing.sqm || '?'}
Faciliteter: ${(listing.amenities || []).join(', ') || 'Ingen angivet'}
Nuværende titel: ${listing.description || 'Ingen'}
Tagline: ${listing.tagline || 'Ingen'}
Lang beskrivelse: ${listing.long_description || 'Ingen'}
Om boligen: ${listing.about_property || 'Ingen'}
Om området: ${listing.about_area || 'Ingen'}
Highlights: ${(listing.highlights || []).join(', ') || 'Ingen'}
Husregler: ${listing.house_rules || 'Ingen'}
Check-in: ${listing.check_in_time || '?'}, Check-out: ${listing.check_out_time || '?'}`;

  switch (action) {
    case 'improve_title':
      return {
        system: `${SOMMERVIBES_TONE}\n\nDu forbedrer titler for ferieboliger. Skriv 3 forslag til en fængende offentlig titel.
Svar KUN med valid JSON: { "suggestions": ["titel 1", "titel 2", "titel 3"] }`,
        user: `Forbedr titlen for denne listing:\n\n${base}`,
      };

    case 'improve_description':
      return {
        system: `${SOMMERVIBES_TONE}\n\nDu forbedrer korte beskrivelser (2-3 sætninger) til listing-kort og søgeresultater.
Svar KUN med valid JSON: { "description": "den forbedrede korte beskrivelse" }`,
        user: `Forbedr den korte beskrivelse:\n\n${base}`,
      };

    case 'improve_long_description':
      return {
        system: `${SOMMERVIBES_TONE}\n\nDu skriver detaljerede boligbeskrivelser (5-8 sætninger med afsnit). Mal et billede af oplevelsen.
Svar KUN med valid JSON: { "long_description": "den forbedrede lange beskrivelse" }`,
        user: `Forbedr den lange beskrivelse:\n\n${base}`,
      };

    case 'generate_highlights':
      return {
        system: `${SOMMERVIBES_TONE}\n\nDu genererer 5-7 highlights der fremhæver boligens bedste egenskaber. Korte, punchy og oplevelsesbaserede.
Svar KUN med valid JSON: { "highlights": ["highlight 1", "highlight 2", ...] }`,
        user: `Generér highlights for:\n\n${base}`,
      };

    case 'channel_airbnb':
      return {
        system: `${SOMMERVIBES_TONE}\n\nDu er specialist i Airbnb-annoncer. Skriv optimeret indhold til Airbnb-platformen:
- Titel: max 50 tegn, fængende og søgbar
- Beskrivelse: Oplevelsesbaseret, personlig, 4-6 sætninger
- Highlights: 5 stk, korte og Airbnb-venlige
- Husregler: Klare, venlige regler
- Check-in noter: Praktisk og imødekommende

Svar KUN med valid JSON:
{
  "title": "Airbnb-titel",
  "description": "Airbnb-beskrivelse",
  "highlights": ["h1", "h2", "h3", "h4", "h5"],
  "house_rules": "husregler",
  "checkin_notes": "check-in noter"
}`,
        user: `Generér Airbnb-optimeret indhold for:\n\n${base}`,
      };

    case 'channel_booking':
      return {
        system: `${SOMMERVIBES_TONE}\n\nDu er specialist i Booking.com-annoncer. Skriv optimeret indhold:
- Titel: Klar og beskrivende, max 70 tegn
- Beskrivelse: Faktuel men tiltalende, 4-6 sætninger
- Værelseopsætning: Kort beskrivelse af soverum
- Politikker: Aflysning/betaling kort
- Check-in/out info: Praktisk og tydeligt

Svar KUN med valid JSON:
{
  "title": "Booking.com-titel",
  "description": "Booking-beskrivelse",
  "room_setup": "værelseopsætning",
  "policies": "politikker",
  "checkin_checkout": "check-in/out info"
}`,
        user: `Generér Booking.com-optimeret indhold for:\n\n${base}`,
      };

    case 'channel_vrbo':
      return {
        system: `${SOMMERVIBES_TONE}\n\nDu er specialist i Vrbo-annoncer. Skriv optimeret indhold til familievenlig feriebolig-platform:
- Titel: Klar og appellerende, max 80 tegn
- Beskrivelse: Familiefokuseret, 4-6 sætninger
- Highlights: 5 stk, fokus på faciliteter og plads
- Regler: Klare og imødekommende

Svar KUN med valid JSON:
{
  "title": "Vrbo-titel",
  "description": "Vrbo-beskrivelse",
  "highlights": ["h1", "h2", "h3", "h4", "h5"],
  "rules": "husregler"
}`,
        user: `Generér Vrbo-optimeret indhold for:\n\n${base}`,
      };

    case 'translate_en':
      return {
        system: `You are a premium vacation rental copywriter. Translate the listing content to English while maintaining the premium, warm, experience-focused SommerVibes tone.
Reply ONLY with valid JSON:
{
  "title": "English title",
  "tagline": "English tagline",
  "description": "English short description",
  "long_description": "English long description",
  "highlights": ["h1", "h2", "h3", "h4", "h5"]
}`,
        user: `Translate this Danish vacation rental listing to English:\n\n${base}`,
      };

    case 'translate_de':
      return {
        system: `Du bist ein Premium-Ferienhaustexter. Übersetze den Listing-Inhalt ins Deutsche und bewahre dabei den hochwertigen, warmen, erlebnisorientierten SommerVibes-Ton.
Antworte NUR mit gültigem JSON:
{
  "title": "German title",
  "tagline": "German tagline",
  "description": "German short description",
  "long_description": "German long description",
  "highlights": ["h1", "h2", "h3", "h4", "h5"]
}`,
        user: `Übersetze dieses dänische Ferienhaus-Listing ins Deutsche:\n\n${base}`,
      };

    case 'improve_all':
    default:
      return {
        system: `${SOMMERVIBES_TONE}\n\nDu forbedrer samtlige tekster for en feriebolig-listing.
Svar KUN med valid JSON:
{
  "title": "forbedret offentlig titel",
  "tagline": "kort tagline (max 80 tegn)",
  "description": "kort beskrivelse (2-3 sætninger)",
  "long_description": "detaljeret beskrivelse (5-8 sætninger)",
  "highlights": ["h1", "h2", "h3", "h4", "h5"]
}`,
        user: `Forbedr teksten for denne listing:\n\n${base}`,
      };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { listing, action = 'improve_all' } = await req.json();
    if (!listing) {
      return new Response(JSON.stringify({ error: "Missing listing data" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const { system, user } = buildPrompt(action as ActionType, listing);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
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
        return new Response(JSON.stringify({ error: "AI-tjenesten kræver ekstra credits." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content || "";

    let improved;
    try {
      const jsonStr = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      improved = JSON.parse(jsonStr);
    } catch {
      throw new Error("Could not parse AI response as JSON");
    }

    return new Response(JSON.stringify({ improved, action }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in improve-listing-text:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
