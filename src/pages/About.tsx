import { PublicLayout } from '@/components/layout/PublicLayout';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { ArrowRight, Check, Phone, Mail, Clock, MapPin, Play, RotateCcw, Shield, Sparkles, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { useRef, useState, useEffect } from 'react';
import emilPortrait from '@/assets/emil-portrait.jpg';
import heroHouse from '@/assets/hero-house.jpg';

/* ─────────────────── 1. HERO ─────────────────── */
function HeroSection() {
  return (
    <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 bg-background text-foreground overflow-hidden">
      <div className="container mx-auto px-4 md:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <span className="text-accent font-body text-sm font-semibold tracking-[0.3em] uppercase block mb-6">Historien bag SommerVibes</span>
            <h1 className="font-display text-4xl md:text-5xl lg:text-[3.4rem] font-bold leading-[1.1] mb-6">
              Skabt for husejere, der vil have
              <span className="block text-accent italic font-normal mt-1">mere end et klassisk bureau</span>
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed mb-10 max-w-lg">
              SommerVibes kombinerer personlig rådgivning, digital nytænkning og gennemsigtig prissætning — så du kan fokusere på det vigtige.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <a href="#kontakt">
                <Button variant="gold" size="lg" className="gap-2 group w-full sm:w-auto">
                  Kontakt os <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </a>
              <Link to="/kom-i-gang">
                <Button variant="outline" size="lg" className="border-accent/40 text-accent hover:bg-accent/10 w-full sm:w-auto">
                  Udlej dit hus
                </Button>
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, delay: 0.2 }}
            className="relative flex justify-center"
          >
            <div className="relative w-[320px] md:w-[400px]">
              <div className="rounded-3xl overflow-hidden shadow-[0_20px_60px_-15px_rgba(0,0,0,0.4)] border border-border/30">
                <img
                  src={emilPortrait}
                  alt="Emil Weng Klockmann — Grundlægger af SommerVibes"
                  className="w-full aspect-[3/4] object-cover object-top"
                />
              </div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.7 }}
                className="absolute -bottom-5 -left-4 md:-left-8 bg-card/90 backdrop-blur-md border border-border/50 rounded-2xl px-6 py-4 shadow-elevated"
              >
                <p className="font-display font-semibold text-primary text-sm">Emil Weng Klockmann</p>
                <p className="text-xs text-accent">Grundlægger & Udlejningschef</p>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────── 2. VIDEO ─────────────────── */
function VideoSection() {
  const { ref, isInView } = useScrollReveal();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasEnded, setHasEnded] = useState(false);

  const handlePlay = () => {
    if (videoRef.current) {
      videoRef.current.play();
      setIsPlaying(true);
      setHasEnded(false);
    }
  };

  const handleReplay = () => {
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
    <section ref={ref} className="py-20 md:py-28 bg-muted/20">
      <div className="container mx-auto px-4 md:px-8 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center mb-12"
        >
          <span className="text-accent font-body text-sm font-semibold tracking-[0.3em] uppercase block mb-4">Mød Emil</span>
          <h2 className="font-display text-3xl md:text-4xl font-semibold text-primary">
            Personen bag <span className="text-accent italic font-normal">SommerVibes</span>
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="relative rounded-2xl overflow-hidden shadow-[0_15px_50px_-12px_rgba(0,0,0,0.35)] border border-border/30 bg-card group"
        >
          <video
            ref={videoRef}
            src="/video/emil-intro.mp4"
            poster={emilPortrait}
            playsInline
            preload="metadata"
            className="w-full aspect-video object-cover"
          />

          {/* Play overlay */}
          {!isPlaying && !hasEnded && (
            <button
              onClick={handlePlay}
              className="absolute inset-0 flex items-center justify-center bg-background/30 backdrop-blur-[2px] transition-opacity hover:bg-background/20"
            >
              <div className="w-20 h-20 rounded-full bg-accent/90 backdrop-blur flex items-center justify-center shadow-[0_8px_30px_rgba(0,0,0,0.3)] group-hover:scale-105 transition-transform">
                <Play className="w-8 h-8 text-primary fill-primary ml-1" />
              </div>
            </button>
          )}

          {/* Replay overlay */}
          {hasEnded && (
            <button
              onClick={handleReplay}
              className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background/40 backdrop-blur-[2px]"
            >
              <div className="w-16 h-16 rounded-full bg-accent/90 backdrop-blur flex items-center justify-center shadow-[0_8px_30px_rgba(0,0,0,0.3)] hover:scale-105 transition-transform">
                <RotateCcw className="w-6 h-6 text-primary" />
              </div>
              <span className="text-sm font-medium text-foreground/80">Se igen</span>
            </button>
          )}
        </motion.div>
      </div>
    </section>
  );
}

/* ─────────────────── 3. STORY ─────────────────── */
function StorySection() {
  const { ref, isInView } = useScrollReveal();
  return (
    <section ref={ref} className="py-20 md:py-28 bg-background">
      <div className="container mx-auto px-4 md:px-8">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            <div className="rounded-2xl overflow-hidden shadow-2xl">
              <img src={heroHouse} alt="Dansk sommerhus" className="w-full h-[420px] object-cover" loading="lazy" />
            </div>
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={isInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="absolute -bottom-5 -right-5 bg-accent text-primary px-6 py-3 rounded-xl shadow-lg"
            >
              <span className="font-display font-bold text-lg">Kun 15%</span>
              <span className="block text-sm opacity-80">i kommission</span>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <span className="text-accent font-body text-sm font-semibold tracking-[0.3em] uppercase block mb-4">Vores historie</span>
            <h2 className="font-display text-3xl md:text-4xl font-semibold text-primary mb-6">
              Fra frustration til
              <span className="block text-accent italic font-normal">en bedre løsning</span>
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-5">
              Store, traditionelle bureauer fokuserer ofte på volumen. Husejere kan føle sig som et nummer i rækken — uden gennemsigtighed eller personlig kontakt.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-5">
              <strong className="text-primary">SommerVibes blev skabt som svaret på det, vi selv savnede:</strong> Et moderne bureau med personlig service, digitalt overblik og en fair kommissionsmodel.
            </p>

            <div className="border-l-2 border-accent/40 pl-5 my-8">
              <p className="text-primary font-display text-lg italic leading-relaxed">
                "Vores ambition er ikke at være det største bureau — men det bedste for de ejere, vi samarbejder med."
              </p>
              <p className="text-accent text-sm mt-2 font-medium">— Emil W. Klockmann</p>
            </div>

            <Link to="/how-it-works">
              <Button variant="outline" className="gap-2 group">
                Se hvordan det virker <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────── 4. FOUNDER ─────────────────── */
function FounderSection() {
  const { ref, isInView } = useScrollReveal();
  return (
    <section ref={ref} className="py-20 md:py-28 bg-muted/20">
      <div className="container mx-auto px-4 md:px-8 max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="grid md:grid-cols-5 gap-12 items-center"
        >
          <div className="md:col-span-2 flex justify-center">
            <div className="w-56 h-56 md:w-64 md:h-64 rounded-2xl overflow-hidden shadow-xl border-2 border-accent/20">
              <img src={emilPortrait} alt="Emil Weng Klockmann" className="w-full h-full object-cover object-top" />
            </div>
          </div>

          <div className="md:col-span-3">
            <span className="text-accent font-body text-sm font-semibold tracking-[0.3em] uppercase block mb-4">Din kontaktperson</span>
            <h2 className="font-display text-3xl md:text-4xl font-semibold text-primary mb-2">
              Emil Weng Klockmann
            </h2>
            <p className="text-accent font-medium mb-6">Grundlægger & Udlejningschef</p>

            <div className="space-y-3 mb-8">
              {[
                'Uddannet ejendomsmægler med dyb markedsindsigt',
                'Selv sommerhus-ejer — kender husejernes perspektiv',
                'Personlig rådgivning fra dag ét til første booking',
                'Drives af at modernisere sommerhusudlejning',
              ].map((point, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 15 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.4, delay: 0.3 + i * 0.08 }}
                  className="flex items-start gap-3"
                >
                  <div className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-3 h-3 text-accent" />
                  </div>
                  <span className="text-muted-foreground">{point}</span>
                </motion.div>
              ))}
            </div>

            <div className="flex flex-wrap gap-3">
              <a href="tel:+4512345678">
                <Button variant="outline" size="sm" className="gap-2">
                  <Phone className="w-3.5 h-3.5" /> Ring til Emil
                </Button>
              </a>
              <a href="mailto:emil@sommervibes.dk">
                <Button variant="outline" size="sm" className="gap-2">
                  <Mail className="w-3.5 h-3.5" /> Skriv til Emil
                </Button>
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ─────────────────── 5. VALUES ─────────────────── */
function ValuesSection() {
  const { ref, isInView } = useScrollReveal();
  const values = [
    { icon: Shield, title: 'Kvalitet over kvantitet', desc: 'Vi vælger samarbejder med omhu, så hver ejer får den fulde opmærksomhed.' },
    { icon: Sparkles, title: 'Digital nytænkning', desc: 'Moderne værktøjer og overblik — ikke papirformularer og uforsikrede aftaler.' },
    { icon: Users, title: 'Personlig rådgivning', desc: 'Én fast kontaktperson, der kender dit hus og dine behov.' },
  ];

  return (
    <section ref={ref} className="py-20 md:py-28 bg-background">
      <div className="container mx-auto px-4 md:px-8 max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <span className="text-accent font-body text-sm font-semibold tracking-[0.3em] uppercase block mb-4">Vores DNA</span>
          <h2 className="font-display text-3xl md:text-4xl font-semibold text-primary">Det, der driver os</h2>
        </motion.div>
        <div className="grid md:grid-cols-3 gap-10">
          {values.map((v, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 25 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.15 * i }}
              className="text-center"
            >
              <div className="w-14 h-14 rounded-2xl bg-accent/15 flex items-center justify-center mx-auto mb-5">
                <v.icon className="w-7 h-7 text-accent" />
              </div>
              <h3 className="font-display text-lg font-semibold text-primary mb-2">{v.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{v.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────── 6. TRUST / WHY CHOOSE US ─────────────────── */
function TrustSection() {
  const { ref, isInView } = useScrollReveal();
  const points = [
    'Hurtig og personlig kontakt — altid',
    'Én fast kontaktperson, der kender dit hus',
    'Moderne digital proces med fuldt ejeroverblik',
    'Gennemsigtig kommission — ingen skjulte gebyrer',
    'Støtte før, under og efter opstart',
    'Du er aldrig bare et nummer i rækken',
  ];

  return (
    <section ref={ref} className="py-20 md:py-28 bg-muted/20">
      <div className="container mx-auto px-4 md:px-8 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center mb-14"
        >
          <span className="text-accent font-body text-sm font-semibold tracking-[0.3em] uppercase block mb-4">Tryghed</span>
          <h2 className="font-display text-3xl md:text-4xl font-semibold text-primary">
            Derfor kan du føle dig <span className="text-accent italic font-normal">tryg hos os</span>
          </h2>
        </motion.div>

        <div className="grid sm:grid-cols-2 gap-x-12 gap-y-5 max-w-3xl mx-auto">
          {points.map((point, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.4, delay: 0.1 * i }}
              className="flex items-start gap-3"
            >
              <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center flex-shrink-0 mt-0.5">
                <Check className="w-4 h-4 text-primary" />
              </div>
              <span className="text-muted-foreground">{point}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────── 7. CONTACT ─────────────────── */
function ContactSection() {
  const { ref, isInView } = useScrollReveal();
  return (
    <section ref={ref} id="kontakt" className="py-20 md:py-28 bg-background scroll-mt-20">
      <div className="container mx-auto px-4 md:px-8 max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center mb-14"
        >
          <span className="text-accent font-body text-sm font-semibold tracking-[0.3em] uppercase block mb-4">Kontakt</span>
          <h2 className="font-display text-3xl md:text-4xl font-semibold text-primary mb-4">
            Vi er klar til at <span className="text-accent italic font-normal">hjælpe dig</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Du er altid velkommen til at kontakte os for en uforpligtende samtale om dit sommerhus.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
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
              detail: 'Tirsdag–fredag: 10–15',
              sub: 'Mandag, lør & søn: Lukket',
            },
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.15 * i }}
              className="bg-card border border-border/50 rounded-2xl p-8 text-center hover:shadow-elevated transition-shadow duration-500"
            >
              <div className="w-12 h-12 rounded-xl bg-accent/15 flex items-center justify-center mx-auto mb-4">
                <item.icon className="w-6 h-6 text-accent" />
              </div>
              <h3 className="font-display font-semibold text-primary mb-2">{item.title}</h3>
              {item.href ? (
                <>
                  <a href={item.href} className="text-muted-foreground hover:text-accent transition-colors block mb-4">{item.detail}</a>
                  <a href={item.href}>
                    <Button variant="outline" size="sm" className="gap-2 group">
                      {item.cta} <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </a>
                </>
              ) : (
                <>
                  <p className="text-muted-foreground text-sm">{item.detail}</p>
                  {item.sub && <p className="text-muted-foreground/60 text-xs mt-1">{item.sub}</p>}
                </>
              )}
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-10 text-center"
        >
          <p className="text-sm text-muted-foreground/70">
            Eller kontakt Emil direkte: <a href="mailto:emil@sommervibes.dk" className="text-accent hover:underline">emil@sommervibes.dk</a>
          </p>
        </motion.div>
      </div>
    </section>
  );
}

/* ─────────────────── 8. FINAL CTA ─────────────────── */
function FinalCTA() {
  return (
    <section className="py-20 md:py-28 bg-muted/20">
      <div className="container mx-auto px-4 md:px-8 text-center max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <h2 className="font-display text-3xl md:text-4xl font-bold text-primary mb-5">
            Lad os tage en uforpligtende snak
            <span className="block text-accent italic font-normal mt-1">om dit sommerhus</span>
          </h2>
          <p className="text-muted-foreground text-lg mb-10 max-w-xl mx-auto">
            Vi vil gerne høre om dit hus og fortælle, hvad SommerVibes kan gøre for dig.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="#kontakt">
              <Button variant="gold" size="lg" className="gap-2 group">
                Kontakt os <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </a>
            <Link to="/kom-i-gang">
              <Button variant="outline" size="lg" className="border-accent/40 text-accent hover:bg-accent/10">
                Udlej dit hus
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ─────────────────── PAGE ─────────────────── */
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
