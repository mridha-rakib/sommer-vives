import { motion } from 'framer-motion';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Phone } from 'lucide-react';

export function ContactExpertsSection() {
  const { ref, isInView } = useScrollReveal();

  return (
    <section ref={ref} className="py-24 md:py-32 bg-primary text-primary-foreground overflow-hidden">
      <div className="container mx-auto px-4 md:px-8 text-center max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
        >
          <span className="text-accent font-body text-sm font-semibold tracking-[0.3em] uppercase block mb-6">
            Klar til at komme i gang?
          </span>
          <h2 className="font-display text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-[0.95]">
            Lad os snakke om
            <span className="block text-accent italic font-normal">dit sommerhus</span>
          </h2>
          <p className="text-lg md:text-xl text-primary-foreground/70 leading-relaxed mb-12 max-w-2xl mx-auto">
            Book en gratis og uforpligtende vurdering — vi kører ud til dig.
            Eller opret dit hus online på 5 minutter.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/contact">
              <Button variant="gold" size="xl" className="gap-3 group text-base">
                Book en gratis vurdering
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link to="/kom-i-gang">
              <Button
                variant="outline"
                size="xl"
                className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 text-base"
              >
                Opret dit hus på 5 min
              </Button>
            </Link>
          </div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ delay: 0.5 }}
            className="mt-8"
          >
            <a href="tel:+4512345678" className="inline-flex items-center gap-2 text-primary-foreground/50 hover:text-accent transition-colors text-sm">
              <Phone className="w-4 h-4" />
              Eller ring direkte: +45 12 34 56 78
            </a>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
