import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  ArrowRight, ArrowLeft, Check, Home, MapPin, Users, Bed, Bath,
  Shield, FileSignature, Mail, Phone, Lock, Sparkles, Camera,
  Globe, MessageCircle, Wallet, Star, CheckCircle2, X, User,
  Upload, Link2, Calendar, Key, Brush, Clock, Heart, Zap,
  PenLine, Download, PhoneCall
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Types ───────────────────────────────────────────────────

interface OnboardingData {
  // Step 2: Owner info
  ownerName: string;
  ownerPhone: string;
  ownerEmail: string;
  ownerAddress: string;
  ownerPostalCity: string;
  preferredContact: string;
  // Step 3: Property
  propertyAddress: string;
  region: string;
  propertyType: string;
  capacity: number;
  bedrooms: number;
  facilities: string[];
  hasRentedBefore: string;
  existingLink: string;
  // Step 4: Situation
  helpLevel: string;
  startTime: string;
  hasKeybox: string;
  hasCleaning: string;
  hasExperience: string;
  // Step 6+7
  acceptAgreement: boolean;
  signatureName: string;
  signatureDate: string;
  acceptTerms: boolean;
  acceptPrivacy: boolean;
  acceptMarketing: boolean;
  // Account
  password: string;
}

const REGIONS = [
  'Nordjylland', 'Midtjylland', 'Syddanmark',
  'Sjælland', 'Hovedstaden', 'Bornholm',
];

const PROPERTY_TYPES = [
  'Sommerhus', 'Feriehus', 'Lejlighed', 'Villa', 'Poolhus', 'Luksushus',
];

const FACILITIES = [
  'Pool', 'Spa / Jacuzzi', 'Sauna', 'Havudsigt', 'Pejs / Brændeovn',
  'Aktivitetsrum', 'Stor have', 'Grill / Udekøkken', 'Carport / Garage', 'Husdyr tilladt',
];

const STEPS = [
  { label: 'Velkommen', icon: Heart },
  { label: 'Dine oplysninger', icon: User },
  { label: 'Dit sommerhus', icon: Home },
  { label: 'Din situation', icon: Zap },
  { label: 'Fordele', icon: Sparkles },
  { label: 'Aftale', icon: FileSignature },
  { label: 'Signering', icon: PenLine },
  { label: 'Klar', icon: CheckCircle2 },
];

// ─── Component ───────────────────────────────────────────────

export default function GetStarted() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [data, setData] = useState<OnboardingData>({
    ownerName: '', ownerPhone: '', ownerEmail: '', ownerAddress: '', ownerPostalCity: '', preferredContact: 'email',
    propertyAddress: '', region: '', propertyType: '', capacity: 6, bedrooms: 3, facilities: [],
    hasRentedBefore: '', existingLink: '',
    helpLevel: '', startTime: '', hasKeybox: '', hasCleaning: '', hasExperience: '',
    acceptAgreement: false, signatureName: '', signatureDate: new Date().toISOString().split('T')[0],
    acceptTerms: false, acceptPrivacy: false, acceptMarketing: false,
    password: '',
  });

  const update = useCallback((u: Partial<OnboardingData>) => setData(p => ({ ...p, ...u })), []);

  const toggleFacility = (f: string) => {
    setData(p => ({
      ...p,
      facilities: p.facilities.includes(f) ? p.facilities.filter(x => x !== f) : [...p.facilities, f],
    }));
  };

  const canNext = (): boolean => {
    switch (step) {
      case 1: return true;
      case 2: return !!(data.ownerName.trim() && data.ownerEmail.trim());
      case 3: return !!(data.propertyAddress.trim() && data.region && data.propertyType);
      case 4: return !!(data.helpLevel);
      case 5: return true;
      case 6: return true;
      case 7: return data.acceptAgreement && data.acceptTerms && data.acceptPrivacy && data.signatureName.trim().length > 2;
      default: return false;
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      let userId = user?.id;

      if (!user) {
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: data.ownerEmail,
          password: data.password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: { full_name: data.ownerName },
          },
        });
        if (authError) throw authError;
        userId = authData.user?.id;
      }

      if (userId) {
        // Update profile with phone
        await supabase.from('profiles').update({
          phone: data.ownerPhone,
          full_name: data.ownerName,
        }).eq('id', userId);

        // Create property
        const { error } = await supabase.from('properties').insert({
          owner_id: userId,
          title: `${data.propertyType} i ${data.region}`,
          address: data.propertyAddress,
          region: data.region,
          capacity: data.capacity,
          bedrooms: data.bedrooms,
          amenities: data.facilities,
          status: 'draft',
        });
        if (error) throw error;
      }

      setStep(8);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Der opstod en fejl');
    } finally {
      setIsSubmitting(false);
    }
  };

  const next = () => {
    if (step === 7) {
      if (!user && data.password.length < 6) {
        toast.error('Indtast en adgangskode (min. 6 tegn) for at oprette din konto');
        return;
      }
      handleSubmit();
    } else if (step < 8) {
      setStep(s => s + 1);
    }
  };

  // ─── Step Indicator ──────────────────────────────────────

  const StepIndicator = () => (
    <div className="flex items-center justify-center gap-0 mb-8 md:mb-12 overflow-x-auto px-2">
      {STEPS.map((s, i) => {
        const idx = i + 1;
        const done = idx < step;
        const active = idx === step;
        return (
          <div key={i} className="flex items-center shrink-0">
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-xs transition-all ${
                done ? 'bg-primary text-primary-foreground' :
                active ? 'bg-primary text-primary-foreground ring-4 ring-primary/20' :
                'bg-muted/40 text-muted-foreground/50'
              }`}>
                {done ? <Check className="w-3.5 h-3.5" /> : <span className="font-semibold">{idx}</span>}
              </div>
              <span className={`text-[9px] md:text-[10px] mt-1.5 font-medium whitespace-nowrap ${
                active ? 'text-primary' : done ? 'text-primary/60' : 'text-muted-foreground/40'
              }`}>{s.label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`w-4 md:w-8 lg:w-12 h-px mx-1 md:mx-2 ${done ? 'bg-primary/40' : 'bg-border/30'}`} />
            )}
          </div>
        );
      })}
    </div>
  );

  // ─── Step 1: Welcome ────────────────────────────────────

  const Step1 = () => (
    <div className="max-w-xl mx-auto text-center">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-8">
          <Heart className="w-8 h-8 text-primary" />
        </div>
        <h2 className="font-display text-3xl md:text-5xl font-bold text-foreground mb-4">
          Velkommen til <span className="text-primary italic">SommerVibes</span>
        </h2>
        <p className="text-muted-foreground text-lg leading-relaxed mb-8 max-w-md mx-auto">
          Du er kun få minutter fra at komme i gang med professionel udlejning af dit sommerhus.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          {[
            { icon: Clock, text: 'Tager kun 5 min' },
            { icon: Shield, text: 'Ingen forpligtelse endnu' },
            { icon: Star, text: 'Gratis oprettelse' },
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.1 }}
              className="flex items-center gap-2.5 p-3 rounded-xl bg-card/50 border border-border/30"
            >
              <item.icon className="w-4 h-4 text-primary shrink-0" />
              <span className="text-sm text-foreground/80">{item.text}</span>
            </motion.div>
          ))}
        </div>

        <p className="text-muted-foreground/60 text-xs">
          Vi guider dig igennem — skridt for skridt
        </p>
      </motion.div>
    </div>
  );

  // ─── Step 2: Owner Info ─────────────────────────────────

  const Step2 = () => (
    <div className="max-w-xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-2">Dine oplysninger</h2>
        <p className="text-muted-foreground text-sm">Så vi kan kontakte dig om dit sommerhus</p>
      </div>

      <Card className="border-border/40 bg-card/40 backdrop-blur-sm">
        <CardContent className="p-5 md:p-7 space-y-5">
          <div>
            <Label className="text-foreground font-medium text-sm">Fulde navn *</Label>
            <Input placeholder="Anders Jensen" value={data.ownerName}
              onChange={e => update({ ownerName: e.target.value })} className="mt-1.5 bg-background/50" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-foreground font-medium text-sm">Telefon</Label>
              <Input type="tel" placeholder="+45 12 34 56 78" value={data.ownerPhone}
                onChange={e => update({ ownerPhone: e.target.value })} className="mt-1.5 bg-background/50" />
            </div>
            <div>
              <Label className="text-foreground font-medium text-sm">E-mail *</Label>
              <Input type="email" placeholder="din@email.dk" value={data.ownerEmail}
                onChange={e => update({ ownerEmail: e.target.value })} className="mt-1.5 bg-background/50" />
            </div>
          </div>
          <div>
            <Label className="text-foreground font-medium text-sm">Adresse</Label>
            <Input placeholder="Din privatadresse" value={data.ownerAddress}
              onChange={e => update({ ownerAddress: e.target.value })} className="mt-1.5 bg-background/50" />
          </div>
          <div>
            <Label className="text-foreground font-medium text-sm">Postnr. / By</Label>
            <Input placeholder="8000 Aarhus" value={data.ownerPostalCity}
              onChange={e => update({ ownerPostalCity: e.target.value })} className="mt-1.5 bg-background/50" />
          </div>
          <div>
            <Label className="text-foreground font-medium text-sm mb-2 block">Foretrukken kontaktmetode</Label>
            <RadioGroup value={data.preferredContact} onValueChange={v => update({ preferredContact: v })} className="flex gap-4">
              {[
                { value: 'email', label: 'E-mail', icon: Mail },
                { value: 'phone', label: 'Telefon', icon: Phone },
              ].map(o => (
                <label key={o.value} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border cursor-pointer transition-all text-sm ${
                  data.preferredContact === o.value ? 'border-primary bg-primary/10 text-primary' : 'border-border/40 text-muted-foreground hover:border-primary/30'
                }`}>
                  <RadioGroupItem value={o.value} className="sr-only" />
                  <o.icon className="w-3.5 h-3.5" />
                  {o.label}
                </label>
              ))}
            </RadioGroup>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // ─── Step 3: Property Info ──────────────────────────────

  const Step3 = () => (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-2">Dit sommerhus</h2>
        <p className="text-muted-foreground text-sm">Fortæl os lidt om din bolig — du kan altid tilføje mere senere</p>
      </div>

      <Card className="border-border/40 bg-card/40 backdrop-blur-sm">
        <CardContent className="p-5 md:p-7 space-y-5">
          <div>
            <Label className="text-foreground font-medium text-sm">Adresse på boligen *</Label>
            <Input placeholder="Strandvejen 42, 6800 Varde" value={data.propertyAddress}
              onChange={e => update({ propertyAddress: e.target.value })} className="mt-1.5 bg-background/50" />
          </div>

          <div>
            <Label className="text-foreground font-medium text-sm">Område / Region *</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
              {REGIONS.map(r => (
                <button key={r} type="button" onClick={() => update({ region: r })}
                  className={`p-2.5 rounded-xl border text-left text-sm transition-all ${
                    data.region === r ? 'border-primary bg-primary/10 text-primary font-medium' : 'border-border/40 hover:border-primary/30 text-muted-foreground'
                  }`}>
                  <MapPin className="w-3 h-3 inline mr-1 opacity-60" />{r}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-foreground font-medium text-sm">Type bolig *</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
              {PROPERTY_TYPES.map(t => (
                <button key={t} type="button" onClick={() => update({ propertyType: t })}
                  className={`p-2.5 rounded-xl border text-sm transition-all ${
                    data.propertyType === t ? 'border-primary bg-primary/10 text-primary font-medium' : 'border-border/40 hover:border-primary/30 text-muted-foreground'
                  }`}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-foreground font-medium text-sm flex items-center gap-1.5">
                <Users className="w-3 h-3 text-muted-foreground" /> Antal sovepladser
              </Label>
              <Input type="number" min={1} max={20} value={data.capacity}
                onChange={e => update({ capacity: parseInt(e.target.value) || 1 })} className="mt-1.5 bg-background/50" />
            </div>
            <div>
              <Label className="text-foreground font-medium text-sm flex items-center gap-1.5">
                <Bed className="w-3 h-3 text-muted-foreground" /> Antal værelser
              </Label>
              <Input type="number" min={1} max={10} value={data.bedrooms}
                onChange={e => update({ bedrooms: parseInt(e.target.value) || 1 })} className="mt-1.5 bg-background/50" />
            </div>
          </div>

          <div>
            <Label className="text-foreground font-medium text-sm">Særlige faciliteter</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {FACILITIES.map(f => (
                <button key={f} type="button" onClick={() => toggleFacility(f)}
                  className={`flex items-center gap-2 p-2.5 rounded-xl border text-sm transition-all text-left ${
                    data.facilities.includes(f) ? 'border-primary bg-primary/10 text-primary' : 'border-border/30 text-muted-foreground hover:border-primary/20'
                  }`}>
                  <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                    data.facilities.includes(f) ? 'bg-primary border-primary' : 'border-border'
                  }`}>
                    {data.facilities.includes(f) && <Check className="w-2.5 h-2.5 text-primary-foreground" />}
                  </div>
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-foreground font-medium text-sm">Har du udlejet før?</Label>
            <RadioGroup value={data.hasRentedBefore} onValueChange={v => update({ hasRentedBefore: v })} className="flex gap-3 mt-2">
              {['Ja', 'Nej', 'Lidt'].map(o => (
                <label key={o} className={`px-4 py-2 rounded-xl border cursor-pointer transition-all text-sm ${
                  data.hasRentedBefore === o ? 'border-primary bg-primary/10 text-primary' : 'border-border/40 text-muted-foreground'
                }`}>
                  <RadioGroupItem value={o} className="sr-only" />
                  {o}
                </label>
              ))}
            </RadioGroup>
          </div>

          <div>
            <Label className="text-foreground font-medium text-sm">Link til eksisterende annonce (valgfrit)</Label>
            <div className="relative mt-1.5">
              <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="https://airbnb.com/rooms/..." value={data.existingLink}
                onChange={e => update({ existingLink: e.target.value })} className="pl-9 bg-background/50" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // ─── Step 4: Situation ──────────────────────────────────

  const RadioCards = ({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { value: string; label: string; desc?: string }[] }) => (
    <div className="space-y-2 mt-2">
      {options.map(o => (
        <button key={o.value} type="button" onClick={() => onChange(o.value)}
          className={`w-full text-left p-3.5 rounded-xl border transition-all ${
            value === o.value ? 'border-primary bg-primary/10' : 'border-border/30 hover:border-primary/20'
          }`}>
          <span className={`text-sm font-medium ${value === o.value ? 'text-primary' : 'text-foreground/80'}`}>{o.label}</span>
          {o.desc && <p className="text-xs text-muted-foreground mt-0.5">{o.desc}</p>}
        </button>
      ))}
    </div>
  );

  const Step4 = () => (
    <div className="max-w-xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-2">Din situation</h2>
        <p className="text-muted-foreground text-sm">Så vi kan tilpasse vores service til dig</p>
      </div>

      <Card className="border-border/40 bg-card/40 backdrop-blur-sm">
        <CardContent className="p-5 md:p-7 space-y-6">
          <div>
            <Label className="text-foreground font-medium text-sm">Hvor meget hjælp ønsker du? *</Label>
            <RadioCards value={data.helpLevel} onChange={v => update({ helpLevel: v })} options={[
              { value: 'full', label: 'Fuld hjælp — I klarer alt', desc: 'SommerVibes håndterer gæster, nøgler, rengøring og markedsføring' },
              { value: 'partial', label: 'Delvis hjælp — Jeg vil selv stå for noget', desc: 'F.eks. nøgleoverdragelse eller rengøring selv' },
              { value: 'unsure', label: 'Ikke sikker endnu — Lad os tale om det', desc: 'Vi ringer og finder den bedste løsning' },
            ]} />
          </div>

          <div>
            <Label className="text-foreground font-medium text-sm">Hvornår ønsker du at komme i gang?</Label>
            <RadioCards value={data.startTime} onChange={v => update({ startTime: v })} options={[
              { value: 'asap', label: 'Hurtigst muligt' },
              { value: '1-2months', label: 'Inden for 1-2 måneder' },
              { value: 'next-season', label: 'Til næste sæson' },
              { value: 'exploring', label: 'Undersøger stadig mine muligheder' },
            ]} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <Label className="text-foreground font-medium text-sm flex items-center gap-1.5">
                <Key className="w-3 h-3 text-muted-foreground" /> Nøgleboks?
              </Label>
              <RadioCards value={data.hasKeybox} onChange={v => update({ hasKeybox: v })} options={[
                { value: 'yes', label: 'Ja' }, { value: 'no', label: 'Nej' },
              ]} />
            </div>
            <div>
              <Label className="text-foreground font-medium text-sm flex items-center gap-1.5">
                <Brush className="w-3 h-3 text-muted-foreground" /> Rengøringsaftale?
              </Label>
              <RadioCards value={data.hasCleaning} onChange={v => update({ hasCleaning: v })} options={[
                { value: 'yes', label: 'Ja' }, { value: 'no', label: 'Nej' },
              ]} />
            </div>
            <div>
              <Label className="text-foreground font-medium text-sm flex items-center gap-1.5">
                <Globe className="w-3 h-3 text-muted-foreground" /> Portal-erfaring?
              </Label>
              <RadioCards value={data.hasExperience} onChange={v => update({ hasExperience: v })} options={[
                { value: 'yes', label: 'Ja' }, { value: 'no', label: 'Nej' },
              ]} />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // ─── Step 5: Benefits ───────────────────────────────────

  const Step5 = () => {
    const benefits = [
      { icon: Globe, title: 'Eksponering på alle portaler', desc: 'Airbnb, Booking.com, VRBO og vores egne kanaler' },
      { icon: Camera, title: 'Professionelt indhold', desc: 'Vi vejleder om billeder der skaber bookinger' },
      { icon: MessageCircle, title: '24/7 gæstekommunikation', desc: 'Du slipper for al dialog med gæster' },
      { icon: Shield, title: 'Rengøring & kvalitetssikring', desc: 'Koordineret slutrengøring og kontrol' },
      { icon: Wallet, title: 'Gennemsigtige udbetalinger', desc: 'Månedlige overførsler direkte til din konto' },
      { icon: Star, title: 'Skatteoptimering', desc: 'Adgang til det fulde bundfradrag på 50.200 kr.' },
    ];

    const personalised = data.helpLevel === 'full'
      ? 'Du har valgt fuld hjælp — vi klarer alt fra A til Z, så du kan læne dig tilbage.'
      : data.helpLevel === 'partial'
      ? 'Du har valgt delvis hjælp — vi tilpasser servicen, så den passer præcis til dig.'
      : 'Vi finder sammen den bedste løsning for dig og dit sommerhus.';

    return (
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-2">
            <span className="text-primary italic">SommerVibes</span> passer til dig
          </h2>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">{personalised}</p>
        </div>

        <div className="grid md:grid-cols-2 gap-3 mb-8">
          {benefits.map((b, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.06 }}
              className="flex items-start gap-3 p-4 rounded-xl border border-border/30 bg-card/30">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <b.icon className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground text-sm">{b.title}</h3>
                <p className="text-muted-foreground text-xs mt-0.5">{b.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="p-6 rounded-2xl bg-primary/5 border border-primary/15 text-center">
          <div className="flex items-baseline justify-center gap-2 mb-1.5">
            <span className="font-display text-5xl font-bold text-primary">15%</span>
            <span className="text-muted-foreground text-sm">kommission</span>
          </div>
          <p className="text-muted-foreground text-xs">Ingen oprettelsesgebyr · Ingen skjulte gebyrer · Du betaler kun ved bookinger</p>
        </motion.div>
      </div>
    );
  };

  // ─── Step 6: Agreement Review ───────────────────────────

  const AGREEMENT_SECTIONS = [
    { title: 'Formidling', points: [
      'SommerVibes formidler udlejning af dit sommerhus på dine vegne',
      'Dit hus markedsføres på Airbnb, Booking.com, VRBO og vores egne kanaler',
    ]},
    { title: 'Kommission & betaling', points: [
      'Kommission: 15% af gennemførte bookinger',
      'Gæsten betaler et servicegebyr på 5% oveni',
      'Du modtager månedlige udbetalinger med fuld gennemsigtighed',
    ]},
    { title: 'Service & drift', points: [
      'SommerVibes koordinerer gæstekontakt, rengøring og markedsføring',
      'Vi håndterer forsikring ved pludselige og uforudsete skader',
      'Du bestemmer selv hvornår dit hus er tilgængeligt via ejerportalen',
    ]},
    { title: 'Vilkår', points: [
      'Bindingsperiode: 6 måneder — herefter opsigelse med 30 dages varsel',
      'Du kan til enhver tid blokere datoer til eget brug',
      'Dine data behandles fortroligt iht. GDPR og vores privatlivspolitik',
    ]},
  ];

  const Step6 = () => (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-2">Gennemgå aftalen</h2>
        <p className="text-muted-foreground text-sm">Her er det vigtigste i vores samarbejdsaftale — i klart sprog</p>
      </div>

      <div className="space-y-4">
        {AGREEMENT_SECTIONS.map((section, si) => (
          <motion.div key={si} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: si * 0.08 }}>
            <Card className="border-border/30 bg-card/30">
              <CardContent className="p-5">
                <h3 className="font-display text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <div className="w-5 h-5 rounded bg-primary/10 flex items-center justify-center">
                    <span className="text-primary text-[10px] font-bold">{si + 1}</span>
                  </div>
                  {section.title}
                </h3>
                <div className="space-y-2">
                  {section.points.map((point, pi) => (
                    <div key={pi} className="flex items-start gap-2.5">
                      <Check className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                      <p className="text-foreground/70 text-sm leading-relaxed">{point}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <p className="text-center text-muted-foreground/50 text-xs mt-6">
        Du accepterer og signerer aftalen i næste trin
      </p>
    </div>
  );

  // ─── Step 7: Sign ───────────────────────────────────────

  const Step7 = () => (
    <div className="max-w-xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-2">Signer aftalen</h2>
        <p className="text-muted-foreground text-sm">Bekræft din underskrift og opret din konto</p>
      </div>

      <Card className="border-border/40 bg-card/40 backdrop-blur-sm">
        <CardContent className="p-5 md:p-7 space-y-5">
          {/* Summary */}
          <div className="p-4 rounded-xl bg-muted/20 border border-border/20 space-y-2">
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-2">Opsummering</p>
            {[
              ['Ejer', data.ownerName || '—'],
              ['Bolig', `${data.propertyType || '—'} i ${data.region || '—'}`],
              ['Adresse', data.propertyAddress || '—'],
              ['Kommission', '15%'],
              ['Binding', '6 måneder'],
            ].map(([label, value], i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-muted-foreground">{label}</span>
                <span className={`text-foreground font-medium ${label === 'Kommission' ? 'text-primary' : ''}`}>{value}</span>
              </div>
            ))}
          </div>

          {/* Signature */}
          <div>
            <Label className="text-foreground font-medium text-sm">Din underskrift (fulde navn) *</Label>
            <Input placeholder="Skriv dit fulde navn som signatur" value={data.signatureName}
              onChange={e => update({ signatureName: e.target.value })}
              className="mt-1.5 bg-background/50 font-display italic text-lg" />
          </div>

          <div>
            <Label className="text-foreground font-medium text-sm">Dato</Label>
            <Input type="date" value={data.signatureDate}
              onChange={e => update({ signatureDate: e.target.value })}
              className="mt-1.5 bg-background/50" />
          </div>

          {/* Account creation for non-logged-in users */}
          {!user && (
            <div className="border-t border-border/30 pt-5">
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-3">Opret din konto</p>
              <div>
                <Label className="text-foreground font-medium text-sm flex items-center gap-1.5">
                  <Lock className="w-3 h-3 text-muted-foreground" /> Adgangskode *
                </Label>
                <Input type="password" placeholder="Minimum 6 tegn" value={data.password}
                  onChange={e => update({ password: e.target.value })} className="mt-1.5 bg-background/50" />
              </div>
            </div>
          )}

          {/* Consent checkboxes */}
          <div className="space-y-3 pt-2">
            <div className="flex items-start gap-3 p-3 rounded-xl bg-primary/5 border border-primary/15">
              <Checkbox id="agreement" checked={data.acceptAgreement}
                onCheckedChange={(c) => update({ acceptAgreement: c === true })} className="mt-0.5" />
              <label htmlFor="agreement" className="text-sm text-foreground/80 leading-relaxed cursor-pointer">
                Jeg accepterer formidlingsaftalen med SommerVibes, herunder 15% kommission og 6 måneders binding. *
              </label>
            </div>
            <div className="flex items-start gap-3">
              <Checkbox id="terms" checked={data.acceptTerms}
                onCheckedChange={(c) => update({ acceptTerms: c === true })} className="mt-0.5" />
              <label htmlFor="terms" className="text-sm text-muted-foreground cursor-pointer leading-relaxed">
                Jeg accepterer <span className="text-primary underline cursor-pointer" onClick={() => window.open('/terms', '_blank')}>handelsbetingelser</span>. *
              </label>
            </div>
            <div className="flex items-start gap-3">
              <Checkbox id="privacy" checked={data.acceptPrivacy}
                onCheckedChange={(c) => update({ acceptPrivacy: c === true })} className="mt-0.5" />
              <label htmlFor="privacy" className="text-sm text-muted-foreground cursor-pointer leading-relaxed">
                Jeg har læst og forstået <span className="text-primary underline cursor-pointer" onClick={() => window.open('/privacy', '_blank')}>privatlivspolitikken</span>. *
              </label>
            </div>
            <div className="flex items-start gap-3">
              <Checkbox id="marketing" checked={data.acceptMarketing}
                onCheckedChange={(c) => update({ acceptMarketing: c === true })} className="mt-0.5" />
              <label htmlFor="marketing" className="text-sm text-muted-foreground cursor-pointer leading-relaxed">
                Ja tak, jeg vil gerne modtage nyheder og tips om udlejning (valgfrit)
              </label>
            </div>
          </div>

          {data.acceptAgreement && data.signatureName.trim().length > 2 && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
              className="p-3 rounded-xl bg-accent/5 border border-accent/15 text-center">
              <p className="text-accent text-sm font-medium">
                ✓ Klar til signering — "{data.signatureName}"
              </p>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  // ─── Step 8: Success ────────────────────────────────────

  const Step8 = () => {
    const nextSteps = [
      { icon: Phone, title: 'Vi kontakter dig', desc: 'Inden for 24 timer ringer vi og aftaler det næste', time: '1-2 dage' },
      { icon: Home, title: 'Vi kommer forbi ejendommen', desc: 'Gennemgang af det praktiske — nøgleboks, fotos og klargøring', time: '3-7 dage' },
      { icon: Globe, title: 'Din bolig går online', desc: 'Vi opretter og optimerer din annonce på alle portaler', time: '1-2 uger' },
      { icon: Star, title: 'Adgang til ejerdashboard', desc: 'Følg bookinger, kalender og udbetalinger digitalt', time: 'Med det samme' },
      { icon: Wallet, title: 'Du modtager udbetaling', desc: 'Gennemsigtige månedlige udbetalinger til din konto', time: 'Løbende' },
    ];

    return (
      <div className="max-w-2xl mx-auto text-center">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6 }}>
          <div className="w-20 h-20 rounded-full bg-accent/10 border-2 border-accent/30 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-accent" />
          </div>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-3">
            Du er i gang med <span className="text-primary italic">SommerVibes</span>
          </h2>
          <p className="text-muted-foreground text-lg mb-2">Tak for din tilmelding — vi glæder os til samarbejdet!</p>
          {!user && (
            <p className="text-primary text-sm font-medium mb-8">
              Tjek din email for at bekræfte din konto ✉️
            </p>
          )}
        </motion.div>

        <div className="text-left mt-10 mb-10">
          <h3 className="font-display text-lg font-semibold text-foreground mb-6 text-center">Hvad sker der nu?</h3>
          <div className="space-y-0">
            {nextSteps.map((s, i) => {
              const Icon = s.icon;
              return (
                <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.3 + i * 0.1 }} className="flex gap-4 relative">
                  {i < nextSteps.length - 1 && (
                    <div className="absolute left-5 top-12 bottom-0 w-px bg-border/40" />
                  )}
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 z-10">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="pb-7">
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
          <Button variant="gold" size="lg" className="gap-2 group" onClick={() => navigate('/owner')}>
            Gå til ejerdashboard <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Button>
          <Button variant="outline" size="lg" className="border-border text-muted-foreground gap-2" onClick={() => navigate('/book-vurdering')}>
            <PhoneCall className="w-4 h-4" /> Book opstartssamtale
          </Button>
        </div>
      </div>
    );
  };

  // ─── Render ──────────────────────────────────────────────

  const stepComponents = [Step1, Step2, Step3, Step4, Step5, Step6, Step7, Step8];
  const CurrentStep = stepComponents[step - 1];

  const buttonLabel = () => {
    if (step === 1) return 'Kom i gang';
    if (step === 7) return isSubmitting ? 'Opretter...' : 'Signer og opret konto';
    return 'Næste';
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <div className="border-b border-border/30 bg-card/50 backdrop-blur-sm px-4 py-3 shrink-0">
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
        <div className="max-w-5xl mx-auto px-4 py-6 md:py-10">
          {step < 8 && step > 1 && <StepIndicator />}
          <AnimatePresence mode="wait">
            <motion.div key={step} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.3 }}>
              <CurrentStep />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Bottom nav */}
      {step < 8 && (
        <div className="border-t border-border/30 bg-card/50 backdrop-blur-sm px-4 py-3.5 shrink-0">
          <div className="flex items-center justify-between max-w-5xl mx-auto">
            <Button variant="outline" size="lg" onClick={() => setStep(s => s - 1)} disabled={step === 1}
              className="gap-2 h-11 px-5 border-border/50">
              <ArrowLeft className="h-4 w-4" /> Tilbage
            </Button>
            <span className="text-xs text-muted-foreground/50 hidden sm:block">Trin {step} af 7</span>
            <Button variant="gold" size="lg" onClick={next} disabled={!canNext() || isSubmitting}
              className="gap-2 h-11 px-7">
              {buttonLabel()}
              {step < 7 && <ArrowRight className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
