import { useBooking } from './BookingContext';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';
import { ChevronDown, ChevronUp, Loader2, Info } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { formatDKK } from '@/lib/pricing';

export const BookingSummary = ({ collapsible = false }: { collapsible?: boolean }) => {
  const { state, lineItems, totalPrice, pricingLoading, nightBreakdown } = useBooking();
  const [open, setOpen] = useState(!collapsible);
  const [nightsOpen, setNightsOpen] = useState(false);

  if (!state.listing) return null;

  const nightItems = lineItems.filter((i) => i.type === 'night');
  const feeItems = lineItems.filter((i) => i.type === 'fee');
  const addonItems = lineItems.filter((i) => i.type === 'addon');

  const SOURCE_LABELS: Record<string, string> = {
    base: 'Grundpris',
    season: 'Sæson',
    override: 'Dagspris',
  };

  const content = (
    <div className="space-y-4 text-sm">
      <div className="flex justify-between">
        <span className="text-muted-foreground">Sommerhus</span>
        <span className="text-foreground font-medium">{state.listing.title}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-muted-foreground">Gæster</span>
        <span className="text-foreground font-medium">{state.guests}</span>
      </div>
      {state.pets > 0 && (
        <div className="flex justify-between">
          <span className="text-muted-foreground">Kæledyr</span>
          <span className="text-foreground font-medium">{state.pets}</span>
        </div>
      )}

      {state.checkIn && state.checkOut && (
        <>
          <div className="border-t border-border pt-4 flex justify-between">
            <span className="text-muted-foreground">Check-in</span>
            <span className="text-foreground font-medium">{format(state.checkIn, 'd. MMM yyyy', { locale: da })}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Check-ud</span>
            <span className="text-foreground font-medium">{format(state.checkOut, 'd. MMM yyyy', { locale: da })}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Nætter</span>
            <span className="text-foreground font-medium">{state.nights}</span>
          </div>
        </>
      )}

      {pricingLoading ? (
        <div className="border-t border-border pt-4 flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Beregner pris...
        </div>
      ) : lineItems.length > 0 ? (
        <>
          {nightItems.length > 0 && (
            <div className="border-t border-border pt-4 space-y-2">
              {nightItems.map((item, i) => (
                <div key={i} className="flex justify-between">
                  <span className="text-muted-foreground">{item.label}</span>
                  <span className="text-foreground font-medium">{formatDKK(item.amount)}</span>
                </div>
              ))}
            </div>
          )}

          {nightBreakdown.length > 0 && (
            <div>
              <button onClick={() => setNightsOpen(!nightsOpen)}
                className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors">
                <Info className="h-3 w-3" />
                <span>Prisdetaljer</span>
                {nightsOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </button>
              {nightsOpen && (
                <div className="mt-2 bg-muted/50 rounded-lg p-3 space-y-1.5">
                  {nightBreakdown.map((n, i) => (
                    <div key={i} className="flex items-start justify-between gap-2 text-xs">
                      <div className="min-w-0">
                        <span className="text-foreground font-medium capitalize">{n.day_name}</span>
                        <span className="text-muted-foreground ml-1.5">
                          {new Date(n.date + 'T00:00:00').toLocaleDateString('da-DK', { day: 'numeric', month: 'short' })}
                        </span>
                        <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                          <span className="inline-block px-1.5 py-0.5 rounded bg-primary/10 text-primary text-[10px]">
                            {SOURCE_LABELS[n.source] || n.source}
                          </span>
                          {n.season_name && (
                            <span className="inline-block px-1.5 py-0.5 rounded bg-accent text-accent-foreground text-[10px]">{n.season_name}</span>
                          )}
                          {n.is_weekend && (
                            <span className="inline-block px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-[10px]">Weekendtillæg</span>
                          )}
                        </div>
                      </div>
                      <span className="text-foreground font-medium whitespace-nowrap">{formatDKK(n.price)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {feeItems.length > 0 && (
            <div className="border-t border-border pt-4 space-y-2">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">Gebyrer</span>
              {feeItems.map((item, i) => (
                <div key={i} className="flex justify-between">
                  <span className="text-muted-foreground">{item.label}</span>
                  <span className="text-foreground font-medium">{formatDKK(item.amount)}</span>
                </div>
              ))}
            </div>
          )}

          {addonItems.length > 0 && (
            <div className="border-t border-border pt-4 space-y-2">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">Tilkøb</span>
              {addonItems.map((item, i) => (
                <div key={i} className="flex justify-between">
                  <span className="text-muted-foreground">{item.label}</span>
                  <span className="text-foreground font-medium">{formatDKK(item.amount)}</span>
                </div>
              ))}
            </div>
          )}

          <div className="border-t-2 border-primary/30 pt-4 flex justify-between items-center">
            <span className="font-display text-lg font-semibold text-foreground">I alt</span>
            <span className="font-display text-2xl font-bold text-primary">{formatDKK(totalPrice)}</span>
          </div>
        </>
      ) : null}
    </div>
  );

  if (collapsible) {
    return (
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between p-4 text-foreground font-semibold">
          <span>Prisoversigt</span>
          <div className="flex items-center gap-2">
            {totalPrice > 0 && <span className="text-primary font-bold">{formatDKK(totalPrice)}</span>}
            {open ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </div>
        </button>
        <div className={cn('px-4 pb-4 transition-all', open ? 'block' : 'hidden')}>{content}</div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-2xl p-6 sticky top-24">
      <h3 className="font-display text-lg font-semibold text-foreground mb-6">Prisoversigt</h3>
      {content}
    </div>
  );
};
