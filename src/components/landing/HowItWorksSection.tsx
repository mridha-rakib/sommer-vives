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
    <section ref={ref} className="py-24 md:py-32 bg-primary text-primary-foreground overflow-hidden">
      <div className="container mx-auto px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-[1fr_1.5fr] gap-16 items-start">
            {/* Left sticky text */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.7 }}
              className="lg:sticky lg:top-32"
            >
              <span className="text-accent font-body text-sm font-semibold tracking-[0.3em] uppercase block mb-4">
                Sådan virker det
              </span>
              <h2 className="font-display text-3xl md:text-5xl font-bold leading-tight mb-6">
                Fra oprettelse
                <span className="block text-accent italic font-normal">til indtjening</span>
              </h2>
              <p className="text-primary-foreground/70 leading-relaxed mb-8 text-lg">
                Fire enkle trin — så klarer vi resten. Du bestemmer altid selv priser, datoer og vilkår.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link to="/kom-i-gang">
                  <Button variant="gold" size="lg" className="gap-2 group">
                    Opret dit hus nu
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link to="/contact">
                  <Button variant="outline" size="lg" className="border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10">
                    Book et udlejningstjek
                  </Button>
                </Link>
              </div>
            </motion.div>

            {/* Right steps */}
            <div className="space-y-0">
              {steps.map((step, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 40 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.5, delay: 0.2 + i * 0.15 }}
                  className="border-b border-primary-foreground/10 last:border-0 py-10 first:pt-0 group"
                >
                  <div className="flex gap-8 items-start">
                    <span className="font-display text-5xl md:text-7xl font-bold text-accent/20 group-hover:text-accent/40 transition-colors duration-500 leading-none flex-shrink-0">
                      {step.number}
                    </span>
                    <div>
                      <h3 className="font-display text-2xl font-bold mb-3 group-hover:text-accent transition-colors duration-300">
                        {step.title}
                      </h3>
                      <p className="text-primary-foreground/60 leading-relaxed text-lg">
                        {step.description}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
