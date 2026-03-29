import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ArrowRight, Play, CheckCircle2, Zap, BedDouble, Clock, Sparkles, TrendingUp, ChevronRight, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';

const trustPoints = [
  'Ingen binding — opsig når som helst',
  'Professionel fotografering inkluderet',
  'Personlig kontaktperson fra dag 1',
];

const revenueCategories = [
  {
    icon: Zap,
    label: 'Forbrugsafregning',
    share: 8,
    color: 'from-amber-400/80 to-accent/80',
    items: ['Elforbrug', 'Vandforbrug', 'Varme & gas'],
    example: 'Op til 1.500 kr. ekstra pr. uge',
    desc: 'Gæsten betaler det reelle forbrug af el, vand og varme. Du tjener på det — ikke bureauet.',
  },
  {
    icon: BedDouble,
    label: 'Tillægspakker',
    share: 5,
    color: 'from-accent/80 to-emerald-400/80',
    items: ['Sengepakker', 'Håndklæder', 'Velkomstpakke'],
    example: '75-200 kr. pr. person pr. booking',
    desc: 'Linnedpakker, håndklæder og velkomstpakker — alt faktureres som tillæg direkte til gæsten.',
  },
  {
    icon: Clock,
    label: 'Fleksibilitet',
    share: 4,
    color: 'from-emerald-400/80 to-teal-400/80',
    items: ['Tidlig check-in', 'Sen check-out', 'Husdyrtillæg'],
    example: '200-500 kr. pr. tilvalg',
    desc: 'Gæster betaler gerne ekstra for fleksibilitet. Du bestemmer selv hvad du tilbyder.',
  },
  {
    icon: Sparkles,
    label: 'Service & gebyr',
    share: 3,
    color: 'from-teal-400/80 to-cyan-400/80',
    items: ['Slutrengøring', 'Skadesforsikring', 'Brænde & grill'],
    example: '800-1.500 kr. pr. ophold',
    desc: 'Slutrengøring og forsikring faktureres gæsten. Du har ingen udgifter — kun indtægt.',
  },
];

export function HeroSection() {
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<number | null>(null);
  const [autoIndex, setAutoIndex] = useState(0);

  // Auto-cycle through categories when none is manually expanded
  useEffect(() => {
    if (expandedCategory !== null) return;
    const interval = setInterval(() => {
      setAutoIndex((prev) => (prev + 1) % revenueCategories.length);
    }, 3500);
    return () => clearInterval(interval);
  }, [expandedCategory]);

  const totalShare = revenueCategories.reduce((sum, c) => sum + c.share, 0);
  const visibleIndex = expandedCategory ?? autoIndex;

  return (
    <TooltipProvider delayDuration={200}>
      <section className="relative min-h-[100dvh] flex flex-col overflow-hidden">
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

                {/* Revenue highlight — emotional, not data-heavy */}
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.8 }}
                  className="mb-5 sm:mb-8"
                >
                  <div className="relative bg-primary-foreground/5 backdrop-blur-md rounded-2xl border border-accent/20 p-3 sm:p-4 max-w-md overflow-hidden group">
                    {/* Shimmer accent line */}
                    <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-accent/60 to-transparent animate-hero-shimmer" />
                    
                    {/* Top row */}
                    <div className="flex items-center justify-between mb-2 sm:mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-accent/20 flex items-center justify-center">
                          <TrendingUp className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-accent" />
                        </div>
                        <div>
                          <p className="text-[10px] sm:text-xs font-bold text-accent tracking-wide uppercase">Merindtjening</p>
                          <p className="text-[9px] sm:text-[10px] text-primary-foreground/40">kun hos SommerVibes</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <motion.p
                          key="percent"
                          initial={{ scale: 0.8 }}
                          animate={{ scale: [1, 1.05, 1] }}
                          transition={{ duration: 2, repeat: Infinity, repeatType: 'reverse' }}
                          className="font-display text-xl sm:text-2xl md:text-3xl font-bold text-accent leading-none"
                        >
                          +20%
                        </motion.p>
                        <p className="text-[8px] sm:text-[9px] text-primary-foreground/40 font-medium">ekstra indtægt</p>
                      </div>
                    </div>

                    {/* Rotating highlight */}
                    <div className="h-8 sm:h-9 relative">
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={activeHighlight}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -8 }}
                          transition={{ duration: 0.4 }}
                          className="absolute inset-0 flex items-center gap-2"
                        >
                          {(() => {
                            const item = revenueHighlights[activeHighlight];
                            const Icon = item.icon;
                            return (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="flex items-center gap-2 cursor-default">
                                    <Icon className="w-3.5 h-3.5 text-accent/70 flex-shrink-0" />
                                    <span className="text-xs sm:text-sm text-primary-foreground/70 font-medium">{item.label}</span>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="max-w-[220px] text-xs bg-background/95 backdrop-blur-xl border-accent/20">
                                  <p className="text-muted-foreground">{item.tip}</p>
                                </TooltipContent>
                              </Tooltip>
                            );
                          })()}
                        </motion.div>
                      </AnimatePresence>
                    </div>

                    {/* Progress dots */}
                    <div className="flex gap-1.5 mt-1">
                      {revenueHighlights.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setActiveHighlight(i)}
                          className={`h-1 rounded-full transition-all duration-500 ${
                            i === activeHighlight
                              ? 'w-6 bg-accent/70'
                              : 'w-1.5 bg-primary-foreground/15 hover:bg-primary-foreground/25'
                          }`}
                        />
                      ))}
                    </div>
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
                { value: '0 kr.', label: 'Binding' },
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
    </TooltipProvider>
  );
}
