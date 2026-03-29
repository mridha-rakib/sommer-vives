import { motion, AnimatePresence } from 'framer-motion';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, TrendingUp, Calculator, Zap, BedDouble, Clock, Sparkles, CheckCircle2 } from 'lucide-react';
import { Slider } from '@/components/ui/slider';

/* ── Tax calculator logic ── */
const TAX_FREE_AMOUNT = 50200;
function calculate(income: number) {
  const taxFree = Math.min(income, TAX_FREE_AMOUNT);
  const remaining = Math.max(0, income - TAX_FREE_AMOUNT);
  const taxFreeProfit = remaining * 0.4;
  const taxableProfit = remaining * 0.6;
  const tax = taxableProfit * 0.34;
  return { afterTax: taxFree + taxFreeProfit + (taxableProfit - tax), taxFree, tax };
}
const fmt = (n: number) => new Intl.NumberFormat('da-DK', { maximumFractionDigits: 0 }).format(n);

/* ── Revenue categories ── */
const categories = [
  { icon: Zap, title: 'Forbrugsafregning', share: 8, highlight: 'Op til 1.500 kr./uge' },
  { icon: BedDouble, title: 'Tillægspakker', share: 5, highlight: '75-200 kr./person' },
  { icon: Clock, title: 'Fleksibilitet', share: 4, highlight: '200-500 kr./tilvalg' },
  { icon: Sparkles, title: 'Service & gebyrer', share: 3, highlight: '800-1.500 kr./ophold' },
];

type Tab = 'revenue' | 'tax';

export function EarningsSection() {
  const { ref, isInView } = useScrollReveal();
  const [tab, setTab] = useState<Tab>('revenue');
  const [income, setIncome] = useState(80000);
  const result = calculate(income);
  const commission = Math.round(income * 0.15);

  return (
    <section ref={ref} className="py-20 md:py-28 bg-primary text-primary-foreground overflow-hidden relative">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--accent)/0.06),transparent_70%)]" />

      <div className="container mx-auto px-4 md:px-8 relative">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-10"
        >
          <h2 className="font-display text-3xl md:text-5xl font-bold text-primary-foreground mb-4">
            Hvad kan du <span className="text-accent italic font-normal">tjene?</span>
          </h2>
          <p className="text-primary-foreground/50 max-w-xl mx-auto text-sm md:text-base">
            Udforsk din ekstra indtjening og se hvad du beholder efter skat.
          </p>
        </motion.div>

        {/* Tab switcher */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex justify-center gap-2 mb-10"
        >
          {[
            { key: 'revenue' as Tab, icon: TrendingUp, label: '+20% merindtjening' },
            { key: 'tax' as Tab, icon: Calculator, label: 'Skatteberegner' },
          ].map(({ key, icon: Icon, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${
                tab === key
                  ? 'bg-accent text-primary shadow-[0_0_20px_hsl(var(--accent)/0.3)]'
                  : 'bg-primary-foreground/5 text-primary-foreground/50 hover:bg-primary-foreground/10 border border-primary-foreground/10'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </motion.div>

        {/* Tab content */}
        <AnimatePresence mode="wait">
          {tab === 'revenue' ? (
            <motion.div
              key="revenue"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.4 }}
              className="max-w-3xl mx-auto"
            >
              {/* Revenue cards as a compact 2x2 grid */}
              <div className="grid grid-cols-2 gap-3 md:gap-4 mb-8">
                {categories.map((cat, i) => {
                  const Icon = cat.icon;
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.4, delay: i * 0.08 }}
                      className="group rounded-2xl border border-primary-foreground/8 bg-primary-foreground/[0.03] p-5 hover:bg-accent/8 hover:border-accent/20 transition-all duration-400"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-9 h-9 rounded-xl bg-primary-foreground/5 group-hover:bg-accent/15 flex items-center justify-center transition-colors">
                          <Icon className="w-4 h-4 text-primary-foreground/40 group-hover:text-accent transition-colors" />
                        </div>
                        <span className="font-display text-xl font-bold text-primary-foreground/15 group-hover:text-accent transition-colors">
                          +{cat.share}%
                        </span>
                      </div>
                      <h3 className="font-display text-sm font-bold text-primary-foreground mb-1">{cat.title}</h3>
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3 h-3 text-accent/50" />
                        <span className="text-xs text-primary-foreground/40">{cat.highlight}</span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              <p className="text-center text-primary-foreground/40 text-sm mb-5">
                Andre bureauer beholder disse indtægter. Hos SommerVibes er de <strong className="text-primary-foreground/70">dine</strong>.
              </p>
              <div className="text-center">
                <Link to="/kom-i-gang">
                  <Button variant="gold" size="lg" className="gap-2 group rounded-full">
                    Beregn din indtægt
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="tax"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.4 }}
              className="max-w-xl mx-auto"
            >
              <div className="bg-primary-foreground/[0.03] border border-primary-foreground/10 rounded-3xl p-6 md:p-8">
                {/* Slider */}
                <div className="mb-6">
                  <div className="flex justify-between items-end mb-3">
                    <span className="text-primary-foreground/50 text-sm">Brutto lejeindtægt</span>
                    <span className="font-display text-2xl font-bold text-accent">{fmt(income)} kr.</span>
                  </div>
                  <Slider
                    value={[income]}
                    onValueChange={(v) => setIncome(v[0])}
                    min={20000}
                    max={300000}
                    step={5000}
                    className="my-4"
                  />
                  <div className="flex justify-between text-xs text-primary-foreground/30">
                    <span>20.000 kr.</span>
                    <span>300.000 kr.</span>
                  </div>
                </div>

                {/* Breakdown */}
                <div className="space-y-3 mb-6">
                  {[
                    { label: 'Kommission (15%)', value: `-${fmt(commission)} kr.`, muted: true },
                    { label: 'Skattefrit bundfradrag', value: `${fmt(result.taxFree)} kr.`, muted: false },
                    { label: 'Skat (gns. ~34%)', value: `-${fmt(result.tax)} kr.`, muted: true },
                  ].map((row, i) => (
                    <div key={i} className="flex justify-between items-center py-2.5 border-b border-primary-foreground/8">
                      <span className={`text-sm ${row.muted ? 'text-primary-foreground/40' : 'text-primary-foreground/70'}`}>{row.label}</span>
                      <span className={`font-semibold ${row.muted ? 'text-primary-foreground/50' : 'text-accent'}`}>{row.value}</span>
                    </div>
                  ))}
                </div>

                {/* Result */}
                <div className="bg-primary-foreground/5 rounded-2xl p-5 text-center">
                  <div className="text-primary-foreground/40 text-xs mb-1 uppercase tracking-wider">Du beholder ca.</div>
                  <div className="font-display text-3xl md:text-4xl font-bold text-accent">
                    {fmt(result.afterTax - commission)} kr.
                  </div>
                  <div className="text-primary-foreground/30 text-xs mt-1">efter skat og kommission</div>
                </div>
              </div>

              <div className="text-center mt-6">
                <Link to="/beregn-lejeindtaegt">
                  <Button variant="link" className="text-accent gap-2 p-0 text-sm font-medium group">
                    Se fuld beregning
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
