import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
  CreditCard, CalendarCheck, DoorOpen, Sparkles, LogOut, CheckCircle2,
  Clock, ShoppingBag
} from 'lucide-react';
import { differenceInDays, isPast, isFuture, format } from 'date-fns';
import { da } from 'date-fns/locale';

interface GuestStayTimelineProps {
  booking: any;
  className?: string;
}

const STEPS = [
  { key: 'booked', label: 'Booking bekræftet', icon: CreditCard, getDate: (b: any) => b.created_at },
  { key: 'prep', label: 'Forbered dit ophold', icon: ShoppingBag, getDate: () => null },
  { key: 'arrival', label: 'Ankomstguide klar', icon: CalendarCheck, getDate: (b: any) => {
    const d = new Date(b.check_in);
    d.setDate(d.getDate() - 3);
    return d.toISOString();
  }},
  { key: 'checkin', label: 'Check-in', icon: DoorOpen, getDate: (b: any) => b.check_in },
  { key: 'stay', label: 'God ferie! ☀️', icon: Sparkles, getDate: (b: any) => b.check_in },
  { key: 'checkout', label: 'Check-out', icon: LogOut, getDate: (b: any) => b.check_out },
];

export function GuestStayTimeline({ booking, className }: GuestStayTimelineProps) {
  if (!booking) return null;

  const now = new Date();
  const checkIn = new Date(booking.check_in);
  const checkOut = new Date(booking.check_out);
  const daysUntil = differenceInDays(checkIn, now);

  const getCurrentStep = (): number => {
    if (isPast(checkOut)) return 5; // all done
    if (isPast(checkIn)) return 4; // in stay
    if (daysUntil <= 0) return 3; // check-in day
    if (daysUntil <= 3) return 2; // arrival guide ready
    if (daysUntil <= 14) return 1; // prep phase
    return 0; // just booked
  };

  const currentStep = getCurrentStep();

  return (
    <Card className={cn('border-border/50', className)}>
      <CardContent className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-4 h-4 text-accent" />
          <span className="text-sm font-semibold text-foreground">Dit forløb</span>
        </div>

        <div className="relative">
          {STEPS.map((step, i) => {
            const isDone = i < currentStep;
            const isCurrent = i === currentStep;
            const isFutureStep = i > currentStep;
            const dateStr = step.getDate(booking);

            return (
              <div key={step.key} className="flex items-start gap-3 relative">
                {i < STEPS.length - 1 && (
                  <div className={cn(
                    'absolute left-[13px] top-[28px] w-0.5 h-[calc(100%-6px)]',
                    isDone ? 'bg-emerald-400/40' : isCurrent ? 'bg-accent/30' : 'bg-border'
                  )} />
                )}

                <div className={cn(
                  'w-[26px] h-[26px] rounded-full flex items-center justify-center shrink-0 z-10',
                  isDone ? 'bg-emerald-400/20' : isCurrent ? 'bg-accent/20 ring-2 ring-accent/30 animate-pulse' : 'bg-muted'
                )}>
                  {isDone ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <step.icon className={cn(
                      'w-3 h-3',
                      isCurrent ? 'text-accent' : 'text-muted-foreground/40'
                    )} />
                  )}
                </div>

                <div className={cn('pb-4 min-w-0', isFutureStep && 'opacity-35')}>
                  <div className={cn(
                    'text-xs font-medium',
                    isDone ? 'text-muted-foreground' : isCurrent ? 'text-accent font-semibold' : 'text-muted-foreground'
                  )}>
                    {step.label}
                  </div>
                  {dateStr && (
                    <div className="text-[10px] text-muted-foreground mt-0.5">
                      {format(new Date(dateStr), 'd. MMM', { locale: da })}
                    </div>
                  )}
                  {isCurrent && (
                    <div className="text-[10px] text-accent mt-0.5 font-medium">
                      ← Du er her
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
