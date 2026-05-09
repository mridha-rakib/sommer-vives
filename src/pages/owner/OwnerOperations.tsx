import { OwnerLayout } from '@/components/layout/OwnerLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Key, Wrench, ClipboardCheck, Phone, ShieldCheck } from 'lucide-react';

const services = [
  { icon: Sparkles, label: 'Slutrengøring', status: 'Aktiv', desc: 'SommerVibes koordinerer professionel rengøring mellem ophold', active: true },
  { icon: Key, label: 'Nøgleboks', status: 'Installeret', desc: 'Gæster får automatisk adgangskode ved check-in', active: true },
  { icon: ClipboardCheck, label: 'Før-ophold tjekliste', status: 'Klar', desc: 'Automatisk gennemgang før hvert gæsteophold', active: true },
  { icon: Wrench, label: 'Vedligeholdelse', status: 'Ingen aktive', desc: 'Rapport og koordinering af reparationer', active: false },
  { icon: Phone, label: 'Lokal partner', status: 'Tildelt', desc: 'Kontaktperson i dit område til akutte situationer', active: true },
  { icon: ShieldCheck, label: 'Forsikring & skader', status: 'Dækket', desc: 'Skadespool og forsikringsdækning via SommerVibes', active: true },
];

export default function OwnerOperations() {
  return (
    <OwnerLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Drift & services</h1>
          <p className="text-sm text-muted-foreground mt-1">Overblik over driftstjenester og operationel status</p>
        </div>

        <div className="grid md:grid-cols-2 gap-3">
          {services.map(svc => (
            <Card key={svc.label} className="hover:border-accent/20 transition-colors">
              <CardContent className="p-5 flex items-start gap-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${svc.active ? 'bg-accent/10' : 'bg-muted'}`}>
                  <svc.icon className={`w-5 h-5 ${svc.active ? 'text-accent' : 'text-muted-foreground'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-semibold text-foreground">{svc.label}</span>
                    <Badge variant="outline" className={`text-[10px] ${svc.active ? 'bg-emerald-400/15 text-emerald-400 border-emerald-400/20' : ''}`}>
                      {svc.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{svc.desc}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Maintenance requests */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Vedligeholdelsesopgaver</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-10">
              <Wrench className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Ingen aktive vedligeholdelsesopgaver</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Rapportér en opgave via Support-sektionen</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </OwnerLayout>
  );
}
