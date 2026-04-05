import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { GuestLayout } from '@/components/layout/GuestLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, MapPin, Users, Clock, ChevronRight, DoorOpen, ShoppingBag, MessageCircle, Sparkles, CreditCard, Copy, Crown, Star, Wifi, Key } from 'lucide-react';
import { format, differenceInDays, differenceInHours, isFuture, isPast } from 'date-fns';
import { da } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { VideoGuideGrid } from '@/components/listing/VideoGuideGrid';
import { motion } from 'framer-motion';

export default function GuestDashboard() {
  const { user, signOut } = useAuth();
  const [booking, setBooking] = useState<any>(null);
  const [property, setProperty] = useState<any>(null);
  const [listing, setListing] = useState<any>(null);
  const [listingId, setListingId] = useState<string | null>(null);
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
        supabase.from('listings').select('id, hero_image, name, region, check_in_time, check_out_time, tagline').eq('is_active', true).limit(10),
      ]);
      setProperty(propRes.data);
      if (listRes.data?.length) {
        const match = listRes.data.find((l: any) => l.name === propRes.data?.title) || listRes.data[0];
        setListing(match);
        setListingId(match?.id || null);
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
  const propertyName = property?.title || listing?.name || 'Dit sommerhus';

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
      <div className="space-y-6">

        {/* ─── PREMIUM HERO ─── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative overflow-hidden rounded-3xl"
        >
          {heroImage ? (
            <div className="h-64 md:h-80">
              <img src={heroImage} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
            </div>
          ) : (
            <div className="h-64 md:h-80 bg-gradient-to-br from-accent/15 via-card to-accent/5 flex items-center justify-center border border-border/40 rounded-3xl">
              <Sparkles className="w-20 h-20 text-accent/10" />
            </div>
          )}

          {/* Gold member badge */}
          <div className="absolute top-5 left-5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[hsl(var(--gold))]/20 backdrop-blur-md border border-[hsl(var(--gold))]/20">
              <Crown className="w-3.5 h-3.5 text-[hsl(var(--gold))]" />
              <span className="text-[10px] font-bold text-[hsl(var(--gold))] uppercase tracking-[0.15em]">SommerVibes Gæst</span>
            </div>
          </div>

          {/* Status pill */}
          <div className="absolute top-5 right-5">
            <Badge className="bg-accent/90 text-accent-foreground border-0 text-[10px] font-semibold uppercase tracking-wider backdrop-blur-sm shadow-lg">
              {getStatusLabel()}
            </Badge>
          </div>

          {/* Hero text */}
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="font-display text-2xl md:text-3xl font-bold text-white leading-tight"
            >
              {firstName ? `Velkommen, ${firstName}` : 'Velkommen'}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35 }}
              className="text-white/70 mt-1 text-sm md:text-base"
            >
              {propertyName} · {property?.region || listing?.region}
            </motion.p>
            {listing?.tagline && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.45 }}
                className="text-white/50 mt-1 text-xs italic"
              >
                "{listing.tagline}"
              </motion.p>
            )}
          </div>
        </motion.div>

        {/* ─── KEY INFO STRIP ─── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-3"
        >
          <InfoTile icon={CalendarDays} label="Ankomst" value={format(new Date(booking.check_in), 'd. MMM', { locale: da })} sub={`kl. ${checkInTime}`} />
          <InfoTile icon={CalendarDays} label="Afrejse" value={format(new Date(booking.check_out), 'd. MMM', { locale: da })} sub={`kl. ${checkOutTime}`} />
          <InfoTile icon={Users} label="Gæster" value={`${booking.guests_count || 1} pers.`} sub={`${booking.nights} nætter`} />
          <div onClick={copyRef} className="cursor-pointer group">
            <InfoTile icon={Copy} label="Reference" value={booking.case_number || booking.id.slice(0, 8)} sub="Tryk for at kopiere" mono />
          </div>
        </motion.div>

        {/* ─── COUNTDOWN ─── */}
        {isUpcoming && daysUntil > 0 && daysUntil <= 30 && (
          <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }}>
            <Card className="border-[hsl(var(--gold))]/15 bg-gradient-to-r from-[hsl(var(--gold))]/5 to-transparent overflow-hidden rounded-2xl">
              <CardContent className="p-6 flex items-center gap-6">
                <div className="text-center min-w-[70px]">
                  <div className="font-display text-5xl font-bold text-[hsl(var(--gold))]">{daysUntil}</div>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-[0.15em] mt-1">dage</div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-display text-base font-semibold text-foreground">
                    {daysUntil <= 3 ? 'Næsten tid til ferie! 🎉' : daysUntil <= 7 ? 'Snart er du der!' : 'Din ferie nærmer sig'}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {daysUntil <= 1 ? 'Tjek din ankomstguide og adgangskode' : 'Alt er gjort klar til dig — tjek ankomstguiden'}
                  </p>
                </div>
                <Link to="/guest/checkin">
                  <Button size="sm" variant="gold" className="text-xs shrink-0 rounded-xl">Se guide</Button>
                </Link>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ─── ACTIVE STAY ─── */}
        {isActive && (
          <Card className="border-[hsl(var(--gold))]/15 bg-gradient-to-r from-[hsl(var(--gold))]/5 to-transparent rounded-2xl">
            <CardContent className="p-6 flex items-center gap-5">
              <div className="w-12 h-12 rounded-2xl bg-[hsl(var(--gold))]/10 flex items-center justify-center shrink-0">
                <Star className="w-6 h-6 text-[hsl(var(--gold))]" />
              </div>
              <div className="flex-1">
                <div className="font-display text-base font-semibold text-foreground">Du er på ferie ☀️</div>
                <p className="text-xs text-muted-foreground mt-0.5">Brug for noget? Vi er klar for dig alle dage.</p>
              </div>
              <Link to="/guest/support">
                <Button size="sm" variant="outline" className="text-xs rounded-xl">Kontakt os</Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* ─── QUICK ACTIONS ─── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="grid grid-cols-3 gap-3"
        >
          <QuickAction href="/guest/checkin" icon={DoorOpen} label="Ankomst" desc="Guide & koder" accent />
          <QuickAction href="/guest/addons" icon={ShoppingBag} label="Tilkøb" desc="Opgrader dit ophold" />
          <QuickAction href="/guest/messages" icon={MessageCircle} label="Beskeder" desc="Kontakt os" />
        </motion.div>

        {/* ─── VIDEO GUIDES ─── */}
        {listingId && <VideoGuideGrid listingId={listingId} />}

        {/* ─── PAYMENT SUMMARY ─── */}
        <Card className="border-border/30 rounded-2xl">
          <CardContent className="p-5 md:p-6">
            <div className="flex items-center gap-2 mb-5">
              <CreditCard className="w-4 h-4 text-[hsl(var(--gold))]" />
              <span className="text-sm font-display font-semibold text-foreground">Betalingsoversigt</span>
              <div className="flex-1" />
              <Badge variant="outline" className={`text-[10px] rounded-full ${booking.payment_status === 'paid' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'}`}>
                {booking.payment_status === 'paid' ? '✓ Betalt' : 'Afventer'}
              </Badge>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Ophold ({booking.nights} nætter)</span>
                <span className="font-medium">{Number(booking.base_price).toLocaleString('da-DK')} kr</span>
              </div>
              {Number(booking.cleaning_fee) > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Rengøring</span>
                  <span className="font-medium">{Number(booking.cleaning_fee).toLocaleString('da-DK')} kr</span>
                </div>
              )}
              <div className="border-t border-border/30 pt-3 flex justify-between font-semibold">
                <span>Total</span>
                <span className="text-[hsl(var(--gold))]">{Number(booking.total_amount).toLocaleString('da-DK')} kr</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ─── ADDRESS ─── */}
        {property?.address && (
          <Card className="border-border/30 rounded-2xl">
            <CardContent className="p-4 md:p-5 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                <MapPin className="w-5 h-5 text-accent" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-foreground truncate">{property.address}</div>
                <div className="text-xs text-muted-foreground">{property.region}</div>
              </div>
              <a
                href={`https://maps.google.com/?q=${encodeURIComponent(property.address)}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button size="sm" variant="outline" className="text-xs rounded-xl">Vis kort →</Button>
              </a>
            </CardContent>
          </Card>
        )}
      </div>
    </GuestLayout>
  );
}

function InfoTile({ icon: Icon, label, value, sub, mono }: { icon: any; label: string; value: string; sub?: string; mono?: boolean }) {
  return (
    <div className="rounded-2xl border border-border/30 bg-card/80 p-4 hover:border-[hsl(var(--gold))]/20 transition-all duration-300">
      <div className="flex items-center gap-1.5 mb-2">
        <Icon className="w-3.5 h-3.5 text-[hsl(var(--gold))]/60" />
        <span className="text-[10px] text-muted-foreground uppercase tracking-[0.12em] font-medium">{label}</span>
      </div>
      <div className={`text-sm font-semibold text-foreground ${mono ? 'font-mono' : ''}`}>{value}</div>
      {sub && <div className="text-[10px] text-muted-foreground mt-0.5">{sub}</div>}
    </div>
  );
}

function QuickAction({ href, icon: Icon, label, desc, accent }: { href: string; icon: any; label: string; desc?: string; accent?: boolean }) {
  return (
    <Link to={href}>
      <div className={`flex flex-col items-center gap-2.5 py-5 rounded-2xl border transition-all duration-300 hover:shadow-md ${accent ? 'border-[hsl(var(--gold))]/20 bg-[hsl(var(--gold))]/5 hover:border-[hsl(var(--gold))]/30' : 'border-border/30 bg-card/60 hover:border-border/50'}`}>
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${accent ? 'bg-[hsl(var(--gold))]/15' : 'bg-muted/40'}`}>
          <Icon className={`w-5 h-5 ${accent ? 'text-[hsl(var(--gold))]' : 'text-muted-foreground'}`} />
        </div>
        <div className="text-center">
          <span className="text-xs font-semibold text-foreground block">{label}</span>
          {desc && <span className="text-[10px] text-muted-foreground">{desc}</span>}
        </div>
      </div>
    </Link>
  );
}
