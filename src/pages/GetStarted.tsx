import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  ArrowRight, ArrowLeft, Check, Home, MapPin, Users, Bed, Bath,
  Shield, FileSignature, Mail, Phone, Lock, Sparkles, Camera,
  Globe, MessageCircle, Wallet, Star, CheckCircle2, X, User,
  Link2, Key, Brush, Clock, Heart, Zap,
  PenLine, Download, PhoneCall, Eye, CalendarCheck, Headphones
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Types ───────────────────────────────────────────────────

interface OnboardingData {
  // Step 2: Account
  email: string;
  password: string;
  passwordConfirm: string;
  acceptTerms: boolean;
  acceptPrivacy: boolean;
  // Step 3: Owner
  ownerName: string;
  ownerPhone: string;
  ownerAddress: string;
  ownerPostal: string;
  ownerCity: string;
  preferredContact: string;
  // Step 4: Property
  propertyAddress: string;
  region: string;
  propertyType: string;
  capacity: number;
  bedrooms: number;
  bathrooms: number;
  hasKeybox: string;
  hasExperience: string;
  existingLink: string;
  facilities: string[];
  // Step 5: Rental
  startTime: string;
  helpLevel: string;
  selfManage: string[];
  hasCleaning: string;
  propertyReady: string;
  relevantServices: string[];
  // Step 7: Sign
  acceptAgreement: boolean;
  acceptMarketing: boolean;
  signatureName: string;
  signatureDate: string;
}

const REGIONS = ['Nordjylland', 'Midtjylland', 'Syddanmark', 'Sjælland', 'Hovedstaden', 'Bornholm'];
const PROPERTY_TYPES = ['Sommerhus', 'Feriehus', 'Lejlighed', 'Villa', 'Poolhus', 'Luksushus'];
const FACILITIES = [
  'Pool', 'Spa / Jacuzzi', 'Sauna', 'Havudsigt', 'Pejs / Brændeovn',
  'Aktivitetsrum', 'Stor have', 'Grill / Udekøkken', 'Carport / Garage', 'Husdyr tilladt',
];
const SERVICES = [
  'Professionelle billeder', 'Gæstekommunikation', 'Rengøringskoordinering',
  'Nøgleboks-opsætning', 'Portal-markedsføring', 'Kalendersynkronisering',
];
const SELF_MANAGE_OPTIONS = [
  'Nøgleoverdragelse', 'Rengøring', 'Gæstekontakt', 'Kalender',
];

const STEPS = [
  { label: 'Start', icon: Heart },
  { label: 'Opret profil', icon: Lock },
  { label: 'Dine oplysninger', icon: User },
  { label: 'Dit sommerhus', icon: Home },
  { label: 'Din udlejning', icon: Zap },
  { label: 'Samarbejdet', icon: Eye },
  { label: 'Signer', icon: PenLine },
  { label: 'Klar', icon: CheckCircle2 },
];

// ─── Helpers ─────────────────────────────────────────────────

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

const ToggleChips = ({ options, selected, onToggle }: { options: string[]; selected: string[]; onToggle: (v: string) => void }) => (
  <div className="grid grid-cols-2 gap-2 mt-2">
    {options.map(f => (
      <button key={f} type="button" onClick={() => onToggle(f)}
        className={`flex items-center gap-2 p-2.5 rounded-xl border text-sm transition-all text-left ${
          selected.includes(f) ? 'border-primary bg-primary/10 text-primary' : 'border-border/30 text-muted-foreground hover:border-primary/20'
        }`}>
        <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
          selected.includes(f) ? 'bg-primary border-primary' : 'border-border'
        }`}>
          {selected.includes(f) && <Check className="w-2.5 h-2.5 text-primary-foreground" />}
        </div>
        {f}
      </button>
    ))}
  </div>
);

// ─── Component ───────────────────────────────────────────────

export default function GetStarted() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [data, setData] = useState<OnboardingData>({
    email: '', password: '', passwordConfirm: '', acceptTerms: false, acceptPrivacy: false,
    ownerName: '', ownerPhone: '', ownerAddress: '', ownerPostal: '', ownerCity: '', preferredContact: 'email',
    propertyAddress: '', region: '', propertyType: '', capacity: 6, bedrooms: 3, bathrooms: 1,
    hasKeybox: '', hasExperience: '', existingLink: '', facilities: [],
    startTime: '', helpLevel: '', selfManage: [], hasCleaning: '', propertyReady: '', relevantServices: [],
    acceptAgreement: false, acceptMarketing: false,
    signatureName: '', signatureDate: new Date().toISOString().split('T')[0],
  });

  const update = useCallback((u: Partial<OnboardingData>) => setData(p => ({ ...p, ...u })), []);
  const toggleList = (key: 'facilities' | 'selfManage' | 'relevantServices', val: string) => {
    setData(p => ({ ...p, [key]: p[key].includes(val) ? p[key].filter(x => x !== val) : [...p[key], val] }));
  };

  const canNext = (): boolean => {
    switch (step) {
      case 1: return true;
      case 2: return user ? true : !!(data.email.trim() && data.password.length >= 6 && data.password === data.passwordConfirm && data.acceptTerms && data.acceptPrivacy);
      case 3: return !!(data.ownerName.trim() && data.ownerPhone.trim());
      case 4: return !!(data.propertyAddress.trim() && data.region && data.propertyType);
      case 5: return !!(data.helpLevel);
      case 6: return true;
      case 7: return data.acceptAgreement && data.signatureName.trim().length > 2;
      default: return false;
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      let userId = user?.id;

      // Create account if not logged in
      if (!user) {
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: data.email,
          password: data.password,
          options: {
            emailRedirectTo: `${window.location.origin}/owner`,
            data: { full_name: data.ownerName },
          },
        });
        if (authError) throw authError;
        userId = authData.user?.id;
      }

      if (userId) {
        // Update profile
        await supabase.from('profiles').update({
          phone: data.ownerPhone,
          full_name: data.ownerName,
        }).eq('id', userId);

        // Create property
        const { data: propData, error: propError } = await supabase.from('properties').insert({
          owner_id: userId,
          title: `${data.propertyType} i ${data.region}`,
          address: data.propertyAddress,
          region: data.region,
          capacity: data.capacity,
          bedrooms: data.bedrooms,
          bathrooms: data.bathrooms,
          amenities: data.facilities,
          status: 'draft',
        }).select('id').single();
        if (propError) throw propError;

        // Create agreement
        await supabase.from('agreements').insert({
          owner_id: userId,
          property_id: propData?.id || null,
          owner_name: data.ownerName,
          owner_email: data.email || user?.email,
          owner_phone: data.ownerPhone,
          owner_address: `${data.ownerAddress}, ${data.ownerPostal} ${data.ownerCity}`,
          property_title: `${data.propertyType} i ${data.region}`,
          property_address: data.propertyAddress,
          property_region: data.region,
          commission_percent: 15,
          binding_months: 6,
          notice_days: 30,
          signature_name: data.signatureName,
          signature_date: data.signatureDate,
          signed_at: new Date().toISOString(),
          accept_terms: data.acceptTerms,
          accept_privacy: data.acceptPrivacy,
          accept_marketing: data.acceptMarketing,
          status: 'signed',
          version: '1.2',
        });

        // Create onboarding record
        await supabase.from('owner_onboarding').insert({
          owner_id: userId,
          status: 'agreement_signed',
          current_step: 'property_setup',
          lead_source: 'website_onboarding',
          signup_started_at: new Date().toISOString(),
          agreement_signed_at: new Date().toISOString(),
        });
      }

      setStep(8);
      toast.success('Velkommen til SommerVibes!');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Der opstod en fejl');
    } finally {
      setIsSubmitting(false);
    }
  };

  const next = () => {
    if (step === 7) {
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

  // ─── Step 1: Start ──────────────────────────────────────

  const Step1 = () => (
    <div className="max-w-xl mx-auto text-center">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-8">
          <Heart className="w-8 h-8 text-primary" />
        </div>
        <h2 className="font-display text-3xl md:text-5xl font-bold text-foreground mb-4">
          Velkommen til <span className="text-primary italic">SommerVibes</span>
        </h2>
        <p className="text-muted-foreground text-lg leading-relaxed mb-3 max-w-md mx-auto">
          Du er kun få minutter fra at komme i gang med professionel udlejning af dit sommerhus.
        </p>
        <p className="text-muted-foreground/60 text-sm mb-10">
          Det tager kun få minutter — og du er ikke forpligtet til noget, før du selv vælger det.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          {[
            { icon: Clock, text: 'Tager kun 5 min' },
            { icon: Shield, text: 'Ingen forpligtelse' },
            { icon: Star, text: 'Gratis oprettelse' },
          ].map((item, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.1 }}
              className="flex items-center gap-2.5 p-3 rounded-xl bg-card/50 border border-border/30">
              <item.icon className="w-4 h-4 text-primary shrink-0" />
              <span className="text-sm text-foreground/80">{item.text}</span>
            </motion.div>
          ))}
        </div>

        <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 text-sm text-muted-foreground max-w-sm mx-auto">
          <Headphones className="w-4 h-4 text-primary inline mr-2" />
          Har du spørgsmål undervejs? Vi er klar til at hjælpe dig.
        </div>
      </motion.div>
    </div>
  );

  // ─── Step 2: Create Account ─────────────────────────────

  const Step2 = () => {
    if (user) {
      return (
        <div className="max-w-md mx-auto text-center">
          <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-7 h-7 text-accent" />
          </div>
          <h2 className="font-display text-2xl font-bold text-foreground mb-2">Du er allerede logget ind</h2>
          <p className="text-muted-foreground text-sm mb-4">{user.email}</p>
          <p className="text-muted-foreground/60 text-xs">Fortsæt til næste trin for at udfylde dine oplysninger.</p>
        </div>
      );
    }

    return (
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-2">Opret din profil</h2>
          <p className="text-muted-foreground text-sm">Din konto giver dig adgang til ejerdashboardet</p>
        </div>
        <Card className="border-border/40 bg-card/40 backdrop-blur-sm">
          <CardContent className="p-5 md:p-7 space-y-5">
            <div>
              <Label className="text-foreground font-medium text-sm">E-mail *</Label>
              <Input type="email" placeholder="din@email.dk" value={data.email}
                onChange={e => update({ email: e.target.value })} className="mt-1.5 bg-background/50" />
            </div>
            <div>
              <Label className="text-foreground font-medium text-sm">Adgangskode *</Label>
              <Input type="password" placeholder="Minimum 6 tegn" value={data.password}
                onChange={e => update({ password: e.target.value })} className="mt-1.5 bg-background/50" />
            </div>
            <div>
              <Label className="text-foreground font-medium text-sm">Bekræft adgangskode *</Label>
              <Input type="password" placeholder="Gentag adgangskode" value={data.passwordConfirm}
                onChange={e => update({ passwordConfirm: e.target.value })} className="mt-1.5 bg-background/50" />
              {data.passwordConfirm && data.password !== data.passwordConfirm && (
                <p className="text-destructive text-xs mt-1">Adgangskoderne matcher ikke</p>
              )}
            </div>
            <div className="space-y-3 pt-2">
              <div className="flex items-start gap-3">
                <Checkbox id="terms" checked={data.acceptTerms}
                  onCheckedChange={(c) => update({ acceptTerms: c === true })} className="mt-0.5" />
                <label htmlFor="terms" className="text-sm text-muted-foreground cursor-pointer leading-relaxed">
                  Jeg accepterer <span className="text-primary underline" onClick={(e) => { e.preventDefault(); window.open('/terms', '_blank'); }}>handelsbetingelser</span> *
                </label>
              </div>
              <div className="flex items-start gap-3">
                <Checkbox id="privacy" checked={data.acceptPrivacy}
                  onCheckedChange={(c) => update({ acceptPrivacy: c === true })} className="mt-0.5" />
                <label htmlFor="privacy" className="text-sm text-muted-foreground cursor-pointer leading-relaxed">
                  Jeg har læst <span className="text-primary underline" onClick={(e) => { e.preventDefault(); window.open('/privacy', '_blank'); }}>privatlivspolitikken</span> *
                </label>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  // ─── Step 3: Owner Details ──────────────────────────────

  const Step3 = () => (
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
          <div>
            <Label className="text-foreground font-medium text-sm">Telefon *</Label>
            <Input type="tel" placeholder="+45 12 34 56 78" value={data.ownerPhone}
              onChange={e => update({ ownerPhone: e.target.value })} className="mt-1.5 bg-background/50" />
          </div>
          <div>
            <Label className="text-foreground font-medium text-sm">Adresse</Label>
            <Input placeholder="Din privatadresse" value={data.ownerAddress}
              onChange={e => update({ ownerAddress: e.target.value })} className="mt-1.5 bg-background/50" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-foreground font-medium text-sm">Postnr.</Label>
              <Input placeholder="8000" value={data.ownerPostal}
                onChange={e => update({ ownerPostal: e.target.value })} className="mt-1.5 bg-background/50" />
            </div>
            <div>
              <Label className="text-foreground font-medium text-sm">By</Label>
              <Input placeholder="Aarhus" value={data.ownerCity}
                onChange={e => update({ ownerCity: e.target.value })} className="mt-1.5 bg-background/50" />
            </div>
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

  // ─── Step 4: Property Details ───────────────────────────

  const Step4 = () => (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-2">Dit sommerhus</h2>
        <p className="text-muted-foreground text-sm">Fortæl os om din bolig — du kan altid redigere senere</p>
      </div>
      <Card className="border-border/40 bg-card/40 backdrop-blur-sm">
        <CardContent className="p-5 md:p-7 space-y-5">
          <div>
            <Label className="text-foreground font-medium text-sm">Boligens adresse *</Label>
            <Input placeholder="Strandvejen 42, 6800 Varde" value={data.propertyAddress}
              onChange={e => update({ propertyAddress: e.target.value })} className="mt-1.5 bg-background/50" />
          </div>

          <div>
            <Label className="text-foreground font-medium text-sm">Region / Område *</Label>
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
            <Label className="text-foreground font-medium text-sm">Boligtype *</Label>
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

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label className="text-foreground font-medium text-sm flex items-center gap-1.5">
                <Users className="w-3 h-3 text-muted-foreground" /> Sovepladser
              </Label>
              <Input type="number" min={1} max={20} value={data.capacity}
                onChange={e => update({ capacity: parseInt(e.target.value) || 1 })} className="mt-1.5 bg-background/50" />
            </div>
            <div>
              <Label className="text-foreground font-medium text-sm flex items-center gap-1.5">
                <Bed className="w-3 h-3 text-muted-foreground" /> Værelser
              </Label>
              <Input type="number" min={1} max={10} value={data.bedrooms}
                onChange={e => update({ bedrooms: parseInt(e.target.value) || 1 })} className="mt-1.5 bg-background/50" />
            </div>
            <div>
              <Label className="text-foreground font-medium text-sm flex items-center gap-1.5">
                <Bath className="w-3 h-3 text-muted-foreground" /> Badeværelser
              </Label>
              <Input type="number" min={1} max={5} value={data.bathrooms}
                onChange={e => update({ bathrooms: parseInt(e.target.value) || 1 })} className="mt-1.5 bg-background/50" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-foreground font-medium text-sm flex items-center gap-1.5">
                <Key className="w-3 h-3 text-muted-foreground" /> Har du nøgleboks?
              </Label>
              <RadioCards value={data.hasKeybox} onChange={v => update({ hasKeybox: v })} options={[
                { value: 'yes', label: 'Ja' }, { value: 'no', label: 'Nej' },
              ]} />
            </div>
            <div>
              <Label className="text-foreground font-medium text-sm flex items-center gap-1.5">
                <Globe className="w-3 h-3 text-muted-foreground" /> Erfaring med udlejning?
              </Label>
              <RadioCards value={data.hasExperience} onChange={v => update({ hasExperience: v })} options={[
                { value: 'yes', label: 'Ja' }, { value: 'no', label: 'Nej' },
              ]} />
            </div>
          </div>

          <div>
            <Label className="text-foreground font-medium text-sm">Særlige faciliteter</Label>
            <ToggleChips options={FACILITIES} selected={data.facilities} onToggle={(v) => toggleList('facilities', v)} />
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

  // ─── Step 5: Rental Preferences ─────────────────────────

  const Step5 = () => (
    <div className="max-w-xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-2">Din udlejning</h2>
        <p className="text-muted-foreground text-sm">Fortæl os lidt om dine ønsker og behov</p>
      </div>
      <Card className="border-border/40 bg-card/40 backdrop-blur-sm">
        <CardContent className="p-5 md:p-7 space-y-6">
          <div>
            <Label className="text-foreground font-medium text-sm">Hvornår ønsker du at komme i gang?</Label>
            <RadioCards value={data.startTime} onChange={v => update({ startTime: v })} options={[
              { value: 'asap', label: 'Hurtigst muligt' },
              { value: '1-2months', label: 'Inden for 1-2 måneder' },
              { value: 'next-season', label: 'Til næste sæson' },
              { value: 'exploring', label: 'Undersøger stadig' },
            ]} />
          </div>

          <div>
            <Label className="text-foreground font-medium text-sm">Ønsker du fuld håndtering? *</Label>
            <RadioCards value={data.helpLevel} onChange={v => update({ helpLevel: v })} options={[
              { value: 'full', label: 'Ja — I klarer alt', desc: 'SommerVibes håndterer gæster, nøgler, rengøring og markedsføring' },
              { value: 'partial', label: 'Delvis — Jeg vil selv stå for noget', desc: 'F.eks. nøgleoverdragelse eller rengøring' },
              { value: 'unsure', label: 'Ikke sikker endnu', desc: 'Vi finder den bedste løsning sammen' },
            ]} />
          </div>

          {data.helpLevel === 'partial' && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
              <Label className="text-foreground font-medium text-sm">Hvad vil du selv håndtere?</Label>
              <ToggleChips options={SELF_MANAGE_OPTIONS} selected={data.selfManage} onToggle={(v) => toggleList('selfManage', v)} />
            </motion.div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-foreground font-medium text-sm flex items-center gap-1.5">
                <Brush className="w-3 h-3 text-muted-foreground" /> Rengøringsløsning?
              </Label>
              <RadioCards value={data.hasCleaning} onChange={v => update({ hasCleaning: v })} options={[
                { value: 'yes', label: 'Ja, egen' }, { value: 'no', label: 'Nej, hjælp' },
              ]} />
            </div>
            <div>
              <Label className="text-foreground font-medium text-sm flex items-center gap-1.5">
                <CalendarCheck className="w-3 h-3 text-muted-foreground" /> Klar til udlejning?
              </Label>
              <RadioCards value={data.propertyReady} onChange={v => update({ propertyReady: v })} options={[
                { value: 'yes', label: 'Ja' }, { value: 'no', label: 'Ikke endnu' },
              ]} />
            </div>
          </div>

          <div>
            <Label className="text-foreground font-medium text-sm">Hvilke services er mest relevante?</Label>
            <ToggleChips options={SERVICES} selected={data.relevantServices} onToggle={(v) => toggleList('relevantServices', v)} />
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // ─── Step 6: Agreement Review ───────────────────────────

  const Step6 = () => {
    const sections = [
      { title: 'Hvad SommerVibes håndterer', icon: Sparkles, items: [
        'Professionel markedsføring på Airbnb, Booking.com og egne kanaler',
        'Komplet gæstekommunikation og support',
        'Koordinering af rengøring og klargøring',
        'Nøgleboks-opsætning og adgangsstyring',
        'Prisoptimering og kalenderstyring',
      ]},
      { title: 'Hvad du selv kan håndtere', icon: User, items: [
        'Vælg hvornår dit hus er tilgængeligt',
        'Bloker datoer til eget brug',
        'Følg bookinger og indtjening via dashboardet',
        'Kommunikér direkte med gæster hvis ønsket',
      ]},
      { title: 'Økonomi & udbetaling', icon: Wallet, items: [
        '15% kommission af gennemførte bookinger',
        'Gæsten betaler 5% servicegebyr oveni',
        'Gennemsigtige månedlige udbetalinger',
        'Fuld økonomisk overblik i ejerdashboardet',
      ]},
      { title: 'Vilkår', icon: Shield, items: [
        '6 måneders bindingsperiode',
        'Herefter opsigelse med 30 dages varsel',
        'GDPR-sikret behandling af alle data',
        'Forsikringsdækning ved pludselige skader',
      ]},
    ];

    return (
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-2">Gennemgå samarbejdet</h2>
          <p className="text-muted-foreground text-sm">Her er det vigtigste om vores partnerskab — i klart sprog</p>
        </div>

        <div className="space-y-4 mb-8">
          {sections.map((section, si) => (
            <motion.div key={si} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: si * 0.08 }}>
              <Card className="border-border/30 bg-card/30">
                <CardContent className="p-5">
                  <h3 className="font-display text-sm font-semibold text-foreground mb-3 flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                      <section.icon className="w-3.5 h-3.5 text-primary" />
                    </div>
                    {section.title}
                  </h3>
                  <div className="space-y-2">
                    {section.items.map((item, pi) => (
                      <div key={pi} className="flex items-start gap-2.5">
                        <Check className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                        <p className="text-foreground/70 text-sm leading-relaxed">{item}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
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

  // ─── Step 7: Sign Agreement ─────────────────────────────

  const Step7 = () => (
    <div className="max-w-xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-2">Signer aftalen</h2>
        <p className="text-muted-foreground text-sm">Bekræft dit samarbejde med SommerVibes</p>
      </div>

      <Card className="border-border/40 bg-card/40 backdrop-blur-sm">
        <CardContent className="p-5 md:p-7 space-y-5">
          {/* Auto-filled summary */}
          <div className="p-4 rounded-xl bg-muted/20 border border-border/20 space-y-2">
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-2">Opsummering</p>
            {[
              ['Ejer', data.ownerName || '—'],
              ['E-mail', data.email || user?.email || '—'],
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

          {/* Consent */}
          <div className="space-y-3 pt-2">
            <div className="flex items-start gap-3 p-3 rounded-xl bg-primary/5 border border-primary/15">
              <Checkbox id="agreement" checked={data.acceptAgreement}
                onCheckedChange={(c) => update({ acceptAgreement: c === true })} className="mt-0.5" />
              <label htmlFor="agreement" className="text-sm text-foreground/80 leading-relaxed cursor-pointer">
                Jeg accepterer formidlingsaftalen med SommerVibes, herunder 15% kommission og 6 måneders binding. *
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

  // ─── Step 8: Confirmation ───────────────────────────────

  const Step8 = () => {
    const timeline = [
      { icon: Phone, title: 'Vi kontakter dig', desc: 'Vi aftaler det næste og besvarer dine spørgsmål', time: '1-2 dage' },
      { icon: Home, title: 'Vi kommer forbi ejendommen', desc: 'Gennemgang af det praktiske — nøgleboks, fotos og klargøring', time: '3-7 dage' },
      { icon: Camera, title: 'Vi klargør din annonce', desc: 'Professionelt indhold, tekster og prisoptimering', time: '1-2 uger' },
      { icon: Globe, title: 'Adgang til dit dashboard', desc: 'Følg alt digitalt — bookinger, kalender og kommunikation', time: 'Med det samme' },
      { icon: Star, title: 'Boligen går live', desc: 'Du kan begynde at modtage bookinger og indtjening', time: 'Når klar' },
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
          <p className="text-muted-foreground text-lg mb-2">
            Tak for din tilmelding, {data.ownerName.split(' ')[0] || 'ejer'} — vi glæder os til samarbejdet!
          </p>
          {!user && (
            <p className="text-primary text-sm font-medium mb-8">
              Tjek din email for at bekræfte din konto ✉️
            </p>
          )}
        </motion.div>

        {/* Visual timeline */}
        <div className="text-left mt-10 mb-10">
          <h3 className="font-display text-lg font-semibold text-foreground mb-6 text-center">Hvad sker der nu?</h3>
          <div className="space-y-0">
            {timeline.map((s, i) => {
              const Icon = s.icon;
              return (
                <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.3 + i * 0.1 }} className="flex gap-4 relative">
                  {i < timeline.length - 1 && (
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

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button variant="gold" size="lg" className="gap-2 group" onClick={() => navigate('/owner')}>
            Gå til ejerdashboard <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Button>
          <Button variant="outline" size="lg" className="border-border text-muted-foreground gap-2" onClick={() => navigate('/book-vurdering')}>
            <PhoneCall className="w-4 h-4" /> Book opstartssamtale
          </Button>
          <Button variant="outline" size="lg" className="border-border text-muted-foreground gap-2" onClick={() => navigate('/app')}>
            <Download className="w-4 h-4" /> Download app
          </Button>
        </div>
      </div>
    );
  };

  // ─── Render ──────────────────────────────────────────────

  const buttonLabel = () => {
    if (step === 1) return 'Kom i gang';
    if (step === 7) return isSubmitting ? 'Opretter...' : 'Signer og kom i gang';
    return 'Næste';
  };

  const renderCurrentStep = () => {
    switch (step) {
      case 1: return Step1();
      case 2: return Step2();
      case 3: return Step3();
      case 4: return Step4();
      case 5: return Step5();
      case 6: return Step6();
      case 7: return Step7();
      case 8: return Step8();
      default: return Step1();
    }
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
          {step > 1 && step < 8 && <StepIndicator />}
          <AnimatePresence mode="wait">
            <motion.div key={step} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.3 }}>
              {renderCurrentStep()}
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
