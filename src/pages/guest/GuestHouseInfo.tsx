import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { GuestLayout } from '@/components/layout/GuestLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Wifi, Flame, Zap, Trash2, ShowerHead, BookOpen, Tv, AlertCircle } from 'lucide-react';

const infoSections = [
  { icon: Wifi, title: 'WiFi', content: 'Netværksnavn og adgangskode finder du på et opslag i stuen eller på køleskabet.' },
  { icon: Flame, title: 'Varme', content: 'Huset opvarmes med fjernvarme / varmepumpe. Termostaten sidder i stuen. Indstil til max 22°C.' },
  { icon: Zap, title: 'Elektricitet', content: 'Eltavlen sidder i bryggers. Forbruget er inkluderet i prisen op til normalt forbrug.' },
  { icon: ShowerHead, title: 'Vand og bad', content: 'Varmtvandsforsyning er automatisk. Vær opmærksom på at spare på vand.' },
  { icon: Trash2, title: 'Affald og genbrug', content: 'Affaldssortering: restaffald, plast og glas. Containere står ved indkørslen eller i skuret.' },
  { icon: Tv, title: 'Underholdning', content: 'TV med dansk fjernsyn og streaming. WiFi-koden gælder også til smart-TV.' },
];

export default function GuestHouseInfo() {
  const { user, signOut } = useAuth();
  const [property, setProperty] = useState<any>(null);

  useEffect(() => {
    if (user) loadProperty();
  }, [user]);

  const loadProperty = async () => {
    if (!user) return;
    const { data: bookings } = await supabase
      .from('bookings').select('property_id').eq('guest_email', user.email).neq('status', 'cancelled').order('check_in', { ascending: false }).limit(1);
    if (bookings?.[0]) {
      const { data } = await supabase.from('properties').select('*').eq('id', bookings[0].property_id).single();
      setProperty(data);
    }
  };

  return (
    <GuestLayout guestEmail={user?.email} onLogout={signOut}>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Husinformation</h1>
          <p className="text-sm text-muted-foreground mt-1">Praktisk information om dit sommerhus</p>
        </div>

        {/* Info sections */}
        <div className="space-y-3">
          {infoSections.map(s => (
            <Card key={s.title}>
              <CardContent className="p-4 flex items-start gap-4">
                <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                  <s.icon className="w-4 h-4 text-accent" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-foreground">{s.title}</div>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{s.content}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* House rules */}
        <Card>
          <CardHeader className="pb-3">
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
                <ul className="space-y-1.5">
                  <li>• Rygning er ikke tilladt indendørs</li>
                  <li>• Kæledyr er kun tilladt efter forudgående aftale</li>
                  <li>• Respektér naboerne — ro efter kl. 22:00</li>
                  <li>• Hold hus og have pænt under opholdet</li>
                  <li>• Affald sorteres og bæres til containeren</li>
                  <li>• Opvaskemaskinen tømmes og køres før afrejse</li>
                </ul>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Amenities */}
        {property?.amenities && property.amenities.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Faciliteter</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-1.5">
                {property.amenities.map((a: string) => (
                  <span key={a} className="px-2.5 py-1 rounded-full bg-muted text-xs text-foreground">{a}</span>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </GuestLayout>
  );
}
