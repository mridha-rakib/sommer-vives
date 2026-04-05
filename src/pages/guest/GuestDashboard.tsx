import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { GuestLayout } from '@/components/layout/GuestLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, MapPin, Users, Clock, ChevronRight, DoorOpen, ShoppingBag, MessageCircle, Sparkles, CreditCard, Copy, Crown } from 'lucide-react';
import { format, differenceInDays, differenceInHours, isFuture, isPast } from 'date-fns';
import { da } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { GuestStayTimeline } from '@/components/guest/GuestStayTimeline';
import { toast } from 'sonner';

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

  const copyRef = () => {
    navigator.clipboard.writeText(booking?.case_number || booking?.id || '');
    toast.success('Kopieret til udklipsholder');
  };

  const firstName = user?.user_metadata?.full_name?.split(' ')[0] || '';

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
        </div>
      </GuestLayout>
    );
  }

  return (
    <GuestLayout guestEmail={user?.email} onLogout={signOut}>
      <div className="space-y-5">
        {/* Premium hero with image */}
        <div className="relative overflow-hidden rounded-2xl">
          {heroImage ? (
            <div className="h-56 md:h-72">
              <img src={heroImage} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/10" />
            </div>
          ) : (
            <div className="h-56 md:h-72 bg-gradient-to-br from-accent/15 via-card to-accent/5 flex items-center justify-center border border-border/40 rounded-2xl">
              <Sparkles className="w-16 h-16 text-accent/15" />
            </div>
          )}

          <div className="absolute top-4 left-4">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-sm border border-white/10">
              <Crown className="w-3 h-3 text-[hsl(var(--gold-light,45,80%,65%))]" />
              <span className="text-[10px] font-semibold text-white/90 uppercase tracking-wider">SommerVibes Gæst</span>
            </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-5">
            <Badge className="bg-accent/90 text-accent-foreground border-0 mb-2 text-[10px] font-semibold uppercase tracking-wider backdrop-blur-sm">
              {getStatusLabel()}
            </Badge>
            <h1 className="font-display text-xl md:text-2xl font-bold text-white leading-tight">
              {firstName ? `Velkommen, ${firstName}` : 'Velkommen'}
            </h1>
            <p className="text-sm text-white/70 mt-0.5">
              {property?.title || listing?.name || 'Dit sommerhus'} · {property?.region || listing?.region}
            </p>
          </div>
        </div>

        {/* Key info cards - clean grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
          <InfoTile label="Ankomst" value={format(new Date(booking.check_in), 'd. MMM', { locale: da })} sub={`kl. ${checkInTime}`} />
          <InfoTile label="Afrejse" value={format(new Date(booking.check_out), 'd. MMM', { locale: da })} sub={`kl. ${checkOutTime}`} />
          <InfoTile label="Gæster" value={`${booking.guests_count || 1}`} sub={`${booking.nights} nætter`} />
          <div onClick={copyRef} className="cursor-pointer group">
            <InfoTile label="Reference" value={booking.case_number || booking.id.slice(0, 8)} sub="Tryk for at kopiere" mono />
          </div>
        </div>

        {/* Countdown - only when upcoming */}
        {isUpcoming && daysUntil > 0 && daysUntil <= 30 && (
          <Card className="border-accent/20 bg-gradient-to-r from-accent/5 to-transparent overflow-hidden">
            <CardContent className="p-5 flex items-center gap-5">
              <div className="text-center min-w-[60px]">
                <div className="font-display text-4xl font-bold text-accent">{daysUntil}</div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider">dage</div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-foreground">
                  {daysUntil <= 3 ? 'Næsten tid til ferie! 🎉' : daysUntil <= 7 ? 'Snart er du der!' : 'Din ferie nærmer sig'}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {daysUntil <= 1 ? 'Tjek din ankomstguide og kode' : 'Forbered dig under "Ankomst"'}
                </p>
              </div>
              <Link to="/guest/checkin">
                <Button size="sm" variant="gold" className="text-xs shrink-0">Se guide</Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Active stay */}
        {isActive && (
          <Card className="border-accent/20 bg-gradient-to-r from-accent/5 to-transparent">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-accent/15 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5 text-accent" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-foreground">Du er på ferie ☀️</div>
                <p className="text-xs text-muted-foreground">Brug for noget? Vi er klar alle dage.</p>
              </div>
              <Link to="/guest/support">
                <Button size="sm" variant="outline" className="text-xs">Kontakt os</Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Stay timeline */}
        <GuestStayTimeline booking={booking} />

        {/* Quick actions - simplified to 3 key actions */}
        <div className="grid grid-cols-3 gap-2.5">
          <QuickAction href="/guest/checkin" icon={DoorOpen} label="Ankomst" accent />
          <QuickAction href="/guest/addons" icon={ShoppingBag} label="Tilkøb" />
          <QuickAction href="/guest/messages" icon={MessageCircle} label="Beskeder" />
        </div>

        {/* Price summary - integrated */}
        <Card className="border-border/40">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <CreditCard className="w-4 h-4 text-accent" />
              <span className="text-sm font-semibold text-foreground">Betalingsoversigt</span>
              <div className="flex-1" />
              <Badge variant="outline" className={`text-[10px] ${booking.payment_status === 'paid' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'}`}>
                {booking.payment_status === 'paid' ? 'Betalt' : 'Afventer'}
              </Badge>
            </div>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Ophold ({booking.nights} nætter)</span>
                <span>{Number(booking.base_price).toLocaleString('da-DK')} kr</span>
              </div>
              {Number(booking.cleaning_fee) > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Rengøring</span>
                  <span>{Number(booking.cleaning_fee).toLocaleString('da-DK')} kr</span>
                </div>
              )}
              <div className="border-t border-border/40 pt-2 flex justify-between font-semibold">
                <span>Total</span>
                <span className="text-accent">{Number(booking.total_amount).toLocaleString('da-DK')} kr</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Address */}
        {property?.address && (
          <Card className="border-border/40">
            <CardContent className="p-4 flex items-center gap-3">
              <MapPin className="w-5 h-5 text-accent shrink-0" />
              <div className="flex-1 min-w-0">
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

function InfoTile({ label, value, sub, mono }: { label: string; value: string; sub?: string; mono?: boolean }) {
  return (
    <div className="rounded-xl border border-border/40 bg-card/60 p-3.5 hover:border-border/60 transition-colors">
      <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">{label}</div>
      <div className={`text-sm font-semibold text-foreground mt-1 ${mono ? 'font-mono' : ''}`}>{value}</div>
      {sub && <div className="text-[10px] text-muted-foreground mt-0.5">{sub}</div>}
    </div>
  );
}

function QuickAction({ href, icon: Icon, label, accent }: { href: string; icon: any; label: string; accent?: boolean }) {
  return (
    <Link to={href}>
      <div className={`flex flex-col items-center gap-2 py-4 rounded-xl border transition-all hover:shadow-sm ${accent ? 'border-accent/20 bg-accent/5 hover:border-accent/30' : 'border-border/40 bg-card/60 hover:border-border/60'}`}>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${accent ? 'bg-accent/15' : 'bg-muted/40'}`}>
          <Icon className={`w-5 h-5 ${accent ? 'text-accent' : 'text-muted-foreground'}`} />
        </div>
        <span className="text-xs font-medium text-foreground">{label}</span>
      </div>
    </Link>
  );
}
