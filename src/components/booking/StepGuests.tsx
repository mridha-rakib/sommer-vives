import { useBooking } from './BookingContext';
import { Users, PawPrint, Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEffect } from 'react';
import { useTranslation } from '@/lib/i18n';

const CounterRow = ({
  label, sublabel, value, min, max, onChange, icon: Icon,
}: {
  label: string; sublabel?: string; value: number; min: number; max: number;
  onChange: (v: number) => void; icon: React.ElementType;
}) => (
  <div className="flex items-center justify-between py-4">
    <div className="flex items-center gap-3">
      <Icon className="h-5 w-5 text-primary shrink-0" />
      <div>
        <span className="text-foreground font-medium">{label}</span>
        {sublabel && <p className="text-xs text-muted-foreground">{sublabel}</p>}
      </div>
    </div>
    <div className="flex items-center gap-3">
      <Button variant="outline" size="icon" className="h-9 w-9 rounded-full"
        onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min}>
        <Minus className="h-4 w-4" />
      </Button>
      <span className="text-foreground font-semibold w-6 text-center tabular-nums">{value}</span>
      <Button variant="outline" size="icon" className="h-9 w-9 rounded-full"
        onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max}>
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  </div>
);

export const StepGuests = () => {
  const { state, update, fetchPricing } = useBooking();
  const { t } = useTranslation();
  const maxGuests = state.listing?.maxGuests || 10;

  useEffect(() => {
    if (state.checkIn && state.checkOut) fetchPricing();
  }, [fetchPricing, state.checkIn, state.checkOut, state.guests, state.pets]);

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="font-display text-3xl md:text-4xl font-semibold text-foreground mb-2">{t('booking.guests.title')}</h2>
        <p className="text-muted-foreground">{t('booking.guests.subtitle')}</p>
      </div>

      <div className="max-w-md mx-auto animate-fade-in">
        <div className="bg-card border border-border rounded-2xl px-6 divide-y divide-border">
          <CounterRow icon={Users} label={t('booking.guests.guestsLabel')} sublabel={t('booking.guests.upTo').replace('{n}', String(maxGuests))}
            value={state.guests} min={1} max={maxGuests} onChange={(v) => update({ guests: v })} />
          <CounterRow icon={PawPrint} label={t('booking.guests.petsLabel')} sublabel={t('booking.guests.petsHint')}
            value={state.pets} min={0} max={4} onChange={(v) => update({ pets: v })} />
        </div>
        {state.guests === 0 && (
          <p className="text-sm text-destructive text-center mt-3">{t('booking.guests.required')}</p>
        )}
      </div>
    </div>
  );
};
