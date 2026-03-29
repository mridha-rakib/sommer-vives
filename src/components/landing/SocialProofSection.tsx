import { motion } from 'framer-motion';
import { useScrollReveal } from '@/hooks/useScrollReveal';

const stats = [
  { value: '250+', label: 'Sommerhuse vurderet' },
  { value: '98%', label: 'Ejertilfredshed' },
  { value: '4.9', label: 'Gennemsnitlig rating' },
  { value: '2 uger', label: 'Til første booking' },
];

const channels = ['Airbnb', 'Booking.com', 'VRBO', 'Feriepartner', 'Google'];

export function SocialProofSection() {
  const { ref, isInView } = useScrollReveal();

  return (
    <section ref={ref} className="relative bg-background border-b border-border">
      {/* Stats */}
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-border">
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="py-10 md:py-14 text-center"
            >
              <div className="font-display text-3xl md:text-5xl font-bold text-primary mb-1">
                {stat.value}
              </div>
              <div className="text-xs md:text-sm text-muted-foreground font-body tracking-wide uppercase">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Channel strip */}
      <div className="border-t border-border">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-center gap-3">
            <span className="text-[10px] text-muted-foreground/50 font-body tracking-[0.2em] uppercase mr-3 hidden sm:block">
              Markedsføres på
            </span>
            {channels.map((name, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0 }}
                animate={isInView ? { opacity: 1 } : {}}
                transition={{ duration: 0.4, delay: 0.4 + i * 0.08 }}
                className="text-muted-foreground/30 font-display text-sm md:text-base font-bold tracking-tight"
              >
                {name}
              </motion.span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
