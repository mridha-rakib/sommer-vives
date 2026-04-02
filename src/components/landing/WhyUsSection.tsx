import { motion } from 'framer-motion';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { Check, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import heroHouse from '@/assets/hero-house.jpg';

const perks = [
  'Kun 15 % kommission — langt under markedet',
  'Personlig rådgiver der kender dit hus',
  'Synlighed på Airbnb, Booking.com og flere',
  'Professionel fotografering inkluderet',
  'Fuld gennemsigtighed og kun 6 mdr. binding',
  'Adgang til bundfradrag på 50.200 kr.',
];

export function WhyUsSection() {
  const { ref, isInView } = useScrollReveal();

  return (
    <section ref={ref} className="py-24 md:py-32 bg-muted/30" id="hvorfor">
      <div className="container mx-auto px-4 md:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center max-w-6xl mx-auto">
          {/* Image */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            <div className="rounded-2xl overflow-hidden shadow-2xl">
              <img
                src={heroHouse}
                alt="Sommerhus udlejet med SommerVibes"
                className="w-full h-[400px] object-cover"
                loading="lazy"
              />
            </div>
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={isInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="absolute -bottom-6 -right-6 bg-accent text-primary px-8 py-4 rounded-xl shadow-lg"
            >
              <span className="font-display font-bold text-2xl">15 %</span>
              <span className="block text-sm">kommission</span>
            </motion.div>
          </motion.div>

          {/* Copy */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <span className="text-accent font-body text-sm font-semibold tracking-[0.3em] uppercase block mb-4">
              Fordele
            </span>
            <h2 className="font-display text-3xl md:text-4xl font-semibold mb-6">
              Hvorfor vælge
              <span className="block text-accent italic font-normal">SommerVibes?</span>
            </h2>

            <div className="space-y-4 mb-8">
              {perks.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 20 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.4, delay: 0.3 + i * 0.08 }}
                  className="flex items-center gap-3"
                >
                  <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
                    <Check className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-muted-foreground">{item}</span>
                </motion.div>
              ))}
            </div>

            <Link to="/team">
              <Button variant="outline" className="gap-2 group rounded-full">
                Mød teamet bag
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
