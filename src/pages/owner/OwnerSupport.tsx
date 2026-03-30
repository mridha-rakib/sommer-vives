import { OwnerLayout } from '@/components/layout/OwnerLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageCircle, Phone, HelpCircle, AlertTriangle, BookOpen, Mail } from 'lucide-react';

const supportOptions = [
  { icon: MessageCircle, label: 'Skriv til os', desc: 'Direkte besked til dit personlige SommerVibes-team', action: 'Start samtale', primary: true },
  { icon: Phone, label: 'Book et opkald', desc: 'Vi ringer dig op, når det passer dig bedst', action: 'Vælg tid', primary: false },
  { icon: Mail, label: 'Send e-mail', desc: 'support@sommervibes.dk', action: 'Skriv e-mail', primary: false },
  { icon: AlertTriangle, label: 'Noget haster?', desc: 'Rapportér et akut problem — vi reagerer hurtigt', action: 'Rapportér nu', primary: false },
];

const faqItems = [
  { q: 'Hvornår får jeg min udbetaling?', a: 'Udbetalinger foretages 5 hverdage efter gæstens afrejse.' },
  { q: 'Hvordan ændrer jeg mine priser?', a: 'Kontakt dit SommerVibes-team, så justerer vi priserne for dig.' },
  { q: 'Hvad sker der ved skader?', a: 'SommerVibes har en skadespool der dækker mindre skader. Større skader håndteres via forsikring.' },
  { q: 'Kan jeg blokere datoer?', a: 'Ja, gå til Kalender og marker de datoer du selv vil bruge boligen.' },
];

export default function OwnerSupport() {
  return (
    <OwnerLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Har du brug for hjælp?</h1>
          <p className="text-sm text-muted-foreground mt-1">Dit SommerVibes-team er altid klar — vi kender dit hus og dine behov</p>
        </div>

        <div className="grid md:grid-cols-2 gap-3">
          {supportOptions.map(opt => (
            <Card key={opt.label} className={`hover:border-accent/20 transition-colors ${opt.primary ? 'border-accent/30 bg-accent/5' : ''}`}>
              <CardContent className="p-5 flex items-start gap-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${opt.primary ? 'bg-accent/15' : 'bg-muted'}`}>
                  <opt.icon className={`w-5 h-5 ${opt.primary ? 'text-accent' : 'text-muted-foreground'}`} />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-foreground mb-0.5">{opt.label}</div>
                  <p className="text-xs text-muted-foreground mb-3">{opt.desc}</p>
                  <Button size="sm" variant={opt.primary ? 'gold' : 'outline'} className="text-xs">
                    {opt.action}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* FAQ */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <HelpCircle className="w-4 h-4 text-accent" />
              <span className="text-sm font-semibold text-foreground">Ofte stillede spørgsmål</span>
            </div>
            <div className="space-y-3">
              {faqItems.map((faq, i) => (
                <div key={i} className="p-3 rounded-lg bg-muted/30">
                  <div className="text-sm font-medium text-foreground mb-1">{faq.q}</div>
                  <p className="text-xs text-muted-foreground">{faq.a}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </OwnerLayout>
  );
}
