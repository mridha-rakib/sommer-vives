import { useAuth } from '@/lib/auth';
import { GuestLayout } from '@/components/layout/GuestLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DoorOpen, Key, Car, Phone, MapPin, CheckCircle2, AlertTriangle, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AppDownloadBanner } from '@/components/app/AppDownloadBanner';

const checkinSteps = [
  { step: 1, title: 'Kør til adressen', desc: 'Brug GPS-koordinaterne eller adressen fra din reservation. Følg vejen hele vejen til huset.', icon: MapPin },
  { step: 2, title: 'Find nøgleboksen', desc: 'Nøgleboksen sidder typisk ved hoveddøren eller carport. Se billedet i din velkomstbesked.', icon: Key },
  { step: 3, title: 'Indtast adgangskoden', desc: 'Din personlige kode sendes 24 timer før ankomst via SMS og e-mail.', icon: DoorOpen },
  { step: 4, title: 'Velkommen hjem', desc: 'Lås dig ind, tænd for varme/el og gør dig det hyggeligt. WiFi-koden finder du indendørs.', icon: CheckCircle2 },
];

export default function GuestCheckin() {
  const { user, signOut } = useAuth();

  return (
    <GuestLayout guestEmail={user?.email} onLogout={signOut}>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Check-in</h1>
          <p className="text-sm text-muted-foreground mt-1">Alt du skal vide om ankomst og adgang</p>
        </div>

        {/* Access code card */}
        <Card className="border-accent/20 bg-accent/5">
          <CardContent className="p-5 text-center">
            <Key className="w-8 h-8 text-accent mx-auto mb-3" />
            <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Din adgangskode</div>
            <div className="font-mono text-3xl font-bold text-accent tracking-[0.3em]">• • • •</div>
            <p className="text-xs text-muted-foreground mt-2">Koden sendes 24 timer før ankomst</p>
          </CardContent>
        </Card>

        {/* Step-by-step */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Ankomstguide</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {checkinSteps.map(s => (
              <div key={s.step} className="flex items-start gap-4">
                <div className="w-9 h-9 rounded-full bg-accent/15 flex items-center justify-center text-sm font-bold text-accent shrink-0">
                  {s.step}
                </div>
                <div>
                  <div className="text-sm font-semibold text-foreground">{s.title}</div>
                  <p className="text-xs text-muted-foreground mt-0.5">{s.desc}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Parking */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Car className="w-4 h-4 text-accent" />
              Parkering
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Der er gratis parkering direkte ved huset. Du kan parkere op til 2 biler i indkørslen.
            </p>
          </CardContent>
        </Card>

        {/* Emergency */}
        <Card className="border-destructive/20">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-semibold text-foreground">Nødkontakt</div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Akutte problemer ved ankomst? Ring til os på <strong className="text-foreground">+45 XX XX XX XX</strong> — vi er tilgængelige alle dage kl. 10-22.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Check-in time */}
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <DoorOpen className="w-5 h-5 text-accent" />
              <div>
                <div className="text-sm font-medium text-foreground">Check-in tidspunkt</div>
                <div className="text-xs text-muted-foreground">Fra kl. 15:00</div>
              </div>
            </div>
            <Badge variant="outline" className="text-[10px]">Standard</Badge>
          </CardContent>
        </Card>
      </div>
    </GuestLayout>
  );
}
