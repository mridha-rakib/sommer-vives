import { motion } from 'framer-motion';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { Star, Quote } from 'lucide-react';

const testimonials = [
  {
    name: 'Mette & Lars Sørensen',
    location: 'Blåvand',
    quote: 'Vi har aldrig haft så mange bookinger som nu. Den personlige kontakt og lave kommission er guld værd.',
    rating: 5,
  },
  {
    name: 'Thomas Nielsen',
    location: 'Nordjylland',
    quote: 'Endelig et bureau der lytter. Pengene kommer hurtigt, og supporten er fantastisk.',
    rating: 5,
  },
  {
    name: 'Camilla Madsen',
    location: 'Bornholm',
    quote: 'Fra oprettelse til første booking gik der kun 2 uger. Den professionelle fotopakke gjorde forskellen.',
    rating: 5,
  },
];

export function TestimonialsSection() {
  const { ref, isInView } = useScrollReveal();

  return (
    <section ref={ref} className="py-24 md:py-32 bg-background overflow-hidden">
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
          <h2 className="font-display text-3xl md:text-5xl font-bold text-primary">
            Hvad de siger
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.15 * i }}
              className="relative bg-muted/30 rounded-2xl p-8 border border-border hover:shadow-elevated transition-shadow duration-500 group"
            >
              <Quote className="absolute top-6 right-6 w-10 h-10 text-accent/10 group-hover:text-accent/20 transition-colors" />
              <div className="flex gap-0.5 mb-6">
                {Array.from({ length: t.rating }).map((_, j) => (
                  <Star key={j} className="w-4 h-4 text-accent fill-accent" />
                ))}
              </div>
              <p className="text-foreground/80 leading-relaxed mb-8 text-lg italic font-display">
                "{t.quote}"
              </p>
              <div className="border-t border-border pt-4">
                <p className="font-semibold text-primary">{t.name}</p>
                <p className="text-sm text-muted-foreground">{t.location}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
