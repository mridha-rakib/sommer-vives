import { motion } from 'framer-motion';
import { useScrollReveal } from '@/hooks/useScrollReveal';

const logos = [
  { name: 'Airbnb', svg: 'M12 2C7.6 2 4 5.4 4 9.5c0 4.3 8 12.5 8 12.5s8-8.2 8-12.5C20 5.4 16.4 2 12 2z' },
  { name: 'Booking.com', svg: 'M3 3h18v18H3V3zm4 4v10h10V7H7z' },
  { name: 'VRBO', svg: 'M2 12l10-10 10 10-10 10L2 12z' },
  { name: 'Feriepartner', svg: 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5' },
];

const stats = [
  { value: '250+', label: 'Sommerhuse vurderet' },
  { value: '98%', label: 'Ejertilfredshed' },
  { value: '4.9/5', label: 'Gennemsnitlig rating' },
  { value: '2 uger', label: 'Til første booking' },
];

export function SocialProofSection() {
  const { ref, isInView } = useScrollReveal();

  return (
    <section ref={ref} className="py-16 md:py-20 bg-background border-b border-border">
      <div className="container mx-auto px-4 md:px-8">
        {/* Partner logos */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <p className="text-sm text-muted-foreground mb-6 font-body tracking-wide uppercase">
            Dit hus markedsføres på
          </p>
          <div className="flex items-center justify-center gap-8 md:gap-16 flex-wrap">
            {['Airbnb', 'Booking.com', 'VRBO', 'Feriepartner', 'Google'].map((name, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.4, delay: 0.1 * i }}
                className="text-muted-foreground/40 hover:text-muted-foreground/70 transition-colors"
              >
                <span className="font-display text-lg md:text-xl font-bold tracking-tight">{name}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.3 + i * 0.1 }}
              className="text-center"
            >
              <div className="font-display text-3xl md:text-4xl font-bold text-primary">{stat.value}</div>
              <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
