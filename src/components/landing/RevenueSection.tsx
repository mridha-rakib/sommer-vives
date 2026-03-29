import { motion } from 'framer-motion';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { Zap, BedDouble, Clock, Sparkles, TrendingUp, ArrowRight, Droplets, Flame, Shirt, Dog, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const categories = [
  {
    icon: Zap,
    title: 'Forbrugsafregning',
    share: 8,
    subtitle: 'Gæsten betaler forbrug — du beholder overskuddet',
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
    subtitle: 'Linnedpakker og ekstra komfort faktureres gæsten',
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
    subtitle: 'Gæster betaler ekstra for frihed — du bestemmer tilbuddene',
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
    subtitle: 'Rengøring og forsikring betalt af gæsten — ikke dig',
    details: [
      { icon: Sparkles, label: 'Slutrengøring', amount: '800-1.500 kr.' },
      { icon: ShieldCheck, label: 'Skadesforsikring', amount: '150-300 kr.' },
      { icon: Flame, label: 'Brænde & grill', amount: '100-250 kr.' },
    ],
  },
];

export function RevenueSection() {
  const { ref, isInView } = useScrollReveal();
  const [activeCategory, setActiveCategory] = useState(0);

  return (
    <section ref={ref} className="section-padding relative overflow-hidden bg-background">
      <div className="container mx-auto relative">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center mb-14 md:mb-20"
        >
          <span className="inline-flex items-center gap-2 bg-accent/8 border border-accent/15 rounded-full px-4 py-1.5 text-accent font-body text-xs font-semibold tracking-[0.2em] uppercase mb-5">
            <TrendingUp className="w-3.5 h-3.5" />
            Kun hos SommerVibes
          </span>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Op til <span className="text-accent italic font-normal">+20%</span> merindtjening
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto text-sm md:text-base leading-relaxed">
            Andre bureauer beholder tillægsindtægter. Hos os går alt til dig.
          </p>
        </motion.div>

        {/* Two-column: left = category nav, right = details */}
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-6 md:gap-10">
            {/* Left — Category selector */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex md:flex-col gap-2"
            >
              {categories.map((cat, i) => {
                const Icon = cat.icon;
                const isActive = activeCategory === i;
                return (
                  <button
                    key={i}
                    onClick={() => setActiveCategory(i)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-400 text-left flex-1 md:flex-none ${
                      isActive
                        ? 'bg-accent/8 border border-accent/20'
                        : 'bg-transparent border border-transparent hover:bg-muted/50'
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                      isActive ? 'bg-accent/15' : 'bg-muted'
                    }`}>
                      <Icon className={`w-4 h-4 ${isActive ? 'text-accent' : 'text-muted-foreground'}`} />
                    </div>
                    <div className="hidden md:block flex-1 min-w-0">
                      <p className={`text-sm font-semibold transition-colors ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {cat.title}
                      </p>
                      <p className={`text-[10px] font-display font-bold ${isActive ? 'text-accent' : 'text-muted-foreground/50'}`}>
                        +{cat.share}%
                      </p>
                    </div>
                    {/* Mobile: just icon + pct */}
                    <span className="md:hidden font-display text-xs font-bold text-accent">
                      +{cat.share}%
                    </span>
                  </button>
                );
              })}
            </motion.div>

            {/* Right — Detail panel */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="relative"
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeCategory}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.35 }}
                >
                  {/* Category header */}
                  <div className="mb-6">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-display text-xl md:text-2xl font-bold text-foreground">
                        {categories[activeCategory].title}
                      </h3>
                      <span className="font-display text-lg md:text-xl font-bold text-accent">
                        +{categories[activeCategory].share}%
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {categories[activeCategory].subtitle}
                    </p>
                  </div>

                  {/* Detail items */}
                  <div className="space-y-3">
                    {categories[activeCategory].details.map((detail, j) => {
                      const DetailIcon = detail.icon;
                      return (
                        <motion.div
                          key={j}
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: j * 0.1 }}
                          className="flex items-center gap-4 p-3 rounded-xl border border-border/50 hover:border-accent/20 hover:bg-accent/3 transition-all duration-300 group"
                        >
                          <div className="w-8 h-8 rounded-lg bg-accent/8 group-hover:bg-accent/15 flex items-center justify-center transition-colors">
                            <DetailIcon className="w-4 h-4 text-accent/70" />
                          </div>
                          <span className="flex-1 text-sm font-medium text-foreground">{detail.label}</span>
                          <span className="text-sm font-display font-bold text-accent/80">{detail.amount}</span>
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>
              </AnimatePresence>
            </motion.div>
          </div>

          {/* Bottom CTA — clean inline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="mt-12 md:mt-16 text-center"
          >
            <p className="text-muted-foreground text-sm mb-4">
              Traditionelle bureauer beholder disse indtægter. Hos SommerVibes er de <strong className="text-foreground">dine</strong>.
            </p>
            <Link to="/priser">
              <Button variant="gold" size="lg" className="gap-2 group">
                Se priseksempler
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
