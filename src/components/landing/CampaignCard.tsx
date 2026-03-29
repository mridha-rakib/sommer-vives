import { Flame, Camera, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export function CampaignCard() {
  return (
    <section className="relative z-10 py-6">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="max-w-3xl mx-auto"
        >
          <div className="relative rounded-2xl border border-accent/20 bg-background/60 backdrop-blur-xl shadow-[0_8px_40px_-12px_hsl(var(--accent)/0.15)] overflow-hidden">
            {/* Subtle top accent */}
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-accent/40 to-transparent" />

            <div className="px-6 py-5 sm:px-8 sm:py-6">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8">
                {/* Offer 1 */}
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Flame className="w-4 h-4 text-accent" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Gratis biopejs</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Inkluderet ved opstart — gør dit hus mere attraktivt</p>
                  </div>
                </div>

                {/* Divider */}
                <div className="hidden sm:block w-px h-10 bg-border/50" />
                <div className="sm:hidden h-px bg-border/50" />

                {/* Offer 2 */}
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Camera className="w-4 h-4 text-accent" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Foto- & videopakke</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      <span className="line-through text-muted-foreground/60">12.500 kr.</span>
                      {' '}
                      <span className="text-accent font-semibold">6.500 kr.</span>
                      {' — '}betales via bookings
                    </p>
                  </div>
                </div>
              </div>

              {/* Footer row */}
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/40">
                <p className="text-[11px] text-muted-foreground/60">6 måneders binding • Ingen betaling nu</p>
                <Link
                  to="/kom-i-gang"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-accent hover:text-accent/80 transition-colors"
                >
                  Kom i gang
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
