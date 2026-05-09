import { useBooking } from './BookingContext';
import { cn } from '@/lib/utils';
import { Check, ShoppingBag, Loader2 } from 'lucide-react';
import { useEffect } from 'react';
import { formatDKK } from '@/lib/pricing';

export const StepAddons = () => {
  const { state, update, availableAddons, fetchPricing, pricingLoading } = useBooking();

  useEffect(() => {
    if (state.checkIn && state.checkOut) fetchPricing();
  }, [state.selectedAddonIds]);

  const toggleAddon = (addonId: string) => {
    const current = state.selectedAddonIds;
    const next = current.includes(addonId) ? current.filter((id) => id !== addonId) : [...current, addonId];
    update({ selectedAddonIds: next });
  };

  const priceLabel = (addon: { price: number; price_type: string }) => {
    const formatted = formatDKK(addon.price);
    switch (addon.price_type) {
      case 'per_guest': return `${formatted} / gæst`;
      case 'per_night': return `${formatted} / nat`;
      case 'per_stay': return `${formatted} / ophold`;
      default: return formatted;
    }
  };

  if (pricingLoading && availableAddons.length === 0) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground gap-2">
        <Loader2 className="h-5 w-5 animate-spin" /> Henter tilkøb...
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="font-display text-3xl md:text-4xl font-semibold text-foreground mb-2">Tilkøb</h2>
        <p className="text-muted-foreground">Tilføj ekstra oplevelser til dit ophold</p>
      </div>

      {availableAddons.length === 0 ? (
        <div className="max-w-md mx-auto text-center py-8">
          <p className="text-muted-foreground">Ingen tilkøb tilgængelige for dette sommerhus.</p>
        </div>
      ) : (
        <div className="max-w-2xl mx-auto space-y-4">
          {availableAddons.map((addon) => {
            const selected = state.selectedAddonIds.includes(addon.id);
            return (
              <button key={addon.id} onClick={() => toggleAddon(addon.id)}
                className={cn('text-left w-full rounded-2xl border-2 p-6 transition-all duration-300 relative overflow-hidden',
                  selected ? 'border-primary bg-primary/5 shadow-lg shadow-primary/5' : 'border-border bg-card hover:border-primary/40')}>
                <div className="flex items-start gap-4">
                  <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors',
                    selected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground')}>
                    {selected ? <Check className="h-6 w-6" /> : <ShoppingBag className="h-6 w-6" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display text-lg font-semibold text-foreground mb-1">{addon.name}</h3>
                    {addon.description && <p className="text-muted-foreground text-sm mb-2">{addon.description}</p>}
                    <p className="text-primary font-bold text-lg">{priceLabel(addon)}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      <p className="text-center text-sm text-muted-foreground max-w-md mx-auto">Du kan altid springe dette trin over</p>
    </div>
  );
};
