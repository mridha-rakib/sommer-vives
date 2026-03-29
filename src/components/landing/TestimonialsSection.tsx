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
    name: 'Camilla & Jakob Madsen',
    location: 'Bornholm · Ekstraordinært',
    quote: 'Fra oprettelse til første booking gik der kun 2 uger. Den professionelle fotopakke gjorde virkelig hele forskellen for vores bookingrate.',
    rating: 5,
    earnings: '245.000 kr./år',
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
          <span className="text-accent font-body text-sm font-semibold tracking-[0.3em] uppercase block mb-4">
            Vores ejere
          </span>
          <h2 className="font-display text-3xl md:text-5xl lg:text-6xl font-bold">
            De valgte <span className="text-accent italic font-normal">SommerVibes</span>
          </h2>
        </motion.div>

        {/* Single testimonial carousel — cinematic, minimal */}
        <div className="max-w-3xl mx-auto relative">
          <Quote className="absolute -top-4 left-0 md:left-[-2rem] w-16 h-16 text-accent/[0.06]" />

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
                  <Star key={j} className="w-4 h-4 text-accent fill-accent" />
                ))}
              </div>

              {/* Quote */}
              <p className="font-display text-xl md:text-3xl lg:text-4xl font-light text-primary-foreground/80 leading-relaxed italic mb-10">
                "{t.quote}"
              </p>

              {/* Author */}
              <div className="space-y-2">
                <p className="font-semibold text-primary-foreground text-base">{t.name}</p>
                <p className="text-sm text-primary-foreground/40">{t.location}</p>
                <p className="font-display font-bold text-accent text-lg">{t.earnings}</p>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex items-center justify-center gap-6 mt-12">
            <button
              onClick={() => setCurrent(prev => (prev - 1 + testimonials.length) % testimonials.length)}
              className="w-10 h-10 rounded-full border border-primary-foreground/10 flex items-center justify-center hover:border-accent/30 hover:bg-accent/5 transition-all"
            >
              <ChevronLeft className="w-4 h-4 text-primary-foreground/60" />
            </button>

            <div className="flex gap-2">
              {testimonials.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  className={`h-1 rounded-full transition-all duration-500 ${
                    i === current ? 'w-8 bg-accent' : 'w-2 bg-primary-foreground/15 hover:bg-primary-foreground/25'
                  }`}
                />
              ))}
            </div>

            <button
              onClick={() => setCurrent(prev => (prev + 1) % testimonials.length)}
              className="w-10 h-10 rounded-full border border-primary-foreground/10 flex items-center justify-center hover:border-accent/30 hover:bg-accent/5 transition-all"
            >
              <ChevronRight className="w-4 h-4 text-primary-foreground/60" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
