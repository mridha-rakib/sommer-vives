import { Camera, Sparkles, CreditCard, ChevronRight, Shield, Users, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

const benefits = [
  {
    icon: Camera,
    title: 'Professionel foto- og videopakke',
    text: 'Professionelle billeder og video, der får dit hus til at skille sig ud og øger chancen for flere bookinger.',
  },
  {
    icon: Sparkles,
    title: 'Optimeret opstart',
    text: 'Vi hjælper med præsentation, opsætning og de detaljer, der gør boligen mere indbydende for gæster.',
  },
  {
    icon: CreditCard,
    title: 'Ingen betaling ved opstart',
    text: 'Du kommer i gang uden opstartsbetaling. Opstarten afregnes via dine fremtidige bookinger.',
  },
];

const trustPoints = [
  { icon: Shield, text: 'Kun for nye husejere' },
  { icon: Star, text: 'Begrænset antal pladser' },
  { icon: Users, text: 'Uforpligtende gennemgang' },
];

export function CampaignCard() {
  return (
    <section className="relative z-10 py-12 sm:py-20">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-5xl mx-auto"
        >
          <div className="relative rounded-[2rem] bg-card overflow-hidden shadow-[0_30px_80px_-20px_hsl(var(--background)/0.6)]">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/[0.04] rounded-full blur-[100px] -translate-y-1/2 translate-x-1/4 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-primary/[0.03] rounded-full blur-[80px] translate-y-1/2 -translate-x-1/4 pointer-events-none" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(var(--primary)/0.06),transparent_60%)] pointer-events-none" />

            {/* Top badge */}
            <div className="relative flex items-center justify-center py-3 border-b border-primary/10">
              <div className="flex items-center gap-2.5">
                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                <span className="text-[11px] font-bold text-primary tracking-[0.2em] uppercase">
                  Eksklusivt introduktionstilbud
                </span>
                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              </div>
            </div>

            <div className="relative px-6 py-10 sm:px-12 sm:py-14 lg:px-16 lg:py-16">
              {/* Header */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.15 }}
                className="text-center max-w-2xl mx-auto mb-12"
              >
                <h3 className="text-2xl sm:text-3xl lg:text-4xl font-display font-bold text-foreground leading-tight mb-4">
                  Få flere bookinger og mindre bøvl{' '}
                  <span className="text-primary">med dit sommerhus</span>
                </h3>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-xl mx-auto">
                  Som ny husejer hos os får du en eksklusiv opstartspakke med professionel
                  præsentation, stærkere markedsføring og ingen betaling ved opstart.
                </p>
              </motion.div>

              {/* Benefit cards */}
              <div className="grid sm:grid-cols-3 gap-4 sm:gap-5 lg:gap-6 mb-12">
                {benefits.map((b, i) => (
                  <motion.div
                    key={b.title}
                    initial={{ opacity: 0, y: 25 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.2 + i * 0.1 }}
                    className="group relative rounded-2xl border border-border bg-card p-6 sm:p-7 transition-all duration-500 hover:bg-primary/10 hover:border-primary/20 hover:shadow-[0_8px_30px_-10px_hsl(var(--primary)/0.15)]"
                  >
                    <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mb-5 transition-all duration-500 group-hover:bg-primary/20 group-hover:scale-105">
                      <b.icon className="w-5 h-5 text-primary" />
                    </div>
                    <h4 className="text-base font-semibold text-foreground mb-2 leading-snug">
                      {b.title}
                    </h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {b.text}
                    </p>
                  </motion.div>
                ))}
              </div>

              {/* CTA */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="text-center"
              >
                <Button
                  asChild
                  variant="gold"
                  size="xl"
                  className="rounded-full px-10 sm:px-14 shadow-[0_4px_20px_-4px_hsl(var(--primary)/0.5)] hover:shadow-[0_8px_30px_-4px_hsl(var(--primary)/0.6)] transition-all duration-300"
                >
                  <Link to="/kom-i-gang">
                    Få en gratis vurdering af dit sommerhus
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Link>
                </Button>

                {/* Trust points */}
                <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 mt-6">
                  {trustPoints.map((tp, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-muted-foreground">
                      <tp.icon className="w-3.5 h-3.5 text-primary/50" />
                      <span className="text-[11px] font-medium">{tp.text}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
