import { motion } from 'framer-motion';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { ArrowRight, Key, Shield, TrendingUp, Settings, Wrench, UserCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

import heroInterior from '@/assets/services/hero-interior.jpg';
import editorialBoost from '@/assets/services/editorial-boost.jpg';
import editorialDialog from '@/assets/services/editorial-dialog.jpg';
import editorialCleaning from '@/assets/services/editorial-cleaning.jpg';
import editorialExposure from '@/assets/services/editorial-exposure.jpg';

/* ═══════════════════════════════════════════
   ANIMATION
   ═══════════════════════════════════════════ */

const fade = (inView: boolean, delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: inView ? { opacity: 1, y: 0 } : {},
  transition: { duration: 0.9, delay, ease: 'easeOut' as const },
});

const imgReveal = (inView: boolean, delay = 0) => ({
  initial: { opacity: 0, scale: 1.03 },
  animate: inView ? { opacity: 1, scale: 1 } : {},
  transition: { duration: 1.1, delay, ease: 'easeOut' as const },
});

/* ═══════════════════════════════════════════
   1. IMMERSIVE HERO — full-width image + overlay
   ═══════════════════════════════════════════ */

function ImmersiveHero() {
  const { ref, isInView } = useScrollReveal();

  return (
    <div ref={ref} className="relative w-full rounded-2xl lg:rounded-3xl overflow-hidden mb-20 md:mb-28">
      {/* Background */}
      <motion.img
        src={heroInterior}
        alt="Premium skandinavisk sommerhus interiør"
        className="w-full aspect-[21/9] min-h-[380px] max-h-[560px] object-cover"
        initial={{ scale: 1.06 }}
        animate={isInView ? { scale: 1 } : {}}
        transition={{ duration: 1.4, ease: 'easeOut' }}
      />

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/45 to-transparent" />

      {/* Content */}
      <motion.div
        {...fade(isInView, 0.15)}
        className="absolute inset-0 flex flex-col justify-center px-8 md:px-14 lg:px-20"
      >
        <div className="max-w-[520px]">
          <span className="text-accent/50 font-body text-[10px] font-semibold tracking-[0.4em] uppercase block mb-5">
            SommerVibes Fordele
          </span>
          <h2 className="font-display text-[1.7rem] md:text-[2.4rem] lg:text-[3rem] font-semibold text-white leading-[1.06] tracking-[-0.02em] mb-5">
            Ekstraordinær service
            <span className="block text-accent italic font-normal mt-1">hos SommerVibes</span>
          </h2>
          <p className="text-white/65 text-[15px] leading-[1.75] mb-7 max-w-[400px]">
            En gennemsigtig, personlig og moderne udlejningsoplevelse — fra start til slut.
          </p>
          <Link
            to="/how-it-works"
            className="inline-flex items-center gap-2.5 text-white/75 text-[13px] font-medium hover:text-white transition-colors duration-300 group"
          >
            Se hvordan det virker
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform duration-300" />
          </Link>
        </div>
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
    <div ref={ref} className="grid lg:grid-cols-12 gap-8 lg:gap-14 items-center">
      <motion.div
        {...imgReveal(isInView)}
        className={`lg:col-span-7 overflow-hidden rounded-2xl ${reversed ? 'lg:order-2' : ''}`}
      >
        <img src={image} alt={imageAlt} loading="lazy" className="w-full aspect-[4/3] object-cover" />
      </motion.div>

      <motion.div {...fade(isInView, 0.12)} className={`lg:col-span-5 ${reversed ? 'lg:order-1' : ''}`}>
        <span className="text-accent/45 font-body text-[10px] font-semibold tracking-[0.35em] uppercase block mb-4">
          {label}
        </span>
        <h3 className="font-display text-[1.4rem] md:text-[1.75rem] font-semibold text-white leading-[1.12] tracking-[-0.01em] mb-4">
          {title}
          <span className="block text-accent italic font-normal mt-1">{titleAccent}</span>
        </h3>
        <p className="text-white/55 text-[14.5px] leading-[1.8] mb-5">{description}</p>
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
   3. VISUAL EXTRAS GRID — icons + cards
   ═══════════════════════════════════════════ */

const extras = [
  { icon: Key, title: 'Nøgleservice', desc: 'Smart digital adgang for gæster, rengøring og ejere.' },
  { icon: Shield, title: 'Tryghedsgaranti', desc: 'Udlejningsforsikring inkl. — ekstra sikkerhed ved hvert ophold.' },
  { icon: TrendingUp, title: 'Merindtjening', desc: 'Sengepakker, tidlig check-in og andre tilvalg øger din bundlinje.' },
  { icon: Settings, title: 'Fuld fleksibilitet', desc: 'Du bestemmer selv perioder, priser og omfanget af samarbejdet.' },
  { icon: Wrench, title: 'Service & reparation', desc: 'Vi koordinerer håndværkere, hvis noget opstår under udlejning.' },
  { icon: UserCheck, title: 'Personlig rådgiver', desc: 'Én fast kontaktperson, der kender dit hus og dine ønsker.' },
];

function ExtrasGrid() {
  const { ref, isInView } = useScrollReveal();

  return (
    <div ref={ref} className="mt-28 md:mt-36">
      <motion.div {...fade(isInView)} className="flex items-center gap-4 mb-12">
        <div className="w-8 h-px bg-accent/20" />
        <span className="text-accent/35 font-body text-[10px] font-semibold tracking-[0.35em] uppercase">
          Yderligere fordele
        </span>
      </motion.div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-14 gap-y-10">
        {extras.map((item, i) => {
          const Icon = item.icon;
          return (
            <motion.div key={i} {...fade(isInView, 0.05 * i)} className="flex gap-4">
              <Icon className="w-5 h-5 text-accent/60 mt-0.5 shrink-0" strokeWidth={1.5} />
              <div>
                <h4 className="font-display text-[15px] font-semibold text-white/85 mb-1">{item.title}</h4>
                <p className="text-white/40 text-[13px] leading-[1.65]">{item.desc}</p>
              </div>
            </motion.div>
          );
        })}
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
        <ImmersiveHero />

        <div className="space-y-20 md:space-y-28">
          <FeatureRow
            label="Markedsføring"
            title="SommerVibes BOOST"
            titleAccent="giver din bolig momentum"
            description="Når din bolig oprettes, inkluderer vi 4 ugers gratis BOOST-markedsføring med målrettet synlighed i Danmark, Tyskland og Holland."
            image={editorialBoost}
            imageAlt="Ejer administrerer sommerhusudlejning via smartphone"
            link={{ text: 'Kom i gang', href: '/kom-i-gang' }}
          />
          <FeatureRow
            reversed
            label="Kundedialog"
            title="Vi tager os af"
            titleAccent="hele gæstedialogen"
            description="Før, under og efter opholdet — 24/7. Du slipper for at være på hele tiden, mens dine gæster får professionel og hurtig service."
            image={editorialDialog}
            imageAlt="Gæster ankommer til et dansk sommerhus"
            link={{ text: 'Læs mere om vores service', href: '/how-it-works' }}
          />
          <FeatureRow
            label="Slutrengøring"
            title="Altid klar til"
            titleAccent="næste gæst"
            description="Vi koordinerer professionel slutrengøring gennem lokale samarbejdspartnere. Din bolig fremstår indbydende og præsentabel."
            image={editorialCleaning}
            imageAlt="Rent soveværelse i skandinavisk sommerhus"
            link={{ text: 'Se vores standarder', href: '/how-it-works' }}
          />
          <FeatureRow
            reversed
            label="Eksponering"
            title="Din bolig på alle"
            titleAccent="de rigtige kanaler"
            description="Vi lister din bolig på Airbnb, Booking.com, Vrbo og SommerVibes.dk — og markedsfører den aktivt via sociale medier."
            image={editorialExposure}
            imageAlt="Dansk sommerhusområde ved kysten"
            link={{ text: 'Se portalerne', href: '/how-it-works' }}
          />
        </div>

        <ExtrasGrid />

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
