import { Link } from 'react-router-dom';
import { Clock, BedDouble, Sparkles, Gift, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NudgeItem {
  id: string;
  icon: any;
  label: string;
  hint: string;
  price: string;
  href: string;
  emoji?: string;
}

interface ContextualNudgeProps {
  /** 'checkin' shows early check-in + linen; 'checkout' shows late checkout; 'stay' shows premium + linen */
  context: 'checkin' | 'checkout' | 'stay' | 'dashboard';
  daysUntil?: number;
  className?: string;
}

const allNudges: Record<string, NudgeItem> = {
  early: {
    id: 'early',
    icon: Clock,
    label: 'Ankom fra kl. 12',
    hint: 'Start ferien 3 timer tidligere',
    price: '350 kr',
    href: '/guest/addons',
    emoji: '🕐',
  },
  late: {
    id: 'late',
    icon: Clock,
    label: 'Forlæng til kl. 14',
    hint: 'Nyd en rolig formiddag uden stress',
    price: '350 kr',
    href: '/guest/addons',
    emoji: '☀️',
  },
  linen: {
    id: 'linen',
    icon: BedDouble,
    label: 'Sengelinned klar ved ankomst',
    hint: 'Spar besværet — det er gjort for dig',
    price: 'fra 150 kr',
    href: '/guest/addons',
    emoji: '🛏️',
  },
  premium: {
    id: 'premium',
    icon: Sparkles,
    label: 'Velkomstpakke',
    hint: 'Vin, blomster og lokale specialiteter',
    price: '495 kr',
    href: '/guest/addons',
    emoji: '🎁',
  },
};

function getNudgesForContext(context: string, daysUntil?: number): NudgeItem[] {
  switch (context) {
    case 'checkin':
      return [allNudges.early, allNudges.linen];
    case 'checkout':
      return [allNudges.late];
    case 'stay':
      return [allNudges.linen, allNudges.premium];
    case 'dashboard':
      // Smart: show early check-in when close to arrival, premium when far away
      if (daysUntil !== undefined && daysUntil <= 3) return [allNudges.early, allNudges.linen];
      if (daysUntil !== undefined && daysUntil <= 7) return [allNudges.linen, allNudges.premium];
      return [allNudges.premium];
    default:
      return [];
  }
}

export function ContextualNudge({ context, daysUntil, className }: ContextualNudgeProps) {
  const nudges = getNudgesForContext(context, daysUntil);
  if (!nudges.length) return null;

  const titles: Record<string, string> = {
    checkin: 'Gør ankomsten nemmere',
    checkout: 'Ingen stress på afrejsedagen',
    stay: 'Gør opholdet komplet',
    dashboard: 'Et lille tip til dig',
  };

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center gap-2 px-1">
        <Gift className="w-3.5 h-3.5 text-[hsl(var(--gold))]/60" />
        <span className="text-[10px] font-semibold tracking-[0.15em] uppercase text-muted-foreground">{titles[context]}</span>
      </div>
      {nudges.map(nudge => (
        <Link key={nudge.id} to={nudge.href}>
          <div className="group flex items-center gap-3.5 p-3.5 rounded-2xl border border-border/30 bg-card/60 hover:border-[hsl(var(--gold))]/20 hover:bg-[hsl(var(--gold))]/[0.02] transition-all duration-300">
            <div className="w-10 h-10 rounded-xl bg-[hsl(var(--gold))]/8 flex items-center justify-center shrink-0 text-base">
              {nudge.emoji}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-foreground">{nudge.label}</div>
              <p className="text-[11px] text-muted-foreground leading-snug">{nudge.hint}</p>
            </div>
            <div className="text-right shrink-0 flex items-center gap-1.5">
              <span className="text-xs font-semibold text-[hsl(var(--gold))]">{nudge.price}</span>
              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-[hsl(var(--gold))]/60 transition-colors" />
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
