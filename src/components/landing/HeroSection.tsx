import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Play, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState } from 'react';

const trustPoints = [
  'Ingen binding — opsig når som helst',
  'Professionel fotografering inkluderet',
  'Personlig kontaktperson fra dag 1',
];

export function HeroSection() {
  const [videoLoaded, setVideoLoaded] = useState(false);

  return (
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

      {/* Main Content */}
      <div className="relative z-10 flex-1 flex items-center">
        <div className="container mx-auto px-4 md:px-8 py-24 md:py-20">
          <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-12 lg:gap-20 items-center">
            {/* Left — Copy */}
            <div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="mb-5"
              >
                <span className="inline-flex items-center gap-2 bg-accent/15 backdrop-blur-sm border border-accent/25 rounded-full px-4 py-1.5 text-accent font-body text-xs font-semibold tracking-[0.2em] uppercase">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                  Danmarks mest fleksible bureau
                </span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="font-display text-4xl md:text-6xl lg:text-7xl font-bold text-primary-foreground mb-6 leading-[0.95] tracking-tight"
              >
                Tjen penge på
                <br />
                <span className="italic font-normal text-accent">dit sommerhus</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="text-lg md:text-xl text-primary-foreground/75 mb-8 max-w-md leading-relaxed"
              >
                Vi markedsfører, styrer gæstekontakt og rengøring.
                Du får pengene — vi tager kun <strong className="text-accent">15%</strong>.
              </motion.p>

              {/* Trust bullets */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.8 }}
                className="space-y-2.5 mb-10"
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
                transition={{ duration: 0.6, delay: 1 }}
                className="flex flex-col sm:flex-row gap-3"
              >
                <Link to="/kom-i-gang">
                  <Button variant="gold" size="xl" className="gap-3 text-base group w-full sm:w-auto">
                    Udlej dit hus nu
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link to="/book-vurdering">
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

            {/* Right — Advisor cutout */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.8 }}
              className="hidden md:flex justify-center lg:justify-end relative"
            >
              <div className="relative">
                {/* Subtle glow */}
                <div className="absolute inset-0 bg-accent/8 rounded-full blur-[80px] scale-75" />
                
                {/* Cutout image with bottom fade */}
                <div className="relative max-h-[65vh] lg:max-h-[72vh]" style={{ maskImage: 'linear-gradient(to bottom, black 70%, transparent 100%)', WebkitMaskImage: 'linear-gradient(to bottom, black 70%, transparent 100%)' } as React.CSSProperties}>
                  <img
                    src="/images/advisor-cutout.png"
                    alt="Emil W. Klockmann — Udlejningschef"
                    className="h-[55vh] md:h-[60vh] lg:h-[68vh] w-auto object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.3)]"
                  />
                </div>

                {/* Floating badge */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 1.4 }}
                  className="absolute bottom-4 left-1/2 -translate-x-1/2 w-[85%] max-w-[280px]"
                >
                  <div className="bg-background/90 backdrop-blur-xl rounded-2xl px-5 py-3 border border-accent/15 shadow-elevated text-center">
                    <p className="font-display font-bold text-foreground text-sm">Emil W. Klockmann</p>
                    <p className="text-accent text-xs font-semibold">Udlejningschef</p>
                  </div>
                </motion.div>
              </div>
            </motion.div>

            {/* Mobile advisor strip */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.2 }}
              className="md:hidden flex items-center gap-4 bg-background/90 backdrop-blur-md rounded-2xl p-4 border border-border/50"
            >
              <div className="w-14 h-14 rounded-full overflow-hidden flex-shrink-0 border-2 border-accent/25">
                <img src="/images/advisor-headshot.jpg" alt="Emil W. Klockmann" className="w-full h-full object-cover" />
              </div>
              <div>
                <p className="font-display font-bold text-foreground text-sm">Emil W. Klockmann</p>
                <p className="text-accent text-xs font-semibold">Udlejningschef</p>
                <p className="text-muted-foreground text-[11px] mt-0.5">Book et gratis udlejningstjek</p>
              </div>
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
              <div key={i} className="py-5 md:py-6 text-center">
                <div className="font-display text-xl md:text-3xl font-bold text-accent">{stat.value}</div>
                <div className="text-[10px] md:text-xs text-primary-foreground/50 mt-0.5 font-body tracking-wider uppercase">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </section>
  );
}
