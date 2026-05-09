import { useBooking } from './BookingContext';
import { BookingSummary } from './BookingSummary';
import { Button } from '@/components/ui/button';
import { CreditCard, Loader2, AlertCircle, Shield, Home } from 'lucide-react';
import { formatDKK } from '@/lib/pricing';

export const StepConfirm = () => {
  const { state, totalPrice, submitBooking, submitting, submitError } = useBooking();

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

        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Shield className="h-4 w-4 text-primary" />
            </div>
            <div>
              <span className="text-sm font-semibold text-foreground">Sikker betaling</span>
              <p className="text-xs text-muted-foreground mt-0.5">Krypteret via Stripe</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground text-center">
            Du betaler{' '}
            <strong className="text-foreground">{formatDKK(totalPrice)}</strong>{' '}
            i fuld betaling.
          </p>
        </div>

        {submitError && (
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <p className="text-sm text-destructive">{submitError}</p>
          </div>
        )}

        <Button onClick={() => submitBooking()} disabled={submitting} size="lg" className="w-full h-14 text-lg gap-2">
          {submitting ? (
            <><Loader2 className="h-5 w-5 animate-spin" /> Behandler...</>
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
