import { motion } from 'framer-motion';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { Percent, Globe, Camera, Clock, Shield, Headphones } from 'lucide-react';

const props = [
  { icon: Percent, title: 'Lav kommission', desc: 'Kun 15% i kommission – behold mere af din indtjening. Gæster betaler kun 5% servicegebyr.' },
  { icon: Globe, title: 'Bred eksponering', desc: 'Dit sommerhus vises på Airbnb, Booking.com, VRBO og vores egne kanaler.' },
  { icon: Camera, title: 'Professionel foto', desc: 'Vi sørger for at dit hus præsenterer sig fra sin allerbedste side.' },
  { icon: Headphones, title: 'Vi klarer alt', desc: 'Gæstekontakt, check-in, support og koordinering — du læner dig bare tilbage.' },
  { icon: Clock, title: 'Ingen binding', desc: 'Fleksibel aftale — du kan altid opsige uden varsel.' },
  { icon: Shield, title: 'Personlig kontakt', desc: 'Ét menneske du kan ringe til. Altid klar.' },
];

export function ValuePropsSection() {
  const { ref, isInView } = useScrollReveal();

  return (
    <section ref={ref} className="py-24 md:py-32 bg-background">
      <div className="container mx-auto px-4 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <span className="text-accent font-body text-sm font-semibold tracking-[0.3em] uppercase block mb-4">
            Derfor SommerVibes
          </span>
          <h2 className="font-display text-3xl md:text-5xl font-bold text-primary leading-tight max-w-3xl mx-auto">
            Alt du har brug for — samlet ét sted
          </h2>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-6xl mx-auto">
          {props.map((p, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="group bg-card rounded-2xl border border-border p-7 hover:shadow-elevated hover:border-accent/30 transition-all duration-500 hover:-translate-y-1"
            >
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-5 group-hover:bg-accent/20 transition-colors duration-300">
                <p.icon className="w-6 h-6 text-accent" />
              </div>
              <h3 className="font-display text-xl font-bold text-primary mb-2">{p.title}</h3>
              <p className="text-muted-foreground leading-relaxed text-sm">{p.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
