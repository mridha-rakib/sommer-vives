import { motion } from 'framer-motion';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, BarChart3, Calendar, MessageSquare, Star } from 'lucide-react';

export function ModernPlatformSection() {
  const { ref, isInView } = useScrollReveal();

  return (
    <section ref={ref} className="py-28 md:py-36 bg-background overflow-hidden">
      <div className="container mx-auto px-4 md:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center max-w-7xl mx-auto">
          {/* Left - Text */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8 }}
          >
            <span className="text-accent font-body text-sm font-semibold tracking-[0.3em] uppercase block mb-4">
              Din ejerportal
            </span>
            <h2 className="font-display text-3xl md:text-5xl lg:text-6xl font-bold text-primary mb-6 leading-tight">
              Fuld kontrol{' '}
              <span className="text-accent italic font-normal block">fra din telefon</span>
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed mb-10 max-w-lg">
              Følg dine bookinger, indtjening og gæstekommunikation i realtid.
              Ejerportalen er designet til at give dig overblik — ikke besvær.
            </p>
            <Link to="/how-it-works">
              <Button variant="gold" size="lg" className="gap-2 group rounded-full">
                Udforsk platformen
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </motion.div>

          {/* Right - Dashboard mockup */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            <div className="bg-card rounded-3xl shadow-elevated border border-border p-6 md:p-8">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-3 h-3 rounded-full bg-destructive/40" />
                <div className="w-3 h-3 rounded-full bg-accent/40" />
                <div className="w-3 h-3 rounded-full bg-green-500/40" />
              </div>
              
              <div className="text-sm text-muted-foreground mb-1">God eftermiddag 👋</div>
              <h3 className="font-display text-xl font-bold text-primary mb-6">Dit overblik</h3>

              <div className="grid grid-cols-2 gap-4 mb-6">
                {[
                  { icon: BarChart3, label: 'Indtjening i år', value: '132.730 kr.', accent: false },
                  { icon: Star, label: 'Vurdering', value: '4.9 / 5.0', accent: true },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={isInView ? { opacity: 1, scale: 1 } : {}}
                    transition={{ duration: 0.4, delay: 0.5 + i * 0.1 }}
                    className="bg-muted/50 rounded-xl p-4"
                  >
                    <item.icon className="w-4 h-4 text-muted-foreground mb-2" />
                    <div className="text-xs text-muted-foreground mb-1">{item.label}</div>
                    <div className={`font-display text-xl font-bold ${item.accent ? 'text-accent' : 'text-primary'}`}>
                      {item.value}
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="space-y-3">
                {[
                  { icon: Calendar, text: 'Ny bookingforespørgsel', badge: 'Ny', badgeColor: 'bg-accent text-primary' },
                  { icon: MessageSquare, text: 'Besked fra gæst', badge: '2', badgeColor: 'bg-primary text-primary-foreground' },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: 20 }}
                    animate={isInView ? { opacity: 1, x: 0 } : {}}
                    transition={{ duration: 0.4, delay: 0.7 + i * 0.1 }}
                    className="flex items-center justify-between bg-accent/5 rounded-xl p-4 hover:bg-accent/10 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className="w-5 h-5 text-accent" />
                      <span className="text-sm font-medium text-primary">{item.text}</span>
                    </div>
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${item.badgeColor}`}>
                      {item.badge}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Floating notification */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={isInView ? { opacity: 1, scale: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 1 }}
              className="absolute -bottom-4 -left-4 bg-card rounded-2xl shadow-xl border border-border p-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Denne uge</div>
                  <div className="font-display text-lg font-bold text-primary">+22% visninger</div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
