import { motion, AnimatePresence } from 'framer-motion';
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
  const [active, setActive] = useState(0);

  return (
    <section ref={ref} className="py-20 md:py-28 bg-muted/20 overflow-hidden">
      <div className="container mx-auto px-4 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <span className="text-accent font-body text-sm font-semibold tracking-[0.3em] uppercase block mb-3">
            Derfor SommerVibes
          </span>
          <h2 className="font-display text-3xl md:text-5xl font-bold text-primary leading-tight max-w-3xl mx-auto">
            Alt du har brug for —{' '}
            <span className="text-accent italic font-normal">samlet ét sted</span>
          </h2>
        </motion.div>

        {/* Interactive tab selector + content */}
        <div className="max-w-4xl mx-auto">
          {/* Tab buttons — horizontal scroll on mobile */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex gap-2 overflow-x-auto pb-2 mb-8 scrollbar-hide"
          >
            {props.map((p, i) => {
              const Icon = p.icon;
              return (
                <button
                  key={i}
                  onClick={() => setActive(i)}
                  className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl border whitespace-nowrap transition-all duration-400 flex-shrink-0 ${
                    active === i
                      ? 'bg-primary text-primary-foreground border-primary shadow-lg'
                      : 'bg-background border-border hover:border-accent/30 hover:bg-accent/5 text-muted-foreground'
                  }`}
                >
                  <Icon className={`w-4 h-4 flex-shrink-0 ${active === i ? 'text-accent' : ''}`} />
                  <span className="text-sm font-semibold">{p.title}</span>
                </button>
              );
            })}
          </motion.div>

          {/* Active content card */}
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="bg-background rounded-3xl border border-border p-8 md:p-12 shadow-sm"
            >
              <div className="flex items-start gap-6">
                <div className="w-16 h-16 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center flex-shrink-0">
                  {(() => {
                    const Icon = props[active].icon;
                    return <Icon className="w-7 h-7 text-accent" />;
                  })()}
                </div>
                <div className="flex-1">
                  <h3 className="font-display text-2xl md:text-3xl font-bold text-primary mb-3">
                    {props[active].title}
                  </h3>
                  <p className="text-muted-foreground text-base md:text-lg leading-relaxed max-w-lg">
                    {props[active].desc}
                  </p>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Dot indicators */}
          <div className="flex justify-center gap-2 mt-6">
            {props.map((_, i) => (
              <button
                key={i}
                onClick={() => setActive(i)}
                className={`h-1.5 rounded-full transition-all duration-400 ${
                  i === active ? 'w-8 bg-accent' : 'w-2 bg-border hover:bg-muted-foreground/30'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
