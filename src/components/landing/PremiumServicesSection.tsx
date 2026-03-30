import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import {
  QrCode,
  Zap,
  Wrench,
  ShieldCheck,
  HeadphonesIcon,
  KeyRound,
  TrendingUp,
  MessageCircle,
  SparklesIcon,
  LayoutDashboard,
  Megaphone,
  Globe,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  X,
  Sparkles,
} from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Link } from 'react-router-dom';

interface Service {
  icon: typeof QrCode;
  title: string;
  short: string;
  long: string;
  signature?: boolean;
  badge?: string;
}

const services: Service[] = [
  {
    icon: Zap,
    title: 'SommerVibes BOOST',
    short: 'Gratis inkluderet i 4 uger ved opstart med ekstra eksponering i udvalgte markeder.',
    long: 'Når din bolig oprettes hos SommerVibes, inkluderer vi 4 ugers gratis BOOST-markedsføring. Her giver vi din bolig ekstra synlighed gennem målrettet eksponering mod relevante gæster i blandt andet Danmark, Tyskland og Holland. BOOST er en særlig SommerVibes-fordel, der er skabt for at give din bolig en stærk start. Efter opstartsperioden kan pakken altid genaktiveres, hvis du ønsker et nyt synlighedsboost.',
    signature: true,
    badge: 'Inkluderet service',
  },
  {
    icon: MessageCircle,
    title: 'Kundedialog 24/7',
    short: 'Vi håndterer dialogen med gæsterne før, under og efter opholdet — hele døgnet.',
    long: 'Hos SommerVibes sørger vi for al kundedialog med gæsterne, så du slipper for den daglige kommunikation. Vi håndterer spørgsmål før booking, praktiske henvendelser op til ankomst, hjælp under opholdet samt opfølgning efter endt leje. Det giver både dig og gæsterne en tryg oplevelse, hvor der altid er adgang til hjælp, vejledning og hurtig respons — 24/7.',
    badge: 'Inkluderet service',
  },
  {
    icon: SparklesIcon,
    title: 'Slutrengøring',
    short: 'Vi sørger for slutrengøring, så dine gæster altid møder en ren og indbydende bolig.',
    long: 'Hos SommerVibes tager vi os af slutrengøringen gennem vores lokale samarbejdspartnere, så gæsterne altid oplever en fyldestgørende rengøring ved ankomst. Det betyder, at boligen fremstår præsentabel, indbydende og klar til næste ophold — uden at du selv skal stå med det praktiske.',
    badge: 'Inkluderet service',
  },
  {
    icon: QrCode,
    title: 'Til-Leje-skilt med QR-kode',
    short: 'Få et unikt SommerVibes-skilt ved boligen med QR-kode direkte til din annonce.',
    long: 'Som en særlig SommerVibes-service tilbyder vi et unikt Til-Leje-skilt med QR-kode, som leder direkte til netop din boligannonce. Det giver ekstra synlighed over for forbipasserende, naboer, turister og potentielle gæster i området. En enkel, men effektiv måde at skabe mere opmærksomhed og flere henvendelser på.',
    signature: true,
    badge: 'Særligt hos SommerVibes',
  },
  {
    icon: Globe,
    title: 'Eksponering på alle store portaler',
    short: 'Vi nøjes ikke med at liste din bolig — vi skaber synlighed omkring den.',
    long: 'Din bolig bliver naturligvis eksponeret på de store udlejningsportaler som Airbnb, Booking.com, Vrbo og andre relevante kanaler. Men hos SommerVibes går vi skridtet videre. Vi markedsfører også aktivt din bolig via SommerVibes.dk, Facebook, Instagram og andre relevante kanaler, så du får mere end bare en placering — du får reel synlighed, stærkere eksponering og bedre muligheder for bookinger.',
    signature: true,
    badge: 'Særligt hos SommerVibes',
  },
  {
    icon: TrendingUp,
    title: 'Unikke muligheder for merindtjening',
    short: 'Tjen mere på de ydelser, mange andre overser.',
    long: 'SommerVibes giver adgang til en række fleksible tilvalg, der kan øge din samlede indtjening. Det kan blandt andet være betaling for sengepakker, el, vand, varme, tidlig check-in, sen check-out og andre relevante tilkøb. Det giver dig mulighed for at skræddersy din udlejning og hente ekstra værdi ud af de detaljer, der ofte gør forskellen på bundlinjen.',
    signature: true,
    badge: 'Særligt hos SommerVibes',
  },
  {
    icon: ShieldCheck,
    title: 'Tryghedsgaranti',
    short: 'Ekstra ro i maven, hvis uheldet er ude.',
    long: 'Skulle en gæst forårsage skade under et ophold, tilbyder vi via vores samarbejdspartner på udlejningsforsikring en løsning med selvrisiko på 3.000 kr. Vi anbefaler samtidig altid, at du også har en relevant udvidet udlejningsforsikring gennem dit eget forsikringsselskab, så du står bedst muligt dækket. Hos SommerVibes er tryghed en vigtig del af samarbejdet.',
    badge: 'Inkluderet service',
  },
  {
    icon: KeyRound,
    title: 'Nøgleservice',
    short: 'Smart adgang for dig, gæster og servicepersonale.',
    long: 'Med vores elektroniske nøgleløsning kan vi sikre nem og fleksibel adgang til boligen for både dig, gæster, rengøring og eventuelle viceværter. Vi håndterer koder og sørger for, at løsningen fungerer i praksis, så adgangen bliver enkel og smidig for alle parter.',
  },
  {
    icon: HeadphonesIcon,
    title: 'Fri rådgiversupport',
    short: 'Direkte adgang til din personlige udlejningsrådgiver.',
    long: 'Hos SommerVibes står du ikke alene. Du har altid mulighed for at kontakte os, hvis du har spørgsmål til udlejning, drift, priser, booking eller optimering af din bolig. Du får tæt sparring og ærlig rådgivning — uden ekstra omkostninger.',
    badge: 'Inkluderet service',
  },
  {
    icon: Wrench,
    title: 'Service & reparation',
    short: 'Fleksibel hjælp, hvis noget opstår under udlejning.',
    long: 'Hvis der opstår en akut situation under en udlejning, kan SommerVibes hjælpe med at rekvirere relevante håndværkere eller fagpersoner på dine vegne. Udgifter faktureres naturligvis direkte til dig, og du vælger selv, om du ønsker at stå for vedligeholdelsen selv eller vil have os til at koordinere hjælpen. Vi har fokus på at skabe maksimal udlejning og sørge for gæsteflow — og samtidig gøre det nemt for dig, når uforudsete ting opstår.',
  },
  {
    icon: LayoutDashboard,
    title: 'Moderne administration',
    short: 'Et enkelt setup med overblik og effektiv drift.',
    long: 'Vi arbejder moderne og effektivt med fokus på synlighed, struktur og høj udnyttelse af din bolig. Du får en løsning, hvor det skal være let at samarbejde, let at følge med og let at skabe resultater. SommerVibes er bygget til husejere, der ønsker høj service uden tung administration.',
  },
  {
    icon: Megaphone,
    title: 'Effektiv markedsføring',
    short: 'Din bolig skal ikke bare online — den skal ses.',
    long: 'Vi arbejder aktivt for at give din bolig stærk eksponering med visuelt flot præsentation, skarp tekst og målrettet markedsføring. Målet er ikke bare at være til stede, men at skabe interesse, klik og bookinger fra de rigtige gæster.',
  },
  {
    icon: SlidersHorizontal,
    title: 'Fuld fleksibilitet',
    short: 'Du bestemmer tempoet.',
    long: 'Hos SommerVibes er samarbejdet fleksibelt. Du bestemmer selv, hvor meget du vil udleje, hvordan din bolig skal drives, og hvilke løsninger du ønsker hjælp til. Vi tilpasser samarbejdet til dig og din bolig — ikke omvendt.',
  },
];

/* ── Mobile bottom sheet ── */
function DetailSheet({ service, onClose }: { service: Service; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 flex items-end justify-center"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" />
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ duration: 0.38, ease: [0.32, 0.72, 0, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg rounded-t-2xl bg-card border-t border-border p-6 pb-10 max-h-[85vh] overflow-y-auto"
      >
        <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-border" />
        <button
          onClick={onClose}
          className="absolute right-5 top-5 w-8 h-8 rounded-full bg-secondary flex items-center justify-center hover:bg-muted transition-colors"
        >
          <X className="w-4 h-4 text-foreground" strokeWidth={1.5} />
        </button>

        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-5 ${
          service.signature ? 'bg-accent/20 border border-accent/30' : 'bg-secondary'
        }`}>
          <service.icon className="w-5 h-5 text-primary" strokeWidth={1.5} />
        </div>

        {service.badge && (
          <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold tracking-[0.2em] uppercase text-primary/80 mb-3">
            <Sparkles className="w-2.5 h-2.5" strokeWidth={1.5} />
            {service.badge}
          </span>
        )}

        <h3 className="font-display text-xl font-bold text-foreground mb-4 leading-snug">
          {service.title}
        </h3>
        <p className="text-sm leading-[1.8] text-muted-foreground">
          {service.long}
        </p>
      </motion.div>
    </motion.div>
  );
}

/* ── Card ── */
function ServiceCard({
  service,
  isExpanded,
  onToggle,
}: {
  service: Service;
  isExpanded: boolean;
  onToggle: () => void;
  index: number;
}) {
  const Icon = service.icon;

  return (
    <motion.div
      layout="position"
      className={`group rounded-2xl p-7 md:p-8 flex flex-col gap-4 h-full select-none transition-all duration-500 border ${
        service.signature
          ? 'bg-card border-accent/20 shadow-[0_2px_16px_-4px_hsla(38,50%,42%,0.08)]'
          : 'bg-card border-border/60'
      } hover:shadow-elevated/10 hover:border-border`}
    >
      {/* Badge */}
      {service.badge && (
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold tracking-[0.2em] uppercase text-primary/70">
          <Sparkles className="w-2.5 h-2.5" strokeWidth={1.5} />
          {service.badge}
        </span>
      )}

      {/* Icon */}
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors duration-300 ${
        service.signature
          ? 'bg-primary/10 border border-primary/15'
          : 'bg-secondary group-hover:bg-muted'
      }`}>
        <Icon className="w-[18px] h-[18px] text-primary" strokeWidth={1.4} />
      </div>

      {/* Title */}
      <h3 className="font-display text-[1.05rem] font-semibold text-foreground leading-snug mt-1">
        {service.title}
      </h3>

      {/* Short text */}
      <p className="text-[13.5px] leading-[1.7] text-muted-foreground flex-1">
        {service.short}
      </p>

      {/* Expand content */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.25, 0.8, 0.25, 1] }}
            className="overflow-hidden"
          >
            <div className="pt-4 mt-1 border-t border-border/50">
              <p className="text-[13.5px] leading-[1.85] text-muted-foreground/80">
                {service.long}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle */}
      <button
        onClick={onToggle}
        className="inline-flex items-center gap-1.5 text-[13px] font-medium text-primary hover:text-accent transition-colors duration-200 self-start mt-auto pt-1"
      >
        <span>{isExpanded ? 'Luk' : 'Læs mere'}</span>
        <ArrowRight
          className={`w-3 h-3 transition-transform duration-300 ${isExpanded ? 'rotate-90' : ''}`}
          strokeWidth={2}
        />
      </button>
    </motion.div>
  );
}

/* ── Section ── */
export function PremiumServicesSection() {
  const { ref, isInView } = useScrollReveal();
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [sheetService, setSheetService] = useState<Service | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  const scroll = useCallback((dir: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const card = scrollRef.current.querySelector<HTMLElement>(':scope > div');
    const cardWidth = card?.offsetWidth ?? 370;
    scrollRef.current.scrollBy({
      left: dir === 'left' ? -(cardWidth + 24) : cardWidth + 24,
      behavior: 'smooth',
    });
  }, []);

  const handleToggle = (i: number, service: Service) => {
    if (isMobile) {
      setSheetService(service);
    } else {
      setExpandedIndex((prev) => (prev === i ? null : i));
    }
  };

  return (
    <section ref={ref} className="py-24 md:py-32 overflow-hidden bg-muted/30">
      <div className="container mx-auto px-4 md:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-2xl mb-16 md:mb-20"
        >
          <span className="text-primary font-body text-[11px] font-semibold tracking-[0.3em] uppercase block mb-4">
            SommerVibes Fordele
          </span>
          <h2 className="font-display text-3xl md:text-4xl lg:text-[2.75rem] font-bold text-foreground leading-[1.12] mb-6">
            Ekstraordinær service{' '}
            <span className="text-primary italic font-normal">hos SommerVibes</span>
          </h2>
          <p className="text-[15px] md:text-base leading-[1.75] text-muted-foreground max-w-lg">
            Vi gør mere end bare at udleje dit sommerhus. Hos SommerVibes får du eksponering, fleksibilitet og services, der er skabt til at øge både tryghed og indtjening.
          </p>
        </motion.div>

        {/* Carousel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
          className="relative"
        >
          {!isMobile && (
            <>
              <button
                onClick={() => scroll('left')}
                className="absolute -left-5 top-[45%] -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-card border border-border shadow-soft flex items-center justify-center hover:bg-secondary transition-all duration-200"
                aria-label="Forrige"
              >
                <ChevronLeft className="w-4 h-4 text-foreground/60" strokeWidth={1.5} />
              </button>
              <button
                onClick={() => scroll('right')}
                className="absolute -right-5 top-[45%] -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-card border border-border shadow-soft flex items-center justify-center hover:bg-secondary transition-all duration-200"
                aria-label="Næste"
              >
                <ChevronRight className="w-4 h-4 text-foreground/60" strokeWidth={1.5} />
              </button>
            </>
          )}

          <div
            ref={scrollRef}
            className="flex gap-6 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-4 -mb-4"
          >
            {services.map((s, i) => (
              <div key={i} className="snap-start flex-shrink-0 w-[82vw] sm:w-[320px] md:w-[340px] lg:w-[370px]">
                <ServiceCard
                  service={s}
                  isExpanded={expandedIndex === i}
                  onToggle={() => handleToggle(i, s)}
                  index={i}
                />
              </div>
            ))}
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="mt-16 md:mt-20 text-center"
        >
          <Link to="/contact" className="btn-gold inline-flex items-center gap-2.5 px-8 py-4 rounded-xl text-sm">
            Bliv kontaktet i dag
            <ArrowRight className="w-3.5 h-3.5" strokeWidth={2} />
          </Link>
        </motion.div>
      </div>

      <AnimatePresence>
        {sheetService && <DetailSheet service={sheetService} onClose={() => setSheetService(null)} />}
      </AnimatePresence>
    </section>
  );
}
