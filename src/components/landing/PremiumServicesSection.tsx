import { motion } from 'framer-motion';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

// Editorial images
import heroInterior from '@/assets/services/hero-interior.jpg';
import editorialBoost from '@/assets/services/editorial-boost.jpg';
import editorialDialog from '@/assets/services/editorial-dialog.jpg';
import editorialCleaning from '@/assets/services/editorial-cleaning.jpg';
import editorialExposure from '@/assets/services/editorial-exposure.jpg';

/* ═══════════════════════════════════════════
   ANIMATION HELPERS
   ═══════════════════════════════════════════ */

const reveal = (isInView: boolean, delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: isInView ? { opacity: 1, y: 0 } : {},
  transition: { duration: 0.9, delay, ease: 'easeOut' as const },
});

const imgReveal = (isInView: boolean, delay = 0) => ({
  initial: { opacity: 0, scale: 1.04 },
  animate: isInView ? { opacity: 1, scale: 1 } : {},
  transition: { duration: 1.1, delay, ease: 'easeOut' as const },
});

/* ═══════════════════════════════════════════
   1. HERO FEATURE BLOCK
   ═══════════════════════════════════════════ */

function HeroFeature() {
  const { ref, isInView } = useScrollReveal();

  return (
    <div ref={ref} className="grid lg:grid-cols-2 gap-8 lg:gap-14 items-center mb-24 md:mb-32">
      {/* Image */}
      <motion.div {...imgReveal(isInView)} className="overflow-hidden rounded-2xl lg:rounded-3xl">
        <img
          src={heroInterior}
          alt="Premium skandinavisk sommerhus interiør med naturligt lys"
          className="w-full aspect-[16/10] object-cover"
        />
      </motion.div>

      {/* Text */}
      <motion.div {...reveal(isInView, 0.15)} className="max-w-[480px]">
        <span className="text-accent/50 font-body text-[10px] font-semibold tracking-[0.4em] uppercase block mb-5">
          SommerVibes Fordele
        </span>
        <h2 className="font-display text-[1.8rem] md:text-[2.4rem] lg:text-[2.8rem] font-semibold text-primary leading-[1.08] tracking-[-0.02em] mb-6">
          Ekstraordinær service
          <span className="block text-accent italic font-normal mt-1">hos SommerVibes</span>
        </h2>
        <p className="text-muted-foreground/80 text-[15px] leading-[1.8] mb-8">
          Vi gør mere end at udleje dit sommerhus. Hos SommerVibes får du en gennemsigtig, personlig og moderne udlejningsoplevelse — fra start til slut.
        </p>
        <Link
          to="/how-it-works"
          className="inline-flex items-center gap-2.5 text-accent/70 text-[13px] font-medium hover:text-accent transition-colors duration-300 group"
        >
          Se hvordan det virker
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform duration-300" />
        </Link>
      </motion.div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   2. EDITORIAL FEATURE ROW
   ═══════════════════════════════════════════ */

interface FeatureRowProps {
  label: string;
  title: string;
  titleAccent: string;
  description: string;
  image: string;
  imageAlt: string;
  reversed?: boolean;
  link?: { text: string; href: string };
}

function FeatureRow({ label, title, titleAccent, description, image, imageAlt, reversed, link }: FeatureRowProps) {
  const { ref, isInView } = useScrollReveal();

  return (
    <div ref={ref} className={`grid lg:grid-cols-12 gap-8 lg:gap-14 items-center ${reversed ? '' : ''}`}>
      {/* Image — takes 7 cols */}
      <motion.div
        {...imgReveal(isInView)}
        className={`lg:col-span-7 overflow-hidden rounded-2xl ${reversed ? 'lg:order-2' : ''}`}
      >
        <img
          src={image}
          alt={imageAlt}
          loading="lazy"
          className="w-full aspect-[4/3] object-cover"
        />
      </motion.div>

      {/* Text — takes 5 cols */}
      <motion.div
        {...reveal(isInView, 0.12)}
        className={`lg:col-span-5 ${reversed ? 'lg:order-1' : ''}`}
      >
        <span className="text-accent/45 font-body text-[10px] font-semibold tracking-[0.35em] uppercase block mb-4">
          {label}
        </span>
        <h3 className="font-display text-[1.4rem] md:text-[1.7rem] font-semibold text-primary leading-[1.12] tracking-[-0.01em] mb-5">
          {title}
          <span className="block text-accent italic font-normal mt-1">{titleAccent}</span>
        </h3>
        <p className="text-muted-foreground/75 text-[14.5px] leading-[1.8] mb-6">
          {description}
        </p>
        {link && (
          <Link
            to={link.href}
            className="inline-flex items-center gap-2 text-accent/60 text-[12.5px] font-medium hover:text-accent transition-colors duration-300 group"
          >
            {link.text}
            <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform duration-300" />
          </Link>
        )}
      </motion.div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   3. ADDITIONAL BENEFITS — Minimal horizontal strip
   ═══════════════════════════════════════════ */

const extras = [
  { title: 'Nøgleservice', desc: 'Smart digital adgang for gæster, rengøring og ejere.' },
  { title: 'Tryghedsgaranti', desc: 'Udlejningsforsikring inkl. — ekstra sikkerhed ved hvert ophold.' },
  { title: 'Merindtjening', desc: 'Sengepakker, tidlig check-in og andre tilvalg øger din bundlinje.' },
  { title: 'Fuld fleksibilitet', desc: 'Du bestemmer selv perioder, priser og omfanget af samarbejdet.' },
  { title: 'Service & reparation', desc: 'Vi koordinerer håndværkere, hvis noget opstår under udlejning.' },
  { title: 'Personlig rådgiver', desc: 'Én fast kontaktperson, der kender dit hus og dine ønsker.' },
];

function ExtrasStrip() {
  const { ref, isInView } = useScrollReveal();

  return (
    <div ref={ref} className="mt-24 md:mt-32">
      <motion.div {...reveal(isInView)} className="flex items-center gap-4 mb-10">
        <div className="w-8 h-px bg-accent/20" />
        <span className="text-accent/40 font-body text-[10px] font-semibold tracking-[0.35em] uppercase">
          Yderligere fordele
        </span>
      </motion.div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-8">
        {extras.map((item, i) => (
          <motion.div key={i} {...reveal(isInView, 0.04 * i)}>
            <h4 className="font-display text-[1rem] font-semibold text-primary mb-1.5">{item.title}</h4>
            <p className="text-muted-foreground/60 text-[13px] leading-[1.7]">{item.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   MAIN EXPORT
   ═══════════════════════════════════════════ */

export function PremiumServicesSection() {
  return (
    <section className="py-24 md:py-32 bg-background">
      <div className="container mx-auto px-5 md:px-10 max-w-[1140px]">
        {/* 1. Hero feature */}
        <HeroFeature />

        {/* 2. Editorial stacked features */}
        <div className="space-y-20 md:space-y-28">
          <FeatureRow
            label="Markedsføring"
            title="SommerVibes BOOST"
            titleAccent="giver din bolig momentum"
            description="Når din bolig oprettes, inkluderer vi 4 ugers gratis BOOST-markedsføring med målrettet synlighed i Danmark, Tyskland og Holland. Stærkere opstart, bedre forudsætninger for bookinger."
            image={editorialBoost}
            imageAlt="Ejer bruger tablet til at administrere sin sommerhusudlejning"
            link={{ text: 'Kom i gang', href: '/kom-i-gang' }}
          />

          <FeatureRow
            reversed
            label="Kundedialog"
            title="Vi tager os af"
            titleAccent="hele gæstedialogen"
            description="Før, under og efter opholdet — 24/7. Du slipper for at være på hele tiden, mens dine gæster får professionel og hurtig service. Det giver tryghed for alle parter."
            image={editorialDialog}
            imageAlt="Afslappet gæsteoplevelse ved et dansk sommerhus"
            link={{ text: 'Læs mere om vores service', href: '/how-it-works' }}
          />

          <FeatureRow
            label="Slutrengøring"
            title="Altid klar til"
            titleAccent="næste gæst"
            description="Vi koordinerer professionel slutrengøring gennem lokale samarbejdspartnere. Din bolig fremstår indbydende, ren og præsentabel — uden at du selv skal stå med det praktiske."
            image={editorialCleaning}
            imageAlt="Rent og indbydende soveværelse i skandinavisk sommerhus"
            link={{ text: 'Se vores standarder', href: '/how-it-works' }}
          />

          <FeatureRow
            reversed
            label="Eksponering"
            title="Din bolig på alle"
            titleAccent="de rigtige kanaler"
            description="Vi lister din bolig på Airbnb, Booking.com, Vrbo og SommerVibes.dk — og markedsfører den aktivt via sociale medier og målrettede kampagner. Maksimal rækkevidde, flere bookinger."
            image={editorialExposure}
            imageAlt="Dansk sommerhusområde ved kysten set fra drone"
            link={{ text: 'Se portalerne', href: '/how-it-works' }}
          />
        </div>

        {/* 3. Additional benefits strip */}
        <ExtrasStrip />

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="mt-20 md:mt-24 text-center"
        >
          <Link
            to="/kom-i-gang"
            className="btn-gold inline-flex items-center gap-2.5 px-8 py-4 rounded-xl text-sm"
          >
            Bliv kontaktet i dag
            <ArrowRight className="w-3.5 h-3.5" strokeWidth={2} />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
