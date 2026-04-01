import { PublicLayout } from '@/components/layout/PublicLayout';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { ArrowRight, Check, Phone, Mail, Clock, Play, RotateCcw } from 'lucide-react';
import { motion } from 'framer-motion';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { useRef, useState, useEffect } from 'react';
import emilPortrait from '@/assets/emil-portrait.jpg';
import heroHouse from '@/assets/hero-house.jpg';

const ease = [0.25, 0.1, 0.25, 1] as const;

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.9, delay, ease: ease as unknown as [number, number, number, number] },
});

const reveal = (isInView: boolean, delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  animate: isInView ? { opacity: 1, y: 0 } : {},
  transition: { duration: 0.8, delay, ease: ease as unknown as [number, number, number, number] },
});

/* ═══════════════════════════════════════════════════
   1. HERO — cinematic, founder-led, calm authority
   ═══════════════════════════════════════════════════ */
function HeroSection() {
  return (
    <section className="relative min-h-[90vh] flex items-center bg-background text-foreground overflow-hidden">
      {/* Subtle ambient glow */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-accent/[0.03] blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-accent/[0.02] blur-[100px] pointer-events-none" />

      <div className="container mx-auto px-4 md:px-8 py-32 md:py-0">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center max-w-7xl mx-auto">
          {/* Text — 7 cols */}
          <motion.div {...fade()} className="lg:col-span-7 relative z-10">
            <motion.span
              {...fade(0.1)}
              className="inline-block text-accent/80 font-body text-[11px] font-semibold tracking-[0.35em] uppercase mb-8"
            >
              Historien bag SommerVibes
            </motion.span>

            <motion.h1
              {...fade(0.2)}
              className="font-display text-[2.5rem] md:text-[3.2rem] lg:text-[3.8rem] font-bold leading-[1.08] mb-8 max-w-[600px]"
            >
              Vi bygger fremtidens
              <span className="block text-accent italic font-normal mt-1">sommerhusbureau</span>
            </motion.h1>

            <motion.p
              {...fade(0.35)}
              className="text-[1.05rem] text-muted-foreground leading-[1.75] mb-12 max-w-[480px]"
            >
              SommerVibes kombinerer personlig rådgivning med digital nytænkning og gennemsigtig prissætning — skabt for husejere, der fortjener mere.
            </motion.p>

            <motion.div {...fade(0.5)} className="flex flex-col sm:flex-row gap-3">
              <a href="#kontakt">
                <Button variant="gold" size="lg" className="gap-2.5 group px-8">
                  Kontakt os <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </a>
              <Link to="/kom-i-gang">
                <Button variant="outline" size="lg" className="border-accent/30 text-accent hover:bg-accent/8 px-8">
                  Udlej dit hus
                </Button>
              </Link>
            </motion.div>
          </motion.div>

          {/* Portrait — 5 cols */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 1.1, delay: 0.3 }}
            className="lg:col-span-5 flex justify-center lg:justify-end"
          >
            <div className="relative">
              {/* Glow behind portrait */}
              <div className="absolute -inset-6 bg-accent/[0.06] rounded-[2rem] blur-2xl pointer-events-none" />

              <div className="relative w-[280px] md:w-[340px] lg:w-[380px]">
                <div className="rounded-[1.5rem] overflow-hidden shadow-[0_30px_80px_-20px_rgba(0,0,0,0.5)] ring-1 ring-white/[0.06]">
                  <img
                    src={emilPortrait}
                    alt="Emil Weng Klockmann — Grundlægger af SommerVibes"
                    className="w-full aspect-[3/4] object-cover object-top"
                  />
                  {/* Bottom fade */}
                  <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background/80 to-transparent" />
                </div>

                {/* Name badge */}
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.9 }}
                  className="absolute bottom-6 left-6 right-6"
                >
                  <p className="font-display font-semibold text-primary text-[15px]">Emil Weng Klockmann</p>
                  <p className="text-[12px] text-accent/80 font-medium">Grundlægger & Udlejningschef</p>
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
   2. VIDEO — premium media moment
   ═══════════════════════════════════════════════════ */
function VideoSection() {
  const { ref, isInView } = useScrollReveal();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasEnded, setHasEnded] = useState(false);

  const play = () => {
    videoRef.current?.play();
    setIsPlaying(true);
    setHasEnded(false);
  };

  const replay = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play();
      setIsPlaying(true);
      setHasEnded(false);
    }
  };

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onEnd = () => { setIsPlaying(false); setHasEnded(true); };
    v.addEventListener('ended', onEnd);
    return () => v.removeEventListener('ended', onEnd);
  }, []);

  return (
    <section ref={ref} className="py-28 md:py-40 bg-background relative">
      {/* Subtle section separator */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-px bg-accent/20" />

      <div className="container mx-auto px-4 md:px-8 max-w-[920px]">
        <motion.div {...reveal(isInView)} className="text-center mb-14">
          <h2 className="font-display text-3xl md:text-[2.5rem] font-semibold text-primary leading-tight">
            Mød personen bag <span className="text-accent italic font-normal">SommerVibes</span>
          </h2>
        </motion.div>

        <motion.div
          {...reveal(isInView, 0.15)}
          className="relative rounded-[1.25rem] overflow-hidden bg-card ring-1 ring-white/[0.04] shadow-[0_25px_70px_-15px_rgba(0,0,0,0.45)]"
        >
          <video
            ref={videoRef}
            src="/video/emil-intro.mp4"
            poster={emilPortrait}
            playsInline
            preload="metadata"
            className="w-full aspect-video object-cover"
          />

          {/* Play state */}
          {!isPlaying && !hasEnded && (
            <button
              onClick={play}
              className="absolute inset-0 flex items-center justify-center bg-background/25 backdrop-blur-[1px] group cursor-pointer transition-colors hover:bg-background/15"
            >
              <div className="relative">
                <div className="absolute -inset-4 rounded-full bg-accent/10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative w-[72px] h-[72px] rounded-full bg-accent/90 flex items-center justify-center shadow-[0_8px_40px_-8px_rgba(0,0,0,0.4)] group-hover:scale-[1.06] transition-transform duration-300">
                  <Play className="w-7 h-7 text-primary fill-primary ml-0.5" />
                </div>
              </div>
            </button>
          )}

          {/* Ended state */}
          {hasEnded && (
            <button
              onClick={replay}
              className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-background/35 backdrop-blur-[1px] cursor-pointer group"
            >
              <div className="w-14 h-14 rounded-full bg-card/80 backdrop-blur-md ring-1 ring-white/10 flex items-center justify-center group-hover:scale-[1.06] transition-transform duration-300">
                <RotateCcw className="w-5 h-5 text-accent" />
              </div>
              <span className="text-[13px] font-medium text-foreground/60 tracking-wide">Se igen</span>
            </button>
          )}
        </motion.div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════
   3. STORY — editorial, emotional, asymmetric
   ═══════════════════════════════════════════════════ */
function StorySection() {
  const { ref, isInView } = useScrollReveal();
  return (
    <section ref={ref} className="py-28 md:py-40 bg-card/30 relative">
      <div className="container mx-auto px-4 md:px-8">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-20 items-center max-w-6xl mx-auto">
          {/* Image — 5 cols */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 1, ease: [0.25, 0.1, 0.25, 1] }}
            className="lg:col-span-5 relative"
          >
            <div className="rounded-2xl overflow-hidden shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] ring-1 ring-white/[0.04]">
              <img src={heroHouse} alt="Dansk sommerhus" className="w-full aspect-[4/5] object-cover" loading="lazy" />
            </div>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={isInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="absolute -bottom-4 -right-4 bg-accent text-primary px-5 py-2.5 rounded-xl shadow-lg"
            >
              <span className="font-display font-bold text-base">Kun 15%</span>
              <span className="block text-[11px] opacity-75">i kommission</span>
            </motion.div>
          </motion.div>

          {/* Text — 7 cols */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 1, delay: 0.15, ease: [0.25, 0.1, 0.25, 1] }}
            className="lg:col-span-7"
          >
            <span className="text-accent/70 font-body text-[11px] font-semibold tracking-[0.35em] uppercase block mb-5">Vores historie</span>
            <h2 className="font-display text-[2rem] md:text-[2.6rem] font-semibold text-primary leading-[1.15] mb-8">
              Fra frustration
              <span className="block text-accent italic font-normal">til en bedre løsning</span>
            </h2>

            <div className="space-y-5 mb-10">
              <p className="text-muted-foreground leading-[1.8]">
                Store bureauer fokuserer på volumen. Husejere bliver et nummer i rækken — uden gennemsigtighed, uden personlig kontakt, uden reel omsorg.
              </p>
              <p className="text-muted-foreground leading-[1.8]">
                <strong className="text-primary font-medium">SommerVibes blev skabt som svaret på det, vi selv savnede:</strong> Et moderne bureau med personlig service, digitalt overblik og en fair kommissionsmodel.
              </p>
            </div>

            {/* Signature quote */}
            <div className="border-l-[2px] border-accent/30 pl-6 py-1 mb-10">
              <p className="text-primary/90 font-display text-[1.15rem] italic leading-[1.7]">
                "Vores ambition er ikke at være det største bureau — men det bedste for de ejere, vi samarbejder med."
              </p>
              <p className="text-accent/70 text-[13px] mt-3 font-medium tracking-wide">Emil W. Klockmann</p>
            </div>

            <Link to="/how-it-works">
              <Button variant="outline" size="sm" className="gap-2 group text-[13px] border-border/60 hover:border-accent/40">
                Se hvordan det virker <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════
   4. FOUNDER — editorial profile, not a CV
   ═══════════════════════════════════════════════════ */
function FounderSection() {
  const { ref, isInView } = useScrollReveal();
  return (
    <section ref={ref} className="py-28 md:py-40 bg-background relative">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-px bg-accent/20" />

      <div className="container mx-auto px-4 md:px-8 max-w-5xl">
        <div className="grid md:grid-cols-12 gap-12 md:gap-16 items-start">
          {/* Portrait — 4 cols */}
          <motion.div
            {...reveal(isInView)}
            className="md:col-span-4 flex justify-center md:sticky md:top-28"
          >
            <div className="relative">
              <div className="absolute -inset-4 bg-accent/[0.04] rounded-[1.5rem] blur-xl pointer-events-none" />
              <div className="relative w-48 md:w-full max-w-[260px] rounded-2xl overflow-hidden ring-1 ring-white/[0.05] shadow-[0_20px_50px_-15px_rgba(0,0,0,0.35)]">
                <img src={emilPortrait} alt="Emil Weng Klockmann" className="w-full aspect-[3/4] object-cover object-top" />
              </div>
            </div>
          </motion.div>

          {/* Bio — 8 cols */}
          <motion.div {...reveal(isInView, 0.15)} className="md:col-span-8">
            <span className="text-accent/70 font-body text-[11px] font-semibold tracking-[0.35em] uppercase block mb-4">Din kontaktperson</span>
            <h2 className="font-display text-[2rem] md:text-[2.4rem] font-semibold text-primary leading-tight mb-2">
              Emil Weng Klockmann
            </h2>
            <p className="text-accent/80 text-[15px] font-medium mb-8">Grundlægger & Udlejningschef</p>

            <p className="text-muted-foreground leading-[1.8] mb-8 max-w-lg">
              Emil er uddannet ejendomsmægler, selv sommerhus-ejer og har arbejdet med boliger i mere end fire år. Han grundlagde SommerVibes med én overbevisning: at husejere fortjener mere end det, markedet tilbyder i dag.
            </p>

            <div className="grid grid-cols-2 gap-x-6 gap-y-4 mb-10">
              {[
                'Uddannet ejendomsmægler',
                'Selv sommerhus-ejer',
                'Personlig rådgiver fra dag ét',
                'Digital og moderne tilgang',
              ].map((point, i) => (
                <motion.div
                  key={i}
                  {...reveal(isInView, 0.3 + i * 0.06)}
                  className="flex items-center gap-2.5"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-accent flex-shrink-0" />
                  <span className="text-muted-foreground text-[14px]">{point}</span>
                </motion.div>
              ))}
            </div>

            <div className="flex flex-wrap gap-3">
              <a href="tel:+4512345678">
                <Button variant="outline" size="sm" className="gap-2 text-[13px] border-border/60 hover:border-accent/40">
                  <Phone className="w-3.5 h-3.5" /> Ring til Emil
                </Button>
              </a>
              <a href="mailto:emil@sommervibes.dk">
                <Button variant="outline" size="sm" className="gap-2 text-[13px] border-border/60 hover:border-accent/40">
                  <Mail className="w-3.5 h-3.5" /> Skriv til Emil
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
   5. VALUES — minimal, brand-defining, not a grid
   ═══════════════════════════════════════════════════ */
function ValuesSection() {
  const { ref, isInView } = useScrollReveal();
  const values = [
    { title: 'Kvalitet over kvantitet', desc: 'Vi vælger samarbejder med omhu — så hver ejer får den fulde opmærksomhed.' },
    { title: 'Digital nytænkning', desc: 'Moderne værktøjer og overblik. Ikke papirformularer og forældede processer.' },
    { title: 'Personlig rådgivning', desc: 'Én fast kontaktperson, der kender dit hus, dine mål og dine behov.' },
  ];

  return (
    <section ref={ref} className="py-28 md:py-40 bg-card/30 relative">
      <div className="container mx-auto px-4 md:px-8 max-w-4xl">
        <motion.div {...reveal(isInView)} className="text-center mb-20">
          <span className="text-accent/70 font-body text-[11px] font-semibold tracking-[0.35em] uppercase block mb-5">Vores DNA</span>
          <h2 className="font-display text-[2rem] md:text-[2.4rem] font-semibold text-primary">Det, der driver os</h2>
        </motion.div>

        <div className="space-y-16 md:space-y-20">
          {values.map((v, i) => (
            <motion.div
              key={i}
              {...reveal(isInView, 0.1 * i)}
              className="flex gap-8 md:gap-12 items-start max-w-2xl mx-auto"
            >
              <div className="flex-shrink-0 w-10 pt-1">
                <div className="w-[3px] h-10 bg-accent/30 rounded-full mx-auto" />
              </div>
              <div>
                <h3 className="font-display text-xl md:text-[1.4rem] font-semibold text-primary mb-2">{v.title}</h3>
                <p className="text-muted-foreground leading-[1.75] text-[15px]">{v.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════
   6. TRUST — calm reassurance, elegant checks
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
    <section ref={ref} className="py-28 md:py-40 bg-background relative">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-px bg-accent/20" />

      <div className="container mx-auto px-4 md:px-8 max-w-3xl">
        <motion.div {...reveal(isInView)} className="text-center mb-16">
          <h2 className="font-display text-[2rem] md:text-[2.4rem] font-semibold text-primary leading-tight">
            Derfor kan du føle dig
            <span className="block text-accent italic font-normal">tryg hos os</span>
          </h2>
        </motion.div>

        <div className="grid sm:grid-cols-2 gap-x-16 gap-y-6">
          {points.map((point, i) => (
            <motion.div
              key={i}
              {...reveal(isInView, 0.08 * i)}
              className="flex items-start gap-3.5"
            >
              <div className="w-5 h-5 rounded-full bg-accent/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Check className="w-3 h-3 text-accent" />
              </div>
              <span className="text-muted-foreground text-[15px] leading-relaxed">{point}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════
   7. CONTACT — premium invitation, no form
   ═══════════════════════════════════════════════════ */
function ContactSection() {
  const { ref, isInView } = useScrollReveal();
  return (
    <section ref={ref} id="kontakt" className="py-28 md:py-40 bg-card/30 scroll-mt-20 relative">
      <div className="container mx-auto px-4 md:px-8 max-w-4xl">
        <motion.div {...reveal(isInView)} className="text-center mb-16">
          <span className="text-accent/70 font-body text-[11px] font-semibold tracking-[0.35em] uppercase block mb-5">Kontakt</span>
          <h2 className="font-display text-[2rem] md:text-[2.4rem] font-semibold text-primary mb-4">
            Vi er klar til at <span className="text-accent italic font-normal">hjælpe dig</span>
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto leading-relaxed">
            Du er altid velkommen til en uforpligtende samtale om dit sommerhus. Vi svarer typisk inden for få timer.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-5 max-w-3xl mx-auto mb-10">
          {[
            {
              icon: Phone,
              title: 'Ring til os',
              detail: '+45 12 34 56 78',
              href: 'tel:+4512345678',
              cta: 'Ring nu',
            },
            {
              icon: Mail,
              title: 'Skriv til os',
              detail: 'kontakt@sommervibes.dk',
              href: 'mailto:kontakt@sommervibes.dk',
              cta: 'Send email',
            },
            {
              icon: Clock,
              title: 'Åbningstider',
              detail: 'Tirsdag – fredag: 10–15',
              sub: 'Mandag, lør & søn: Lukket',
            },
          ].map((item, i) => (
            <motion.div
              key={i}
              {...reveal(isInView, 0.1 + i * 0.1)}
              className="bg-card/60 backdrop-blur-sm ring-1 ring-white/[0.04] rounded-2xl p-7 text-center hover:ring-accent/10 transition-all duration-500"
            >
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center mx-auto mb-4">
                <item.icon className="w-5 h-5 text-accent/80" />
              </div>
              <h3 className="font-display font-semibold text-primary text-[15px] mb-1.5">{item.title}</h3>
              {item.href ? (
                <>
                  <a href={item.href} className="text-muted-foreground text-[14px] hover:text-accent transition-colors block mb-4">{item.detail}</a>
                  <a href={item.href}>
                    <Button variant="outline" size="sm" className="gap-2 group text-[12px] border-border/50 hover:border-accent/30">
                      {item.cta} <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                    </Button>
                  </a>
                </>
              ) : (
                <>
                  <p className="text-muted-foreground text-[14px]">{item.detail}</p>
                  {item.sub && <p className="text-muted-foreground/50 text-[12px] mt-1">{item.sub}</p>}
                </>
              )}
            </motion.div>
          ))}
        </div>

        <motion.p {...reveal(isInView, 0.5)} className="text-center text-[13px] text-muted-foreground/50">
          Eller kontakt Emil direkte: <a href="mailto:emil@sommervibes.dk" className="text-accent/70 hover:text-accent transition-colors">emil@sommervibes.dk</a>
        </motion.p>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════
   8. FINAL CTA — confident, warm close
   ═══════════════════════════════════════════════════ */
function FinalCTA() {
  return (
    <section className="py-28 md:py-36 bg-background relative">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-px bg-accent/20" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_hsl(var(--accent)/0.03)_0%,transparent_70%)]" />

      <div className="container mx-auto px-4 md:px-8 text-center max-w-2xl relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, ease: [0.25, 0.1, 0.25, 1] }}
        >
          <h2 className="font-display text-[1.8rem] md:text-[2.4rem] font-bold text-primary leading-[1.15] mb-6">
            Lad os tage en uforpligtende snak
            <span className="block text-accent italic font-normal mt-1">om dit sommerhus</span>
          </h2>
          <p className="text-muted-foreground text-[1.05rem] leading-relaxed mb-10 max-w-md mx-auto">
            Vi vil gerne høre om dit hus — og fortælle, hvad SommerVibes kan gøre for dig.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href="#kontakt">
              <Button variant="gold" size="lg" className="gap-2.5 group px-8">
                Kontakt os <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </a>
            <Link to="/kom-i-gang">
              <Button variant="outline" size="lg" className="border-accent/30 text-accent hover:bg-accent/8 px-8">
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
      <FinalCTA />
    </PublicLayout>
  );
}
