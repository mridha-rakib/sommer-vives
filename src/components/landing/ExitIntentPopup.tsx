import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, Home } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export function ExitIntentPopup() {
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const handleMouseLeave = useCallback((e: MouseEvent) => {
    if (e.clientY <= 5 && !dismissed) {
      const alreadyShown = sessionStorage.getItem('exit-intent-shown');
      if (!alreadyShown) {
        setShow(true);
        sessionStorage.setItem('exit-intent-shown', 'true');
      }
    }
  }, [dismissed]);

  useEffect(() => {
    document.addEventListener('mouseleave', handleMouseLeave);
    return () => document.removeEventListener('mouseleave', handleMouseLeave);
  }, [handleMouseLeave]);

  const close = () => {
    setShow(false);
    setDismissed(true);
  };

  return (
    <AnimatePresence>
      {show && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
            onClick={close}
          />

          {/* Popup */}
          <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="w-[90vw] max-w-md pointer-events-auto"
            >
              <div className="relative bg-card rounded-3xl overflow-hidden shadow-[0_40px_100px_-20px_rgba(0,0,0,0.5)]">
              {/* Glow */}
              <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-primary/[0.06] rounded-full blur-[80px] -translate-y-1/2 translate-x-1/4 pointer-events-none" />

              {/* Close button */}
              <button
                onClick={close}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-foreground/5 flex items-center justify-center hover:bg-foreground/10 transition-colors z-10"
              >
                <X className="w-4 h-4 text-foreground/60" />
              </button>

              <div className="relative p-8 pt-10 text-center">
                {/* Icon */}
                <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-6">
                  <Home className="w-6 h-6 text-primary" />
                </div>

                <h3 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-3 leading-tight">
                  Vent — har du et{' '}
                  <span className="text-primary italic font-normal">sommerhus?</span>
                </h3>

                <p className="text-foreground/50 text-sm md:text-base leading-relaxed mb-8 max-w-xs mx-auto">
                  Få et gratis og uforpligtende udlejningstjek. Vi vurderer dit hus' potentiale på under 2 minutter.
                </p>

                <div className="flex flex-col gap-3">
                  <Link to="/book-vurdering" onClick={close}>
                    <Button variant="gold" size="lg" className="gap-2 group w-full rounded-full text-base">
                      Gratis udlejningstjek
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                  <button
                    onClick={close}
                    className="text-foreground/30 text-sm hover:text-foreground/50 transition-colors py-2"
                  >
                    Nej tak, jeg kigger bare
                  </button>
                </div>
              </div>
            </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
