import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import {
  QrCode,
  Rocket,
  Wrench,
  ShieldCheck,
  HeadphonesIcon,
  KeyRound,
  TrendingUp,
  Globe,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
} from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Link } from 'react-router-dom';

const services = [
  {
    icon: QrCode,
    title: 'Til-Leje-skilt med QR-kode',
    short: 'Få et unikt SommerVibes-skilt ved boligen med QR-kode direkte til din annonce.',
    long: 'Som en særlig SommerVibes-service tilbyder vi et unikt Til-Leje-skilt med QR-kode, der leder direkte til netop din boligannonce. Det giver ekstra synlighed over for forbipasserende, naboer, turister og potentielle gæster i området og skaber mere lokal eksponering omkring din bolig.',
  },
  {
    icon: Rocket,
    title: 'Gratis BOOST i 4 uger',
    short: 'Vi giver din bolig ekstra eksponering i opstartsfasen mod gæster i bl.a. Danmark, Tyskland og Holland.',
    long: 'Når din bolig oprettes hos SommerVibes, inkluderer vi 4 ugers gratis BOOST-markedsføring. Her giver vi din bolig ekstra synlighed gennem målrettet eksponering mod relevante gæster i blandt andet Danmark, Tyskland og Holland. BOOST kan senere genaktiveres, hvis du ønsker en ny synlighedsindsats.',
  },
  {
    icon: Wrench,
    title: 'Service & reparation',
    short: 'Vi kan hjælpe med at rekvirere håndværkere og fagpersoner, hvis noget opstår under udlejning.',
    long: 'Hvis der opstår en akut situation under en udlejning, kan SommerVibes hjælpe med at rekvirere relevante håndværkere eller fagpersoner på dine vegne. Udgifter faktureres direkte til dig, og du vælger selv, om du ønsker at stå for vedligeholdelsen selv eller vil have os til at koordinere hjælpen.',
  },
  {
    icon: ShieldCheck,
    title: 'Tryghedsgaranti',
    short: 'Ved skader under ophold tilbyder vi en løsning via vores forsikringspartner med 3.000 kr. i selvrisiko.',
    long: 'Skulle en gæst forårsage skade under et ophold, tilbyder vi via vores samarbejdspartner på udlejningsforsikring en løsning med selvrisiko på 3.000 kr. Vi anbefaler samtidig, at du også har en udvidet udlejningsforsikring gennem dit eget forsikringsselskab for den bedst mulige dækning.',
  },
  {
    icon: HeadphonesIcon,
    title: 'Fri rådgiversupport',
    short: 'Du har altid direkte adgang til din personlige udlejningsrådgiver hos SommerVibes.',
    long: 'Hos SommerVibes står du ikke alene. Du kan altid kontakte os, hvis du har spørgsmål til udlejning, drift, priser, booking eller optimering af din bolig. Du får tæt sparring og ærlig rådgivning som en naturlig del af samarbejdet.',
  },
  {
    icon: KeyRound,
    title: 'Elektronisk nøgleservice',
    short: 'Nem adgang for gæster, rengøring, vicevært og ejere med smart nøgleløsning.',
    long: 'Med vores elektroniske nøgleløsning kan vi sikre nem og fleksibel adgang til boligen for både gæster, rengøring, viceværter og ejere. Vi håndterer koder og hjælper med, at løsningen fungerer enkelt og smidigt i praksis.',
  },
  {
    icon: TrendingUp,
    title: 'Mere merindtjening',
    short: 'Tjen ekstra på bl.a. sengepakker, forbrug, tidlig check-in og sen check-out.',
    long: 'SommerVibes giver adgang til fleksible tilvalg, der kan øge din samlede indtjening. Det kan blandt andet være betaling for sengepakker, el, vand, varme, tidlig check-in, sen check-out og andre relevante tilkøb. Det giver dig mulighed for at hente mere værdi ud af din udlejning.',
  },
  {
    icon: Globe,
    title: 'Eksponering på alle store portaler',
    short: 'Din bolig bliver vist på Airbnb, Booking.com, Vrbo m.fl. — og markedsført aktivt via SommerVibes.dk og sociale medier.',
    long: 'Vi nøjes ikke med at liste din bolig — vi arbejder aktivt for at skabe synlighed omkring den. Din bolig bliver naturligvis eksponeret på de store udlejningsportaler som Airbnb, Booking.com, Vrbo og andre relevante kanaler. Men hos SommerVibes stopper indsatsen ikke dér. Vi markedsfører også din bolig via SommerVibes.dk, Facebook, Instagram og andre udvalgte platforme for at skabe reel synlighed og bedre muligheder for bookinger.',
  },
  {
    icon: SlidersHorizontal,
    title: 'Fuld fleksibilitet',
    short: 'Du vælger selv, hvor meget du vil udleje, og hvordan samarbejdet skal fungere.',
    long: 'Hos SommerVibes er samarbejdet fleksibelt. Du bestemmer selv, hvor meget du vil udleje, hvordan din bolig skal drives, og hvilke løsninger du ønsker hjælp til. Vi tilpasser samarbejdet til dig og din bolig — ikke omvendt.',
  },
];

function ServiceCard({
  service,
  isExpanded,
  onToggle,
}: {
  service: (typeof services)[0];
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const Icon = service.icon;

  return (
    <motion.div
      layout
      className="bg-[hsl(40,30%,97%)] rounded-2xl border border-[hsl(35,20%,88%)] p-7 md:p-8 flex flex-col gap-5 h-full cursor-default select-none transition-shadow duration-300 hover:shadow-[0_8px_30px_-8px_hsla(35,30%,40%,0.12)]"
    >
      {/* Icon */}
      <div className="w-11 h-11 rounded-xl bg-[hsl(35,25%,92%)] flex items-center justify-center flex-shrink-0">
        <Icon className="w-5 h-5 text-[hsl(var(--gold-dark))]" strokeWidth={1.5} />
      </div>

      {/* Title */}
      <h3 className="font-display text-lg font-semibold text-[hsl(var(--warm-foreground))] leading-snug">
        {service.title}
      </h3>

      {/* Short description */}
      <p className="text-sm leading-relaxed text-[hsl(var(--warm-foreground))]/70 flex-1">
        {service.short}
      </p>

      {/* Expanded content */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.25, 0.8, 0.25, 1] }}
            className="overflow-hidden"
          >
            <div className="pt-3 pb-1 border-t border-[hsl(35,20%,88%)]">
              <p className="text-sm leading-relaxed text-[hsl(var(--warm-foreground))]/60">
                {service.long}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Read more toggle */}
      <button
        onClick={onToggle}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-[hsl(var(--gold-dark))] hover:text-[hsl(var(--gold))] transition-colors duration-200 self-start group"
      >
        {isExpanded ? 'Luk' : 'Læs mere'}
        <ArrowRight
          className={`w-3.5 h-3.5 transition-transform duration-300 ${isExpanded ? 'rotate-90' : 'group-hover:translate-x-0.5'}`}
          strokeWidth={2}
        />
      </button>
    </motion.div>
  );
}

export function PremiumServicesSection() {
  const { ref, isInView } = useScrollReveal();
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  const scroll = useCallback((dir: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const cardWidth = scrollRef.current.querySelector<HTMLElement>(':scope > div')?.offsetWidth ?? 380;
    const gap = 24;
    scrollRef.current.scrollBy({
      left: dir === 'left' ? -(cardWidth + gap) : cardWidth + gap,
      behavior: 'smooth',
    });
  }, []);

  const handleToggle = (i: number) => {
    setExpandedIndex((prev) => (prev === i ? null : i));
  };

  return (
    <section
      ref={ref}
      className="py-20 md:py-28 overflow-hidden"
      style={{ background: 'hsl(35, 28%, 93%)' }}
    >
      <div className="container mx-auto px-4 md:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-2xl mb-14 md:mb-16"
        >
          <span className="text-xs font-body font-semibold tracking-[0.25em] uppercase text-[hsl(var(--gold-dark))] block mb-4">
            SommerVibes Fordele
          </span>
          <h2 className="font-display text-3xl md:text-4xl lg:text-[2.75rem] font-bold text-[hsl(var(--warm-foreground))] leading-[1.15] mb-5">
            Ekstraordinær service{' '}
            <span className="italic font-normal text-[hsl(var(--gold-dark))]">
              hos SommerVibes
            </span>
          </h2>
          <p className="text-base md:text-lg leading-relaxed text-[hsl(var(--warm-foreground))]/70 max-w-xl">
            Vi gør mere end bare at udleje dit sommerhus. Hos SommerVibes får du eksponering, fleksibilitet og services, der er skabt til at øge både tryghed og indtjening.
          </p>
        </motion.div>

        {/* Carousel wrapper */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="relative"
        >
          {/* Navigation arrows — desktop only */}
          {!isMobile && (
            <>
              <button
                onClick={() => scroll('left')}
                className="absolute -left-5 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-[hsl(40,30%,97%)] border border-[hsl(35,20%,85%)] shadow-sm flex items-center justify-center hover:bg-white transition-colors duration-200"
                aria-label="Forrige"
              >
                <ChevronLeft className="w-5 h-5 text-[hsl(var(--warm-foreground))]" strokeWidth={1.5} />
              </button>
              <button
                onClick={() => scroll('right')}
                className="absolute -right-5 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-[hsl(40,30%,97%)] border border-[hsl(35,20%,85%)] shadow-sm flex items-center justify-center hover:bg-white transition-colors duration-200"
                aria-label="Næste"
              >
                <ChevronRight className="w-5 h-5 text-[hsl(var(--warm-foreground))]" strokeWidth={1.5} />
              </button>
            </>
          )}

          {/* Scrollable track */}
          <div
            ref={scrollRef}
            className="flex gap-6 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-4 -mb-4"
            style={{ scrollPaddingLeft: '1rem' }}
          >
            {services.map((s, i) => (
              <div
                key={i}
                className="snap-start flex-shrink-0 w-[85vw] sm:w-[340px] md:w-[360px] lg:w-[380px]"
              >
                <ServiceCard
                  service={s}
                  isExpanded={expandedIndex === i}
                  onToggle={() => handleToggle(i)}
                />
              </div>
            ))}
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.35 }}
          className="mt-14 md:mt-16 text-center"
        >
          <Link
            to="/contact"
            className="inline-flex items-center gap-2.5 px-8 py-4 rounded-xl font-body text-sm font-semibold tracking-wide transition-all duration-300 bg-[hsl(var(--gold-dark))] text-[hsl(40,40%,97%)] hover:bg-[hsl(var(--gold))] shadow-[0_4px_20px_-4px_hsla(38,50%,40%,0.25)] hover:shadow-[0_8px_30px_-4px_hsla(38,50%,40%,0.35)]"
          >
            Bliv kontaktet i dag
            <ArrowRight className="w-4 h-4" strokeWidth={2} />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
