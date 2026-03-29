import { motion } from 'framer-motion';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

const propertyTypes = [
  {
    title: 'Klassisk',
    earnings: '40–150.000 kr.',
    description: 'Hyggeligt sommerhus med plads til 4-10 gæster, tæt på smuk natur.',
    image: 'https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8?w=800&h=1000&fit=crop',
  },
  {
    title: 'Premium',
    earnings: '70–250.000 kr.',
    description: 'Opgraderet med vildmarksbad, arkitekttegnet eller særlig indretning.',
    image: 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=800&h=1000&fit=crop',
  },
  {
    title: 'Ekstraordinært',
    earnings: '100–360.000 kr.',
    description: 'Betagende udsigt, unik beliggenhed eller helt særlig oplevelse.',
    image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=1000&fit=crop',
  },
];

export function PropertyTypesSection() {
  const { ref, isInView } = useScrollReveal();

  return (
    <section ref={ref} className="py-24 md:py-32 bg-muted/30 overflow-hidden">
      <div className="container mx-auto px-4 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <span className="text-accent font-body text-sm font-semibold tracking-[0.3em] uppercase block mb-4">
            Hvad kan du tjene?
          </span>
          <h2 className="font-display text-3xl md:text-5xl font-bold text-primary leading-tight">
            Find dit sommerhus
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {propertyTypes.map((type, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.2 + i * 0.15 }}
              className="group relative rounded-2xl overflow-hidden cursor-pointer aspect-[3/4]"
            >
              <img
                src={type.image}
                alt={type.title}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/30 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-6 md:p-8">
                <div className="font-display text-lg text-accent font-semibold mb-1">
                  {type.earnings}
                </div>
                <h3 className="font-display text-2xl md:text-3xl font-bold text-primary-foreground mb-2">
                  {type.title}
                </h3>
                <p className="text-primary-foreground/70 text-sm leading-relaxed opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  {type.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="text-center mt-12"
        >
          <Link to="/beregn-lejeindtaegt">
            <Button variant="outline" size="lg" className="gap-2 group">
              Beregn din indtjening
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
