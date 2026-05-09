import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { Check, X, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/lib/i18n';
import kvieSoeDrone from '@/assets/kvie-soe-drone.jpg';

export function WhyUsPricingSection() {
  const { ref, isInView } = useScrollReveal();
  const { t } = useTranslation();

  const perks = [t('why.p1'), t('why.p2'), t('why.p3'), t('why.p4'), t('why.p5'), t('why.p6')];

  const comparison = [
    { feature: t('pricing.rowCommission'), us: '15 %', others: '18–25 %' },
    { feature: t('pricing.rowGuestFee'), us: '5 %', others: '12–18 %' },
    { feature: t('pricing.rowBinding'), us: '6 mdr.', others: '12–24 mdr.' },
    { feature: t('pricing.rowSetup'), us: 'Gratis', others: '0–5.000 kr.' },
    { feature: t('pricing.rowAdvisor'), us: '✓', others: '✗', usIcon: true, othersIcon: true },
  ];

  return (
    <section ref={ref} id="hvorfor" className="relative py-16 md:py-28 overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0">
        <img src={kvieSoeDrone} alt="" className="w-full h-full object-cover" loading="lazy" />
        <div className="absolute inset-0 bg-background/90 md:bg-gradient-to-r md:from-background md:via-background/95 md:to-background/80" />
      </div>

      <div className="container mx-auto px-4 md:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-14 max-w-[1140px] mx-auto items-start">

          {/* Left — Why us */}
          <div>
            <motion.span initial={{ opacity: 0, y: 12 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6 }}
              className="text-accent/60 font-body text-[10px] font-semibold tracking-[0.4em] uppercase block mb-4">{t('why.eyebrow')}</motion.span>

            <motion.h2 initial={{ opacity: 0, y: 20 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.7, delay: 0.1 }}
              className="font-display text-2xl md:text-3xl font-bold leading-[1.1] mb-6">
              {t('why.title')}<span className="block text-accent italic font-normal mt-1">{t('why.titleAccent')}</span>
            </motion.h2>

            <motion.div initial={{ opacity: 0 }} animate={isInView ? { opacity: 1 } : {}} transition={{ duration: 0.5, delay: 0.2 }}
              className="flex gap-1 mb-6">
              {[...Array(5)].map((_, j) => <Star key={j} className="w-4 h-4 text-accent fill-accent/80" strokeWidth={0} />)}
            </motion.div>
            <div className="space-y-3 mb-8">
              {perks.map((item, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -12 }} animate={isInView ? { opacity: 1, x: 0 } : {}} transition={{ duration: 0.35, delay: 0.15 + i * 0.06 }} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-accent/15 border border-accent/25 flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 text-accent" />
                  </div>
                  <span className="text-foreground/85 text-[14px]">{item}</span>
                </motion.div>
              ))}
            </div>

            <motion.div initial={{ opacity: 0, y: 12 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, delay: 0.6 }}>
              <Link to="/about">
                <Button variant="outline" className="gap-2 group rounded-full border-accent/20 text-accent/80 hover:bg-accent/[0.06] hover:border-accent/30 text-[13px]">
                  {t('why.cta')}<ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </motion.div>
          </div>

          {/* Right — Pricing */}
          <div id="priser">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6, delay: 0.1 }}>
              <span className="text-primary font-body text-[10px] font-semibold tracking-[0.3em] uppercase block mb-4">{t('pricing.eyebrow')}</span>
              <h2 className="font-display text-2xl md:text-3xl font-bold leading-[1.1] mb-2">
                {t('pricing.title')}<span className="block text-primary italic font-normal">{t('pricing.titleAccent')}</span>
              </h2>
              <p className="text-muted-foreground text-[13.5px] mb-6">{t('pricing.subtitle')}</p>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-2xl p-6 md:p-7 mb-6">
              <div className="flex items-baseline gap-1 mb-1.5">
                <span className="font-display text-5xl font-bold text-accent">15</span>
                <span className="font-display text-xl font-bold text-accent">%</span>
              </div>
              <p className="text-foreground/80 text-[13.5px] leading-relaxed mb-4">{t('pricing.commission')}</p>

              <div className="bg-muted/30 rounded-xl px-4 py-3 mb-4 border border-border/40">
                <div className="flex items-baseline gap-2">
                  <span className="font-display text-lg font-semibold text-accent">5 %</span>
                  <span className="text-xs text-muted-foreground">{t('pricing.guestFee')}</span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">{t('pricing.guestFeeNote')}</p>
              </div>

              <div className="bg-muted/20 rounded-xl p-4 border border-border/30 mb-4">
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2">{t('pricing.exampleTitle')}</p>
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground text-[13px]">{t('pricing.grossRevenue')}</span>
                    <span className="font-medium text-foreground text-[13px]">100.000 kr.</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground text-[13px]">{t('pricing.commissionLabel')}</span>
                    <span className="text-destructive text-[13px]">−15.000 kr.</span>
                  </div>
                  <div className="border-t border-border/40 pt-2 flex justify-between items-baseline">
                    <span className="font-semibold text-foreground text-[13px]">{t('pricing.yourPayout')}</span>
                    <span className="font-display font-bold text-accent text-base">85.000 kr.</span>
                  </div>
                </div>
              </div>

              <Link to="/kom-i-gang">
                <Button variant="gold" size="default" className="w-full gap-2 group text-[13px]">
                  {t('pricing.cta')}<ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </motion.div>

            {/* Comparison table */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6, delay: 0.35 }}>
              <h3 className="font-display text-sm font-semibold text-foreground mb-3">{t('pricing.compareTitle')}</h3>
              <div className="rounded-xl border border-border/40 overflow-hidden text-[12.5px]">
                <div className="grid grid-cols-3 bg-muted/40 px-4 py-2.5 text-[10px] font-medium uppercase tracking-wider">
                  <span className="text-muted-foreground" />
                  <span className="text-accent text-center">{t('pricing.colUs')}</span>
                  <span className="text-muted-foreground text-center">{t('pricing.colOthers')}</span>
                </div>
                {comparison.map((row, i) => (
                  <div key={i} className="grid grid-cols-3 px-4 py-2.5 border-t border-border/25">
                    <span className="text-foreground/80">{row.feature}</span>
                    <span className="text-center font-medium text-accent">
                      {row.usIcon ? <Check className="w-3.5 h-3.5 mx-auto text-accent" /> : row.us}
                    </span>
                    <span className="text-center text-muted-foreground">
                      {row.othersIcon ? <X className="w-3.5 h-3.5 mx-auto text-muted-foreground/60" /> : row.others}
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-muted-foreground mt-3 leading-relaxed">{t('pricing.footer')}</p>
            </motion.div>
          </div>

        </div>
      </div>
    </section>
  );
}
