import { motion, AnimatePresence } from 'framer-motion';
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
  Check,
  Plus,
} from 'lucide-react';
import { useState } from 'react';

type Scenario = 'conservative' | 'realistic' | 'optimistic';

const scenarios: Record<Scenario, {
  label: string;
  rent: number;
  addons: number;
  consumption: number;
  bedpacks: number;
  flexibility: number;
  commissionPct: number;
  tax: number;
}> = {
  conservative: {
    label: 'Konservativ',
    rent: 80000,
    addons: 5500,
    consumption: 5000,
    bedpacks: 2800,
    flexibility: 1200,
    commissionPct: 15,
    tax: 18511,
  },
  realistic: {
    label: 'Realistisk',
    rent: 120000,
    addons: 10500,
    consumption: 9000,
    bedpacks: 5200,
    flexibility: 2800,
    commissionPct: 15,
    tax: 24098,
  },
  optimistic: {
    label: 'Optimistisk',
    rent: 180000,
    addons: 16000,
    consumption: 14000,
    bedpacks: 7800,
    flexibility: 4200,
    commissionPct: 15,
    tax: 42998,
  },
};

const fmt = (n: number) =>
  new Intl.NumberFormat('da-DK', { maximumFractionDigits: 0 }).format(n);

const incomeLines = [
  { icon: Home, label: 'Lejeindtægt', key: 'rent' as const, primary: true },
  { icon: ShoppingBag, label: 'Ekstra tilvalg', key: 'addons' as const },
  { icon: Zap, label: 'Forbrugsafregning', key: 'consumption' as const },
  { icon: Bed, label: 'Sengepakker', key: 'bedpacks' as const },
  { icon: Clock, label: 'Fleksibel check-in/out', key: 'flexibility' as const },
];

export function PropertyTypesSection() {
  const { ref, isInView } = useScrollReveal();
  const [scenario, setScenario] = useState<Scenario>('realistic');

  const s = scenarios[scenario];
  const extras = s.addons + s.consumption + s.bedpacks + s.flexibility;
  const gross = s.rent + extras;
  const commission = Math.round(gross * s.commissionPct / 100);
  const net = gross - commission - s.tax;

  return (
    <section ref={ref} className="py-24 md:py-36 bg-background overflow-hidden">
      <div className="container mx-auto px-4 md:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-14 md:mb-18"
        >
          <span className="text-primary font-body text-[11px] font-semibold tracking-[0.3em] uppercase block mb-4">
            Hvad kan dit sommerhus tjene?
          </span>
          <h2 className="font-display text-3xl md:text-4xl lg:text-[2.75rem] font-bold text-foreground leading-[1.12] mb-5">
            Se, hvordan din indtjening{' '}
            <span className="text-primary italic font-normal">bygges op</span>
          </h2>
          <p className="text-[15px] md:text-base leading-[1.75] text-muted-foreground max-w-xl mx-auto">
            Lejeindtægt, tilvalg og forbrugsafregning — se hvad du reelt kan stå tilbage med.
          </p>
        </motion.div>

        {/* Scenario Toggle */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex justify-center mb-10"
        >
          <div className="inline-flex bg-card border border-border/50 rounded-xl p-1 gap-0.5">
            {(Object.keys(scenarios) as Scenario[]).map((key) => (
              <button
                key={key}
                onClick={() => setScenario(key)}
                className={`px-5 py-2 rounded-lg text-[13px] font-semibold transition-all duration-300 ${
                  scenario === key
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground/70'
                }`}
              >
                {scenarios[key].label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Calculator Body */}
        <div className="max-w-3xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={scenario}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.3 }}
            >
              {/* Stacked income lines */}
              <div className="rounded-2xl border border-border/50 bg-card overflow-hidden shadow-[0_2px_20px_-6px_hsl(var(--ring)/0.06)]">
                {/* Income header */}
                <div className="px-6 pt-5 pb-3 border-b border-border/30">
                  <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-primary/50">
                    Dine indtægtskilder
                  </span>
                </div>

                {/* Income rows */}
                <div className="divide-y divide-border/20">
                  {incomeLines.map((item, i) => {
                    const Icon = item.icon;
                    const value = s[item.key];
                    const isBase = item.primary;
                    return (
                      <div
                        key={item.key}
                        className={`flex items-center gap-4 px-6 py-4 transition-colors ${
                          isBase ? 'bg-primary/[0.03]' : ''
                        }`}
                      >
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          isBase
                            ? 'bg-primary/10 border border-primary/15'
                            : 'bg-secondary/80 border border-border/30'
                        }`}>
                          <Icon className={`w-4 h-4 ${isBase ? 'text-primary' : 'text-primary/60'}`} strokeWidth={1.4} />
                        </div>
                        <span className={`flex-1 text-[13px] font-medium ${
                          isBase ? 'text-foreground' : 'text-muted-foreground'
                        }`}>
                          {item.label}
                        </span>
                        {!isBase && (
                          <Plus className="w-3 h-3 text-primary/30 mr-1" strokeWidth={2} />
                        )}
                        <span className={`text-base font-display font-bold tabular-nums ${
                          isBase ? 'text-foreground' : 'text-foreground/70'
                        }`}>
                          {isBase ? '' : '+'}{fmt(value)} <span className="text-[11px] font-medium text-muted-foreground/50">kr.</span>
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Gross total bar */}
                <div className="px-6 py-4 bg-secondary/40 border-t border-border/30 flex items-center justify-between">
                  <span className="text-[13px] font-semibold text-foreground/80">Bruttoindtægt i alt</span>
                  <span className="text-lg font-display font-bold text-foreground tabular-nums">
                    {fmt(gross)} <span className="text-sm font-medium text-muted-foreground/50">kr.</span>
                  </span>
                </div>

                {/* Visual bar showing composition */}
                <div className="px-6 py-3 border-t border-border/20">
                  <div className="h-2 rounded-full overflow-hidden flex gap-[2px] bg-secondary/40">
                    <motion.div
                      className="bg-primary/60 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${(s.rent / gross) * 100}%` }}
                      transition={{ duration: 0.6, delay: 0.2 }}
                    />
                    <motion.div
                      className="bg-primary/35 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${(s.addons / gross) * 100}%` }}
                      transition={{ duration: 0.6, delay: 0.3 }}
                    />
                    <motion.div
                      className="bg-primary/25 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${(s.consumption / gross) * 100}%` }}
                      transition={{ duration: 0.6, delay: 0.35 }}
                    />
                    <motion.div
                      className="bg-accent/30 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${((s.bedpacks + s.flexibility) / gross) * 100}%` }}
                      transition={{ duration: 0.6, delay: 0.4 }}
                    />
                  </div>
                  <div className="flex items-center gap-4 mt-2.5">
                    <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground/50">
                      <span className="w-2 h-2 rounded-full bg-primary/60" /> Leje
                    </span>
                    <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground/50">
                      <span className="w-2 h-2 rounded-full bg-primary/35" /> Tilvalg
                    </span>
                    <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground/50">
                      <span className="w-2 h-2 rounded-full bg-primary/25" /> Forbrug
                    </span>
                    <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground/50">
                      <span className="w-2 h-2 rounded-full bg-accent/30" /> Ekstra
                    </span>
                  </div>
                </div>
              </div>

              {/* Deductions + Net result */}
              <div className="mt-4 rounded-2xl border border-primary/15 bg-card overflow-hidden shadow-[0_4px_28px_-8px_hsl(var(--ring)/0.08)]">
                {/* Deduction rows */}
                <div className="px-6 py-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] text-muted-foreground">Kommission ({s.commissionPct}%)</span>
                    <span className="text-[14px] font-medium text-muted-foreground/60 tabular-nums">
                      −{fmt(commission)} kr.
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] text-muted-foreground">Estimeret skat</span>
                    <span className="text-[14px] font-medium text-muted-foreground/60 tabular-nums">
                      −{fmt(s.tax)} kr.
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <TrendingUp className="w-3 h-3 text-primary/40" strokeWidth={1.5} />
                    <span className="text-[11px] text-primary/50 font-medium">
                      Merindtjening vs. standardbureau: +{fmt(extras)} kr.
                    </span>
                  </div>
                </div>

                {/* Net highlight */}
                <div className="px-6 py-6 bg-gradient-to-br from-primary/8 via-primary/5 to-accent/5 border-t border-primary/10">
                  <div className="text-[10px] font-bold tracking-[0.15em] uppercase text-primary/40 mb-1">
                    Du beholder estimeret
                  </div>
                  <div className="flex items-baseline gap-2.5">
                    <span className="text-4xl md:text-[2.75rem] font-display font-bold text-foreground tabular-nums leading-none">
                      {fmt(net)}
                    </span>
                    <span className="text-sm text-muted-foreground font-medium">kr. / år</span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-3">
                    <Check className="w-3 h-3 text-primary/50" strokeWidth={2} />
                    <span className="text-[10px] text-muted-foreground/45">Inkl. skattefrit bundfradrag på 50.200 kr.</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Disclaimer + CTA */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-center mt-10 space-y-5"
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
      </div>
    </section>
  );
}
