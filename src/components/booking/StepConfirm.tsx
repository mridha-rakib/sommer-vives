import { useBooking } from './BookingContext';
import { BookingSummary } from './BookingSummary';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { CreditCard, Loader2, AlertCircle, Shield, Home, Tag, CheckCircle2, ArrowRight, Lock } from 'lucide-react';
import { formatDKK } from '@/lib/pricing';
import { useEffect, useRef, useState, useCallback } from 'react';
import { loadStripe, type Stripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useTranslation } from '@/lib/i18n';

let stripePromise: Promise<Stripe | null> | null = null;
const getStripe = (): Promise<Stripe | null> => {
  if (stripePromise) return stripePromise;
  stripePromise = (async () => {
    const buildTimeKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string | undefined;
    if (buildTimeKey) return loadStripe(buildTimeKey);
    const { data, error } = await supabase.functions.invoke('stripe-config');
    if (error || !data?.publishableKey) {
      console.error('Failed to load Stripe config', error);
      return null;
    }
    return loadStripe(data.publishableKey);
  })();
  return stripePromise;
};

const STRIPE_LOCALE_MAP: Record<string, 'da' | 'en' | 'de' | 'nl'> = { da: 'da', en: 'en', de: 'de', nl: 'nl' };

// ─── Inner payment form (must be inside <Elements>) ─────────────────────────
function StripePaymentForm({
  bookingId,
  totalDisplay,
  onBack,
}: {
  bookingId: string;
  totalDisplay: string;
  onBack: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const { close, reset } = useBooking();
  const { t } = useTranslation();
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  const handlePay = async () => {
    if (!stripe || !elements) return;
    setPaying(true);
    setPayError(null);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/booking-success?booking_id=${bookingId}`,
      },
      redirect: 'if_required',
    });

    if (error) {
      setPayError(error.message || 'Betalingen mislykkedes. Prøv igen.');
      setPaying(false);
      return;
    }

    if (paymentIntent?.status === 'succeeded') {
      reset();
      close();
      navigate(`/booking-success?payment_intent=${paymentIntent.id}&booking_id=${bookingId}`);
      return;
    }

    // For payment intents that require further action, Stripe handles redirect
    setPaying(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-2">
        <Lock className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium text-foreground">Sikker kortbetaling via Stripe</span>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <PaymentElement
          onReady={() => setReady(true)}
          options={{
            layout: 'tabs',
            fields: { billingDetails: { email: 'never' } },
          }}
        />
      </div>

      {payError && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <p className="text-sm text-destructive">{payError}</p>
        </div>
      )}

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} disabled={paying} className="flex-1 h-12">
          Tilbage
        </Button>
        <Button
          onClick={handlePay}
          disabled={!stripe || !elements || !ready || paying}
          size="lg"
          className="flex-1 h-12 text-base gap-2"
        >
          {paying ? (
            <><Loader2 className="h-5 w-5 animate-spin" /> Behandler...</>
          ) : (
            <><CreditCard className="h-5 w-5" /> Betal {totalDisplay}</>
          )}
        </Button>
      </div>

      <p className="text-center text-xs text-muted-foreground">
        Du betaler sikkert via Stripe. Dine kortoplysninger gemmes aldrig hos os.
      </p>
    </div>
  );
}

// ─── Main StepConfirm ────────────────────────────────────────────────────────
export const StepConfirm = () => {
  const {
    state, update, lineItems, totalPrice, fetchPricing, pricingLoading,
    validationErrors, quoteValid, submitBooking, submitting, submitError,
    bookingResult, close, reset, clientSecret, pendingBookingId, clearPaymentState,
  } = useBooking();

  const [discountDraft, setDiscountDraft] = useState(state.discountCode);
  const didMountRef = useRef(false);
  const discountError = validationErrors.find((e) => e.field === 'discount_code');
  const hasDiscount = lineItems.some((i) => i.type === 'discount');
  const depositAmount = Math.round(totalPrice * 0.3);
  const remainingAmount = Math.max(0, totalPrice - depositAmount);
  const payAmount = state.paymentOption === 'deposit' ? depositAmount : totalPrice;

  useEffect(() => {
    if (!didMountRef.current) { didMountRef.current = true; return; }
    if (state.checkIn && state.checkOut) fetchPricing();
  }, [fetchPricing, state.checkIn, state.checkOut, state.discountCode]);

  const applyDiscount = () => update({ discountCode: discountDraft.trim() });
  const clearDiscount = () => { setDiscountDraft(''); update({ discountCode: '' }); };

  const handleBack = useCallback(() => {
    clearPaymentState();
  }, [clearPaymentState]);

  // ── Free / comped booking confirmation ──
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
        <Button onClick={() => { reset(); close(); }} size="lg" className="gap-2">
          Luk <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  // ── Stripe Payment Element (after booking record created) ──
  if (clientSecret && pendingBookingId) {
    const appearance = {
      theme: 'night' as const,
      variables: {
        colorPrimary: '#c8a96e',
        colorBackground: '#1a1f14',
        colorText: '#f5f0e8',
        colorDanger: '#ef4444',
        fontFamily: 'system-ui, sans-serif',
        borderRadius: '12px',
      },
    };

    return (
      <div className="space-y-6 max-w-lg mx-auto">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 mb-4">
            <CreditCard className="h-7 w-7 text-primary" />
          </div>
          <h2 className="font-display text-3xl md:text-4xl font-semibold text-foreground mb-2">Betaling</h2>
          <p className="text-muted-foreground text-sm">Indtast dine betalingsoplysninger nedenfor</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-muted-foreground">Beløb</span>
            <span className="font-semibold text-primary">{formatDKK(payAmount)}</span>
          </div>
          {state.paymentOption === 'deposit' && (
            <p className="text-xs text-muted-foreground">Depositum · restbeløb {formatDKK(remainingAmount)} betales inden ankomst</p>
          )}
        </div>

        <Elements stripe={getStripe()} options={{ clientSecret, appearance }}>
          <StripePaymentForm
            bookingId={pendingBookingId}
            totalDisplay={formatDKK(payAmount)}
            onBack={handleBack}
          />
        </Elements>
      </div>
    );
  }

  // ── Booking review (default) ──
  return (
    <div className="space-y-8">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 mb-4">
          <Home className="h-7 w-7 text-primary" />
        </div>
        <h2 className="font-display text-3xl md:text-4xl font-semibold text-foreground mb-2">Bekræft booking</h2>
        <p className="text-muted-foreground">Gennemgå din booking og fortsæt til betaling</p>
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
              onChange={(e) => setDiscountDraft(e.target.value)}
              placeholder="Indtast rabatkode"
              className="bg-background"
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); applyDiscount(); } }}
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
              <button type="button" onClick={clearDiscount} className="text-muted-foreground hover:text-foreground transition-colors">Fjern</button>
            </div>
          )}
          {discountError && <p className="mt-3 text-xs text-destructive">{discountError.message}</p>}
        </div>

        {totalPrice > 0 && (
          <div className="bg-card border border-border rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <CreditCard className="h-4 w-4 text-primary" />
              <h4 className="font-display text-sm font-semibold text-foreground uppercase tracking-wider">Betaling</h4>
            </div>
            <RadioGroup value={state.paymentOption} onValueChange={(v) => update({ paymentOption: v as 'full' | 'deposit' })} className="space-y-2">
              <label className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background px-4 py-3 cursor-pointer">
                <div className="flex items-center gap-3">
                  <RadioGroupItem value="full" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Betal hele beløbet</p>
                    <p className="text-xs text-muted-foreground">Ingen restbetaling senere</p>
                  </div>
                </div>
                <span className="text-sm font-semibold text-foreground">{formatDKK(totalPrice)}</span>
              </label>
              <label className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background px-4 py-3 cursor-pointer">
                <div className="flex items-center gap-3">
                  <RadioGroupItem value="deposit" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Betal depositum</p>
                    <p className="text-xs text-muted-foreground">Restbeløb: {formatDKK(remainingAmount)}</p>
                  </div>
                </div>
                <span className="text-sm font-semibold text-foreground">{formatDKK(depositAmount)}</span>
              </label>
            </RadioGroup>
          </div>
        )}

        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
          <div className="flex items-center gap-3 mb-2">
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
            <strong className="text-foreground">{formatDKK(state.paymentOption === 'deposit' ? depositAmount : totalPrice)}</strong>
            {totalPrice > 0 ? (state.paymentOption === 'deposit' ? ' nu.' : ' i fuld betaling.') : '.'}
          </p>
        </div>

        {submitError && (
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <p className="text-sm text-destructive">{submitError}</p>
          </div>
        )}

        <Button
          onClick={() => submitBooking()}
          disabled={submitting || pricingLoading || !quoteValid}
          size="lg"
          className="w-full h-14 text-lg gap-2"
        >
          {submitting ? (
            <><Loader2 className="h-5 w-5 animate-spin" /> Opretter booking...</>
          ) : totalPrice <= 0 ? (
            <><CheckCircle2 className="h-5 w-5" /> Bekræft booking</>
          ) : (
            <><CreditCard className="h-5 w-5" /> Fortsæt til betaling — {formatDKK(payAmount)}</>
          )}
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          Ved at fortsætte accepterer du vores{' '}
          <span className="underline cursor-pointer">betingelser</span>.
        </p>
      </div>
    </div>
  );
};
