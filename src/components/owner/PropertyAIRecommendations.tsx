import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sparkles, TrendingUp, Lightbulb, Loader2, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';

interface Property {
  id: string;
  title: string;
  description?: string | null;
  region: string;
  capacity: number;
  bedrooms: number | null;
  bathrooms: number | null;
  price_per_night?: number | null;
  price_per_week?: number | null;
  amenities?: string[] | null;
  house_rules?: string | null;
  images?: string[] | null;
}

interface PropertyAIRecommendationsProps {
  property: Property;
}

function getFallbackRecommendation(property: Property, type: 'pricing' | 'improvements') {
  const nightlyPrice = Number(property.price_per_night || 0);
  const weeklyPrice = Number(property.price_per_week || 0);
  const lowSeason = nightlyPrice || Math.max(750, property.capacity * 175);
  const highSeason = Math.round(lowSeason * 1.35);
  const weekend = Math.round(lowSeason * 1.15);
  const photoCount = property.images?.length || 0;
  const amenities = property.amenities || [];

  if (type === 'pricing') {
    return [
      '### Prisstrategi',
      `- Basispris: ca. ${lowSeason.toLocaleString('da-DK')} kr. pr. nat i lavsæson.`,
      `- Højsæson: ca. ${highSeason.toLocaleString('da-DK')} kr. pr. nat for sommer, påske og jul.`,
      `- Weekend: ca. ${weekend.toLocaleString('da-DK')} kr. pr. nat fredag/lørdag.`,
      `- Minimum ophold: 2 nætter udenfor sæson og 5-7 nætter i højsæson.`,
      weeklyPrice > 0
        ? `- Ugepris er sat til ${weeklyPrice.toLocaleString('da-DK')} kr.; hold den op mod natpris x 7, så rabatten er tydelig.`
        : '- Overvej en ugepris med 8-12 % rabat for at løfte længere ophold.',
    ].join('\n');
  }

  return [
    '### Forbedringsforslag',
    photoCount < 10
      ? `- Tilføj flere billeder. Der er ${photoCount} nu; sigt efter mindst 10-15 billeder med udeområde, køkken, bad og sovepladser.`
      : '- Billedegrundlaget ser solidt ud; prioriter et klart hero-billede og god rækkefølge.',
    property.description && property.description.length >= 100
      ? '- Beskrivelsen er brugbar; gør de første 2 linjer mere konkrete omkring beliggenhed og oplevelse.'
      : '- Udbyg beskrivelsen med beliggenhed, stemning, sovefordeling og de vigtigste praktiske detaljer.',
    amenities.length > 0
      ? `- Fremhæv de stærkeste faciliteter tidligt: ${amenities.slice(0, 4).join(', ')}.`
      : '- Tilføj faciliteter, så gæster kan filtrere og forstå værdien hurtigere.',
    '- Gennemgå husregler og check-in-info, så gæsten kan booke uden ekstra spørgsmål.',
  ].join('\n');
}

export function PropertyAIRecommendations({ property }: PropertyAIRecommendationsProps) {
  const [pricingRecommendation, setPricingRecommendation] = useState<string | null>(null);
  const [improvementsRecommendation, setImprovementsRecommendation] = useState<string | null>(null);
  const [loadingPricing, setLoadingPricing] = useState(false);
  const [loadingImprovements, setLoadingImprovements] = useState(false);

  const fetchRecommendation = async (type: 'pricing' | 'improvements') => {
    const setLoading = type === 'pricing' ? setLoadingPricing : setLoadingImprovements;
    const setRecommendation = type === 'pricing' ? setPricingRecommendation : setImprovementsRecommendation;

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('property-ai-recommendations', {
        body: { property, type },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setRecommendation(data.recommendation || getFallbackRecommendation(property, type));
    } catch (err: any) {
      console.error('AI recommendation error:', err);
      setRecommendation(getFallbackRecommendation(property, type));
      toast.error(err.message || 'Kunne ikke hente anbefalinger. Prøv igen.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-accent/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-accent" />
          AI Anbefalinger
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="pricing" className="space-y-4">
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="pricing" className="gap-2">
              <TrendingUp className="w-4 h-4" />
              Prisstrategi
            </TabsTrigger>
            <TabsTrigger value="improvements" className="gap-2">
              <Lightbulb className="w-4 h-4" />
              Forbedringer
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pricing" className="space-y-4">
            {pricingRecommendation ? (
              <div className="space-y-4">
                <div className="prose prose-sm max-w-none bg-muted/50 rounded-lg p-4">
                  <ReactMarkdown>{pricingRecommendation}</ReactMarkdown>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => fetchRecommendation('pricing')}
                  disabled={loadingPricing}
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${loadingPricing ? 'animate-spin' : ''}`} />
                  Generer nye anbefalinger
                </Button>
              </div>
            ) : (
              <div className="text-center py-8">
                <TrendingUp className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">
                  Få AI-drevne prisanbefalinger baseret på dit sommerhus' karakteristika og markedet.
                </p>
                <Button 
                  onClick={() => fetchRecommendation('pricing')}
                  disabled={loadingPricing}
                  variant="gold"
                >
                  {loadingPricing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Analyserer...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Få prisanbefalinger
                    </>
                  )}
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="improvements" className="space-y-4">
            {improvementsRecommendation ? (
              <div className="space-y-4">
                <div className="prose prose-sm max-w-none bg-muted/50 rounded-lg p-4">
                  <ReactMarkdown>{improvementsRecommendation}</ReactMarkdown>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => fetchRecommendation('improvements')}
                  disabled={loadingImprovements}
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${loadingImprovements ? 'animate-spin' : ''}`} />
                  Generer nye forslag
                </Button>
              </div>
            ) : (
              <div className="text-center py-8">
                <Lightbulb className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">
                  Få konkrete forslag til hvordan du kan forbedre dit sommerhus og øge din udlejningsindtægt.
                </p>
                <Button 
                  onClick={() => fetchRecommendation('improvements')}
                  disabled={loadingImprovements}
                  variant="gold"
                >
                  {loadingImprovements ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Analyserer...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Få forbedringsforslag
                    </>
                  )}
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
