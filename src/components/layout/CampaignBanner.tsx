import { useState } from 'react';
import { X, Flame, Camera, Gift, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

export function CampaignBanner() {
  const [dismissed, setDismissed] = useState(false);
  const [expanded, setExpanded] = useState(false);

  if (dismissed) return null;

  return (
    <div className="relative z-[60] bg-gradient-to-r from-primary via-primary/95 to-primary text-primary-foreground">
      {/* Main banner */}
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between py-2 gap-3">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            {/* Gift icon */}
            <div className="hidden sm:flex items-center justify-center w-7 h-7 rounded-full bg-accent/15 flex-shrink-0">
              <Gift className="w-3.5 h-3.5 text-accent" />
            </div>

            {/* Scrolling / main message */}
            <div className="flex items-center gap-3 flex-1 min-w-0 text-xs sm:text-[13px]">
              <span className="flex items-center gap-1.5 flex-shrink-0">
                <Flame className="w-3.5 h-3.5 text-accent" />
                <strong className="text-accent">Gratis biopejs</strong>
                <span className="text-primary-foreground/60">ved opstart</span>
              </span>
              
              <span className="hidden md:inline text-primary-foreground/20">|</span>
              
              <span className="hidden md:flex items-center gap-1.5 flex-shrink-0">
                <Camera className="w-3.5 h-3.5 text-accent" />
                <span>Foto + video</span>
                <span className="line-through text-primary-foreground/40 text-[11px]">12.500 kr.</span>
                <strong className="text-accent">6.500 kr.</strong>
                <span className="text-primary-foreground/50 text-[11px]">— betal via bookings</span>
              </span>
            </div>

            {/* Expand / CTA */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => setExpanded(!expanded)}
                className="md:hidden text-[11px] text-accent font-medium flex items-center gap-0.5 hover:underline"
              >
                Mere info
                <ChevronRight className={`w-3 h-3 transition-transform ${expanded ? 'rotate-90' : ''}`} />
              </button>
              
              <Link
                to="/kom-i-gang"
                className="hidden sm:inline-flex items-center gap-1 bg-accent/15 hover:bg-accent/25 text-accent text-[11px] font-semibold px-3 py-1 rounded-full transition-colors"
              >
                Kom i gang
                <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
          </div>

          {/* Dismiss */}
          <button
            onClick={() => setDismissed(true)}
            className="text-primary-foreground/30 hover:text-primary-foreground/60 transition-colors flex-shrink-0 p-0.5"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Expanded mobile detail */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden md:hidden border-t border-primary-foreground/10"
          >
            <div className="container mx-auto px-4 py-3 space-y-2.5">
              <div className="flex items-start gap-2.5">
                <Camera className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-medium">Professionel foto- & videopakke</p>
                  <p className="text-[11px] text-primary-foreground/50">
                    Normalværdi <span className="line-through">12.500 kr.</span> — kun <strong className="text-accent">6.500 kr.</strong>
                  </p>
                  <p className="text-[10px] text-primary-foreground/40 mt-0.5">Du betaler intet nu — afregnes via dine bookings</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <Flame className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-medium">Gratis biopejs</p>
                  <p className="text-[11px] text-primary-foreground/50">Inkluderet ved opstart — gør dit hus mere attraktivt</p>
                </div>
              </div>
              <div className="pt-1.5 border-t border-primary-foreground/10">
                <p className="text-[10px] text-primary-foreground/30">6 måneders binding • Afregning via bookings</p>
              </div>
              <Link
                to="/kom-i-gang"
                className="inline-flex items-center gap-1 bg-accent/15 hover:bg-accent/25 text-accent text-[11px] font-semibold px-3 py-1.5 rounded-full transition-colors"
              >
                Kom i gang nu
                <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom accent line */}
      <div className="h-[1px] bg-gradient-to-r from-transparent via-accent/30 to-transparent" />
    </div>
  );
}
