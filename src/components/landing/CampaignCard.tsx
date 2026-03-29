import { Flame, Camera, ChevronRight, Gift, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

export function CampaignCard() {
  return (
    <section className="relative z-10 py-8 sm:py-12">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="max-w-4xl mx-auto"
        >
          <div className="relative rounded-3xl border border-accent/20 bg-primary/95 backdrop-blur-xl shadow-[0_20px_60px_-15px_hsl(var(--primary)/0.5)] overflow-hidden">
            {/* Decorative glow */}
            <div className="absolute -top-20 -right-20 w-60 h-60 bg-accent/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-accent/5 rounded-full blur-3xl pointer-events-none" />
            
            {/* Top label */}
            <div className="relative flex items-center justify-center gap-2 py-2.5 bg-accent/15 border-b border-accent/20">
              <Gift className="w-3.5 h-3.5 text-accent" />
              <span className="text-xs font-semibold text-accent tracking-wide uppercase">Eksklusivt introduktionstilbud</span>
              <Gift className="w-3.5 h-3.5 text-accent" />
            </div>

            <div className="relative px-6 py-8 sm:px-10 sm:py-10">
              {/* Headline */}
              <div className="text-center mb-8">
                <h3 className="text-2xl sm:text-3xl font-display font-bold text-primary-foreground mb-2">
                  Start din udlejning med <span className="text-accent">ekstra fordele</span>
                </h3>
                <p className="text-sm text-primary-foreground/60">Tilbuddet gælder kun nye kunder — ingen betaling nu</p>
              </div>

              {/* Two offer cards */}
              <div className="grid sm:grid-cols-2 gap-4 sm:gap-6 mb-8">
                {/* Offer 1 - Free fireplace */}
                <div className="group relative rounded-2xl border border-accent/20 bg-primary-foreground/5 hover:bg-primary-foreground/10 transition-all duration-300 p-6">
                  <div className="absolute top-4 right-4">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-accent/20 text-accent text-[10px] font-bold uppercase tracking-wider">Gratis</span>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-accent/15 flex items-center justify-center mb-4">
                    <Flame className="w-6 h-6 text-accent" />
                  </div>
                  <h4 className="text-lg font-semibold text-primary-foreground mb-1">Gratis biopejs</h4>
                  <p className="text-sm text-primary-foreground/50 leading-relaxed">Inkluderet ved opstart — gør dit hus mere attraktivt for gæsterne og øg din bookingrate.</p>
                  <p className="text-xs text-accent/80 mt-3 font-medium">Værdi: 3.500 kr.</p>
                </div>

                {/* Offer 2 - Photo/video */}
                <div className="group relative rounded-2xl border border-accent/20 bg-primary-foreground/5 hover:bg-primary-foreground/10 transition-all duration-300 p-6">
                  <div className="absolute top-4 right-4">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-accent/20 text-accent text-[10px] font-bold uppercase tracking-wider">-48%</span>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-accent/15 flex items-center justify-center mb-4">
                    <Camera className="w-6 h-6 text-accent" />
                  </div>
                  <h4 className="text-lg font-semibold text-primary-foreground mb-1">Foto- & videopakke</h4>
                  <p className="text-sm text-primary-foreground/50 leading-relaxed">Professionelle billeder og video der sælger dit hus — betales via dine fremtidige bookings.</p>
                  <div className="flex items-center gap-2 mt-3">
                    <span className="text-xs line-through text-primary-foreground/30">12.500 kr.</span>
                    <span className="text-sm font-bold text-accent">6.500 kr.</span>
                  </div>
                </div>
              </div>

              {/* CTA */}
              <div className="text-center">
                <Button asChild variant="gold" size="lg" className="rounded-full px-10 text-base">
                  <Link to="/kom-i-gang">
                    Kom i gang nu — helt gratis
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Link>
                </Button>
              </div>

              {/* Footer terms */}
              <div className="flex items-center justify-center gap-4 mt-6 pt-5 border-t border-primary-foreground/10">
                <div className="flex items-center gap-1.5 text-primary-foreground/40">
                  <Clock className="w-3.5 h-3.5" />
                  <span className="text-[11px]">6 måneders binding</span>
                </div>
                <span className="text-primary-foreground/20">•</span>
                <span className="text-[11px] text-primary-foreground/40">Ingen betaling ved opstart</span>
                <span className="text-primary-foreground/20">•</span>
                <span className="text-[11px] text-primary-foreground/40">Opsig når du vil herefter</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
