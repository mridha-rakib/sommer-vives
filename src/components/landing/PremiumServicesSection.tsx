import { motion } from 'framer-motion';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

import heroInterior from '@/assets/services/hero-interior.jpg';
import editorialBoost from '@/assets/services/editorial-boost.jpg';
import editorialDialog from '@/assets/services/editorial-dialog.jpg';
import editorialCleaning from '@/assets/services/editorial-cleaning.jpg';
import editorialExposure from '@/assets/services/editorial-exposure.jpg';

/* ═══════════════════════════════════════════
   ANIMATION HELPERS
   ═══════════════════════════════════════════ */

const EASE = [0.25, 0.1, 0.25, 1] as const;

const fade = (inView: boolean, delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  animate: inView ? { opacity: 1, y: 0 } : {},
  transition: { duration: 1, delay, ease: EASE as unknown as [number, number, number, number] },
});

const imgZoom = (inView: boolean, delay = 0) => ({
  initial: { opacity: 0, scale: 1.04 },
  animate: inView ? { opacity: 1, scale: 1 } : {},
  transition: { duration: 1.2, delay, ease: EASE as unknown as [number, number, number, number] },
});

/* ═══════════════════════════════════════════
   1. IMMERSIVE HERO
   ═══════════════════════════════════════════ */

function ImmersiveHero() {
  const { ref, isInView } = useScrollReveal();

  return (
    <div ref={ref} className="relative w-full aspect-[16/7] min-h-[420px] max-h-[680px] rounded-2xl lg:rounded-3xl overflow-hidden mb-24 md:mb-32">
      {/* Background image */}
      <motion.img
        src={heroInterior}
        alt="Premium skandinavisk sommerhus interiør"
        className="absolute inset-0 w-full h-full object-cover"
        {...imgZoom(isInView)}
      />

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col justify-center px-8 md:px-14 lg:px-20 max-w-[560px]">
        <motion.span
          {...fade(isInView)}
          className="text-[hsl(var(--accent))]/50 font-body text-[10px] font-semibold tracking-[0.4em] uppercase block mb-5"
        >
          SommerVibes Fordele
        </motion.span>

        <motion.h2
          {...fade(isInView, 0.1)}
          className="font-display text-[1.8rem] md:text-[2.6rem] lg:text-[3rem] font-semibold text-white leading-[1.06] tracking-[-0.02em] mb-6"
        >
          Ekstraordinær service
          <span className="block text-[hsl(var(--accent))] italic font-normal mt-1">
            hos SommerVibes
          </span>
        </motion.h2>

        <motion.p
          {...fade(isInView, 0.2)}
          className="text-white/70 text-[15px] leading-[1.8] mb-8 max-w-[420px]"
        >
          En gennemsigtig, personlig og moderne udlejningsoplevelse — fra start til slut.
        </motion.p>

        <motion.div {...fade(isInView, 0.3)}>
          <Link
            to="/how-it-works"
            className="inline-flex items-center gap-2.5 text-white/80 text-[13px] font-medium hover:text-white transition-colors duration-300 group"
          >
            Se hvordan det virker
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform duration-300" />
          </Link>
        </motion.div>
      </div>
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
    <div ref={ref} className="grid lg:grid-cols-12 gap-8 lg:gap-16 items-center">
      {/* Image — 7 cols */}
      <motion.div
        {...imgZoom(isInView)}
        className={`lg:col-span-7 overflow-hidden rounded-2xl ${reversed ? 'lg:order-2' : ''}`}
      >
        <img
          src={image}
          alt={imageAlt}
          loading="lazy"
          className="w-full aspect-[4/3] object-cover"
        />
      </motion.div>

      {/* Text — 5 cols */}
      <motion.div
        {...fade(isInView, 0.15)}
        className={`lg:col-span-5 ${reversed ? 'lg:order-1' : ''}`}
      >
        <span className="text-[hsl(var(--accent))]/40 font-body text-[10px] font-semibold tracking-[0.35em] uppercase block mb-4">
          {label}
        </span>
        <h3 className="font-display text-[1.4rem] md:text-[1.8rem] font-semibold text-white leading-[1.1] tracking-[-0.01em] mb-5">
          {title}
          <span className="block text-[hsl(var(--accent))] italic font-normal mt-1">{titleAccent}</span>
        </h3>
        <p className="text-white/55 text-[14.5px] leading-[1.8] mb-6">
          {description}
        </p>
        {link && (
          <Link
            to={link.href}
            className="inline-flex items-center gap-2 text-white/50 text-[12.5px] font-medium hover:text-white/80 transition-colors duration-300 group"
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
   3. MINIMAL EXTRAS STRIP
   ═══════════════════════════════════════════ */

const extras = [
  { title: 'Nøgleservice', desc: 'Smart digital adgang for gæster og ejere.' },
  { title: 'Tryghedsgaranti', desc: 'Udlejningsforsikring inkl. ved hvert ophold.' },
  { title: 'Merindtjening', desc: 'Sengepakker og tilvalg øger din bundlinje.' },
  { title: 'Fuld fleksibilitet', desc: 'Du bestemmer perioder, priser og omfang.' },
  { title: 'Service & reparation', desc: 'Vi koordinerer håndværkere ved behov.' },
  { title: 'Personlig rådgiver', desc: 'Én kontaktperson, der kender dit hus.' },
];

function ExtrasStrip() {
  const { ref, isInView } = useScrollReveal();

  return (
    <div ref={ref} className="mt-28 md:mt-36">
      <motion.div {...fade(isInView)} className="flex items-center gap-4 mb-10">
        <div className="w-8 h-px bg-[hsl(var(--accent))]/20" />
        <span className="text-[hsl(var(--accent))]/30 font-body text-[10px] font-semibold tracking-[0.35em] uppercase">
          Yderligere fordele
        </span>
      </motion.div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-8">
        {extras.map((item, i) => (
          <motion.div key={i} {...fade(isInView, 0.04 * i)}>
            <h4 className="font-display text-[1rem] font-semibold text-white/90 mb-1.5">{item.title}</h4>
            <p className="text-white/40 text-[13px] leading-[1.7]">{item.desc}</p>
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
    <section className="py-24 md:py-32 bg-primary">
      <div className="container mx-auto px-5 md:px-10 max-w-[1140px]">
        {/* Immersive hero */}
        <ImmersiveHero />

        {/* Editorial stacked features */}
        <div className="space-y-24 md:space-y-32">
          <FeatureRow
            label="Markedsføring"
            title="SommerVibes BOOST"
            titleAccent="giver din bolig momentum"
            description="Når din bolig oprettes, inkluderer vi 4 ugers gratis BOOST-markedsføring med målrettet synlighed i Danmark, Tyskland og Holland. Stærkere opstart, bedre forudsætninger for bookinger."
            image={editorialBoost}
            imageAlt="Ejer administrerer sommerhusudlejning via tablet"
            link={{ text: 'Kom i gang', href: '/kom-i-gang' }}
          />

          <FeatureRow
            reversed
            label="Kundedialog"
            title="Vi tager os af"
            titleAccent="hele gæstedialogen"
            description="Før, under og efter opholdet — 24/7. Du slipper for at være på hele tiden, mens dine gæster får professionel og hurtig service."
            image={editorialDialog}
            imageAlt="Afslappet gæsteoplevelse ved et dansk sommerhus"
            link={{ text: 'Læs mere om vores service', href: '/how-it-works' }}
          />

          <FeatureRow
            label="Slutrengøring"
            title="Altid klar til"
            titleAccent="næste gæst"
            description="Vi koordinerer professionel slutrengøring gennem lokale samarbejdspartnere. Din bolig fremstår indbydende og præsentabel — uden at du selv skal stå med det praktiske."
            image={editorialCleaning}
            imageAlt="Rent soveværelse i skandinavisk sommerhus"
            link={{ text: 'Se vores standarder', href: '/how-it-works' }}
          />

          <FeatureRow
            reversed
            label="Eksponering"
            title="Din bolig på alle"
            titleAccent="de rigtige kanaler"
            description="Vi lister din bolig på Airbnb, Booking.com, Vrbo og SommerVibes.dk — og markedsfører den aktivt via sociale medier og målrettede kampagner."
            image={editorialExposure}
            imageAlt="Dansk sommerhusområde ved kysten"
            link={{ text: 'Se portalerne', href: '/how-it-works' }}
          />
        </div>

        {/* Subtle extras */}
        <ExtrasStrip />

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="mt-20 md:mt-28 text-center"
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
