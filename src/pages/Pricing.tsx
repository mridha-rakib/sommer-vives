import { PublicLayout } from '@/components/layout/PublicLayout';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Check, ArrowRight, Shield } from 'lucide-react';
import { motion } from 'framer-motion';
import { useScrollReveal } from '@/hooks/useScrollReveal';

const included = [
  'Annoncering på de største portaler',
  'Professionel rengøringskoordinering',
  'Fuld gæstekommunikation',
  'Ingen binding eller oprettelsesgebyr',
  'Personlig ejerportal med overblik',
  'Professionel fotovejledning',
  'Adgang til bundfradrag (50.200 kr.)',
  'Dansk support via telefon & email',
];

const comparison = [
  { feature: 'Kommission', us: '15%', others: '18-25%' },
  { feature: 'Gæstegebyr', us: '5%', others: '12-18%' },
  { feature: 'Binding', us: 'Ingen', others: '6-12 mdr.' },
  { feature: 'Oprettelse', us: 'Gratis', others: '0-5.000 kr.' },
  { feature: 'Personlig rådgiver', us: '✓', others: '✗' },
  { feature: 'Bundfradrag', us: '50.200 kr.', others: 'Varierer' },
];

function PricingContent() {
  const { ref, isInView } = useScrollReveal();

  return (
    <section ref={ref} className="py-24 md:py-32 bg-background">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="grid md:grid-cols-2 gap-8 items-start">
          {/* Price Card */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7 }}
            className="bg-card border-2 border-accent rounded-2xl p-8 md:p-10 shadow-elevated sticky top-24"
          >
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-5 h-5 text-accent" />
              <span className="text-accent text-sm font-semibold uppercase tracking-wider">Alt inkluderet</span>
            </div>
            <div className="mb-2">
              <span className="font-display text-6xl font-bold text-primary">15</span>
              <span className="font-display text-3xl font-bold text-primary">%</span>
            </div>
            <p className="text-muted-foreground mb-2">ejerkommission af gennemførte bookinger</p>
            <div className="bg-accent/10 rounded-lg p-4 mb-6">
              <div className="flex items-baseline gap-2">
                <span className="font-display text-2xl font-bold text-primary">5%</span>
                <span className="text-sm text-muted-foreground">gæsteservicegebyr</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">betales af gæsten – påvirker ikke din indtjening</p>
            </div>
            <ul className="space-y-3 mb-8">
              {included.map((f, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.3, delay: 0.3 + i * 0.05 }}
                  className="flex items-center gap-3"
                >
                  <div className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 text-accent" />
                  </div>
                  <span className="text-primary text-sm">{f}</span>
                </motion.li>
              ))}
            </ul>
            <Link to="/kom-i-gang">
              <Button variant="gold" size="lg" className="w-full gap-2 group">
                Kom i gang gratis <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </motion.div>

          {/* Comparison */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            <h2 className="font-display text-2xl font-bold text-primary mb-6">Sammenlign med andre</h2>
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <div className="grid grid-cols-3 bg-muted/50 px-4 py-3 text-sm font-medium">
                <span className="text-muted-foreground">Feature</span>
                <span className="text-accent text-center">SommerVibes</span>
                <span className="text-muted-foreground text-center">Andre bureauer</span>
              </div>
              {comparison.map((row, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0 }}
                  animate={isInView ? { opacity: 1 } : {}}
                  transition={{ duration: 0.3, delay: 0.4 + i * 0.08 }}
                  className="grid grid-cols-3 px-4 py-3 border-t border-border text-sm hover:bg-muted/20 transition-colors"
                >
                  <span className="text-primary font-medium">{row.feature}</span>
                  <span className="text-accent font-semibold text-center">{row.us}</span>
                  <span className="text-muted-foreground text-center">{row.others}</span>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.8 }}
              className="mt-8 bg-muted/30 rounded-xl p-6"
            >
              <h3 className="font-display text-lg font-semibold text-primary mb-3">
                Eksempel: Dit sommerhus omsætter 100.000 kr.
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Bruttoomsætning</span>
                  <span className="font-semibold text-primary">100.000 kr.</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">SommerVibes kommission (15%)</span>
                  <span className="text-destructive">-15.000 kr.</span>
                </div>
                <div className="flex justify-between border-t border-border pt-2">
                  <span className="font-semibold text-primary">Din udbetaling</span>
                  <span className="font-bold text-accent text-lg">85.000 kr.</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Heraf skattefrit (bundfradrag)</span>
                  <span className="text-primary">50.200 kr.</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

export default function Pricing() {
  return (
    <PublicLayout>
      <section className="pt-32 pb-16 bg-background text-foreground overflow-hidden">
        <div className="container mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <span className="text-accent font-body text-sm font-semibold tracking-[0.3em] uppercase block mb-6">Priser</span>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="font-display text-4xl md:text-5xl font-bold mb-4"
          >
            Enkel og gennemsigtig
            <span className="block text-accent italic font-normal">prissætning</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-lg text-muted-foreground max-w-2xl mx-auto"
          >
            Ingen skjulte gebyrer. Du betaler kun når du tjener.
          </motion.p>
        </div>
      </section>
      <PricingContent />
    </PublicLayout>
  );
}
