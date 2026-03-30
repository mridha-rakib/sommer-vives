import { motion } from 'framer-motion';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  ArrowRight,
  Home,
  ShoppingBag,
  Zap,
  Bed,
  Clock,
  TrendingUp,
  Sparkles,
  Check,
} from 'lucide-react';
import { useState } from 'react';

type Scenario = 'conservative' | 'realistic' | 'optimistic';

const scenarios: Record<Scenario, {
  label: string;
  rent: number;
  addons: number;
  consumption: number;
  commission: number;
  tax: number;
}> = {
  conservative: {
    label: 'Konservativ',
    rent: 80000,
    addons: 9500,
    consumption: 5000,
    commission: 14175,
    tax: 18511,
  },
  realistic: {
    label: 'Realistisk',
    rent: 120000,
    addons: 18500,
    consumption: 9000,
    commission: 22125,
    tax: 24098,
  },
  optimistic: {
    label: 'Optimistisk',
    rent: 180000,
    addons: 28000,
    consumption: 14000,
    commission: 33300,
    tax: 42998,
  },
};

const fmt = (n: number) =>
  new Intl.NumberFormat('da-DK', { maximumFractionDigits: 0 }).format(n);

const incomeItems = [
  { icon: Home, label: 'Lejeindtægt', key: 'rent' as const, accent: true },
  { icon: ShoppingBag, label: 'Ekstra tilvalg', key: 'addons' as const },
  { icon: Zap, label: 'Forbrugsafregning', key: 'consumption' as const },
];

export function PropertyTypesSection() {
  const { ref, isInView } = useScrollReveal();
  const [scenario, setScenario] = useState<Scenario>('realistic');

  const s = scenarios[scenario];
  const gross = s.rent + s.addons + s.consumption;
  const net = gross - s.commission - s.tax;

  return (
    <section ref={ref} className="py-24 md:py-36 bg-background overflow-hidden">
      <div className="container mx-auto px-4 md:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-16 md:mb-20"
        >
          <span className="text-primary font-body text-[11px] font-semibold tracking-[0.3em] uppercase block mb-4">
            Hvad kan dit sommerhus tjene?
          </span>
          <h2 className="font-display text-3xl md:text-4xl lg:text-[2.75rem] font-bold text-foreground leading-[1.12] mb-5">
            Få et overblik over dit{' '}
            <span className="text-primary italic font-normal">indtjeningspotentiale</span>
          </h2>
          <p className="text-[15px] md:text-base leading-[1.75] text-muted-foreground max-w-xl mx-auto">
            Se, hvordan din indtjening kan bygges op med lejeindtægt, ekstra tilvalg og
            forbrugsafregning — og hvad du estimeret kan stå tilbage med.
          </p>
        </motion.div>

        {/* Scenario Toggle */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="flex justify-center mb-12"
        >
          <div className="inline-flex bg-secondary/60 border border-border/40 rounded-xl p-1 gap-1">
            {(Object.keys(scenarios) as Scenario[]).map((key) => (
              <button
                key={key}
                onClick={() => setScenario(key)}
                className={`px-5 py-2 rounded-lg text-[13px] font-semibold transition-all duration-300 ${
                  scenario === key
                    ? 'bg-card text-foreground shadow-sm border border-border/50'
                    : 'text-muted-foreground hover:text-foreground/70'
                }`}
              >
                {scenarios[key].label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Main Content — two columns */}
        <div className="max-w-5xl mx-auto grid md:grid-cols-5 gap-6 md:gap-8">
          {/* Left: Income Breakdown (3 cols) */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="md:col-span-3 space-y-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="font-display text-[9px] font-bold tracking-[0.2em] uppercase text-primary/50 flex items-center gap-1.5">
                <Sparkles className="w-3 h-3" strokeWidth={1.5} />
                Indtægtskilder
              </span>
            </div>

            {/* Income cards */}
            {incomeItems.map((item, i) => {
              const Icon = item.icon;
              const value = s[item.key];
              return (
                <motion.div
                  key={item.key}
                  initial={{ opacity: 0, y: 12 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.5, delay: 0.2 + i * 0.08 }}
                  className={`rounded-2xl border p-5 flex items-center gap-4 transition-all duration-300 ${
                    item.accent
                      ? 'bg-card border-primary/15 shadow-[0_2px_16px_-4px_hsl(var(--ring)/0.06)]'
                      : 'bg-card border-border/40'
                  }`}
                >
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    item.accent
                      ? 'bg-primary/10 border border-primary/15'
                      : 'bg-secondary border border-border/30'
                  }`}>
                    <Icon className="w-[18px] h-[18px] text-primary" strokeWidth={1.3} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[13px] font-medium text-muted-foreground">{item.label}</span>
                  </div>
                  <span className={`text-lg font-display font-bold tabular-nums ${
                    item.accent ? 'text-foreground' : 'text-foreground/70'
                  }`}>
                    {item.key === 'rent' ? '' : '+'}{fmt(value)} kr.
                  </span>
                </motion.div>
              );
            })}

            {/* Extra detail chips */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={isInView ? { opacity: 1 } : {}}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="flex gap-2 flex-wrap pt-1"
            >
              {[
                { icon: Bed, label: 'Sengepakker' },
                { icon: Clock, label: 'Tidlig check-in' },
                { icon: Clock, label: 'Sen check-out' },
              ].map((chip) => (
                <span
                  key={chip.label}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary/60 border border-border/30 text-[11px] font-medium text-muted-foreground/60"
                >
                  <chip.icon className="w-3 h-3 text-primary/40" strokeWidth={1.3} />
                  {chip.label}
                </span>
              ))}
              <span className="inline-flex items-center px-3 py-1.5 text-[11px] font-medium text-muted-foreground/40 italic">
                …og mere
              </span>
            </motion.div>
          </motion.div>

          {/* Right: Summary Card (2 cols) */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.25 }}
            className="md:col-span-2"
          >
            <div className="rounded-2xl border border-primary/15 bg-card overflow-hidden shadow-[0_4px_24px_-6px_hsl(var(--ring)/0.08)] h-full flex flex-col">
              {/* Header */}
              <div className="px-6 pt-6 pb-4 border-b border-border/30">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-display text-[8.5px] font-bold tracking-[0.2em] uppercase text-primary/50 flex items-center gap-1.5">
                    S<span className="italic text-accent/60">V</span>
                  </span>
                  <span className="text-[9px] font-medium text-muted-foreground/40 tracking-wide">Overblik</span>
                </div>
                <h3 className="font-display text-lg font-semibold text-foreground">
                  Dit estimerede udbytte
                </h3>
              </div>

              {/* Breakdown */}
              <div className="px-6 py-5 space-y-3.5 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-[13px] text-muted-foreground">Bruttoindtægt</span>
                  <span className="text-[15px] font-display font-semibold text-foreground tabular-nums">
                    {fmt(gross)} kr.
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[13px] text-muted-foreground">Kommission (15%)</span>
                  <span className="text-[14px] font-medium text-muted-foreground/70 tabular-nums">
                    −{fmt(s.commission)} kr.
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[13px] text-muted-foreground">Estimeret skat</span>
                  <span className="text-[14px] font-medium text-muted-foreground/70 tabular-nums">
                    −{fmt(s.tax)} kr.
                  </span>
                </div>

                <div className="h-px bg-gradient-to-r from-primary/15 via-primary/8 to-transparent my-1" />

                {/* Merindtjening hint */}
                <div className="flex items-center justify-between">
                  <span className="text-[13px] text-muted-foreground flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-primary/50" strokeWidth={1.3} />
                    Mulig merindtjening
                  </span>
                  <span className="text-[14px] font-semibold text-primary/70 tabular-nums">
                    +{fmt(s.addons + s.consumption)} kr.
                  </span>
                </div>
              </div>

              {/* Net result */}
              <div className="px-6 py-5 bg-gradient-to-br from-secondary/60 to-secondary/40 border-t border-border/30">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-semibold tracking-[0.12em] uppercase text-muted-foreground/50">
                    Estimeret efter skat
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-display font-bold text-foreground tabular-nums">
                    {fmt(net)}
                  </span>
                  <span className="text-sm text-muted-foreground font-medium">kr. / år</span>
                </div>
                <div className="flex items-center gap-1.5 mt-2">
                  <Check className="w-3 h-3 text-primary/50" strokeWidth={2} />
                  <span className="text-[10px] text-muted-foreground/45">Inkl. skattefrit bundfradrag</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Disclaimer + CTA */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="text-center mt-12 md:mt-16 space-y-5"
        >
          <p className="text-[12px] text-muted-foreground/40 italic max-w-md mx-auto">
            Dit potentiale afhænger af beliggenhed, standard, sæson og tilvalg. Tallene er estimater.
          </p>
          <Link to="/beregn-lejeindtaegt">
            <Button className="gap-2.5 group rounded-xl btn-gold px-8 py-4 text-sm">
              Beregn din indtjening
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" strokeWidth={2} />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
