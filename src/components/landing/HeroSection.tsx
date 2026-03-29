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

            {/* Right — Advisor image, blended into hero */}
            <motion.div
              initial={{ opacity: 0, x: 60 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 1, delay: 0.8 }}
              className="hidden lg:block relative"
            >
              <div className="relative">
                {/* Glow behind */}
                <div className="absolute -inset-8 bg-accent/10 rounded-full blur-3xl" />
                
                {/* Image with fade edges */}
                <div className="relative" style={{ maskImage: 'linear-gradient(to bottom, transparent 0%, black 8%, black 85%, transparent 100%), linear-gradient(to right, transparent 0%, black 15%, black 100%)', maskComposite: 'intersect', WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 8%, black 85%, transparent 100%)', WebkitMaskComposite: 'source-in' } as React.CSSProperties}>
                  <img
                    src="/images/advisor-hero.jpg"
                    alt="Din personlige udlejningsrådgiver"
                    className="w-full h-auto max-h-[75vh] object-cover object-top"
                  />
                </div>

                {/* Floating name badge */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 1.4 }}
                  className="absolute bottom-8 left-4 right-4"
                >
                  <div className="bg-background/85 backdrop-blur-xl rounded-2xl p-4 border border-accent/15 shadow-elevated">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-2 h-2 rounded-full bg-accent animate-pulse flex-shrink-0" />
                      <div>
                        <p className="font-display font-bold text-foreground text-sm">Emil Kastrup</p>
                        <p className="text-muted-foreground text-xs">Stifter & Udlejningsrådgiver</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { v: '15%', l: 'Kommission' },
                        { v: '4.9★', l: 'Rating' },
                        { v: '14 dage', l: 'Til booking' },
                      ].map((s, i) => (
                        <div key={i} className="text-center p-2 bg-primary/5 rounded-lg">
                          <div className="font-display text-sm font-bold text-accent">{s.v}</div>
                          <div className="text-[10px] text-muted-foreground">{s.l}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>

            {/* Mobile/tablet advisor strip */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.2 }}
              className="lg:hidden flex items-center gap-4 bg-background/90 backdrop-blur-md rounded-2xl p-4 border border-border/50"
            >
              <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 border border-accent/20">
                <img src="/images/advisor-headshot.jpg" alt="Emil Kastrup" className="w-full h-full object-cover" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                  <p className="font-display font-bold text-foreground text-sm">Emil Kastrup</p>
                </div>
                <p className="text-muted-foreground text-xs mt-0.5">Stifter & Udlejningsrådgiver — book et møde</p>
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
