import { motion } from 'framer-motion';
import { useScrollReveal } from '@/hooks/useScrollReveal';
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

interface ContextualFAQProps {
  eyebrow?: string;
  heading?: string;
  subheading?: string;
  items: FAQItem[];
  className?: string;
}

export function ContextualFAQ({
  eyebrow = 'FAQ',
  heading = 'Ofte stillede spørgsmål',
  subheading,
  items,
  className = '',
}: ContextualFAQProps) {
  const { ref, isInView } = useScrollReveal();

  return (
    <section ref={ref} className={`py-24 md:py-32 bg-background overflow-hidden ${className}`}>
      <div className="container mx-auto px-5 md:px-10 max-w-[680px]">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="text-center mb-14"
        >
          <span className="text-accent/50 font-body text-[10.5px] font-semibold tracking-[0.35em] uppercase block mb-4">
            {eyebrow}
          </span>
          <h2 className="font-display text-2xl md:text-[2rem] font-bold text-primary leading-tight tracking-[-0.01em]">
            {heading}
          </h2>
          {subheading && (
            <p className="text-muted-foreground/60 text-[14.5px] mt-3 leading-relaxed max-w-md mx-auto">
              {subheading}
            </p>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.25 }}
        >
          <Accordion type="single" collapsible className="space-y-0">
            {items.map((faq, i) => (
              <AccordionItem
                key={i}
                value={`faq-${i}`}
                className="border-b border-border/20 last:border-0"
              >
                <AccordionTrigger className="text-left font-display font-semibold text-primary/90 hover:no-underline hover:text-accent transition-colors duration-300 py-5 text-[14.5px] md:text-[15px]">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground/70 pb-5 text-[13.5px] leading-[1.75]">
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
