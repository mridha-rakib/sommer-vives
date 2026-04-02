import { PublicLayout } from '@/components/layout/PublicLayout';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { ArrowRight, Check, Phone, Mail, Clock, Play, RotateCcw, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { useRef, useState, useEffect } from 'react';
import emilPortrait from '@/assets/emil-portrait.jpg';
import heroHouse from '@/assets/hero-house.jpg';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.9, delay, ease: "easeOut" as const },
});

const reveal = (isInView: boolean, delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  animate: isInView ? { opacity: 1, y: 0 } : {},
  transition: { duration: 0.8, delay, ease: "easeOut" as const },
});

/* ═══════════════════════════════════════════════════
   1. HERO — Founder-led media moment
   ═══════════════════════════════════════════════════ */
function HeroSection() {
  return (
    <section className="relative min-h-[88vh] flex items-center bg-background text-foreground overflow-hidden">
      <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] rounded-full bg-accent/[0.02] blur-[120px] pointer-events-none" />

      <div className="container mx-auto px-5 md:px-10 py-32 md:py-0">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center max-w-[1140px] mx-auto">
          {/* Copy */}
          <motion.div {...fade()} className="lg:col-span-6 relative z-10">
            <motion.span
              {...fade(0.1)}
              className="inline-block text-accent/50 font-body text-[10px] font-semibold tracking-[0.4em] uppercase mb-6"
            >
              Om SommerVibes
            </motion.span>

            <motion.h1
              {...fade(0.2)}
              className="font-display text-[2.2rem] sm:text-[2.8rem] md:text-[3.2rem] lg:text-[3.5rem] font-bold leading-[1.05] tracking-[-0.015em] mb-6"
            >
              Mød Emil
              <span className="block text-accent italic font-normal mt-1 text-[0.85em]">— og historien bag SommerVibes</span>
            </motion.h1>

            <motion.p
              {...fade(0.35)}
              className="text-[15px] md:text-[16px] text-muted-foreground/85 leading-[1.8] mb-10 max-w-[420px]"
            >
              Grundlægger, udlejningschef og din faste kontaktperson. Emil byggede SommerVibes med én ambition: at give husejere en bedre, mere personlig oplevelse.
            </motion.p>

            <motion.div {...fade(0.5)} className="flex flex-col sm:flex-row gap-3">
              <a href="#kontakt">
                <Button variant="gold" size="lg" className="gap-2.5 group px-8 h-11 text-[13.5px] font-medium shadow-[0_4px_24px_-6px_hsl(var(--accent)/0.3)] hover:shadow-[0_6px_32px_-4px_hsl(var(--accent)/0.4)] transition-shadow duration-500">
                  Kontakt Emil <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform duration-300" />
                </Button>
              </a>
              <Link to="/book-vurdering">
                <Button variant="outline" size="lg" className="border-accent/20 text-accent/80 hover:bg-accent/[0.05] hover:border-accent/30 px-8 h-11 text-[13.5px] font-medium transition-all duration-300">
                  Book gratis udlejningstjek
                </Button>
              </Link>
            </motion.div>
          </motion.div>

          {/* Portrait */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.1, delay: 0.3, ease: "easeOut" }}
            className="lg:col-span-6 flex justify-center lg:justify-end"
          >
            <div className="relative w-full max-w-[480px]">
              <div className="absolute -inset-6 bg-accent/[0.03] rounded-[2rem] blur-3xl pointer-events-none" />
              <div className="relative rounded-[1.5rem] overflow-hidden shadow-[0_30px_80px_-20px_rgba(0,0,0,0.5)] ring-1 ring-white/[0.04]">
                <img
                  src={emilPortrait}
                  alt="Emil Weng Klockmann — Grundlægger af SommerVibes"
                  className="w-full aspect-[4/5] object-cover object-top"
                />
                <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background/80 via-background/30 to-transparent" />
                <div className="absolute bottom-6 left-7 right-7">
                  <p className="font-display font-semibold text-foreground text-[15px] tracking-[-0.01em]">Emil Weng Klockmann</p>
                  <p className="text-[11px] text-accent/60 font-medium mt-0.5 tracking-wide">Grundlægger & Udlejningschef</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════
   2. VIDEO — Cinematic founder film
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
    <section ref={ref} className="py-16 md:py-24 bg-background relative">
      <div className="container mx-auto px-5 md:px-10 max-w-[920px]">
        <motion.div
          {...reveal(isInView)}
          className="relative rounded-[1.25rem] overflow-hidden bg-card/60 ring-1 ring-white/[0.04] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.5)]"
        >
          <video
            ref={videoRef}
            src="/video/emil-intro.mp4"
            poster={emilPortrait}
            playsInline
            preload="metadata"
            className="w-full aspect-[16/9] object-contain bg-background"
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
                className="absolute inset-0 flex items-center justify-center bg-background/30 group cursor-pointer"
              >
                <div className="relative">
                  <div className="absolute -inset-5 rounded-full bg-accent/8 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                  <div className="relative w-16 h-16 md:w-[72px] md:h-[72px] rounded-full bg-accent/90 flex items-center justify-center shadow-[0_10px_50px_-10px_rgba(0,0,0,0.5)] group-hover:scale-105 transition-transform duration-300">
                    <Play className="w-5 h-5 md:w-6 md:h-6 text-primary fill-primary ml-0.5" />
                  </div>
                </div>
              </motion.button>
            )}

            {hasEnded && (
              <motion.button
                key="replay"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                onClick={replay}
                className="absolute bottom-4 right-4 w-11 h-11 rounded-full bg-card/80 backdrop-blur-md ring-1 ring-white/[0.08] flex items-center justify-center cursor-pointer hover:scale-105 hover:ring-accent/20 transition-all duration-300"
                title="Se igen"
              >
                <RotateCcw className="w-4 h-4 text-accent/70" />
              </motion.button>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════
   3. STORY — One strong editorial block
   ═══════════════════════════════════════════════════ */
function StorySection() {
  const { ref, isInView } = useScrollReveal();
  return (
    <section ref={ref} className="py-16 md:py-24 bg-background relative">
      <div className="container mx-auto px-5 md:px-10">
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-16 items-center max-w-[1060px] mx-auto">
          {/* Image */}
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 1, ease: "easeOut" }}
            className="lg:col-span-5 relative"
          >
            <div className="rounded-[1.25rem] overflow-hidden shadow-[0_20px_60px_-15px_rgba(0,0,0,0.35)] ring-1 ring-white/[0.03]">
              <img src={heroHouse} alt="Dansk sommerhus i naturskønne omgivelser" className="w-full aspect-[4/5] object-cover" loading="lazy" />
            </div>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={isInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="absolute -bottom-3 -right-3 bg-accent text-primary px-5 py-2.5 rounded-xl shadow-[0_8px_24px_-8px_rgba(0,0,0,0.3)]"
            >
              <span className="font-display font-bold text-[14px]">Kun 15%</span>
              <span className="block text-[10px] opacity-70 tracking-wide">i kommission</span>
            </motion.div>
          </motion.div>

          {/* Copy */}
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 1, delay: 0.1, ease: "easeOut" }}
            className="lg:col-span-7"
          >
            <span className="text-accent/45 font-body text-[10px] font-semibold tracking-[0.4em] uppercase block mb-5">Vores historie</span>
            <h2 className="font-display text-[1.7rem] md:text-[2.2rem] font-semibold text-primary leading-[1.1] tracking-[-0.01em] mb-8">
              Fra frustration
              <span className="block text-accent italic font-normal mt-1">til en bedre løsning</span>
            </h2>

            <div className="space-y-5 mb-8">
              <p className="text-muted-foreground/80 leading-[1.8] text-[15px]">
                Store bureauer fokuserer på volumen. Husejere bliver et nummer i rækken — uden gennemsigtighed, uden personlig kontakt, uden reel omsorg for deres hus.
              </p>
              <p className="text-muted-foreground/80 leading-[1.8] text-[15px]">
                <strong className="text-primary/85 font-medium">SommerVibes blev skabt som svaret på det, vi selv savnede</strong> — et moderne bureau med personlig service, digitalt overblik og en fair kommissionsmodel. Ikke det største bureau, men det bedste for de ejere vi samarbejder med.
              </p>
            </div>

            <div className="border-l-[1.5px] border-accent/20 pl-6 py-1 mb-8">
              <p className="text-primary/75 font-display text-[1.05rem] md:text-[1.15rem] italic leading-[1.7]">
                "Vores ambition er ikke at være det største bureau — men det bedste for de ejere, vi samarbejder med."
              </p>
              <p className="text-accent/45 text-[11px] mt-3 font-medium tracking-[0.15em] uppercase">Emil W. Klockmann</p>
            </div>

            <Link to="/how-it-works">
              <Button variant="outline" size="sm" className="gap-2 group text-[12.5px] border-border/30 hover:border-accent/25 hover:bg-accent/[0.04] transition-all duration-300">
                Se hvordan det virker <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform duration-300" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════
   4. FOUNDER + TRUST — Combined, compact
   ═══════════════════════════════════════════════════ */
function FounderTrustSection() {
  const { ref, isInView } = useScrollReveal();

  const trustPoints = [
    'Hurtig og personlig kontakt',
    'Én fast kontaktperson',
    'Gennemsigtig kommission',
    'Moderne digitalt overblik',
  ];

  const credentials = [
    'Uddannet ejendomsmægler',
    'Selv sommerhus-ejer',
    'Personlig rådgiver fra dag ét',
    'Digital og moderne tilgang',
  ];

  return (
    <section ref={ref} className="py-16 md:py-24 bg-card/30 relative">
      <div className="container mx-auto px-5 md:px-10 max-w-[1000px]">
        <div className="grid md:grid-cols-12 gap-10 md:gap-14 items-start">
          {/* Portrait */}
          <motion.div {...reveal(isInView)} className="md:col-span-4 flex justify-center">
            <div className="relative w-full max-w-[220px]">
              <div className="absolute -inset-4 bg-accent/[0.025] rounded-[1.5rem] blur-xl pointer-events-none" />
              <div className="relative rounded-[1.25rem] overflow-hidden ring-1 ring-white/[0.04] shadow-[0_20px_50px_-15px_rgba(0,0,0,0.4)]">
                <img src={emilPortrait} alt="Emil Weng Klockmann" className="w-full aspect-[3/4] object-cover object-top" />
              </div>
            </div>
          </motion.div>

          {/* Content */}
          <motion.div {...reveal(isInView, 0.1)} className="md:col-span-8">
            <span className="text-accent/45 font-body text-[10px] font-semibold tracking-[0.4em] uppercase block mb-4">Din kontaktperson</span>
            <h2 className="font-display text-[1.6rem] md:text-[2rem] font-semibold text-primary leading-[1.1] tracking-[-0.01em] mb-1.5">
              Emil Weng Klockmann
            </h2>
            <p className="text-accent/55 text-[13px] font-medium tracking-wide mb-7">Grundlægger & Udlejningschef</p>

            <p className="text-muted-foreground/80 leading-[1.8] mb-7 max-w-[460px] text-[14.5px]">
              Uddannet ejendomsmægler, selv sommerhus-ejer og med mere end fire års erfaring i boligbranchen. Emil grundlagde SommerVibes med én overbevisning: at husejere fortjener mere end det, markedet tilbyder i dag.
            </p>

            {/* Credentials */}
            <div className="grid grid-cols-2 gap-x-6 gap-y-2.5 mb-8">
              {credentials.map((point, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <div className="w-[4px] h-[4px] rounded-full bg-accent/35 flex-shrink-0" />
                  <span className="text-muted-foreground/70 text-[13px]">{point}</span>
                </div>
              ))}
            </div>

            {/* Contact buttons */}
            <div className="flex flex-wrap gap-2.5 mb-12">
              <a href="tel:+4512345678">
                <Button variant="outline" size="sm" className="gap-2 text-[12.5px] border-border/30 hover:border-accent/20 hover:bg-accent/[0.04] transition-all duration-300">
                  <Phone className="w-3.5 h-3.5 text-accent/55" /> Ring til Emil
                </Button>
              </a>
              <a href="mailto:emil@sommervibes.dk">
                <Button variant="outline" size="sm" className="gap-2 text-[12.5px] border-border/30 hover:border-accent/20 hover:bg-accent/[0.04] transition-all duration-300">
                  <Mail className="w-3.5 h-3.5 text-accent/55" /> Skriv til Emil
                </Button>
              </a>
              <Link to="/book-vurdering">
                <Button variant="outline" size="sm" className="gap-2 text-[12.5px] border-border/30 hover:border-accent/20 hover:bg-accent/[0.04] transition-all duration-300">
                  Book gratis udlejningstjek
                </Button>
              </Link>
            </div>

            {/* Trust strip */}
            <div className="border-t border-border/20 pt-7">
              <p className="text-accent/40 font-body text-[10px] font-semibold tracking-[0.3em] uppercase mb-4">Derfor kan du føle dig tryg</p>
              <div className="grid grid-cols-2 gap-x-6 gap-y-2.5">
                {trustPoints.map((point, i) => (
                  <motion.div key={i} {...reveal(isInView, 0.2 + i * 0.04)} className="flex items-center gap-2.5">
                    <div className="w-[16px] h-[16px] rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                      <Check className="w-[9px] h-[9px] text-accent/60" />
                    </div>
                    <span className="text-muted-foreground/70 text-[13px]">{point}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════
   5. BRAND DNA — Compact strip
   ═══════════════════════════════════════════════════ */
function BrandDNA() {
  const { ref, isInView } = useScrollReveal();
  const values = [
    { title: 'Kvalitet over kvantitet', desc: 'Færre ejere, mere opmærksomhed.' },
    { title: 'Digital nytænkning', desc: 'Moderne værktøjer, fuldt overblik.' },
    { title: 'Personlig rådgivning', desc: 'Én kontaktperson, der kender dit hus.' },
  ];

  return (
    <section ref={ref} className="py-14 md:py-20 bg-background relative">
      <div className="container mx-auto px-5 md:px-10 max-w-[860px]">
        <motion.div {...reveal(isInView)} className="flex items-center gap-4 mb-8">
          <div className="w-6 h-px bg-accent/20" />
          <p className="text-accent/40 font-body text-[10px] font-semibold tracking-[0.3em] uppercase">Vores DNA</p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 md:gap-8">
          {values.map((v, i) => (
            <motion.div key={i} {...reveal(isInView, 0.06 * i)}>
              <h3 className="font-display text-[1.05rem] font-semibold text-primary mb-1.5">{v.title}</h3>
              <p className="text-muted-foreground/65 text-[13.5px] leading-[1.7]">{v.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════
   6. CONTACT + FAQ + CTA — Tight closing sequence
   ═══════════════════════════════════════════════════ */
function ContactCloseSection() {
  const { ref, isInView } = useScrollReveal();

  const faqs = [
    { q: 'Hvem kommer jeg i kontakt med?', a: 'Du taler direkte med Emil eller en af vores rådgivere. Ingen callcentre, ingen ventetid.' },
    { q: 'Er det uforpligtende at tage en snak?', a: 'Ja, altid. En første samtale er helt uforpligtende — vi vil bare gerne høre om dit hus.' },
    { q: 'Kan jeg kontakte jer direkte?', a: 'Ja. Du kan ringe til os i åbningstiden, eller skrive en mail, så vender vi tilbage hurtigt.' },
  ];

  const contacts = [
    { icon: Phone, title: 'Ring til os', detail: '+45 12 34 56 78', href: 'tel:+4512345678' },
    { icon: Mail, title: 'Skriv til os', detail: 'kontakt@sommervibes.dk', href: 'mailto:kontakt@sommervibes.dk' },
    { icon: Clock, title: 'Åbningstider', detail: 'Tirsdag–fredag 10–15' },
  ];

  return (
    <section ref={ref} id="kontakt" className="py-16 md:py-24 bg-card/30 scroll-mt-24 relative">
      <div className="container mx-auto px-5 md:px-10 max-w-[800px]">
        {/* Heading */}
        <motion.div {...reveal(isInView)} className="text-center mb-10">
          <h2 className="font-display text-[1.6rem] md:text-[2rem] font-semibold text-primary mb-3 tracking-[-0.01em]">
            Vi er klar til at <span className="text-accent italic font-normal">hjælpe dig</span>
          </h2>
          <p className="text-muted-foreground/65 max-w-[380px] mx-auto text-[14.5px] leading-[1.7]">
            Du er altid velkommen til en uforpligtende samtale. Vi svarer typisk inden for få timer.
          </p>
        </motion.div>

        {/* Contact cards */}
        <div className="grid md:grid-cols-3 gap-3 mb-10">
          {contacts.map((item, i) => (
            <motion.div
              key={i}
              {...reveal(isInView, 0.06 + i * 0.06)}
              className="bg-card/50 backdrop-blur-sm ring-1 ring-white/[0.03] rounded-xl p-6 text-center hover:ring-accent/8 transition-all duration-400"
            >
              <div className="w-9 h-9 rounded-lg bg-accent/8 flex items-center justify-center mx-auto mb-3">
                <item.icon className="w-4 h-4 text-accent/55" />
              </div>
              <h3 className="font-display font-semibold text-primary text-[13.5px] mb-1.5">{item.title}</h3>
              {item.href ? (
                <a href={item.href} className="text-muted-foreground/60 text-[13px] hover:text-accent/70 transition-colors duration-300">{item.detail}</a>
              ) : (
                <p className="text-muted-foreground/60 text-[13px]">{item.detail}</p>
              )}
            </motion.div>
          ))}
        </div>

        {/* Mini FAQ */}
        <motion.div {...reveal(isInView, 0.3)} className="max-w-[600px] mx-auto mb-14">
          <Accordion type="single" collapsible className="space-y-0">
            {faqs.map((faq, i) => (
              <AccordionItem key={i} value={`faq-${i}`} className="border-border/15">
                <AccordionTrigger className="text-[13.5px] text-primary/80 font-medium py-3.5 hover:no-underline hover:text-primary transition-colors">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground/65 text-[13px] leading-[1.7] pb-3">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>

        {/* Final CTA */}
        <motion.div
          {...reveal(isInView, 0.4)}
          className="text-center pt-8 border-t border-border/15"
        >
          <h3 className="font-display text-[1.4rem] md:text-[1.7rem] font-bold text-primary leading-[1.15] mb-3 tracking-[-0.01em]">
            Lad os tage en uforpligtende snak
            <span className="block text-accent italic font-normal mt-1 text-[0.9em]">om dit sommerhus</span>
          </h3>
          <p className="text-muted-foreground/60 text-[14px] leading-[1.7] mb-8 max-w-[380px] mx-auto">
            Start med et gratis udlejningstjek eller kom direkte i gang.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/kom-i-gang">
              <Button variant="gold" size="lg" className="gap-2.5 group px-8 h-11 text-[13.5px] font-medium shadow-[0_4px_24px_-6px_hsl(var(--accent)/0.3)] hover:shadow-[0_6px_32px_-4px_hsl(var(--accent)/0.4)] transition-shadow duration-500">
                Udlej dit hus <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform duration-300" />
              </Button>
            </Link>
            <Link to="/book-vurdering">
              <Button variant="outline" size="lg" className="border-accent/20 text-accent/80 hover:bg-accent/[0.06] hover:border-accent/30 px-8 h-11 text-[13.5px] font-medium transition-all duration-300">
                Book gratis udlejningstjek
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
      <FounderTrustSection />
      <BrandDNA />
      <ContactCloseSection />
    </PublicLayout>
  );
}
