import { motion } from 'framer-motion';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { Percent, Globe, Camera, Clock, Shield, Headphones } from 'lucide-react';

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

  return (
    <section ref={ref} className="py-28 md:py-36 bg-background overflow-hidden">
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

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px max-w-6xl mx-auto bg-border rounded-3xl overflow-hidden border border-border">
          {props.map((p, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0 }}
              animate={isInView ? { opacity: 1 } : {}}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="group bg-card p-8 md:p-10 hover:bg-accent/[0.03] transition-all duration-500 relative"
            >
              <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center mb-6 group-hover:bg-accent/15 transition-colors duration-500">
                <p.icon className="w-5 h-5 text-accent" />
              </div>
              <h3 className="font-display text-lg md:text-xl font-bold text-primary mb-3">{p.title}</h3>
              <p className="text-muted-foreground leading-relaxed text-sm md:text-base">{p.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
