import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { GuestLayout } from '@/components/layout/GuestLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DoorOpen, Key, Car, Phone, MapPin, CheckCircle2, AlertTriangle, Wifi, Clock, Navigation, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function GuestCheckin() {
  const { user, signOut } = useAuth();
  const [guide, setGuide] = useState<any>(null);
  const [property, setProperty] = useState<any>(null);
  const [keybox, setKeybox] = useState<any>(null);
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
      const [propRes, guideRes, kbRes] = await Promise.all([
        supabase.from('properties').select('title, address, region').eq('id', pid).single(),
        supabase.from('checkin_guides').select('*').limit(10),
        supabase.from('keybox_installations').select('*').eq('property_id', pid).eq('status', 'installed').limit(1),
      ]);
      setProperty(propRes.data);
      if (guideRes.data?.length) setGuide(guideRes.data[0]);
      if (kbRes.data?.length) setKeybox(kbRes.data[0]);
    }
    setLoading(false);
  };

  const hasCode = keybox?.access_code;
  const steps = [
    { step: 1, title: 'Kør til adressen', desc: guide?.arrival_instructions || `Brug GPS til ${property?.address || 'ejendommens adresse'}. Vi sender et kort dagen før.`, icon: Navigation },
    { step: 2, title: 'Find nøgleboksen', desc: guide?.keybox_instructions || keybox?.keybox_location || 'Nøgleboksen sidder typisk ved hoveddøren eller carporten.', icon: Key },
    { step: 3, title: 'Tast din kode', desc: guide?.access_code_note || 'Du modtager koden via SMS og e-mail 24 timer inden ankomst.', icon: DoorOpen },
    { step: 4, title: 'Gør dig hjemme', desc: 'Tænd for varme, find WiFi-koden — og nyd din ferie!', icon: CheckCircle2 },
  ];

  const videos = guide?.video_urls as string[] | null;

  return (
    <GuestLayout guestEmail={user?.email} onLogout={signOut}>
      <div className="space-y-5">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Velkommen — din ankomstguide</h1>
          <p className="text-sm text-muted-foreground mt-1">Alt er klar til dig. Følg guiden herunder, så er du hurtigt inde</p>
        </div>

        {/* Access code hero */}
        <Card className="border-accent/30 bg-gradient-to-br from-accent/5 to-accent/10 overflow-hidden">
          <CardContent className="p-6 text-center relative">
            <div className="w-14 h-14 rounded-2xl bg-accent/20 flex items-center justify-center mx-auto mb-4">
              <Key className="w-7 h-7 text-accent" />
            </div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2 font-medium">Din adgangskode</div>
            {hasCode ? (
              <div className="font-mono text-4xl font-bold text-accent tracking-[0.4em]">{keybox.access_code}</div>
            ) : (
              <>
                <div className="font-mono text-4xl font-bold text-muted-foreground/30 tracking-[0.4em]">• • • •</div>
                <p className="text-xs text-muted-foreground mt-3">Koden sendes 24 timer før ankomst via SMS og e-mail</p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Check-in time */}
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5 text-accent" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold text-foreground">Check-in fra kl. 15:00</div>
              <div className="text-xs text-muted-foreground">Du kan ankomme når som helst efter dette tidspunkt</div>
            </div>
            <Badge variant="outline" className="text-[10px] shrink-0">Standard</Badge>
          </CardContent>
        </Card>

        {/* Step-by-step guide */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Ankomstguide — trin for trin</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {steps.map((s, i) => (
              <div key={s.step} className="flex items-start gap-4 p-3 rounded-lg hover:bg-muted/30 transition-colors">
                <div className="w-8 h-8 rounded-full bg-accent/15 flex items-center justify-center text-xs font-bold text-accent shrink-0 mt-0.5">
                  {s.step}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-foreground">{s.title}</div>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Videos */}
        {videos && videos.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Play className="w-4 h-4 text-accent" />
                Ankomstvideoer
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {videos.map((url, i) => (
                <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                  <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                    <Play className="w-4 h-4 text-accent" />
                  </div>
                  <span className="text-sm font-medium text-foreground">Se video {i + 1}</span>
                </a>
              ))}
            </CardContent>
          </Card>
        )}

        {/* WiFi quick card */}
        {guide?.wifi_name && (
          <Card className="bg-muted/30">
            <CardContent className="p-4 flex items-center gap-4">
              <Wifi className="w-5 h-5 text-accent shrink-0" />
              <div className="flex-1">
                <div className="text-xs text-muted-foreground">WiFi-netværk</div>
                <div className="text-sm font-semibold text-foreground font-mono">{guide.wifi_name}</div>
              </div>
              {guide.wifi_password && (
                <div className="text-right">
                  <div className="text-xs text-muted-foreground">Kode</div>
                  <div className="text-sm font-semibold text-foreground font-mono">{guide.wifi_password}</div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Parking */}
        <Card>
          <CardContent className="p-4 flex items-start gap-4">
            <Car className="w-5 h-5 text-accent shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-semibold text-foreground">Parkering</div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {guide?.parking_info || 'Gratis parkering direkte ved huset — plads til op til 2 biler i indkørslen.'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Emergency */}
        <Card className="border-destructive/20 bg-destructive/5">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="text-sm font-semibold text-foreground">Akut hjælp ved ankomst?</div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Ring til os på <strong className="text-foreground">{guide?.emergency_contact || '+45 XX XX XX XX'}</strong> — vi er tilgængelige alle dage.
              </p>
            </div>
            <a href={`tel:${guide?.emergency_contact || ''}`}>
              <Button size="sm" variant="destructive" className="text-xs shrink-0">
                <Phone className="w-3.5 h-3.5 mr-1" />Ring
              </Button>
            </a>
          </CardContent>
        </Card>

        {/* Address with map link */}
        {property?.address && (
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <MapPin className="w-5 h-5 text-accent shrink-0" />
              <div className="flex-1">
                <div className="text-xs text-muted-foreground">Adresse</div>
                <div className="text-sm font-medium text-foreground">{property.address}</div>
              </div>
              <a href={`https://maps.google.com/?q=${encodeURIComponent(property.address)}`}
                target="_blank" rel="noopener noreferrer" className="text-xs text-accent font-medium hover:underline">
                Vis kort →
              </a>
            </CardContent>
          </Card>
        )}
      </div>
    </GuestLayout>
  );
}
