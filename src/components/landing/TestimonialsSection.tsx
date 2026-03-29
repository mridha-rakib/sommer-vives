import { motion, AnimatePresence } from 'framer-motion';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { Star, ChevronLeft, ChevronRight, Quote } from 'lucide-react';
import { useState, useEffect } from 'react';

const testimonials = [
  {
    name: 'Mette & Lars Sørensen',
    location: 'Blåvand · Premium sommerhus',
    quote: 'Vi har aldrig haft så mange bookinger som nu. Den personlige kontakt og lave kommission er guld værd. Vi skiftede fra et stort bureau og har aldrig set os tilbage.',
    rating: 5,
    earnings: '187.000 kr./år',
  },
  {
    name: 'Thomas Nielsen',
    location: 'Løkken · Klassisk sommerhus',
    quote: 'Endelig et bureau der lytter og ikke bare ser os som endnu et nummer. Pengene kommer hurtigt, og supporten er fantastisk. Kan varmt anbefales!',
    rating: 5,
    earnings: '94.000 kr./år',
  },
  {
    name: 'Anne-Marie Vestergaard',
    location: 'Marielyst · Ekstraordinært sommerhus',
    quote: 'Professionel fotografering, optimeret prissætning og gennemsigtige udbetalinger. Det hele fungerer bare. Vi havde 32 ugers udlejning i første sæson.',
    rating: 5,
    earnings: '243.000 kr./år',
  },
];

export function TestimonialsSection() {
  const { ref, isInView } = useScrollReveal();
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent(prev => (prev + 1) % testimonials.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const t = testimonials[current];

  return (
    <section ref={ref} className="py-28 md:py-40 bg-background overflow-hidden">
      <div className="container mx-auto px-4 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <span className="text-primary font-body text-sm font-semibold tracking-[0.3em] uppercase block mb-4">
            Vores ejere
          </span>
          <h2 className="font-display text-3xl md:text-5xl lg:text-6xl font-bold text-foreground">
            De valgte <span className="text-primary italic font-normal">SommerVibes</span>
          </h2>
        </motion.div>

        {/* Single testimonial carousel — cinematic, minimal */}
        <div className="max-w-3xl mx-auto relative">
          <Quote className="absolute -top-4 left-0 md:left-[-2rem] w-16 h-16 text-primary/[0.08]" />

          <AnimatePresence mode="wait">
            <motion.div
              key={current}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="text-center"
            >
              {/* Stars */}
              <div className="flex justify-center gap-1 mb-8">
                {Array.from({ length: t.rating }).map((_, j) => (
                  <Star key={j} className="w-4 h-4 text-primary fill-primary" />
                ))}
              </div>

              {/* Quote */}
              <p className="font-display text-xl md:text-3xl lg:text-4xl font-light text-foreground/80 leading-relaxed italic mb-10">
                "{t.quote}"
              </p>

              {/* Author */}
              <div className="space-y-2">
                <p className="font-semibold text-foreground text-base">{t.name}</p>
                <p className="text-sm text-muted-foreground">{t.location}</p>
                <p className="font-display font-bold text-primary text-lg">{t.earnings}</p>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex items-center justify-center gap-6 mt-12">
            <button
              onClick={() => setCurrent(prev => (prev - 1 + testimonials.length) % testimonials.length)}
              className="w-10 h-10 rounded-full border border-border flex items-center justify-center hover:border-primary/30 hover:bg-primary/5 transition-all"
            >
              <ChevronLeft className="w-4 h-4 text-muted-foreground" />
            </button>

            <div className="flex gap-2">
              {testimonials.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  className={`h-1 rounded-full transition-all duration-500 ${
                    i === current ? 'w-8 bg-primary' : 'w-2 bg-border hover:bg-muted-foreground/30'
                  }`}
                />
              ))}
            </div>

            <button
              onClick={() => setCurrent(prev => (prev + 1) % testimonials.length)}
              className="w-10 h-10 rounded-full border border-border flex items-center justify-center hover:border-primary/30 hover:bg-primary/5 transition-all"
            >
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
