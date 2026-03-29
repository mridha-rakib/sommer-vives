import { Mail, Phone, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { Link } from 'react-router-dom';

interface ContactHostProps {
  ownerImage?: string;
}

export const ContactHost = ({ ownerImage = '/images/owner-emil-light.jpg' }: ContactHostProps) => {
  const { ref, isInView } = useScrollReveal();

  return (
    <section ref={ref} className="py-16 md:py-24">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="grid md:grid-cols-2 gap-10 items-start max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="flex justify-center md:justify-start"
          >
            <img
              src={ownerImage}
              alt="Emil Weng Klockmann"
              className="w-full max-w-xs rounded-2xl shadow-xl object-cover aspect-square"
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="max-w-xs md:max-w-none"
          >
            <span className="text-xs font-medium tracking-[0.3em] uppercase mb-4 block text-primary">
              KONTAKT OS
            </span>
            <h2 className="font-display text-3xl md:text-4xl font-semibold text-foreground mb-2">
              Emil Klockmann
            </h2>
            <p className="text-primary text-sm font-medium mb-5">Udlejningschef</p>
            <p className="text-muted-foreground text-base leading-relaxed mb-6">
              Har du spørgsmål til opholdet, datoer eller særlige ønsker? Skriv til mig — jeg hjælper gerne med at finde den rette løsning.
            </p>
            <div className="space-y-3 mb-6">
              <a href="mailto:info@sommervibes.dk" className="flex items-center gap-3 text-foreground font-medium hover:text-primary transition-colors">
                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-primary/10 shrink-0">
                  <Mail className="w-4 h-4 text-primary" />
                </div>
                info@sommervibes.dk
              </a>
              <a href="tel:+4512345678" className="flex items-center gap-3 text-foreground font-medium hover:text-primary transition-colors">
                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-primary/10 shrink-0">
                  <Phone className="w-4 h-4 text-primary" />
                </div>
                +45 12 34 56 78
              </a>
            </div>
            <div className="flex items-center gap-3">
              <Button asChild variant="outline" className="px-6 h-11 rounded-lg font-semibold">
                <a href="mailto:info@sommervibes.dk">Skriv til mig</a>
              </Button>
              <Button asChild variant="gold" className="px-6 h-11 rounded-lg font-semibold gap-2">
                <Link to="/listings">
                  <Home className="h-4 w-4" />
                  Se sommerhuse
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
