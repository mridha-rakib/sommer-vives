import { motion } from 'framer-motion';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Zap, BedDouble, Clock, Sparkles, X, CheckCircle2 } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import earningsImg from '@/assets/earnings-lifestyle.jpg';

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

/* ── Value props ── */
const valueProps = [
  { icon: Zap, title: 'Forbrugsafregning', desc: 'Gæster betaler el, vand og varme — op til 1.500 kr./uge ekstra til dig.' },
  { icon: BedDouble, title: 'Sengepakker & tillæg', desc: 'Sengepakker, håndklæder og rengøring som tilvalg — 75-200 kr./person.' },
  { icon: Clock, title: 'Fleksibel check-in/out', desc: 'Tidlig ankomst og sen afrejse som betalte tilvalg — 200-500 kr.' },
  { icon: Sparkles, title: 'Skattefrit bundfradrag', desc: 'De første 50.200 kr. af din lejeindtægt er skattefri — hvert år.' },
];

const fade = (inView: boolean, delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: inView ? { opacity: 1, y: 0 } : {},
  transition: { duration: 0.9, delay, ease: 'easeOut' as const },
});

/* ── Calculator Dialog ── */
function CalculatorDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [income, setIncome] = useState(120000);
  const result = calculate(income);
  const commission = Math.round(income * 0.15);
  const extras = Math.round(income * 0.2);
  const totalGross = income + extras;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-[520px] bg-background border-white/10 text-white p-0 gap-0 rounded-2xl overflow-hidden">
        <div className="p-6 md:p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <span className="text-accent/50 font-body text-[9px] font-semibold tracking-[0.3em] uppercase block mb-1">
                Indtjeningsberegner
              </span>
              <h3 className="font-display text-lg font-semibold text-white">
                Se dit potentiale
              </h3>
            </div>
            <button onClick={onClose} className="text-white/40 hover:text-white/70 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Slider */}
          <div className="mb-6">
            <div className="flex justify-between items-end mb-3">
              <span className="text-white/50 text-sm">Forventet lejeindtægt</span>
              <span className="font-display text-xl font-bold text-accent">{fmt(income)} kr.</span>
            </div>
            <Slider
              value={[income]}
              onValueChange={(v) => setIncome(v[0])}
              min={20000}
              max={300000}
              step={5000}
              className="my-4"
            />
            <div className="flex justify-between text-[11px] text-white/30">
              <span>20.000 kr.</span>
              <span>300.000 kr.</span>
            </div>
          </div>

          {/* Breakdown */}
          <div className="space-y-0 mb-6">
            {[
              { label: 'Lejeindtægt', value: `${fmt(income)} kr.`, accent: false },
              { label: 'Tilvalg & forbrug (+20%)', value: `+${fmt(extras)} kr.`, accent: true },
              { label: 'Bruttoindtægt i alt', value: `${fmt(totalGross)} kr.`, accent: false, bold: true },
            ].map((row, i) => (
              <div key={i} className={`flex justify-between items-center py-3 border-b border-white/[0.06] ${row.bold ? 'mt-1' : ''}`}>
                <span className={`text-sm ${row.bold ? 'text-white font-medium' : 'text-white/60'}`}>{row.label}</span>
                <span className={`text-sm font-semibold ${row.accent ? 'text-accent' : row.bold ? 'text-white' : 'text-white/80'}`}>{row.value}</span>
              </div>
            ))}
          </div>

          {/* Deductions */}
          <div className="bg-white/[0.04] rounded-xl p-4 mb-6">
            {[
              { label: 'Kommission (15%)', value: `−${fmt(Math.round(totalGross * 0.15))} kr.` },
              { label: 'Estimeret skat', value: `−${fmt(result.tax)} kr.` },
            ].map((row, i) => (
              <div key={i} className="flex justify-between items-center py-2">
                <span className="text-white/45 text-sm">{row.label}</span>
                <span className="text-white/60 text-sm">{row.value}</span>
              </div>
            ))}
            <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-white/[0.06]">
              <CheckCircle2 className="w-3 h-3 text-accent/60" />
              <span className="text-accent/60 text-[11px]">Inkl. skattefrit bundfradrag på 50.200 kr.</span>
            </div>
          </div>

          {/* Result */}
          <div className="text-center">
            <span className="text-white/40 text-[10px] uppercase tracking-[0.2em] block mb-1">Du beholder estimeret</span>
            <div className="font-display text-3xl md:text-4xl font-bold text-accent">
              {fmt(result.afterTax - commission + extras * 0.7)} kr.
            </div>
            <span className="text-white/35 text-xs">pr. år efter skat og kommission</span>
          </div>
        </div>

        {/* Footer CTA */}
        <div className="border-t border-white/[0.06] p-4 text-center">
          <Link
            to="/beregn-lejeindtaegt"
            className="inline-flex items-center gap-2 text-accent/70 text-[13px] font-medium hover:text-accent transition-colors group"
          >
            Se fuld beregning
            <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ── Main Section ── */
export function EarningsSection() {
  const { ref, isInView } = useScrollReveal();
  const [calcOpen, setCalcOpen] = useState(false);

  return (
    <>
      <section ref={ref} className="py-24 md:py-32 bg-background overflow-hidden">
        <div className="container mx-auto px-5 md:px-10 max-w-[1140px]">
          {/* Editorial hero — image + text */}
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center mb-20 md:mb-28">
            {/* Image */}
            <motion.div
              initial={{ opacity: 0, scale: 1.03 }}
              animate={isInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 1.1, ease: 'easeOut' }}
              className="overflow-hidden rounded-2xl lg:rounded-3xl"
            >
              <img
                src={earningsImg}
                alt="Morgenmad på sommerhusterrasse"
                className="w-full aspect-[4/3] object-cover"
              />
            </motion.div>

            {/* Text */}
            <motion.div {...fade(isInView, 0.15)} className="max-w-[460px]">
              <span className="text-accent/45 font-body text-[10px] font-semibold tracking-[0.35em] uppercase block mb-5">
                Din indtjening
              </span>
              <h2 className="font-display text-[1.7rem] md:text-[2.3rem] lg:text-[2.6rem] font-semibold text-white leading-[1.08] tracking-[-0.02em] mb-5">
                Mere end bare
                <span className="block text-accent italic font-normal mt-1">lejeindtægt</span>
              </h2>
              <p className="text-white/55 text-[15px] leading-[1.8] mb-7">
                Hos SommerVibes tjener du ikke kun på overnatninger. Tilvalg, forbrug og serviceydelser tilfalder dig som ejer — og med skattefradraget på 50.200 kr. beholder du endnu mere.
              </p>
              <button
                onClick={() => setCalcOpen(true)}
                className="btn-gold inline-flex items-center gap-2.5 px-7 py-3.5 rounded-xl text-sm group"
              >
                Beregn din indtjening
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </button>
            </motion.div>
          </div>

          {/* Value props — 4 editorial blocks */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-x-10 gap-y-10">
            {valueProps.map((item, i) => {
              const Icon = item.icon;
              return (
                <motion.div key={i} {...fade(isInView, 0.08 * i)} className="flex gap-4">
                  <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-accent/70" strokeWidth={1.5} />
                  </div>
                  <div>
                    <h4 className="font-display text-[15px] font-semibold text-white/85 mb-1.5">{item.title}</h4>
                    <p className="text-white/40 text-[13px] leading-[1.65]">{item.desc}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      <CalculatorDialog open={calcOpen} onClose={() => setCalcOpen(false)} />
    </>
  );
}
