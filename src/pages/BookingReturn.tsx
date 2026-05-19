import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';

type ReturnKind = 'success' | 'cancelled';
type VerifyState = 'idle' | 'checking' | 'confirmed' | 'pending' | 'failed';

export default function BookingReturn({ kind }: { kind: ReturnKind }) {
  const [params] = useSearchParams();
  const [verifyState, setVerifyState] = useState<VerifyState>(kind === 'success' ? 'checking' : 'idle');
  const sessionId = params.get('session_id');
  const bookingId = params.get('booking_id');

  useEffect(() => {
    if (kind !== 'success' || !sessionId || !bookingId) {
      setVerifyState(kind === 'success' ? 'pending' : 'idle');
      return;
    }

    let cancelled = false;

    const verify = async () => {
      const { data, error } = await supabase.functions.invoke('verify-payment', {
        body: { bookingId, sessionId },
      });

      if (cancelled) return;
      if (error) {
        setVerifyState('pending');
        return;
      }

      setVerifyState(data?.status === 'paid' || data?.status === 'partially_paid' ? 'confirmed' : 'pending');
    };

    verify();

    return () => {
      cancelled = true;
    };
  }, [bookingId, kind, sessionId]);

  const content = useMemo(() => {
    if (kind === 'cancelled') {
      return {
        icon: <AlertCircle className="h-10 w-10 text-amber-400" />,
        title: 'Betalingen blev ikke gennemført',
        body: 'Din booking er endnu ikke bekræftet. Du kan prøve igen eller kontakte os, hvis du har spørgsmål.',
      };
    }

    if (verifyState === 'checking') {
      return {
        icon: <Loader2 className="h-10 w-10 text-accent animate-spin" />,
        title: 'Vi kontrollerer betalingen',
        body: 'Vent et øjeblik mens vi bekræfter din booking.',
      };
    }

    return {
      icon: <CheckCircle2 className="h-10 w-10 text-emerald-400" />,
      title: 'Tak for din booking',
      body: verifyState === 'confirmed'
        ? 'Betalingen er registreret, og din booking er bekræftet.'
        : 'Betalingen er modtaget hos Stripe. Din booking bliver opdateret automatisk, så snart bekræftelsen er færdigbehandlet.',
    };
  }, [kind, verifyState]);

  return (
    <>
      <Header />
      <main className="min-h-screen bg-background pt-24 px-4">
        <Card className="max-w-lg mx-auto border-border/40 bg-card/60">
          <CardContent className="p-8 text-center">
            <div className="flex justify-center mb-5">{content.icon}</div>
            <h1 className="font-display text-2xl font-bold text-foreground mb-3">{content.title}</h1>
            <p className="text-sm text-muted-foreground leading-relaxed mb-6">{content.body}</p>
            <div className="flex flex-col sm:flex-row justify-center gap-3">
              {kind === 'cancelled' && (
                <Button asChild variant="gold">
                  <Link to="/listings">Find et ophold</Link>
                </Button>
              )}
              <Button asChild variant={kind === 'cancelled' ? 'outline' : 'gold'}>
                <Link to="/">Til forsiden</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
