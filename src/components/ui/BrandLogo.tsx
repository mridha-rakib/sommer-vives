import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface BrandLogoProps {
  tagline?: string;
  to?: string;
  size?: 'sm' | 'md';
  className?: string;
}

export function BrandLogo({ tagline, to = '/', size = 'sm', className }: BrandLogoProps) {
  const textSize = size === 'md' ? 'text-lg' : 'text-sm';
  const sunSize = size === 'md' ? 'w-[0.65em] h-[0.65em]' : 'w-[0.6em] h-[0.6em]';

  const logo = (
    <div className={cn('flex flex-col items-start', className)}>
      <span className={cn('font-display font-bold tracking-tight text-foreground leading-none', textSize)}>
        S
        <span className={cn('inline-block relative -mb-[0.05em] mx-[0.02em]', sunSize)}>
          <svg className="absolute inset-0 w-full h-full drop-shadow-[0_0_6px_hsl(var(--primary)/0.6)]" viewBox="0 0 32 32" fill="none">
            <circle cx="16" cy="16" r="8" fill="hsl(var(--primary))" />
            <circle cx="16" cy="16" r="11" stroke="hsl(var(--primary))" strokeWidth="1.5" strokeDasharray="3 4" opacity="0.5" />
            {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => {
              const rad = (angle * Math.PI) / 180;
              const x1 = 16 + 12 * Math.cos(rad);
              const y1 = 16 + 12 * Math.sin(rad);
              const x2 = 16 + 15 * Math.cos(rad);
              const y2 = 16 + 15 * Math.sin(rad);
              return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="hsl(var(--primary))" strokeWidth="1.8" strokeLinecap="round" />;
            })}
          </svg>
        </span>
        mmer<span className="text-primary italic">Vibes</span>
      </span>
      {tagline && (
        <span className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground/60 font-semibold mt-0.5 leading-none">
          {tagline}
        </span>
      )}
    </div>
  );

  if (to) {
    return <Link to={to}>{logo}</Link>;
  }

  return logo;
}
