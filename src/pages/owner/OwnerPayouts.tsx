import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { OwnerLayout } from '@/components/layout/OwnerLayout';
import { Wallet, CreditCard, Building } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';

interface Payout {
  id: string;
  amount: number;
  currency: string;
  status: string;
  payout_date: string | null;
  description: string | null;
  created_at: string;
  property_id: string | null;
}

export default function OwnerPayouts() {
  const { user } = useAuth();
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [pendingAmount, setPendingAmount] = useState(0);

  useEffect(() => {
    loadPayouts();
  }, [user]);

  const loadPayouts = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('payouts')
      .select('*')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false });

    if (data) {
      setPayouts(data);
      const completed = data.filter(p => p.status === 'completed').reduce((sum, p) => sum + Number(p.amount), 0);
      const pending = data.filter(p => p.status === 'pending').reduce((sum, p) => sum + Number(p.amount), 0);
      setTotalEarnings(completed);
      setPendingAmount(pending);
    }
    setLoading(false);
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-accent/20 text-accent',
      processing: 'bg-blue-100 text-blue-700',
      completed: 'bg-green-100 text-green-700',
      failed: 'bg-destructive/10 text-destructive',
    };
    const labels: Record<string, string> = {
      pending: 'Afventer',
      processing: 'Behandles',
      completed: 'Udbetalt',
      failed: 'Fejlet',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || styles.pending}`}>
        {labels[status] || status}
      </span>
    );
  };

  return (
    <OwnerLayout>
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-primary">Udbetalinger</h1>
        <p className="text-muted-foreground">Se dine indtægter og udbetalingshistorik</p>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-accent" />
            </div>
            <span className="text-muted-foreground text-sm">Total udbetalt</span>
          </div>
          <div className="font-display text-3xl font-bold text-primary">
            {totalEarnings.toLocaleString('da-DK')} kr
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
              <Building className="w-5 h-5 text-accent" />
            </div>
            <span className="text-muted-foreground text-sm">Afventer udbetaling</span>
          </div>
          <div className="font-display text-3xl font-bold text-accent">
            {pendingAmount.toLocaleString('da-DK')} kr
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-accent" />
            </div>
            <span className="text-muted-foreground text-sm">Betalingsmetode</span>
          </div>
          <Button variant="outline" size="sm" className="mt-2">
            Tilslut bankkonto
          </Button>
        </div>
      </div>

      {/* Stripe Connect placeholder */}
      <div className="bg-accent/5 border border-accent/20 rounded-xl p-6 mb-8">
        <h3 className="font-display text-lg font-semibold text-primary mb-2">Stripe Connect</h3>
        <p className="text-muted-foreground text-sm mb-4">
          For at modtage udbetalinger skal du tilslutte din bankkonto via Stripe Connect. 
          Dette sikrer hurtige og sikre overførsler direkte til din konto.
        </p>
        <Button variant="gold">Tilslut Stripe Connect</Button>
      </div>

      {/* Payout history */}
      <div className="bg-card rounded-xl border border-border">
        <div className="p-6 border-b border-border">
          <h2 className="font-display text-xl font-semibold text-primary">Udbetalingshistorik</h2>
        </div>

        {loading ? (
          <div className="p-6 text-center text-muted-foreground">Indlæser...</div>
        ) : payouts.length === 0 ? (
          <div className="p-12 text-center">
            <Wallet className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Ingen udbetalinger endnu.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {payouts.map(payout => (
              <div key={payout.id} className="p-6 flex items-center justify-between">
                <div>
                  <div className="font-medium text-primary">
                    {payout.description || 'Udbetaling'}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {format(new Date(payout.created_at), 'd. MMM yyyy', { locale: da })}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {getStatusBadge(payout.status)}
                  <span className="font-display text-lg font-semibold text-primary">
                    {Number(payout.amount).toLocaleString('da-DK')} {payout.currency}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </OwnerLayout>
  );
}
