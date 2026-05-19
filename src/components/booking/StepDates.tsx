import { useBooking } from './BookingContext';
import type { ValidationError } from './BookingContext';
import { Calendar } from '@/components/ui/calendar';
import { differenceInDays, addMonths } from 'date-fns';
import { da } from 'date-fns/locale';
import type { DateRange } from 'react-day-picker';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';

export const StepDates = () => {
  const { state, update, fetchPricing, validationErrors, quoteValid, fetchError, pricingLoading } = useBooking();
  const [blockedDates, setBlockedDates] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  const range: DateRange | undefined =
    state.checkIn || state.checkOut
      ? { from: state.checkIn ?? undefined, to: state.checkOut ?? undefined }
      : undefined;

  useEffect(() => {
    if (!state.listing) return;
    const fetchAvailability = async () => {
      setLoading(true);
      try {
        const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
        const today = new Date();
        const from = today.toISOString().split('T')[0];
        const to = addMonths(today, 12).toISOString().split('T')[0];
        const res = await fetch(`https://${projectId}.supabase.co/functions/v1/availability?listing_id=${state.listing.id}&from=${from}&to=${to}`);
        const data = await res.json();
        setBlockedDates(new Set(data.blocked_dates || []));
      } catch { console.error('Failed to fetch availability'); }
      finally { setLoading(false); }
    };
    fetchAvailability();
  }, [state.listing]);

  const handleSelect = (r: DateRange | undefined) => {
    const checkIn = r?.from ?? null;
    const checkOut = r?.to ?? null;
    if (checkIn && checkOut) {
      const cursor = new Date(checkIn);
      cursor.setDate(cursor.getDate() + 1);
      while (cursor < checkOut) {
        if (blockedDates.has(cursor.toISOString().split('T')[0])) {
          update({ checkIn, checkOut: null, nights: 0 });
          return;
        }
        cursor.setDate(cursor.getDate() + 1);
      }
    }
    const nights = checkIn && checkOut ? differenceInDays(checkOut, checkIn) : 0;
    update({ checkIn, checkOut, nights });
  };

  useEffect(() => {
    if (state.checkIn && state.checkOut && state.nights > 0) fetchPricing();
  }, [fetchPricing, state.checkIn, state.checkOut, state.nights, state.guests, state.pets]);

  const today = new Date();
  const isDateBlocked = (date: Date): boolean => {
    if (date < today) return true;
    return blockedDates.has(date.toISOString().split('T')[0]);
  };

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="font-display text-3xl md:text-4xl font-semibold text-foreground mb-1">Vælg datoer</h2>
        <p className="text-muted-foreground text-sm">Vælg check-in og check-ud dato</p>
      </div>

      <div className="flex justify-center">
        {loading ? (
          <div className="flex items-center gap-3 py-16 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Henter tilgængelighed...</span>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-2xl p-3 md:p-4 inline-block">
            <Calendar mode="range" selected={range} onSelect={handleSelect}
              numberOfMonths={2} locale={da} disabled={isDateBlocked} fromDate={today}
              className={cn("p-2 pointer-events-auto")}
              modifiers={{ blocked: (date: Date) => blockedDates.has(date.toISOString().split('T')[0]) }}
              modifiersClassNames={{ blocked: 'line-through opacity-30' }}
            />
          </div>
        )}
      </div>

      {fetchError && (
        <div className="max-w-md mx-auto bg-destructive/10 border border-destructive/20 rounded-xl p-3 text-center animate-fade-in flex items-center justify-center gap-2">
          <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
          <p className="text-sm text-destructive">{fetchError}</p>
        </div>
      )}

      {state.checkIn && state.checkOut && !fetchError && validationErrors.length > 0 && (
        <div className="max-w-md mx-auto bg-destructive/10 border border-destructive/20 rounded-xl p-3 text-center animate-fade-in space-y-1">
          {validationErrors.map((err: ValidationError, i: number) => (
            <p key={i} className="text-sm text-destructive">{err.message}</p>
          ))}
        </div>
      )}

      {pricingLoading && state.checkIn && state.checkOut && (
        <div className="max-w-md mx-auto flex items-center justify-center gap-2 py-2 text-muted-foreground animate-fade-in">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Beregner pris...</span>
        </div>
      )}

      {state.nights > 0 && quoteValid && !fetchError && !pricingLoading && (
        <div className="max-w-md mx-auto text-center animate-fade-in">
          <span className="text-sm text-muted-foreground">{state.nights} {state.nights === 1 ? 'nat' : 'nætter'}</span>
        </div>
      )}
    </div>
  );
};
