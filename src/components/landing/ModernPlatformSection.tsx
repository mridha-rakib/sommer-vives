import { motion } from 'framer-motion';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, BarChart3, Calendar, MessageSquare, Star, TrendingUp, Bell } from 'lucide-react';

export function ModernPlatformSection() {
  const { ref, isInView } = useScrollReveal();

  return (
    <section ref={ref} className="py-28 md:py-36 bg-muted/20 overflow-hidden">
      <div className="container mx-auto px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Centered header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7 }}
            className="text-center mb-16 md:mb-20"
          >
            <span className="text-accent font-body text-sm font-semibold tracking-[0.3em] uppercase block mb-4">
              Din ejerportal
            </span>
            <h2 className="font-display text-3xl md:text-5xl lg:text-6xl font-bold text-primary mb-5 leading-tight max-w-3xl mx-auto">
              Fuld kontrol{' '}
              <span className="text-accent italic font-normal">fra din telefon</span>
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed max-w-xl mx-auto">
              Følg bookinger, indtjening og gæstekommunikation i realtid.
            </p>
          </motion.div>

          {/* Phone mockup — centered, minimal */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="max-w-sm mx-auto relative"
          >
            {/* Phone frame */}
            <div className="bg-card rounded-[2.5rem] shadow-[0_40px_100px_-20px_hsl(var(--primary)/0.15)] border border-border p-3">
              <div className="bg-background rounded-[2rem] overflow-hidden">
                {/* Status bar */}
                <div className="flex items-center justify-between px-6 pt-4 pb-2">
                  <span className="text-[10px] text-muted-foreground/50 font-medium">9:41</span>
                  <div className="w-20 h-5 bg-primary rounded-full" />
                  <div className="flex gap-1">
                    <div className="w-3.5 h-2 rounded-sm bg-muted-foreground/30" />
                  </div>
                </div>

                <div className="px-5 pb-6 pt-3">
                  <div className="text-xs text-muted-foreground mb-0.5">God eftermiddag 👋</div>
                  <h3 className="font-display text-lg font-bold text-primary mb-5">Dit overblik</h3>

                  {/* Stats row */}
                  <div className="grid grid-cols-2 gap-3 mb-5">
                    {[
                      { icon: BarChart3, label: 'Indtjening', value: '132.730 kr.', color: false },
                      { icon: Star, label: 'Vurdering', value: '4.9 / 5.0', color: true },
                    ].map((item, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={isInView ? { opacity: 1, scale: 1 } : {}}
                        transition={{ duration: 0.4, delay: 0.5 + i * 0.1 }}
                        className="bg-muted/40 rounded-2xl p-4"
                      >
                        <item.icon className="w-4 h-4 text-muted-foreground/50 mb-2" />
                        <div className="text-[10px] text-muted-foreground mb-1">{item.label}</div>
                        <div className={`font-display text-lg font-bold ${item.color ? 'text-accent' : 'text-primary'}`}>
                          {item.value}
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Notifications */}
                  <div className="space-y-2">
                    {[
                      { icon: Calendar, text: 'Ny booking', badge: 'Ny', accent: true },
                      { icon: MessageSquare, text: 'Besked fra gæst', badge: '2', accent: false },
                      { icon: TrendingUp, text: '+22% visninger', badge: '↑', accent: true },
                    ].map((item, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: 20 }}
                        animate={isInView ? { opacity: 1, x: 0 } : {}}
                        transition={{ duration: 0.4, delay: 0.7 + i * 0.1 }}
                        className="flex items-center justify-between bg-accent/[0.04] rounded-xl p-3.5"
                      >
                        <div className="flex items-center gap-3">
                          <item.icon className="w-4 h-4 text-accent/70" />
                          <span className="text-xs font-medium text-primary">{item.text}</span>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          item.accent ? 'bg-accent/15 text-accent' : 'bg-primary text-primary-foreground'
                        }`}>
                          {item.badge}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Floating notification */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8, x: -40 }}
              animate={isInView ? { opacity: 1, scale: 1, x: 0 } : {}}
              transition={{ duration: 0.5, delay: 1.2, type: 'spring' }}
              className="absolute top-1/3 -left-8 md:-left-32 bg-card rounded-2xl shadow-elevated border border-border p-3.5 max-w-[180px]"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-accent/15 flex items-center justify-center flex-shrink-0">
                  <Bell className="w-4 h-4 text-accent" />
                </div>
                <div>
                  <div className="text-[10px] text-muted-foreground">Lige nu</div>
                  <div className="text-xs font-semibold text-primary">Ny booking! 🎉</div>
                </div>
              </div>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ duration: 0.5, delay: 1 }}
            className="text-center mt-14"
          >
            <Link to="/how-it-works">
              <Button variant="gold" size="lg" className="gap-2 group rounded-full">
                Udforsk platformen
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
