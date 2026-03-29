import { motion } from 'framer-motion';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const faqs = [
  { q: 'Hvordan kommer jeg i gang?', a: 'Del lidt information om dit sommerhus online — det tager 5 minutter. Eller ring til os, så kører vi ud og laver et gratis udlejningstjek af dit hus.' },
  { q: 'Hvad koster det?', a: 'Gratis at oprette dig. Du betaler kun 15% kommission ved gennemførte bookinger. Gæster betaler 5% servicegebyr. Ingen skjulte gebyrer.' },
  { q: 'Er der bindingsperiode?', a: 'Ja, 6 måneders binding for at sikre tryghed for begge parter. Herefter kan du opsige når du vil.' },
  { q: 'Hvad med fotografering?', a: 'Vi hjælper med professionelt indhold der skaber bookinger. Vi vejleder dig og tilbyder professionel fotografering.' },
  { q: 'Kan jeg selv bruge mit sommerhus?', a: 'Selvfølgelig! Du bestemmer selv hvornår du vil dele dit sommerhus. Bloker datoer direkte i din ejerportal.' },
  { q: 'Hvordan bliver mit hus markedsført?', a: 'Vi markedsfører på sociale medier, nyhedsbreve, partnerkanaler og de største udlejningsportaler.' },
  { q: 'Får jeg det fulde bundfradrag?', a: 'Ja! SommerVibes er registreret som udlejningsbureau, så du har adgang til det fulde bundfradrag på 50.200 kr.' },
  { q: 'Må jeg udleje på andre platforme?', a: 'Ja, det står dig frit for. Vi kan endda koordinere det for dig.' },
  { q: 'Hvad med rengøring?', a: 'Gæstens pris inkluderer altid slutrengøring. Du kan selv stå for det eller vi koordinerer med professionelle partnere.' },
  { q: 'Hvordan er forsikringen?', a: 'Vi har forsikring der dækker pludselige og uforudsete skader under lejeperioden.' },
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
            <span className="text-accent font-body text-sm font-semibold tracking-[0.3em] uppercase block mb-4">
              FAQ
            </span>
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-primary leading-tight">
              Spørgsmål{' '}
              <span className="text-accent italic font-normal block">& svar</span>
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
                  className="border-b border-border/40 last:border-0 data-[state=open]:border-accent/10"
                >
                  <AccordionTrigger className="text-left font-display font-semibold text-primary hover:no-underline hover:text-accent transition-colors py-5 text-base">
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
