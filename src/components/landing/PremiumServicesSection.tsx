import { motion } from 'framer-motion';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { ArrowRight, Megaphone, MessageCircle, SparklesIcon, Globe, Key, Shield, TrendingUp, Settings, Wrench, UserCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

import heroInterior from '@/assets/services/hero-interior.jpg';

/* ── Animations ── */
const fade = (inView: boolean, delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  animate: inView ? { opacity: 1, y: 0 } : {},
  transition: { duration: 0.8, delay, ease: 'easeOut' as const },
});

/* ── Core services ── */
const services = [
  { icon: Megaphone, title: 'BOOST-markedsføring', desc: '4 ugers gratis synlighed i DK, DE og NL ved opstart.' },
  { icon: MessageCircle, title: 'Gæstedialog 24/7', desc: 'Vi håndterer al kommunikation — før, under og efter ophold.' },
  { icon: SparklesIcon, title: 'Professionel rengøring', desc: 'Koordineret slutrengøring via lokale samarbejdspartnere.' },
  { icon: Globe, title: 'Multi-kanal eksponering', desc: 'Airbnb, Booking.com, Vrbo og SommerVibes.dk — samlet.' },
];

/* ── Extra benefits ── */
const extras = [
  { icon: Key, title: 'Nøgleservice' },
  { icon: Shield, title: 'Tryghedsgaranti' },
  { icon: TrendingUp, title: 'Merindtjening' },
  { icon: Settings, title: 'Fuld fleksibilitet' },
  { icon: Wrench, title: 'Vedligeholdelse' },
  { icon: UserCheck, title: 'Personlig rådgiver' },
];

export function PremiumServicesSection() {
  const { ref, isInView } = useScrollReveal();
  const { ref: ref2, isInView: isInView2 } = useScrollReveal();

  return (
    <section className="py-20 md:py-28 bg-background">
      <div className="container mx-auto px-5 md:px-10 max-w-[1100px]">

        {/* ── Hero: image with text overlay ── */}
        <div ref={ref} className="relative rounded-2xl overflow-hidden mb-16 md:mb-20">
          <motion.img
            src={heroInterior}
            alt="Moderne skandinavisk sommerhus"
            className="w-full aspect-[2.4/1] min-h-[280px] max-h-[420px] object-cover"
            initial={{ scale: 1.04 }}
            animate={isInView ? { scale: 1 } : {}}
            transition={{ duration: 1.2, ease: 'easeOut' }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#1a2e1a]/95 via-[#1a2e1a]/70 to-transparent" />
          <motion.div {...fade(isInView, 0.1)} className="absolute inset-0 flex flex-col justify-center px-7 md:px-12 lg:px-16">
            <div className="max-w-[440px]">
              <span className="text-accent/50 text-[9px] font-semibold tracking-[0.35em] uppercase block mb-3">
                SommerVibes Fordele
              </span>
              <h2 className="font-display text-[1.5rem] md:text-[2rem] lg:text-[2.4rem] font-semibold text-white leading-[1.08] tracking-[-0.02em] mb-3">
                Ekstraordinær service
                <span className="block text-accent italic font-normal mt-0.5">hos SommerVibes</span>
              </h2>
              <p className="text-white/55 text-[14px] leading-[1.7] mb-5 max-w-[360px]">
                En personlig og moderne udlejningsoplevelse — fra start til slut.
              </p>
              <Link
                to="/how-it-works"
                className="inline-flex items-center gap-2 text-white/65 text-[12px] font-medium hover:text-white transition-colors group"
              >
                Se hvordan det virker
                <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </motion.div>
        </div>

        {/* ── 4 Core services — compact grid ── */}
        <div ref={ref2} className="grid sm:grid-cols-2 gap-x-10 gap-y-8 mb-16 md:mb-20">
          {services.map((s, i) => {
            const Icon = s.icon;
            return (
              <motion.div key={i} {...fade(isInView2, 0.06 * i)} className="flex gap-4 items-start">
                <div className="w-9 h-9 rounded-lg bg-white/[0.06] flex items-center justify-center shrink-0 mt-0.5">
                  <Icon className="w-4 h-4 text-accent/70" strokeWidth={1.5} />
                </div>
                <div>
                  <h3 className="font-display text-[15px] font-semibold text-white/90 mb-1">{s.title}</h3>
                  <p className="text-white/40 text-[13px] leading-[1.6]">{s.desc}</p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* ── Divider line ── */}
        <div className="w-full h-px bg-white/[0.06] mb-10" />

        {/* ── Extra benefits — single compact row ── */}
        <motion.div {...fade(isInView2, 0.3)} className="flex flex-wrap justify-center gap-x-8 gap-y-4 mb-14">
          {extras.map((e, i) => {
            const Icon = e.icon;
            return (
              <div key={i} className="flex items-center gap-2 text-white/35">
                <Icon className="w-3.5 h-3.5 text-accent/40" strokeWidth={1.5} />
                <span className="text-[12px] font-medium">{e.title}</span>
              </div>
            );
          })}
        </motion.div>

        {/* ── CTA ── */}
        <motion.div {...fade(isInView2, 0.4)} className="text-center">
          <Link
            to="/kom-i-gang"
            className="btn-gold inline-flex items-center gap-2.5 px-7 py-3.5 rounded-xl text-sm"
          >
            Bliv kontaktet i dag
            <ArrowRight className="w-3.5 h-3.5" strokeWidth={2} />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
