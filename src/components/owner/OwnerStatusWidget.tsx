import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { 
  CheckCircle2, Clock, AlertCircle, Zap, Shield, Globe, 
  Sparkles, TrendingUp
} from 'lucide-react';

interface OwnerStatusWidgetProps {
  property: any;
  onboarding: any;
  agreement: any;
  listings: any[];
  stats: {
    totalBookings: number;
    upcomingBookings: number;
    totalEarnings: number;
  };
  className?: string;
}

export function OwnerStatusWidget({ property, onboarding, agreement, listings, stats, className }: OwnerStatusWidgetProps) {
  const listing = listings?.[0];

  // Compute overall status
  const stages = [
    { label: 'Profil', done: !!property },
    { label: 'Aftale', done: agreement?.status === 'signed' },
    { label: 'Listing', done: !!listing?.is_active },
    { label: 'Live', done: property?.status === 'published' },
  ];
  const completedStages = stages.filter(s => s.done).length;

  const getOverallStatus = () => {
    if (completedStages === stages.length) return { label: 'Aktiv', color: 'text-emerald-400', bg: 'bg-emerald-400/10', icon: CheckCircle2 };
    if (completedStages >= 2) return { label: 'I gang', color: 'text-amber-400', bg: 'bg-amber-400/10', icon: Clock };
    return { label: 'Startfase', color: 'text-accent', bg: 'bg-accent/10', icon: Zap };
  };

  const status = getOverallStatus();

  const highlights = [
    {
      icon: Shield,
      label: 'Aftale',
      value: agreement?.status === 'signed' ? 'Underskrevet' : 'Afventer',
      done: agreement?.status === 'signed',
    },
    {
      icon: Globe,
      label: 'Portal',
      value: listing?.is_active ? 'Publiceret' : 'Ej publiceret',
      done: !!listing?.is_active,
    },
    {
      icon: TrendingUp,
      label: 'Bookinger',
      value: `${stats.totalBookings} total`,
      done: stats.totalBookings > 0,
    },
    {
      icon: Sparkles,
      label: 'Indtjening',
      value: stats.totalEarnings > 0 ? `${stats.totalEarnings.toLocaleString('da-DK')} kr` : '—',
      done: stats.totalEarnings > 0,
    },
  ];

  return (
    <Card className={cn('border-accent/20', className)}>
      <CardContent className="p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', status.bg)}>
              <status.icon className={cn('w-5 h-5', status.color)} />
            </div>
            <div>
              <div className="text-sm font-semibold text-foreground">Din status</div>
              <div className={cn('text-xs font-medium', status.color)}>{status.label}</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-display font-bold text-foreground">{completedStages}/{stages.length}</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Trin</div>
          </div>
        </div>

        {/* Progress dots */}
        <div className="flex gap-1.5 mb-5">
          {stages.map((s, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div className={cn(
                'h-1.5 w-full rounded-full transition-all',
                s.done ? 'bg-emerald-400' : 'bg-muted'
              )} />
              <span className="text-[9px] text-muted-foreground">{s.label}</span>
            </div>
          ))}
        </div>

        {/* Highlights grid */}
        <div className="grid grid-cols-2 gap-3">
          {highlights.map((h, i) => (
            <div key={i} className="flex items-center gap-2.5 p-2.5 rounded-lg bg-muted/30">
              <h.icon className={cn('w-4 h-4 shrink-0', h.done ? 'text-emerald-400' : 'text-muted-foreground/50')} />
              <div className="min-w-0">
                <div className="text-[10px] text-muted-foreground uppercase tracking-wide">{h.label}</div>
                <div className="text-xs font-medium text-foreground truncate">{h.value}</div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
