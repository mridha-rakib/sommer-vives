import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { GuestLayout } from '@/components/layout/GuestLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, Users, CreditCard, ShoppingBag, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';

export default function GuestReservation() {
  const { user, signOut } = useAuth();
  const [booking, setBooking] = useState<any>(null);
  const [property, setProperty] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    const { data: bookings } = await supabase
      .from('bookings')
      .select('*')
      .eq('guest_email', user.email)
      .neq('status', 'cancelled')
      .order('check_in', { ascending: false })
      .limit(1);

    if (bookings?.[0]) {
      setBooking(bookings[0]);
      const { data } = await supabase.from('properties').select('title, region').eq('id', bookings[0].property_id).single();
      setProperty(data);
    }
    setLoading(false);
  };

  if (loading) {
    return <GuestLayout guestEmail={user?.email} onLogout={signOut}><div className="flex justify-center py-20"><div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" /></div></GuestLayout>;
  }

  if (!booking) {
    return <GuestLayout guestEmail={user?.email} onLogout={signOut}><div className="text-center py-20 text-muted-foreground text-sm">Ingen reservation fundet</div></GuestLayout>;
  }

  return (
    <GuestLayout guestEmail={user?.email} onLogout={signOut}>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Reservation</h1>
          <p className="text-sm text-muted-foreground mt-1">{property?.title} · {property?.region}</p>
        </div>

        {/* Summary */}
        <Card>
          <CardContent className="p-5 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-[11px] text-muted-foreground uppercase tracking-wide">Ankomst</div>
                <div className="text-sm font-semibold text-foreground">{format(new Date(booking.check_in), 'd. MMMM yyyy', { locale: da })}</div>
              </div>
              <div>
                <div className="text-[11px] text-muted-foreground uppercase tracking-wide">Afrejse</div>
                <div className="text-sm font-semibold text-foreground">{format(new Date(booking.check_out), 'd. MMMM yyyy', { locale: da })}</div>
              </div>
              <div>
                <div className="text-[11px] text-muted-foreground uppercase tracking-wide">Gæster</div>
                <div className="text-sm font-semibold text-foreground">{booking.guests_count || 1}</div>
              </div>
              <div>
                <div className="text-[11px] text-muted-foreground uppercase tracking-wide">Nætter</div>
                <div className="text-sm font-semibold text-foreground">{booking.nights || '—'}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Price breakdown */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-accent" />
              Pris og betaling
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Ophold ({booking.nights || '—'} nætter)</span>
              <span className="text-foreground">{Number(booking.base_price).toLocaleString('da-DK')} {booking.currency}</span>
            </div>
            {booking.cleaning_fee > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Rengøring</span>
                <span className="text-foreground">{Number(booking.cleaning_fee).toLocaleString('da-DK')} {booking.currency}</span>
              </div>
            )}
            {booking.service_fee > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Servicegebyr</span>
                <span className="text-foreground">{Number(booking.service_fee).toLocaleString('da-DK')} {booking.currency}</span>
              </div>
            )}
            <div className="border-t border-border pt-2 flex justify-between text-sm font-semibold">
              <span className="text-foreground">Total</span>
              <span className="text-accent">{Number(booking.total_amount).toLocaleString('da-DK')} {booking.currency}</span>
            </div>
            <div className="flex justify-between text-xs mt-2">
              <span className="text-muted-foreground">Betalingsstatus</span>
              <Badge variant="outline" className={booking.payment_status === 'paid' ? 'bg-emerald-400/15 text-emerald-400 border-emerald-400/20' : 'bg-amber-400/15 text-amber-400 border-amber-400/20'}>
                {booking.payment_status === 'paid' ? 'Betalt' : 'Afventer'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Case / booking ref */}
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-xs text-muted-foreground">Booking-reference</div>
              <div className="font-mono text-sm font-medium text-foreground">{booking.case_number || booking.id.slice(0, 12)}</div>
            </div>
            <Badge variant="outline" className="text-[10px]">
              {booking.status === 'confirmed' ? 'Bekræftet' : booking.status === 'checked_in' ? 'Checked-in' : booking.status}
            </Badge>
          </CardContent>
        </Card>

        {/* Cancellation */}
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">
              <strong className="text-foreground">Annulleringsbetingelser:</strong> Gratis afbestilling op til 30 dage før ankomst. 
              Herefter opkræves 50% af opholdets pris. Inden for 14 dage er opholdet ikke-refunderbart.
            </div>
          </CardContent>
        </Card>
      </div>
    </GuestLayout>
  );
}
