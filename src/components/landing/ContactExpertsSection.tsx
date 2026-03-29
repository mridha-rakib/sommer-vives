import { motion } from 'framer-motion';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Phone, MapPin, Clock } from 'lucide-react';

export function ContactExpertsSection() {
  const { ref, isInView } = useScrollReveal();

  return (
    <section ref={ref} className="py-24 md:py-32 bg-primary text-primary-foreground overflow-hidden">
      <div className="container mx-auto px-4 md:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.8 }}
            >
              <span className="text-accent font-body text-sm font-semibold tracking-[0.3em] uppercase block mb-6">
                Klar til at komme i gang?
              </span>
              <h2 className="font-display text-4xl md:text-6xl font-bold mb-6 leading-[0.95]">
                Lad os snakke om
                <span className="block text-accent italic font-normal">dit sommerhus</span>
              </h2>
              <p className="text-lg text-primary-foreground/70 leading-relaxed mb-10 max-w-lg">
                Book en gratis og uforpligtende vurdering — vi kører ud til dig.
                Eller opret dit hus online på 5 minutter.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 mb-8">
                <Link to="/kom-i-gang">
                  <Button variant="gold" size="xl" className="gap-3 group text-base w-full sm:w-auto">
                    Udlej dit hus nu
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link to="/contact">
                  <Button
                    variant="outline"
                    size="xl"
                    className="border-accent/40 text-accent hover:bg-accent/10 text-base w-full sm:w-auto"
                  >
                    Book gratis vurdering
                  </Button>
                </Link>
              </div>
            </motion.div>

            {/* Right — Contact details */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="space-y-6"
            >
              {[
                { icon: Phone, title: 'Ring til os', detail: '+45 12 34 56 78', sub: 'Hverdage 8–18' },
                { icon: MapPin, title: 'Vi kører ud til dig', detail: 'Hele Danmark', sub: 'Gratis og uforpligtende' },
                { icon: Clock, title: 'Hurtig opstart', detail: 'Op og køre på 5 min', sub: 'Eller vi hjælper dig' },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.5, delay: 0.4 + i * 0.1 }}
                  className="flex gap-5 items-start p-5 rounded-2xl bg-primary-foreground/5 hover:bg-primary-foreground/10 transition-colors group"
                >
                  <div className="w-12 h-12 rounded-xl bg-accent/15 flex items-center justify-center flex-shrink-0 group-hover:bg-accent/25 transition-colors">
                    <item.icon className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-bold mb-0.5">{item.title}</h3>
                    <p className="text-primary-foreground/90 font-medium">{item.detail}</p>
                    <p className="text-primary-foreground/50 text-sm">{item.sub}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
