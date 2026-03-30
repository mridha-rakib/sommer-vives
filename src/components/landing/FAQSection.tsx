import { motion } from 'framer-motion';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const faqs = [
  { q: 'Hvordan kommer jeg i gang?', a: 'Det tager fem minutter at oprette din bolig online. Vi tager kontakt bagefter med en personlig rådgiver, der hjælper dig resten af vejen — fra billeder til publicering.' },
  { q: 'Hvad koster det?', a: 'Oprettelse er gratis. Vi tager 15 % af gennemførte bookinger. Gæsten betaler et servicegebyr på 5 %. Ingen opstartsgebyrer, ingen skjulte omkostninger.' },
  { q: 'Hvorfor har I en 6-måneders aftale?', a: 'Fordi vi investerer tid i professionelle billeder, listingopsætning og markedsføring fra dag ét. Aftalen sikrer, at vi begge får det bedste ud af samarbejdet. Herefter er du fri til at opsige.' },
  { q: 'Hvad med fotografering og tekst?', a: 'Vi sørger for professionelt visuelt indhold og velskrevet tekst, der får din bolig til at skille sig ud. Alt er inkluderet i samarbejdet.' },
  { q: 'Kan jeg selv bruge mit hus?', a: 'Helt naturligt. Du blokerer de perioder, du selv vil bruge huset, direkte i din ejerportal. Du bestemmer altid.' },
  { q: 'Hvor bliver mit hus vist?', a: 'Vi publicerer på Airbnb, Booking.com, Vrbo og vores egne kanaler — og markedsfører aktivt via sociale medier og nyhedsbreve for at skabe reel synlighed.' },
  { q: 'Får jeg det fulde bundfradrag?', a: 'Ja. SommerVibes er registreret som udlejningsbureau, så du har adgang til det fulde skattefrie bundfradrag på 50.200 kr. om året.' },
  { q: 'Må jeg også udleje andre steder?', a: 'Ja. Din bolig er din. Vi kan endda hjælpe med at koordinere kalenderen, så du undgår dobbeltbookinger.' },
  { q: 'Hvordan fungerer rengøring?', a: 'Vi koordinerer slutrengøring med lokale samarbejdspartnere. Gæstens pris inkluderer altid rengøringsgebyr, så du aldrig selv står med det.' },
  { q: 'Hvad dækker forsikringen?', a: 'Vores udlejningsforsikring dækker pludselige og uforudsete skader, der opstår under gæstens ophold. Du kan læse vilkårene i din aftale.' },
];

export function FAQSection() {
  const { ref, isInView } = useScrollReveal();

  return (
    <section ref={ref} id="faq" className="py-28 md:py-36 bg-background overflow-hidden">
      <div className="container mx-auto px-4 md:px-8">
        <div className="max-w-5xl mx-auto grid lg:grid-cols-[1fr_1.5fr] gap-16 items-start">
          {/* Left sticky header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7 }}
            className="lg:sticky lg:top-32"
          >
            <span className="text-primary font-body text-sm font-semibold tracking-[0.3em] uppercase block mb-4">
              FAQ
            </span>
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-foreground leading-tight">
              Spørgsmål{' '}
              <span className="text-primary italic font-normal block">& svar</span>
            </h2>
            <p className="text-muted-foreground mt-4 leading-relaxed">
              Find svar på de mest stillede spørgsmål om udlejning med SommerVibes.
            </p>
          </motion.div>

          {/* Right accordion */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Accordion type="single" collapsible className="space-y-1">
              {faqs.map((faq, i) => (
                <AccordionItem
                  key={i}
                  value={`faq-${i}`}
                  className="border-b border-border/40 last:border-0 data-[state=open]:border-primary/10"
                >
                  <AccordionTrigger className="text-left font-display font-semibold text-foreground hover:no-underline hover:text-primary transition-colors py-5 text-base">
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground pb-5 leading-relaxed">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
