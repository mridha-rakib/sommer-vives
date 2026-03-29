import { motion } from 'framer-motion';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { Percent, Globe, Camera, Clock, Shield, Headphones } from 'lucide-react';
import { useState } from 'react';

const props = [
  { icon: Percent, title: 'Kun 15% kommission', desc: 'Behold mere af din indtjening. Ingen skjulte gebyrer — gæster betaler kun 5% servicegebyr.' },
  { icon: Globe, title: 'Bred eksponering', desc: 'Dit sommerhus vises på Airbnb, Booking.com, VRBO og vores egne kanaler.' },
  { icon: Camera, title: 'Professionel præsentation', desc: 'Vi sørger for at dit hus præsenterer sig fra sin allerbedste side med professionelt indhold.' },
  { icon: Headphones, title: 'Vi klarer alt', desc: 'Gæstekontakt, check-in, support og koordinering — du læner dig bare tilbage.' },
  { icon: Clock, title: '6 mdr. binding', desc: 'Tryghed for begge parter. Herefter 100% fleksibelt — opsig når du vil.' },
  { icon: Shield, title: 'Personlig kontakt', desc: 'Ét menneske du kan ringe til. Din dedikerede kontaktperson fra dag 1.' },
];

export function ValuePropsSection() {
  const { ref, isInView } = useScrollReveal();
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  return (
    <section ref={ref} className="py-28 md:py-36 bg-muted/20 overflow-hidden">
      <div className="container mx-auto px-4 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center mb-20"
        >
          <span className="text-accent font-body text-sm font-semibold tracking-[0.3em] uppercase block mb-4">
            Derfor SommerVibes
          </span>
          <h2 className="font-display text-3xl md:text-5xl lg:text-6xl font-bold text-primary leading-tight max-w-3xl mx-auto">
            Alt du har brug for —{' '}
            <span className="text-accent italic font-normal">samlet ét sted</span>
          </h2>
        </motion.div>

        {/* Minimal flowing list instead of boxy grid */}
        <div className="max-w-4xl mx-auto space-y-0">
          {props.map((p, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              onMouseEnter={() => setActiveIndex(i)}
              onMouseLeave={() => setActiveIndex(null)}
              className={`group flex items-start gap-6 py-8 border-b border-border/50 last:border-0 cursor-default transition-all duration-500 ${
                activeIndex !== null && activeIndex !== i ? 'opacity-30' : 'opacity-100'
              }`}
            >
              <div className={`w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-500 ${
                activeIndex === i
                  ? 'bg-accent/15 scale-110'
                  : 'bg-muted'
              }`}>
                <p.icon className={`w-5 h-5 transition-colors duration-500 ${
                  activeIndex === i ? 'text-accent' : 'text-muted-foreground'
                }`} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className={`font-display text-xl md:text-2xl font-bold mb-2 transition-colors duration-300 ${
                  activeIndex === i ? 'text-accent' : 'text-primary'
                }`}>
                  {p.title}
                </h3>
                <motion.p
                  className="text-muted-foreground leading-relaxed text-base max-w-lg"
                  animate={{ 
                    height: activeIndex === i ? 'auto' : 'auto',
                    opacity: activeIndex === null || activeIndex === i ? 1 : 0.5 
                  }}
                  transition={{ duration: 0.3 }}
                >
                  {p.desc}
                </motion.p>
              </div>
              <motion.div
                className="hidden md:flex items-center justify-center w-10 h-10 rounded-full"
                animate={{
                  scale: activeIndex === i ? 1 : 0.8,
                  opacity: activeIndex === i ? 1 : 0,
                }}
                transition={{ duration: 0.3 }}
              >
                <div className="w-2 h-2 rounded-full bg-accent" />
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
