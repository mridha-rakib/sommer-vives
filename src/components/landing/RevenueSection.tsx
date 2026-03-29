import { motion } from 'framer-motion';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { Zap, BedDouble, Clock, Sparkles, TrendingUp, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const categories = [
  {
    icon: Zap,
    title: 'Forbrugsafregning',
    share: 8,
    highlight: 'Op til 1.500 kr./uge',
    items: ['Elforbrug', 'Vandforbrug', 'Varme & gas'],
    desc: 'Gæsten betaler det reelle forbrug. Andre bureauer beholder dette — hos os går det direkte til dig.',
  },
  {
    icon: BedDouble,
    title: 'Tillægspakker',
    share: 5,
    highlight: '75-200 kr./person',
    items: ['Sengepakker', 'Håndklæder', 'Velkomstpakke'],
    desc: 'Linnedpakker, håndklæder og velkomstpakker faktureres som tillæg direkte til gæsten.',
  },
  {
    icon: Clock,
    title: 'Fleksibilitet',
    share: 4,
    highlight: '200-500 kr./tilvalg',
    items: ['Tidlig check-in', 'Sen check-out', 'Husdyrtillæg'],
    desc: 'Gæster betaler gerne ekstra for fleksibilitet. Du bestemmer selv hvad du tilbyder.',
  },
  {
    icon: Sparkles,
    title: 'Service & gebyrer',
    share: 3,
    highlight: '800-1.500 kr./ophold',
    items: ['Slutrengøring', 'Skadesforsikring', 'Brænde & grill'],
    desc: 'Slutrengøring og forsikring faktureres gæsten. Du har ingen udgifter — kun indtægt.',
  },
];

const totalShare = categories.reduce((sum, c) => sum + c.share, 0);

export function RevenueSection() {
  const { ref, isInView } = useScrollReveal();
  const [activeCard, setActiveCard] = useState<number | null>(null);

  return (
    <section ref={ref} className="section-padding bg-primary relative overflow-hidden">
      {/* Subtle background texture */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--accent)/0.06),transparent_70%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,hsl(var(--accent)/0.04),transparent_60%)]" />

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

        {/* Visual bar — full width */}
        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          animate={isInView ? { opacity: 1, scaleX: 1 } : {}}
          transition={{ duration: 1, delay: 0.3 }}
          className="mb-10 md:mb-14 max-w-2xl mx-auto origin-left"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="flex-1 flex h-3 rounded-full overflow-hidden bg-primary-foreground/5 border border-primary-foreground/10">
              {categories.map((cat, i) => (
                <motion.div
                  key={i}
                  initial={{ width: 0 }}
                  animate={isInView ? { width: `${(cat.share / totalShare) * 100}%` } : {}}
                  transition={{ duration: 0.8, delay: 0.5 + i * 0.2 }}
                  onMouseEnter={() => setActiveCard(i)}
                  className={`h-full transition-all duration-300 cursor-pointer relative ${
                    activeCard === i ? 'brightness-125 z-10' : 'brightness-100'
                  }`}
                  style={{
                    background: `linear-gradient(90deg, hsl(var(--accent) / ${0.5 + i * 0.12}), hsl(var(--accent) / ${0.7 + i * 0.08}))`,
                  }}
                />
              ))}
            </div>
            <span className="font-display text-xl md:text-2xl font-bold text-accent whitespace-nowrap">+{totalShare}%</span>
          </div>
          <div className="flex justify-between px-1">
            {categories.map((cat, i) => (
              <span
                key={i}
                className={`text-[9px] md:text-[10px] font-medium transition-colors cursor-pointer ${
                  activeCard === i ? 'text-accent' : 'text-primary-foreground/30'
                }`}
                onMouseEnter={() => setActiveCard(i)}
              >
                +{cat.share}%
              </span>
            ))}
          </div>
        </motion.div>

        {/* Category cards grid */}
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
                    ? 'bg-accent/10 border-accent/30 shadow-[0_0_40px_-10px_hsl(var(--accent)/0.2)]'
                    : 'bg-primary-foreground/3 border-primary-foreground/8 hover:border-accent/20'
                }`}
              >
                {/* Top shimmer on active */}
                <div className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-accent/50 to-transparent transition-opacity duration-500 ${isActive ? 'opacity-100' : 'opacity-0'}`} />

                <div className="p-4 sm:p-5">
                  {/* Icon + share */}
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors duration-300 ${
                      isActive ? 'bg-accent/20' : 'bg-primary-foreground/5'
                    }`}>
                      <Icon className={`w-5 h-5 transition-colors duration-300 ${isActive ? 'text-accent' : 'text-primary-foreground/40'}`} />
                    </div>
                    <span className={`font-display text-2xl font-bold transition-colors duration-300 ${
                      isActive ? 'text-accent' : 'text-primary-foreground/20'
                    }`}>
                      +{cat.share}%
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="font-display text-sm md:text-base font-bold text-primary-foreground mb-2">
                    {cat.title}
                  </h3>

                  {/* Description */}
                  <p className="text-[11px] md:text-xs text-primary-foreground/50 leading-relaxed mb-4">
                    {cat.desc}
                  </p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {cat.items.map((item, j) => (
                      <span
                        key={j}
                        className={`text-[9px] md:text-[10px] px-2 py-0.5 rounded-full font-medium transition-colors duration-300 ${
                          isActive
                            ? 'bg-accent/15 text-accent/90'
                            : 'bg-primary-foreground/5 text-primary-foreground/40'
                        }`}
                      >
                        {item}
                      </span>
                    ))}
                  </div>

                  {/* Highlight amount */}
                  <div className={`flex items-center gap-2 pt-3 border-t transition-colors duration-300 ${
                    isActive ? 'border-accent/15' : 'border-primary-foreground/5'
                  }`}>
                    <CheckCircle2 className={`w-3.5 h-3.5 transition-colors ${isActive ? 'text-accent' : 'text-primary-foreground/20'}`} />
                    <span className={`text-xs font-semibold transition-colors ${isActive ? 'text-accent' : 'text-primary-foreground/40'}`}>
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
          <div className="inline-flex flex-col sm:flex-row items-center gap-4 bg-accent/5 border border-accent/15 rounded-2xl px-6 py-5 backdrop-blur-sm">
            <div className="text-center sm:text-left">
              <p className="font-display text-base md:text-lg font-bold text-primary-foreground">
                Andre bureauer beholder dine tillægsindtægter
              </p>
              <p className="text-xs md:text-sm text-primary-foreground/50 mt-0.5">
                Hos SommerVibes beholder du alt — vi tager kun 15% af lejeindtægten
              </p>
            </div>
            <Link to="/kom-i-gang" className="flex-shrink-0">
              <Button variant="gold" size="lg" className="gap-2 group">
                Beregn din indtægt
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}