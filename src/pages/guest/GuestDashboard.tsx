import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { GuestLayout } from '@/components/layout/GuestLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, MapPin, Users, Clock, ChevronRight, LifeBuoy, DoorOpen, ShoppingBag } from 'lucide-react';
import { format, differenceInDays, isFuture } from 'date-fns';
import { da } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { AppDownloadBanner } from '@/components/app/AppDownloadBanner';

export default function GuestDashboard() {
  const { user, signOut } = useAuth();
  const [booking, setBooking] = useState<any>(null);
  const [property, setProperty] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) loadStay();
  }, [user]);

  const loadStay = async () => {
    if (!user) return;
    // Find booking by guest email
    const { data: bookings } = await supabase
      .from('bookings')
      .select('*')
      .eq('guest_email', user.email)
      .neq('status', 'cancelled')
      .order('check_in', { ascending: false })
      .limit(1);

    if (bookings && bookings.length > 0) {
      setBooking(bookings[0]);
      const { data: prop } = await supabase
        .from('properties')
        .select('*')
        .eq('id', bookings[0].property_id)
        .single();
      setProperty(prop);
    }
    setLoading(false);
  };

  const daysUntil = booking ? differenceInDays(new Date(booking.check_in), new Date()) : 0;
  const isUpcoming = booking && isFuture(new Date(booking.check_in));
  const isCheckedIn = booking?.status === 'checked_in';

  const quickLinks = [
    { label: 'Check-in guide', href: '/guest/checkin', icon: DoorOpen, desc: 'Ankomst og adgang' },
    { label: 'Husinformation', href: '/guest/house-info', icon: MapPin, desc: 'Alt om boligen' },
    { label: 'Tilkøb', href: '/guest/addons', icon: ShoppingBag, desc: 'Ekstra services' },
    { label: 'Support', href: '/guest/support', icon: LifeBuoy, desc: 'Vi er klar til at hjælpe' },
  ];

  if (loading) {
    return (
      <GuestLayout guestEmail={user?.email} onLogout={signOut}>
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      </GuestLayout>
    );
  }

  if (!booking) {
    return (
      <GuestLayout guestEmail={user?.email} onLogout={signOut}>
        <div className="text-center py-20">
          <CalendarDays className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <h2 className="font-display text-xl font-semibold text-foreground mb-2">Ingen aktive bookinger</h2>
          <p className="text-muted-foreground text-sm">Vi kunne ikke finde en booking tilknyttet din e-mail.</p>
          <p className="text-muted-foreground text-xs mt-1">Kontakt support hvis du mener det er en fejl.</p>
        </div>
      </GuestLayout>
    );
  }

  return (
    <GuestLayout guestEmail={user?.email} onLogout={signOut}>
      <div className="space-y-6">
        {/* Hero card */}
        <Card className="overflow-hidden border-accent/20">
          <div className="relative">
            {property?.images?.[0] ? (
              <div className="h-48 md:h-64 bg-muted">
                <img src={property.images[0]} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              </div>
            ) : (
              <div className="h-48 md:h-64 bg-gradient-to-br from-accent/20 to-muted flex items-center justify-center">
                <MapPin className="w-12 h-12 text-accent/30" />
              </div>
            )}
            <div className="absolute bottom-0 left-0 right-0 p-5">
              <Badge className="bg-accent/90 text-background border-0 mb-2 text-[10px]">
                {isCheckedIn ? 'Du er checked ind' : isUpcoming ? `${daysUntil} dage til ankomst` : 'Ophold'}
              </Badge>
              <h1 className="font-display text-xl md:text-2xl font-bold text-white">
                {property?.title || 'Dit sommerhus'}
              </h1>
              <div className="flex items-center gap-3 mt-1 text-sm text-white/80">
                <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{property?.region}</span>
                <span className="flex items-center gap-1"><Users className="w-3 h-3" />{booking.guests_count} gæster</span>
              </div>
            </div>
          </div>

          <CardContent className="p-5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-[11px] text-muted-foreground uppercase tracking-wide">Ankomst</div>
                <div className="text-sm font-semibold text-foreground">{format(new Date(booking.check_in), 'd. MMM yyyy', { locale: da })}</div>
                <div className="text-xs text-muted-foreground">kl. 15:00</div>
              </div>
              <div>
                <div className="text-[11px] text-muted-foreground uppercase tracking-wide">Afrejse</div>
                <div className="text-sm font-semibold text-foreground">{format(new Date(booking.check_out), 'd. MMM yyyy', { locale: da })}</div>
                <div className="text-xs text-muted-foreground">kl. 10:00</div>
              </div>
              <div>
                <div className="text-[11px] text-muted-foreground uppercase tracking-wide">Nætter</div>
                <div className="text-sm font-semibold text-foreground">{booking.nights || '—'}</div>
              </div>
              <div>
                <div className="text-[11px] text-muted-foreground uppercase tracking-wide">Status</div>
                <Badge variant="outline" className="mt-0.5 text-[10px] bg-emerald-400/15 text-emerald-400 border-emerald-400/20">
                  {booking.status === 'confirmed' ? 'Bekræftet' : booking.status === 'checked_in' ? 'Checked-in' : 'Afventer'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Countdown */}
        {isUpcoming && daysUntil > 0 && daysUntil <= 30 && (
          <Card className="border-accent/20 bg-accent/5">
            <CardContent className="p-5 text-center">
              <div className="font-display text-4xl font-bold text-accent mb-1">{daysUntil}</div>
              <div className="text-sm text-muted-foreground">dage til dit ophold begynder</div>
            </CardContent>
          </Card>
        )}

        {/* Quick links */}
        <div className="grid grid-cols-2 gap-3">
          {quickLinks.map(link => (
            <Link key={link.href} to={link.href}>
              <Card className="h-full hover:border-accent/20 transition-colors cursor-pointer">
                <CardContent className="p-4 flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                    <link.icon className="w-4 h-4 text-accent" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-foreground">{link.label}</div>
                    <div className="text-xs text-muted-foreground">{link.desc}</div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Address */}
        {property?.address && (
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <MapPin className="w-5 h-5 text-accent shrink-0" />
              <div>
                <div className="text-xs text-muted-foreground">Adresse</div>
                <div className="text-sm font-medium text-foreground">{property.address}</div>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto" />
            </CardContent>
          </Card>
        )}
      </div>
    </GuestLayout>
  );
}
