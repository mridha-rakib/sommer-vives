import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { GuestLayout } from '@/components/layout/GuestLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  CalendarDays, MapPin, Users, Clock, ChevronRight, DoorOpen, ShoppingBag,
  MessageCircle, Sparkles, CreditCard, Copy, Crown, Star, Wifi, Key,
  BedDouble, Bath, UserCircle, Mail, Phone, Map, LayoutGrid, ChevronLeft,
  Maximize2
} from 'lucide-react';
import { format, differenceInDays, differenceInHours, isFuture, isPast } from 'date-fns';
import { da } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { VideoGuideGrid } from '@/components/listing/VideoGuideGrid';
import { motion, AnimatePresence } from 'framer-motion';

export default function GuestDashboard() {
  const { user, signOut } = useAuth();
  const [booking, setBooking] = useState<any>(null);
  const [property, setProperty] = useState<any>(null);
  const [listing, setListing] = useState<any>(null);
  const [listingId, setListingId] = useState<string | null>(null);
  const [recentMessages, setRecentMessages] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [currentImageIdx, setCurrentImageIdx] = useState(0);

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
      const [propRes, listRes, msgRes] = await Promise.all([
        supabase.from('properties').select('*').eq('id', bookings[0].property_id).single(),
        supabase.from('listings').select('id, hero_image, images, name, region, check_in_time, check_out_time, tagline, bedrooms, bathrooms, max_guests, floor_plan_images, contact_name, contact_role, contact_email, contact_phone, contact_image, contact_text, bedroom_cards, amenities, highlighted_amenities, about_property, description').eq('is_active', true).limit(10),
        supabase.from('chat_messages').select('*').eq('thread_type', 'support').or(`sender_id.eq.${user.id},sender_type.eq.admin`).order('created_at', { ascending: false }).limit(3),
      ]);
      setProperty(propRes.data);
      if (msgRes.data) {
        setRecentMessages(msgRes.data);
        setUnreadCount(msgRes.data.filter((m: any) => m.sender_type === 'admin' && !m.is_read).length);
      }
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

  // Image gallery from listing
  const allImages: string[] = [];
  if (listing?.hero_image) allImages.push(listing.hero_image);
  if (listing?.images?.length) allImages.push(...listing.images.filter((img: string) => img !== listing.hero_image));
  if (!allImages.length && property?.images?.length) allImages.push(...property.images);

  const heroImage = allImages[currentImageIdx] || null;

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
        <div className="flex flex-col items-center justify-center py-16 md:py-24">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-center max-w-md mx-auto">
            <div className="w-20 h-20 rounded-full bg-[hsl(var(--gold))]/10 border border-[hsl(var(--gold))]/15 flex items-center justify-center mx-auto mb-6">
              <Crown className="w-8 h-8 text-[hsl(var(--gold))]/60" />
            </div>
            <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-3">Velkommen til SommerVibes</h2>
            <p className="text-muted-foreground text-sm leading-relaxed mb-8">
              Vi fandt ingen aktiv booking tilknyttet <span className="text-foreground font-medium">{user?.email}</span>. Når din reservation er bekræftet, får du adgang til alt — ankomstguide, adgangskoder, videoguides og mere.
            </p>
            <div className="grid grid-cols-3 gap-3 mb-8">
              {[
                { icon: DoorOpen, label: 'Ankomstguide' },
                { icon: Key, label: 'Adgangskoder' },
                { icon: MessageCircle, label: 'Direkte chat' },
              ].map(f => (
                <div key={f.label} className="rounded-2xl border border-border/30 bg-card/60 p-4 text-center">
                  <f.icon className="w-5 h-5 text-[hsl(var(--gold))]/60 mx-auto mb-2" />
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{f.label}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground/60">
              Kontakt os på <a href="mailto:support@sommervibes.dk" className="text-[hsl(var(--gold))] hover:underline">support@sommervibes.dk</a>
            </p>
          </motion.div>
        </div>
      </GuestLayout>
    );
  }

  const bedrooms = listing?.bedrooms || property?.bedrooms;
  const bathrooms = listing?.bathrooms || property?.bathrooms;
  const maxGuests = listing?.max_guests || property?.max_guests;
  const hasFloorPlan = listing?.floor_plan_images?.length > 0;

  return (
    <GuestLayout guestEmail={user?.email} onLogout={signOut}>
      <div className="space-y-6">

        {/* ─── HERO WITH IMAGE CAROUSEL ─── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative overflow-hidden rounded-3xl"
        >
          {allImages.length > 0 ? (
            <div className="relative h-64 md:h-80 group">
              <AnimatePresence mode="wait">
                <motion.img
                  key={currentImageIdx}
                  src={allImages[currentImageIdx]}
                  alt={propertyName}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4 }}
                  className="w-full h-full object-cover absolute inset-0"
                />
              </AnimatePresence>
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />

              {/* Image nav */}
              {allImages.length > 1 && (
                <>
                  <button
                    onClick={() => setCurrentImageIdx(i => (i - 1 + allImages.length) % allImages.length)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm border border-white/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <ChevronLeft className="w-4 h-4 text-white" />
                  </button>
                  <button
                    onClick={() => setCurrentImageIdx(i => (i + 1) % allImages.length)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm border border-white/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <ChevronRight className="w-4 h-4 text-white" />
                  </button>
                  <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-sm text-white text-[10px] font-medium px-2.5 py-1 rounded-full">
                    {currentImageIdx + 1} / {allImages.length}
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="h-64 md:h-80 bg-gradient-to-br from-accent/15 via-card to-accent/5 flex items-center justify-center border border-border/40 rounded-3xl">
              <Sparkles className="w-20 h-20 text-accent/10" />
            </div>
          )}

          {/* Gold member badge */}
          <div className="absolute top-4 right-4 z-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[hsl(var(--gold))]/20 backdrop-blur-md border border-[hsl(var(--gold))]/20">
              <Crown className="w-3.5 h-3.5 text-[hsl(var(--gold))]" />
              <span className="text-[10px] font-bold text-[hsl(var(--gold))] uppercase tracking-[0.15em]">SommerVibes Gæst</span>
            </div>
          </div>

          {/* Status pill */}
          <div className="absolute bottom-20 right-5 z-10">
            <Badge className="bg-accent/90 text-accent-foreground border-0 text-[10px] font-semibold uppercase tracking-wider backdrop-blur-sm shadow-lg">
              {getStatusLabel()}
            </Badge>
          </div>

          {/* Hero text */}
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 z-10">
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
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }} className="text-white/50 mt-1 text-xs italic">
                "{listing.tagline}"
              </motion.p>
            )}
          </div>

          {/* Action buttons overlay – Map, Floor plan, Contact */}
          <div className="absolute bottom-6 right-6 z-10 flex items-center gap-2">
            {property?.address && (
              <a href={`https://maps.google.com/?q=${encodeURIComponent(property.address)}`} target="_blank" rel="noopener noreferrer">
                <div className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-black/50 backdrop-blur-sm border border-white/10 text-white/90 text-xs font-medium hover:bg-black/70 transition-colors cursor-pointer">
                  <Map className="w-3.5 h-3.5" />
                  Kort
                </div>
              </a>
            )}
            {hasFloorPlan && (
              <Link to="/guest/house-info">
                <div className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-black/50 backdrop-blur-sm border border-white/10 text-white/90 text-xs font-medium hover:bg-black/70 transition-colors cursor-pointer">
                  <LayoutGrid className="w-3.5 h-3.5" />
                  Plantegning
                </div>
              </Link>
            )}
          </div>
        </motion.div>

        {/* ─── PROPERTY QUICK FACTS ─── */}
        {(bedrooms || bathrooms || maxGuests) && (
          <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
            {bedrooms && (
              <div className="flex items-center gap-1.5">
                <BedDouble className="w-4 h-4 text-[hsl(var(--gold))]/60" />
                <span>{bedrooms} soveværelser</span>
              </div>
            )}
            {bathrooms && (
              <div className="flex items-center gap-1.5">
                <Bath className="w-4 h-4 text-[hsl(var(--gold))]/60" />
                <span>{bathrooms} bad</span>
              </div>
            )}
            {maxGuests && (
              <div className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-[hsl(var(--gold))]/60" />
                <span>Op til {maxGuests} gæster</span>
              </div>
            )}
          </div>
        )}

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
              <Link to="/guest/messages">
                <Button size="sm" variant="gold" className="text-xs rounded-xl">Skriv til os</Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* ─── MESSAGES PREVIEW ─── */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <Card className="border-border/30 rounded-2xl overflow-hidden">
            <Link to="/guest/messages">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-4">
                  <MessageCircle className="w-4 h-4 text-[hsl(var(--gold))]" />
                  <span className="text-sm font-display font-semibold text-foreground">Beskeder</span>
                  {unreadCount > 0 && (
                    <span className="ml-1 w-5 h-5 rounded-full bg-accent text-accent-foreground text-[10px] font-bold flex items-center justify-center">{unreadCount}</span>
                  )}
                  <div className="flex-1" />
                  <span className="text-xs text-muted-foreground flex items-center gap-1">Se alle <ChevronRight className="w-3 h-3" /></span>
                </div>
                {recentMessages.length > 0 ? (
                  <div className="space-y-2.5">
                    {recentMessages.slice(0, 2).map(msg => (
                      <div key={msg.id} className="flex items-start gap-3">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold ${msg.sender_type === 'admin' ? 'bg-[hsl(var(--gold))]/15 text-[hsl(var(--gold))]' : 'bg-muted/40 text-muted-foreground'}`}>
                          {msg.sender_type === 'admin' ? 'SV' : 'Du'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-foreground line-clamp-1">{msg.message}</p>
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(msg.created_at).toLocaleDateString('da-DK', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">Ingen beskeder endnu — skriv til os når som helst</p>
                )}
              </CardContent>
            </Link>
          </Card>
        </motion.div>

        {/* ─── QUICK ACTIONS ─── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="grid grid-cols-3 gap-3"
        >
          <QuickAction href="/guest/checkin" icon={DoorOpen} label="Ankomst" desc="Guide & koder" accent />
          <QuickAction href="/guest/addons" icon={ShoppingBag} label="Tilkøb" desc="Opgrader dit ophold" />
          <QuickAction href="/guest/house-info" icon={BedDouble} label="Om huset" desc="Sengepladser & info" />
        </motion.div>

        {/* ─── VIDEO GUIDES ─── */}
        {listingId && <VideoGuideGrid listingId={listingId} />}

        {/* ─── ABOUT THE PROPERTY ─── */}
        {(listing?.about_property || listing?.description) && (
          <Card className="border-border/30 rounded-2xl">
            <CardContent className="p-5 md:p-6">
              <h3 className="font-display text-base font-semibold text-foreground mb-3">Om {propertyName}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed line-clamp-4">
                {listing.about_property || listing.description}
              </p>
              <Link to="/guest/house-info" className="inline-block mt-3">
                <span className="text-xs text-[hsl(var(--gold))] font-medium hover:underline">Læs mere om boligen →</span>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* ─── BEDROOM OVERVIEW ─── */}
        {listing?.bedroom_cards && (listing.bedroom_cards as any[]).length > 0 && (
          <Card className="border-border/30 rounded-2xl">
            <CardContent className="p-5 md:p-6">
              <div className="flex items-center gap-2 mb-4">
                <BedDouble className="w-4 h-4 text-[hsl(var(--gold))]" />
                <span className="text-sm font-display font-semibold text-foreground">Sengepladser</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {(listing.bedroom_cards as any[]).slice(0, 4).map((room: any, i: number) => (
                  <div key={i} className="rounded-xl border border-border/30 bg-card/60 p-3">
                    <span className="text-xs font-semibold text-foreground block">{room.title || `Soveværelse ${i + 1}`}</span>
                    {room.beds && <span className="text-[10px] text-muted-foreground">{room.beds}</span>}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* ─── YOUR CONTACT PERSON (MÆGLER) ─── */}
        {listing?.contact_name && (
          <Card className="border-border/30 rounded-2xl overflow-hidden">
            <CardContent className="p-5 md:p-6">
              <span className="text-[10px] font-medium tracking-[0.2em] uppercase text-[hsl(var(--gold))]/80 mb-3 block">
                Din kontaktperson
              </span>
              <div className="flex items-start gap-4">
                {listing.contact_image ? (
                  <img src={listing.contact_image} alt={listing.contact_name} className="w-16 h-16 rounded-xl object-cover shrink-0" />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-[hsl(var(--gold))]/10 flex items-center justify-center shrink-0">
                    <UserCircle className="w-8 h-8 text-[hsl(var(--gold))]/40" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="font-display text-lg font-semibold text-foreground">{listing.contact_name}</h4>
                  {listing.contact_role && (
                    <p className="text-xs text-[hsl(var(--gold))] font-medium">{listing.contact_role}</p>
                  )}
                  {listing.contact_text && (
                    <p className="text-xs text-muted-foreground mt-2 leading-relaxed line-clamp-2">{listing.contact_text}</p>
                  )}
                  <div className="flex items-center gap-2 mt-3">
                    {listing.contact_email && (
                      <a href={`mailto:${listing.contact_email}`}>
                        <Button size="sm" variant="outline" className="text-xs rounded-xl h-8 gap-1.5">
                          <Mail className="w-3 h-3" />Skriv
                        </Button>
                      </a>
                    )}
                    {listing.contact_phone && (
                      <a href={`tel:${listing.contact_phone}`}>
                        <Button size="sm" variant="outline" className="text-xs rounded-xl h-8 gap-1.5">
                          <Phone className="w-3 h-3" />Ring
                        </Button>
                      </a>
                    )}
                    <Link to="/guest/messages">
                      <Button size="sm" variant="gold" className="text-xs rounded-xl h-8 gap-1.5">
                        <MessageCircle className="w-3 h-3" />Chat
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

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
              <a href={`https://maps.google.com/?q=${encodeURIComponent(property.address)}`} target="_blank" rel="noopener noreferrer">
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
