import { motion } from 'framer-motion';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Clock } from 'lucide-react';

export function ContactExpertsSection() {
  const { ref, isInView } = useScrollReveal();

  return (
    <section ref={ref} className="py-32 md:py-44 bg-card text-foreground overflow-hidden relative">
      {/* Subtle radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(var(--accent)/0.06),transparent_70%)] pointer-events-none" />

      <div className="container mx-auto px-4 md:px-8 relative">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
          >
            <h2 className="font-display text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-[0.95]">
              Lad os snakke om{' '}
              <span className="block text-primary italic font-normal mt-2">dit sommerhus</span>
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed mb-8 max-w-lg mx-auto">
              Book et gratis og uforpligtende udlejningstjek — vi kører ud til dig.
            </p>
          </motion.div>

          {/* Urgency badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-10"
          >
            <Clock className="w-3.5 h-3.5 text-primary" />
            <span className="text-primary text-sm font-semibold">
              Kun 8 ledige pladser i denne sæson
            </span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-3 justify-center"
          >
            <Link to="/kom-i-gang">
              <Button variant="gold" size="xl" className="gap-3 group text-base w-full sm:w-auto rounded-full">
                Udlej dit hus nu
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link to="/book-vurdering">
              <Button
                variant="outline"
                size="xl"
                className="border-border text-muted-foreground hover:bg-muted hover:text-foreground text-base w-full sm:w-auto rounded-full"
              >
                Book gratis udlejningstjek
              </Button>
            </Link>
          </motion.div>

          {/* Minimal contact info */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="mt-14 flex items-center justify-center gap-6 text-muted-foreground"
          >
            <span className="text-sm">+45 12 34 56 78</span>
            <span className="w-1 h-1 rounded-full bg-muted-foreground/40" />
            <span className="text-sm">Hverdage 8–18</span>
            <span className="w-1 h-1 rounded-full bg-muted-foreground/40" />
            <span className="text-sm">Hele Danmark</span>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
