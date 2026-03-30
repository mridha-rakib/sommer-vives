import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  Activity, CheckCircle2, AlertTriangle, Clock, Sparkles,
  Brush, Wrench, MessageCircle, CalendarDays
} from 'lucide-react';

interface PulseItem {
  label: string;
  status: 'ok' | 'warning' | 'action';
  detail: string;
  icon: React.ElementType;
}

interface OperationalPulseProps {
  stats: {
    upcomingBookings: number;
    pendingTasks: number;
    totalBookings: number;
  };
  property: any;
  className?: string;
}

export function OperationalPulse({ stats, property, className }: OperationalPulseProps) {
  const items: PulseItem[] = [
    {
      label: 'Bookinger',
      icon: CalendarDays,
      status: stats.upcomingBookings > 0 ? 'ok' : 'warning',
      detail: stats.upcomingBookings > 0
        ? `${stats.upcomingBookings} kommende`
        : 'Ingen kommende bookinger',
    },
    {
      label: 'Rengøring',
      icon: Brush,
      status: 'ok',
      detail: 'SommerVibes håndterer dette',
    },
    {
      label: 'Vedligeholdelse',
      icon: Wrench,
      status: 'ok',
      detail: 'Ingen åbne sager',
    },
    {
      label: 'Beskeder',
      icon: MessageCircle,
      status: 'ok',
      detail: 'Alt besvaret',
    },
    {
      label: 'Opgaver',
      icon: Clock,
      status: stats.pendingTasks > 0 ? 'action' : 'ok',
      detail: stats.pendingTasks > 0
        ? `${stats.pendingTasks} afventer dig`
        : 'Intet afventer',
    },
    {
      label: 'Kalender',
      icon: CalendarDays,
      status: property?.status === 'published' ? 'ok' : 'warning',
      detail: property?.status === 'published' ? 'Åben for gæster' : 'Ikke publiceret endnu',
    },
  ];

  const allOk = items.every(i => i.status === 'ok');
  const actionCount = items.filter(i => i.status !== 'ok').length;

  const statusColors = {
    ok: 'text-emerald-400',
    warning: 'text-amber-400',
    action: 'text-accent',
  };

  const statusIcons = {
    ok: CheckCircle2,
    warning: AlertTriangle,
    action: Clock,
  };

  return (
    <Card className={cn('border-border/50', className)}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-accent" />
            <span className="text-sm font-semibold text-foreground">Driftsstatus</span>
          </div>
          {allOk ? (
            <Badge className="bg-emerald-400/15 text-emerald-400 border-emerald-400/20 text-[10px]">
              <Sparkles className="w-3 h-3 mr-1" />
              Alt kører
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-amber-400/10 text-amber-400 border-amber-400/20 text-[10px]">
              {actionCount} kræver opmærksomhed
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2">
          {items.map((item, i) => {
            const StatusIcon = statusIcons[item.status];
            return (
              <div
                key={i}
                className={cn(
                  'flex items-center gap-2.5 p-2.5 rounded-lg',
                  item.status === 'ok' ? 'bg-muted/30' : 'bg-accent/5 border border-accent/10'
                )}
              >
                <div className={cn(
                  'w-7 h-7 rounded-lg flex items-center justify-center shrink-0',
                  item.status === 'ok' ? 'bg-emerald-400/10' : 'bg-accent/15'
                )}>
                  <item.icon className={cn('w-3.5 h-3.5', statusColors[item.status])} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wide">{item.label}</div>
                  <div className="text-[11px] font-medium text-foreground truncate">{item.detail}</div>
                </div>
              </div>
            );
          })}
        </div>

          <div className="mt-3 p-2.5 rounded-lg bg-emerald-400/5 border border-emerald-400/10 text-center">
            <p className="text-[11px] text-emerald-400 font-medium">
              Alt kører som det skal — vi holder øje, så du kan slappe af 🌴
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
