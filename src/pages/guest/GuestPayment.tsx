import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, CheckCircle2, CreditCard, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { GuestLayout } from '@/components/layout/GuestLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { formatDateDK, formatDKK } from '@/lib/pricing';

export default function GuestPayment() {
  const { user, signOut } = useAuth();
  const [params] = useSearchParams();
  const queryClient = useQueryClient();
  const [paying, setPaying] = useState(false);
  const bookingId = params.get('booking_id');
  const paymentState = params.get('payment');
  const sessionId = params.get('session_id');

  const { data: booking, isLoading } = useQuery({
    queryKey: ['guest-payment-booking', bookingId, user?.email],
    enabled: !!user?.email,
    queryFn: async () => {
      let query = supabase
        .from('bookings')
        .select('id, case_number, check_in, check_out, guest_email, guest_name, amount_paid, amount_remaining, total_amount, payment_status, status, currency, created_at')
        .order('created_at', { ascending: false });

      if (bookingId) {
        query = query.eq('id', bookingId);
      } else {
        query = query.eq('guest_email', user!.email).gt('amount_remaining', 0).limit(1);
      }

      const { data, error } = await query.maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (paymentState !== 'success' || !bookingId || !sessionId) return;

    let cancelled = false;
    const verifyPayment = async () => {
      const { error } = await supabase.functions.invoke('verify-payment', {
        body: { bookingId, sessionId },
      });
      if (cancelled) return;
      if (error) {
        toast.error(error.message || 'Betalingen kunne ikke bekræftes endnu');
        return;
      }
      queryClient.invalidateQueries({ queryKey: ['guest-payment-booking', bookingId, user?.email] });
    };

    verifyPayment();
    return () => {
      cancelled = true;
    };
  }, [bookingId, paymentState, queryClient, sessionId, user?.email]);

  const handlePay = async () => {
    if (!booking?.id) return;
    setPaying(true);
    const { data, error } = await supabase.functions.invoke('create-booking-payment', {
      body: { bookingId: booking.id },
    });
    setPaying(false);

    if (error) {
      toast.error(error.message || 'Betalingen kunne ikke startes');
      return;
    }

    if (data?.checkout_url) {
      queryClient.invalidateQueries({ queryKey: ['guest-payment-booking'] });
      window.location.href = data.checkout_url;
    }
  };

  return (
    <GuestLayout onLogout={signOut} guestEmail={user?.email || undefined}>
      <div className="max-w-2xl mx-auto space-y-4">
        {paymentState === 'success' && (
          <Card className="border-emerald-500/20 bg-card/60">
            <CardContent className="py-4 flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground">Betaling modtaget</p>
                <p className="text-xs text-muted-foreground">Din booking bliver opdateret automatisk.</p>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="border-border/40 bg-card/60">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Betaling</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-8 w-40" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : !booking ? (
              <div className="py-8 text-center">
                <CheckCircle2 className="w-10 h-10 mx-auto mb-3 text-emerald-400" />
                <p className="text-sm font-medium text-foreground">Ingen udestående betalinger</p>
                <p className="text-xs text-muted-foreground mt-1">Alt er betalt for dine aktive bookinger.</p>
              </div>
            ) : (
              <>
                <div className="text-center py-6 rounded-xl bg-muted/20 border border-border/30">
                  <p className="text-3xl font-bold text-foreground">{formatDKK(booking.amount_remaining || 0)}</p>
                  <p className="text-xs text-muted-foreground mt-2">Restbeløb</p>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Booking</span>
                    <span className="text-foreground font-medium">{booking.case_number || booking.id.slice(0, 8)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Ophold</span>
                    <span className="text-foreground font-medium">
                      {formatDateDK(booking.check_in, 'medium')} - {formatDateDK(booking.check_out, 'medium')}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Betalt</span>
                    <span className="text-foreground font-medium">{formatDKK(booking.amount_paid || 0)}</span>
                  </div>
                </div>

                {(booking.amount_remaining || 0) > 0 ? (
                  <Button onClick={handlePay} disabled={paying} className="w-full justify-center gap-2">
                    {paying ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
                    Betal restbeløb
                  </Button>
                ) : (
                  <div className="py-3 px-4 rounded-lg bg-muted/20 border border-border/30 flex items-center gap-3">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    <p className="text-sm text-foreground">Bookingen er betalt.</p>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {paymentState === 'cancelled' && (
          <div className="py-3 px-4 rounded-lg bg-muted/20 border border-border/30 flex items-center gap-3">
            <AlertCircle className="h-4 w-4 text-amber-400" />
            <p className="text-sm text-foreground">Betalingen blev ikke gennemført.</p>
          </div>
        )}
      </div>
    </GuestLayout>
  );
}
