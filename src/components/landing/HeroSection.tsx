import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, CheckCircle2, Star, Handshake, ShieldCheck, MessageCircle } from 'lucide-react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useState, useRef } from 'react';
import { useTranslation } from '@/lib/i18n';

export function HeroSection() {
  const { t } = useTranslation();
  const [videoLoaded, setVideoLoaded] = useState(false);
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const swooshY = useTransform(scrollYProgress, [0, 1], [0, -120]);
  const swooshRotate = useTransform(scrollYProgress, [0, 1], [0, -3]);

  const trustPoints = [t('hero.trust1'), t('hero.trust2'), t('hero.trust3')];

  return (
    <section ref={heroRef} className="relative min-h-[100dvh] flex flex-col overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background/95 to-primary/10" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_50%,hsl(var(--primary)/0.08),transparent_60%)]" />
        <video
          autoPlay loop muted playsInline
          onLoadedData={() => setVideoLoaded(true)}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${videoLoaded ? 'opacity-100' : 'opacity-0'}`}
        >
          <source src="/videos/hero.mp4" type="video/mp4" />
        </video>
        {videoLoaded && (
          <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/50 to-background/85" />
        )}
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex-1 flex items-end sm:items-center">
        <div className="container mx-auto px-4 md:px-8 pt-20 pb-0 sm:py-20">
          <div className="max-w-2xl">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }} className="mb-3 sm:mb-5">
              <span className="inline-flex items-center gap-2 bg-primary/15 backdrop-blur-sm border border-primary/25 rounded-full px-3 sm:px-4 py-1 sm:py-1.5 text-primary font-body text-[10px] sm:text-xs font-semibold tracking-[0.2em] uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                {t('hero.badge')}
              </span>
            </motion.div>

            <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.4 }}
              className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold text-foreground mb-3 sm:mb-6 leading-[0.95] tracking-tight">
              {t('hero.title1')}<br />
              <span className="italic font-normal text-primary">{t('hero.title2')}</span>
            </motion.h1>

            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.6 }}
              className="text-sm sm:text-lg md:text-xl text-foreground/75 mb-4 sm:mb-6 max-w-md leading-relaxed">
              {t('hero.subtitle')} <strong className="text-primary">{t('hero.subtitleHighlight')}</strong>{t('hero.subtitleEnd')}
            </motion.p>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 1 }} className="hidden sm:block space-y-2 mb-6">
              {trustPoints.map((point, i) => (
                <div key={i} className="flex items-center gap-2.5 text-foreground/70 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                  {point}
                </div>
              ))}
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 1.2 }}
              className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <Link to="/kom-i-gang">
                <Button variant="gold" size="xl" className="gap-2 sm:gap-3 text-sm sm:text-base group w-full sm:w-auto">
                  {t('hero.cta1')}
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link to="/book-vurdering">
                <Button variant="outline" size="xl" className="border-primary/40 text-primary hover:bg-primary/10 text-sm sm:text-base gap-2 w-full sm:w-auto">
                  {t('hero.cta2')}
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Trust bar */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 1.5 }}
        className="relative z-10 bg-secondary/80 backdrop-blur-sm border-t border-foreground/10">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center gap-6 sm:gap-8 md:gap-12 py-3.5 md:py-4 flex-wrap">
            <div className="flex items-center gap-2 text-foreground/70">
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, j) => <Star key={j} className="w-3 h-3 text-accent fill-accent/80" strokeWidth={0} />)}
              </div>
              <span className="text-[11px] sm:text-[12px] font-medium font-body">{t('hero.trustpilot')}</span>
            </div>
            <div className="flex items-center gap-2 text-foreground/70">
              <span className="text-base leading-none">🇩🇰</span>
              <span className="text-[11px] sm:text-[12px] font-medium font-body">{t('hero.danish')}</span>
            </div>
            <div className="flex items-center gap-2 text-foreground/70">
              <Handshake className="w-4 h-4 text-accent" strokeWidth={1.5} />
              <span className="text-[11px] sm:text-[12px] font-medium font-body">{t('hero.noBinding')}</span>
            </div>
            <div className="flex items-center gap-2 text-foreground/70">
              <ShieldCheck className="w-4 h-4 text-accent" strokeWidth={1.5} />
              <span className="text-[11px] sm:text-[12px] font-medium font-body">{t('hero.guarantee')}</span>
            </div>
            <div className="flex items-center gap-2 text-foreground/70">
              <MessageCircle className="w-4 h-4 text-accent" strokeWidth={1.5} />
              <span className="text-[11px] sm:text-[12px] font-medium font-body">{t('hero.support')}</span>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
