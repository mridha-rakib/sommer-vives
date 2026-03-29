import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ArrowRight, Play, CheckCircle2, Zap, Droplets, Flame, BedDouble, Clock, Sparkles, TrendingUp, Shirt, UtensilsCrossed, ShieldCheck, Wifi, Dog, TreePine } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState } from 'react';

const trustPoints = [
  'Ingen binding — opsig når som helst',
  'Professionel fotografering inkluderet',
  'Personlig kontaktperson fra dag 1',
];

const revenueStreams = [
  { icon: Zap, label: 'El', tooltip: 'Gæsten betaler strøm efter forbrug — op til 800 kr./uge ekstra' },
  { icon: Droplets, label: 'Vand', tooltip: 'Vandforbrug faktureres direkte — ca. 150-300 kr./uge' },
  { icon: Flame, label: 'Varme', tooltip: 'Fjernvarme/gas faktureres gæsten — op til 500 kr./uge' },
  { icon: BedDouble, label: 'Sengepakker', tooltip: 'Tillæg pr. seng — typisk 75-150 kr. pr. person' },
  { icon: Shirt, label: 'Håndklæder', tooltip: 'Håndklædepakker som tillæg — 50-100 kr. pr. sæt' },
  { icon: Clock, label: 'Tidlig check-in', tooltip: 'Gæster betaler gerne 200-400 kr. for tidlig ankomst' },
  { icon: Clock, label: 'Sen check-out', tooltip: 'Sen afrejse som ekstraydelse — 200-400 kr.' },
  { icon: Dog, label: 'Husdyr', tooltip: 'Husdyrtillæg pr. dyr — 300-500 kr. pr. ophold' },
  { icon: UtensilsCrossed, label: 'Slutrengøring', tooltip: 'Slutrengøring faktureres gæsten — 800-1.500 kr.' },
  { icon: Wifi, label: 'Premium WiFi', tooltip: 'Opgrader WiFi som tillæg — 50-100 kr./uge' },
  { icon: TreePine, label: 'Brænde', tooltip: 'Brænde til pejs som forbrug — 100-250 kr.' },
  { icon: ShieldCheck, label: 'Forsikring', tooltip: 'Skadesforsikring betalt af gæsten — 150-300 kr.' },
  { icon: Sparkles, label: 'Meget mere', tooltip: 'Velkomstpakker, cykler, kajak, grill m.m.' },
];

export function HeroSection() {
  const [videoLoaded, setVideoLoaded] = useState(false);

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
                  Tjen penge på
                  <br />
                  <span className="italic font-normal text-accent">dit sommerhus</span>
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.6 }}
                  className="text-sm sm:text-lg md:text-xl text-primary-foreground/75 mb-4 sm:mb-8 max-w-md leading-relaxed"
                >
                  Vi markedsfører, styrer gæstekontakt og rengøring.
                  Du får pengene — vi tager kun <strong className="text-accent">15%</strong>.
                </motion.p>

                {/* Trust bullets — hidden on very small screens */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.8 }}
                  className="hidden sm:block space-y-2.5 mb-6"
                >
                  {trustPoints.map((point, i) => (
                    <div key={i} className="flex items-center gap-2.5 text-primary-foreground/70 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-accent flex-shrink-0" />
                      {point}
                    </div>
                  ))}
                </motion.div>

                {/* Inline revenue marquee — inside hero copy */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6, delay: 1 }}
                  className="mb-6 sm:mb-8"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-3.5 h-3.5 text-accent" />
                    <span className="text-[9px] sm:text-[10px] font-bold text-accent tracking-[0.15em] uppercase">
                      Merindtjening kun hos os
                    </span>
                  </div>
                  
                  {/* Marquee container */}
                  <div className="relative overflow-hidden max-w-md rounded-xl">
                    {/* Fade edges */}
                    <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-primary/80 to-transparent z-10 pointer-events-none" />
                    <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-primary/80 to-transparent z-10 pointer-events-none" />
                    
                    <div className="flex animate-marquee hover:[animation-play-state:paused]">
                      {[...revenueStreams, ...revenueStreams].map((item, i) => (
                        <Tooltip key={i}>
                          <TooltipTrigger asChild>
                            <div className="flex-shrink-0 flex items-center gap-1.5 bg-primary-foreground/8 backdrop-blur-sm rounded-lg px-2.5 py-1.5 border border-primary-foreground/10 hover:border-accent/30 hover:bg-accent/15 transition-all duration-300 cursor-default mx-1 group">
                              <div className="flex items-center justify-center w-5 h-5 rounded-md bg-accent/15 group-hover:bg-accent/25 transition-colors">
                                <item.icon className="w-3 h-3 text-accent" />
                              </div>
                              <span className="text-[10px] sm:text-[11px] text-primary-foreground/80 font-semibold whitespace-nowrap">{item.label}</span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-[200px] text-xs bg-background/95 backdrop-blur-xl border-accent/20">
                            <p className="font-semibold text-accent mb-0.5">{item.label}</p>
                            <p className="text-muted-foreground">{item.tooltip}</p>
                          </TooltipContent>
                        </Tooltip>
                      ))}
                    </div>
                  </div>
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

                {/* Cutout with heavy edge masking to hide transparent artifacts */}
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

                {/* Floating badge — hidden on very small, shown sm+ */}
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
