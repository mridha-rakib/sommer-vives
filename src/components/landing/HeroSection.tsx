import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Play, CheckCircle2, TrendingUp, Zap, BedDouble, Clock, Sparkles } from 'lucide-react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';

const trustPoints = [
  '6 måneders binding — tryghed for begge parter',
  'Professionel fotografering inkluderet',
  'Personlig kontaktperson fra dag 1',
];

const revenueItems = [
  { icon: Zap, label: 'El, vand & varme', pct: '+8%' },
  { icon: BedDouble, label: 'Sengepakker & tillæg', pct: '+5%' },
  { icon: Clock, label: 'Fleksibel check-in/out', pct: '+4%' },
  { icon: Sparkles, label: 'Rengøring & service', pct: '+3%' },
];

export function HeroSection() {
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [activeItem, setActiveItem] = useState(0);
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const swooshY = useTransform(scrollYProgress, [0, 1], [0, -120]);
  const swooshRotate = useTransform(scrollYProgress, [0, 1], [0, -3]);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveItem((prev) => (prev + 1) % revenueItems.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section ref={heroRef} className="relative min-h-[100dvh] flex flex-col overflow-hidden">
      {/* Video Background */}
      <div className="absolute inset-0 z-0">
        <video
          autoPlay
          loop
          muted
          playsInline
          onLoadedData={() => setVideoLoaded(true)}
          className={`w-full h-full object-cover transition-opacity duration-1000 ${videoLoaded ? 'opacity-100' : 'opacity-0'}`}
        >
          <source src="/videos/hero.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-primary/70 via-primary/50 to-primary/85" />
      </div>

      {/* Main Content — always side by side */}
      <div className="relative z-10 flex-1 flex items-end sm:items-center">
        <div className="container mx-auto px-4 md:px-8 pt-20 pb-0 sm:py-20">
          <div className="flex items-center gap-2 sm:gap-6 md:gap-10 lg:gap-16">
            {/* Left — Copy */}
            <div className="flex-1 min-w-0">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="mb-3 sm:mb-5"
              >
                <span className="inline-flex items-center gap-2 bg-accent/15 backdrop-blur-sm border border-accent/25 rounded-full px-3 sm:px-4 py-1 sm:py-1.5 text-accent font-body text-[10px] sm:text-xs font-semibold tracking-[0.2em] uppercase">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                  Danmarks mest fleksible bureau
                </span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold text-primary-foreground mb-3 sm:mb-6 leading-[0.95] tracking-tight"
              >
                Dit sommerhus,
                <br />
                <span className="italic font-normal text-accent">vores passion</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="text-sm sm:text-lg md:text-xl text-primary-foreground/75 mb-4 sm:mb-6 max-w-md leading-relaxed"
              >
                Vi markedsfører, styrer gæstekontakt og rengøring.
                Du får pengene — vi tager kun <strong className="text-accent">15%</strong>.
              </motion.p>

              {/* Minimal revenue teaser — inline, transparent */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.8 }}
                className="mb-5 sm:mb-7 max-w-md"
              >
                <div className="flex items-center gap-2 mb-2.5">
                  <TrendingUp className="w-3.5 h-3.5 text-accent" />
                  <span className="text-[9px] sm:text-[10px] font-bold text-accent/80 tracking-[0.15em] uppercase">
                    +20% merindtjening kun hos os
                  </span>
                </div>
                <div className="flex gap-1">
                  {revenueItems.map((item, i) => {
                    const Icon = item.icon;
                    const isActive = activeItem === i;
                    return (
                      <button
                        key={i}
                        onClick={() => setActiveItem(i)}
                        className={`flex-1 flex flex-col items-center gap-1 py-2 px-1 rounded-xl transition-all duration-500 ${
                          isActive
                            ? 'bg-accent/10 border border-accent/20'
                            : 'bg-transparent border border-transparent hover:bg-primary-foreground/5'
                        }`}
                      >
                        <Icon className={`w-3.5 h-3.5 transition-colors duration-300 ${isActive ? 'text-accent' : 'text-primary-foreground/30'}`} />
                        <span className={`font-display text-xs sm:text-sm font-bold transition-colors duration-300 ${isActive ? 'text-accent' : 'text-primary-foreground/20'}`}>
                          {item.pct}
                        </span>
                      </button>
                    );
                  })}
                </div>
                {/* Active label */}
                <div className="h-5 mt-1.5 relative overflow-hidden">
                  <AnimatePresence mode="wait">
                    <motion.p
                      key={activeItem}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.3 }}
                      className="text-[10px] sm:text-xs text-primary-foreground/50 font-medium text-center absolute inset-x-0"
                    >
                      {revenueItems[activeItem].label}
                    </motion.p>
                  </AnimatePresence>
                </div>
              </motion.div>

              {/* Trust bullets — hidden on very small screens */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 1 }}
                className="hidden sm:block space-y-2 mb-6"
              >
                {trustPoints.map((point, i) => (
                  <div key={i} className="flex items-center gap-2.5 text-primary-foreground/70 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-accent flex-shrink-0" />
                    {point}
                  </div>
                ))}
              </motion.div>

              {/* CTAs */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 1.2 }}
                className="flex flex-col sm:flex-row gap-2 sm:gap-3"
              >
                <Link to="/kom-i-gang">
                  <Button variant="gold" size="xl" className="gap-2 sm:gap-3 text-sm sm:text-base group w-full sm:w-auto">
                    Udlej dit hus nu
                    <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link to="/book-vurdering" className="hidden sm:block">
                  <Button
                    variant="outline"
                    size="xl"
                    className="border-accent/40 text-accent hover:bg-accent/10 text-base gap-2 w-full sm:w-auto"
                  >
                    <Play className="w-4 h-4" />
                    Gratis udlejningstjek
                  </Button>
                </Link>
              </motion.div>
            </div>

            {/* Right — Advisor cutout (ALWAYS visible, scales per breakpoint) */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.8 }}
              className="relative flex-shrink-0 w-[38vw] sm:w-[34vw] md:w-[32vw] lg:w-[38vw] xl:w-[36vw] max-w-[520px] self-end -mr-6 sm:-mr-8 md:-mr-10 lg:-mr-16"
            >
              {/* Shimmer glow behind person */}
              <div className="absolute top-[15%] left-1/2 -translate-x-1/2 w-[80%] h-[55%] rounded-full blur-[80px] sm:blur-[100px] animate-hero-shimmer" />
              <div className="absolute top-[25%] left-1/2 -translate-x-1/2 w-[50%] h-[40%] bg-accent/8 rounded-full blur-[50px] animate-hero-shimmer-slow" />

              {/* Cutout with heavy edge masking */}
              <div
                className="relative"
                style={{
                  maskImage: 'linear-gradient(to bottom, black 65%, transparent 95%), linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)',
                  WebkitMaskImage: 'linear-gradient(to bottom, black 65%, transparent 95%), linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)',
                  maskComposite: 'intersect',
                  WebkitMaskComposite: 'destination-in',
                } as React.CSSProperties}
              >
                <img
                  src="/images/advisor-cutout.png"
                  alt="Emil W. Klockmann — Udlejningschef"
                  className="w-full h-auto object-contain drop-shadow-[0_10px_30px_rgba(0,0,0,0.5)]"
                />
              </div>

              {/* Floating badge */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 1.4 }}
                className="hidden sm:block absolute bottom-[12%] left-1/2 -translate-x-1/2 mr-6 sm:mr-8 md:mr-10 lg:mr-16 w-[90%] max-w-[240px]"
              >
                <div className="bg-background/90 backdrop-blur-xl rounded-2xl px-4 py-2.5 border border-accent/15 shadow-elevated text-center">
                  <p className="font-display font-bold text-foreground text-xs sm:text-sm">Emil W. Klockmann</p>
                  <p className="text-accent text-[10px] sm:text-xs font-semibold">Udlejningschef</p>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>


      {/* Bottom stats strip */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 1.5 }}
        className="relative z-10 bg-primary/60 backdrop-blur-sm border-t border-primary-foreground/10"
      >
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-4 divide-x divide-primary-foreground/10">
            {[
              { value: '15%', label: 'Kommission' },
              { value: '5 min', label: 'At komme i gang' },
              { value: '6 mdr.', label: 'Binding' },
              { value: '50.200', label: 'Skattefrit' },
            ].map((stat, i) => (
              <div key={i} className="py-4 sm:py-5 md:py-6 text-center">
                <div className="font-display text-base sm:text-xl md:text-3xl font-bold text-accent">{stat.value}</div>
                <div className="text-[8px] sm:text-[10px] md:text-xs text-primary-foreground/50 mt-0.5 font-body tracking-wider uppercase">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </section>
  );
}
