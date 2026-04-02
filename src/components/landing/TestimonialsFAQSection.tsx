import { motion, AnimatePresence } from 'framer-motion';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { Star, ChevronLeft, ChevronRight, Quote } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

interface FAQItem {
  q: string;
  a: string;
}

const testimonials = [
  { name: 'Mette & Lars Sørensen', location: 'Blåvand · Premium sommerhus', quote: 'Det føles som et helt andet samarbejde end det, vi kendte fra vores tidligere bureau. Her er der en reel kontaktperson, og vi kan mærke, at de faktisk investerer i vores hus.', rating: 5, earnings: '187.000 kr./år' },
  { name: 'Thomas Nielsen', location: 'Løkken · Klassisk sommerhus', quote: 'Jeg ville have noget, der var nemt og gennemsigtigt. Det er præcis, hvad jeg fik. Udbetalingerne kommer til tiden, og jeg behøver ikke jagte nogen for at få svar.', rating: 5, earnings: '94.000 kr./år' },
  { name: 'Anne-Marie Vestergaard', location: 'Marielyst · Ekstraordinært sommerhus', quote: 'Fra billeder til prissætning — alt var håndteret, da vi gik live. Vi havde 32 ugers udlejning i første sæson. Det er svært at bede om mere.', rating: 5, earnings: '243.000 kr./år' },
];

interface TestimonialsFAQSectionProps {
  faqItems: FAQItem[];
  faqHeading?: string;
  faqSubheading?: string;
}

export function TestimonialsFAQSection({ faqItems, faqHeading, faqSubheading }: TestimonialsFAQSectionProps) {
  const { ref, isInView } = useScrollReveal();
  const { t } = useTranslation();
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setCurrent(prev => (prev + 1) % testimonials.length), 6000);
    return () => clearInterval(timer);
  }, []);

  const item = testimonials[current];

  return (
    <section ref={ref} className="py-16 md:py-28 bg-background overflow-hidden">
      <div className="container mx-auto px-4 md:px-8">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 max-w-[1140px] mx-auto items-start">

          {/* Testimonials — left */}
          <div>
            <motion.div initial={{ opacity: 0, y: 16 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.7 }}>
              <span className="text-primary font-body text-[10.5px] font-semibold tracking-[0.3em] uppercase block mb-3">{t('testimonials.eyebrow')}</span>
              <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-8">
                {t('testimonials.title')} <span className="text-primary italic font-normal">{t('testimonials.titleAccent')}</span>
              </h2>
            </motion.div>

            <div className="relative">
              <Quote className="absolute -top-2 left-0 w-10 h-10 text-primary/[0.08]" />
              <AnimatePresence mode="wait">
                <motion.div key={current} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
                  <div className="flex gap-0.5 mb-4 ml-1">
                    {Array.from({ length: item.rating }).map((_, j) => <Star key={j} className="w-3.5 h-3.5 text-primary fill-primary" />)}
                  </div>
                  <p className="font-display text-lg md:text-xl font-light text-foreground/80 leading-relaxed italic mb-6 pl-1">"{item.quote}"</p>
                  <div className="pl-1 space-y-0.5">
                    <p className="font-semibold text-foreground text-sm">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{item.location}</p>
                    <p className="font-display font-bold text-primary text-sm pt-1">{item.earnings}</p>
                  </div>
                </motion.div>
              </AnimatePresence>

              <div className="flex items-center gap-4 mt-8">
                <button onClick={() => setCurrent(prev => (prev - 1 + testimonials.length) % testimonials.length)}
                  className="w-8 h-8 rounded-full border border-border flex items-center justify-center hover:border-primary/30 hover:bg-primary/5 transition-all">
                  <ChevronLeft className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
                <div className="flex gap-1.5">
                  {testimonials.map((_, i) => (
                    <button key={i} onClick={() => setCurrent(i)}
                      className={`h-1 rounded-full transition-all duration-500 ${i === current ? 'w-6 bg-primary' : 'w-1.5 bg-border hover:bg-muted-foreground/30'}`} />
                  ))}
                </div>
                <button onClick={() => setCurrent(prev => (prev + 1) % testimonials.length)}
                  className="w-8 h-8 rounded-full border border-border flex items-center justify-center hover:border-primary/30 hover:bg-primary/5 transition-all">
                  <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              </div>
            </div>
          </div>

          {/* FAQ — right */}
          <div>
            <motion.div initial={{ opacity: 0, y: 16 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.7, delay: 0.1 }}>
              <span className="text-accent/50 font-body text-[10.5px] font-semibold tracking-[0.35em] uppercase block mb-3">FAQ</span>
              <h2 className="font-display text-2xl md:text-3xl font-bold text-primary leading-tight tracking-[-0.01em] mb-2">
                {faqHeading || t('faq.heading')}
              </h2>
              {faqSubheading && (
                <p className="text-muted-foreground/60 text-[13.5px] mb-6 leading-relaxed">{faqSubheading}</p>
              )}
            </motion.div>

            <motion.div initial={{ opacity: 0 }} animate={isInView ? { opacity: 1 } : {}} transition={{ duration: 0.6, delay: 0.3 }}>
              <Accordion type="single" collapsible className="space-y-0">
                {faqItems.map((faq, i) => (
                  <AccordionItem key={i} value={`faq-${i}`} className="border-b border-border/20 last:border-0">
                    <AccordionTrigger className="text-left font-display font-semibold text-primary/90 hover:no-underline hover:text-accent transition-colors duration-300 py-4 text-[13.5px] md:text-[14px]">
                      {faq.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground/70 pb-4 text-[13px] leading-[1.75]">
                      {faq.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </motion.div>
          </div>

        </div>
      </div>
    </section>
  );
}
