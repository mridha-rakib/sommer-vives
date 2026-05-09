import { motion } from 'framer-motion';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { Check, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/lib/i18n';
import kvieSoeDrone from '@/assets/kvie-soe-drone.jpg';

export function WhyUsSection() {
  const { ref, isInView } = useScrollReveal();
  const { t } = useTranslation();

  const perks = [t('why.p1'), t('why.p2'), t('why.p3'), t('why.p4'), t('why.p5'), t('why.p6')];

  return (
    <section ref={ref} id="hvorfor" className="relative py-16 md:py-32 overflow-hidden">
      <div className="absolute inset-0">
        <img src={kvieSoeDrone} alt="" className="w-full h-full object-cover" loading="lazy" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/95 to-background/60" />
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-background/40" />
      </div>

      <div className="container mx-auto px-4 md:px-8 relative z-10">
        <div className="max-w-xl">
          <motion.span initial={{ opacity: 0, y: 12 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6 }}
            className="text-accent/60 font-body text-[10px] font-semibold tracking-[0.4em] uppercase block mb-5">{t('why.eyebrow')}</motion.span>

          <motion.h2 initial={{ opacity: 0, y: 20 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.7, delay: 0.1 }}
            className="font-display text-3xl md:text-[2.8rem] font-bold leading-[1.1] mb-8">
            {t('why.title')}<span className="block text-accent italic font-normal mt-1">{t('why.titleAccent')}</span>
          </motion.h2>

          <div className="space-y-4 mb-10">
            {perks.map((item, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -16 }} animate={isInView ? { opacity: 1, x: 0 } : {}} transition={{ duration: 0.4, delay: 0.2 + i * 0.07 }} className="flex items-center gap-3.5">
                <div className="w-5 h-5 rounded-full bg-accent/15 border border-accent/25 flex items-center justify-center flex-shrink-0">
                  <Check className="w-3 h-3 text-accent" />
                </div>
                <span className="text-foreground/85 text-[15px]">{item}</span>
              </motion.div>
            ))}
          </div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, delay: 0.7 }}>
            <Link to="/about">
              <Button variant="outline" className="gap-2 group rounded-full border-accent/20 text-accent/80 hover:bg-accent/[0.06] hover:border-accent/30">
                {t('why.cta')}<ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
