import { motion, AnimatePresence } from 'framer-motion';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { Star, ChevronLeft, ChevronRight, Quote } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n';

const testimonials = [
  { name: 'Mette & Lars Sørensen', location: 'Blåvand · Premium sommerhus', quote: 'Det føles som et helt andet samarbejde end det, vi kendte fra vores tidligere bureau. Her er der en reel kontaktperson, og vi kan mærke, at de faktisk investerer i vores hus.', rating: 5, earnings: '187.000 kr./år' },
  { name: 'Thomas Nielsen', location: 'Løkken · Klassisk sommerhus', quote: 'Jeg ville have noget, der var nemt og gennemsigtigt. Det er præcis, hvad jeg fik. Udbetalingerne kommer til tiden, og jeg behøver ikke jagte nogen for at få svar.', rating: 5, earnings: '94.000 kr./år' },
  { name: 'Anne-Marie Vestergaard', location: 'Marielyst · Ekstraordinært sommerhus', quote: 'Fra billeder til prissætning — alt var håndteret, da vi gik live. Vi havde 32 ugers udlejning i første sæson. Det er svært at bede om mere.', rating: 5, earnings: '243.000 kr./år' },
];

export function TestimonialsSection() {
  const { ref, isInView } = useScrollReveal();
  const { t } = useTranslation();
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setCurrent(prev => (prev + 1) % testimonials.length), 6000);
    return () => clearInterval(timer);
  }, []);

  const item = testimonials[current];

  return (
    <section ref={ref} className="py-16 md:py-40 bg-background overflow-hidden">
      <div className="container mx-auto px-4 md:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.7 }} className="text-center mb-16">
          <span className="text-primary font-body text-sm font-semibold tracking-[0.3em] uppercase block mb-4">{t('testimonials.eyebrow')}</span>
          <h2 className="font-display text-3xl md:text-5xl lg:text-6xl font-bold text-foreground">
            {t('testimonials.title')} <span className="text-primary italic font-normal">{t('testimonials.titleAccent')}</span>
          </h2>
        </motion.div>

        <div className="max-w-3xl mx-auto relative">
          <Quote className="absolute -top-4 left-0 md:left-[-2rem] w-16 h-16 text-primary/[0.08]" />
          <AnimatePresence mode="wait">
            <motion.div key={current} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }} className="text-center">
              <div className="flex justify-center gap-1 mb-8">
                {Array.from({ length: item.rating }).map((_, j) => <Star key={j} className="w-4 h-4 text-primary fill-primary" />)}
              </div>
              <p className="font-display text-xl md:text-3xl lg:text-4xl font-light text-foreground/80 leading-relaxed italic mb-10">"{item.quote}"</p>
              <div className="space-y-2">
                <p className="font-semibold text-foreground text-base">{item.name}</p>
                <p className="text-sm text-muted-foreground">{item.location}</p>
                <p className="font-display font-bold text-primary text-lg">{item.earnings}</p>
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="flex items-center justify-center gap-6 mt-12">
            <button onClick={() => setCurrent(prev => (prev - 1 + testimonials.length) % testimonials.length)}
              className="w-10 h-10 rounded-full border border-border flex items-center justify-center hover:border-primary/30 hover:bg-primary/5 transition-all">
              <ChevronLeft className="w-4 h-4 text-muted-foreground" />
            </button>
            <div className="flex gap-2">
              {testimonials.map((_, i) => (
                <button key={i} onClick={() => setCurrent(i)}
                  className={`h-1 rounded-full transition-all duration-500 ${i === current ? 'w-8 bg-primary' : 'w-2 bg-border hover:bg-muted-foreground/30'}`} />
              ))}
            </div>
            <button onClick={() => setCurrent(prev => (prev + 1) % testimonials.length)}
              className="w-10 h-10 rounded-full border border-border flex items-center justify-center hover:border-primary/30 hover:bg-primary/5 transition-all">
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
