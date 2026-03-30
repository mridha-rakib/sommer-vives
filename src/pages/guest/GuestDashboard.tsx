import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { GuestLayout } from '@/components/layout/GuestLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, MapPin, Users, Clock, ChevronRight, LifeBuoy, DoorOpen, ShoppingBag, CreditCard, MessageCircle, LogOut, Sparkles } from 'lucide-react';
import { format, differenceInDays, differenceInHours, isFuture, isPast } from 'date-fns';
import { da } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function GuestDashboard() {
  const { user, signOut } = useAuth();
  const [booking, setBooking] = useState<any>(null);
  const [property, setProperty] = useState<any>(null);
  const [listing, setListing] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) loadStay();
  }, [user]);

  const loadStay = async () => {
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
      const [propRes, listRes] = await Promise.all([
        supabase.from('properties').select('*').eq('id', bookings[0].property_id).single(),
        supabase.from('listings').select('hero_image, name, region, check_in_time, check_out_time').eq('is_active', true).limit(10),
      ]);
      setProperty(propRes.data);
      // Try to match listing to property
      if (listRes.data?.length) {
        const match = listRes.data.find((l: any) => l.name === propRes.data?.title) || listRes.data[0];
        setListing(match);
      }
    }
    setLoading(false);
  };

  const daysUntil = booking ? differenceInDays(new Date(booking.check_in), new Date()) : 0;
  const hoursUntil = booking ? differenceInHours(new Date(booking.check_in), new Date()) : 0;
  const isUpcoming = booking && isFuture(new Date(booking.check_in));
  const isActive = booking && isPast(new Date(booking.check_in)) && isFuture(new Date(booking.check_out));
  const isDone = booking && isPast(new Date(booking.check_out));
  const checkInTime = listing?.check_in_time || '15:00';
  const checkOutTime = listing?.check_out_time || '10:00';
  const heroImage = listing?.hero_image || property?.images?.[0];

  const getStatusLabel = () => {
    if (isDone) return 'Ophold afsluttet';
    if (isActive) return 'Du er på ferie ☀️';
    if (hoursUntil <= 24 && hoursUntil > 0) return 'Ankomst i dag!';
    if (daysUntil <= 7) return `${daysUntil} dage til ankomst`;
    return `${daysUntil} dage til dit ophold`;
  };

  const quickLinks = [
    { label: 'Ankomst & adgang', href: '/guest/checkin', icon: DoorOpen, desc: 'Nøgleboks, koder og ankomstguide', accent: true },
    { label: 'Husinformation', href: '/guest/house-info', icon: MapPin, desc: 'WiFi, varme, faciliteter og regler' },
    { label: 'Tilkøb', href: '/guest/addons', icon: ShoppingBag, desc: 'Sengelinned, tidlig check-in m.m.' },
    { label: 'Betaling', href: '/guest/payment', icon: CreditCard, desc: 'Betalingsoversigt og kvitteringer' },
    { label: 'Beskeder', href: '/guest/messages', icon: MessageCircle, desc: 'Chat med SommerVibes' },
    { label: 'Support', href: '/guest/support', icon: LifeBuoy, desc: 'Vi er her for dig alle dage' },
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
          <h2 className="font-display text-xl font-semibold text-foreground mb-2">Ingen aktive ophold</h2>
          <p className="text-muted-foreground text-sm">Vi fandt ingen booking tilknyttet din e-mail.</p>
          <p className="text-muted-foreground text-xs mt-1">Kontakt os, så hjælper vi dig.</p>
        </div>
      </GuestLayout>
    );
  }

  return (
    <GuestLayout guestEmail={user?.email} onLogout={signOut}>
      <div className="space-y-5">
        {/* Hero */}
        <Card className="overflow-hidden border-0 shadow-lg">
          <div className="relative">
            {heroImage ? (
              <div className="h-52 md:h-72">
                <img src={heroImage} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
              </div>
            ) : (
              <div className="h-52 md:h-72 bg-gradient-to-br from-accent/20 to-muted flex items-center justify-center">
                <Sparkles className="w-16 h-16 text-accent/20" />
              </div>
            )}
            <div className="absolute bottom-0 left-0 right-0 p-5">
              <Badge className="bg-accent text-accent-foreground border-0 mb-2 text-[10px] font-semibold uppercase tracking-wider">
                {getStatusLabel()}
              </Badge>
              <h1 className="font-display text-xl md:text-2xl font-bold text-white leading-tight">
                {property?.title || listing?.name || 'Dit sommerhus'}
              </h1>
              <div className="flex items-center gap-3 mt-1.5 text-sm text-white/80">
                <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{property?.region || listing?.region}</span>
                <span className="flex items-center gap-1"><Users className="w-3 h-3" />{booking.guests_count || 1} gæster</span>
                <span className="flex items-center gap-1"><CalendarDays className="w-3 h-3" />{booking.nights} nætter</span>
              </div>
            </div>
          </div>

          <CardContent className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-muted/40 rounded-lg p-3">
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Ankomst</div>
                <div className="text-sm font-semibold text-foreground mt-0.5">{format(new Date(booking.check_in), 'd. MMM', { locale: da })}</div>
                <div className="text-xs text-muted-foreground">kl. {checkInTime}</div>
              </div>
              <div className="bg-muted/40 rounded-lg p-3">
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Afrejse</div>
                <div className="text-sm font-semibold text-foreground mt-0.5">{format(new Date(booking.check_out), 'd. MMM', { locale: da })}</div>
                <div className="text-xs text-muted-foreground">kl. {checkOutTime}</div>
              </div>
              <div className="bg-muted/40 rounded-lg p-3">
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Reference</div>
                <div className="font-mono text-sm font-semibold text-foreground mt-0.5">{booking.case_number || booking.id.slice(0, 8)}</div>
              </div>
              <div className="bg-muted/40 rounded-lg p-3">
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Status</div>
                <Badge variant="outline" className="mt-1 text-[10px] bg-emerald-400/15 text-emerald-400 border-emerald-400/20">
                  {booking.status === 'confirmed' ? 'Bekræftet' : booking.status === 'checked_in' ? 'Checked-in' : 'Aktiv'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Countdown */}
        {isUpcoming && daysUntil > 0 && daysUntil <= 30 && (
          <Card className="border-accent/30 bg-gradient-to-r from-accent/5 to-accent/10">
            <CardContent className="p-5 flex items-center gap-5">
              <div className="text-center">
                <div className="font-display text-4xl font-bold text-accent">{daysUntil}</div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider">dage</div>
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-foreground">
                  {daysUntil <= 3 ? 'Næsten tid til ferie!' : daysUntil <= 7 ? 'Snart er du der!' : 'Din ferie nærmer sig'}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {daysUntil <= 1 ? 'Tjek din ankomstguide og adgangskode' : 'Forbered dig i ro og mag under "Ankomst & adgang"'}
                </p>
              </div>
              <Link to="/guest/checkin">
                <Button size="sm" variant="gold" className="text-xs shrink-0">Se guide</Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Active stay CTA */}
        {isActive && (
          <Card className="border-accent/30 bg-gradient-to-r from-accent/5 to-accent/10">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5 text-accent" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-foreground">Du er på ferie! ☀️</div>
                <p className="text-xs text-muted-foreground">Brug for noget? Vi er klar til at hjælpe.</p>
              </div>
              <Link to="/guest/support">
                <Button size="sm" variant="outline" className="text-xs">Kontakt os</Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Quick links */}
        <div className="grid grid-cols-2 gap-2.5">
          {quickLinks.map(link => (
            <Link key={link.href} to={link.href}>
              <Card className={`h-full transition-all hover:shadow-md ${link.accent ? 'border-accent/30 bg-accent/5' : 'hover:border-accent/20'}`}>
                <CardContent className="p-3.5 flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${link.accent ? 'bg-accent/20' : 'bg-muted'}`}>
                    <link.icon className={`w-4 h-4 ${link.accent ? 'text-accent' : 'text-muted-foreground'}`} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-foreground leading-tight">{link.label}</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{link.desc}</div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Check-out link when active */}
        {(isActive || isDone) && (
          <Link to="/guest/checkout">
            <Card className="border-muted hover:border-accent/20 transition-colors">
              <CardContent className="p-4 flex items-center gap-3">
                <LogOut className="w-5 h-5 text-muted-foreground" />
                <div className="flex-1">
                  <div className="text-sm font-medium text-foreground">Check-out guide</div>
                  <div className="text-xs text-muted-foreground">Tjekliste og nøgleaflevering</div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </CardContent>
            </Card>
          </Link>
        )}

        {/* Address */}
        {property?.address && (
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <MapPin className="w-5 h-5 text-accent shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Adresse</div>
                <div className="text-sm font-medium text-foreground truncate">{property.address}</div>
                <div className="text-xs text-muted-foreground">{property.region}</div>
              </div>
              <a
                href={`https://maps.google.com/?q=${encodeURIComponent(property.address)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-accent font-medium hover:underline shrink-0"
              >
                Kort →
              </a>
            </CardContent>
          </Card>
        )}
      </div>
    </GuestLayout>
  );
}
