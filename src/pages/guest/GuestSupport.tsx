import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { GuestLayout } from '@/components/layout/GuestLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { LifeBuoy, Phone, MessageCircle, AlertTriangle, HelpCircle, Mail, ChevronDown, ChevronUp, Send, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

const faqItems = [
  { q: 'Hvordan finder jeg adgangskoden?', a: 'Den sendes via SMS og e-mail 24 timer inden ankomst.' },
  { q: 'Hvad gør jeg ved strømsvigt?', a: 'Tjek eltavlen i bryggers. Kontakt os hvis problemet fortsætter.' },
  { q: 'Kan jeg forlænge mit ophold?', a: 'Kontakt os hurtigst muligt, så tjekker vi tilgængeligheden.' },
  { q: 'Er rengøring inkluderet?', a: 'Ja, slutrengøring er inkluderet. Følg check-out tjeklisten.' },
  { q: 'Kan jeg bestille sengelinned?', a: 'Ja — under "Tilkøb" kan du bestille sengelinned og meget mere.' },
];

export default function GuestSupport() {
  const { user, signOut } = useAuth();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [showReport, setShowReport] = useState(false);
  const [subject, setSubject] = useState('');
  const [desc, setDesc] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const submitTicket = async () => {
    if (!subject.trim()) return;
    setSubmitting(true);
    await supabase.from('support_tickets').insert({
      requester_id: user?.id, requester_email: user?.email, requester_type: 'guest',
      subject: subject.trim(), description: desc.trim() || null, category: 'general', priority: 'normal',
    });
    setSubmitting(false);
    setSubmitted(true);
    toast.success('Sagen er oprettet — vi vender tilbage snarest');
  };

  return (
    <GuestLayout guestEmail={user?.email} onLogout={signOut}>
      <div className="space-y-5">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Support</h1>
          <p className="text-sm text-muted-foreground mt-1">Chat alle dage 10–20</p>
        </div>

        {/* Primary contact */}
        <Card className="border-accent/20 bg-gradient-to-r from-accent/5 to-transparent">
          <CardContent className="p-5 flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-accent/15 flex items-center justify-center shrink-0">
              <LifeBuoy className="w-6 h-6 text-accent" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold text-foreground mb-1">Gæstesupport</div>
              <p className="text-xs text-muted-foreground mb-3">
                Chat, ring eller skriv — vi hjælper med alt.
              </p>
              <div className="flex flex-wrap gap-2">
                <Link to="/guest/messages">
                  <Button size="sm" variant="gold" className="text-xs">
                    <MessageCircle className="w-3.5 h-3.5 mr-1.5" />Start chat
                  </Button>
                </Link>
                <a href="tel:+4500000000">
                  <Button size="sm" variant="outline" className="text-xs">
                    <Phone className="w-3.5 h-3.5 mr-1.5" />Ring til os
                  </Button>
                </a>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick actions */}
        <div className="grid grid-cols-2 gap-2.5">
          <a href="mailto:support@sommervibes.dk">
            <Card className="h-full border-border/40 hover:border-border/60 transition-colors">
              <CardContent className="p-4 flex items-start gap-3">
                <Mail className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <div className="text-sm font-semibold text-foreground">E-mail</div>
                  <div className="text-[11px] text-muted-foreground">support@sommervibes.dk</div>
                </div>
              </CardContent>
            </Card>
          </a>
          <button onClick={() => setShowReport(true)} className="text-left">
            <Card className="h-full border-destructive/10 hover:border-destructive/20 transition-colors">
              <CardContent className="p-4 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-destructive mt-0.5" />
                <div>
                  <div className="text-sm font-semibold text-foreground">Problem</div>
                  <div className="text-[11px] text-muted-foreground">Skade, fejl eller akut</div>
                </div>
              </CardContent>
            </Card>
          </button>
        </div>

        {/* Report form */}
        {showReport && !submitted && (
          <Card className="border-destructive/15">
            <CardContent className="p-5 space-y-3">
              <div className="text-sm font-semibold text-foreground">Rapportér et problem</div>
              <Input placeholder="Hvad handler det om?" value={subject} onChange={e => setSubject(e.target.value)} className="rounded-xl" />
              <Textarea placeholder="Beskriv problemet kort..." value={desc} onChange={e => setDesc(e.target.value)} rows={3} className="rounded-xl" />
              <div className="flex gap-2">
                <Button onClick={submitTicket} disabled={submitting || !subject.trim()} variant="gold" size="sm" className="text-xs">
                  <Send className="w-3.5 h-3.5 mr-1.5" />{submitting ? 'Sender...' : 'Send'}
                </Button>
                <Button onClick={() => setShowReport(false)} variant="ghost" size="sm" className="text-xs">Annuller</Button>
              </div>
            </CardContent>
          </Card>
        )}
        {submitted && (
          <Card className="border-emerald-500/15 bg-emerald-500/5">
            <CardContent className="p-5 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              <div>
                <div className="text-sm font-semibold text-foreground">Sagen er oprettet</div>
                <p className="text-xs text-muted-foreground">Vi vender tilbage hurtigst muligt</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* FAQ */}
        <Card className="border-border/40">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <HelpCircle className="w-4 h-4 text-accent" />
              <span className="text-sm font-semibold text-foreground">Ofte stillede spørgsmål</span>
            </div>
            <div className="space-y-0.5">
              {faqItems.map((faq, i) => (
                <button
                  key={i}
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full text-left p-3 rounded-lg hover:bg-muted/20 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">{faq.q}</span>
                    {openFaq === i ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                  </div>
                  {openFaq === i && (
                    <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{faq.a}</p>
                  )}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </GuestLayout>
  );
}
