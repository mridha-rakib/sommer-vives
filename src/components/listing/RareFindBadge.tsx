import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { useTranslation } from '@/lib/i18n';

const rareFindCopy = {
  da: {
    title: 'Sjældent fund!',
    body: ' Dette sommerhus er som regel booket',
  },
  en: {
    title: 'Rare find!',
    body: ' This holiday home is usually booked',
  },
};

export function RareFindBadge() {
  const { language } = useTranslation();
  const copy = language === 'en' ? rareFindCopy.en : rareFindCopy.da;
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
            style={{ background: 'radial-gradient(circle, hsl(340 75% 55% / 0.15) 0%, transparent 70%)' }}
            animate={isInView ? { scale: [1, 1.4, 1], opacity: [0.6, 0, 0.6] } : {}}
            transition={{ duration: 3, repeat: 3, ease: 'easeInOut', delay: 0.5 }}
          />
          <motion.svg
            viewBox="0 0 32 32" className="w-8 h-8 relative z-10" fill="none"
            initial={{ scale: 0, rotate: -20 }}
            animate={isInView ? { scale: 1, rotate: 0 } : {}}
            transition={{ type: 'spring', stiffness: 300, damping: 15, delay: 0.2 }}
          >
            <motion.path d="M16 3L5 12L16 29L27 12L16 3Z" fill="url(#gemGradientSV)"
              initial={{ pathLength: 0, fillOpacity: 0 }}
              animate={isInView ? { pathLength: 1, fillOpacity: 1 } : {}}
              transition={{ duration: 0.8, delay: 0.3 }}
            />
            <path d="M16 3L5 12H27L16 3Z" fill="url(#gemTopSV)" opacity="0.9" />
            <path d="M5 12L16 29L14 12H5Z" fill="hsl(340 70% 45%)" opacity="0.5" />
            <path d="M27 12L16 29L18 12H27Z" fill="hsl(340 65% 60%)" opacity="0.3" />
            <defs>
              <linearGradient id="gemGradientSV" x1="5" y1="3" x2="27" y2="29">
                <stop offset="0%" stopColor="hsl(340 75% 60%)" />
                <stop offset="100%" stopColor="hsl(350 65% 45%)" />
              </linearGradient>
              <linearGradient id="gemTopSV" x1="5" y1="3" x2="27" y2="12">
                <stop offset="0%" stopColor="hsl(335 75% 65%)" />
                <stop offset="100%" stopColor="hsl(345 70% 55%)" />
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
