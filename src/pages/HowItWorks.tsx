import { PublicLayout } from '@/components/layout/PublicLayout';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { ClipboardList, Camera, Home, Calendar, Banknote, ArrowRight, Check, Star, Shield, Zap, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import heroHouse from '@/assets/hero-house.jpg';
import { ContextualFAQ } from '@/components/landing/ContextualFAQ';
import { useTranslation } from '@/lib/i18n';

function StepsSection() {
  const { ref, isInView } = useScrollReveal();
  const { t } = useTranslation();
  const steps = [
    { number: '01', icon: ClipboardList, title: t('how.page.step1.title'), description: t('how.page.step1.desc') },
    { number: '02', icon: Camera, title: t('how.page.step2.title'), description: t('how.page.step2.desc') },
    { number: '03', icon: Home, title: t('how.page.step3.title'), description: t('how.page.step3.desc') },
    { number: '04', icon: Calendar, title: t('how.page.step4.title'), description: t('how.page.step4.desc') },
    { number: '05', icon: Banknote, title: t('how.page.step5.title'), description: t('how.page.step5.desc') },
  ];

  return (
    <section ref={ref} className="py-24 md:py-32 bg-background">
      <div className="container mx-auto px-4 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <span className="text-accent font-body text-sm font-semibold tracking-[0.3em] uppercase block mb-4">{t('how.page.processEyebrow')}</span>
          <h2 className="font-display text-3xl md:text-5xl font-bold text-primary">{t('how.page.processTitle')}</h2>
        </motion.div>
        <div className="max-w-4xl mx-auto">
          {steps.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -30 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.1 * i }}
              className="flex gap-6 md:gap-10 items-start mb-12 last:mb-0 group"
            >
              <div className="flex-shrink-0 relative">
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors duration-300">
                  <step.icon className="w-8 h-8 md:w-10 md:h-10 text-accent" />
                </div>
                <span className="absolute -top-2 -left-2 w-8 h-8 rounded-full bg-primary text-background text-xs font-bold flex items-center justify-center">
                  {step.number}
                </span>
                {i < steps.length - 1 && (
                  <div className="absolute left-1/2 top-full w-0.5 h-12 bg-border -translate-x-1/2" />
                )}
              </div>
              <div className="pt-2">
                <h3 className="font-display text-xl md:text-2xl font-semibold text-primary mb-2 group-hover:text-accent transition-colors duration-300">{step.title}</h3>
                <p className="text-muted-foreground md:text-lg">{step.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="text-center mt-16"
        >
          <Link to="/kom-i-gang">
            <Button variant="gold" size="lg" className="gap-2 group">
              {t('how.page.startJourney')} <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

function WhySection() {
  const { ref, isInView } = useScrollReveal();
  const { t } = useTranslation();
  const points = [
    t('why.p1'),
    t('why.p2'),
    t('why.p3'),
    t('why.p4'),
    t('why.p5'),
    t('why.p6'),
  ];
  return (
    <section ref={ref} className="py-24 md:py-32 bg-muted/30">
      <div className="container mx-auto px-4 md:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            <div className="rounded-2xl overflow-hidden shadow-2xl">
              <img src={heroHouse} alt="Sommerhus" className="w-full h-[400px] object-cover" loading="lazy" />
            </div>
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={isInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="absolute -bottom-6 -right-6 bg-accent text-primary px-8 py-4 rounded-xl shadow-lg"
            >
              <span className="font-display font-bold text-2xl">15%</span>
              <span className="block text-sm">{t('pricing.rowCommission').toLowerCase()}</span>
            </motion.div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <span className="text-accent font-body text-sm font-semibold tracking-[0.3em] uppercase block mb-4">{t('why.eyebrow')}</span>
            <h2 className="font-display text-3xl md:text-4xl font-semibold text-primary mb-6">
              {t('why.title')}<br /><span className="text-accent italic font-normal">{t('why.titleAccent')}</span>
            </h2>
            <div className="space-y-4 mb-8">
              {points.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 20 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.4, delay: 0.3 + i * 0.08 }}
                  className="flex items-center gap-3"
                >
                  <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
                    <Check className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-muted-foreground">{item}</span>
                </motion.div>
              ))}
            </div>
            <Link to="/team">
              <Button variant="outline" className="gap-2 group">
                {t('why.cta')} <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

export default function HowItWorks() {
  const { t } = useTranslation();
  const howFAQs = [
    { q: t('how.page.faq1.q'), a: t('how.page.faq1.a') },
    { q: t('how.page.faq2.q'), a: t('how.page.faq2.a') },
    { q: t('how.page.faq3.q'), a: t('how.page.faq3.a') },
    { q: t('how.page.faq4.q'), a: t('how.page.faq4.a') },
  ];
  const benefits = [
    { icon: Star, title: t('how.page.benefit1.title'), desc: t('how.page.benefit1.desc') },
    { icon: Shield, title: t('how.page.benefit2.title'), desc: t('how.page.benefit2.desc') },
    { icon: Zap, title: t('how.page.benefit3.title'), desc: t('how.page.benefit3.desc') },
    { icon: Users, title: t('how.page.benefit4.title'), desc: t('how.page.benefit4.desc') },
  ];

  return (
    <PublicLayout>
      {/* Hero */}
      <section className="relative pt-32 pb-20 bg-background text-foreground overflow-hidden">
        <div className="container mx-auto px-4 md:px-8 text-center relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <span className="text-accent font-body text-sm font-semibold tracking-[0.3em] uppercase block mb-6">{t('how.eyebrow')}</span>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-6"
          >
            {t('how.page.heroTitle')}
            <span className="block text-accent italic font-normal">{t('how.page.heroAccent')}</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10"
          >
            {t('how.page.heroSubtitle')}
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link to="/kom-i-gang">
              <Button variant="gold" size="lg" className="gap-2 group">
                {t('nav.getStarted')} <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link to="/beregn-lejeindtaegt">
              <Button variant="outline" size="lg" className="border-accent/40 text-accent hover:bg-accent/10">
                {t('how.page.seeEarnings')}
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Benefits bar */}
      <section className="py-8 bg-muted/50 border-y border-border">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-8 md:gap-16">
            {benefits.map((b, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.8 + i * 0.1 }}
                className="flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                  <b.icon className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <div className="font-medium text-primary text-sm">{b.title}</div>
                  <div className="text-xs text-muted-foreground">{b.desc}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <StepsSection />
      <ContextualFAQ
        eyebrow={t('how.page.faqEyebrow')}
        heading={t('how.page.faqHeading')}
        items={howFAQs}
      />
      <WhySection />

      {/* CTA */}
      <section className="py-24 bg-background text-foreground">
        <div className="container mx-auto px-4 md:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}>
            <h2 className="font-display text-3xl md:text-5xl font-bold mb-6">{t('how.page.bottomTitle')}</h2>
            <p className="text-muted-foreground text-lg mb-10 max-w-2xl mx-auto">
              {t('how.page.bottomSubtitle')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/kom-i-gang">
                <Button variant="gold" size="lg" className="gap-2 group">
                  {t('hero.cta1')} <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link to="/book-vurdering">
                <Button variant="outline" size="lg" className="border-accent/40 text-accent hover:bg-accent/10">
                  {t('hero.cta2')}
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </PublicLayout>
  );
}
