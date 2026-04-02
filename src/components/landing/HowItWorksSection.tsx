import { motion } from 'framer-motion';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

const steps = [
  {
    number: '01',
    title: 'Del dit hus med os',
    description: 'Opret din bolig online på fem minutter — eller ring, og vi guider dig igennem.',
  },
  {
    number: '02',
    title: 'Vi gør det præsentabelt',
    description: 'Vi besøger dit hus, tager professionelle billeder og skriver en listing, der tiltrækker de rigtige gæster.',
  },
  {
    number: '03',
    title: 'Din bolig går live',
    description: 'Vi publicerer på Airbnb, Booking.com og vores egne kanaler — og optimerer løbende for at skabe synlighed.',
  },
  {
    number: '04',
    title: 'Du følger med fra sofaen',
    description: 'Bookinger, gæstekontakt og drift håndteres af os. Du får overblik og udbetaling direkte til din konto.',
  },
];

export function HowItWorksSection() {
  const { ref, isInView } = useScrollReveal();

  return (
    <section ref={ref} className="py-16 md:py-36 bg-card text-foreground overflow-hidden">
      <div className="container mx-auto px-4 md:px-8">
        <div className="max-w-5xl mx-auto">
          {/* Centered header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7 }}
            className="text-center mb-20"
          >
            <span className="text-primary font-body text-sm font-semibold tracking-[0.3em] uppercase block mb-4">
              Sådan virker det
            </span>
            <h2 className="font-display text-3xl md:text-5xl lg:text-6xl font-bold leading-tight">
              Fra oprettelse
              <span className="block text-primary italic font-normal">til indtjening</span>
            </h2>
          </motion.div>

          {/* Horizontal timeline on desktop */}
          <div className="grid md:grid-cols-4 gap-0 relative">
            {/* Connecting line */}
            <div className="hidden md:block absolute top-8 left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-primary/10 via-primary/30 to-primary/10" />

            {steps.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.2 + i * 0.15 }}
                className="text-center px-4 relative"
              >
                {/* Step circle */}
                <div className="w-16 h-16 rounded-full border border-primary/20 bg-card flex items-center justify-center mx-auto mb-6 relative z-10">
                  <span className="font-display text-xl font-bold text-primary">{step.number}</span>
                </div>
                <h3 className="font-display text-lg md:text-xl font-bold mb-3">
                  {step.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ duration: 0.5, delay: 0.8 }}
            className="text-center mt-16"
          >
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/kom-i-gang">
                <Button variant="gold" size="lg" className="gap-2 group rounded-full">
                  Opret dit hus nu
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link to="/contact">
                <Button variant="outline" size="lg" className="border-border text-muted-foreground hover:bg-muted hover:text-foreground rounded-full">
                  Book et udlejningstjek
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
