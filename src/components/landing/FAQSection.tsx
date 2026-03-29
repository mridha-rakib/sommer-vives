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
      <div className="container mx-auto px-4 md:px-8 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center mb-16 md:mb-20"
        >
          <span className="text-accent font-body text-sm font-semibold tracking-[0.3em] uppercase block mb-4">
            FAQ
          </span>
          <h2 className="font-display text-3xl md:text-5xl lg:text-6xl font-bold text-primary">
            Spørgsmål & svar
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Accordion type="single" collapsible className="space-y-2">
            {faqs.map((faq, i) => (
              <AccordionItem
                key={i}
                value={`faq-${i}`}
                className="bg-card rounded-xl border border-border px-6 data-[state=open]:shadow-soft data-[state=open]:border-accent/15 transition-all"
              >
                <AccordionTrigger className="text-left font-display font-semibold text-primary hover:no-underline py-5 text-base md:text-lg">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-5 leading-relaxed text-base">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
}
