import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { GuestLayout } from '@/components/layout/GuestLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, Circle, Key, Trash2, Clock, Sparkles, ThermometerSun, DoorClosed, Refrigerator } from 'lucide-react';

const checkoutItems = [
  { id: 'dishes', label: 'Kør opvaskemaskinen', desc: 'Tøm og kør en sidste omgang', icon: Refrigerator },
  { id: 'fridge', label: 'Tøm køleskabet', desc: 'Fjern al mad og rengør hylderne' },
  { id: 'trash', label: 'Bær affald ud', desc: 'Sortér og stil ved containerne', icon: Trash2 },
  { id: 'windows', label: 'Luk vinduer og døre', desc: 'Tjek alle rum — lås hoveddøren' },
  { id: 'heat', label: 'Sluk varme og lys', desc: 'Sæt termostaten ned til 15°C', icon: ThermometerSun },
  { id: 'key', label: 'Læg nøgle i nøgleboks', desc: 'Luk nøgleboksen ordentligt', icon: Key },
];

export default function GuestCheckout() {
  const { user, signOut } = useAuth();
  const [checked, setChecked] = useState<string[]>([]);

  const toggle = (id: string) => {
    setChecked(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const allDone = checked.length === checkoutItems.length;
  const progress = Math.round((checked.length / checkoutItems.length) * 100);

  return (
    <GuestLayout guestEmail={user?.email} onLogout={signOut}>
      <div className="space-y-5">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Tid til afrejse</h1>
          <p className="text-sm text-muted-foreground mt-1">Følg de simple trin herunder — rengøringen klarer vi</p>
        </div>

        {/* Time + progress */}
        <Card className="border-accent/30 bg-gradient-to-r from-accent/5 to-accent/10">
          <CardContent className="p-5">
            <div className="flex items-center gap-4 mb-3">
              <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center shrink-0">
                <Clock className="w-6 h-6 text-accent" />
              </div>
              <div>
                <div className="text-sm font-semibold text-foreground">Check-out senest kl. 10:00</div>
                <p className="text-xs text-muted-foreground">Sørg for at huset er klar til rengøring</p>
              </div>
            </div>
            <div className="bg-background/60 rounded-full h-2 overflow-hidden">
              <div className="h-full bg-accent rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
            <div className="text-[10px] text-muted-foreground mt-1.5 text-right">{checked.length}/{checkoutItems.length} udført</div>
          </CardContent>
        </Card>

        {/* Interactive checklist */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Afrejse-tjekliste</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {checkoutItems.map(item => {
              const isDone = checked.includes(item.id);
              return (
                <button
                  key={item.id}
                  onClick={() => toggle(item.id)}
                  className={`w-full flex items-start gap-3 p-3 rounded-lg transition-all text-left ${isDone ? 'bg-emerald-400/5' : 'hover:bg-muted/30'}`}
                >
                  {isDone ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <Circle className="w-5 h-5 text-muted-foreground/30 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <div className={`text-sm font-medium ${isDone ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                      {item.label}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                  </div>
                </button>
              );
            })}
          </CardContent>
        </Card>

        {/* Key return */}
        <Card>
          <CardContent className="p-4 flex items-start gap-3">
            <Key className="w-5 h-5 text-accent shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-semibold text-foreground">Nøgleaflevering</div>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                Læg nøglen tilbage i nøgleboksen og sørg for at den er ordentligt lukket. 
                Koden ændres automatisk efter dit ophold.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* All done */}
        {allDone && (
          <Card className="bg-accent/5 border-accent/30">
            <CardContent className="p-6 text-center">
              <Sparkles className="w-10 h-10 text-accent mx-auto mb-3" />
              <div className="font-display text-lg font-semibold text-foreground mb-1">Tak for dit ophold! ☀️</div>
              <p className="text-xs text-muted-foreground">
                Vi håber du har haft en fantastisk ferie. Vi glæder os til at se dig igen.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </GuestLayout>
  );
}
