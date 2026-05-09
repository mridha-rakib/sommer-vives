import { OwnerLayout } from '@/components/layout/OwnerLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { MessageCircle, Phone, AlertTriangle, HelpCircle, Crown, ChevronRight } from 'lucide-react';

const faqItems = [
  { q: 'Hvornår modtager jeg min udbetaling?', a: 'Vi overfører automatisk til din konto 5 hverdage efter gæstens afrejse.' },
  { q: 'Hvordan tilpasser jeg mine priser?', a: 'Kontakt din rådgiver, så justerer vi sammen — du bestemmer altid.' },
  { q: 'Hvad sker der, hvis der opstår en skade?', a: 'Vi har en skadespool til småskader. Større sager håndterer vi via forsikringen.' },
  { q: 'Kan jeg blokere perioder til eget brug?', a: 'Selvfølgelig. Gå til din kalender og marker de perioder, du ønsker.' },
];

export default function OwnerSupport() {
  return (
    <OwnerLayout>
      <div className="space-y-6 max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center pt-4">
          <div className="w-14 h-14 rounded-2xl bg-[hsl(var(--gold)/0.1)] flex items-center justify-center mx-auto mb-4">
            <Crown className="w-6 h-6 text-[hsl(var(--gold-light))]" />
          </div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">Hvordan kan vi hjælpe?</h1>
          <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
            Dit dedikerede SommerVibes-team er altid klar — vi kender dit hus og dine behov
          </p>
        </div>

        {/* Quick actions */}
        <div className="grid gap-3">
          <Link to="/owner/messages">
            <Card className="group hover:border-[hsl(var(--gold)/0.3)] transition-all cursor-pointer border-[hsl(var(--gold)/0.15)] bg-gradient-to-r from-[hsl(var(--gold)/0.05)] to-transparent">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-[hsl(var(--gold)/0.12)] flex items-center justify-center shrink-0">
                  <MessageCircle className="w-5 h-5 text-[hsl(var(--gold-light))]" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-foreground">Skriv til dit team</div>
                  <p className="text-xs text-muted-foreground">Direkte besked — vi svarer typisk inden for få timer</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-[hsl(var(--gold-light))] transition-colors" />
              </CardContent>
            </Card>
          </Link>

          <Card className="hover:border-[hsl(var(--gold)/0.2)] transition-all cursor-pointer">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-muted/50 flex items-center justify-center shrink-0">
                <Phone className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-foreground">Book et opkald</div>
                <p className="text-xs text-muted-foreground">Vi ringer dig op, når det passer dig bedst</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground/40" />
            </CardContent>
          </Card>

          <Card className="hover:border-destructive/30 transition-all cursor-pointer">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-destructive/10 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-destructive" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-foreground">Noget haster?</div>
                <p className="text-xs text-muted-foreground">Rapportér et akut problem — vi reagerer hurtigt</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground/40" />
            </CardContent>
          </Card>
        </div>

        {/* FAQ */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <HelpCircle className="w-4 h-4 text-[hsl(var(--gold-light))]" />
              <span className="text-sm font-semibold text-foreground">Ofte stillede spørgsmål</span>
            </div>
            <div className="space-y-3">
              {faqItems.map((faq, i) => (
                <div key={i} className="p-3.5 rounded-xl bg-muted/30">
                  <div className="text-sm font-medium text-foreground mb-1">{faq.q}</div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{faq.a}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </OwnerLayout>
  );
}
