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
    icon: QrCode,
    title: 'Til-Leje-skilt med QR-kode',
    short: 'Få et unikt SommerVibes-skilt ved boligen med QR-kode direkte til din annonce.',
    long: 'Som en særlig SommerVibes-service tilbyder vi et unikt Til-Leje-skilt med QR-kode, som leder direkte til netop din boligannonce. Det giver ekstra synlighed over for forbipasserende, naboer, turister og potentielle gæster i området. En enkel, men effektiv måde at skabe mere opmærksomhed og flere henvendelser på.',
    signature: true,
    badge: 'Særligt hos SommerVibes',
  },
  {
    icon: Zap,
    title: 'SommerVibes BOOST',
    short: 'Gratis inkluderet i 4 uger ved opstart med ekstra eksponering i udvalgte markeder.',
    long: 'Når din bolig oprettes hos SommerVibes, inkluderer vi 4 ugers gratis BOOST-markedsføring. Her giver vi din bolig ekstra synlighed gennem målrettet eksponering mod relevante gæster i blandt andet Danmark, Tyskland og Holland. BOOST er en særlig SommerVibes-fordel, der er skabt for at give din bolig en stærk start. Efter opstartsperioden kan pakken altid genaktiveres, hvis du ønsker et nyt synlighedsboost.',
    signature: true,
    badge: 'Inkluderet service',
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
    icon: Megaphone,
    title: 'Effektiv markedsføring',
    short: 'Din bolig skal ikke bare online — den skal ses.',
    long: 'Vi arbejder aktivt for at give din bolig stærk eksponering med visuelt flot præsentation, skarp tekst og målrettet markedsføring. Målet er ikke bare at være til stede, men at skabe interesse, klik og bookinger fra de rigtige gæster.',
  },
  {
    icon: ShieldCheck,
    title: 'Tryghedsgaranti',
    short: 'Ekstra ro i maven, hvis uheldet er ude.',
    long: 'Skulle en gæst forårsage skade under et ophold, tilbyder vi via vores samarbejdspartner på udlejningsforsikring en løsning med selvrisiko på 3.000 kr. Vi anbefaler samtidig altid, at du også har en relevant udvidet udlejningsforsikring gennem dit eget forsikringsselskab, så du står bedst muligt dækket. Hos SommerVibes er tryghed en vigtig del af samarbejdet.',
    badge: 'Inkluderet service',
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
    icon: KeyRound,
    title: 'Nøgleservice',
    short: 'Smart adgang for dig, gæster og servicepersonale.',
    long: 'Med vores elektroniske nøgleløsning kan vi sikre nem og fleksibel adgang til boligen for både dig, gæster, rengøring og eventuelle viceværter. Vi håndterer koder og sørger for, at løsningen fungerer i praksis, så adgangen bliver enkel og smidig for alle parter.',
  },
  {
    icon: LayoutDashboard,
    title: 'Moderne administration',
    short: 'Et enkelt setup med overblik og effektiv drift.',
    long: 'Vi arbejder moderne og effektivt med fokus på synlighed, struktur og høj udnyttelse af din bolig. Du får en løsning, hvor det skal være let at samarbejde, let at følge med og let at skabe resultater. SommerVibes er bygget til husejere, der ønsker høj service uden tung administration.',
  },
  {
    icon: SlidersHorizontal,
    title: 'Fuld fleksibilitet',
    short: 'Du bestemmer tempoet.',
    long: 'Hos SommerVibes er samarbejdet fleksibelt. Du bestemmer selv, hvor meget du vil udleje, hvordan din bolig skal drives, og hvilke løsninger du ønsker hjælp til. Vi tilpasser samarbejdet til dig og din bolig — ikke omvendt.',
  },
];

/* ── Mobile detail sheet ── */
function DetailSheet({
  service,
  onClose,
}: {
  service: Service;
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 flex items-end justify-center"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />

      {/* Sheet */}
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ duration: 0.38, ease: [0.32, 0.72, 0, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg rounded-t-3xl bg-[hsl(40,28%,96%)] p-6 pb-10 max-h-[85vh] overflow-y-auto"
      >
        {/* Handle */}
        <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-[hsl(35,15%,80%)]" />

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute right-5 top-5 w-8 h-8 rounded-full bg-[hsl(35,20%,90%)] flex items-center justify-center"
        >
          <X className="w-4 h-4 text-[hsl(var(--warm-foreground))]" strokeWidth={1.5} />
        </button>

        {/* Icon */}
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-5 ${
          service.signature
            ? 'bg-gradient-to-br from-[hsl(38,45%,88%)] to-[hsl(38,35%,80%)]'
            : 'bg-[hsl(35,22%,90%)]'
        }`}>
          <service.icon className="w-5 h-5 text-[hsl(var(--gold-dark))]" strokeWidth={1.5} />
        </div>

        {service.badge && (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold tracking-[0.15em] uppercase text-[hsl(var(--gold-dark))] mb-3">
            <Sparkles className="w-3 h-3" strokeWidth={1.5} />
            {service.badge}
          </span>
        )}

        <h3 className="font-display text-xl font-bold text-[hsl(var(--warm-foreground))] mb-4 leading-snug">
          {service.title}
        </h3>

        <p className="text-sm leading-[1.75] text-[hsl(var(--warm-foreground))]/75">
          {service.long}
        </p>
      </motion.div>
    </motion.div>
  );
}

/* ── Desktop card ── */
function ServiceCard({
  service,
  isExpanded,
  onToggle,
  index,
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
      className={`group rounded-[1.25rem] p-7 md:p-8 flex flex-col gap-4 h-full select-none transition-all duration-500 ${
        service.signature
          ? 'bg-gradient-to-b from-[hsl(40,30%,97%)] to-[hsl(38,28%,94%)] border border-[hsl(38,30%,82%)] shadow-[0_2px_20px_-4px_hsla(38,40%,50%,0.1)]'
          : 'bg-[hsl(40,28%,97%)] border border-[hsl(35,18%,89%)]'
      } hover:shadow-[0_12px_40px_-12px_hsla(35,30%,40%,0.12)] hover:border-[hsl(35,22%,82%)]`}
    >
      {/* Badge */}
      {service.badge && (
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold tracking-[0.18em] uppercase text-[hsl(var(--gold-dark))]/80 mb-0">
          <Sparkles className="w-2.5 h-2.5" strokeWidth={1.5} />
          {service.badge}
        </span>
      )}

      {/* Icon */}
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors duration-300 ${
        service.signature
          ? 'bg-gradient-to-br from-[hsl(38,40%,87%)] to-[hsl(38,32%,80%)]'
          : 'bg-[hsl(35,20%,91%)] group-hover:bg-[hsl(35,22%,88%)]'
      }`}>
        <Icon className="w-[18px] h-[18px] text-[hsl(var(--gold-dark))]" strokeWidth={1.4} />
      </div>

      {/* Title */}
      <h3 className="font-display text-[1.05rem] font-semibold text-[hsl(var(--warm-foreground))] leading-snug mt-1">
        {service.title}
      </h3>

      {/* Short description */}
      <p className="text-[13.5px] leading-[1.7] text-[hsl(var(--warm-foreground))]/65 flex-1">
        {service.short}
      </p>

      {/* Expanded content — desktop inline */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.25, 0.8, 0.25, 1] }}
            className="overflow-hidden"
          >
            <div className="pt-4 mt-1 border-t border-[hsl(35,18%,87%)]">
              <p className="text-[13.5px] leading-[1.8] text-[hsl(var(--warm-foreground))]/60">
                {service.long}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Read more toggle */}
      <button
        onClick={onToggle}
        className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[hsl(var(--gold-dark))] hover:text-[hsl(var(--gold))] transition-colors duration-200 self-start mt-auto pt-1"
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

/* ── Main section ── */
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
    const gap = 24;
    scrollRef.current.scrollBy({
      left: dir === 'left' ? -(cardWidth + gap) : cardWidth + gap,
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
    <section
      ref={ref}
      className="py-24 md:py-32 overflow-hidden relative"
      style={{ background: 'linear-gradient(180deg, hsl(37, 26%, 92%) 0%, hsl(38, 22%, 90%) 100%)' }}
    >
      {/* Subtle grain texture via CSS */}
      <div
        className="absolute inset-0 opacity-[0.025] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
      />

      <div className="container mx-auto px-4 md:px-8 relative">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-2xl mb-16 md:mb-20"
        >
          <span className="text-[11px] font-body font-semibold tracking-[0.3em] uppercase text-[hsl(var(--gold-dark))]/80 block mb-5">
            SommerVibes Fordele
          </span>
          <h2 className="font-display text-[1.75rem] sm:text-[2rem] md:text-[2.5rem] lg:text-[2.85rem] font-bold text-[hsl(var(--warm-foreground))] leading-[1.12] mb-6">
            Ekstraordinær service{' '}
            <span className="italic font-normal text-[hsl(var(--gold-dark))]">
              hos SommerVibes
            </span>
          </h2>
          <p className="text-[15px] md:text-base leading-[1.75] text-[hsl(var(--warm-foreground))]/65 max-w-lg">
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
          {/* Desktop arrows */}
          {!isMobile && (
            <>
              <button
                onClick={() => scroll('left')}
                className="absolute -left-5 top-[45%] -translate-y-1/2 z-10 w-11 h-11 rounded-full bg-[hsl(40,28%,96%)] border border-[hsl(35,18%,84%)] shadow-[0_2px_12px_-2px_hsla(35,20%,40%,0.1)] flex items-center justify-center hover:bg-white hover:border-[hsl(35,22%,78%)] transition-all duration-200"
                aria-label="Forrige"
              >
                <ChevronLeft className="w-4 h-4 text-[hsl(var(--warm-foreground))]/70" strokeWidth={1.5} />
              </button>
              <button
                onClick={() => scroll('right')}
                className="absolute -right-5 top-[45%] -translate-y-1/2 z-10 w-11 h-11 rounded-full bg-[hsl(40,28%,96%)] border border-[hsl(35,18%,84%)] shadow-[0_2px_12px_-2px_hsla(35,20%,40%,0.1)] flex items-center justify-center hover:bg-white hover:border-[hsl(35,22%,78%)] transition-all duration-200"
                aria-label="Næste"
              >
                <ChevronRight className="w-4 h-4 text-[hsl(var(--warm-foreground))]/70" strokeWidth={1.5} />
              </button>
            </>
          )}

          {/* Cards track */}
          <div
            ref={scrollRef}
            className="flex gap-6 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-4 -mb-4"
          >
            {services.map((s, i) => (
              <div
                key={i}
                className="snap-start flex-shrink-0 w-[82vw] sm:w-[320px] md:w-[340px] lg:w-[370px]"
              >
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
          <Link
            to="/contact"
            className="inline-flex items-center gap-2.5 px-9 py-4 rounded-xl font-body text-[13px] font-semibold tracking-[0.04em] transition-all duration-300 bg-[hsl(var(--gold-dark))] text-[hsl(40,40%,97%)] hover:bg-[hsl(var(--gold))] shadow-[0_4px_24px_-6px_hsla(38,50%,35%,0.3)] hover:shadow-[0_8px_36px_-6px_hsla(38,50%,35%,0.4)]"
          >
            Bliv kontaktet i dag
            <ArrowRight className="w-3.5 h-3.5" strokeWidth={2} />
          </Link>
        </motion.div>
      </div>

      {/* Mobile bottom sheet */}
      <AnimatePresence>
        {sheetService && (
          <DetailSheet
            service={sheetService}
            onClose={() => setSheetService(null)}
          />
        )}
      </AnimatePresence>
    </section>
  );
}
