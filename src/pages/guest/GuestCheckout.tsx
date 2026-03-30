import { useAuth } from '@/lib/auth';
import { GuestLayout } from '@/components/layout/GuestLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, Circle, Key, Trash2, ShowerHead, DoorClosed, Clock } from 'lucide-react';

const checkoutSteps = [
  { done: false, label: 'Tøm køleskab og opvaskemaskine', desc: 'Kør opvaskemaskinen og sørg for at køleskabet er tømt' },
  { done: false, label: 'Bær affald ud', desc: 'Sortér affald og bær det til containerne ved indkørslen' },
  { done: false, label: 'Tjek vinduer og døre', desc: 'Luk og lås alle vinduer og døre ordentligt' },
  { done: false, label: 'Sluk for varme og lys', desc: 'Sæt termostaten ned til 15°C og sluk alt lys' },
  { done: false, label: 'Læg nøgle i nøgleboks', desc: 'Placer nøglen tilbage i nøgleboksen og luk den ordentligt' },
  { done: false, label: 'Forlad senest kl. 10:00', desc: 'Check-out deadline er kl. 10:00 — tak for dit ophold!' },
];

export default function GuestCheckout() {
  const { user, signOut } = useAuth();

  return (
    <GuestLayout guestEmail={user?.email} onLogout={signOut}>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Check-out</h1>
          <p className="text-sm text-muted-foreground mt-1">Følg tjeklisten for en god afrejse</p>
        </div>

        {/* Check-out time */}
        <Card className="border-accent/20 bg-accent/5">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center shrink-0">
              <Clock className="w-6 h-6 text-accent" />
            </div>
            <div>
              <div className="text-sm font-semibold text-foreground">Check-out senest kl. 10:00</div>
              <p className="text-xs text-muted-foreground">Sørg for at huset er klar til rengøring</p>
            </div>
          </CardContent>
        </Card>

        {/* Checklist */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Afrejse-tjekliste</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {checkoutSteps.map((step, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/30 transition-colors">
                  <Circle className="w-5 h-5 text-muted-foreground/40 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-sm font-medium text-foreground">{step.label}</div>
                    <p className="text-xs text-muted-foreground mt-0.5">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Key return */}
        <Card>
          <CardContent className="p-4 flex items-start gap-3">
            <Key className="w-5 h-5 text-accent shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-semibold text-foreground">Nøgleaflevering</div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Læg nøglen tilbage i nøgleboksen og sørg for at den er ordentligt lukket. 
                Du behøver ikke nulstille koden — den ændres automatisk.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Thank you */}
        <Card className="bg-accent/5 border-accent/20">
          <CardContent className="p-5 text-center">
            <div className="font-display text-lg font-semibold text-foreground mb-1">Tak for dit ophold!</div>
            <p className="text-xs text-muted-foreground">
              Vi håber du har haft en fantastisk ferie. Vi glæder os til at se dig igen.
            </p>
          </CardContent>
        </Card>
      </div>
    </GuestLayout>
  );
}
