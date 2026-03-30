import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { GuestLayout } from '@/components/layout/GuestLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, Users, CreditCard, Copy, CheckCircle2, FileText, ShoppingBag } from 'lucide-react';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function GuestReservation() {
  const { user, signOut } = useAuth();
  const [booking, setBooking] = useState<any>(null);
  const [property, setProperty] = useState<any>(null);
  const [extras, setExtras] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    const { data: bookings } = await supabase
      .from('bookings').select('*').eq('guest_email', user.email)
      .neq('status', 'cancelled').order('check_in', { ascending: false }).limit(1);

    if (bookings?.[0]) {
      setBooking(bookings[0]);
      const [propRes, extrasRes] = await Promise.all([
        supabase.from('properties').select('title, region').eq('id', bookings[0].property_id).single(),
        supabase.from('orders').select('*, order_items(*)').eq('user_type', 'guest').eq('payment_status', 'paid'),
      ]);
      setProperty(propRes.data);
      setExtras(extrasRes.data || []);
    }
    setLoading(false);
  };

  const copyRef = () => {
    const ref = booking?.case_number || booking?.id;
    navigator.clipboard.writeText(ref);
    toast.success('Kopieret');
  };

  if (loading) {
    return <GuestLayout guestEmail={user?.email} onLogout={signOut}><div className="flex justify-center py-20"><div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" /></div></GuestLayout>;
  }

  if (!booking) {
    return <GuestLayout guestEmail={user?.email} onLogout={signOut}><div className="text-center py-20 text-muted-foreground text-sm">Ingen reservation fundet</div></GuestLayout>;
  }

  const statusConfig: Record<string, { label: string; cls: string }> = {
    confirmed: { label: 'Bekræftet', cls: 'bg-emerald-400/15 text-emerald-400 border-emerald-400/20' },
    checked_in: { label: 'Checked-in', cls: 'bg-accent/15 text-accent border-accent/20' },
    pending: { label: 'Afventer', cls: 'bg-amber-400/15 text-amber-400 border-amber-400/20' },
    completed: { label: 'Afsluttet', cls: 'bg-muted-foreground/15 text-muted-foreground border-muted-foreground/20' },
  };
  const st = statusConfig[booking.status] || statusConfig.pending;

  return (
    <GuestLayout guestEmail={user?.email} onLogout={signOut}>
      <div className="space-y-5">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">Reservation</h1>
            <p className="text-sm text-muted-foreground mt-1">{property?.title} · {property?.region}</p>
          </div>
          <Badge variant="outline" className={`${st.cls} text-[10px]`}>{st.label}</Badge>
        </div>

        {/* Booking ref */}
        <Card className="bg-muted/30">
          <CardContent className="p-4 flex items-center gap-3">
            <FileText className="w-5 h-5 text-accent shrink-0" />
            <div className="flex-1">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Booking-reference</div>
              <div className="font-mono text-sm font-bold text-foreground">{booking.case_number || booking.id.slice(0, 12)}</div>
            </div>
            <button onClick={copyRef} className="p-2 rounded-lg hover:bg-muted transition-colors">
              <Copy className="w-4 h-4 text-muted-foreground" />
            </button>
          </CardContent>
        </Card>

        {/* Dates & guests */}
        <Card>
          <CardContent className="p-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Ankomst</div>
                <div className="text-sm font-semibold text-foreground mt-0.5">{format(new Date(booking.check_in), 'd. MMMM yyyy', { locale: da })}</div>
                <div className="text-xs text-muted-foreground">kl. 15:00</div>
              </div>
              <div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Afrejse</div>
                <div className="text-sm font-semibold text-foreground mt-0.5">{format(new Date(booking.check_out), 'd. MMMM yyyy', { locale: da })}</div>
                <div className="text-xs text-muted-foreground">kl. 10:00</div>
              </div>
              <div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Gæster</div>
                <div className="text-sm font-semibold text-foreground mt-0.5 flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-muted-foreground" />{booking.guests_count || 1}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Nætter</div>
                <div className="text-sm font-semibold text-foreground mt-0.5 flex items-center gap-1">
                  <CalendarDays className="w-3.5 h-3.5 text-muted-foreground" />{booking.nights || '—'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Price breakdown */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-accent" />
              Pris og betaling
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Ophold ({booking.nights || '—'} nætter)</span>
              <span className="text-foreground font-medium">{Number(booking.base_price).toLocaleString('da-DK')} {booking.currency}</span>
            </div>
            {Number(booking.cleaning_fee) > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Rengøring</span>
                <span className="text-foreground">{Number(booking.cleaning_fee).toLocaleString('da-DK')} {booking.currency}</span>
              </div>
            )}
            {Number(booking.service_fee) > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Servicegebyr</span>
                <span className="text-foreground">{Number(booking.service_fee).toLocaleString('da-DK')} {booking.currency}</span>
              </div>
            )}
            <div className="border-t border-border pt-2 flex justify-between text-sm font-semibold">
              <span className="text-foreground">Total</span>
              <span className="text-accent">{Number(booking.total_amount).toLocaleString('da-DK')} {booking.currency}</span>
            </div>
            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-muted-foreground">Betalingsstatus</span>
              <Badge variant="outline" className={booking.payment_status === 'paid' ? 'bg-emerald-400/15 text-emerald-400 border-emerald-400/20 text-[10px]' : 'bg-amber-400/15 text-amber-400 border-amber-400/20 text-[10px]'}>
                {booking.payment_status === 'paid' ? 'Betalt' : 'Afventer'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Purchased extras */}
        {extras.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-accent" />
                Købte tilkøb
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {extras.flatMap(o => o.order_items || []).map((item: any) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    {item.label}
                  </span>
                  <span className="font-medium">{(item.total / 100).toLocaleString('da-DK')} kr</span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Add extras CTA */}
        <Link to="/guest/addons">
          <Card className="hover:border-accent/20 transition-colors cursor-pointer">
            <CardContent className="p-4 flex items-center gap-3">
              <ShoppingBag className="w-5 h-5 text-accent" />
              <div className="flex-1">
                <div className="text-sm font-medium text-foreground">Tilkøb ekstra services</div>
                <div className="text-xs text-muted-foreground">Sengelinned, tidlig check-in og meget mere</div>
              </div>
              <Button size="sm" variant="outline" className="text-xs shrink-0">Se tilkøb</Button>
            </CardContent>
          </Card>
        </Link>

        {/* Cancellation policy */}
        <Card className="bg-muted/20">
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground leading-relaxed">
              <strong className="text-foreground">Annulleringsbetingelser:</strong> Gratis afbestilling op til 30 dage før ankomst. 
              Herefter opkræves 50% af opholdets pris. Inden for 14 dage er opholdet ikke-refunderbart.
            </div>
          </CardContent>
        </Card>
      </div>
    </GuestLayout>
  );
}
