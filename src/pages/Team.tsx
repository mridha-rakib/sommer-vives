import { PublicLayout } from '@/components/layout/PublicLayout';
import { Phone, Mail, ArrowRight, CheckCircle2, Target, Heart, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import teamEmil from '@/assets/team-emil.jpg';
import teamErik from '@/assets/team-erik.webp';
import heroHouse from '@/assets/hero-house.jpg';
import { useTranslation } from '@/lib/i18n';

function ValuesSection() {
  const { ref, isInView } = useScrollReveal();
  const { t } = useTranslation();
  const items = [
    { icon: Target, title: t('team.v1.title'), desc: t('team.v1.desc') },
    { icon: Zap, title: t('team.v2.title'), desc: t('team.v2.desc') },
    { icon: Heart, title: t('team.v3.title'), desc: t('team.v3.desc') },
  ];
  return (
    <section ref={ref} className="py-24 bg-background text-foreground">
      <div className="container mx-auto px-4 md:px-8 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <span className="text-accent font-body text-sm font-semibold tracking-[0.3em] uppercase block mb-4">{t('team.values.eyebrow')}</span>
          <h2 className="font-display text-3xl md:text-5xl font-semibold">{t('team.values.title')}</h2>
        </motion.div>
        <div className="grid md:grid-cols-3 gap-8">
          {items.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.15 * i }}
              className="text-center group"
            >
              <div className="w-16 h-16 rounded-2xl bg-accent/20 flex items-center justify-center mx-auto mb-4 group-hover:bg-accent/30 transition-colors">
                <item.icon className="w-8 h-8 text-accent" />
              </div>
              <h3 className="font-display text-lg font-semibold mb-2">{item.title}</h3>
              <p className="text-background/60 text-sm">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function StorySection() {
  const { ref, isInView } = useScrollReveal();
  const { t } = useTranslation();
  return (
    <section ref={ref} className="py-24 md:py-32 bg-muted/30">
      <div className="container mx-auto px-4 md:px-8">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            <div className="rounded-2xl overflow-hidden shadow-2xl">
              <img src={heroHouse} alt={t('team.story.imgAlt')} className="w-full h-[400px] object-cover" loading="lazy" />
            </div>
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={isInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="absolute -bottom-6 -right-6 bg-accent text-primary px-8 py-4 rounded-xl shadow-lg"
            >
              <span className="font-display font-bold text-lg">{t('team.story.badge')}</span>
              <span className="block text-sm opacity-80">{t('team.story.badgeSub')}</span>
            </motion.div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <span className="text-accent font-body text-sm font-semibold tracking-[0.3em] uppercase block mb-4">{t('team.story.eyebrow')}</span>
            <h2 className="font-display text-3xl md:text-4xl font-semibold text-primary mb-6">
              {t('team.story.title1')}<br /><span className="text-accent italic font-normal">{t('team.story.title2')}</span>
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-6">
              {t('team.story.p1')}
            </p>
            <p className="text-muted-foreground leading-relaxed mb-6">
              <strong className="text-primary">{t('team.story.p2.bold')}</strong>{t('team.story.p2.post')}
            </p>
            <p className="text-muted-foreground leading-relaxed mb-8">
              {t('team.story.p3')}
            </p>
            <Link to="/how-it-works">
              <Button variant="outline" className="gap-2 group">
                {t('team.story.cta')} <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function ExpertiseSection() {
  const { ref, isInView } = useScrollReveal();
  const { t } = useTranslation();
  const people = [
    { img: teamEmil, name: 'Emil Weng Klockmann', role: t('team.exp.p1.role'),
      items: [t('team.exp.p1.i1'), t('team.exp.p1.i2'), t('team.exp.p1.i3'), t('team.exp.p1.i4')] },
    { img: teamErik, name: 'Erik Bendstrup', role: t('team.exp.p2.role'),
      items: [t('team.exp.p2.i1'), t('team.exp.p2.i2'), t('team.exp.p2.i3'), t('team.exp.p2.i4')] },
  ];
  return (
    <section ref={ref} className="py-24 md:py-32 bg-background">
      <div className="container mx-auto px-4 md:px-8 max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <span className="text-accent font-body text-sm font-semibold tracking-[0.3em] uppercase block mb-4">{t('team.exp.eyebrow')}</span>
          <h2 className="font-display text-3xl md:text-4xl font-semibold text-primary">{t('team.exp.title')}</h2>
        </motion.div>
        <div className="grid md:grid-cols-2 gap-8">
          {people.map((person, pi) => (
            <motion.div
              key={pi}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: pi * 0.15 }}
              className="bg-card rounded-2xl p-8 border border-border hover:shadow-elevated transition-shadow duration-500"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-accent">
                  <img src={person.img} alt={person.name} className="w-full h-full object-cover object-top" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-semibold text-primary">{person.role}</h3>
                  <p className="text-sm text-accent">{person.name}</p>
                </div>
              </div>
              <ul className="space-y-3">
                {person.items.map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4 text-accent flex-shrink-0" /><span>{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="text-center mt-12"
        >
          <Link to="/pricing">
            <Button variant="gold" size="lg" className="gap-2 group">
              {t('team.exp.cta')} <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

export default function Team() {
  const { t } = useTranslation();
  const teamMembers = [
    {
      name: 'Emil Weng Klockmann',
      role: t('team.m1.role'),
      image: teamEmil,
      email: 'emil@sommervibes.dk',
      phone: '+45 12 34 56 78',
      tagline: t('team.m1.tagline'),
    },
    {
      name: 'Erik Bendstrup',
      role: t('team.m2.role'),
      image: teamErik,
      email: 'erik@sommervibes.dk',
      phone: '+45 12 34 56 79',
      tagline: t('team.m2.tagline'),
    },
  ];

  return (
    <PublicLayout>
      <section className="pt-32 pb-20 bg-background overflow-hidden">
        <div className="container mx-auto px-4 md:px-8">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <span className="text-accent font-body text-sm font-semibold tracking-[0.3em] uppercase block mb-6">{t('team.eyebrow')}</span>
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="font-display text-4xl md:text-5xl lg:text-6xl font-semibold text-primary mb-6"
            >
              {t('team.title1')}
              <span className="block text-accent italic font-normal">{t('team.title2')}</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-lg text-muted-foreground max-w-2xl mx-auto"
            >
              {t('team.subtitle')}
            </motion.p>
          </div>
          <div className="flex flex-col md:flex-row justify-center items-start gap-16 md:gap-28 max-w-3xl mx-auto">
            {teamMembers.map((m, i) => (
              <motion.div
                key={m.name}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 + i * 0.15 }}
                className="group text-center"
              >
                <div className="relative w-52 h-52 mx-auto mb-6">
                  <div className="w-full h-full rounded-full overflow-hidden bg-muted border-4 border-background shadow-xl group-hover:shadow-2xl transition-shadow duration-500">
                    <img src={m.image} alt={m.name} className="w-full h-full object-cover object-top" />
                  </div>
                </div>
                <h3 className="font-display text-xl font-semibold text-primary mb-1">{m.name}</h3>
                <p className="text-accent font-medium text-sm mb-4">{m.role}</p>
                <div className="space-y-2 mb-4">
                  <a href={`tel:${m.phone.replace(/\s/g, '')}`} className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-accent transition-colors">
                    <Phone className="h-4 w-4" /><span>{m.phone}</span>
                  </a>
                  <a href={`mailto:${m.email}`} className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-accent transition-colors">
                    <Mail className="h-4 w-4" /><span>{m.email}</span>
                  </a>
                </div>
                <p className="text-xs text-accent/80 font-medium uppercase tracking-wide">{m.tagline}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <ValuesSection />
      <StorySection />
      <ExpertiseSection />

      <section className="py-24 bg-background text-foreground">
        <div className="container mx-auto px-4 text-center max-w-3xl">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}>
            <h2 className="font-display text-3xl md:text-5xl font-semibold mb-6">
              {t('team.cta.title')}
            </h2>
            <p className="text-muted-foreground text-lg mb-12 max-w-2xl mx-auto">
              {t('team.cta.desc')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/contact">
                <Button variant="gold" size="lg" className="gap-2 group">
                  {t('team.cta.contact')} <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link to="/kom-i-gang">
                <Button variant="outline" size="lg" className="border-accent/40 text-accent hover:bg-accent/10">
                  {t('team.cta.start')}
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </PublicLayout>
  );
}
