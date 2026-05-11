import { motion } from 'framer-motion';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, X, CheckCircle2 } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useTranslation } from '@/lib/i18n';

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

/* ── Scenarios ── */
const scenarios = [
  { labelKey: 'earnings.conservative', weeks: 8, nightRate: 1200 },
  { labelKey: 'earnings.realistic', weeks: 14, nightRate: 1400 },
  { labelKey: 'earnings.optimistic', weeks: 22, nightRate: 1600 },
];

/* ── Calculator Dialog ── */
function CalculatorDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  const [tab, setTab] = useState(1); // default middle scenario
  const [income, setIncome] = useState(120000);

  const scenario = scenarios[tab];
  const baseIncome = scenario.weeks * 7 * scenario.nightRate;
  const activeIncome = income || baseIncome;
  const result = calculate(activeIncome);
  const extras = Math.round(activeIncome * 0.2);
  const totalGross = activeIncome + extras;
  const commission = Math.round(totalGross * 0.15);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent hideCloseButton className="sm:max-w-[540px] bg-background border-white/10 text-white p-0 gap-0 rounded-2xl overflow-hidden">
        <div className="p-6 md:p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <span className="text-accent/50 font-body text-[9px] font-semibold tracking-[0.3em] uppercase block mb-1">
                {t('earnings.calcTitle')}
              </span>
              <h3 className="font-display text-lg font-semibold text-white">
                {t('earnings.calcSubtitle')}
              </h3>
            </div>
            <button
              type="button"
              aria-label="Close"
              onClick={onClose}
              className="text-white/40 hover:text-white/70 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scenario tabs */}
          <div className="flex items-center gap-1 bg-white/[0.04] rounded-xl p-1 mb-6">
            {scenarios.map((s, i) => (
              <button
                key={i}
                onClick={() => { setTab(i); setIncome(s.weeks * 7 * s.nightRate); }}
                className={`flex-1 text-[12px] font-medium py-2 rounded-lg transition-all ${
                  tab === i
                    ? 'bg-accent/20 text-accent'
                    : 'text-white/40 hover:text-white/60'
                }`}
              >
                {t(s.labelKey)}
              </button>
            ))}
          </div>

          {/* Slider */}
          <div className="mb-6">
            <div className="flex justify-between items-end mb-3">
              <span className="text-white/50 text-sm">{t('earnings.expectedIncome')}</span>
              <span className="font-display text-xl font-bold text-accent">{fmt(activeIncome)} kr.</span>
            </div>
            <Slider
              value={[activeIncome]}
              onValueChange={(v) => setIncome(v[0])}
              min={20000}
              max={400000}
              step={5000}
              className="my-4"
            />
            <div className="flex justify-between text-[11px] text-white/30">
              <span>20.000 kr.</span>
              <span>400.000 kr.</span>
            </div>
          </div>

          {/* Breakdown */}
          <div className="space-y-0 mb-6">
            {[
              { label: t('earnings.rentalIncome'), value: `${fmt(activeIncome)} kr.`, accent: false },
              { label: t('earnings.addons'), value: `+${fmt(extras)} kr.`, accent: true },
              { label: t('earnings.grossTotal'), value: `${fmt(totalGross)} kr.`, accent: false, bold: true },
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
              { label: t('earnings.commission'), value: `−${fmt(commission)} kr.` },
              { label: t('earnings.estimatedTax'), value: `−${fmt(result.tax)} kr.` },
            ].map((row, i) => (
              <div key={i} className="flex justify-between items-center py-2">
                <span className="text-white/45 text-sm">{row.label}</span>
                <span className="text-white/60 text-sm">{row.value}</span>
              </div>
            ))}
            <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-white/[0.06]">
              <CheckCircle2 className="w-3 h-3 text-accent/60" />
              <span className="text-accent/60 text-[11px]">{t('earnings.taxFreeNote')}</span>
            </div>
          </div>

          {/* Result */}
          <div className="text-center">
            <span className="text-white/40 text-[10px] uppercase tracking-[0.2em] block mb-1">{t('earnings.youKeep')}</span>
            <div className="font-display text-3xl md:text-4xl font-bold text-accent">
              {fmt(result.afterTax - commission + extras * 0.7)} kr.
            </div>
            <span className="text-white/35 text-xs">{t('earnings.perYear')}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-white/[0.06] p-4 text-center">
          <Link
            to="/beregn-lejeindtaegt"
            className="inline-flex items-center gap-2 text-accent/70 text-[13px] font-medium hover:text-accent transition-colors group"
          >
            {t('earnings.seeFullCalc')}
            <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ── Fade helper ── */
const fade = (inView: boolean, delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: inView ? { opacity: 1, y: 0 } : {},
  transition: { duration: 0.9, delay, ease: 'easeOut' as const },
});

/* ── Main Section ── */
export function EarningsSection() {
  const { ref, isInView } = useScrollReveal();
  const { t } = useTranslation();
  const [calcOpen, setCalcOpen] = useState(false);

  return (
    <>
      <section ref={ref} className="py-16 md:py-32 bg-background overflow-hidden">
        <div className="container mx-auto px-5 md:px-10 max-w-[1100px]">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">

            {/* Left — Editorial text */}
            <motion.div {...fade(isInView)} className="max-w-[480px]">
              <span className="text-accent/45 font-body text-[10px] font-semibold tracking-[0.35em] uppercase block mb-5">
                {t('earnings.eyebrow')}
              </span>
              <h2 className="font-display text-[1.7rem] md:text-[2.3rem] lg:text-[2.6rem] font-semibold text-white leading-[1.08] tracking-[-0.02em] mb-5">
                {t('earnings.title')}
                <span className="block text-accent italic font-normal mt-1">{t('earnings.titleAccent')}</span>
              </h2>
              <p className="text-white/55 text-[15px] leading-[1.8] mb-4">
                {t('earnings.p1')}
              </p>
              <p className="text-white/55 text-[15px] leading-[1.8] mb-4">
                {t('earnings.p2')} <strong className="text-white/80">{t('earnings.p2bold')}</strong> {t('earnings.p2end')}
              </p>

              {/* Quick highlights */}
              <div className="grid grid-cols-2 gap-x-6 gap-y-3 mb-8">
                {[
                  { value: t('earnings.h1'), label: t('earnings.l1') },
                  { value: t('earnings.h2'), label: t('earnings.l2') },
                  { value: t('earnings.h3'), label: t('earnings.l3') },
                  { value: t('earnings.h4'), label: t('earnings.l4') },
                ].map((item, i) => (
                  <div key={i} className="flex items-baseline gap-2">
                    <span className="font-display text-lg font-bold text-accent">{item.value}</span>
                    <span className="text-white/40 text-[11px] leading-tight">{item.label}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setCalcOpen(true)}
                className="btn-gold inline-flex items-center gap-2.5 px-7 py-3.5 rounded-xl text-sm group"
              >
                {t('earnings.cta')}
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </button>
            </motion.div>

            {/* Right — Collage-style visual (Landfolk inspired) */}
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={isInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 1.1, delay: 0.2, ease: 'easeOut' }}
              className="relative"
            >
              {/* Main visual — mock dashboard/calendar feel */}
              <div className="rounded-2xl overflow-hidden border border-white/[0.06] bg-white/[0.03] p-6 md:p-8">
                {/* Mini header */}
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <span className="text-white/30 text-[9px] tracking-[0.2em] uppercase block mb-1">{t('earnings.exampleLabel')}</span>
                    <span className="font-display text-lg font-semibold text-white">{t('earnings.exampleDetail')}</span>
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                    <span className="text-accent text-sm">📊</span>
                  </div>
                </div>

                {/* Stacked value preview */}
                <div className="space-y-3 mb-6">
                  {[
                    { label: t('earnings.rentalLabel'), amount: '137.200', bar: 70 },
                    { label: t('earnings.addonsLabel'), amount: '+27.440', bar: 14, accent: true },
                    { label: t('earnings.taxFreeLabel'), amount: '50.200', bar: 25, muted: true },
                  ].map((row, i) => (
                    <div key={i}>
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-white/50 text-[12px]">{row.label}</span>
                        <span className={`text-[13px] font-semibold ${row.accent ? 'text-accent' : row.muted ? 'text-accent/50' : 'text-white/80'}`}>
                          {row.amount} kr.
                        </span>
                      </div>
                      <div className="h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
                        <motion.div
                          className={`h-full rounded-full ${row.accent ? 'bg-accent/60' : row.muted ? 'bg-accent/25' : 'bg-accent/40'}`}
                          initial={{ width: 0 }}
                          animate={isInView ? { width: `${row.bar}%` } : {}}
                          transition={{ duration: 1, delay: 0.5 + i * 0.15, ease: 'easeOut' }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Divider */}
                <div className="h-px bg-white/[0.06] mb-5" />

                {/* Result preview */}
                <div className="flex items-end justify-between">
                  <div>
                    <span className="text-white/30 text-[10px] uppercase tracking-[0.15em] block mb-1">{t('earnings.estimatedPayout')}</span>
                    <span className="font-display text-2xl md:text-3xl font-bold text-accent">101.277 kr.</span>
                    <span className="text-white/30 text-[11px] block mt-0.5">{t('earnings.payoutPerYear')}</span>
                  </div>
                  <button
                    onClick={() => setCalcOpen(true)}
                    className="text-accent/60 text-[11px] font-medium hover:text-accent transition-colors flex items-center gap-1 group"
                  >
                    {t('earnings.adjust')}
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              </div>

              {/* Floating accent card */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.9 }}
                className="absolute -bottom-4 -left-4 md:-bottom-5 md:-left-6 bg-background border border-white/[0.08] rounded-xl px-4 py-3 shadow-elevated"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-accent/60" />
                  <span className="text-white/60 text-[11px] font-medium">{t('earnings.inclTaxFree')}</span>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      <CalculatorDialog open={calcOpen} onClose={() => setCalcOpen(false)} />
    </>
  );
}
