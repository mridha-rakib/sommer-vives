import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Star, Handshake, ShieldCheck, MessageCircle, TrendingUp, Sparkles, HeartHandshake } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n';

const ROTATING_BENEFITS = [
  { icon: TrendingUp, text: 'Du beholder 85 % af indtægten' },
  { icon: HeartHandshake, text: 'Personlig rådgiver der kender dit hus' },
  { icon: Sparkles, text: 'Professionel foto & video inkluderet' },
  { icon: ShieldCheck, text: 'Kun 6 måneders binding — fair aftale' },
  { icon: Star, text: 'Vurderet 4,9 / 5 af husejere' },
  { icon: MessageCircle, text: 'Support 7 dage om ugen' },
];

export function HeroSection() {
  const { t } = useTranslation();
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [wordIndex, setWordIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setWordIndex((i) => (i + 1) % ROTATING_WORDS.length);
    }, 2800);
    return () => clearInterval(id);
  }, []);

  const valueChips = [
    { icon: TrendingUp, label: '85 % af indtægten' },
    { icon: HeartHandshake, label: 'Personlig rådgiver' },
    { icon: ShieldCheck, label: 'Kun 6 mdr. binding' },
    { icon: Sparkles, label: 'Foto & video inkl.' },
  ];

  return (
    <section className="relative min-h-[100dvh] flex flex-col overflow-hidden">
      {/* Background video */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background/95 to-primary/10" />
        <video
          autoPlay loop muted playsInline
          onLoadedData={() => setVideoLoaded(true)}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-[1500ms] ${videoLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-105'}`}
        >
          <source src="/videos/hero.mp4" type="video/mp4" />
        </video>
        {/* Cinematic overlays for depth */}
        <div className="absolute inset-0 bg-gradient-to-b from-background/55 via-background/35 to-background/95" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_50%,transparent_0%,hsl(var(--background)/0.45)_70%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_75%_40%,hsl(var(--accent)/0.10),transparent_55%)]" />
      </div>

      {/* Subtle floating accents */}
      <motion.div
        aria-hidden
        className="absolute top-[20%] right-[8%] w-[420px] h-[420px] rounded-full bg-accent/[0.05] blur-[120px] z-0"
        animate={{ y: [0, -20, 0], opacity: [0.5, 0.8, 0.5] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Main Content */}
      <div className="relative z-10 flex-1 flex items-center">
        <div className="container mx-auto px-4 md:px-8 py-24 md:py-32">
          <div className="max-w-3xl">
            {/* Eyebrow */}
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.15 }}
              className="mb-6 sm:mb-8"
            >
              <span className="inline-flex items-center gap-2.5 bg-accent/10 backdrop-blur-md border border-accent/25 rounded-full px-4 py-1.5 text-accent font-body text-[10px] sm:text-[11px] font-semibold tracking-[0.32em] uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                Moderne udlejning af sommerhuse
              </span>
            </motion.div>

            {/* Main headline with rotating word */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.3, ease: 'easeOut' }}
              className="font-display font-bold text-foreground mb-7 sm:mb-9 tracking-[-0.025em]
                         text-[2.5rem] sm:text-5xl md:text-6xl lg:text-[5.5rem]
                         leading-[0.95]"
            >
              Dit sommerhus,
              <br />
              <span className="relative inline-block min-h-[1.1em] mt-1 sm:mt-2">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={wordIndex}
                    initial={{ opacity: 0, y: 25, filter: 'blur(8px)' }}
                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, y: -25, filter: 'blur(8px)' }}
                    transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                    className="italic font-normal text-accent inline-block"
                    style={{
                      backgroundImage: 'linear-gradient(135deg, hsl(var(--accent)) 0%, hsl(var(--accent) / 0.75) 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                    }}
                  >
                    {ROTATING_WORDS[wordIndex]}
                  </motion.span>
                </AnimatePresence>
              </span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.55 }}
              className="text-base sm:text-lg md:text-xl text-foreground/80 mb-8 sm:mb-10 max-w-xl leading-[1.65] font-light"
            >
              Vi tager os af det hele — markedsføring, gæster og drift —
              så du kan nyde sommerhuset og <strong className="text-accent font-semibold">beholde 85 % af indtægten</strong>.
            </motion.p>

            {/* Animated value chips — replacing static checks */}
            <motion.div
              initial="hidden"
              animate="show"
              variants={{
                hidden: {},
                show: { transition: { staggerChildren: 0.08, delayChildren: 0.85 } },
              }}
              className="hidden sm:flex flex-wrap gap-2.5 mb-10"
            >
              {valueChips.map((chip, i) => (
                <motion.div
                  key={i}
                  variants={{
                    hidden: { opacity: 0, y: 12 },
                    show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
                  }}
                  className="group flex items-center gap-2 bg-background/40 backdrop-blur-md border border-foreground/10 hover:border-accent/30 rounded-full pl-3 pr-4 py-2 transition-all duration-300 hover:bg-background/60"
                >
                  <chip.icon className="w-3.5 h-3.5 text-accent group-hover:scale-110 transition-transform" strokeWidth={2} />
                  <span className="text-[12.5px] font-medium text-foreground/85">{chip.label}</span>
                </motion.div>
              ))}
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
                  Book gratis udlejningstjek
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link to="/kom-i-gang">
                <Button
                  variant="outline"
                  size="xl"
                  className="border-foreground/20 text-foreground hover:bg-foreground/5 hover:border-foreground/35 text-[15px] w-full sm:w-auto px-8"
                >
                  Udlej dit hus
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
                <span className="text-[12px] text-foreground/70 font-medium">4,9 / 5 fra ejere</span>
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
              <span className="text-[11.5px] font-medium font-body">100 % dansk bureau</span>
            </div>
            <div className="flex items-center gap-2 text-foreground/65">
              <Handshake className="w-3.5 h-3.5 text-accent" strokeWidth={1.5} />
              <span className="text-[11.5px] font-medium font-body">Kun 6 måneders binding</span>
            </div>
            <div className="flex items-center gap-2 text-foreground/65">
              <ShieldCheck className="w-3.5 h-3.5 text-accent" strokeWidth={1.5} />
              <span className="text-[11.5px] font-medium font-body">Indtjeningsgaranti</span>
            </div>
            <div className="flex items-center gap-2 text-foreground/65">
              <MessageCircle className="w-3.5 h-3.5 text-accent" strokeWidth={1.5} />
              <span className="text-[11.5px] font-medium font-body">Personlig support 7 dage</span>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
