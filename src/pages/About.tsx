import { PublicLayout } from '@/components/layout/PublicLayout';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { ArrowRight, Check, Phone, Mail, Clock, RotateCcw, Crown, Sparkles, UserCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { useRef, useState } from 'react';
import emilHeadshot from '@/assets/emil-headshot.jpg';
import kvieSoeDrone from '@/assets/kvie-soe-drone.jpg';
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
   1. HERO — Brand-led with cinematic background video + Emil cutout
   ═══════════════════════════════════════════════════ */
function HeroSection() {
  const [videoLoaded, setVideoLoaded] = useState(false);

  return (
    <section className="relative min-h-[88vh] flex items-center overflow-hidden">
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background/95 to-primary/10" />
        <video
          autoPlay loop muted playsInline
          onLoadedData={() => setVideoLoaded(true)}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${videoLoaded ? 'opacity-100' : 'opacity-0'}`}
        >
          <source src="/videos/hero.mp4" type="video/mp4" />
        </video>
        {videoLoaded && (
          <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/50 to-background/85" />
        )}
      </div>

      <div className="relative z-10 container mx-auto px-5 md:px-10 py-32 md:py-0 w-full">
        <div className="max-w-[1140px] mx-auto">
          <div className="flex items-center gap-2 sm:gap-6 md:gap-10 lg:gap-16">
            <div className="flex-1 min-w-0 max-w-[620px]">
              <motion.span {...fade(0.05)} className="inline-block text-accent/50 font-body text-[10px] font-semibold tracking-[0.4em] uppercase mb-5">
                Om SommerVibes
              </motion.span>
              <motion.h1 {...fade(0.15)} className="font-display text-[2rem] sm:text-[2.6rem] md:text-[3.2rem] lg:text-[3.8rem] font-bold leading-[1.05] tracking-[-0.02em] mb-6">
                Vi bygger fremtidens
                <br />
                <span className="text-accent italic font-normal">sommerhusbureau</span>
              </motion.h1>
              <motion.p {...fade(0.3)} className="text-[15px] md:text-[16px] text-muted-foreground/85 leading-[1.8] mb-9 max-w-[480px]">
                SommerVibes er et moderne, grundlægger-drevet bureau — mere personligt end de store, mere digitalt, mere gennemsigtigt. Bygget for husejere, der fortjener en bedre oplevelse.
              </motion.p>
              <motion.div {...fade(0.45)} className="flex flex-col sm:flex-row gap-3">
                <Link to="/kom-i-gang">
                  <Button variant="gold" size="lg" className="gap-2.5 group px-8 h-12 text-[13.5px] font-medium shadow-[0_4px_24px_-6px_hsl(var(--accent)/0.3)] hover:shadow-[0_6px_32px_-4px_hsl(var(--accent)/0.4)] transition-shadow duration-500">
                    Udlej dit hus <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform duration-300" />
                  </Button>
                </Link>
                <Link to="/book-vurdering">
                  <Button variant="outline" size="lg" className="border-accent/20 text-accent/80 hover:bg-accent/[0.05] hover:border-accent/30 px-8 h-12 text-[13.5px] font-medium transition-all duration-300">
                    Book gratis udlejningstjek
                  </Button>
                </Link>
              </motion.div>
            </div>

            {/* Advisor cutout — identisk med landing hero */}
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1, delay: 0.8 }}
              className="relative flex-shrink-0 w-[38vw] sm:w-[34vw] md:w-[32vw] lg:w-[38vw] xl:w-[36vw] max-w-[520px] self-end -mr-6 sm:-mr-8 md:-mr-10 lg:-mr-16">
              <div className="absolute top-[15%] left-1/2 -translate-x-1/2 w-[80%] h-[55%] rounded-full blur-[80px] sm:blur-[100px] animate-hero-shimmer" />
              <div className="absolute top-[25%] left-1/2 -translate-x-1/2 w-[50%] h-[40%] bg-accent/8 rounded-full blur-[50px] animate-hero-shimmer-slow" />
              <div className="relative" style={{
                maskImage: 'linear-gradient(to bottom, black 65%, transparent 95%), linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)',
                WebkitMaskImage: 'linear-gradient(to bottom, black 65%, transparent 95%), linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)',
                maskComposite: 'intersect', WebkitMaskComposite: 'destination-in',
              } as React.CSSProperties}>
                <img src="/images/advisor-cutout.png" alt="Emil W. Klockmann — Udlejningschef"
                  className="w-full h-auto object-contain drop-shadow-[0_10px_30px_rgba(0,0,0,0.5)]"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              </div>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 1.4 }}
                className="hidden sm:block absolute bottom-[12%] left-1/2 -translate-x-1/2 mr-6 sm:mr-8 md:mr-10 lg:mr-16 w-[90%] max-w-[240px]">
                <div className="bg-background/90 backdrop-blur-xl rounded-2xl px-4 py-2.5 border border-accent/15 shadow-elevated text-center">
                  <p className="font-display font-bold text-foreground text-xs sm:text-sm">Emil W. Klockmann</p>
                  <p className="text-accent text-[10px] sm:text-xs font-semibold">Udlejningschef</p>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════
   2. FOUNDER VIDEO — Soft storytelling + always-visible replay
   ═══════════════════════════════════════════════════ */
function FounderVideoSection() {
  const { ref, isInView } = useScrollReveal();
  const videoRef = useRef<HTMLVideoElement>(null);

  const replay = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play();
    }
  };

  return (
    <section ref={ref} className="py-16 md:py-24 bg-background relative">
      <div className="container mx-auto px-5 md:px-10">
        <div className="max-w-[820px] mx-auto">
          {/* Header */}
          <motion.div {...reveal(isInView)} className="text-center mb-8">
            <span className="text-accent/45 font-body text-[10px] font-semibold tracking-[0.4em] uppercase block mb-4">Vores historie</span>
            <h2 className="font-display text-[1.6rem] md:text-[2rem] font-semibold text-primary leading-[1.1] tracking-[-0.01em]">
              Folkene bag
              <span className="text-accent italic font-normal ml-2">SommerVibes</span>
            </h2>
          </motion.div>

          {/* Video — centered */}
          <motion.div {...reveal(isInView, 0.1)}>
            <div className="relative rounded-[1.25rem] overflow-hidden bg-card/60 ring-1 ring-white/[0.04] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.5)]">
              <video
                ref={videoRef}
                src="/videos/ewk-intro.mp4"
                autoPlay
                muted
                playsInline
                preload="auto"
                className="w-full aspect-video object-cover object-top"
              />
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: 1 }}
                onClick={replay}
                className="absolute bottom-4 right-4 w-11 h-11 rounded-full bg-card/80 backdrop-blur-md ring-1 ring-white/[0.08] flex items-center justify-center cursor-pointer hover:scale-105 hover:ring-accent/20 transition-all duration-300 z-10"
                title="Se igen"
              >
                <RotateCcw className="w-4 h-4 text-accent/70" />
              </motion.button>
            </div>
          </motion.div>

          {/* Text below video */}
          <motion.div {...reveal(isInView, 0.2)} className="mt-8 max-w-[580px] mx-auto text-center">
            <p className="text-muted-foreground/80 leading-[1.8] mb-5 text-[14.5px]">
              Vi startede SommerVibes, fordi vi selv oplevede det som mange husejere gør — et bureau, der føltes distanceret, ugennemsigtigt og upersonligt. Så vi byggede det bureau, vi selv savnede.
            </p>
            <div className="inline-block border-l-[1.5px] border-accent/20 pl-5 py-1 text-left">
              <p className="text-primary/70 font-display text-[0.95rem] italic leading-[1.7]">
                "Vi ville skabe det bureau, vi selv savnede som husejere."
              </p>
              <p className="text-accent/40 text-[10px] mt-2 font-medium tracking-[0.15em] uppercase">Emil W. Klockmann, Grundlægger</p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════
   2b. FOUNDER FACTS — Portrait + credentials
   ═══════════════════════════════════════════════════ */
function FounderFactsSection() {
  const { ref, isInView } = useScrollReveal();
  return (
    <section ref={ref} className="py-16 md:py-24 bg-card/30 relative">
      <div className="container mx-auto px-5 md:px-10">
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-14 items-center max-w-[1060px] mx-auto">
          <motion.div {...reveal(isInView)} className="lg:col-span-5 flex justify-center">
            <div className="rounded-[1.25rem] overflow-hidden shadow-[0_20px_60px_-15px_rgba(0,0,0,0.35)] ring-1 ring-white/[0.03] max-w-[320px]">
              <img src={emilHeadshot} alt="Emil Weng Klockmann" className="w-full aspect-[4/5] object-cover object-top" loading="lazy" />
            </div>
          </motion.div>

          <motion.div {...reveal(isInView, 0.12)} className="lg:col-span-7">
            <span className="text-accent/45 font-body text-[10px] font-semibold tracking-[0.4em] uppercase block mb-4">Vores grundlægger</span>
            <h2 className="font-display text-[1.6rem] md:text-[2rem] font-semibold text-primary leading-[1.1] tracking-[-0.01em] mb-1.5">
              Emil Weng Klockmann
            </h2>
            <p className="text-accent/55 text-[13px] font-medium tracking-wide mb-6">Grundlægger & Udlejningschef</p>

            <p className="text-muted-foreground/80 leading-[1.8] mb-7 text-[14.5px]">
              Uddannet ejendomsmægler og selv sommerhus-ejer. Vi grundlagde SommerVibes med én ambition: at give husejere en bedre, mere personlig og mere gennemsigtig oplevelse.
            </p>

            <div className="space-y-2.5 mb-8">
              {['Uddannet ejendomsmægler', 'Selv sommerhus-ejer', 'Personlig rådgiver fra dag ét', 'Digital og moderne tilgang'].map((point, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <div className="w-[16px] h-[16px] rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                    <Check className="w-[9px] h-[9px] text-accent/60" />
                  </div>
                  <span className="text-muted-foreground/70 text-[13px]">{point}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-2.5">
              <a href="tel:+4512345678">
                <Button variant="outline" size="sm" className="gap-2 text-[12.5px] border-border/30 hover:border-accent/20 hover:bg-accent/[0.04] transition-all duration-300">
                  <Phone className="w-3.5 h-3.5 text-accent/55" /> Ring til os
                </Button>
              </a>
              <a href="mailto:emil@sommervibes.dk">
                <Button variant="outline" size="sm" className="gap-2 text-[12.5px] border-border/30 hover:border-accent/20 hover:bg-accent/[0.04] transition-all duration-300">
                  <Mail className="w-3.5 h-3.5 text-accent/55" /> Skriv til os
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
   3. STORY — Positive brand storytelling
   ═══════════════════════════════════════════════════ */
function StorySection() {
  const { ref, isInView } = useScrollReveal();
  return (
    <section ref={ref} className="py-16 md:py-24 bg-background relative">
      <div className="container mx-auto px-5 md:px-10">
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-16 items-center max-w-[1060px] mx-auto">
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 1, ease: "easeOut" }}
            className="lg:col-span-5 relative"
          >
            <div className="rounded-[1.25rem] overflow-hidden shadow-[0_20px_60px_-15px_rgba(0,0,0,0.35)] ring-1 ring-white/[0.03]">
              <img src={kvieSoeDrone} alt="Sommerhusområde ved Kvie Sø set fra drone" className="w-full aspect-[4/5] object-cover" loading="lazy" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 1, delay: 0.1, ease: "easeOut" }}
            className="lg:col-span-7"
          >
            <span className="text-accent/45 font-body text-[10px] font-semibold tracking-[0.4em] uppercase block mb-5">Vores tilgang</span>
            <h2 className="font-display text-[1.7rem] md:text-[2.2rem] font-semibold text-primary leading-[1.1] tracking-[-0.01em] mb-8">
              Vi gør udlejning
              <span className="block text-accent italic font-normal mt-1">enklere og bedre</span>
            </h2>

            <div className="space-y-5 mb-8">
              <p className="text-muted-foreground/80 leading-[1.8] text-[15px]">
                Vi tror på, at sommerhusudlejning bør være enkel, gennemsigtig og personlig. At du som husejer fortjener fuldt overblik, en fast kontaktperson og en oplevelse, der matcher dit hus.
              </p>
              <p className="text-muted-foreground/80 leading-[1.8] text-[15px]">
                <strong className="text-primary/85 font-medium">Derfor byggede vi SommerVibes</strong> — et moderne bureau, der kombinerer digital nytænkning med ordentlig, personlig service og en fair aftale.
              </p>
            </div>

            <div className="border-l-[1.5px] border-accent/20 pl-6 py-1 mb-8">
              <p className="text-primary/75 font-display text-[1.05rem] md:text-[1.15rem] italic leading-[1.7]">
                "Vores ambition er at være det bedste bureau for de ejere, vi samarbejder med — ikke det største."
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
   4. BRAND DNA
   ═══════════════════════════════════════════════════ */
function BrandDNA() {
  const { ref, isInView } = useScrollReveal();
  const values = [
    { title: 'Kvalitet over kvantitet', desc: 'Færre ejere, mere opmærksomhed.', icon: Crown },
    { title: 'Digital nytænkning', desc: 'Moderne værktøjer, fuldt overblik.', icon: Sparkles },
    { title: 'Personlig rådgivning', desc: 'Én kontaktperson, der kender dit hus.', icon: UserCheck },
  ];

  return (
    <section ref={ref} className="py-14 md:py-20 bg-card/30 relative">
      <div className="container mx-auto px-5 md:px-10 max-w-[860px]">
        <motion.div {...reveal(isInView)} className="flex items-center gap-4 mb-8">
          <div className="w-6 h-px bg-accent/20" />
          <p className="text-accent/40 font-body text-[10px] font-semibold tracking-[0.3em] uppercase">Vores DNA</p>
        </motion.div>
        <div className="grid md:grid-cols-3 gap-6 md:gap-8">
          {values.map((v, i) => (
            <motion.div key={i} {...reveal(isInView, 0.1 * i)} className="group">
              <motion.div
                className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center mb-4 ring-1 ring-accent/10"
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <v.icon className="w-5 h-5 text-accent" strokeWidth={1.5} />
              </motion.div>
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
   5. CONTACT + FAQ + CTA
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
    { icon: Clock, title: 'Åbningstider', detail: 'Tlf. man–tor 10–16 · Chat hverdage 10–22, weekend 10–16' },
  ];

  return (
    <section ref={ref} id="kontakt" className="py-16 md:py-24 bg-background scroll-mt-24 relative">
      <div className="container mx-auto px-5 md:px-10 max-w-[800px]">
        <motion.div {...reveal(isInView)} className="text-center mb-10">
          <h2 className="font-display text-[1.6rem] md:text-[2rem] font-semibold text-primary mb-3 tracking-[-0.01em]">
            Vi er klar til at <span className="text-accent italic font-normal">hjælpe dig</span>
          </h2>
          <p className="text-muted-foreground/65 max-w-[380px] mx-auto text-[14.5px] leading-[1.7]">
            Du er altid velkommen til en uforpligtende samtale. Vi svarer typisk inden for få timer.
          </p>
        </motion.div>

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
      <FounderVideoSection />
      <FounderFactsSection />
      <StorySection />
      <BrandDNA />
      <ContactCloseSection />
    </PublicLayout>
  );
}
