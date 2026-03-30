import { useState, useRef, useCallback, type ReactNode } from 'react';
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
  Check,
  ArrowUpRight,
  User,
  Calendar,
  Lock,
  Wifi,
  Eye,
  Star,
  Settings,
} from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Link } from 'react-router-dom';

interface Service {
  icon: typeof QrCode;
  title: string;
  short: string;
  long: string;
  expandLabel?: string;
  signature?: boolean;
  badge?: string;
  visual?: () => ReactNode;
}

/* ═══════════════════════════════════════════
   VISUAL STORYTELLING COMPONENTS
   ═══════════════════════════════════════════ */

function BoostVisual() {
  return (
    <div className="rounded-xl bg-secondary/60 border border-border/40 p-3.5 space-y-2.5">
      {/* Market reach bar */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
          <div className="h-full w-[85%] rounded-full bg-gradient-to-r from-primary/60 to-primary/30" />
        </div>
        <span className="text-[9px] font-bold text-primary/70">+85%</span>
      </div>
      {/* Country + duration chips */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {['🇩🇰 DK', '🇩🇪 DE', '🇳🇱 NL'].map((c) => (
          <span key={c} className="px-2 py-0.5 rounded-md bg-primary/8 border border-primary/12 text-[9px] font-semibold text-primary/70">
            {c}
          </span>
        ))}
        <span className="ml-auto px-2 py-0.5 rounded-md bg-accent/10 border border-accent/15 text-[9px] font-bold text-accent/80 flex items-center gap-1">
          <Zap className="w-2.5 h-2.5" strokeWidth={2} />
          4 uger gratis
        </span>
      </div>
      {/* Subtle exposure line */}
      <div className="flex items-center gap-1.5">
        <ArrowUpRight className="w-3 h-3 text-primary/40" strokeWidth={1.5} />
        <span className="text-[8.5px] font-medium text-muted-foreground/50">Målrettet eksponering fra dag 1</span>
      </div>
    </div>
  );
}

function DialogVisual() {
  return (
    <div className="rounded-xl bg-secondary/60 border border-border/40 p-3.5 space-y-2">
      {/* Timeline */}
      <div className="flex items-center gap-1">
        {[
          { label: 'Før booking', active: true },
          { label: 'Under ophold', active: true },
          { label: 'Efter ophold', active: true },
        ].map((step, i) => (
          <div key={step.label} className="flex items-center gap-1 flex-1">
            {i > 0 && <div className="w-full h-px bg-primary/15" />}
            <div className="flex flex-col items-center gap-0.5 flex-shrink-0">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                step.active ? 'bg-primary/15 border border-primary/20' : 'bg-muted border border-border/40'
              }`}>
                <Check className="w-2.5 h-2.5 text-primary/60" strokeWidth={2} />
              </div>
              <span className="text-[7.5px] font-medium text-muted-foreground/50 whitespace-nowrap">{step.label}</span>
            </div>
          </div>
        ))}
      </div>
      {/* 24/7 badge */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-1.5">
          <MessageCircle className="w-3 h-3 text-primary/40" strokeWidth={1.5} />
          <span className="text-[8.5px] font-medium text-muted-foreground/50">Altid tilgængelig</span>
        </div>
        <span className="px-2.5 py-1 rounded-lg bg-primary/10 border border-primary/15 text-[10px] font-bold text-primary/70 tracking-wide">
          24/7
        </span>
      </div>
    </div>
  );
}

function CleaningVisual() {
  return (
    <div className="rounded-xl bg-secondary/60 border border-border/40 p-3.5 space-y-2.5">
      {/* Checklist */}
      <div className="space-y-1.5">
        {['Grundig rengøring', 'Sengelinned klar', 'Kvalitetstjek'].map((item) => (
          <div key={item} className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-primary/10 border border-primary/15 flex items-center justify-center flex-shrink-0">
              <Check className="w-2.5 h-2.5 text-primary/60" strokeWidth={2.5} />
            </div>
            <span className="text-[9px] font-medium text-muted-foreground/60">{item}</span>
          </div>
        ))}
      </div>
      {/* Status */}
      <div className="flex items-center justify-between pt-0.5">
        <span className="text-[8px] font-medium text-muted-foreground/40">Lokal samarbejdspartner</span>
        <span className="px-2 py-0.5 rounded-md bg-primary/8 border border-primary/12 text-[9px] font-semibold text-primary/60 flex items-center gap-1">
          <SparklesIcon className="w-2.5 h-2.5" strokeWidth={1.5} />
          Klar til gæst
        </span>
      </div>
    </div>
  );
}

function QrSignVisual() {
  return (
    <div className="rounded-xl bg-secondary/60 border border-border/40 p-3.5">
      <div className="flex items-start gap-3">
        {/* Mini sign mockup */}
        <div className="w-16 rounded-lg bg-card border border-border p-2 flex flex-col items-center gap-1.5 flex-shrink-0">
          <span className="text-[7px] font-bold tracking-[0.2em] uppercase text-primary/50">SommerVibes</span>
          <div className="w-8 h-8 rounded bg-muted border border-border/60 flex items-center justify-center">
            <QrCode className="w-5 h-5 text-primary/40" strokeWidth={1} />
          </div>
          <span className="text-[8px] font-bold text-foreground/60">Til Leje</span>
        </div>
        {/* Description */}
        <div className="flex flex-col gap-1.5 pt-1">
          <span className="text-[8.5px] font-medium text-muted-foreground/50">Direkte link til din annonce</span>
          <div className="flex items-center gap-1.5">
            <Eye className="w-3 h-3 text-primary/40" strokeWidth={1.5} />
            <span className="text-[8.5px] font-medium text-muted-foreground/50">Lokal synlighed</span>
          </div>
          <div className="flex items-center gap-1.5">
            <User className="w-3 h-3 text-primary/40" strokeWidth={1.5} />
            <span className="text-[8.5px] font-medium text-muted-foreground/50">Forbipasserende & naboer</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function PortalsVisual() {
  return (
    <div className="rounded-xl bg-secondary/60 border border-border/40 p-3.5 space-y-2.5">
      {/* Primary channels */}
      <div className="flex gap-1.5 flex-wrap">
        {['Airbnb', 'Booking.com', 'Vrbo'].map((p) => (
          <span key={p} className="px-2 py-1 rounded-lg bg-card border border-border/50 text-[9px] font-semibold text-foreground/60 flex items-center gap-1">
            <Globe className="w-2.5 h-2.5 text-primary/50" strokeWidth={1.5} />
            {p}
          </span>
        ))}
      </div>
      {/* SommerVibes channels */}
      <div className="flex gap-1.5 flex-wrap">
        {['SommerVibes.dk', 'Facebook', 'Instagram'].map((p) => (
          <span key={p} className="px-2 py-0.5 rounded-md bg-primary/6 border border-primary/10 text-[8.5px] font-medium text-primary/60">
            {p}
          </span>
        ))}
      </div>
      {/* Reach indicator */}
      <div className="flex items-center gap-1.5 pt-0.5">
        <div className="flex-1 h-1 rounded-full bg-muted overflow-hidden">
          <div className="h-full w-full rounded-full bg-gradient-to-r from-primary/40 via-primary/20 to-accent/20" />
        </div>
        <span className="text-[8px] font-bold text-primary/50">Fuld rækkevidde</span>
      </div>
    </div>
  );
}

function RevenueVisual() {
  return (
    <div className="rounded-xl bg-secondary/60 border border-border/40 p-3.5 space-y-2.5">
      {/* Revenue chips */}
      <div className="flex gap-1.5 flex-wrap">
        {[
          { label: 'Sengepakker', amount: '+450 kr' },
          { label: 'Tidlig check-in', amount: '+350 kr' },
          { label: 'Sen check-out', amount: '+350 kr' },
        ].map((item) => (
          <span key={item.label} className="px-2 py-1 rounded-lg bg-card border border-border/50 text-[8.5px] font-medium text-muted-foreground/60 flex items-center gap-1.5">
            {item.label}
            <span className="font-bold text-primary/70">{item.amount}</span>
          </span>
        ))}
      </div>
      <div className="flex gap-1.5 flex-wrap">
        {['El & vand', 'Varme', 'Ekstra tilvalg'].map((item) => (
          <span key={item} className="px-2 py-0.5 rounded-md bg-accent/6 border border-accent/10 text-[8px] font-medium text-accent/60">
            {item}
          </span>
        ))}
      </div>
      {/* Total hint */}
      <div className="flex items-center justify-between pt-0.5">
        <span className="text-[8px] text-muted-foreground/40">Per booking potentiale</span>
        <span className="flex items-center gap-1 text-[9px] font-bold text-primary/60">
          <TrendingUp className="w-3 h-3" strokeWidth={1.5} />
          +15-30%
        </span>
      </div>
    </div>
  );
}

function TryghedVisual() {
  return (
    <div className="rounded-xl bg-secondary/60 border border-border/40 p-3 flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-primary/8 border border-primary/12 flex items-center justify-center flex-shrink-0">
        <ShieldCheck className="w-5 h-5 text-primary/50" strokeWidth={1.2} />
      </div>
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-1.5">
          <Check className="w-3 h-3 text-primary/50" strokeWidth={2} />
          <span className="text-[8.5px] font-medium text-muted-foreground/60">Udlejningsforsikring</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Check className="w-3 h-3 text-primary/50" strokeWidth={2} />
          <span className="text-[8.5px] font-medium text-muted-foreground/60">3.000 kr. selvrisiko</span>
        </div>
      </div>
    </div>
  );
}

function NoegleVisual() {
  return (
    <div className="rounded-xl bg-secondary/60 border border-border/40 p-3 flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-primary/8 border border-primary/12 flex items-center justify-center flex-shrink-0">
        <Lock className="w-4 h-4 text-primary/50" strokeWidth={1.3} />
      </div>
      <div className="flex flex-col gap-1">
        {['Gæster', 'Rengøring', 'Ejer'].map((who) => (
          <div key={who} className="flex items-center gap-1.5">
            <Wifi className="w-2.5 h-2.5 text-primary/40" strokeWidth={1.5} />
            <span className="text-[8.5px] font-medium text-muted-foreground/55">{who}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function RaadgiverVisual() {
  return (
    <div className="rounded-xl bg-secondary/60 border border-border/40 p-3 flex items-center gap-3">
      <div className="w-10 h-10 rounded-full bg-primary/8 border border-primary/12 flex items-center justify-center flex-shrink-0">
        <User className="w-4 h-4 text-primary/50" strokeWidth={1.3} />
      </div>
      <div className="flex flex-col gap-0.5">
        <span className="text-[9px] font-semibold text-foreground/60">Din rådgiver</span>
        <span className="text-[8px] text-muted-foreground/45">Direkte kontakt · Tæt sparring</span>
      </div>
    </div>
  );
}

function ServiceRepVisual() {
  return (
    <div className="rounded-xl bg-secondary/60 border border-border/40 p-3 flex items-center gap-2.5">
      <div className="w-8 h-8 rounded-lg bg-primary/8 border border-primary/12 flex items-center justify-center flex-shrink-0">
        <Wrench className="w-3.5 h-3.5 text-primary/50" strokeWidth={1.3} />
      </div>
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="px-2 py-0.5 rounded-md bg-card border border-border/40 text-[8.5px] font-medium text-muted-foreground/55">Hurtig rekvirering</span>
        <span className="px-2 py-0.5 rounded-md bg-card border border-border/40 text-[8.5px] font-medium text-muted-foreground/55">Koordinering</span>
      </div>
    </div>
  );
}

function AdminVisual() {
  return (
    <div className="rounded-xl bg-secondary/60 border border-border/40 p-3 grid grid-cols-3 gap-1.5">
      {[
        { icon: Calendar, label: 'Kalender' },
        { icon: LayoutDashboard, label: 'Overblik' },
        { icon: Settings, label: 'Drift' },
      ].map(({ icon: Ic, label }) => (
        <div key={label} className="flex flex-col items-center gap-1 py-1.5 rounded-lg bg-card border border-border/30">
          <Ic className="w-3 h-3 text-primary/40" strokeWidth={1.3} />
          <span className="text-[7.5px] font-medium text-muted-foreground/45">{label}</span>
        </div>
      ))}
    </div>
  );
}

function MarketingVisual() {
  return (
    <div className="rounded-xl bg-secondary/60 border border-border/40 p-3 flex items-center gap-2.5">
      <div className="w-8 h-8 rounded-lg bg-primary/8 border border-primary/12 flex items-center justify-center flex-shrink-0">
        <Eye className="w-3.5 h-3.5 text-primary/50" strokeWidth={1.3} />
      </div>
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-1">
          <Star className="w-2.5 h-2.5 text-accent/50" strokeWidth={1.5} />
          <span className="text-[8.5px] font-medium text-muted-foreground/55">Professionel præsentation</span>
        </div>
        <span className="text-[8px] text-muted-foreground/40">Skarp tekst · Målrettet synlighed</span>
      </div>
    </div>
  );
}

function FlexVisual() {
  return (
    <div className="rounded-xl bg-secondary/60 border border-border/40 p-3 flex items-center gap-2">
      {['Dit tempo', 'Dine valg', 'Din bolig'].map((label, i) => (
        <span key={label} className={`px-2 py-1 rounded-lg text-[8.5px] font-medium border ${
          i === 0 ? 'bg-primary/8 border-primary/12 text-primary/60 font-semibold' : 'bg-card border-border/40 text-muted-foreground/50'
        }`}>
          {label}
        </span>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════
   SERVICE DATA
   ═══════════════════════════════════════════ */

const services: Service[] = [
  {
    icon: Zap,
    title: 'SommerVibes BOOST',
    short: 'Giv din bolig en stærkere opstart med 4 ugers ekstra eksponering i udvalgte markeder.',
    long: 'Når din bolig oprettes hos SommerVibes, inkluderer vi 4 ugers gratis BOOST-markedsføring. Det betyder målrettet ekstra synlighed mod relevante gæster i blandt andet Danmark, Tyskland og Holland. BOOST er udviklet til at give din bolig momentum fra start og skabe bedre forudsætninger for synlighed, interesse og bookinger. Efter opstartsperioden kan indsatsen altid genaktiveres, hvis du ønsker et nyt løft.',
    expandLabel: 'Hvad du får med',
    signature: true,
    badge: 'Særligt hos SommerVibes',
    visual: BoostVisual,
  },
  {
    icon: MessageCircle,
    title: 'Kundedialog 24/7',
    short: 'Vi tager hele gæstedialogen før, under og efter opholdet — døgnet rundt.',
    long: 'Hos SommerVibes håndterer vi al dialog med gæsterne, så du slipper for at være på hele tiden. Vi svarer på spørgsmål før booking, hjælper med praktisk information op til ankomst, står til rådighed under opholdet og følger op efter endt leje. Det giver både dig og gæsterne en mere tryg, professionel og smidig oplevelse — med hjælp og respons 24/7.',
    expandLabel: 'Mindre arbejde for dig',
    signature: true,
    badge: 'Mindre arbejde for dig',
    visual: DialogVisual,
  },
  {
    icon: SparklesIcon,
    title: 'Slutrengøring',
    short: 'Vi sørger for, at boligen altid fremstår ren, indbydende og klar til næste gæst.',
    long: 'Hos SommerVibes tager vi os af slutrengøringen gennem vores lokale samarbejdspartnere, så gæsterne møder en bolig, der er klargjort med den standard, de forventer. Det sikrer en mere professionel gæsteoplevelse og sparer dig samtidig for praktisk koordinering. Boligen fremstår præsentabel, indbydende og klar til næste ophold — uden at du selv skal stå med det.',
    expandLabel: 'Det betyder for dig',
    signature: true,
    badge: 'Ekstra tryghed',
    visual: CleaningVisual,
  },
  {
    icon: QrCode,
    title: 'Til-Leje-skilt med QR-kode',
    short: 'Få lokal eksponering med et unikt SommerVibes-skilt direkte ved din bolig.',
    long: 'Som en særlig SommerVibes-service tilbyder vi et unikt Til-Leje-skilt med QR-kode, der leder direkte til netop din boligannonce. Det giver ekstra synlighed over for forbipasserende, naboer, turister og potentielle gæster i området. En enkel, men effektiv måde at skabe mere opmærksomhed, flere henvendelser og stærkere lokal eksponering omkring din bolig.',
    expandLabel: 'Derfor gør det en forskel',
    signature: true,
    badge: 'Mere synlighed',
    visual: QrSignVisual,
  },
  {
    icon: Globe,
    title: 'Eksponering på alle store portaler',
    short: 'Vi nøjes ikke med at liste din bolig — vi arbejder aktivt for, at den bliver set.',
    long: 'Din bolig bliver naturligvis eksponeret på de store udlejningsportaler som Airbnb, Booking.com, Vrbo og andre relevante kanaler. Men hos SommerVibes stopper indsatsen ikke dér. Vi markedsfører også aktivt din bolig via SommerVibes.dk, Facebook, Instagram og andre relevante flader, så du får mere end bare en placering. Du får reel synlighed, stærkere eksponering og bedre muligheder for flere bookinger.',
    expandLabel: 'Hvad du får med',
    signature: true,
    badge: 'Maksimal rækkevidde',
    visual: PortalsVisual,
  },
  {
    icon: TrendingUp,
    title: 'Unikke muligheder for merindtjening',
    short: 'Tjen mere på de tilvalg og ydelser, mange andre bureauer ikke lader dig få fuld værdi af.',
    long: 'Hos SommerVibes får du adgang til fleksible indtægtsmuligheder, der kan løfte den samlede værdi af hver booking. Det kan være betaling for sengepakker, forbrug, tidlig check-in, sen check-out og andre relevante tilvalg. Det giver dig mulighed for at skræddersy din udlejning og hente ekstra værdi ud af de detaljer, som ofte gør en reel forskel på bundlinjen.',
    expandLabel: 'Mere indtjening',
    signature: true,
    badge: 'Populær blandt ejere',
    visual: RevenueVisual,
  },
  {
    icon: ShieldCheck,
    title: 'Tryghedsgaranti',
    short: 'Ekstra sikkerhed, hvis uheldet skulle være ude under et ophold.',
    long: 'Skulle en gæst forårsage skade under et ophold, tilbyder vi via vores samarbejdspartner på udlejningsforsikring en løsning med selvrisiko på 3.000 kr. Vi anbefaler samtidig, at du også har en relevant udvidet udlejningsforsikring gennem dit eget forsikringsselskab, så du står bedst muligt dækket. Hos SommerVibes er tryghed ikke en sidebemærkning — det er en vigtig del af samarbejdet.',
    expandLabel: 'Ekstra tryghed',
    badge: 'Ro i maven',
    visual: TryghedVisual,
  },
  {
    icon: KeyRound,
    title: 'Nøgleservice',
    short: 'Smart og fleksibel adgang for gæster, rengøring, viceværter og ejere.',
    long: 'Med vores elektroniske nøgleløsning gør vi adgangen til boligen enkel og smidig for alle relevante parter. Det gælder både gæster, rengøring, viceværter og dig som ejer. Vi håndterer koder og hjælper med, at løsningen fungerer i praksis, så du får mindre koordinering, bedre flow og en mere professionel drift omkring udlejningen.',
    expandLabel: 'Det betyder for dig',
    badge: 'Nem drift',
    visual: NoegleVisual,
  },
  {
    icon: HeadphonesIcon,
    title: 'Fri rådgiversupport',
    short: 'Du har altid direkte adgang til din personlige udlejningsrådgiver.',
    long: 'Hos SommerVibes står du ikke alene med spørgsmål om udlejning, drift, priser, booking eller optimering af din bolig. Du har løbende adgang til sparring og ærlig rådgivning fra en rådgiver, der kender samarbejdet og din bolig. Det skaber nærvær, overblik og tryghed i en hverdag, hvor det skal være nemt at komme videre.',
    expandLabel: 'Tæt sparring',
    badge: 'Inkluderet service',
    visual: RaadgiverVisual,
  },
  {
    icon: Wrench,
    title: 'Service & reparation',
    short: 'Hvis noget opstår under udlejningen, hjælper vi med at få det løst.',
    long: 'Hvis der opstår en akut situation under en udlejning, kan SommerVibes hjælpe med at rekvirere relevante håndværkere eller fagpersoner på dine vegne. Udgifter faktureres naturligvis direkte til dig, og du vælger selv, om du vil stå for vedligeholdelsen selv eller ønsker, at vi hjælper med koordineringen. Det giver dig fleksibilitet og gør det lettere at håndtere det uforudsete.',
    expandLabel: 'Fleksibel hjælp',
    visual: ServiceRepVisual,
  },
  {
    icon: LayoutDashboard,
    title: 'Moderne administration',
    short: 'Et enkelt setup med struktur, overblik og effektiv drift omkring din bolig.',
    long: 'Vi arbejder moderne og effektivt med fokus på synlighed, struktur og høj udnyttelse af din bolig. Det betyder, at samarbejdet skal være let at forstå, let at følge med i og let at skabe resultater med. SommerVibes er bygget til husejere, der ønsker høj service uden tung administration eller unødigt bøvl.',
    expandLabel: 'Mere overblik',
    visual: AdminVisual,
  },
  {
    icon: Megaphone,
    title: 'Effektiv markedsføring',
    short: 'Din bolig skal ikke bare online — den skal præsenteres stærkt og tiltrække de rigtige gæster.',
    long: 'Vi arbejder aktivt for at give din bolig en præsentation, der skaber interesse. Det handler om visuelt flot opsætning, skarp tekst og målrettet markedsføring, så boligen ikke blot er til stede, men også bliver valgt. Målet er at øge synlighed, tiltrække de rigtige gæster og styrke dine muligheder for flere bookinger.',
    expandLabel: 'Flere relevante bookinger',
    visual: MarketingVisual,
  },
  {
    icon: SlidersHorizontal,
    title: 'Fuld fleksibilitet',
    short: 'Du bestemmer selv, hvor meget du vil udleje, og hvordan samarbejdet skal fungere.',
    long: 'Hos SommerVibes tilpasser vi samarbejdet til dig og din bolig — ikke omvendt. Du vælger selv, hvor meget du vil udleje, hvordan boligen skal drives, og hvilke løsninger du ønsker hjælp til. Det giver dig frihed, kontrol og en mere behagelig måde at udleje på, uden at du skal presses ind i en standardmodel.',
    expandLabel: 'På dine vilkår',
    visual: FlexVisual,
  },
];

/* ═══════════════════════════════════════════
   MOBILE BOTTOM SHEET
   ═══════════════════════════════════════════ */

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
        className="relative w-full max-w-lg rounded-t-2xl bg-card border-t border-border p-7 pb-12 max-h-[85vh] overflow-y-auto"
      >
        <div className="mx-auto mb-6 h-1 w-10 rounded-full bg-border" />
        <button
          onClick={onClose}
          className="absolute right-5 top-5 w-8 h-8 rounded-full bg-secondary flex items-center justify-center hover:bg-muted transition-colors"
        >
          <X className="w-4 h-4 text-foreground" strokeWidth={1.5} />
        </button>

        {service.badge && (
          <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold tracking-[0.2em] uppercase text-primary/70 mb-4">
            <Sparkles className="w-2.5 h-2.5" strokeWidth={1.5} />
            {service.badge}
          </span>
        )}

        <div className={`w-[52px] h-[52px] rounded-2xl flex items-center justify-center mb-5 ${
          service.signature
            ? 'bg-primary/12 border border-primary/20'
            : 'bg-secondary border border-border/50'
        }`}>
          <service.icon className="w-5 h-5 text-primary" strokeWidth={1.4} />
        </div>

        <h3 className="font-display text-xl font-bold text-foreground mb-2 leading-snug">
          {service.title}
        </h3>

        {service.expandLabel && (
          <p className="text-[11px] font-semibold tracking-[0.15em] uppercase text-primary/50 mb-4">
            {service.expandLabel}
          </p>
        )}

        {service.visual && (
          <div className="mb-5">{service.visual()}</div>
        )}

        <p className="text-[14px] leading-[1.85] text-muted-foreground">
          {service.long}
        </p>
      </motion.div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════
   SERVICE CARD
   ═══════════════════════════════════════════ */

function ServiceCard({
  service,
  isExpanded,
  onToggle,
}: {
  service: Service;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const Icon = service.icon;

  return (
    <motion.div
      layout="position"
      className={`group rounded-2xl flex flex-col h-full select-none transition-all duration-500 border overflow-hidden ${
        service.signature
          ? 'bg-card border-primary/15 shadow-[0_2px_20px_-6px_hsl(var(--ring)/0.06)]'
          : 'bg-card border-border/50'
      } hover:shadow-[0_8px_32px_-8px_hsl(var(--ring)/0.1)] hover:border-primary/20`}
    >
      {service.signature && (
        <div className="h-[2px] bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      )}

      <div className="p-7 md:p-8 flex flex-col gap-3.5 flex-1">
        {/* Badge */}
        {service.badge && (
          <span className="inline-flex items-center gap-1.5 text-[9.5px] font-semibold tracking-[0.22em] uppercase text-primary/60">
            <Sparkles className="w-2.5 h-2.5" strokeWidth={1.5} />
            {service.badge}
          </span>
        )}

        {/* Icon */}
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
          service.signature
            ? 'bg-primary/10 border border-primary/15 group-hover:bg-primary/15 group-hover:shadow-[0_0_16px_-4px_hsl(var(--ring)/0.1)]'
            : 'bg-secondary border border-border/30 group-hover:bg-muted group-hover:border-border/60'
        }`}>
          <Icon className="w-[19px] h-[19px] text-primary" strokeWidth={1.3} />
        </div>

        {/* Title */}
        <h3 className="font-display text-[1.1rem] font-semibold text-foreground leading-snug">
          {service.title}
        </h3>

        {/* Visual storytelling */}
        {service.visual && (
          <div className="py-0.5">{service.visual()}</div>
        )}

        {/* Short text */}
        <p className="text-[13.5px] leading-[1.7] text-muted-foreground flex-1">
          {service.short}
        </p>

        {/* Expanded */}
        <AnimatePresence initial={false}>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.4, ease: [0.25, 0.8, 0.25, 1] }}
              className="overflow-hidden"
            >
              <div className="pt-5 mt-2 border-t border-border/40">
                {service.expandLabel && (
                  <p className="text-[10px] font-semibold tracking-[0.18em] uppercase text-primary/45 mb-3">
                    {service.expandLabel}
                  </p>
                )}
                <p className="text-[13.5px] leading-[1.9] text-muted-foreground/80">
                  {service.long}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* CTA */}
        <button
          onClick={onToggle}
          className={`inline-flex items-center gap-2 text-[12.5px] font-semibold tracking-[0.02em] self-start mt-auto pt-2 transition-all duration-300 ${
            isExpanded
              ? 'text-muted-foreground hover:text-foreground'
              : 'text-primary hover:text-accent'
          }`}
        >
          <span>{isExpanded ? 'Luk' : 'Se fordelen'}</span>
          <ArrowRight
            className={`w-3 h-3 transition-transform duration-300 ${isExpanded ? 'rotate-90' : 'group-hover:translate-x-0.5'}`}
            strokeWidth={2}
          />
        </button>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════
   MAIN SECTION
   ═══════════════════════════════════════════ */

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
                className="absolute -left-5 top-[45%] -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-card border border-border shadow-soft flex items-center justify-center hover:bg-secondary hover:border-primary/20 transition-all duration-200"
                aria-label="Forrige"
              >
                <ChevronLeft className="w-4 h-4 text-foreground/50" strokeWidth={1.5} />
              </button>
              <button
                onClick={() => scroll('right')}
                className="absolute -right-5 top-[45%] -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-card border border-border shadow-soft flex items-center justify-center hover:bg-secondary hover:border-primary/20 transition-all duration-200"
                aria-label="Næste"
              >
                <ChevronRight className="w-4 h-4 text-foreground/50" strokeWidth={1.5} />
              </button>
            </>
          )}

          <div
            ref={scrollRef}
            className="flex gap-6 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-4 -mb-4"
          >
            {services.map((s, i) => (
              <div key={i} className="snap-start flex-shrink-0 w-[82vw] sm:w-[320px] md:w-[345px] lg:w-[370px]">
                <ServiceCard
                  service={s}
                  isExpanded={expandedIndex === i}
                  onToggle={() => handleToggle(i, s)}
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
