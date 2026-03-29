import { motion } from 'framer-motion';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

const steps = [
  {
    number: '01',
    title: 'Opret dit hus',
    description: 'Del information og billeder af dit sommerhus. Det tager kun 5 minutter online.',
  },
  {
    number: '02',
    title: 'Vi vurderer & fotograferer',
    description: 'Vi kigger dit hus igennem og sørger for professionelt indhold der skaber bookinger.',
  },
  {
    number: '03',
    title: 'Vi markedsfører',
    description: 'Dit hus vises på alle de største portaler og vores egne kanaler med optimal prissætning.',
  },
  {
    number: '04',
    title: 'Du tjener',
    description: 'Bookinger ruller ind. Gennemsigtige udbetalinger direkte til din konto.',
  },
];

export function HowItWorksSection() {
  const { ref, isInView } = useScrollReveal();

  return (
    <section ref={ref} className="py-28 md:py-36 bg-primary text-primary-foreground overflow-hidden">
      <div className="container mx-auto px-4 md:px-8">
        <div className="max-w-5xl mx-auto">
          {/* Centered header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7 }}
            className="text-center mb-20"
          >
            <span className="text-accent font-body text-sm font-semibold tracking-[0.3em] uppercase block mb-4">
              Sådan virker det
            </span>
            <h2 className="font-display text-3xl md:text-5xl lg:text-6xl font-bold leading-tight">
              Fra oprettelse
              <span className="block text-accent italic font-normal">til indtjening</span>
            </h2>
          </motion.div>

          {/* Horizontal timeline on desktop */}
          <div className="grid md:grid-cols-4 gap-0 relative">
            {/* Connecting line */}
            <div className="hidden md:block absolute top-8 left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-accent/10 via-accent/30 to-accent/10" />

            {steps.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.2 + i * 0.15 }}
                className="text-center px-4 relative"
              >
                {/* Step circle */}
                <div className="w-16 h-16 rounded-full border border-accent/20 bg-primary flex items-center justify-center mx-auto mb-6 relative z-10">
                  <span className="font-display text-xl font-bold text-accent">{step.number}</span>
                </div>
                <h3 className="font-display text-lg md:text-xl font-bold mb-3">
                  {step.title}
                </h3>
                <p className="text-primary-foreground/50 text-sm leading-relaxed">
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
                <Button variant="outline" size="lg" className="border-primary-foreground/15 text-primary-foreground/70 hover:bg-primary-foreground/5 rounded-full">
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
