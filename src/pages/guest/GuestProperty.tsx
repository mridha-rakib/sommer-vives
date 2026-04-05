import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { GuestLayout } from '@/components/layout/GuestLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { VideoGuideGrid } from '@/components/listing/VideoGuideGrid';
import {
  Key, DoorOpen, Clock, Navigation, CheckCircle2, Car, Wifi, MapPin,
  Phone, AlertTriangle, BedDouble, Bath, Users, ChevronDown, ChevronUp,
  Flame, Zap, ShowerHead, Utensils, WashingMachine, Trash2, Tv, BookOpen,
  UserCircle, Mail, MessageCircle, Map
} from 'lucide-react';
import { Link } from 'react-router-dom';

const houseSections = [
  { icon: Wifi, title: 'WiFi', content: 'Netværksnavn og kode finder du på opslagstavlen i stuen.', key: 'wifi' },
  { icon: Flame, title: 'Varme', content: 'Huset opvarmes med fjernvarme/varmepumpe. Max 22°C.', key: 'heating' },
  { icon: Zap, title: 'Elektricitet', content: 'Eltavlen sidder i bryggers. Normalt forbrug inkluderet.', key: 'electricity' },
  { icon: ShowerHead, title: 'Vand og bad', content: 'Varmtvandsforsyning er automatisk. Spar venligst på vand.', key: 'water' },
  { icon: Utensils, title: 'Køkken', content: 'Fuldt udstyret med komfur, ovn, køleskab og opvaskemaskine.', key: 'kitchen' },
  { icon: WashingMachine, title: 'Vaskemaskine', content: 'Vaskemaskine og tørretumbler i bryggers.', key: 'laundry' },
  { icon: Trash2, title: 'Affald', content: 'Sortér i restaffald, plast og glas. Containere ved indkørslen.', key: 'trash' },
  { icon: Tv, title: 'Underholdning', content: 'TV med dansk fjernsyn og streaming via WiFi.', key: 'entertainment' },
];

type Tab = 'checkin' | 'checkout' | 'house' | 'videos';

export default function GuestProperty() {
  const { user, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('checkin');
  const [property, setProperty] = useState<any>(null);
  const [listing, setListing] = useState<any>(null);
  const [listingId, setListingId] = useState<string | null>(null);
  const [guide, setGuide] = useState<any>(null);
  const [keybox, setKeybox] = useState<any>(null);
  const [expanded, setExpanded] = useState<string | null>('wifi');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    const { data: bookings } = await supabase
      .from('bookings').select('property_id').eq('guest_email', user.email)
      .neq('status', 'cancelled').order('check_in', { ascending: false }).limit(1);

    if (bookings?.[0]) {
      const pid = bookings[0].property_id;
      const [propRes, guideRes, kbRes, listRes] = await Promise.all([
        supabase.from('properties').select('*').eq('id', pid).single(),
        supabase.from('checkin_guides').select('*').limit(10),
        supabase.from('keybox_installations').select('*').eq('property_id', pid).eq('status', 'installed').limit(1),
        supabase.from('listings').select('id, name, hero_image, images, bedrooms, bathrooms, max_guests, amenities, bedroom_cards, about_property, description, house_rules, contact_name, contact_role, contact_email, contact_phone, contact_image, contact_text, floor_plan_images').eq('id', pid).maybeSingle(),
      ]);
      setProperty(propRes.data);
      if (guideRes.data?.length) setGuide(guideRes.data[0]);
      if (kbRes.data?.length) setKeybox(kbRes.data[0]);
      if (listRes.data) {
        setListing(listRes.data);
        setListingId(listRes.data.id);
      } else {
        // Fallback: try matching from all active listings
        const { data: allListings } = await supabase.from('listings').select('id, name, hero_image, images, bedrooms, bathrooms, max_guests, amenities, bedroom_cards, about_property, description, house_rules, contact_name, contact_role, contact_email, contact_phone, contact_image, contact_text, floor_plan_images').eq('is_active', true);
        if (allListings?.length) {
          const match = allListings.find((l: any) => propRes.data?.title?.includes(l.slug) || l.name?.includes(propRes.data?.address)) || allListings[0];
          setListing(match);
          setListingId(match?.id || null);
        }
      }
    }
    setLoading(false);
  };

  const hasCode = keybox?.access_code;
  const propertyName = property?.title || listing?.name || 'Dit sommerhus';
  const heroImage = listing?.hero_image || property?.images?.[0];

  const tabs: { key: Tab; label: string }[] = [
    { key: 'checkin', label: 'Ankomst' },
    { key: 'house', label: 'Om huset' },
    { key: 'videos', label: 'Videoguides' },
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

  return (
    <GuestLayout guestEmail={user?.email} onLogout={signOut}>
      <div className="space-y-6">
        {/* Property header */}
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">{propertyName}</h1>
          {property?.address && (
            <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" />
              {property.address}
            </p>
          )}
        </div>

        {/* Property quick stats */}
        {(listing?.bedrooms || listing?.bathrooms || listing?.max_guests) && (
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            {listing?.bedrooms && (
              <span className="flex items-center gap-1"><BedDouble className="w-3.5 h-3.5 text-[hsl(var(--gold))]/60" />{listing.bedrooms} soveværelser</span>
            )}
            {listing?.bathrooms && (
              <span className="flex items-center gap-1"><Bath className="w-3.5 h-3.5 text-[hsl(var(--gold))]/60" />{listing.bathrooms} bad</span>
            )}
            {listing?.max_guests && (
              <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5 text-[hsl(var(--gold))]/60" />Op til {listing.max_guests}</span>
            )}
          </div>
        )}

        {/* Tab navigation */}
        <div className="flex gap-1 p-1 bg-muted/30 rounded-xl border border-border/30">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-2.5 text-xs font-medium rounded-lg transition-all ${
                activeTab === tab.key
                  ? 'bg-card text-foreground shadow-sm border border-border/40'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
          >
            {activeTab === 'checkin' && (
              <CheckinTab guide={guide} keybox={keybox} property={property} hasCode={hasCode} />
            )}
            {activeTab === 'house' && (
              <HouseTab
                guide={guide}
                property={property}
                listing={listing}
                expanded={expanded}
                setExpanded={setExpanded}
              />
            )}
            {activeTab === 'videos' && (
              <div className="space-y-4">
                {listingId ? (
                  <VideoGuideGrid listingId={listingId} />
                ) : (
                  <div className="text-center py-12">
                    <p className="text-sm text-muted-foreground">Ingen videoguides tilgængelige endnu</p>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Contact person card — always visible */}
        {listing?.contact_name && (
          <Card className="border-border/30 rounded-2xl">
            <CardContent className="p-5">
              <span className="text-[10px] font-medium tracking-[0.2em] uppercase text-[hsl(var(--gold))]/80 mb-3 block">
                Din kontaktperson
              </span>
              <div className="flex items-start gap-4">
                {listing.contact_image ? (
                  <img src={listing.contact_image} alt={listing.contact_name} className="w-14 h-14 rounded-xl object-cover shrink-0" />
                ) : (
                  <div className="w-14 h-14 rounded-xl bg-[hsl(var(--gold))]/10 flex items-center justify-center shrink-0">
                    <UserCircle className="w-7 h-7 text-[hsl(var(--gold))]/40" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="font-display text-base font-semibold text-foreground">{listing.contact_name}</h4>
                  {listing.contact_role && <p className="text-[11px] text-[hsl(var(--gold))] font-medium">{listing.contact_role}</p>}
                  <div className="flex items-center gap-2 mt-2.5">
                    {listing.contact_email && (
                      <a href={`mailto:${listing.contact_email}`}>
                        <Button size="sm" variant="outline" className="text-[11px] rounded-lg h-7 gap-1 px-2.5">
                          <Mail className="w-3 h-3" />Mail
                        </Button>
                      </a>
                    )}
                    {listing.contact_phone && (
                      <a href={`tel:${listing.contact_phone}`}>
                        <Button size="sm" variant="outline" className="text-[11px] rounded-lg h-7 gap-1 px-2.5">
                          <Phone className="w-3 h-3" />Ring
                        </Button>
                      </a>
                    )}
                    <Link to="/guest/messages">
                      <Button size="sm" variant="gold" className="text-[11px] rounded-lg h-7 gap-1 px-2.5">
                        <MessageCircle className="w-3 h-3" />Chat
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Map link */}
        {property?.address && (
          <a
            href={`https://maps.google.com/?q=${encodeURIComponent(property.address)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block"
          >
            <Card className="border-border/30 rounded-2xl hover:border-[hsl(var(--gold))]/20 transition-colors">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-[hsl(var(--gold))]/10 flex items-center justify-center shrink-0">
                  <Map className="w-5 h-5 text-[hsl(var(--gold))]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-foreground truncate">{property.address}</div>
                  <div className="text-xs text-muted-foreground">Åbn i Google Maps</div>
                </div>
                <span className="text-xs text-[hsl(var(--gold))] font-medium">Vis kort →</span>
              </CardContent>
            </Card>
          </a>
        )}
      </div>
    </GuestLayout>
  );
}

/* ── CHECKIN TAB ── */
function CheckinTab({ guide, keybox, property, hasCode }: any) {
  const steps = [
    { step: 1, title: 'Kør til adressen', desc: guide?.arrival_instructions || `Brug GPS til ${property?.address || 'adressen'}.`, icon: Navigation },
    { step: 2, title: 'Find nøgleboksen', desc: guide?.keybox_instructions || keybox?.keybox_location || 'Nøgleboksen sidder typisk ved hoveddøren.', icon: Key },
    { step: 3, title: 'Tast din kode', desc: guide?.access_code_note || 'Koden sendes via SMS og e-mail 24 timer inden ankomst.', icon: DoorOpen },
    { step: 4, title: 'Gør dig hjemme', desc: 'Tænd for varme, find WiFi-koden — og nyd din ferie!', icon: CheckCircle2 },
  ];

  return (
    <div className="space-y-4">
      {/* Access code hero */}
      <Card className="border-[hsl(var(--gold))]/15 bg-gradient-to-br from-[hsl(var(--gold))]/5 via-card to-[hsl(var(--gold))]/5 overflow-hidden rounded-2xl">
        <CardContent className="p-6 md:p-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-[hsl(var(--gold))]/15 flex items-center justify-center mx-auto mb-4">
            <Key className="w-7 h-7 text-[hsl(var(--gold))]" />
          </div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] mb-3 font-medium">Din adgangskode</div>
          {hasCode ? (
            <div className="font-mono text-4xl md:text-5xl font-bold text-[hsl(var(--gold))] tracking-[0.4em]">{keybox.access_code}</div>
          ) : (
            <>
              <div className="font-mono text-4xl md:text-5xl font-bold text-muted-foreground/20 tracking-[0.4em]">• • • •</div>
              <p className="text-xs text-muted-foreground mt-4">Koden sendes 24 timer før ankomst</p>
            </>
          )}
        </CardContent>
      </Card>

      {/* Check-in time */}
      <Card className="border-border/30 rounded-2xl">
        <CardContent className="p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-[hsl(var(--gold))]/10 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5 text-[hsl(var(--gold))]" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold text-foreground">Check-in fra kl. 15:00</div>
            <div className="text-xs text-muted-foreground">Ankom når som helst efter dette tidspunkt</div>
          </div>
        </CardContent>
      </Card>

      {/* Steps */}
      <div className="space-y-2">
        {steps.map((s) => (
          <Card key={s.step} className="border-border/30 rounded-2xl">
            <CardContent className="p-4 flex items-start gap-4">
              <div className="w-9 h-9 rounded-xl bg-[hsl(var(--gold))]/10 flex items-center justify-center text-xs font-bold text-[hsl(var(--gold))] shrink-0 mt-0.5">
                {s.step}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-foreground">{s.title}</div>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{s.desc}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* WiFi */}
      {guide?.wifi_name && (
        <Card className="border-border/30 rounded-2xl bg-muted/20">
          <CardContent className="p-4 flex items-center gap-4">
            <Wifi className="w-5 h-5 text-[hsl(var(--gold))] shrink-0" />
            <div className="flex-1">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider">WiFi</div>
              <div className="text-sm font-semibold text-foreground font-mono">{guide.wifi_name}</div>
            </div>
            {guide.wifi_password && (
              <div className="text-right">
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Kode</div>
                <div className="text-sm font-semibold text-foreground font-mono">{guide.wifi_password}</div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Parking */}
      <Card className="border-border/30 rounded-2xl">
        <CardContent className="p-4 flex items-start gap-4">
          <Car className="w-5 h-5 text-[hsl(var(--gold))] shrink-0 mt-0.5" />
          <div>
            <div className="text-sm font-semibold text-foreground">Parkering</div>
            <p className="text-xs text-muted-foreground mt-0.5">{guide?.parking_info || 'Gratis parkering direkte ved huset.'}</p>
          </div>
        </CardContent>
      </Card>

      {/* Emergency */}
      <Card className="border-destructive/15 bg-destructive/5 rounded-2xl">
        <CardContent className="p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="text-sm font-semibold text-foreground">Akut hjælp?</div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Ring <strong className="text-foreground">{guide?.emergency_contact || '+45 XX XX XX XX'}</strong> — alle dage
            </p>
          </div>
          <a href={`tel:${guide?.emergency_contact || ''}`}>
            <Button size="sm" variant="destructive" className="text-xs shrink-0 rounded-xl">
              <Phone className="w-3.5 h-3.5 mr-1" />Ring
            </Button>
          </a>
        </CardContent>
      </Card>
    </div>
  );
}

/* ── HOUSE TAB ── */
function HouseTab({ guide, property, listing, expanded, setExpanded }: any) {
  return (
    <div className="space-y-4">
      {/* About */}
      {(listing?.about_property || listing?.description) && (
        <Card className="border-border/30 rounded-2xl">
          <CardContent className="p-5">
            <h3 className="font-display text-base font-semibold text-foreground mb-3">Om boligen</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{listing.about_property || listing.description}</p>
          </CardContent>
        </Card>
      )}

      {/* Bedrooms */}
      {listing?.bedroom_cards && (listing.bedroom_cards as any[]).length > 0 && (
        <Card className="border-border/30 rounded-2xl">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <BedDouble className="w-4 h-4 text-[hsl(var(--gold))]" />
              <span className="text-sm font-display font-semibold text-foreground">Soveværelser</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {(listing.bedroom_cards as any[]).map((room: any, i: number) => (
                <div key={i} className="rounded-xl border border-border/30 bg-card/60 p-3">
                  <span className="text-xs font-semibold text-foreground block">{room.title || `Soveværelse ${i + 1}`}</span>
                  {room.beds && <span className="text-[10px] text-muted-foreground">{room.beds}</span>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* WiFi hero */}
      {guide?.wifi_name && (
        <Card className="border-[hsl(var(--gold))]/15 bg-gradient-to-r from-[hsl(var(--gold))]/5 to-transparent rounded-2xl">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[hsl(var(--gold))]/15 flex items-center justify-center shrink-0">
              <Wifi className="w-6 h-6 text-[hsl(var(--gold))]" />
            </div>
            <div className="flex-1">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider">WiFi</div>
              <div className="text-base font-bold text-foreground font-mono">{guide.wifi_name}</div>
            </div>
            {guide.wifi_password && (
              <div className="text-right">
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Kode</div>
                <div className="text-base font-bold text-foreground font-mono">{guide.wifi_password}</div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Info sections */}
      <div className="space-y-1.5">
        {houseSections.map(section => {
          const isOpen = expanded === section.key;
          return (
            <Card key={section.key} className="border-border/30 overflow-hidden rounded-2xl">
              <button
                onClick={() => setExpanded(isOpen ? null : section.key)}
                className="w-full p-4 flex items-center gap-4 text-left hover:bg-muted/20 transition-colors"
              >
                <div className="w-9 h-9 rounded-xl bg-[hsl(var(--gold))]/10 flex items-center justify-center shrink-0">
                  <section.icon className="w-4 h-4 text-[hsl(var(--gold))]" />
                </div>
                <span className="text-sm font-semibold text-foreground flex-1">{section.title}</span>
                {isOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
              </button>
              {isOpen && (
                <div className="px-4 pb-4 pl-[68px]">
                  <p className="text-xs text-muted-foreground leading-relaxed">{section.content}</p>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* House rules */}
      <Card className="border-border/30 rounded-2xl">
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="w-4 h-4 text-[hsl(var(--gold))]" />
            <span className="text-sm font-semibold text-foreground">Husregler</span>
          </div>
          <div className="text-sm text-muted-foreground space-y-2 leading-relaxed">
            {(listing?.house_rules || property?.house_rules) ? (
              <p className="whitespace-pre-line">{listing?.house_rules || property?.house_rules}</p>
            ) : (
              <ul className="space-y-2">
                {['Rygning er ikke tilladt indendørs', 'Kæledyr kun efter aftale', 'Ro efter kl. 22:00', 'Affald sorteres og bæres ud', 'Opvaskemaskinen køres før afrejse'].map((rule, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--gold))]/40 shrink-0 mt-1.5" />
                    <span>{rule}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Amenities */}
      {listing?.amenities && listing.amenities.length > 0 && (
        <Card className="border-border/30 rounded-2xl">
          <CardContent className="p-5">
            <span className="text-sm font-semibold text-foreground mb-3 block">Faciliteter</span>
            <div className="flex flex-wrap gap-1.5">
              {listing.amenities.map((a: string) => (
                <span key={a} className="px-2.5 py-1.5 rounded-lg bg-muted/30 border border-border/30 text-xs font-medium text-foreground">{a}</span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Floor plans */}
      {listing?.floor_plan_images && listing.floor_plan_images.length > 0 && (
        <Card className="border-border/30 rounded-2xl">
          <CardContent className="p-5">
            <span className="text-sm font-semibold text-foreground mb-3 block">Plantegning</span>
            <div className="space-y-3">
              {listing.floor_plan_images.map((img: string, i: number) => (
                <img key={i} src={img} alt={`Plantegning ${i + 1}`} className="w-full rounded-xl border border-border/30" />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
