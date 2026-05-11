import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Star, Handshake, ShieldCheck, MessageCircle, TrendingUp, Sparkles, HeartHandshake, Megaphone, Globe, Key, BarChart3, Wrench, FileCheck, Plus } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n';

const ROTATING_BENEFITS = [
  { icon: TrendingUp, textKey: 'hero.benefit1' },
  { icon: HeartHandshake, textKey: 'hero.benefit2' },
  { icon: Sparkles, textKey: 'hero.benefit3' },
  { icon: ShieldCheck, textKey: 'hero.benefit4' },
  { icon: Star, textKey: 'hero.benefit5' },
  { icon: MessageCircle, textKey: 'hero.benefit6' },
  { icon: Globe, textKey: 'hero.benefit7' },
  { icon: Megaphone, textKey: 'hero.benefit8' },
  { icon: BarChart3, textKey: 'hero.benefit9' },
  { icon: Key, textKey: 'hero.benefit10' },
  { icon: Sparkles, textKey: 'hero.benefit11' },
  { icon: ShieldCheck, textKey: 'hero.benefit12' },
  { icon: Plus, textKey: 'hero.benefit13' },
  { icon: Wrench, textKey: 'hero.benefit14' },
  { icon: FileCheck, textKey: 'hero.benefit15' },
];

export function HeroSection() {
  const { t } = useTranslation();
  const prefersReducedMotion = useReducedMotion();
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [benefitIndex, setBenefitIndex] = useState(0);

  useEffect(() => {
    if (prefersReducedMotion) return;
    const id = setInterval(() => {
      setBenefitIndex((i) => (i + 1) % ROTATING_BENEFITS.length);
    }, 2600);
    return () => clearInterval(id);
  }, [prefersReducedMotion]);

  const CurrentIcon = ROTATING_BENEFITS[benefitIndex].icon;

  return (
    <section className="relative min-h-[100dvh] flex flex-col overflow-hidden">
      {/* Background video */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background/95 to-primary/10" />
        <video
          autoPlay={!prefersReducedMotion} loop muted playsInline
          onLoadedData={() => setVideoLoaded(true)}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity [transition-duration:1500ms] ${videoLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-105'}`}
        >
          <source src="/videos/hero.mp4" type="video/mp4" />
        </video>
        {/* Cinematic overlays for depth */}
        <div className="absolute inset-0 bg-gradient-to-b from-background/55 via-background/35 to-background/95" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_50%,transparent_0%,hsl(var(--background)/0.45)_70%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_75%_40%,hsl(var(--accent)/0.10),transparent_55%)]" />
      </div>

      {/* Subtle floating accents */}
      {!prefersReducedMotion && (
        <motion.div
          aria-hidden
          className="absolute top-[20%] right-[8%] w-[420px] h-[420px] rounded-full bg-accent/[0.05] blur-[120px] z-0"
          animate={{ y: [0, -20, 0], opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}

      {/* Main Content */}
      <div className="relative z-10 flex-1 flex items-center">
        <div className="container mx-auto px-4 md:px-8 py-20 md:py-28">
          <div className="max-w-2xl">
            {/* Eyebrow */}
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.15 }}
              className="mb-5 sm:mb-7"
            >
              <span className="inline-flex items-center gap-2.5 bg-accent/10 backdrop-blur-md border border-accent/25 rounded-full px-4 py-1.5 text-accent font-body text-[10px] sm:text-[11px] font-semibold tracking-[0.32em] uppercase">
                <span className={`w-1.5 h-1.5 rounded-full bg-accent ${prefersReducedMotion ? '' : 'animate-pulse'}`} />
                {t('hero.badge')}
              </span>
            </motion.div>

            {/* Fixed headline — no rotation, no wrapping issues */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.3, ease: 'easeOut' }}
              className="font-display font-bold text-foreground mb-6 sm:mb-7 tracking-[-0.025em]
                         text-[2.25rem] sm:text-[2.75rem] md:text-5xl lg:text-[4.25rem]
                         leading-[1.02]"
            >
              {t('hero.title1')}
              <br />
              <span
                className="italic font-normal text-accent"
                style={{
                  backgroundImage: 'linear-gradient(135deg, hsl(var(--accent)) 0%, hsl(var(--accent) / 0.78) 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                {t('hero.title2')}
              </span>
            </motion.h1>

            {/* Rotating benefits line — the new "wow" element */}
            <motion.div
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.55 }}
              className="mb-8 sm:mb-10"
            >
              <div className="flex items-center gap-3 min-h-[44px]">
                <div className="relative w-9 h-9 flex-shrink-0 rounded-full bg-accent/12 border border-accent/25 flex items-center justify-center backdrop-blur-sm overflow-hidden">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={`icon-${benefitIndex}`}
                      initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.6, rotate: -20 }}
                      animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, scale: 1, rotate: 0 }}
                      exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.6, rotate: 20 }}
                      transition={{ duration: prefersReducedMotion ? 0.2 : 0.45, ease: [0.22, 1, 0.36, 1] }}
                      className="absolute inset-0 flex items-center justify-center"
                    >
                      <CurrentIcon className="w-4 h-4 text-accent" strokeWidth={2} />
                    </motion.div>
                  </AnimatePresence>
                </div>

                <div className="relative overflow-hidden flex-1 min-h-[28px] flex items-center">
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={`text-${benefitIndex}`}
                      initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 18, filter: 'blur(6px)' }}
                      animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0, filter: 'blur(0px)' }}
                      exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -18, filter: 'blur(6px)' }}
                      transition={{ duration: prefersReducedMotion ? 0.2 : 0.6, ease: [0.22, 1, 0.36, 1] }}
                      className="text-[15px] sm:text-base md:text-lg text-foreground/90 font-medium leading-snug"
                    >
                      {t(ROTATING_BENEFITS[benefitIndex].textKey)}
                    </motion.span>
                  </AnimatePresence>
                </div>
              </div>

              {/* Progress dots */}
              <div className="flex items-center gap-1.5 mt-4 ml-12">
                {ROTATING_BENEFITS.map((_, i) => (
                  <motion.div
                    key={i}
                    className="h-[3px] rounded-full"
                    animate={{
                      width: i === benefitIndex ? 24 : 6,
                      backgroundColor: i === benefitIndex ? 'hsl(var(--accent))' : 'hsl(var(--foreground) / 0.18)',
                    }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                  />
                ))}
              </div>
            </motion.div>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 1.15 }}
              className="flex flex-col sm:flex-row gap-3 sm:gap-3.5 items-stretch sm:items-center"
            >
              <Link to="/book-vurdering">
                <Button
                  variant="gold"
                  size="xl"
                  className="gap-2.5 text-[15px] group w-full sm:w-auto px-8 shadow-[0_8px_32px_-8px_hsl(var(--accent)/0.55)] hover:shadow-[0_12px_40px_-6px_hsl(var(--accent)/0.7)] transition-all duration-500"
                >
                  {t('hero.cta2')}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link to="/kom-i-gang">
                <Button
                  variant="outline"
                  size="xl"
                  className="border-foreground/20 text-foreground hover:bg-foreground/5 hover:border-foreground/35 text-[15px] w-full sm:w-auto px-8"
                >
                  {t('hero.cta1')}
                </Button>
              </Link>

              {/* Mini social proof inline with CTA */}
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                transition={{ duration: 0.7, delay: 1.5 }}
                className="hidden md:flex items-center gap-2.5 ml-2 pl-4 border-l border-foreground/10"
              >
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, j) => <Star key={j} className="w-3.5 h-3.5 text-accent fill-accent" strokeWidth={0} />)}
                </div>
                <span className="text-[12px] text-foreground/70 font-medium">{t('hero.rating')}</span>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Bottom trust bar — slimmer, more elegant */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 1.6 }}
        className="relative z-10 bg-secondary/70 backdrop-blur-md border-t border-foreground/[0.07]"
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center gap-6 sm:gap-10 md:gap-14 py-3.5 md:py-4 flex-wrap">
            <div className="flex items-center gap-2 text-foreground/65">
              <span className="text-base leading-none">🇩🇰</span>
              <span className="text-[11.5px] font-medium font-body">{t('hero.danishAgency')}</span>
            </div>
            <div className="flex items-center gap-2 text-foreground/65">
              <Handshake className="w-3.5 h-3.5 text-accent" strokeWidth={1.5} />
              <span className="text-[11.5px] font-medium font-body">{t('hero.binding')}</span>
            </div>
            <div className="flex items-center gap-2 text-foreground/65">
              <ShieldCheck className="w-3.5 h-3.5 text-accent" strokeWidth={1.5} />
              <span className="text-[11.5px] font-medium font-body">{t('hero.earningsGuarantee')}</span>
            </div>
            <div className="flex items-center gap-2 text-foreground/65">
              <MessageCircle className="w-3.5 h-3.5 text-accent" strokeWidth={1.5} />
              <span className="text-[11.5px] font-medium font-body">{t('hero.personalSupport')}</span>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
