import { motion } from 'framer-motion';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { Star, Quote } from 'lucide-react';

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

  return (
    <section ref={ref} className="py-28 md:py-36 bg-primary text-primary-foreground overflow-hidden">
      <div className="container mx-auto px-4 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center mb-16 md:mb-20"
        >
          <span className="text-accent font-body text-sm font-semibold tracking-[0.3em] uppercase block mb-4">
            Vores ejere
          </span>
          <h2 className="font-display text-3xl md:text-5xl lg:text-6xl font-bold">
            De valgte <span className="text-accent italic font-normal">SommerVibes</span>
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-5 md:gap-6 max-w-6xl mx-auto">
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.15 * i }}
              className="relative rounded-2xl p-8 md:p-9 border border-primary-foreground/8 bg-primary-foreground/[0.03] hover:bg-primary-foreground/[0.06] hover:border-accent/15 transition-all duration-500 group flex flex-col"
            >
              <Quote className="absolute top-7 right-7 w-8 h-8 text-accent/10 group-hover:text-accent/20 transition-colors" />
              <div className="flex gap-0.5 mb-5">
                {Array.from({ length: t.rating }).map((_, j) => (
                  <Star key={j} className="w-4 h-4 text-accent fill-accent" />
                ))}
              </div>
              <p className="text-primary-foreground/70 leading-relaxed mb-8 text-base italic font-display flex-1">
                "{t.quote}"
              </p>
              <div className="border-t border-primary-foreground/8 pt-5 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-primary-foreground text-sm">{t.name}</p>
                  <p className="text-xs text-primary-foreground/40 mt-0.5">{t.location}</p>
                </div>
                <div className="text-right">
                  <p className="font-display font-bold text-accent text-sm">{t.earnings}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
