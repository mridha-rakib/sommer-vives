import { useBooking } from './BookingContext';
import { cn } from '@/lib/utils';
import { Check, ShoppingBag, Loader2 } from 'lucide-react';
import { useEffect } from 'react';
import { formatDKK } from '@/lib/pricing';
import { useTranslation } from '@/lib/i18n';

export const StepAddons = () => {
  const { state, update, availableAddons, fetchPricing, pricingLoading } = useBooking();
  const { t } = useTranslation();

  useEffect(() => {
    if (state.checkIn && state.checkOut) fetchPricing();
  }, [fetchPricing, state.checkIn, state.checkOut, state.selectedAddonIds]);

  const toggleAddon = (addonId: string) => {
    const current = state.selectedAddonIds;
    const next = current.includes(addonId) ? current.filter((id) => id !== addonId) : [...current, addonId];
    update({ selectedAddonIds: next });
  };

  const priceLabel = (addon: { price: number; price_type: string }) => {
    const formatted = formatDKK(addon.price);
    switch (addon.price_type) {
      case 'per_guest': return `${formatted} ${t('booking.addons.perGuest')}`;
      case 'per_night': return `${formatted} ${t('booking.addons.perNight')}`;
      case 'per_stay': return `${formatted} ${t('booking.addons.perStay')}`;
      default: return formatted;
    }
  };

  if (pricingLoading && availableAddons.length === 0) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground gap-2">
        <Loader2 className="h-5 w-5 animate-spin" /> {t('booking.addons.loading')}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="font-display text-3xl md:text-4xl font-semibold text-foreground mb-2">{t('booking.addons.title')}</h2>
        <p className="text-muted-foreground">{t('booking.addons.subtitle')}</p>
      </div>

      {availableAddons.length === 0 ? (
        <div className="max-w-md mx-auto text-center py-8">
          <p className="text-muted-foreground">{t('booking.addons.none')}</p>
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

      <p className="text-center text-sm text-muted-foreground max-w-md mx-auto">{t('booking.addons.skip')}</p>
    </div>
  );
};
