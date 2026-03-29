import { motion } from 'framer-motion';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { Check, X, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const rows = [
  { label: 'Kommission', us: 'Kun 15%', them: '25-40%' },
  { label: 'Binding', us: '6 mdr., derefter frit', them: '12-24 mdr.' },
  { label: 'Præsentation', us: 'Professionel foto & video', them: 'Gør-det-selv' },
  { label: 'Gæstehåndtering', us: 'Vi klarer alt', them: 'Du klarer alt' },
  { label: 'Markedsføring', us: 'Alle portaler + egne kanaler', them: 'Én platform' },
  { label: 'Personlig kontakt', us: 'Dedikeret kontaktperson', them: 'Callcenter' },
  { label: 'Tillægsindtægter', us: 'Du beholder alt', them: 'Bureauet beholder' },
  { label: 'Skatteoptimering', us: 'Fuldt bundfradrag', them: 'Ingen hjælp' },
];

export function ComparisonSection() {
  const { ref, isInView } = useScrollReveal();

  return (
    <section ref={ref} className="py-24 md:py-32 bg-primary text-primary-foreground overflow-hidden">
      <div className="container mx-auto px-4 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <span className="text-primary-foreground/70 font-body text-sm font-semibold tracking-[0.3em] uppercase block mb-4">
            Sammenligning
          </span>
          <h2 className="font-display text-3xl md:text-5xl font-bold text-primary-foreground leading-tight">
            Hvorfor vælge SommerVibes?
          </h2>
        </motion.div>

        {/* Clean minimal comparison table */}
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="grid grid-cols-[1fr_1fr_1fr] gap-4 mb-2 px-2">
            <div />
            <div className="text-center">
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-primary-foreground/15 text-primary-foreground text-xs font-bold uppercase tracking-wider">
                SommerVibes
              </span>
            </div>
            <div className="text-center">
              <span className="text-xs font-medium text-primary-foreground/40 uppercase tracking-wider">
                Andre
              </span>
            </div>
          </div>

          {/* Rows */}
          <div className="space-y-0">
            {rows.map((row, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={isInView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.4, delay: 0.1 + i * 0.05 }}
                className="grid grid-cols-[1fr_1fr_1fr] gap-4 items-center py-4 border-b border-primary-foreground/10 last:border-0 group hover:bg-primary-foreground/[0.03] rounded-lg px-2 transition-colors"
              >
                <span className="text-sm font-medium text-primary-foreground">{row.label}</span>
                <div className="flex items-center justify-center gap-2">
                  <Check className="w-4 h-4 text-primary-foreground flex-shrink-0" />
                  <span className="text-sm text-primary-foreground/80">{row.us}</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <X className="w-3.5 h-3.5 text-destructive/60 flex-shrink-0" />
                  <span className="text-sm text-primary-foreground/40">{row.them}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="text-center mt-14"
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
