import { motion } from 'framer-motion';
import { useScrollReveal } from '@/hooks/useScrollReveal';

const stats = [
  { value: '250+', label: 'Sommerhuse' },
  { value: '98%', label: 'Tilfredshed' },
  { value: '4.9', label: 'Rating' },
  { value: '2 uger', label: 'Til første booking' },
];

export function SocialProofSection() {
  const { ref, isInView } = useScrollReveal();

  return (
    <section ref={ref} className="relative bg-background">
      <div className="container mx-auto px-4 py-10 md:py-14">
        <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16">
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 15 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="text-center"
            >
              <div className="font-display text-3xl md:text-4xl font-bold text-primary">
                {stat.value}
              </div>
              <div className="text-[11px] text-muted-foreground/60 font-body tracking-[0.15em] uppercase mt-1">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Flowing channel marquee */}
        <div className="mt-8 overflow-hidden relative">
          <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-background to-transparent z-10" />
          <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-background to-transparent z-10" />
          <motion.div
            animate={{ x: [0, -400] }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            className="flex items-center gap-12 whitespace-nowrap"
          >
            {[...Array(3)].flatMap((_, rep) =>
              ['Airbnb', 'Booking.com', 'VRBO', 'Feriepartner', 'Google', 'Facebook', 'Instagram'].map((name, i) => (
                <span
                  key={`${rep}-${i}`}
                  className="text-muted-foreground/20 font-display text-sm font-bold tracking-tight"
                >
                  {name}
                </span>
              ))
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
