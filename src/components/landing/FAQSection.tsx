import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const faqsLeft = [
  {
    q: 'Hvordan bliver jeg en del af SommerVibes?',
    a: 'Del lidt information om dit sommerhus og send billeder til os. Vi vurderer dit hus, ringer til dig for en snak, og skræddersyr derefter din profil. Så snart profilen er klar, kan du prissætte og opdatere din kalender.',
  },
  {
    q: 'Hvordan foregår det med fotografering?',
    a: 'Dit sommerhus skal se fantastisk ud. Vi vejleder dig i at tage gode billeder og hjælper med redigering. Du kan også bestille professionel fotografering til særlig pris.',
  },
  {
    q: 'Hvor og hvordan bliver mit sommerhus markedsført?',
    a: 'SommerVibes er mere end en platform. Vi markedsfører på sociale medier, nyhedsbreve og partnerkanaler. Du kan også aktivere udvidet markedsføring for at nå flere gæster.',
  },
  {
    q: 'Kan jeg stadig selv bruge mit sommerhus?',
    a: 'Selvfølgelig! Du bestemmer selv hvornår du vil dele dit sommerhus med andre. Bloker datoer for eget brug direkte i din ejerportal.',
  },
  {
    q: 'Må jeg udleje på andre platforme samtidigt?',
    a: 'Ja, det står dig frit for. Du kan endda markedsføre dit hus på andre platforme gennem SommerVibes, så du får flere forespørgsler uden at administrere flere profiler.',
  },
  {
    q: 'Hvad med rengøring og alt det praktiske?',
    a: 'Gæstens pris inkluderer altid slutrengøring. Enten står du selv for det, eller vi koordinerer med professionelle lokale partnere.',
  },
  {
    q: 'Hvad koster det at bruge jer?',
    a: 'Gratis at oprette dig. Du betaler kun 15% kommission ved gennemførte bookinger. Gæster betaler 5% servicegebyr. Ingen skjulte gebyrer.',
  },
];

const faqsRight = [
  {
    q: 'Får jeg adgang til det fulde bundfradrag?',
    a: 'Ja! SommerVibes er registreret som udlejningsbureau, så du har adgang til det fulde bundfradrag på 50.200 DKK (2026) for sommerhusudlejning.',
  },
  {
    q: 'Hvad bør mit sommerhus koste?',
    a: 'Du bestemmer selv prisen, men vi hjælper gerne. Vi har værktøjer der hjælper med dynamisk prissætning efter årstiderne og markedsefterspørgsel.',
  },
  {
    q: 'Hvordan afregnes forbrug?',
    a: 'Prisen inkluderer altid forbrug af vand, varme og el. Vi arbejder med gennemsnitspriser, så det er fair for både dig og gæsten.',
  },
  {
    q: 'Hvordan er jeg forsikret?',
    a: 'Vi har forsikring der dækker pludselige og uforudsete skader under lejeperioden, som ikke er dækket af din sommerhusforsikring.',
  },
  {
    q: 'Hvor kan jeg finde vilkårene?',
    a: 'Alle vilkår og betingelser er tilgængelige på vores hjemmeside. Du kan altid kontakte os for en personlig gennemgang.',
  },
  {
    q: 'Er der binding?',
    a: 'Nej, ingen bindingsperiode. Du kan opsige samarbejdet når som helst uden varsel.',
  },
];

export function FAQSection() {
  return (
    <section id="faq" className="py-20 md:py-28 bg-background">
      <div className="container mx-auto px-4 md:px-8 max-w-6xl">
        <h2 className="font-display text-3xl md:text-4xl font-bold text-primary mb-12">
          Spørgsmål & svar
        </h2>

        <div className="grid md:grid-cols-2 gap-x-12">
          {/* Left column */}
          <Accordion type="single" collapsible>
            {faqsLeft.map((faq, i) => (
              <AccordionItem key={i} value={`left-${i}`} className="border-b border-border">
                <AccordionTrigger className="text-left font-medium text-primary hover:no-underline py-5 text-base">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-5 leading-relaxed">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          {/* Right column */}
          <Accordion type="single" collapsible>
            {faqsRight.map((faq, i) => (
              <AccordionItem key={i} value={`right-${i}`} className="border-b border-border">
                <AccordionTrigger className="text-left font-medium text-primary hover:no-underline py-5 text-base">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-5 leading-relaxed">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
