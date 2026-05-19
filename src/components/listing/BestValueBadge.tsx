import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { useTranslation } from '@/lib/i18n';

const bestValueCopy = {
  da: {
    title: 'Mest for pengene!',
    body: ' Et populært valg blandt vores gæster',
  },
  en: {
    title: 'Best value!',
    body: ' A popular choice among our guests',
  },
};

export function BestValueBadge() {
  const { language } = useTranslation();
  const copy = language === 'en' ? bestValueCopy.en : bestValueCopy.da;
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });

  return (
    <div className="mb-4">
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 10 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 shadow-sm"
      >
        <div className="relative flex-shrink-0 w-10 h-10 flex items-center justify-center">
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{ background: 'radial-gradient(circle, hsl(38 55% 42% / 0.15) 0%, transparent 70%)' }}
            animate={isInView ? { scale: [1, 1.4, 1], opacity: [0.6, 0, 0.6] } : {}}
            transition={{ duration: 3, repeat: 3, ease: 'easeInOut', delay: 0.5 }}
          />
          <motion.svg
            viewBox="0 0 32 32" className="w-8 h-8 relative z-10" fill="none"
            initial={{ scale: 0, rotate: -20 }}
            animate={isInView ? { scale: 1, rotate: 0 } : {}}
            transition={{ type: 'spring', stiffness: 300, damping: 15, delay: 0.2 }}
          >
            <motion.path
              d="M4 22L7 10L12 16L16 6L20 16L25 10L28 22H4Z"
              fill="url(#crownGradientSV)"
              stroke="hsl(38 55% 42%)"
              strokeWidth="0.5"
              initial={{ pathLength: 0, fillOpacity: 0 }}
              animate={isInView ? { pathLength: 1, fillOpacity: 1 } : {}}
              transition={{ duration: 0.8, delay: 0.3 }}
            />
            <rect x="4" y="22" width="24" height="4" rx="1" fill="url(#bandGradientSV)" stroke="hsl(38 50% 35%)" strokeWidth="0.4" />
            <circle cx="10" cy="24" r="1.2" fill="hsl(45 90% 65%)" opacity="0.8" />
            <circle cx="16" cy="24" r="1.4" fill="hsl(38 75% 50%)" opacity="0.8" />
            <circle cx="22" cy="24" r="1.2" fill="hsl(45 90% 65%)" opacity="0.8" />
            <circle cx="7" cy="10" r="1.5" fill="hsl(45 85% 60%)" />
            <circle cx="16" cy="6" r="1.8" fill="hsl(45 90% 65%)" />
            <circle cx="25" cy="10" r="1.5" fill="hsl(45 85% 60%)" />
            <defs>
              <linearGradient id="crownGradientSV" x1="4" y1="6" x2="28" y2="22">
                <stop offset="0%" stopColor="hsl(38 65% 50%)" />
                <stop offset="100%" stopColor="hsl(38 55% 38%)" />
              </linearGradient>
              <linearGradient id="bandGradientSV" x1="4" y1="22" x2="28" y2="26">
                <stop offset="0%" stopColor="hsl(38 60% 45%)" />
                <stop offset="100%" stopColor="hsl(38 55% 38%)" />
              </linearGradient>
            </defs>
          </motion.svg>
        </div>
        <motion.p
          className="text-sm text-foreground font-medium leading-snug"
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.4, delay: 0.4 }}
        >
          <span className="font-semibold">{copy.title}</span>
          <span className="text-muted-foreground">{copy.body}</span>
        </motion.p>
      </motion.div>
    </div>
  );
}
