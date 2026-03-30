import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import {
  ArrowRight, ArrowLeft, Check, Home, MapPin, Users, Bed, Bath,
  Shield, FileSignature, Mail, Phone, Lock, Sparkles, Camera,
  Globe, MessageCircle, Wallet, Star, CheckCircle2, X
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Data ────────────────────────────────────────────────────

interface OnboardingData {
  title: string;
  address: string;
  region: string;
  capacity: number;
  bedrooms: number;
  bathrooms: number;
  name: string;
  email: string;
  phone: string;
  password: string;
  acceptTerms: boolean;
  acceptAgreement: boolean;
}

const REGIONS = [
  'Nordjylland', 'Midtjylland', 'Syddanmark',
  'Sjælland', 'Hovedstaden', 'Bornholm',
];

const STEPS = [
  { label: 'Dit hus', icon: Home },
  { label: 'Service', icon: Sparkles },
  { label: 'Aftale', icon: FileSignature },
  { label: 'Konto', icon: Lock },
  { label: 'Klar', icon: CheckCircle2 },
];

const SERVICE_HIGHLIGHTS = [
  { icon: Globe, title: 'Eksponering på alle portaler', desc: 'Airbnb, Booking.com, VRBO og vores egne kanaler' },
  { icon: Camera, title: 'Professionelt indhold', desc: 'Vi vejleder og sørger for billeder der skaber bookinger' },
  { icon: MessageCircle, title: 'Fuld gæstekommunikation', desc: '24/7 dialog med gæster — du slipper for alt besværet' },
  { icon: Shield, title: 'Rengøring & kvalitetssikring', desc: 'Koordineret slutrengøring og løbende kvalitetskontrol' },
  { icon: Wallet, title: 'Gennemsigtige udbetalinger', desc: 'Månedlige udbetalinger direkte til din konto' },
  { icon: Star, title: 'Skatteoptimering', desc: 'Adgang til det fulde bundfradrag på 50.200 kr.' },
];

const AGREEMENT_POINTS = [
  'SommerVibes formidler udlejning af dit sommerhus på dine vegne',
  'Kommission: 15% af gennemførte bookinger (gæst betaler 5% servicegebyr)',
  'Bindingsperiode: 6 måneder — herefter opsigelse med 30 dages varsel',
  'Du bestemmer selv hvornår dit hus er tilgængeligt via ejerportalen',
  'SommerVibes koordinerer gæstekontakt, rengøring og markedsføring',
  'Du modtager månedlige udbetalinger med fuld gennemsigtighed',
  'Vi håndterer forsikring ved pludselige og uforudsete skader',
  'Du kan til enhver tid blokere datoer til eget brug',
];

// ─── Component ───────────────────────────────────────────────

export default function GetStarted() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [data, setData] = useState<OnboardingData>({
    title: '', address: '', region: '', capacity: 4, bedrooms: 2, bathrooms: 1,
    name: '', email: '', phone: '', password: '',
    acceptTerms: false, acceptAgreement: false,
  });

  const update = useCallback((u: Partial<OnboardingData>) => setData(p => ({ ...p, ...u })), []);

  const canNext = (): boolean => {
    switch (step) {
      case 1: return !!(data.title.trim() && data.address.trim() && data.region);
      case 2: return true;
      case 3: return data.acceptAgreement;
      case 4: return user ? true : !!(data.name.trim() && data.email.trim() && data.password.length >= 6 && data.acceptTerms);
      default: return false;
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      let userId = user?.id;

      if (!user) {
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: data.email,
          password: data.password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: { full_name: data.name },
          },
        });
        if (authError) throw authError;
        userId = authData.user?.id;
      }

      if (userId) {
        const { error } = await supabase.from('properties').insert({
          owner_id: userId,
          title: data.title,
          address: data.address,
          region: data.region,
          capacity: data.capacity,
          bedrooms: data.bedrooms,
          bathrooms: data.bathrooms,
          status: 'draft',
        });
        if (error) throw error;
      }

      setStep(5);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Der opstod en fejl');
    } finally {
      setIsSubmitting(false);
    }
  };

  const next = () => {
    if (step === 4) {
      handleSubmit();
    } else if (step < 5) {
      setStep(s => s + 1);
    }
  };

  // ─── Step Indicator ──────────────────────────────────────

  const StepIndicator = () => (
    <div className="flex items-center justify-center gap-0 mb-10 md:mb-14">
      {STEPS.map((s, i) => {
        const Icon = s.icon;
        const idx = i + 1;
        const done = idx < step;
        const active = idx === step;
        return (
          <div key={i} className="flex items-center">
            <div className="flex flex-col items-center">
              <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-all ${
                done ? 'bg-primary text-primary-foreground' :
                active ? 'bg-primary text-primary-foreground ring-4 ring-primary/20' :
                'bg-muted/50 text-muted-foreground'
              }`}>
                {done ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4 md:w-5 md:h-5" />}
              </div>
              <span className={`text-[10px] md:text-xs mt-2 font-medium ${
                active ? 'text-primary' : done ? 'text-primary/70' : 'text-muted-foreground/60'
              }`}>{s.label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`w-8 md:w-16 lg:w-24 h-px mx-1.5 md:mx-3 ${done ? 'bg-primary/50' : 'bg-border/50'}`} />
            )}
          </div>
        );
      })}
    </div>
  );

  // ─── Step 1: Property Info ───────────────────────────────

  const Step1 = () => (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-10">
        <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-3">Fortæl os om dit sommerhus</h2>
        <p className="text-muted-foreground">Det tager kun 2 minutter — du kan altid tilføje mere senere</p>
      </div>

      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardContent className="p-6 md:p-8 space-y-6">
          <div>
            <Label htmlFor="title" className="text-foreground font-medium">Navn på dit sommerhus *</Label>
            <Input
              id="title"
              placeholder="F.eks. Hyggeligt sommerhus ved Kvie Sø"
              value={data.title}
              onChange={e => update({ title: e.target.value })}
              className="mt-2 bg-background/50"
            />
          </div>

          <div>
            <Label htmlFor="address" className="text-foreground font-medium">Adresse *</Label>
            <Input
              id="address"
              placeholder="Søvej 28, 6800 Varde"
              value={data.address}
              onChange={e => update({ address: e.target.value })}
              className="mt-2 bg-background/50"
            />
          </div>

          <div>
            <Label className="text-foreground font-medium">Region *</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
              {REGIONS.map(r => (
                <button
                  key={r}
                  type="button"
                  onClick={() => update({ region: r })}
                  className={`p-3 rounded-xl border text-left text-sm transition-all ${
                    data.region === r
                      ? 'border-primary bg-primary/10 text-primary font-medium'
                      : 'border-border/50 hover:border-primary/30 text-muted-foreground'
                  }`}
                >
                  <MapPin className="w-3.5 h-3.5 inline mr-1.5 opacity-60" />{r}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label className="text-foreground font-medium flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-muted-foreground" /> Gæster
              </Label>
              <Input type="number" min={1} max={20} value={data.capacity}
                onChange={e => update({ capacity: parseInt(e.target.value) || 1 })}
                className="mt-2 bg-background/50" />
            </div>
            <div>
              <Label className="text-foreground font-medium flex items-center gap-1.5">
                <Bed className="w-3.5 h-3.5 text-muted-foreground" /> Soveværelser
              </Label>
              <Input type="number" min={1} max={10} value={data.bedrooms}
                onChange={e => update({ bedrooms: parseInt(e.target.value) || 1 })}
                className="mt-2 bg-background/50" />
            </div>
            <div>
              <Label className="text-foreground font-medium flex items-center gap-1.5">
                <Bath className="w-3.5 h-3.5 text-muted-foreground" /> Badeværelser
              </Label>
              <Input type="number" min={1} max={5} value={data.bathrooms}
                onChange={e => update({ bathrooms: parseInt(e.target.value) || 1 })}
                className="mt-2 bg-background/50" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // ─── Step 2: Service Overview ────────────────────────────

  const Step2 = () => (
    <div className="max-w-3xl mx-auto">
      <div className="text-center mb-10">
        <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-3">
          Det her får du med <span className="text-primary italic font-normal">SommerVibes</span>
        </h2>
        <p className="text-muted-foreground">Alt du behøver for en succesfuld udlejning — samlet ét sted</p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {SERVICE_HIGHLIGHTS.map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="flex items-start gap-4 p-5 rounded-2xl border border-border/40 bg-card/30 backdrop-blur-sm"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground text-sm mb-1">{s.title}</h3>
                <p className="text-muted-foreground text-xs leading-relaxed">{s.desc}</p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Pricing summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="mt-8 p-6 rounded-2xl bg-primary/5 border border-primary/15 text-center"
      >
        <div className="flex items-baseline justify-center gap-2 mb-2">
          <span className="font-display text-5xl font-bold text-primary">15%</span>
          <span className="text-muted-foreground text-sm">kommission</span>
        </div>
        <p className="text-muted-foreground text-sm">Ingen oprettelsesgebyr · Ingen skjulte gebyrer · Du betaler kun ved bookinger</p>
      </motion.div>
    </div>
  );

  // ─── Step 3: Agreement ───────────────────────────────────

  const Step3 = () => (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-10">
        <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-3">Formidlingsaftale</h2>
        <p className="text-muted-foreground">Gennemse og godkend betingelserne for vores samarbejde</p>
      </div>

      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardContent className="p-6 md:p-8">
          {/* Agreement document */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-6">
              <FileSignature className="w-5 h-5 text-primary" />
              <h3 className="font-display text-lg font-semibold text-foreground">Aftalens hovedpunkter</h3>
            </div>

            <div className="space-y-4">
              {AGREEMENT_POINTS.map((point, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.06 }}
                  className="flex items-start gap-3"
                >
                  <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-3 h-3 text-primary" />
                  </div>
                  <p className="text-foreground/80 text-sm leading-relaxed">{point}</p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Signature area */}
          <div className="border-t border-border/40 pt-6">
            <div className="flex items-start gap-3 p-4 rounded-xl bg-primary/5 border border-primary/15">
              <Checkbox
                id="agreement"
                checked={data.acceptAgreement}
                onCheckedChange={(checked) => update({ acceptAgreement: checked === true })}
                className="mt-0.5"
              />
              <label htmlFor="agreement" className="text-sm text-foreground/80 leading-relaxed cursor-pointer">
                Jeg har læst og accepterer formidlingsaftalen med SommerVibes. Jeg forstår at aftalen har en bindingsperiode på 6 måneder, og at SommerVibes tager 15% kommission af gennemførte bookinger.
              </label>
            </div>

            {data.acceptAgreement && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-4 p-4 rounded-xl bg-accent/5 border border-accent/15 text-center"
              >
                <p className="text-accent text-sm font-medium">
                  ✓ Aftale godkendt — {data.title ? `for "${data.title}"` : 'for dit sommerhus'}
                </p>
              </motion.div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // ─── Step 4: Account ─────────────────────────────────────

  const Step4 = () => (
    <div className="max-w-lg mx-auto">
      <div className="text-center mb-10">
        <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-3">
          {user ? 'Bekræft oprettelse' : 'Opret din konto'}
        </h2>
        <p className="text-muted-foreground">
          {user ? 'Alt er klar — opret dit sommerhus nu' : 'Sidste skridt — så er du i gang'}
        </p>
      </div>

      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardContent className="p-6 md:p-8 space-y-5">
          {user ? (
            <div className="text-center py-6">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-primary" />
              </div>
              <p className="text-foreground font-medium mb-1">Logget ind som</p>
              <p className="text-muted-foreground text-sm">{user.email}</p>
            </div>
          ) : (
            <>
              <div>
                <Label htmlFor="name" className="text-foreground font-medium flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-muted-foreground" /> Fulde navn *
                </Label>
                <Input id="name" placeholder="Dit fulde navn" value={data.name}
                  onChange={e => update({ name: e.target.value })} className="mt-2 bg-background/50" />
              </div>
              <div>
                <Label htmlFor="email" className="text-foreground font-medium flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-muted-foreground" /> Email *
                </Label>
                <Input id="email" type="email" placeholder="din@email.dk" value={data.email}
                  onChange={e => update({ email: e.target.value })} className="mt-2 bg-background/50" />
              </div>
              <div>
                <Label htmlFor="phone" className="text-foreground font-medium flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-muted-foreground" /> Telefon
                </Label>
                <Input id="phone" type="tel" placeholder="+45 12 34 56 78" value={data.phone}
                  onChange={e => update({ phone: e.target.value })} className="mt-2 bg-background/50" />
              </div>
              <div>
                <Label htmlFor="password" className="text-foreground font-medium flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-muted-foreground" /> Adgangskode *
                </Label>
                <Input id="password" type="password" placeholder="Minimum 6 tegn" value={data.password}
                  onChange={e => update({ password: e.target.value })} className="mt-2 bg-background/50" />
              </div>
              <div className="flex items-start gap-3 pt-2">
                <Checkbox id="terms" checked={data.acceptTerms}
                  onCheckedChange={(c) => update({ acceptTerms: c === true })} className="mt-0.5" />
                <label htmlFor="terms" className="text-sm text-muted-foreground cursor-pointer leading-relaxed">
                  Jeg accepterer SommerVibes' <span className="text-primary underline">handelsbetingelser</span> og <span className="text-primary underline">privatlivspolitik</span>
                </label>
              </div>
            </>
          )}

          {/* Summary */}
          <div className="border-t border-border/40 pt-5 mt-5 space-y-2">
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-3">Opsummering</p>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Sommerhus</span>
              <span className="text-foreground font-medium">{data.title || '—'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Region</span>
              <span className="text-foreground font-medium">{data.region || '—'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Kommission</span>
              <span className="text-primary font-semibold">15%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Binding</span>
              <span className="text-foreground font-medium">6 måneder</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Aftale</span>
              <span className="text-accent font-medium">✓ Godkendt</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // ─── Step 5: Success ─────────────────────────────────────

  const Step5 = () => {
    const nextSteps = [
      { icon: Camera, title: 'Vi kontakter dig', desc: 'Inden for 24 timer ringer vi og aftaler fotografering og gennemgang', time: '1-2 dage' },
      { icon: Globe, title: 'Dit hus går online', desc: 'Vi opretter din annonce på alle de store portaler med optimeret indhold', time: '3-5 dage' },
      { icon: Star, title: 'De første bookinger', desc: 'Gæster finder dit hus og sender forespørgsler — vi håndterer alt', time: '1-3 uger' },
      { icon: Wallet, title: 'Du modtager udbetaling', desc: 'Gennemsigtige månedlige udbetalinger direkte til din konto', time: 'Løbende' },
    ];

    return (
      <div className="max-w-2xl mx-auto text-center">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6 }}>
          <div className="w-20 h-20 rounded-full bg-accent/10 border-2 border-accent/30 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-accent" />
          </div>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-3">
            Velkommen til <span className="text-primary italic">SommerVibes</span>
          </h2>
          <p className="text-muted-foreground text-lg mb-2">Dit sommerhus er oprettet — vi glæder os til samarbejdet!</p>
          {!user && (
            <p className="text-primary text-sm font-medium mb-8">
              Tjek din email for at bekræfte din konto ✉️
            </p>
          )}
        </motion.div>

        {/* What happens next timeline */}
        <div className="text-left mt-10 mb-10">
          <h3 className="font-display text-lg font-semibold text-foreground mb-6 text-center">Hvad sker der nu?</h3>
          <div className="space-y-0">
            {nextSteps.map((s, i) => {
              const Icon = s.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.3 + i * 0.12 }}
                  className="flex gap-4 relative"
                >
                  {/* Vertical line */}
                  {i < nextSteps.length - 1 && (
                    <div className="absolute left-5 top-12 bottom-0 w-px bg-border/50" />
                  )}
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 z-10">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="pb-8">
                    <div className="flex items-center gap-2 mb-1">
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
          <Button variant="gold" size="lg" className="gap-2 group" onClick={() => navigate('/owner')}>
            Gå til ejerportalen <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Button>
          <Button variant="outline" size="lg" className="border-border text-muted-foreground" onClick={() => navigate('/')}>
            Tilbage til forsiden
          </Button>
        </div>
      </div>
    );
  };

  // ─── Render ──────────────────────────────────────────────

  const stepComponents = [Step1, Step2, Step3, Step4, Step5];
  const CurrentStep = stepComponents[step - 1];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <div className="border-b border-border/30 bg-card/50 backdrop-blur-sm px-4 py-4 shrink-0">
        <div className="flex items-center justify-between max-w-5xl mx-auto">
          <button onClick={() => navigate('/')} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-5 w-5" />
            <span className="text-sm font-medium hidden sm:inline">Luk</span>
          </button>
          <span className="font-display text-lg font-bold text-primary">SommerVibes</span>
          <div className="w-16" />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-4 py-8 md:py-12">
          {step < 5 && <StepIndicator />}
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.35 }}
            >
              <CurrentStep />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Bottom nav */}
      {step < 5 && (
        <div className="border-t border-border/30 bg-card/50 backdrop-blur-sm px-4 py-4 shrink-0">
          <div className="flex items-center justify-between max-w-5xl mx-auto">
            <Button variant="outline" size="lg" onClick={() => setStep(s => s - 1)} disabled={step === 1}
              className="gap-2 h-12 px-6 border-border/50">
              <ArrowLeft className="h-4 w-4" /> Tilbage
            </Button>
            <Button variant="gold" size="lg" onClick={next} disabled={!canNext() || isSubmitting}
              className="gap-2 h-12 px-8">
              {step === 4 ? (isSubmitting ? 'Opretter...' : 'Opret mit sommerhus') : 'Næste'}
              {step < 4 && <ArrowRight className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
