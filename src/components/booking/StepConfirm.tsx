import { useBooking } from './BookingContext';
import { BookingSummary } from './BookingSummary';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CreditCard, Loader2, AlertCircle, Shield, Home, Tag, CheckCircle2, ArrowRight } from 'lucide-react';
import { formatDKK } from '@/lib/pricing';
import { useEffect, useRef, useState } from 'react';

export const StepConfirm = () => {
  const {
    state, update, lineItems, totalPrice, fetchPricing, pricingLoading, validationErrors, quoteValid,
    submitBooking, submitting, submitError, bookingResult, close, reset,
  } = useBooking();
  const [discountDraft, setDiscountDraft] = useState(state.discountCode);
  const didMountRef = useRef(false);
  const discountError = validationErrors.find((error) => error.field === 'discount_code');
  const hasDiscount = lineItems.some((item) => item.type === 'discount');

  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }
    if (state.checkIn && state.checkOut) fetchPricing();
  }, [state.discountCode]);

  const applyDiscount = () => {
    update({ discountCode: discountDraft.trim() });
  };

  const clearDiscount = () => {
    setDiscountDraft('');
    update({ discountCode: '' });
  };

  const finishNonStripeFlow = () => {
    reset();
    close();
  };

  if (bookingResult && !bookingResult.paymentRequired) {
    return (
      <div className="max-w-lg mx-auto text-center space-y-6 py-10">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10">
          <CheckCircle2 className="h-8 w-8 text-primary" />
        </div>
        <div>
          <h2 className="font-display text-3xl md:text-4xl font-semibold text-foreground mb-2">Booking modtaget</h2>
          <p className="text-muted-foreground">
            Din booking er oprettet. Vi sender en bekræftelse til {state.email}.
          </p>
        </div>
        {bookingResult.bookingId && (
          <div className="rounded-xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
            Bookingnummer: <span className="font-medium text-foreground">{bookingResult.bookingId.slice(0, 8).toUpperCase()}</span>
          </div>
        )}
        <Button onClick={finishNonStripeFlow} size="lg" className="gap-2">
          Luk <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 mb-4">
          <Home className="h-7 w-7 text-primary" />
        </div>
        <h2 className="font-display text-3xl md:text-4xl font-semibold text-foreground mb-2">Bekræft booking</h2>
        <p className="text-muted-foreground">Gennemgå din booking og betal</p>
      </div>

      <div className="max-w-lg mx-auto space-y-5">
        <div className="rounded-2xl overflow-hidden border border-border">
          <div className="bg-secondary/50 px-6 py-3">
            <h4 className="font-display text-sm font-semibold text-foreground uppercase tracking-wider">Bookingdetaljer</h4>
          </div>
          <div className="p-0"><BookingSummary /></div>
        </div>

        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="bg-secondary/50 px-6 py-3">
            <h4 className="font-display text-sm font-semibold text-foreground uppercase tracking-wider">Kontaktoplysninger</h4>
          </div>
          <div className="px-6 py-4 space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Navn</span>
              <span className="text-foreground font-medium">{state.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">E-mail</span>
              <span className="text-foreground font-medium">{state.email}</span>
            </div>
            {state.phone && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Telefon</span>
                <span className="text-foreground font-medium">{state.phone}</span>
              </div>
            )}
            {state.message && (
              <div className="pt-2 border-t border-border">
                <span className="text-muted-foreground text-xs uppercase tracking-wider">Besked</span>
                <p className="text-foreground mt-1">{state.message}</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Tag className="h-4 w-4 text-primary" />
            <h4 className="font-display text-sm font-semibold text-foreground uppercase tracking-wider">Rabatkode</h4>
          </div>
          <div className="flex gap-2">
            <Input
              value={discountDraft}
              onChange={(event) => setDiscountDraft(event.target.value)}
              placeholder="Indtast rabatkode"
              className="bg-background"
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  applyDiscount();
                }
              }}
            />
            <Button type="button" variant="outline" onClick={applyDiscount} disabled={pricingLoading}>
              {pricingLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Anvend'}
            </Button>
          </div>
          {state.discountCode && (
            <div className="mt-3 flex items-center justify-between gap-3 text-xs">
              <span className={hasDiscount && !discountError ? 'text-emerald-500' : 'text-muted-foreground'}>
                {hasDiscount && !discountError ? `Rabatkode "${state.discountCode}" er anvendt.` : `Kode: ${state.discountCode}`}
              </span>
              <button type="button" onClick={clearDiscount} className="text-muted-foreground hover:text-foreground transition-colors">
                Fjern
              </button>
            </div>
          )}
          {discountError && (
            <p className="mt-3 text-xs text-destructive">{discountError.message}</p>
          )}
        </div>

        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Shield className="h-4 w-4 text-primary" />
            </div>
            <div>
              <span className="text-sm font-semibold text-foreground">{totalPrice > 0 ? 'Sikker betaling' : 'Ingen betaling nødvendig'}</span>
              <p className="text-xs text-muted-foreground mt-0.5">{totalPrice > 0 ? 'Krypteret via Stripe' : 'Din booking bekræftes uden checkout'}</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground text-center">
            {totalPrice > 0 ? 'Du betaler' : 'Total efter rabat'}{' '}
            <strong className="text-foreground">{formatDKK(totalPrice)}</strong>{' '}
            {totalPrice > 0 ? 'i fuld betaling.' : '.'}
          </p>
        </div>

        {submitError && (
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <p className="text-sm text-destructive">{submitError}</p>
          </div>
        )}

        <Button onClick={() => submitBooking()} disabled={submitting || pricingLoading || !quoteValid} size="lg" className="w-full h-14 text-lg gap-2">
          {submitting ? (
            <><Loader2 className="h-5 w-5 animate-spin" /> Behandler...</>
          ) : totalPrice <= 0 ? (
            <><CheckCircle2 className="h-5 w-5" /> Bekræft booking</>
          ) : (
            <><CreditCard className="h-5 w-5" /> Betal — {formatDKK(totalPrice)}</>
          )}
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          Ved at betale accepterer du vores{' '}
          <span className="underline cursor-pointer">betingelser</span>.
        </p>
      </div>
    </div>
  );
};
