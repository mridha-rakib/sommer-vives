import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import logoFullLight from '@/assets/logo/sommervibes-full.png';
import logoFullDark from '@/assets/logo/sommervibes-full-dark.png';
import logoMarkLight from '@/assets/logo/sommervibes-mark.png';
import logoMarkDark from '@/assets/logo/sommervibes-mark-dark.png';

type Variant = 'full' | 'mark';
type Tone = 'light' | 'dark' | 'auto';
type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface BrandLogoProps {
  /** `full` = sun + "SommerVibes" (best for headers). `mark` = stacked logo with "Sommer / Vibes" (best for splash/auth/hero). */
  variant?: Variant;
  /** `light` = white text (use on dark bg). `dark` = navy text (use on light bg). `auto` = follows current text color via CSS, defaults to dark. */
  tone?: Tone;
  to?: string;
  size?: Size;
  tagline?: string;
  className?: string;
}

const heightBySize: Record<Variant, Record<Size, string>> = {
  full: {
    xs: 'h-5',
    sm: 'h-7',
    md: 'h-9',
    lg: 'h-12',
    xl: 'h-16',
  },
  mark: {
    xs: 'h-8',
    sm: 'h-12',
    md: 'h-16',
    lg: 'h-24',
    xl: 'h-32',
  },
};

export function BrandLogo({
  variant = 'full',
  tone = 'dark',
  to = '/',
  size = 'sm',
  tagline,
  className,
}: BrandLogoProps) {
  const isMark = variant === 'mark';
  const src = isMark
    ? tone === 'light' ? logoMarkLight : logoMarkDark
    : tone === 'light' ? logoFullLight : logoFullDark;

  const heightClass = heightBySize[variant][size];

  const content = (
    <div className={cn('inline-flex flex-col items-start leading-none', className)}>
      <img
        src={src}
        alt="SommerVibes"
        className={cn(heightClass, 'w-auto select-none')}
        draggable={false}
      />
      {tagline && (
        <span className="text-[11px] uppercase tracking-[0.25em] text-primary/70 font-semibold mt-1.5 leading-none">
          {tagline}
        </span>
      )}
    </div>
  );

  if (to) {
    return (
      <Link to={to} className="inline-flex items-center" aria-label="SommerVibes – forside">
        {content}
      </Link>
    );
  }
  return content;
}
