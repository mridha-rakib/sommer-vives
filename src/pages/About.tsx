import { PublicLayout } from '@/components/layout/PublicLayout';
import { Button } from '@/components/ui/button';
import { ContextualFAQ } from '@/components/landing/ContextualFAQ';
import { Link } from 'react-router-dom';
import { ArrowRight, Check, Phone, Mail, Clock, Play, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { useRef, useState, useEffect } from 'react';
import emilPortrait from '@/assets/emil-portrait.jpg';
import heroHouse from '@/assets/hero-house.jpg';

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 1, delay, ease: "easeOut" as const },
});

const reveal = (isInView: boolean, delay = 0) => ({
  initial: { opacity: 0, y: 18 },
  animate: isInView ? { opacity: 1, y: 0 } : {},
  transition: { duration: 0.9, delay, ease: "easeOut" as const },
});

/* Thin decorative line between sections */
const SectionDivider = () => (
  <div className="flex justify-center py-1">
    <div className="w-8 h-px bg-accent/15" />
  </div>
);

/* ═══════════════════════════════════════════════════
   1. HERO
   ═══════════════════════════════════════════════════ */
function HeroSection() {
  return (
    <section className="relative min-h-[92vh] flex items-center bg-background text-foreground overflow-hidden">
      {/* Ambient light */}
      <div className="absolute top-[-10%] right-[-5%] w-[700px] h-[700px] rounded-full bg-accent/[0.025] blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full bg-accent/[0.015] blur-[120px] pointer-events-none" />

      <div className="container mx-auto px-5 md:px-10 py-36 md:py-0">
        <div className="grid lg:grid-cols-12 gap-16 lg:gap-10 items-center max-w-[1200px] mx-auto">
          {/* Copy */}
          <motion.div {...fade()} className="lg:col-span-7 relative z-10">
            <motion.span
              {...fade(0.15)}
              className="inline-block text-accent/60 font-body text-[10.5px] font-semibold tracking-[0.4em] uppercase mb-10"
            >
              Historien bag SommerVibes
            </motion.span>

            <motion.h1
              {...fade(0.25)}
              className="font-display text-[2.4rem] sm:text-[3rem] md:text-[3.4rem] lg:text-[3.75rem] font-bold leading-[1.06] tracking-[-0.01em] mb-8"
            >
              Vi bygger fremtidens
              <span className="block text-accent italic font-normal mt-2 tracking-normal">sommerhusbureau</span>
            </motion.h1>

            <motion.p
              {...fade(0.4)}
              className="text-[1.06rem] md:text-[1.1rem] text-muted-foreground/90 leading-[1.85] mb-14 max-w-[460px]"
            >
              Personlig rådgivning. Digital nytænkning. Gennemsigtig prissætning — skabt for husejere, der fortjener mere.
            </motion.p>

            <motion.div {...fade(0.55)} className="flex flex-col sm:flex-row gap-3.5">
              <a href="#kontakt">
                <Button variant="gold" size="lg" className="gap-2.5 group px-9 h-12 text-[14px] font-medium shadow-[0_4px_24px_-6px_hsl(var(--accent)/0.35)] hover:shadow-[0_6px_32px_-4px_hsl(var(--accent)/0.45)] transition-shadow duration-500">
                  Kontakt os <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                </Button>
              </a>
              <Link to="/kom-i-gang">
                <Button variant="outline" size="lg" className="border-accent/20 text-accent/90 hover:bg-accent/[0.06] hover:border-accent/30 px-9 h-12 text-[14px] font-medium transition-all duration-300">
                  Udlej dit hus
                </Button>
              </Link>
            </motion.div>
          </motion.div>

          {/* Portrait */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, delay: 0.35, ease: "easeOut" }}
            className="lg:col-span-5 flex justify-center lg:justify-end"
          >
            <div className="relative">
              <div className="absolute -inset-8 bg-accent/[0.04] rounded-[2.5rem] blur-3xl pointer-events-none" />

              <div className="relative w-[260px] sm:w-[300px] md:w-[340px] lg:w-[370px]">
                <div className="rounded-[1.75rem] overflow-hidden shadow-[0_35px_90px_-20px_rgba(0,0,0,0.55)] ring-1 ring-white/[0.05]">
                  <img
                    src={emilPortrait}
                    alt="Emil Weng Klockmann — Grundlægger af SommerVibes"
                    className="w-full aspect-[3/4] object-cover object-top"
                  />
                  <div className="absolute bottom-0 left-0 right-0 h-36 bg-gradient-to-t from-background/90 via-background/40 to-transparent" />
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, delay: 1 }}
                  className="absolute bottom-7 left-7 right-7"
                >
                  <p className="font-display font-semibold text-foreground text-[15px] tracking-[-0.01em]">Emil Weng Klockmann</p>
                  <p className="text-[11.5px] text-accent/70 font-medium mt-0.5 tracking-wide">Grundlægger & Udlejningschef</p>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════
   2. VIDEO
   ═══════════════════════════════════════════════════ */
function VideoSection() {
  const { ref, isInView } = useScrollReveal();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasEnded, setHasEnded] = useState(false);

  const play = () => { videoRef.current?.play(); setIsPlaying(true); setHasEnded(false); };
  const replay = () => {
    if (videoRef.current) { videoRef.current.currentTime = 0; videoRef.current.play(); setIsPlaying(true); setHasEnded(false); }
  };

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onEnd = () => { setIsPlaying(false); setHasEnded(true); };
    v.addEventListener('ended', onEnd);
    return () => v.removeEventListener('ended', onEnd);
  }, []);

  return (
    <section ref={ref} className="py-32 md:py-48 bg-background relative">
      <SectionDivider />

      <div className="container mx-auto px-5 md:px-10 max-w-[880px] mt-12">
        <motion.div {...reveal(isInView)} className="text-center mb-16">
          <p className="text-accent/50 font-body text-[10.5px] font-semibold tracking-[0.4em] uppercase mb-5">Mød Emil</p>
          <h2 className="font-display text-[1.75rem] md:text-[2.3rem] font-semibold text-primary leading-[1.15] tracking-[-0.01em]">
            Personen bag{' '}<span className="text-accent italic font-normal">SommerVibes</span>
          </h2>
        </motion.div>

        <motion.div
          {...reveal(isInView, 0.15)}
          className="relative rounded-[1.4rem] overflow-hidden bg-card ring-1 ring-white/[0.03] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.5)]"
        >
          <video
            ref={videoRef}
            src="/video/emil-intro.mp4"
            poster={emilPortrait}
            playsInline
            preload="metadata"
            className="w-full aspect-video object-cover"
          />

          <AnimatePresence>
            {!isPlaying && !hasEnded && (
              <motion.button
                key="play"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                onClick={play}
                className="absolute inset-0 flex items-center justify-center bg-background/20 group cursor-pointer"
              >
                <div className="relative">
                  <div className="absolute -inset-5 rounded-full bg-accent/8 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                  <div className="relative w-[68px] h-[68px] md:w-[76px] md:h-[76px] rounded-full bg-accent/85 flex items-center justify-center shadow-[0_10px_50px_-10px_rgba(0,0,0,0.5)] group-hover:scale-[1.05] transition-transform duration-400">
                    <Play className="w-6 h-6 md:w-7 md:h-7 text-primary fill-primary ml-0.5" />
                  </div>
                </div>
              </motion.button>
            )}

            {hasEnded && (
              <motion.button
                key="replay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                onClick={replay}
                className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-background/30 cursor-pointer group"
              >
                <div className="w-14 h-14 rounded-full bg-card/70 backdrop-blur-md ring-1 ring-white/[0.08] flex items-center justify-center group-hover:scale-[1.05] group-hover:ring-accent/15 transition-all duration-400">
                  <RotateCcw className="w-5 h-5 text-accent/80" />
                </div>
                <span className="text-[12px] font-medium text-foreground/40 tracking-[0.1em] uppercase">Se igen</span>
              </motion.button>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════
   3. STORY
   ═══════════════════════════════════════════════════ */
function StorySection() {
  const { ref, isInView } = useScrollReveal();
  return (
    <section ref={ref} className="py-32 md:py-48 bg-card/20 relative">
      <div className="container mx-auto px-5 md:px-10">
        <div className="grid lg:grid-cols-12 gap-14 lg:gap-24 items-center max-w-[1100px] mx-auto">
          {/* Image */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 1.1, ease: "easeOut" }}
            className="lg:col-span-5 relative"
          >
            <div className="rounded-[1.25rem] overflow-hidden shadow-[0_25px_70px_-18px_rgba(0,0,0,0.35)] ring-1 ring-white/[0.03]">
              <img src={heroHouse} alt="Dansk sommerhus" className="w-full aspect-[4/5] object-cover" loading="lazy" />
            </div>
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={isInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="absolute -bottom-3 -right-3 md:-bottom-4 md:-right-4 bg-accent text-primary px-5 py-2.5 rounded-xl shadow-[0_8px_30px_-8px_rgba(0,0,0,0.3)]"
            >
              <span className="font-display font-bold text-[15px]">Kun 15%</span>
              <span className="block text-[10.5px] opacity-70 tracking-wide">i kommission</span>
            </motion.div>
          </motion.div>

          {/* Copy */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 1.1, delay: 0.1, ease: "easeOut" }}
            className="lg:col-span-7"
          >
            <span className="text-accent/50 font-body text-[10.5px] font-semibold tracking-[0.4em] uppercase block mb-6">Vores historie</span>
            <h2 className="font-display text-[1.9rem] md:text-[2.5rem] font-semibold text-primary leading-[1.12] tracking-[-0.01em] mb-10">
              Fra frustration
              <span className="block text-accent italic font-normal mt-1">til en bedre løsning</span>
            </h2>

            <div className="space-y-6 mb-12">
              <p className="text-muted-foreground/85 leading-[1.85] text-[15.5px]">
                Store bureauer fokuserer på volumen. Husejere bliver et nummer i rækken — uden gennemsigtighed, uden personlig kontakt, uden reel omsorg.
              </p>
              <p className="text-muted-foreground/85 leading-[1.85] text-[15.5px]">
                <strong className="text-primary/90 font-medium">SommerVibes blev skabt som svaret på det, vi selv savnede</strong> — et moderne bureau med personlig service, digitalt overblik og en fair kommissionsmodel.
              </p>
            </div>

            <div className="border-l-[1.5px] border-accent/25 pl-7 py-2 mb-12">
              <p className="text-primary/80 font-display text-[1.1rem] md:text-[1.2rem] italic leading-[1.75]">
                "Vores ambition er ikke at være det største bureau — men det bedste for de ejere, vi samarbejder med."
              </p>
              <p className="text-accent/50 text-[12px] mt-4 font-medium tracking-[0.15em] uppercase">Emil W. Klockmann</p>
            </div>

            <Link to="/how-it-works">
              <Button variant="outline" size="sm" className="gap-2 group text-[13px] border-border/40 hover:border-accent/30 hover:bg-accent/[0.04] transition-all duration-300">
                Se hvordan det virker <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform duration-300" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════
   4. FOUNDER
   ═══════════════════════════════════════════════════ */
function FounderSection() {
  const { ref, isInView } = useScrollReveal();
  return (
    <section ref={ref} className="py-32 md:py-48 bg-background relative">
      <SectionDivider />

      <div className="container mx-auto px-5 md:px-10 max-w-[1000px] mt-12">
        <div className="grid md:grid-cols-12 gap-14 md:gap-20 items-start">
          {/* Portrait */}
          <motion.div
            {...reveal(isInView)}
            className="md:col-span-4 flex justify-center md:sticky md:top-32"
          >
            <div className="relative">
              <div className="absolute -inset-5 bg-accent/[0.03] rounded-[2rem] blur-2xl pointer-events-none" />
              <div className="relative w-44 md:w-full max-w-[240px] rounded-[1.25rem] overflow-hidden ring-1 ring-white/[0.04] shadow-[0_25px_60px_-18px_rgba(0,0,0,0.4)]">
                <img src={emilPortrait} alt="Emil Weng Klockmann" className="w-full aspect-[3/4] object-cover object-top" />
              </div>
            </div>
          </motion.div>

          {/* Bio */}
          <motion.div {...reveal(isInView, 0.12)} className="md:col-span-8">
            <span className="text-accent/50 font-body text-[10.5px] font-semibold tracking-[0.4em] uppercase block mb-5">Din kontaktperson</span>
            <h2 className="font-display text-[1.9rem] md:text-[2.3rem] font-semibold text-primary leading-[1.1] tracking-[-0.01em] mb-2">
              Emil Weng Klockmann
            </h2>
            <p className="text-accent/60 text-[14px] font-medium tracking-wide mb-10">Grundlægger & Udlejningschef</p>

            <p className="text-muted-foreground/85 leading-[1.85] mb-10 max-w-[480px] text-[15.5px]">
              Uddannet ejendomsmægler, selv sommerhus-ejer og med mere end fire års erfaring i boligbranchen. Emil grundlagde SommerVibes med én overbevisning: at husejere fortjener mere end det, markedet tilbyder i dag.
            </p>

            <div className="grid grid-cols-2 gap-x-8 gap-y-4 mb-12">
              {[
                'Uddannet ejendomsmægler',
                'Selv sommerhus-ejer',
                'Personlig rådgiver fra dag ét',
                'Digital og moderne tilgang',
              ].map((point, i) => (
                <motion.div
                  key={i}
                  {...reveal(isInView, 0.25 + i * 0.05)}
                  className="flex items-center gap-3"
                >
                  <div className="w-[5px] h-[5px] rounded-full bg-accent/40 flex-shrink-0" />
                  <span className="text-muted-foreground/75 text-[13.5px]">{point}</span>
                </motion.div>
              ))}
            </div>

            <div className="flex flex-wrap gap-3">
              <a href="tel:+4512345678">
                <Button variant="outline" size="sm" className="gap-2 text-[13px] border-border/40 hover:border-accent/25 hover:bg-accent/[0.04] transition-all duration-300">
                  <Phone className="w-3.5 h-3.5 text-accent/60" /> Ring til Emil
                </Button>
              </a>
              <a href="mailto:emil@sommervibes.dk">
                <Button variant="outline" size="sm" className="gap-2 text-[13px] border-border/40 hover:border-accent/25 hover:bg-accent/[0.04] transition-all duration-300">
                  <Mail className="w-3.5 h-3.5 text-accent/60" /> Skriv til Emil
                </Button>
              </a>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════
   5. VALUES
   ═══════════════════════════════════════════════════ */
function ValuesSection() {
  const { ref, isInView } = useScrollReveal();
  const values = [
    { title: 'Kvalitet over kvantitet', desc: 'Vi vælger samarbejder med omhu — så hver ejer får den fulde opmærksomhed.' },
    { title: 'Digital nytænkning', desc: 'Moderne værktøjer og overblik. Ikke papirformularer og forældede processer.' },
    { title: 'Personlig rådgivning', desc: 'Én fast kontaktperson, der kender dit hus, dine mål og dine behov.' },
  ];

  return (
    <section ref={ref} className="py-32 md:py-48 bg-card/20 relative">
      <div className="container mx-auto px-5 md:px-10 max-w-[700px]">
        <motion.div {...reveal(isInView)} className="text-center mb-24">
          <p className="text-accent/50 font-body text-[10.5px] font-semibold tracking-[0.4em] uppercase mb-5">Vores DNA</p>
          <h2 className="font-display text-[1.75rem] md:text-[2.2rem] font-semibold text-primary tracking-[-0.01em]">Det, der driver os</h2>
        </motion.div>

        <div className="space-y-20 md:space-y-24">
          {values.map((v, i) => (
            <motion.div
              key={i}
              {...reveal(isInView, 0.08 * i)}
              className="flex gap-7 md:gap-10 items-start"
            >
              <div className="flex-shrink-0 pt-2">
                <div className="w-px h-12 bg-accent/20 mx-auto" />
              </div>
              <div>
                <h3 className="font-display text-[1.2rem] md:text-[1.35rem] font-semibold text-primary mb-3 tracking-[-0.005em]">{v.title}</h3>
                <p className="text-muted-foreground/75 leading-[1.8] text-[15px]">{v.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════
   6. TRUST
   ═══════════════════════════════════════════════════ */
function TrustSection() {
  const { ref, isInView } = useScrollReveal();
  const points = [
    'Hurtig og personlig kontakt — altid',
    'Én fast kontaktperson, der kender dit hus',
    'Moderne digital proces med fuldt ejeroverblik',
    'Gennemsigtig kommission uden skjulte gebyrer',
    'Støtte før, under og efter opstart',
    'Du er aldrig bare et nummer i rækken',
  ];

  return (
    <section ref={ref} className="py-32 md:py-48 bg-background relative">
      <SectionDivider />

      <div className="container mx-auto px-5 md:px-10 max-w-[680px] mt-12">
        <motion.div {...reveal(isInView)} className="text-center mb-20">
          <h2 className="font-display text-[1.75rem] md:text-[2.2rem] font-semibold text-primary leading-[1.15] tracking-[-0.01em]">
            Derfor kan du føle dig
            <span className="block text-accent italic font-normal mt-1">tryg hos os</span>
          </h2>
        </motion.div>

        <div className="grid sm:grid-cols-2 gap-x-14 gap-y-7">
          {points.map((point, i) => (
            <motion.div
              key={i}
              {...reveal(isInView, 0.06 * i)}
              className="flex items-start gap-4"
            >
              <div className="w-[18px] h-[18px] rounded-full bg-accent/12 flex items-center justify-center flex-shrink-0 mt-[3px]">
                <Check className="w-[10px] h-[10px] text-accent/70" />
              </div>
              <span className="text-muted-foreground/80 text-[14.5px] leading-[1.7]">{point}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════
   7. CONTACT
   ═══════════════════════════════════════════════════ */
function ContactSection() {
  const { ref, isInView } = useScrollReveal();
  return (
    <section ref={ref} id="kontakt" className="py-32 md:py-48 bg-card/20 scroll-mt-24 relative">
      <div className="container mx-auto px-5 md:px-10 max-w-[900px]">
        <motion.div {...reveal(isInView)} className="text-center mb-20">
          <p className="text-accent/50 font-body text-[10.5px] font-semibold tracking-[0.4em] uppercase mb-5">Kontakt</p>
          <h2 className="font-display text-[1.75rem] md:text-[2.3rem] font-semibold text-primary mb-5 tracking-[-0.01em]">
            Vi er klar til at <span className="text-accent italic font-normal">hjælpe dig</span>
          </h2>
          <p className="text-muted-foreground/70 max-w-[420px] mx-auto leading-[1.75] text-[15px]">
            Du er altid velkommen til en uforpligtende samtale om dit sommerhus. Vi svarer typisk inden for få timer.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-4 md:gap-5 max-w-[720px] mx-auto mb-12">
          {[
            { icon: Phone, title: 'Ring til os', detail: '+45 12 34 56 78', href: 'tel:+4512345678', cta: 'Ring nu' },
            { icon: Mail, title: 'Skriv til os', detail: 'kontakt@sommervibes.dk', href: 'mailto:kontakt@sommervibes.dk', cta: 'Send email' },
            { icon: Clock, title: 'Åbningstider', detail: 'Tirsdag – fredag: 10–15', sub: 'Mandag, lør & søn: Lukket' },
          ].map((item, i) => (
            <motion.div
              key={i}
              {...reveal(isInView, 0.08 + i * 0.08)}
              className="bg-card/40 backdrop-blur-sm ring-1 ring-white/[0.03] rounded-2xl p-8 text-center hover:ring-accent/8 transition-all duration-500 group"
            >
              <div className="w-10 h-10 rounded-xl bg-accent/8 flex items-center justify-center mx-auto mb-5 group-hover:bg-accent/12 transition-colors duration-400">
                <item.icon className="w-[18px] h-[18px] text-accent/60" />
              </div>
              <h3 className="font-display font-semibold text-primary text-[14.5px] mb-2">{item.title}</h3>
              {item.href ? (
                <>
                  <a href={item.href} className="text-muted-foreground/70 text-[13.5px] hover:text-accent/80 transition-colors duration-300 block mb-5">{item.detail}</a>
                  <a href={item.href}>
                    <Button variant="outline" size="sm" className="gap-2 group/btn text-[12px] border-border/30 hover:border-accent/20 hover:bg-accent/[0.04] transition-all duration-300">
                      {item.cta} <ArrowRight className="w-3 h-3 group-hover/btn:translate-x-0.5 transition-transform duration-300" />
                    </Button>
                  </a>
                </>
              ) : (
                <>
                  <p className="text-muted-foreground/70 text-[13.5px]">{item.detail}</p>
                  {item.sub && <p className="text-muted-foreground/40 text-[11.5px] mt-1.5">{item.sub}</p>}
                </>
              )}
            </motion.div>
          ))}
        </div>

        <motion.p {...reveal(isInView, 0.5)} className="text-center text-[12.5px] text-muted-foreground/35 tracking-wide">
          Eller kontakt Emil direkte på <a href="mailto:emil@sommervibes.dk" className="text-accent/50 hover:text-accent/80 transition-colors duration-300">emil@sommervibes.dk</a>
        </motion.p>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════
   8. FINAL CTA
   ═══════════════════════════════════════════════════ */
function FinalCTA() {
  return (
    <section className="py-32 md:py-44 bg-background relative overflow-hidden">
      <SectionDivider />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_hsl(var(--accent)/0.025)_0%,transparent_65%)]" />

      <div className="container mx-auto px-5 md:px-10 text-center max-w-[520px] relative z-10 mt-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease: "easeOut" }}
        >
          <h2 className="font-display text-[1.7rem] md:text-[2.2rem] font-bold text-primary leading-[1.15] tracking-[-0.01em] mb-7">
            Lad os tage en uforpligtende snak
            <span className="block text-accent italic font-normal mt-1.5">om dit sommerhus</span>
          </h2>
          <p className="text-muted-foreground/70 text-[15.5px] leading-[1.8] mb-12">
            Vi vil gerne høre om dit hus — og fortælle, hvad SommerVibes kan gøre for dig.
          </p>
          <div className="flex flex-col sm:flex-row gap-3.5 justify-center">
            <a href="#kontakt">
              <Button variant="gold" size="lg" className="gap-2.5 group px-9 h-12 text-[14px] font-medium shadow-[0_4px_24px_-6px_hsl(var(--accent)/0.35)] hover:shadow-[0_6px_32px_-4px_hsl(var(--accent)/0.45)] transition-shadow duration-500">
                Kontakt os <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
              </Button>
            </a>
            <Link to="/kom-i-gang">
              <Button variant="outline" size="lg" className="border-accent/20 text-accent/90 hover:bg-accent/[0.06] hover:border-accent/30 px-9 h-12 text-[14px] font-medium transition-all duration-300">
                Udlej dit hus
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════
   PAGE
   ═══════════════════════════════════════════════════ */
const aboutFAQs = [
  { q: 'Hvem taler jeg med?', a: 'Du taler direkte med Emil eller en af vores rådgivere. Ingen callcentre, ingen ventetid.' },
  { q: 'Er det uforpligtende at kontakte jer?', a: 'Ja, altid. En første samtale er helt uforpligtende — vi vil bare gerne høre om dit hus.' },
  { q: 'Kan jeg ringe direkte?', a: 'Ja. Du kan ringe til os i åbningstiden, eller skrive en mail, så vender vi tilbage hurtigt.' },
];

export default function About() {
  return (
    <PublicLayout>
      <HeroSection />
      <VideoSection />
      <StorySection />
      <FounderSection />
      <ValuesSection />
      <TrustSection />
      <ContactSection />
      <ContextualFAQ
        eyebrow="Inden du ringer"
        heading="Kort & godt"
        items={aboutFAQs}
        className="py-16 md:py-20"
      />
      <FinalCTA />
    </PublicLayout>
  );
}
