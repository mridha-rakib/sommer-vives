import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { GuestLayout } from '@/components/layout/GuestLayout';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, Circle, Key, Trash2, Clock, Sparkles, ThermometerSun, Refrigerator } from 'lucide-react';

const checkoutItems = [
  { id: 'dishes', label: 'Kør opvaskemaskinen', desc: 'Start en omgang, så klarer vi resten', icon: Refrigerator },
  { id: 'fridge', label: 'Tøm køleskabet', desc: 'Tag madvarer med' },
  { id: 'trash', label: 'Bær affald ud', desc: 'Sortér og stil ved containerne', icon: Trash2 },
  { id: 'windows', label: 'Luk vinduer og døre', desc: 'Tjek alle rum' },
  { id: 'heat', label: 'Skru ned for varme', desc: 'Sæt til ca. 15°C', icon: ThermometerSun },
  { id: 'key', label: 'Nøgle i nøgleboksen', desc: 'Sørg for den lukker ordentligt', icon: Key },
];

export default function GuestCheckout() {
  const { user, signOut } = useAuth();
  const [checked, setChecked] = useState<string[]>([]);

  const toggle = (id: string) => setChecked(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const allDone = checked.length === checkoutItems.length;
  const progress = Math.round((checked.length / checkoutItems.length) * 100);

  return (
    <GuestLayout guestEmail={user?.email} onLogout={signOut}>
      <div className="space-y-5">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Check-out</h1>
          <p className="text-sm text-muted-foreground mt-1">Følg de simple trin — rengøringen klarer vi</p>
        </div>

        {/* Time + progress */}
        <Card className="border-accent/20 bg-gradient-to-r from-accent/5 to-transparent">
          <CardContent className="p-5">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-accent/15 flex items-center justify-center shrink-0">
                <Clock className="w-6 h-6 text-accent" />
              </div>
              <div>
                <div className="text-sm font-semibold text-foreground">Senest kl. 10:00</div>
                <p className="text-xs text-muted-foreground">Sørg for at huset er klar</p>
              </div>
            </div>
            <div className="bg-background/60 rounded-full h-2 overflow-hidden">
              <div className="h-full bg-accent rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
            <div className="text-[10px] text-muted-foreground mt-1.5 text-right">{checked.length}/{checkoutItems.length}</div>
          </CardContent>
        </Card>

        {/* Checklist */}
        <div className="space-y-1.5">
          {checkoutItems.map(item => {
            const isDone = checked.includes(item.id);
            return (
              <Card key={item.id} className={`border-border/40 cursor-pointer transition-all ${isDone ? 'bg-emerald-500/5 border-emerald-500/15' : 'hover:border-border/60'}`}>
                <CardContent className="p-4">
                  <button onClick={() => toggle(item.id)} className="w-full flex items-start gap-3 text-left">
                    {isDone ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
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
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Key return */}
        <Card className="border-border/40">
          <CardContent className="p-4 flex items-start gap-3">
            <Key className="w-5 h-5 text-accent shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-semibold text-foreground">Nøgleaflevering</div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Læg nøglen i nøgleboksen. Koden ændres automatisk efter opholdet.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* All done */}
        {allDone && (
          <Card className="bg-accent/5 border-accent/20">
            <CardContent className="p-6 text-center">
              <Sparkles className="w-10 h-10 text-accent mx-auto mb-3" />
              <div className="font-display text-lg font-semibold text-foreground mb-1">Tak for dit ophold! ☀️</div>
              <p className="text-xs text-muted-foreground">Vi glæder os til at se dig igen.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </GuestLayout>
  );
}
