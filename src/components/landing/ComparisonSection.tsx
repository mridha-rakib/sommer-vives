import { motion } from 'framer-motion';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { Check, X, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const competitors = [
  {
    name: 'Traditionelle bureauer',
    sub: 'Høj kommission, lav fleksibilitet',
    cons: ['25-40% kommission', 'Lang binding', 'Du bestemmer ikke priser', 'Langsom kommunikation'],
  },
  {
    name: 'Gør-det-selv portaler',
    sub: 'Al arbejdet er dit',
    cons: ['Du klarer alt selv', 'Ingen gæstesupport', 'Ingen rengøringsservice', 'Ingen prisoptimering'],
  },
];

const ourBenefits = [
  'Kun 15% kommission',
  'Ingen binding efter 6 mdr.',
  'Professionel fotopakke',
  'Komplet gæstehåndtering',
  'Bred markedsføring',
  'Personlig kontaktperson',
  'Skatteoptimeret setup',
  'Fleksibel prisstyring',
];

export function ComparisonSection() {
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
            Sammenligning
          </span>
          <h2 className="font-display text-3xl md:text-5xl font-bold text-primary leading-tight">
            Hvorfor vælge SommerVibes?
          </h2>
        </motion.div>

        <div className="max-w-6xl mx-auto grid lg:grid-cols-3 gap-5 md:gap-6">
          {/* Competitor cards */}
          {competitors.map((comp, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="rounded-2xl border border-border bg-card p-7 md:p-8"
            >
              <h3 className="font-display text-lg font-bold text-primary mb-1">{comp.name}</h3>
              <p className="text-xs text-muted-foreground mb-6">{comp.sub}</p>
              <div className="space-y-3">
                {comp.cons.map((con, j) => (
                  <div key={j} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0">
                      <X className="w-3 h-3 text-destructive" />
                    </div>
                    <span className="text-sm text-muted-foreground">{con}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}

          {/* Our card — highlighted */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="rounded-2xl border-2 border-accent/30 bg-primary text-primary-foreground p-7 md:p-8 shadow-[0_20px_60px_-15px_hsl(var(--primary)/0.5)] relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-40 h-40 bg-accent/[0.04] rounded-full blur-[60px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
            <div className="relative">
              <div className="inline-flex items-center px-2.5 py-1 rounded-full bg-accent/15 text-accent text-[10px] font-bold uppercase tracking-wider mb-3">
                Anbefalet
              </div>
              <h3 className="font-display text-lg font-bold mb-1">SommerVibes</h3>
              <p className="text-xs text-primary-foreground/50 mb-6">Alt du har brug for</p>
              <div className="space-y-3">
                {ourBenefits.map((benefit, j) => (
                  <div key={j} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-accent" />
                    </div>
                    <span className="text-sm text-primary-foreground/80">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="text-center mt-12"
        >
          <Link to="/kom-i-gang">
            <Button variant="gold" size="lg" className="gap-2 group rounded-full">
              Skift til SommerVibes
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
