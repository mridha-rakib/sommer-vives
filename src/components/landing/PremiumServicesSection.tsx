import { motion, AnimatePresence } from 'framer-motion';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { useState, useEffect, useCallback } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight, Megaphone, MessageCircle, SparklesIcon, Globe, Key, Shield, TrendingUp, Settings, Wrench, UserCheck, BarChart3, QrCode, FileCheck, HeartHandshake, type LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from '@/lib/i18n';

import heroInterior from '@/assets/services/hero-interior.jpg';

/* ── All services with detailed, sales-driven copy ── */
const serviceMeta: { icon: LucideIcon; key: string }[] = [
  { icon: Megaphone, key: 's1' },
  { icon: MessageCircle, key: 's2' },
  { icon: Globe, key: 's3' },
  { icon: SparklesIcon, key: 's4' },
  { icon: BarChart3, key: 's5' },
  { icon: Key, key: 's6' },
  { icon: Shield, key: 's7' },
  { icon: TrendingUp, key: 's8' },
  { icon: QrCode, key: 's9' },
  { icon: FileCheck, key: 's10' },
  { icon: Settings, key: 's11' },
  { icon: Wrench, key: 's12' },
  { icon: UserCheck, key: 's13' },
  { icon: HeartHandshake, key: 's14' },
];

type Service = {
  icon: LucideIcon;
  tag: string;
  title: string;
  headline: string;
  desc: string;
  highlight: string;
};

/* ── Animations ── */
const fade = (inView: boolean, delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  animate: inView ? { opacity: 1, y: 0 } : {},
  transition: { duration: 0.8, delay, ease: 'easeOut' as const },
});

/* ── Featured Carousel ── */
function ServiceCarousel({ services }: { services: Service[] }) {
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);

  const next = useCallback(() => setIdx((i) => (i + 1) % services.length), [services.length]);
  const prev = useCallback(() => setIdx((i) => (i - 1 + services.length) % services.length), [services.length]);

  useEffect(() => {
    if (paused) return;
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [paused, next]);

  const s = services[idx];
  const Icon = s.icon;

  return (
    <div
      className="relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Card */}
      <div className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.03] min-h-[280px] md:min-h-[240px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={idx}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="p-8 md:p-10 flex flex-col md:flex-row gap-6 md:gap-10 items-start"
          >
            {/* Icon + tag */}
            <div className="shrink-0">
              <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center mb-3">
                <Icon className="w-6 h-6 text-accent" strokeWidth={1.5} />
              </div>
              <span className="text-accent/50 text-[9px] font-semibold tracking-[0.3em] uppercase">
                {s.tag}
              </span>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <h3 className="font-display text-xl md:text-2xl font-semibold text-white mb-1.5">
                {s.title}
              </h3>
              <p className="text-accent/70 text-[13px] font-medium italic mb-3">
                {s.headline}
              </p>
              <p className="text-white/50 text-[14px] leading-[1.75] mb-4 max-w-[520px]">
                {s.desc}
              </p>
              <span className="inline-flex items-center gap-1.5 text-accent/60 text-[11px] font-medium bg-accent/[0.06] px-3 py-1.5 rounded-full">
                ✦ {s.highlight}
              </span>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Progress dots */}
        <div className="absolute bottom-4 left-8 md:left-10 flex gap-1.5">
          {services.map((_, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              className={`h-1 rounded-full transition-all duration-300 ${
                i === idx ? 'w-6 bg-accent/60' : 'w-1.5 bg-white/15 hover:bg-white/25'
              }`}
            />
          ))}
        </div>

        {/* Nav arrows */}
        <div className="absolute bottom-4 right-8 md:right-10 flex gap-2">
          <button
            onClick={prev}
            className="w-8 h-8 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] flex items-center justify-center transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-white/50" />
          </button>
          <button
            onClick={next}
            className="w-8 h-8 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] flex items-center justify-center transition-colors"
          >
            <ChevronRight className="w-4 h-4 text-white/50" />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Main Section ── */
export function PremiumServicesSection() {
  const { ref, isInView } = useScrollReveal();
  const { ref: ref2, isInView: isInView2 } = useScrollReveal();
  const { t } = useTranslation();
  const services = serviceMeta.map(({ icon, key }) => ({
    icon,
    tag: t(`services.${key}.tag`),
    title: t(`services.${key}.title`),
    headline: t(`services.${key}.headline`),
    desc: t(`services.${key}.desc`),
    highlight: t(`services.${key}.highlight`),
  }));

  return (
    <section className="py-14 md:py-28 bg-background">
      <div className="container mx-auto px-5 md:px-10 max-w-[1100px]">

        {/* ── Hero: image with text overlay ── */}
        <div ref={ref} className="relative rounded-2xl overflow-hidden mb-14 md:mb-20">
          <motion.img
            src={heroInterior}
            alt="Moderne skandinavisk sommerhus"
            className="w-full aspect-[16/9] md:aspect-[2.4/1] min-h-[200px] max-h-[420px] object-cover"
            initial={{ scale: 1.04 }}
            animate={isInView ? { scale: 1 } : {}}
            transition={{ duration: 1.2, ease: 'easeOut' }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/70 to-transparent" />
          <motion.div {...fade(isInView, 0.1)} className="absolute inset-0 flex flex-col justify-center px-7 md:px-12 lg:px-16">
            <div className="max-w-[440px]">
              <span className="text-accent/50 text-[9px] font-semibold tracking-[0.35em] uppercase block mb-3">
                {t('services.eyebrow')}
              </span>
              <h2 className="font-display text-[1.5rem] md:text-[2rem] lg:text-[2.4rem] font-semibold text-white leading-[1.08] tracking-[-0.02em] mb-3">
                {t('services.title')}
                <span className="block text-accent italic font-normal mt-0.5">{t('services.titleAccent')}</span>
              </h2>
              <p className="text-white/55 text-[14px] leading-[1.7] mb-5 max-w-[360px]">
                {t('services.desc')}
              </p>
            </div>
          </motion.div>
        </div>

        {/* ── Slideshow / Carousel ── */}
        <motion.div {...fade(isInView, 0.25)} className="mb-16 md:mb-20">
          <ServiceCarousel services={services} />
        </motion.div>

        {/* ── Full service grid — all 14 services ── */}
        <div ref={ref2} className="hidden md:block">
          <motion.div {...fade(isInView2)} className="mb-10">
            <span className="text-accent/40 text-[9px] font-semibold tracking-[0.35em] uppercase block mb-2">
              {t('services.gridEyebrow')}
            </span>
            <h3 className="font-display text-xl md:text-2xl font-semibold text-white">
              {t('services.gridTitle')}
            </h3>
          </motion.div>

          <div className="hidden md:grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-14">
            {services.map((s, i) => {
              const Icon = s.icon;
              return (
                <motion.div
                  key={i}
                  {...fade(isInView2, 0.04 * i)}
                  className="group p-5 rounded-xl border border-white/[0.04] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.08] transition-all duration-300"
                >
                  <div className="flex items-start gap-3.5 mb-3">
                    <div className="w-9 h-9 rounded-lg bg-accent/[0.08] flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4 text-accent/70" strokeWidth={1.5} />
                    </div>
                    <div className="min-w-0">
                      <span className="text-accent/40 text-[8px] font-semibold tracking-[0.25em] uppercase block mb-0.5">
                        {s.tag}
                      </span>
                      <h4 className="font-display text-[14px] font-semibold text-white/90 leading-tight">
                        {s.title}
                      </h4>
                    </div>
                  </div>
                  <p className="text-white/40 text-[12.5px] leading-[1.65] mb-3 line-clamp-2 group-hover:line-clamp-none transition-all">
                    {s.desc}
                  </p>
                  <span className="text-accent/50 text-[10px] font-medium">
                    ✦ {s.highlight}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* ── CTA ── */}
        <motion.div {...fade(isInView2, 0.5)} className="text-center">
          <Link
            to="/kom-i-gang"
            className="btn-gold inline-flex items-center gap-2.5 px-7 py-3.5 rounded-xl text-sm"
          >
            {t('services.cta')}
            <ArrowRight className="w-3.5 h-3.5" strokeWidth={2} />
          </Link>
          <p className="text-white/25 text-[11px] mt-3">{t('services.ctaSub')}</p>
        </motion.div>
      </div>
    </section>
  );
}
