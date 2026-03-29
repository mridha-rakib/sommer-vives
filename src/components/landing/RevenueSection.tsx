import { motion, AnimatePresence } from 'framer-motion';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { Zap, BedDouble, Clock, Sparkles, TrendingUp, ArrowRight, CheckCircle2, Droplets, Flame, Shirt, Dog, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const categories = [
  {
    icon: Zap,
    title: 'Forbrugsafregning',
    share: 8,
    highlight: 'Op til 1.500 kr./uge',
    desc: 'Gæsten betaler det reelle forbrug af el, vand og varme. Du tjener på det — ikke bureauet.',
    details: [
      { icon: Zap, label: 'Elforbrug', amount: 'Op til 500 kr./uge' },
      { icon: Droplets, label: 'Vand', amount: '150-300 kr./uge' },
      { icon: Flame, label: 'Varme & gas', amount: 'Op til 500 kr./uge' },
    ],
  },
  {
    icon: BedDouble,
    title: 'Tillægspakker',
    share: 5,
    highlight: '75-200 kr./person',
    desc: 'Linnedpakker, håndklæder og velkomstpakker faktureres som tillæg direkte til gæsten.',
    details: [
      { icon: BedDouble, label: 'Sengepakker', amount: '75-150 kr./person' },
      { icon: Shirt, label: 'Håndklæder', amount: '50-100 kr./sæt' },
      { icon: Sparkles, label: 'Velkomstpakke', amount: '150-350 kr.' },
    ],
  },
  {
    icon: Clock,
    title: 'Fleksibilitet',
    share: 4,
    highlight: '200-500 kr./tilvalg',
    desc: 'Gæster betaler gerne ekstra for fleksibilitet. Du bestemmer selv hvad du tilbyder.',
    details: [
      { icon: Clock, label: 'Tidlig check-in', amount: '200-400 kr.' },
      { icon: Clock, label: 'Sen check-out', amount: '200-400 kr.' },
      { icon: Dog, label: 'Husdyrtillæg', amount: '300-500 kr./ophold' },
    ],
  },
  {
    icon: Sparkles,
    title: 'Service & gebyrer',
    share: 3,
    highlight: '800-1.500 kr./ophold',
    desc: 'Slutrengøring og forsikring faktureres gæsten. Du har ingen udgifter — kun indtægt.',
    details: [
      { icon: Sparkles, label: 'Slutrengøring', amount: '800-1.500 kr.' },
      { icon: ShieldCheck, label: 'Skadesforsikring', amount: '150-300 kr.' },
      { icon: Flame, label: 'Brænde & grill', amount: '100-250 kr.' },
    ],
  },
];

const totalShare = categories.reduce((sum, c) => sum + c.share, 0);

export function RevenueSection() {
  const { ref, isInView } = useScrollReveal();
  const [activeCard, setActiveCard] = useState<number | null>(null);

  return (
    <section ref={ref} className="section-padding bg-primary relative overflow-hidden">
      {/* Subtle background glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--accent)/0.06),transparent_70%)]" />

      <div className="container mx-auto relative">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center mb-12 md:mb-16"
        >
          <span className="inline-flex items-center gap-2 bg-accent/10 border border-accent/20 rounded-full px-4 py-1.5 text-accent font-body text-xs font-semibold tracking-[0.2em] uppercase mb-5">
            <TrendingUp className="w-3.5 h-3.5" />
            Kun hos SommerVibes
          </span>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-primary-foreground mb-4">
            Op til <span className="text-accent italic font-normal">+20% merindtjening</span>
          </h2>
          <p className="text-primary-foreground/60 max-w-xl mx-auto text-sm md:text-base leading-relaxed">
            Traditionelle bureauer beholder tillægsindtægter. Hos os går alt til dig —
            forbrugsafregning, tillæg og gebyrer er <strong className="text-primary-foreground/80">dine penge</strong>.
          </p>
        </motion.div>

        {/* Visual bar */}
        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          animate={isInView ? { opacity: 1, scaleX: 1 } : {}}
          transition={{ duration: 1, delay: 0.3 }}
          className="mb-10 md:mb-14 max-w-2xl mx-auto origin-left"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="flex-1 flex h-2.5 rounded-full overflow-hidden bg-primary-foreground/5 border border-primary-foreground/10">
              {categories.map((cat, i) => (
                <motion.div
                  key={i}
                  initial={{ width: 0 }}
                  animate={isInView ? { width: `${(cat.share / totalShare) * 100}%` } : {}}
                  transition={{ duration: 0.8, delay: 0.5 + i * 0.2 }}
                  onMouseEnter={() => setActiveCard(i)}
                  className={`h-full transition-all duration-300 cursor-pointer`}
                  style={{
                    background: `linear-gradient(90deg, hsl(var(--accent) / ${0.4 + i * 0.15}), hsl(var(--accent) / ${0.6 + i * 0.1}))`,
                    opacity: activeCard === null || activeCard === i ? 1 : 0.3,
                  }}
                />
              ))}
            </div>
            <span className="font-display text-xl md:text-2xl font-bold text-accent whitespace-nowrap">+{totalShare}%</span>
          </div>
        </motion.div>

        {/* Category cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5 mb-12 md:mb-16">
          {categories.map((cat, i) => {
            const Icon = cat.icon;
            const isActive = activeCard === i;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 25 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.6 + i * 0.12 }}
                onMouseEnter={() => setActiveCard(i)}
                onMouseLeave={() => setActiveCard(null)}
                className={`group relative rounded-2xl border transition-all duration-500 cursor-default overflow-hidden ${
                  isActive
                    ? 'bg-accent/8 border-accent/25 shadow-[0_0_40px_-10px_hsl(var(--accent)/0.15)]'
                    : 'bg-primary-foreground/3 border-primary-foreground/8 hover:border-accent/15'
                }`}
              >
                {/* Top shimmer */}
                <div className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-accent/40 to-transparent transition-opacity duration-500 ${isActive ? 'opacity-100' : 'opacity-0'}`} />

                <div className="p-4 sm:p-5">
                  {/* Icon + share */}
                  <div className="flex items-center justify-between mb-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors duration-300 ${
                      isActive ? 'bg-accent/15' : 'bg-primary-foreground/5'
                    }`}>
                      <Icon className={`w-5 h-5 transition-colors duration-300 ${isActive ? 'text-accent' : 'text-primary-foreground/40'}`} />
                    </div>
                    <span className={`font-display text-2xl font-bold transition-colors duration-300 ${
                      isActive ? 'text-accent' : 'text-primary-foreground/15'
                    }`}>
                      +{cat.share}%
                    </span>
                  </div>

                  <h3 className="font-display text-sm md:text-base font-bold text-primary-foreground mb-1.5">
                    {cat.title}
                  </h3>
                  <p className="text-[11px] md:text-xs text-primary-foreground/45 leading-relaxed mb-4">
                    {cat.desc}
                  </p>

                  {/* Detail items — visible on hover/active */}
                  <AnimatePresence>
                    {isActive && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="space-y-2 mb-3 pt-3 border-t border-accent/10">
                          {cat.details.map((detail, j) => {
                            const DetailIcon = detail.icon;
                            return (
                              <motion.div
                                key={j}
                                initial={{ opacity: 0, x: 8 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.25, delay: j * 0.08 }}
                                className="flex items-center gap-2.5"
                              >
                                <DetailIcon className="w-3 h-3 text-accent/60 flex-shrink-0" />
                                <span className="flex-1 text-[11px] text-primary-foreground/60">{detail.label}</span>
                                <span className="text-[10px] font-semibold text-accent/70">{detail.amount}</span>
                              </motion.div>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Bottom highlight */}
                  <div className={`flex items-center gap-2 pt-3 border-t transition-colors duration-300 ${
                    isActive ? 'border-accent/10' : 'border-primary-foreground/5'
                  }`}>
                    <CheckCircle2 className={`w-3.5 h-3.5 transition-colors ${isActive ? 'text-accent' : 'text-primary-foreground/15'}`} />
                    <span className={`text-xs font-semibold transition-colors ${isActive ? 'text-accent' : 'text-primary-foreground/30'}`}>
                      {cat.highlight}
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 1.2 }}
          className="text-center"
        >
          <p className="text-primary-foreground/50 text-sm mb-5">
            Andre bureauer beholder disse indtægter. Hos SommerVibes er de <strong className="text-primary-foreground/80">dine</strong>.
          </p>
          <Link to="/kom-i-gang">
            <Button variant="gold" size="lg" className="gap-2 group">
              Beregn din indtægt
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
