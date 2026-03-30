import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { OwnerLayout } from '@/components/layout/OwnerLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileSignature, Check, Shield, ArrowRight, ArrowLeft, Download,
  CheckCircle2, Clock, ChevronDown, ChevronUp, Phone, Globe,
  Star, Wallet, Home, Calendar, PenLine, Lock, Eye
} from 'lucide-react';
import { SignatureCanvas } from '@/components/agreement/SignatureCanvas';

// ─── Agreement content ──────────────────────────────────────

const AGREEMENT_VERSION = '1.2';

interface AgreementData {
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  ownerAddress: string;
  propertyTitle: string;
  propertyAddress: string;
  propertyRegion: string;
  propertyId: string | null;
}

const LEGAL_SECTIONS = [
  {
    id: 'formidling',
    title: '§1 — Formidling',
    summary: 'SommerVibes formidler udlejning af din bolig til ferie- og fritidsgæster.',
    full: `1.1 SommerVibes ApS ("Formidleren") påtager sig at formidle korttidsudlejning af Ejerens sommerhus/feriebolig ("Ejendommen") til ferie- og fritidsgæster på vegne af Ejeren.\n\n1.2 Formidleren markedsfører Ejendommen på relevante platforme, herunder men ikke begrænset til Airbnb, Booking.com, VRBO samt Formidlerens egne kanaler.\n\n1.3 Formidleren har ret til at oprette og administrere annoncer med billeder, tekst og priser godkendt af Ejeren.\n\n1.4 Ejeren bevarer til enhver tid ejendomsretten og retten til selv at benytte Ejendommen i perioder, der ikke er reserveret til gæster.`,
  },
  {
    id: 'kommission',
    title: '§2 — Kommission og betaling',
    summary: '15% kommission af gennemførte bookinger. Gæsten betaler 5% servicegebyr.',
    full: `2.1 Formidleren modtager en kommission på 15% (femten procent) af den samlede lejeindtægt ekskl. rengøringsgebyr for hver gennemført booking.\n\n2.2 Gæsten betaler et servicegebyr på 5% (fem procent) af lejebeløbet, som tilfalder Formidleren.\n\n2.3 Ejeren modtager månedlige udbetalinger med fuld gennemsigtighed via ejerportalen.\n\n2.4 Udbetalinger sker senest den 15. i måneden efter gæstens afrejse.\n\n2.5 Der opkræves ingen oprettelsesgebyr, abonnementsgebyr eller andre skjulte gebyrer.`,
  },
  {
    id: 'service',
    title: '§3 — Service og drift',
    summary: 'SommerVibes håndterer gæstekontakt, markedsføring, rengøring og kvalitetssikring.',
    full: `3.1 Formidleren varetager al gæstekommunikation før, under og efter opholdet.\n\n3.2 Formidleren koordinerer slutrengøring mellem bookinger via godkendte samarbejdspartnere.\n\n3.3 Formidleren optimerer prissætning baseret på sæson, efterspørgsel og markedsdata.\n\n3.4 Formidleren vejleder om professionel fotografering og annoncetekst.\n\n3.5 Formidleren kan facilitere nøgleoverdragelse via nøgleboks eller anden aftalt metode.\n\n3.6 Formidleren gennemfører kvalitetskontrol og opfølgning ved gæsteanmeldelser under 4 stjerner.`,
  },
  {
    id: 'ejer',
    title: '§4 — Ejerens forpligtelser',
    summary: 'Ejeren sikrer at boligen er klar, forsikret og tilgængelig som aftalt.',
    full: `4.1 Ejeren sikrer at Ejendommen til enhver tid er i forsvarlig stand og klar til udlejning.\n\n4.2 Ejeren skal holde Ejendommen forsikret mod brand, storm, vand og indbrud.\n\n4.3 Ejeren opdaterer tilgængelighed via ejerportalen og blokerer datoer til eget brug i god tid.\n\n4.4 Ejeren informerer Formidleren om væsentlige ændringer ved Ejendommen (renovering, skader, etc.).\n\n4.5 Ejeren er ansvarlig for korrekt skattemæssig indberetning af lejeindtægter.`,
  },
  {
    id: 'binding',
    title: '§5 — Binding og opsigelse',
    summary: '6 måneders binding. Herefter 30 dages opsigelsesvarsel.',
    full: `5.1 Aftalen har en bindingsperiode på 6 (seks) måneder fra underskriftsdatoen.\n\n5.2 Efter bindingsperioden kan begge parter opsige aftalen med 30 dages skriftligt varsel.\n\n5.3 Allerede bekræftede bookinger ved aftalens ophør gennemføres som planlagt.\n\n5.4 Ved opsigelse fjernes Ejendommen fra alle markedsføringskanaler inden for 14 dage.`,
  },
  {
    id: 'data',
    title: '§6 — Data og samtykke',
    summary: 'Dine data behandles fortroligt iht. GDPR og vores privatlivspolitik.',
    full: `6.1 Formidleren behandler Ejerens personoplysninger i overensstemmelse med gældende databeskyttelseslovgivning (GDPR).\n\n6.2 Personoplysninger anvendes udelukkende til opfyldelse af denne aftale og relateret kommunikation.\n\n6.3 Ejeren kan til enhver tid anmode om indsigt i, rettelse af eller sletning af sine personoplysninger.\n\n6.4 Ejerens data deles ikke med tredjeparter uden forudgående samtykke, medmindre det er nødvendigt for aftalens opfyldelse.\n\n6.5 For yderligere information henvises til Formidlerens privatlivspolitik på sommervibes.dk/privacy.`,
  },
  {
    id: 'ansvar',
    title: '§7 — Ansvar og forsikring',
    summary: 'SommerVibes dækker uforudsete skader via skadepuljen og faciliterer forsikringssager.',
    full: `7.1 Formidleren opretholder en skadepulje til dækning af pludselige og uforudsete skader forårsaget af gæster.\n\n7.2 Skadepuljen finansieres via et fast bidrag fra hver booking.\n\n7.3 Formidleren er ikke ansvarlig for skader, der skyldes normal slid, vejrforhold eller Ejerens egne forsømmelser.\n\n7.4 Formidleren faciliterer kontakten mellem Ejer og forsikringsselskab ved større skadessager.`,
  },
];

// ─── Component ───────────────────────────────────────────────

export default function OwnerAgreement() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(1); // 1=intro, 2=summary, 3=full, 4=confirm, 5=sign, 6=done
  const [expandedSections, setExpandedSections] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingAgreement, setExistingAgreement] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [agreementData, setAgreementData] = useState<AgreementData>({
    ownerName: '', ownerEmail: '', ownerPhone: '', ownerAddress: '',
    propertyTitle: '', propertyAddress: '', propertyRegion: '', propertyId: null,
  });

  const [consent, setConsent] = useState({
    acceptAgreement: false, acceptTerms: false, acceptPrivacy: false, acceptMarketing: false,
  });
  const [signatureName, setSignatureName] = useState('');
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);

  // Load profile & property data
  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      // Check existing signed agreement
      const { data: agreements } = await supabase
        .from('agreements')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (agreements && agreements.length > 0 && agreements[0].status === 'signed') {
        setExistingAgreement(agreements[0]);
        setStep(6);
      }

      // Load profile
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (profile) {
        setAgreementData(prev => ({
          ...prev,
          ownerName: profile.full_name || '',
          ownerEmail: profile.email || '',
          ownerPhone: profile.phone || '',
        }));
        setSignatureName(profile.full_name || '');
      }

      // Load first property
      const { data: properties } = await supabase.from('properties').select('*').eq('owner_id', user.id).limit(1);
      if (properties && properties.length > 0) {
        const p = properties[0];
        setAgreementData(prev => ({
          ...prev,
          propertyTitle: p.title || '',
          propertyAddress: p.address || '',
          propertyRegion: p.region || '',
          propertyId: p.id,
        }));
      }

      setLoading(false);
    };
    load();
  }, [user]);

  const toggleSection = (id: string) => {
    setExpandedSections(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleSign = async () => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('agreements').insert({
        owner_id: user.id,
        property_id: agreementData.propertyId,
        version: AGREEMENT_VERSION,
        status: 'signed',
        owner_name: agreementData.ownerName,
        owner_email: agreementData.ownerEmail,
        owner_phone: agreementData.ownerPhone,
        owner_address: agreementData.ownerAddress,
        property_title: agreementData.propertyTitle,
        property_address: agreementData.propertyAddress,
        property_region: agreementData.propertyRegion,
        commission_percent: 15,
        binding_months: 6,
        notice_days: 30,
        signature_name: signatureName,
        signature_date: new Date().toISOString().split('T')[0],
        signed_at: new Date().toISOString(),
        accept_terms: consent.acceptTerms,
        accept_privacy: consent.acceptPrivacy,
        accept_marketing: consent.acceptMarketing,
      });
      if (error) throw error;

      // Reload to show signed state
      const { data: agreements } = await supabase
        .from('agreements').select('*').eq('owner_id', user.id)
        .order('created_at', { ascending: false }).limit(1);
      if (agreements && agreements.length > 0) setExistingAgreement(agreements[0]);

      setStep(6);
      toast.success('Aftalen er signeret!');
    } catch (err: any) {
      toast.error(err.message || 'Der opstod en fejl');
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSign = consent.acceptAgreement && consent.acceptTerms && consent.acceptPrivacy && signatureName.trim().length > 2;

  if (loading) {
    return (
      <OwnerLayout>
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </OwnerLayout>
    );
  }

  // ─── Step Indicator ───────────────────────────────────────

  const STEPS_META = [
    { label: 'Introduktion', icon: Eye },
    { label: 'Oversigt', icon: FileSignature },
    { label: 'Fuld aftale', icon: Shield },
    { label: 'Bekræftelse', icon: Check },
    { label: 'Signering', icon: PenLine },
    { label: 'Signeret', icon: CheckCircle2 },
  ];

  const StepBar = () => (
    <div className="flex items-center justify-center gap-0 mb-8 overflow-x-auto px-2">
      {STEPS_META.map((s, i) => {
        const idx = i + 1;
        const done = idx < step;
        const active = idx === step;
        return (
          <div key={i} className="flex items-center shrink-0">
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs transition-all ${
                done ? 'bg-primary text-primary-foreground' :
                active ? 'bg-primary text-primary-foreground ring-4 ring-primary/20' :
                'bg-muted/40 text-muted-foreground/50'
              }`}>
                {done ? <Check className="w-3.5 h-3.5" /> : <span className="font-semibold">{idx}</span>}
              </div>
              <span className={`text-[9px] mt-1 font-medium whitespace-nowrap ${
                active ? 'text-primary' : done ? 'text-primary/60' : 'text-muted-foreground/40'
              }`}>{s.label}</span>
            </div>
            {i < STEPS_META.length - 1 && (
              <div className={`w-6 md:w-10 h-px mx-1 ${done ? 'bg-primary/40' : 'bg-border/30'}`} />
            )}
          </div>
        );
      })}
    </div>
  );

  // ─── Info Row ─────────────────────────────────────────────

  const InfoRow = ({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) => (
    <div className="flex justify-between text-sm py-1.5">
      <span className="text-muted-foreground">{label}</span>
      <span className={highlight ? 'text-primary font-semibold' : 'text-foreground font-medium'}>{value || '—'}</span>
    </div>
  );

  // ─── Step 1: Intro ────────────────────────────────────────

  const StepIntro = () => (
    <div className="max-w-xl mx-auto text-center">
      <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
        <FileSignature className="w-8 h-8 text-primary" />
      </div>
      <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-3">Formidlingsaftale</h2>
      <p className="text-muted-foreground mb-8 max-w-md mx-auto">
        Gennemgå og underskriv din formidlingsaftale med SommerVibes. Det tager kun et par minutter.
      </p>

      {/* Document meta */}
      <Card className="border-border/30 bg-card/30 text-left mb-8">
        <CardContent className="p-5 space-y-1">
          <InfoRow label="Aftaleversion" value={`v${AGREEMENT_VERSION}`} />
          <InfoRow label="Dato" value={new Date().toLocaleDateString('da-DK', { day: 'numeric', month: 'long', year: 'numeric' })} />
          <InfoRow label="Ejer" value={agreementData.ownerName} />
          <InfoRow label="E-mail" value={agreementData.ownerEmail} />
          <InfoRow label="Bolig" value={agreementData.propertyTitle || 'Ikke angivet'} />
          <InfoRow label="Kommission" value="15%" highlight />
          <InfoRow label="Binding" value="6 måneder" />
        </CardContent>
      </Card>

      <div className="flex items-center gap-2 justify-center text-muted-foreground/60 text-xs mb-6">
        <Lock className="w-3 h-3" />
        <span>Krypteret og sikker digital signering</span>
      </div>
    </div>
  );

  // ─── Step 2: Summary ──────────────────────────────────────

  const StepSummary = () => (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="font-display text-2xl font-bold text-foreground mb-2">Aftalen kort fortalt</h2>
        <p className="text-muted-foreground text-sm">Her er det vigtigste — i klart og tydeligt sprog</p>
      </div>

      <div className="space-y-3">
        {LEGAL_SECTIONS.map((s, i) => (
          <motion.div key={s.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}>
            <Card className="border-border/30 bg-card/30">
              <CardContent className="p-4 flex items-start gap-3">
                <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-primary text-[10px] font-bold">{i + 1}</span>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground text-sm">{s.title}</h3>
                  <p className="text-muted-foreground text-xs mt-1">{s.summary}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );

  // ─── Step 3: Full legal ───────────────────────────────────

  const StepFull = () => (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="font-display text-2xl font-bold text-foreground mb-2">Fuld aftale</h2>
        <p className="text-muted-foreground text-sm">Tryk på en sektion for at læse de fulde vilkår</p>
      </div>

      <div className="space-y-2">
        {LEGAL_SECTIONS.map((s) => {
          const isOpen = expandedSections.includes(s.id);
          return (
            <Card key={s.id} className="border-border/30 bg-card/30 overflow-hidden">
              <button
                onClick={() => toggleSection(s.id)}
                className="w-full p-4 flex items-center justify-between text-left"
              >
                <div>
                  <h3 className="font-semibold text-foreground text-sm">{s.title}</h3>
                  {!isOpen && <p className="text-muted-foreground text-xs mt-0.5">{s.summary}</p>}
                </div>
                {isOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />}
              </button>
              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="px-4 pb-4 border-t border-border/20 pt-3">
                      <pre className="text-foreground/70 text-xs leading-relaxed whitespace-pre-wrap font-body">
                        {s.full}
                      </pre>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          );
        })}
      </div>
    </div>
  );

  // ─── Step 4: Confirm ──────────────────────────────────────

  const StepConfirm = () => (
    <div className="max-w-xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="font-display text-2xl font-bold text-foreground mb-2">Bekræft vilkårene</h2>
        <p className="text-muted-foreground text-sm">Accepter de relevante punkter for at gå videre</p>
      </div>

      <Card className="border-border/30 bg-card/30">
        <CardContent className="p-5 space-y-4">
          {/* Summary box */}
          <div className="p-4 rounded-xl bg-muted/20 border border-border/20 space-y-1.5 mb-2">
            <InfoRow label="Ejer" value={agreementData.ownerName} />
            <InfoRow label="Bolig" value={agreementData.propertyTitle || `Bolig i ${agreementData.propertyRegion}`} />
            <InfoRow label="Kommission" value="15%" highlight />
            <InfoRow label="Binding" value="6 måneder" />
            <InfoRow label="Version" value={`v${AGREEMENT_VERSION}`} />
          </div>

          <div className="space-y-3 pt-2">
            <label className="flex items-start gap-3 p-3 rounded-xl bg-primary/5 border border-primary/15 cursor-pointer">
              <Checkbox checked={consent.acceptAgreement}
                onCheckedChange={(c) => setConsent(p => ({ ...p, acceptAgreement: c === true }))} className="mt-0.5" />
              <span className="text-sm text-foreground/80 leading-relaxed">
                Jeg accepterer formidlingsaftalen med SommerVibes, herunder 15% kommission og 6 måneders binding. *
              </span>
            </label>
            <label className="flex items-start gap-3 cursor-pointer">
              <Checkbox checked={consent.acceptTerms}
                onCheckedChange={(c) => setConsent(p => ({ ...p, acceptTerms: c === true }))} className="mt-0.5" />
              <span className="text-sm text-muted-foreground leading-relaxed">
                Jeg accepterer <span className="text-primary underline" onClick={e => { e.preventDefault(); window.open('/terms', '_blank'); }}>handelsbetingelserne</span>. *
              </span>
            </label>
            <label className="flex items-start gap-3 cursor-pointer">
              <Checkbox checked={consent.acceptPrivacy}
                onCheckedChange={(c) => setConsent(p => ({ ...p, acceptPrivacy: c === true }))} className="mt-0.5" />
              <span className="text-sm text-muted-foreground leading-relaxed">
                Jeg har læst og forstået <span className="text-primary underline" onClick={e => { e.preventDefault(); window.open('/privacy', '_blank'); }}>privatlivspolitikken</span>. *
              </span>
            </label>
            <label className="flex items-start gap-3 cursor-pointer">
              <Checkbox checked={consent.acceptMarketing}
                onCheckedChange={(c) => setConsent(p => ({ ...p, acceptMarketing: c === true }))} className="mt-0.5" />
              <span className="text-sm text-muted-foreground leading-relaxed">
                Ja tak, jeg vil gerne modtage nyheder og tips om udlejning (valgfrit)
              </span>
            </label>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // ─── Step 5: Sign ─────────────────────────────────────────

  const StepSign = () => (
    <div className="max-w-md mx-auto">
      <div className="text-center mb-8">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <PenLine className="w-7 h-7 text-primary" />
        </div>
        <h2 className="font-display text-2xl font-bold text-foreground mb-2">Signer aftalen</h2>
        <p className="text-muted-foreground text-sm">Skriv dit fulde navn som digital underskrift</p>
      </div>

      <Card className="border-border/30 bg-card/30">
        <CardContent className="p-5 space-y-5">
          <div>
            <Label className="text-foreground font-medium text-sm">Din underskrift *</Label>
            <Input
              placeholder="Skriv dit fulde navn"
              value={signatureName}
              onChange={e => setSignatureName(e.target.value)}
              className="mt-1.5 bg-background/50 font-display italic text-xl h-14 text-center"
            />
          </div>

          <div className="text-center text-muted-foreground/50 text-xs">
            <p>Dato: {new Date().toLocaleDateString('da-DK', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            <p className="mt-1">Aftaleversion: v{AGREEMENT_VERSION}</p>
          </div>

          {signatureName.trim().length > 2 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="p-4 rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 text-center">
              <p className="font-display italic text-2xl text-primary">{signatureName}</p>
              <p className="text-xs text-muted-foreground mt-1">Digital underskrift</p>
            </motion.div>
          )}

          <div className="flex items-center gap-2 justify-center text-muted-foreground/50 text-xs pt-2">
            <Lock className="w-3 h-3" />
            <span>Krypteret og sikker</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // ─── Step 6: Done ─────────────────────────────────────────

  const StepDone = () => {
    const agreement = existingAgreement;
    const signedDate = agreement?.signed_at
      ? new Date(agreement.signed_at).toLocaleDateString('da-DK', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
      : new Date().toLocaleDateString('da-DK', { day: 'numeric', month: 'long', year: 'numeric' });

    const nextSteps = [
      { icon: Phone, title: 'Vi kontakter dig', desc: 'Inden for 24 timer ringer vi og planlægger det næste', time: '1-2 dage' },
      { icon: Home, title: 'Ejendomsgennemgang', desc: 'Vi kommer forbi og gennemgår det praktiske', time: '3-7 dage' },
      { icon: Globe, title: 'Din bolig går online', desc: 'Vi opretter og optimerer dine annoncer', time: '1-2 uger' },
      { icon: Calendar, title: 'Første bookinger', desc: 'Gæster finder dit hus — vi håndterer alt', time: '2-4 uger' },
    ];

    return (
      <div className="max-w-2xl mx-auto text-center">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
          <div className="w-20 h-20 rounded-full bg-accent/10 border-2 border-accent/30 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-accent" />
          </div>
          <h2 className="font-display text-3xl font-bold text-foreground mb-2">Aftalen er signeret</h2>
          <p className="text-muted-foreground mb-6">Tak — vi glæder os til samarbejdet!</p>
        </motion.div>

        {/* Signed document card */}
        <Card className="border-border/30 bg-card/30 text-left mb-8">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FileSignature className="w-4 h-4 text-primary" />
                <span className="font-semibold text-foreground text-sm">Formidlingsaftale</span>
              </div>
              <span className="text-[10px] px-2.5 py-1 rounded-full bg-accent/10 text-accent font-semibold uppercase tracking-wider">Signeret</span>
            </div>
            <div className="space-y-1.5">
              <InfoRow label="Version" value={`v${agreement?.version || AGREEMENT_VERSION}`} />
              <InfoRow label="Signeret af" value={agreement?.signature_name || signatureName} />
              <InfoRow label="Dato" value={signedDate} />
              <InfoRow label="Kommission" value={`${agreement?.commission_percent || 15}%`} highlight />
              <InfoRow label="Binding" value={`${agreement?.binding_months || 6} måneder`} />
            </div>
            <div className="border-t border-border/20 mt-4 pt-4 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-muted-foreground/50 text-xs">
                <Lock className="w-3 h-3" />
                <span>Arkiveret kopi</span>
              </div>
              <Button variant="outline" size="sm" className="text-xs gap-1.5 h-8" disabled>
                <Download className="w-3 h-3" /> PDF (kommer snart)
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Next steps */}
        <div className="text-left mb-8">
          <h3 className="font-display text-lg font-semibold text-foreground mb-5 text-center">Hvad sker der nu?</h3>
          <div className="space-y-0">
            {nextSteps.map((s, i) => {
              const Icon = s.icon;
              return (
                <motion.div key={i} initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }} className="flex gap-4 relative">
                  {i < nextSteps.length - 1 && <div className="absolute left-5 top-12 bottom-0 w-px bg-border/30" />}
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 z-10">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="pb-6">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h4 className="font-semibold text-foreground text-sm">{s.title}</h4>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">{s.time}</span>
                    </div>
                    <p className="text-muted-foreground text-sm">{s.desc}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button variant="gold" size="lg" className="gap-2" onClick={() => navigate('/owner')}>
            Gå til ejerdashboard <ArrowRight className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="lg" className="border-border gap-2 text-muted-foreground" onClick={() => navigate('/contact')}>
            <Phone className="w-4 h-4" /> Kontakt os
          </Button>
        </div>
      </div>
    );
  };

  // ─── Render ───────────────────────────────────────────────

  const steps = [StepIntro, StepSummary, StepFull, StepConfirm, StepSign, StepDone];
  const CurrentStep = steps[step - 1];

  const canNextStep = () => {
    if (step === 4) return consent.acceptAgreement && consent.acceptTerms && consent.acceptPrivacy;
    if (step === 5) return canSign;
    return true;
  };

  const handleNext = () => {
    if (step === 5) handleSign();
    else if (step < 6) setStep(s => s + 1);
  };

  return (
    <OwnerLayout>
      <div className="max-w-4xl mx-auto">
        {step < 6 && <StepBar />}
        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.25 }}>
            <CurrentStep />
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        {step < 6 && (
          <div className="flex items-center justify-between mt-8 max-w-2xl mx-auto">
            <Button variant="outline" onClick={() => setStep(s => s - 1)} disabled={step === 1}
              className="gap-2 h-11 px-5 border-border/50">
              <ArrowLeft className="h-4 w-4" /> Tilbage
            </Button>
            <span className="text-xs text-muted-foreground/50">Trin {step} af 5</span>
            <Button variant="gold" onClick={handleNext} disabled={!canNextStep() || isSubmitting}
              className="gap-2 h-11 px-7">
              {step === 5 ? (isSubmitting ? 'Signerer...' : 'Signer aftalen') : 'Næste'}
              {step < 5 && <ArrowRight className="h-4 w-4" />}
            </Button>
          </div>
        )}
      </div>
    </OwnerLayout>
  );
}
