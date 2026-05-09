import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { CheckCircle2, Circle, Sparkles } from 'lucide-react';
import { differenceInDays, isPast } from 'date-fns';

interface GuestSmartChecklistProps {
  booking: any;
  className?: string;
}

export function GuestSmartChecklist({ booking, className }: GuestSmartChecklistProps) {
  if (!booking) return null;

  const now = new Date();
  const checkIn = new Date(booking.check_in);
  const checkOut = new Date(booking.check_out);
  const daysUntil = differenceInDays(checkIn, now);
  const isActive = isPast(checkIn) && !isPast(checkOut);
  const isDone = isPast(checkOut);

  const items = [
    {
      label: 'Booking bekræftet',
      done: booking.status === 'confirmed' || booking.status === 'checked_in',
      visible: true,
    },
    {
      label: 'Betaling gennemført',
      done: booking.payment_status === 'paid',
      visible: true,
    },
    {
      label: 'Tilkøb valgt',
      done: false, // Would check order_items
      visible: daysUntil <= 14,
    },
    {
      label: 'Ankomstguide læst',
      done: false,
      visible: daysUntil <= 7,
    },
    {
      label: 'Adgangskode modtaget',
      done: false,
      visible: daysUntil <= 3,
    },
    {
      label: 'Checked-in',
      done: booking.stay_status === 'in_stay' || booking.stay_status === 'checked_in',
      visible: daysUntil <= 0 || isActive,
    },
    {
      label: 'Check-out fuldført',
      done: isDone,
      visible: isActive || isDone,
    },
  ].filter(i => i.visible);

  const doneCount = items.filter(i => i.done).length;
  const progress = items.length > 0 ? Math.round((doneCount / items.length) * 100) : 0;

  return (
    <Card className={cn('border-border/50', className)}>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-accent" />
          <span className="text-sm font-semibold text-foreground">Din tjekliste</span>
          <span className="ml-auto text-xs text-muted-foreground">{doneCount}/{items.length}</span>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 bg-muted rounded-full mb-3 overflow-hidden">
          <div
            className="h-full bg-accent rounded-full transition-all duration-700"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="space-y-1">
          {items.map((item, i) => (
            <div key={i} className={cn(
              'flex items-center gap-2 py-1.5',
              item.done && 'opacity-50'
            )}>
              {item.done ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              ) : (
                <Circle className="w-3.5 h-3.5 text-muted-foreground/30 shrink-0" />
              )}
              <span className={cn(
                'text-xs',
                item.done ? 'text-muted-foreground line-through' : 'text-foreground'
              )}>
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
