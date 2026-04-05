import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { GuestLayout } from '@/components/layout/GuestLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Wifi, Flame, Zap, Trash2, ShowerHead, BookOpen, Tv, Utensils, WashingMachine, ChevronDown, ChevronUp, Play } from 'lucide-react';

const defaultSections = [
  { icon: Wifi, title: 'WiFi', content: 'Netværksnavn og kode finder du på opslagstavlen i stuen.', key: 'wifi' },
  { icon: Flame, title: 'Varme', content: 'Huset opvarmes med fjernvarme/varmepumpe. Max 22°C.', key: 'heating' },
  { icon: Zap, title: 'Elektricitet', content: 'Eltavlen sidder i bryggers. Normalt forbrug inkluderet.', key: 'electricity' },
  { icon: ShowerHead, title: 'Vand og bad', content: 'Varmtvandsforsyning er automatisk. Spar venligst på vand.', key: 'water' },
  { icon: Utensils, title: 'Køkken', content: 'Fuldt udstyret med komfur, ovn, køleskab og opvaskemaskine.', key: 'kitchen' },
  { icon: WashingMachine, title: 'Vaskemaskine', content: 'Vaskemaskine og tørretumbler i bryggers.', key: 'laundry' },
  { icon: Trash2, title: 'Affald', content: 'Sortér i restaffald, plast og glas. Containere ved indkørslen.', key: 'trash' },
  { icon: Tv, title: 'Underholdning', content: 'TV med dansk fjernsyn og streaming via WiFi.', key: 'entertainment' },
];

export default function GuestHouseInfo() {
  const { user, signOut } = useAuth();
  const [property, setProperty] = useState<any>(null);
  const [guide, setGuide] = useState<any>(null);
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
      const [propRes, guideRes] = await Promise.all([
        supabase.from('properties').select('*').eq('id', pid).single(),
        supabase.from('checkin_guides').select('*').limit(10),
      ]);
      setProperty(propRes.data);
      if (guideRes.data?.length) setGuide(guideRes.data[0]);
    }
    setLoading(false);
  };

  const videos = guide?.video_urls as string[] | null;

  return (
    <GuestLayout guestEmail={user?.email} onLogout={signOut}>
      <div className="space-y-5">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Huset</h1>
          <p className="text-sm text-muted-foreground mt-1">Alt du behøver at vide om dit sommerhus</p>
        </div>

        {/* WiFi hero */}
        {guide?.wifi_name && (
          <Card className="border-accent/20 bg-gradient-to-r from-accent/5 to-transparent">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-accent/15 flex items-center justify-center shrink-0">
                <Wifi className="w-6 h-6 text-accent" />
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
          {defaultSections.map(section => {
            const isOpen = expanded === section.key;
            return (
              <Card key={section.key} className="border-border/40 overflow-hidden">
                <button
                  onClick={() => setExpanded(isOpen ? null : section.key)}
                  className="w-full p-4 flex items-center gap-4 text-left hover:bg-muted/20 transition-colors"
                >
                  <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                    <section.icon className="w-4 h-4 text-accent" />
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

        {/* Videos */}
        {videos && videos.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">Praktiske videoer</p>
            {videos.map((url, i) => (
              <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                <Card className="border-border/40 hover:border-accent/20 transition-colors">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                      <Play className="w-4 h-4 text-accent" />
                    </div>
                    <span className="text-sm font-medium text-foreground">Video {i + 1}</span>
                  </CardContent>
                </Card>
              </a>
            ))}
          </div>
        )}

        {/* House rules */}
        <Card className="border-border/40">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="w-4 h-4 text-accent" />
              <span className="text-sm font-semibold text-foreground">Husregler</span>
            </div>
            <div className="text-sm text-muted-foreground space-y-2 leading-relaxed">
              {property?.house_rules ? (
                <p className="whitespace-pre-line">{property.house_rules}</p>
              ) : (
                <ul className="space-y-2">
                  {[
                    'Rygning er ikke tilladt indendørs',
                    'Kæledyr kun efter forudgående aftale',
                    'Ro efter kl. 22:00',
                    'Affald sorteres og bæres ud',
                    'Opvaskemaskinen køres før afrejse',
                  ].map((rule, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-accent/40 shrink-0 mt-1.5" />
                      <span>{rule}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Amenities */}
        {property?.amenities && property.amenities.length > 0 && (
          <Card className="border-border/40">
            <CardContent className="p-5">
              <span className="text-sm font-semibold text-foreground mb-3 block">Faciliteter</span>
              <div className="flex flex-wrap gap-1.5">
                {property.amenities.map((a: string) => (
                  <span key={a} className="px-2.5 py-1.5 rounded-lg bg-muted/30 border border-border/30 text-xs font-medium text-foreground">{a}</span>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </GuestLayout>
  );
}
