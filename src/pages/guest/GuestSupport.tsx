import { useAuth } from '@/lib/auth';
import { GuestLayout } from '@/components/layout/GuestLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LifeBuoy, Phone, MessageCircle, AlertTriangle, HelpCircle, Mail } from 'lucide-react';

const faqItems = [
  { q: 'Hvordan finder jeg adgangskoden?', a: 'Den sendes via SMS og e-mail 24 timer inden ankomst.' },
  { q: 'Hvad gør jeg ved strømsvigt?', a: 'Tjek eltavlen i bryggers. Kontakt os hvis problemet fortsætter.' },
  { q: 'Kan jeg forlænge mit ophold?', a: 'Kontakt os hurtigst muligt, så tjekker vi tilgængeligheden.' },
  { q: 'Hvem kontakter jeg ved skader?', a: 'Ring til os med det samme. Vi koordinerer alt med ejeren.' },
];

export default function GuestSupport() {
  const { user, signOut } = useAuth();

  return (
    <GuestLayout guestEmail={user?.email} onLogout={signOut}>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Support</h1>
          <p className="text-sm text-muted-foreground mt-1">Vi er her for dig — alle dage kl. 10–22</p>
        </div>

        {/* Primary contact */}
        <Card className="border-accent/20 bg-accent/5">
          <CardContent className="p-5 flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center shrink-0">
              <LifeBuoy className="w-6 h-6 text-accent" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold text-foreground mb-1">24/7 Gæstesupport</div>
              <p className="text-xs text-muted-foreground mb-3">
                Chat, ring eller skriv til os. Vi hjælper med alt fra check-in til lokale tips.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="gold" className="text-xs">
                  <MessageCircle className="w-3.5 h-3.5 mr-1.5" />
                  Start chat
                </Button>
                <Button size="sm" variant="outline" className="text-xs">
                  <Phone className="w-3.5 h-3.5 mr-1.5" />
                  Ring til os
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Other options */}
        <div className="grid md:grid-cols-2 gap-3">
          <Card className="hover:border-accent/20 transition-colors cursor-pointer">
            <CardContent className="p-4 flex items-start gap-3">
              <Mail className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <div className="text-sm font-semibold text-foreground">E-mail support</div>
                <div className="text-xs text-muted-foreground">support@sommervibes.dk</div>
              </div>
            </CardContent>
          </Card>
          <Card className="hover:border-destructive/20 transition-colors cursor-pointer border-destructive/10">
            <CardContent className="p-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-destructive mt-0.5" />
              <div>
                <div className="text-sm font-semibold text-foreground">Rapportér akut problem</div>
                <div className="text-xs text-muted-foreground">Vandskade, indbrud eller ulykke</div>
              </div>
            </CardContent>
          </Card>
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
    </GuestLayout>
  );
}
