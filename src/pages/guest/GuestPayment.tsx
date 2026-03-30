import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { GuestLayout } from '@/components/layout/GuestLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Receipt, CheckCircle2, Clock, XCircle, AlertCircle, Wallet } from 'lucide-react';

const STATUS_MAP: Record<string, { label: string; cls: string; icon: any }> = {
  paid: { label: 'Betalt', cls: 'bg-emerald-400/15 text-emerald-400 border-emerald-400/20', icon: CheckCircle2 },
  pending: { label: 'Afventer', cls: 'bg-amber-400/15 text-amber-400 border-amber-400/20', icon: Clock },
  unpaid: { label: 'Ubetalt', cls: 'bg-muted-foreground/15 text-muted-foreground', icon: AlertCircle },
  failed: { label: 'Fejlet', cls: 'bg-destructive/15 text-destructive', icon: XCircle },
  refunded: { label: 'Refunderet', cls: 'bg-muted-foreground/15 text-muted-foreground', icon: Receipt },
};

export default function GuestPayment() {
  const { user, signOut } = useAuth();
  const [booking, setBooking] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    const [bookingRes, ordersRes] = await Promise.all([
      supabase.from('bookings').select('*').eq('guest_email', user.email).neq('status', 'cancelled')
        .order('check_in', { ascending: false }).limit(1),
      supabase.from('orders').select('*, order_items(*)').eq('user_type', 'guest')
        .order('created_at', { ascending: false }),
    ]);
    if (bookingRes.data?.[0]) setBooking(bookingRes.data[0]);
    setOrders(ordersRes.data || []);
    setLoading(false);
  };

  const formatDKK = (amount: number) => `${amount.toLocaleString('da-DK')} kr`;
  const formatCents = (cents: number) => formatDKK(cents / 100);

  return (
    <GuestLayout guestEmail={user?.email} onLogout={signOut}>
      <div className="space-y-5">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Betaling</h1>
          <p className="text-sm text-muted-foreground mt-1">Overblik over betalinger og kvitteringer</p>
        </div>

        {/* Booking payment summary */}
        {booking && (
          <Card className="border-accent/20">
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-foreground">Booking-betaling</div>
                  <div className="text-xs text-muted-foreground">{booking.case_number || 'Dit ophold'}</div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Ophold</span>
                  <span className="font-medium">{formatDKK(Number(booking.base_price))}</span>
                </div>
                {Number(booking.cleaning_fee) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Rengøring</span>
                    <span>{formatDKK(Number(booking.cleaning_fee))}</span>
                  </div>
                )}
                <div className="border-t border-border pt-2 flex justify-between font-semibold text-sm">
                  <span>Total</span>
                  <span className="text-accent">{formatDKK(Number(booking.total_amount))}</span>
                </div>
                <div className="flex justify-between items-center pt-1">
                  <span className="text-xs text-muted-foreground">Status</span>
                  <Badge variant="outline" className={`text-[10px] ${booking.payment_status === 'paid' ? 'bg-emerald-400/15 text-emerald-400 border-emerald-400/20' : 'bg-amber-400/15 text-amber-400 border-amber-400/20'}`}>
                    {booking.payment_status === 'paid' ? 'Betalt' : 'Afventer'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Orders / extras */}
        {orders.length > 0 && (
          <>
            <h2 className="text-sm font-semibold text-foreground">Tilkøb og ekstra</h2>
            {orders.map(order => {
              const st = STATUS_MAP[order.payment_status] || STATUS_MAP.pending;
              const StIcon = st.icon;
              return (
                <Card key={order.id}>
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <StIcon className="w-4 h-4" />
                        Ordre
                      </div>
                      <Badge variant="outline" className={`text-[10px] ${st.cls}`}>{st.label}</Badge>
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      {new Date(order.created_at).toLocaleDateString('da-DK', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </div>
                    {order.order_items?.map((item: any) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{item.label} {item.quantity > 1 ? `×${item.quantity}` : ''}</span>
                        <span className="font-medium">{formatCents(item.total)}</span>
                      </div>
                    ))}
                    <div className="border-t pt-2 flex justify-between font-semibold text-sm">
                      <span>Total</span>
                      <span>{formatCents(order.total)}</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </>
        )}

        {loading && (
          <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">Henter betalinger...</CardContent></Card>
        )}

        {!loading && !booking && orders.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <CreditCard className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
              <p className="text-muted-foreground text-sm">Ingen betalinger endnu</p>
            </CardContent>
          </Card>
        )}
      </div>
    </GuestLayout>
  );
}
