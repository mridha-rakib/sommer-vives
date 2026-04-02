import { motion } from 'framer-motion';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

export function HowItWorksSection() {
  const { ref, isInView } = useScrollReveal();
  const { t } = useTranslation();

  const steps = [
    { number: '01', title: t('how.step1'), description: t('how.step1desc') },
    { number: '02', title: t('how.step2'), description: t('how.step2desc') },
    { number: '03', title: t('how.step3'), description: t('how.step3desc') },
    { number: '04', title: t('how.step4'), description: t('how.step4desc') },
  ];

  return (
    <section ref={ref} className="py-16 md:py-36 bg-card text-foreground overflow-hidden">
      <div className="container mx-auto px-4 md:px-8">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.7 }} className="text-center mb-20">
            <span className="text-primary font-body text-sm font-semibold tracking-[0.3em] uppercase block mb-4">{t('how.eyebrow')}</span>
            <h2 className="font-display text-3xl md:text-5xl lg:text-6xl font-bold leading-tight">
              {t('how.title')}<span className="block text-primary italic font-normal">{t('how.titleAccent')}</span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-4 gap-0 relative">
            <div className="hidden md:block absolute top-8 left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-primary/10 via-primary/30 to-primary/10" />
            {steps.map((step, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 30 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, delay: 0.2 + i * 0.15 }} className="text-center px-4 relative">
                <div className="w-16 h-16 rounded-full border border-primary/20 bg-card flex items-center justify-center mx-auto mb-6 relative z-10">
                  <span className="font-display text-xl font-bold text-primary">{step.number}</span>
                </div>
                <h3 className="font-display text-lg md:text-xl font-bold mb-3">{step.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{step.description}</p>
              </motion.div>
            ))}
          </div>

          <motion.div initial={{ opacity: 0 }} animate={isInView ? { opacity: 1 } : {}} transition={{ duration: 0.5, delay: 0.8 }} className="text-center mt-16">
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/kom-i-gang">
                <Button variant="gold" size="lg" className="gap-2 group rounded-full">
                  {t('how.cta1')}<ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link to="/contact">
                <Button variant="outline" size="lg" className="border-border text-muted-foreground hover:bg-muted hover:text-foreground rounded-full">
                  {t('how.cta2')}
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
