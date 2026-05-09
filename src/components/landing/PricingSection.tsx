import { motion } from 'framer-motion';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { Check, X, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/lib/i18n';

export function PricingSection() {
  const { ref, isInView } = useScrollReveal();
  const { t } = useTranslation();

  const comparison = [
    { feature: t('pricing.rowCommission'), us: '15 %', others: '18–25 %' },
    { feature: t('pricing.rowGuestFee'), us: '5 %', others: '12–18 %' },
    { feature: t('pricing.rowBinding'), us: '6 mdr.', others: '12–24 mdr.' },
    { feature: t('pricing.rowSetup'), us: t('pricing.cta').includes('free') || t('pricing.cta').includes('gratis') || t('pricing.cta').includes('Kostenlos') ? 'Gratis' : 'Gratis', others: '0–5.000 kr.' },
    { feature: t('pricing.rowAdvisor'), us: '✓', others: '✗', usIcon: true, othersIcon: true },
  ];

  return (
    <section ref={ref} id="priser" className="py-16 md:py-32 bg-background">
      <div className="container mx-auto px-4 md:px-8 max-w-5xl">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.7 }} className="text-center mb-16">
          <span className="text-primary font-body text-sm font-semibold tracking-[0.3em] uppercase block mb-4">{t('pricing.eyebrow')}</span>
          <h2 className="font-display text-3xl md:text-5xl font-bold leading-tight">
            {t('pricing.title')}<span className="block text-primary italic font-normal">{t('pricing.titleAccent')}</span>
          </h2>
          <p className="text-muted-foreground mt-4 max-w-lg mx-auto">{t('pricing.subtitle')}</p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-10 lg:gap-16 items-start">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6, delay: 0.1 }}
            className="bg-card border border-border/60 rounded-2xl p-8 md:p-10">
            <div className="mb-6">
              <div className="flex items-baseline gap-1 mb-2">
                <span className="font-display text-6xl font-bold text-accent">15</span>
                <span className="font-display text-2xl font-bold text-accent">%</span>
              </div>
              <p className="text-foreground/80 leading-relaxed">{t('pricing.commission')}</p>
            </div>
            <div className="bg-muted/30 rounded-xl px-5 py-4 mb-6 border border-border/40">
              <div className="flex items-baseline gap-2">
                <span className="font-display text-xl font-semibold text-accent">5 %</span>
                <span className="text-sm text-muted-foreground">{t('pricing.guestFee')}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{t('pricing.guestFeeNote')}</p>
            </div>
            <div className="bg-muted/20 rounded-xl p-5 border border-border/30 mb-6">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">{t('pricing.exampleTitle')}</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('pricing.grossRevenue')}</span>
                  <span className="font-medium text-foreground">100.000 kr.</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('pricing.commissionLabel')}</span>
                  <span className="text-destructive">−15.000 kr.</span>
                </div>
                <div className="border-t border-border/40 pt-2.5 flex justify-between items-baseline">
                  <span className="font-semibold text-foreground">{t('pricing.yourPayout')}</span>
                  <span className="font-display font-bold text-accent text-lg">85.000 kr.</span>
                </div>
              </div>
            </div>
            <Link to="/kom-i-gang">
              <Button variant="gold" size="lg" className="w-full gap-2 group">
                {t('pricing.cta')}<ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 24 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6, delay: 0.25 }}>
            <h3 className="font-display text-lg font-semibold text-foreground mb-4">{t('pricing.compareTitle')}</h3>
            <div className="rounded-xl border border-border/50 overflow-hidden">
              <div className="grid grid-cols-3 bg-muted/40 px-5 py-3 text-xs font-medium uppercase tracking-wider">
                <span className="text-muted-foreground" />
                <span className="text-accent text-center">{t('pricing.colUs')}</span>
                <span className="text-muted-foreground text-center">{t('pricing.colOthers')}</span>
              </div>
              {comparison.map((row, i) => (
                <div key={i} className="grid grid-cols-3 px-5 py-3.5 border-t border-border/30 text-sm">
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
            <p className="text-xs text-muted-foreground mt-4 leading-relaxed">{t('pricing.footer')}</p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
