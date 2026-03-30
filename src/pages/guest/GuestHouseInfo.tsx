import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { GuestLayout } from '@/components/layout/GuestLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Wifi, Flame, Zap, Trash2, ShowerHead, BookOpen, Tv, MapPin, Utensils, WashingMachine, ChevronDown, ChevronUp, Play } from 'lucide-react';

const defaultSections = [
  { icon: Wifi, title: 'WiFi', content: 'Netværksnavn og kode finder du på opslagstavlen i stuen eller på køleskabet.', key: 'wifi' },
  { icon: Flame, title: 'Varme', content: 'Huset opvarmes med fjernvarme/varmepumpe. Termostaten sidder i stuen — max 22°C.', key: 'heating' },
  { icon: Zap, title: 'Elektricitet', content: 'Eltavlen sidder i bryggers. Normalt forbrug er inkluderet i prisen.', key: 'electricity' },
  { icon: ShowerHead, title: 'Vand og bad', content: 'Varmtvandsforsyning er automatisk. Vær opmærksom på at spare på vand.', key: 'water' },
  { icon: Utensils, title: 'Køkken', content: 'Fuldt udstyret køkken med komfur, ovn, køleskab, fryser og opvaskemaskine.', key: 'kitchen' },
  { icon: WashingMachine, title: 'Vaskemaskine', content: 'Vaskemaskine og tørretumbler findes i bryggers.', key: 'laundry' },
  { icon: Trash2, title: 'Affald', content: 'Sortér i restaffald, plast og glas. Containere står ved indkørslen.', key: 'trash' },
  { icon: Tv, title: 'Underholdning', content: 'TV med dansk fjernsyn og streaming. WiFi-koden gælder også til smart-TV.', key: 'entertainment' },
];

export default function GuestHouseInfo() {
  const { user, signOut } = useAuth();
  const [property, setProperty] = useState<any>(null);
  const [guide, setGuide] = useState<any>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
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
          <h1 className="font-display text-2xl font-bold text-foreground">Husinformation</h1>
          <p className="text-sm text-muted-foreground mt-1">Praktisk info om dit sommerhus</p>
        </div>

        {/* WiFi hero if available */}
        {guide?.wifi_name && (
          <Card className="border-accent/30 bg-gradient-to-r from-accent/5 to-accent/10">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center shrink-0">
                <Wifi className="w-6 h-6 text-accent" />
              </div>
              <div className="flex-1">
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider">WiFi-netværk</div>
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

        {/* Accordion sections */}
        <div className="space-y-2">
          {defaultSections.map(section => {
            const isOpen = expanded === section.key;
            return (
              <Card key={section.key} className="overflow-hidden">
                <button
                  onClick={() => setExpanded(isOpen ? null : section.key)}
                  className="w-full p-4 flex items-center gap-4 text-left hover:bg-muted/20 transition-colors"
                >
                  <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
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

        {/* Practical videos */}
        {videos && videos.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Play className="w-4 h-4 text-accent" />
                Praktiske videoer
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {videos.map((url, i) => (
                <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                  <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                    <Play className="w-4 h-4 text-accent" />
                  </div>
                  <span className="text-sm font-medium text-foreground">Video {i + 1}</span>
                </a>
              ))}
            </CardContent>
          </Card>
        )}

        {/* House rules */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-accent" />
              Husregler
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground space-y-2 leading-relaxed">
              {property?.house_rules ? (
                <p className="whitespace-pre-line">{property.house_rules}</p>
              ) : (
                <ul className="space-y-2">
                  {[
                    'Rygning er ikke tilladt indendørs',
                    'Kæledyr kun efter forudgående aftale',
                    'Respektér naboerne — ro efter kl. 22:00',
                    'Hold hus og have pænt under opholdet',
                    'Affald sorteres og bæres til containeren',
                    'Opvaskemaskinen tømmes og køres før afrejse',
                  ].map((rule, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-accent/50 shrink-0 mt-1.5" />
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
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Faciliteter</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-1.5">
                {property.amenities.map((a: string) => (
                  <span key={a} className="px-2.5 py-1.5 rounded-lg bg-muted text-xs font-medium text-foreground">{a}</span>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </GuestLayout>
  );
}
