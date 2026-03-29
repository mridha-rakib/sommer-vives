import { motion } from 'framer-motion';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';

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
  const [active, setActive] = useState(1);

  return (
    <section ref={ref} className="py-24 md:py-36 bg-muted/20 overflow-hidden">
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

        {/* Carousel-style with focus effect */}
        <div className="relative max-w-6xl mx-auto">
          <div className="flex gap-4 md:gap-6 items-stretch justify-center">
            {propertyTypes.map((type, i) => {
              const isActive = i === active;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 40 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.6, delay: 0.2 + i * 0.15 }}
                  onClick={() => setActive(i)}
                  className={`group relative rounded-3xl overflow-hidden cursor-pointer transition-all duration-700 ease-out ${
                    isActive
                      ? 'flex-[2] aspect-[3/4] md:aspect-[4/5]'
                      : 'flex-[0.8] aspect-[3/4] md:aspect-[4/5] opacity-60 hover:opacity-80'
                  }`}
                >
                  <img
                    src={type.image}
                    alt={type.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/20 to-transparent" />
                  <div className={`absolute inset-x-0 bottom-0 p-5 md:p-8 transition-opacity duration-500 ${
                    isActive ? 'opacity-100' : 'opacity-0'
                  }`}>
                    <div className="font-display text-lg text-accent font-semibold mb-1">
                      {type.earnings}
                    </div>
                    <h3 className="font-display text-2xl md:text-3xl font-bold text-primary-foreground mb-2">
                      {type.title}
                    </h3>
                    <p className="text-primary-foreground/70 text-sm leading-relaxed max-w-sm">
                      {type.description}
                    </p>
                  </div>

                  {/* Inactive label */}
                  <div className={`absolute inset-0 flex items-end justify-center pb-8 transition-opacity duration-500 ${
                    isActive ? 'opacity-0' : 'opacity-100'
                  }`}>
                    <span className="font-display text-xl font-bold text-primary-foreground/90 [writing-mode:vertical-rl] md:[writing-mode:horizontal-tb]">
                      {type.title}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Navigation dots */}
          <div className="flex items-center justify-center gap-2 mt-8">
            {propertyTypes.map((_, i) => (
              <button
                key={i}
                onClick={() => setActive(i)}
                className={`h-1 rounded-full transition-all duration-500 ${
                  i === active ? 'w-8 bg-accent' : 'w-2 bg-primary/15 hover:bg-primary/30'
                }`}
              />
            ))}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="text-center mt-12"
        >
          <Link to="/beregn-lejeindtaegt">
            <Button variant="outline" size="lg" className="gap-2 group rounded-full">
              Beregn din indtjening
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
