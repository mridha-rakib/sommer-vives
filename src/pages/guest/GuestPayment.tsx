import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { GuestLayout } from '@/components/layout/GuestLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Receipt, CheckCircle2, Clock, XCircle, AlertCircle } from 'lucide-react';

const STATUS_MAP: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: any }> = {
  paid: { label: 'Betalt', variant: 'default', icon: CheckCircle2 },
  pending: { label: 'Afventer', variant: 'secondary', icon: Clock },
  unpaid: { label: 'Ubetalt', variant: 'outline', icon: AlertCircle },
  failed: { label: 'Fejlet', variant: 'destructive', icon: XCircle },
  refunded: { label: 'Refunderet', variant: 'secondary', icon: Receipt },
  partially_paid: { label: 'Delvist betalt', variant: 'outline', icon: Clock },
};

export default function GuestPayment() {
  const { user, signOut } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrders();
  }, [user]);

  const loadOrders = async () => {
    if (!user?.id) { setLoading(false); return; }

    const { data } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('user_type', 'guest')
      .order('created_at', { ascending: false });

    setOrders(data || []);
    setLoading(false);
  };

  const formatAmount = (cents: number) => `${(cents / 100).toLocaleString('da-DK')} kr`;

  return (
    <GuestLayout guestEmail={user?.email} onLogout={signOut}>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Betaling</h1>
          <p className="text-sm text-muted-foreground mt-1">Overblik over dine betalinger og kvitteringer</p>
        </div>

        {loading ? (
          <div className="bg-card border border-border rounded-xl p-8 text-center">
            <p className="text-muted-foreground">Henter betalinger...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-12 text-center">
            <CreditCard className="w-12 h-12 mx-auto mb-4 text-muted-foreground/40" />
            <p className="text-muted-foreground">Ingen betalinger endnu.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const status = STATUS_MAP[order.payment_status] || STATUS_MAP.pending;
              const StatusIcon = status.icon;
              return (
                <Card key={order.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base font-medium flex items-center gap-2">
                        <StatusIcon className="w-4 h-4" />
                        Ordre
                      </CardTitle>
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(order.created_at).toLocaleDateString('da-DK', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {order.order_items?.map((item: any) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          {item.label} {item.quantity > 1 ? `×${item.quantity}` : ''}
                        </span>
                        <span className="font-medium">{formatAmount(item.total)}</span>
                      </div>
                    ))}
                    <div className="border-t pt-2 flex justify-between font-semibold text-sm">
                      <span>Total</span>
                      <span>{formatAmount(order.total)}</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </GuestLayout>
  );
}
