import { motion } from 'framer-motion';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { Slider } from '@/components/ui/slider';

const TAX_FREE_AMOUNT = 50200;

function calculate(income: number) {
  const taxFree = Math.min(income, TAX_FREE_AMOUNT);
  const remaining = Math.max(0, income - TAX_FREE_AMOUNT);
  const taxFreeProfit = remaining * 0.4;
  const taxableProfit = remaining * 0.6;
  const tax = taxableProfit * 0.34;
  return {
    afterTax: taxFree + taxFreeProfit + (taxableProfit - tax),
    taxFree,
    tax,
  };
}

const fmt = (n: number) => new Intl.NumberFormat('da-DK', { maximumFractionDigits: 0 }).format(n);

export function TaxBenefitSection() {
  const { ref, isInView } = useScrollReveal();
  const [income, setIncome] = useState(80000);
  const result = calculate(income);
  const commissionAmount = Math.round(income * 0.15);

  return (
    <section ref={ref} className="py-24 md:py-32 bg-muted/20 overflow-hidden">
      <div className="container mx-auto px-4 md:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left text */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.7 }}
            >
              <span className="text-accent font-body text-sm font-semibold tracking-[0.3em] uppercase block mb-4">
                Skattefordel
              </span>
              <h2 className="font-display text-3xl md:text-5xl font-bold text-primary mb-6 leading-tight">
                Tjen op til {fmt(TAX_FREE_AMOUNT)} kr.
                <span className="block text-accent italic font-normal">helt skattefrit</span>
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed mb-8">
                Som sommerhusudlejer gennem SommerVibes får du adgang til det fulde
                bundfradrag. Træk i slideren og se, hvad du kan tjene efter skat.
              </p>
              <Link to="/beregn-lejeindtaegt">
                <Button variant="link" className="text-primary gap-2 p-0 text-base font-medium group">
                  Se fuld beregning
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </motion.div>

            {/* Right interactive calculator */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="bg-primary text-primary-foreground rounded-3xl p-8 md:p-10"
            >
              <div className="mb-8">
                <div className="flex justify-between items-end mb-4">
                  <span className="text-primary-foreground/60 text-sm font-body uppercase tracking-wider">Brutto lejeindtægt</span>
                  <span className="font-display text-3xl font-bold text-accent">{fmt(income)} kr.</span>
                </div>
                <Slider
                  value={[income]}
                  onValueChange={(v) => setIncome(v[0])}
                  min={20000}
                  max={300000}
                  step={5000}
                  className="my-6"
                />
                <div className="flex justify-between text-xs text-primary-foreground/40 font-body">
                  <span>20.000 kr.</span>
                  <span>300.000 kr.</span>
                </div>
              </div>

              <div className="space-y-4 mb-8">
                {[
                  { label: 'SommerVibes kommission (15%)', value: `-${fmt(commissionAmount)} kr.`, muted: true },
                  { label: 'Skattefrit bundfradrag', value: `${fmt(result.taxFree)} kr.`, muted: false },
                  { label: 'Skat (gns. ca. 34%)', value: `-${fmt(result.tax)} kr.`, muted: true },
                ].map((row, i) => (
                  <div key={i} className="flex justify-between items-center py-3 border-b border-primary-foreground/10">
                    <span className={`text-sm ${row.muted ? 'text-primary-foreground/50' : 'text-primary-foreground/80'}`}>{row.label}</span>
                    <span className={`font-body font-semibold ${row.muted ? 'text-primary-foreground/60' : 'text-accent'}`}>{row.value}</span>
                  </div>
                ))}
              </div>

              <div className="bg-primary-foreground/5 rounded-2xl p-6 text-center">
                <div className="text-primary-foreground/50 text-sm mb-1 font-body uppercase tracking-wider">Du beholder ca.</div>
                <div className="font-display text-4xl md:text-5xl font-bold text-accent">
                  {fmt(result.afterTax - commissionAmount)} kr.
                </div>
                <div className="text-primary-foreground/40 text-xs mt-2">efter skat og kommission</div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
