import { PublicLayout } from '@/components/layout/PublicLayout';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Check, ArrowRight, X } from 'lucide-react';
import { ContextualFAQ } from '@/components/landing/ContextualFAQ';

const pricingFAQs = [
  { q: 'Er der nogen skjulte gebyrer?', a: 'Nej. Du betaler kun 15 % kommission af gennemførte bookinger. Ingen oprettelsesgebyr, ingen månedlige udgifter, ingen overraskelser.' },
  { q: 'Betaler jeg noget, før jeg får bookinger?', a: 'Nej — oprettelse og onboarding er helt gratis. Du betaler først, når du tjener penge.' },
  { q: 'Hvornår udbetales min indtjening?', a: 'Din udbetaling overføres kort efter gæstens check-in. Du kan altid følge med i din ejerportal.' },
  { q: 'Hvordan fungerer jeres 6 måneders aftale?', a: 'Vi investerer tid i professionelle billeder, listingopsætning og markedsføring fra dag ét. Aftalen sikrer, at vi begge får det bedste ud af samarbejdet. Herefter er du fri til at opsige.' },
];
import { motion } from 'framer-motion';
import { useScrollReveal } from '@/hooks/useScrollReveal';

const valuePoints = [
  'Annoncering på de største portaler',
  'Fuld gæstekommunikation',
  'Personlig rådgiver',
  'Ejeroverblik i din portal',
];

const comparison = [
  { feature: 'Kommission', us: '15 %', others: '18–25 %' },
  { feature: 'Gæstegebyr', us: '5 %', others: '12–18 %' },
  { feature: 'Binding', us: '6 mdr.', others: '12–24 mdr.' },
  { feature: 'Oprettelse', us: 'Gratis', others: '0–5.000 kr.' },
  { feature: 'Personlig rådgiver', us: '✓', others: '✗', usIcon: true, othersIcon: true },
];

function PricingContent() {
  const { ref, isInView } = useScrollReveal();

  return (
    <section ref={ref} className="py-20 md:py-28 bg-background">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="grid md:grid-cols-2 gap-12 lg:gap-16 items-start">
          {/* Left — Price Card */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="bg-card border border-border/60 rounded-2xl p-8 md:p-10 shadow-elevated sticky top-24"
          >
            <div className="mb-8">
              <div className="flex items-baseline gap-1 mb-2">
                <span className="font-display text-7xl font-bold text-accent">15</span>
                <span className="font-display text-3xl font-bold text-accent">%</span>
              </div>
              <p className="text-foreground/80 text-lg leading-relaxed">
                ejerkommission af gennemførte bookinger
              </p>
            </div>

            <div className="bg-muted/30 rounded-xl px-5 py-4 mb-8 border border-border/40">
              <div className="flex items-baseline gap-2">
                <span className="font-display text-xl font-semibold text-accent">5 %</span>
                <span className="text-sm text-muted-foreground">gæsteservicegebyr</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                betales af gæsten — påvirker ikke din indtjening
              </p>
            </div>

            <ul className="space-y-3.5 mb-8">
              {valuePoints.map((point, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.3, delay: 0.3 + i * 0.06 }}
                  className="flex items-center gap-3"
                >
                  <div className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 text-accent" />
                  </div>
                  <span className="text-foreground/90 text-sm">{point}</span>
                </motion.li>
              ))}
            </ul>

            <p className="text-xs text-muted-foreground mb-6 leading-relaxed">
              Ingen skjulte gebyrer. Ingen oprettelsesomkostninger.
            </p>

            <Link to="/kom-i-gang">
              <Button variant="gold" size="lg" className="w-full gap-2 group text-base">
                Kom i gang gratis <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </motion.div>

          {/* Right — Comparison + Example */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="space-y-10"
          >
            {/* Comparison table */}
            <div>
              <h3 className="font-display text-lg font-semibold text-foreground mb-4">
                Sammenlign med andre bureauer
              </h3>
              <div className="rounded-xl border border-border/50 overflow-hidden">
                <div className="grid grid-cols-3 bg-muted/40 px-5 py-3 text-xs font-medium uppercase tracking-wider">
                  <span className="text-muted-foreground"></span>
                  <span className="text-accent text-center">SommerVibes</span>
                  <span className="text-muted-foreground text-center">Andre</span>
                </div>
                {comparison.map((row, i) => (
                  <div
                    key={i}
                    className="grid grid-cols-3 px-5 py-3.5 border-t border-border/30 text-sm"
                  >
                    <span className="text-foreground/80">{row.feature}</span>
                    <span className="text-center font-medium text-accent">
                      {row.usIcon ? <Check className="w-4 h-4 mx-auto text-accent" /> : row.us}
                    </span>
                    <span className="text-center text-muted-foreground">
                      {row.othersIcon ? <X className="w-4 h-4 mx-auto text-muted-foreground/60" /> : row.others}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Payout example */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="bg-muted/20 rounded-xl p-6 border border-border/30"
            >
              <h3 className="font-display text-base font-semibold text-foreground mb-4">
                Eksempel — dit sommerhus omsætter 100.000 kr.
              </h3>
              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Bruttoomsætning</span>
                  <span className="font-medium text-foreground">100.000 kr.</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">SommerVibes kommission (15 %)</span>
                  <span className="text-destructive">−15.000 kr.</span>
                </div>
                <div className="border-t border-border/40 pt-3 flex justify-between items-baseline">
                  <span className="font-semibold text-foreground">Din udbetaling</span>
                  <span className="font-display font-bold text-accent text-xl">85.000 kr.</span>
                </div>
                <div className="flex justify-between text-xs pt-1">
                  <span className="text-muted-foreground">Heraf skattefrit (bundfradrag)</span>
                  <span className="text-foreground/70">50.200 kr.</span>
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
      <section className="pt-32 pb-12 bg-background text-foreground overflow-hidden">
        <div className="container mx-auto px-4 text-center max-w-2xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <span className="text-accent font-body text-sm font-semibold tracking-[0.3em] uppercase block mb-6">Priser</span>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="font-display text-3xl md:text-5xl font-bold mb-5 leading-tight"
          >
            En enkel model, hvor du
            <span className="block text-accent italic font-normal">beholder mere</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.35 }}
            className="text-base md:text-lg text-muted-foreground leading-relaxed"
          >
            Du betaler kun, når du tjener. Ingen skjulte gebyrer.
          </motion.p>
        </div>
      </section>
      <PricingContent />
      <ContextualFAQ
        eyebrow="Prisrelaterede spørgsmål"
        heading="Hvad ejere typisk spørger om"
        items={pricingFAQs}
      />
      {/* Dual CTA */}
      <section className="py-20 md:py-28 bg-background">
        <div className="container mx-auto px-4 text-center max-w-xl">
          <h2 className="font-display text-2xl md:text-4xl font-bold text-foreground mb-4">
            Klar til at høre mere?
          </h2>
          <p className="text-muted-foreground mb-8">
            Kom i gang med det samme — eller book en uforpligtende snak først.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/kom-i-gang">
              <Button variant="gold" size="lg" className="gap-2 group">
                Udlej dit hus <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link to="/book-vurdering">
              <Button variant="outline" size="lg" className="border-accent/40 text-accent hover:bg-accent/10">
                Book gratis udlejningstjek
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
