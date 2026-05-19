import { memo, useState, useCallback, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { User as SupabaseUser } from '@supabase/supabase-js';
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
import { useAuth } from '@/lib/auth';
import { completeGetStartedOnboarding } from '@/lib/get-started-api';
import { useTranslation } from '@/lib/i18n';
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

type AccountStepDraft = Pick<
  OnboardingData,
  'email' | 'password' | 'passwordConfirm' | 'acceptTerms' | 'acceptPrivacy'
>;

type ChoiceOption = { value: string; label: string; desc?: string };

const STEPS = [
  { icon: Heart },
  { icon: Lock },
  { icon: User },
  { icon: Home },
  { icon: Zap },
  { icon: Eye },
  { icon: PenLine },
  { icon: CheckCircle2 },
];

const GET_STARTED_COPY = {
  da: {
    steps: ['Start', 'Opret profil', 'Dine oplysninger', 'Dit sommerhus', 'Din udlejning', 'Samarbejdet', 'Signer', 'Klar'],
    common: {
      close: 'Luk',
      back: 'Tilbage',
      next: 'Næste',
      getStarted: 'Kom i gang',
      creating: 'Opretter...',
      signAndStart: 'Signer og kom i gang',
      step: 'Trin',
      of: 'af',
      in: 'i',
      yes: 'Ja',
      no: 'Nej',
      dash: '—',
    },
    messages: {
      success: 'Velkommen til SommerVibes!',
      error: 'Der opstod en fejl',
    },
    account: {
      loggedInTitle: 'Du er allerede logget ind',
      loggedInText: 'Fortsæt til næste trin for at udfylde dine oplysninger.',
      title: 'Opret din profil',
      subtitle: 'Din konto giver dig adgang til ejerdashboardet',
      email: 'E-mail *',
      emailPlaceholder: 'din@email.dk',
      password: 'Adgangskode *',
      passwordPlaceholder: 'Minimum 6 tegn',
      confirmPassword: 'Bekræft adgangskode *',
      confirmPasswordPlaceholder: 'Gentag adgangskode',
      mismatch: 'Adgangskoderne matcher ikke',
      acceptTermsPrefix: 'Jeg accepterer',
      termsLink: 'handelsbetingelser',
      acceptPrivacyPrefix: 'Jeg har læst',
      privacyLink: 'privatlivspolitikken',
    },
    intro: {
      title: 'Velkommen til',
      text: 'Du er kun få minutter fra at komme i gang med professionel udlejning af dit sommerhus.',
      subtext: 'Det tager kun få minutter — og du er ikke forpligtet til noget, før du selv vælger det.',
      badges: ['Tager kun 5 min', 'Ingen forpligtelse', 'Gratis oprettelse'],
      help: 'Har du spørgsmål undervejs? Vi er klar til at hjælpe dig.',
    },
    owner: {
      title: 'Dine oplysninger',
      subtitle: 'Så vi kan kontakte dig om dit sommerhus',
      fullName: 'Fulde navn *',
      fullNamePlaceholder: 'Anders Jensen',
      phone: 'Telefon *',
      address: 'Adresse',
      addressPlaceholder: 'Din privatadresse',
      postal: 'Postnr.',
      city: 'By',
      preferredContact: 'Foretrukken kontaktmetode',
      email: 'E-mail',
      phoneOption: 'Telefon',
    },
    property: {
      title: 'Dit sommerhus',
      subtitle: 'Fortæl os om din bolig — du kan altid redigere senere',
      address: 'Boligens adresse *',
      addressPlaceholder: 'Strandvejen 42, 6800 Varde',
      region: 'Region / Område *',
      type: 'Boligtype *',
      sleeps: 'Sovepladser',
      rooms: 'Værelser',
      bathrooms: 'Badeværelser',
      hasKeybox: 'Har du nøgleboks?',
      rentalExperience: 'Erfaring med udlejning?',
      facilities: 'Særlige faciliteter',
      existingLink: 'Link til eksisterende annonce (valgfrit)',
      regions: [
        { value: 'Nordjylland', label: 'Nordjylland' },
        { value: 'Midtjylland', label: 'Midtjylland' },
        { value: 'Syddanmark', label: 'Syddanmark' },
        { value: 'Sjælland', label: 'Sjælland' },
        { value: 'Hovedstaden', label: 'Hovedstaden' },
        { value: 'Bornholm', label: 'Bornholm' },
      ],
      types: [
        { value: 'Sommerhus', label: 'Sommerhus' },
        { value: 'Feriehus', label: 'Feriehus' },
        { value: 'Lejlighed', label: 'Lejlighed' },
        { value: 'Villa', label: 'Villa' },
        { value: 'Poolhus', label: 'Poolhus' },
        { value: 'Luksushus', label: 'Luksushus' },
      ],
      facilitiesList: [
        { value: 'Pool', label: 'Pool' },
        { value: 'Spa / Jacuzzi', label: 'Spa / Jacuzzi' },
        { value: 'Sauna', label: 'Sauna' },
        { value: 'Havudsigt', label: 'Havudsigt' },
        { value: 'Pejs / Brændeovn', label: 'Pejs / Brændeovn' },
        { value: 'Aktivitetsrum', label: 'Aktivitetsrum' },
        { value: 'Stor have', label: 'Stor have' },
        { value: 'Grill / Udekøkken', label: 'Grill / Udekøkken' },
        { value: 'Carport / Garage', label: 'Carport / Garage' },
        { value: 'Husdyr tilladt', label: 'Husdyr tilladt' },
      ],
    },
    rental: {
      title: 'Din udlejning',
      subtitle: 'Fortæl os lidt om dine ønsker og behov',
      startTime: 'Hvornår ønsker du at komme i gang?',
      startOptions: [
        { value: 'asap', label: 'Hurtigst muligt' },
        { value: '1-2months', label: 'Inden for 1-2 måneder' },
        { value: 'next-season', label: 'Til næste sæson' },
        { value: 'exploring', label: 'Undersøger stadig' },
      ],
      helpLevel: 'Ønsker du fuld håndtering? *',
      helpOptions: [
        { value: 'full', label: 'Ja — I klarer alt', desc: 'SommerVibes håndterer gæster, nøgler, rengøring og markedsføring' },
        { value: 'partial', label: 'Delvis — Jeg vil selv stå for noget', desc: 'F.eks. nøgleoverdragelse eller rengøring' },
        { value: 'unsure', label: 'Ikke sikker endnu', desc: 'Vi finder den bedste løsning sammen' },
      ],
      selfManage: 'Hvad vil du selv håndtere?',
      selfManageOptions: [
        { value: 'Nøgleoverdragelse', label: 'Nøgleoverdragelse' },
        { value: 'Rengøring', label: 'Rengøring' },
        { value: 'Gæstekontakt', label: 'Gæstekontakt' },
        { value: 'Kalender', label: 'Kalender' },
      ],
      cleaning: 'Rengøringsløsning?',
      cleaningOptions: [
        { value: 'yes', label: 'Ja, egen' },
        { value: 'no', label: 'Nej, hjælp' },
      ],
      ready: 'Klar til udlejning?',
      readyOptions: [
        { value: 'yes', label: 'Ja' },
        { value: 'no', label: 'Ikke endnu' },
      ],
      services: 'Hvilke services er mest relevante?',
      servicesOptions: [
        { value: 'Professionelle billeder', label: 'Professionelle billeder' },
        { value: 'Gæstekommunikation', label: 'Gæstekommunikation' },
        { value: 'Rengøringskoordinering', label: 'Rengøringskoordinering' },
        { value: 'Nøgleboks-opsætning', label: 'Nøgleboks-opsætning' },
        { value: 'Portal-markedsføring', label: 'Portal-markedsføring' },
        { value: 'Kalendersynkronisering', label: 'Kalendersynkronisering' },
      ],
    },
    review: {
      title: 'Gennemgå samarbejdet',
      subtitle: 'Her er det vigtigste om vores partnerskab — i klart sprog',
      sections: [
        {
          title: 'Hvad SommerVibes håndterer',
          items: ['Professionel markedsføring på Airbnb, Booking.com og egne kanaler', 'Komplet gæstekommunikation og support', 'Koordinering af rengøring og klargøring', 'Nøgleboks-opsætning og adgangsstyring', 'Prisoptimering og kalenderstyring'],
        },
        {
          title: 'Hvad du selv kan håndtere',
          items: ['Vælg hvornår dit hus er tilgængeligt', 'Bloker datoer til eget brug', 'Følg bookinger og indtjening via dashboardet', 'Kommunikér direkte med gæster hvis ønsket'],
        },
        {
          title: 'Økonomi & udbetaling',
          items: ['15% kommission af gennemførte bookinger', 'Gæsten betaler 5% servicegebyr oveni', 'Gennemsigtige månedlige udbetalinger', 'Fuld økonomisk overblik i ejerdashboardet'],
        },
        {
          title: 'Vilkår',
          items: ['6 måneders bindingsperiode', 'Herefter opsigelse med 30 dages varsel', 'GDPR-sikret behandling af alle data', 'Forsikringsdækning ved pludselige skader'],
        },
      ],
      commission: 'kommission',
      commissionNote: 'Ingen oprettelsesgebyr · Ingen skjulte gebyrer · Du betaler kun ved bookinger',
    },
    sign: {
      title: 'Signer aftalen',
      subtitle: 'Bekræft dit samarbejde med SommerVibes',
      summary: 'Opsummering',
      owner: 'Ejer',
      home: 'Bolig',
      address: 'Adresse',
      commission: 'Kommission',
      binding: 'Binding',
      bindingValue: '6 måneder',
      signature: 'Din underskrift (fulde navn) *',
      signaturePlaceholder: 'Skriv dit fulde navn som signatur',
      date: 'Dato',
      agreement: 'Jeg accepterer formidlingsaftalen med SommerVibes, herunder 15% kommission og 6 måneders binding. *',
      marketing: 'Ja tak, jeg vil gerne modtage nyheder og tips om udlejning (valgfrit)',
      ready: 'Klar til signering',
    },
    confirmation: {
      title: 'Velkommen til',
      thanks: 'Tak for din tilmelding, {name} — vi glæder os til samarbejdet!',
      ownerFallback: 'ejer',
      emailConfirm: 'Tjek din email for at bekræfte din konto ✉️',
      whatsNext: 'Hvad sker der nu?',
      timeline: [
        { title: 'Vi kontakter dig', desc: 'Vi aftaler det næste og besvarer dine spørgsmål', time: '1-2 dage' },
        { title: 'Vi kommer forbi ejendommen', desc: 'Gennemgang af det praktiske — nøgleboks, fotos og klargøring', time: '3-7 dage' },
        { title: 'Vi klargør din annonce', desc: 'Professionelt indhold, tekster og prisoptimering', time: '1-2 uger' },
        { title: 'Adgang til dit dashboard', desc: 'Følg alt digitalt — bookinger, kalender og kommunikation', time: 'Med det samme' },
        { title: 'Boligen går live', desc: 'Du kan begynde at modtage bookinger og indtjening', time: 'Når klar' },
      ],
      dashboard: 'Gå til ejerdashboard',
      bookCall: 'Book opstartssamtale',
      downloadApp: 'Download app',
    },
  },
  en: {
    steps: ['Start', 'Create profile', 'Your details', 'Your holiday home', 'Your rental', 'Partnership', 'Sign', 'Ready'],
    common: {
      close: 'Close',
      back: 'Back',
      next: 'Next',
      getStarted: 'Get started',
      creating: 'Creating...',
      signAndStart: 'Sign and get started',
      step: 'Step',
      of: 'of',
      in: 'in',
      yes: 'Yes',
      no: 'No',
      dash: '—',
    },
    messages: {
      success: 'Welcome to SommerVibes!',
      error: 'Something went wrong',
    },
    account: {
      loggedInTitle: 'You are already logged in',
      loggedInText: 'Continue to the next step to fill in your details.',
      title: 'Create your profile',
      subtitle: 'Your account gives you access to the owner dashboard',
      email: 'E-mail *',
      emailPlaceholder: 'you@email.com',
      password: 'Password *',
      passwordPlaceholder: 'Minimum 6 characters',
      confirmPassword: 'Confirm password *',
      confirmPasswordPlaceholder: 'Repeat password',
      mismatch: 'The passwords do not match',
      acceptTermsPrefix: 'I accept the',
      termsLink: 'terms and conditions',
      acceptPrivacyPrefix: 'I have read the',
      privacyLink: 'privacy policy',
    },
    intro: {
      title: 'Welcome to',
      text: 'You are only a few minutes away from getting started with professional rental of your holiday home.',
      subtext: 'It only takes a few minutes — and you are not committed to anything until you choose it yourself.',
      badges: ['Only takes 5 min', 'No obligation', 'Free setup'],
      help: 'Questions along the way? We are ready to help you.',
    },
    owner: {
      title: 'Your details',
      subtitle: 'So we can contact you about your holiday home',
      fullName: 'Full name *',
      fullNamePlaceholder: 'Anders Jensen',
      phone: 'Phone *',
      address: 'Address',
      addressPlaceholder: 'Your home address',
      postal: 'Postal code',
      city: 'City',
      preferredContact: 'Preferred contact method',
      email: 'E-mail',
      phoneOption: 'Phone',
    },
    property: {
      title: 'Your holiday home',
      subtitle: 'Tell us about your property — you can always edit this later',
      address: 'Property address *',
      addressPlaceholder: 'Strandvejen 42, 6800 Varde',
      region: 'Region / Area *',
      type: 'Property type *',
      sleeps: 'Sleeps',
      rooms: 'Rooms',
      bathrooms: 'Bathrooms',
      hasKeybox: 'Do you have a key box?',
      rentalExperience: 'Rental experience?',
      facilities: 'Special facilities',
      existingLink: 'Link to existing listing (optional)',
      regions: [
        { value: 'Nordjylland', label: 'North Jutland' },
        { value: 'Midtjylland', label: 'Central Jutland' },
        { value: 'Syddanmark', label: 'Southern Denmark' },
        { value: 'Sjælland', label: 'Zealand' },
        { value: 'Hovedstaden', label: 'Capital Region' },
        { value: 'Bornholm', label: 'Bornholm' },
      ],
      types: [
        { value: 'Sommerhus', label: 'Holiday home' },
        { value: 'Feriehus', label: 'Vacation home' },
        { value: 'Lejlighed', label: 'Apartment' },
        { value: 'Villa', label: 'Villa' },
        { value: 'Poolhus', label: 'Pool house' },
        { value: 'Luksushus', label: 'Luxury home' },
      ],
      facilitiesList: [
        { value: 'Pool', label: 'Pool' },
        { value: 'Spa / Jacuzzi', label: 'Spa / Jacuzzi' },
        { value: 'Sauna', label: 'Sauna' },
        { value: 'Havudsigt', label: 'Sea view' },
        { value: 'Pejs / Brændeovn', label: 'Fireplace / Wood stove' },
        { value: 'Aktivitetsrum', label: 'Activity room' },
        { value: 'Stor have', label: 'Large garden' },
        { value: 'Grill / Udekøkken', label: 'Grill / Outdoor kitchen' },
        { value: 'Carport / Garage', label: 'Carport / Garage' },
        { value: 'Husdyr tilladt', label: 'Pets allowed' },
      ],
    },
    rental: {
      title: 'Your rental',
      subtitle: 'Tell us a bit about your wishes and needs',
      startTime: 'When would you like to get started?',
      startOptions: [
        { value: 'asap', label: 'As soon as possible' },
        { value: '1-2months', label: 'Within 1-2 months' },
        { value: 'next-season', label: 'Next season' },
        { value: 'exploring', label: 'Still exploring' },
      ],
      helpLevel: 'Do you want full management? *',
      helpOptions: [
        { value: 'full', label: 'Yes — you handle everything', desc: 'SommerVibes handles guests, keys, cleaning and marketing' },
        { value: 'partial', label: 'Partly — I want to handle some things myself', desc: 'For example key handover or cleaning' },
        { value: 'unsure', label: 'Not sure yet', desc: 'We will find the best solution together' },
      ],
      selfManage: 'What would you like to handle yourself?',
      selfManageOptions: [
        { value: 'Nøgleoverdragelse', label: 'Key handover' },
        { value: 'Rengøring', label: 'Cleaning' },
        { value: 'Gæstekontakt', label: 'Guest contact' },
        { value: 'Kalender', label: 'Calendar' },
      ],
      cleaning: 'Cleaning solution?',
      cleaningOptions: [
        { value: 'yes', label: 'Yes, my own' },
        { value: 'no', label: 'No, need help' },
      ],
      ready: 'Ready to rent out?',
      readyOptions: [
        { value: 'yes', label: 'Yes' },
        { value: 'no', label: 'Not yet' },
      ],
      services: 'Which services are most relevant?',
      servicesOptions: [
        { value: 'Professionelle billeder', label: 'Professional photos' },
        { value: 'Gæstekommunikation', label: 'Guest communication' },
        { value: 'Rengøringskoordinering', label: 'Cleaning coordination' },
        { value: 'Nøgleboks-opsætning', label: 'Key box setup' },
        { value: 'Portal-markedsføring', label: 'Portal marketing' },
        { value: 'Kalendersynkronisering', label: 'Calendar sync' },
      ],
    },
    review: {
      title: 'Review the partnership',
      subtitle: 'Here are the key points about our partnership — in clear language',
      sections: [
        {
          title: 'What SommerVibes handles',
          items: ['Professional marketing on Airbnb, Booking.com and our own channels', 'Complete guest communication and support', 'Coordination of cleaning and preparation', 'Key box setup and access management', 'Price optimization and calendar management'],
        },
        {
          title: 'What you can handle yourself',
          items: ['Choose when your home is available', 'Block dates for personal use', 'Follow bookings and earnings via the dashboard', 'Communicate directly with guests if desired'],
        },
        {
          title: 'Finance & payout',
          items: ['15% commission on completed bookings', 'The guest pays a 5% service fee on top', 'Transparent monthly payouts', 'Full financial overview in the owner dashboard'],
        },
        {
          title: 'Terms',
          items: ['6-month commitment period', 'After that, cancellation with 30 days notice', 'GDPR-secure handling of all data', 'Insurance coverage for sudden damage'],
        },
      ],
      commission: 'commission',
      commissionNote: 'No setup fee · No hidden fees · You only pay on bookings',
    },
    sign: {
      title: 'Sign the agreement',
      subtitle: 'Confirm your partnership with SommerVibes',
      summary: 'Summary',
      owner: 'Owner',
      home: 'Home',
      address: 'Address',
      commission: 'Commission',
      binding: 'Commitment',
      bindingValue: '6 months',
      signature: 'Your signature (full name) *',
      signaturePlaceholder: 'Write your full name as signature',
      date: 'Date',
      agreement: 'I accept the management agreement with SommerVibes, including 15% commission and a 6-month commitment. *',
      marketing: 'Yes, I would like to receive news and rental tips (optional)',
      ready: 'Ready to sign',
    },
    confirmation: {
      title: 'Welcome to',
      thanks: 'Thank you for signing up, {name} — we look forward to working together!',
      ownerFallback: 'owner',
      emailConfirm: 'Check your email to confirm your account ✉️',
      whatsNext: 'What happens next?',
      timeline: [
        { title: 'We contact you', desc: 'We agree on the next step and answer your questions', time: '1-2 days' },
        { title: 'We visit the property', desc: 'Review of practical details — key box, photos and preparation', time: '3-7 days' },
        { title: 'We prepare your listing', desc: 'Professional content, copy and price optimization', time: '1-2 weeks' },
        { title: 'Access to your dashboard', desc: 'Follow everything digitally — bookings, calendar and communication', time: 'Immediately' },
        { title: 'Your home goes live', desc: 'You can start receiving bookings and earnings', time: 'When ready' },
      ],
      dashboard: 'Go to owner dashboard',
      bookCall: 'Book startup call',
      downloadApp: 'Download app',
    },
  },
} as const;

type GetStartedCopy = typeof GET_STARTED_COPY.da;

// ─── Helpers ─────────────────────────────────────────────────

const RadioCards = ({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: ReadonlyArray<ChoiceOption> }) => (
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

const ToggleChips = ({ options, selected, onToggle }: { options: ReadonlyArray<ChoiceOption>; selected: string[]; onToggle: (v: string) => void }) => (
  <div className="grid grid-cols-2 gap-2 mt-2">
    {options.map(f => (
      <button key={f.value} type="button" onClick={() => onToggle(f.value)}
        className={`flex items-center gap-2 p-2.5 rounded-xl border text-sm transition-all text-left ${
          selected.includes(f.value) ? 'border-primary bg-primary/10 text-primary' : 'border-border/30 text-muted-foreground hover:border-primary/20'
        }`}>
        <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
          selected.includes(f.value) ? 'bg-primary border-primary' : 'border-border'
        }`}>
          {selected.includes(f.value) && <Check className="w-2.5 h-2.5 text-primary-foreground" />}
        </div>
        {f.label}
      </button>
    ))}
  </div>
);

const StepIndicator = memo(function StepIndicator({ step, labels }: { step: number; labels: ReadonlyArray<string> }) {
  return (
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
              }`}>{labels[i]}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`w-4 md:w-8 lg:w-12 h-px mx-1 md:mx-2 ${done ? 'bg-primary/40' : 'bg-border/30'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
});

const isAccountDraftValid = (draft: AccountStepDraft) =>
  !!(
    draft.email.trim() &&
    draft.password.length >= 6 &&
    draft.password === draft.passwordConfirm &&
    draft.acceptTerms &&
    draft.acceptPrivacy
  );

function AccountStep({
  user,
  initialData,
  onDraftChange,
  onValidityChange,
  copy,
}: {
  user: SupabaseUser | null;
  initialData: AccountStepDraft;
  onDraftChange: (draft: AccountStepDraft) => void;
  onValidityChange: (valid: boolean) => void;
  copy: GetStartedCopy['account'];
}) {
  const [draft, setDraft] = useState<AccountStepDraft>(initialData);
  const validityRef = useRef<boolean | null>(null);

  const publishDraft = useCallback((nextDraft: AccountStepDraft) => {
    onDraftChange(nextDraft);

    const nextValid = user ? true : isAccountDraftValid(nextDraft);
    if (validityRef.current !== nextValid) {
      validityRef.current = nextValid;
      onValidityChange(nextValid);
    }
  }, [onDraftChange, onValidityChange, user]);

  useEffect(() => {
    publishDraft(draft);
  }, [draft, publishDraft]);

  const updateDraft = useCallback((updates: Partial<AccountStepDraft>) => {
    setDraft((previous) => {
      const nextDraft = { ...previous, ...updates };
      publishDraft(nextDraft);
      return nextDraft;
    });
  }, [publishDraft]);

  if (user) {
    return (
      <div className="max-w-md mx-auto text-center">
        <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-7 h-7 text-accent" />
        </div>
        <h2 className="font-display text-2xl font-bold text-foreground mb-2">{copy.loggedInTitle}</h2>
        <p className="text-muted-foreground text-sm mb-4">{user.email}</p>
        <p className="text-muted-foreground/60 text-xs">{copy.loggedInText}</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="text-center mb-8">
        <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-2">{copy.title}</h2>
        <p className="text-muted-foreground text-sm">{copy.subtitle}</p>
      </div>
      <Card className="border-border/40 bg-card/40 backdrop-blur-sm">
        <CardContent className="p-5 md:p-7 space-y-5">
          <div>
            <Label className="text-foreground font-medium text-sm">{copy.email}</Label>
            <Input type="email" placeholder={copy.emailPlaceholder} value={draft.email}
              onChange={e => updateDraft({ email: e.target.value })} className="mt-1.5 bg-background/50" />
          </div>
          <div>
            <Label className="text-foreground font-medium text-sm">{copy.password}</Label>
            <Input type="password" placeholder={copy.passwordPlaceholder} value={draft.password}
              onChange={e => updateDraft({ password: e.target.value })} className="mt-1.5 bg-background/50" />
          </div>
          <div>
            <Label className="text-foreground font-medium text-sm">{copy.confirmPassword}</Label>
            <Input type="password" placeholder={copy.confirmPasswordPlaceholder} value={draft.passwordConfirm}
              onChange={e => updateDraft({ passwordConfirm: e.target.value })} className="mt-1.5 bg-background/50" />
            {draft.passwordConfirm && draft.password !== draft.passwordConfirm && (
              <p className="text-destructive text-xs mt-1">{copy.mismatch}</p>
            )}
          </div>
          <div className="space-y-3 pt-2">
            <div className="flex items-start gap-3">
              <Checkbox id="terms" checked={draft.acceptTerms}
                onCheckedChange={(c) => updateDraft({ acceptTerms: c === true })} className="mt-0.5" />
              <label htmlFor="terms" className="text-sm text-muted-foreground cursor-pointer leading-relaxed">
                {copy.acceptTermsPrefix} <span className="text-primary underline" onClick={(e) => { e.preventDefault(); window.open('/terms', '_blank'); }}>{copy.termsLink}</span> *
              </label>
            </div>
            <div className="flex items-start gap-3">
              <Checkbox id="privacy" checked={draft.acceptPrivacy}
                onCheckedChange={(c) => updateDraft({ acceptPrivacy: c === true })} className="mt-0.5" />
              <label htmlFor="privacy" className="text-sm text-muted-foreground cursor-pointer leading-relaxed">
                {copy.acceptPrivacyPrefix} <span className="text-primary underline" onClick={(e) => { e.preventDefault(); window.open('/privacy', '_blank'); }}>{copy.privacyLink}</span> *
              </label>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Component ───────────────────────────────────────────────

export default function GetStarted() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { language } = useTranslation();
  const copy = (language === 'da' ? GET_STARTED_COPY.da : GET_STARTED_COPY.en) as GetStartedCopy;
  const leadSource = new URLSearchParams(location.search).get('source') || 'website_onboarding';
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
  const accountDraftRef = useRef<AccountStepDraft>({
    email: data.email,
    password: data.password,
    passwordConfirm: data.passwordConfirm,
    acceptTerms: data.acceptTerms,
    acceptPrivacy: data.acceptPrivacy,
  });
  const [isAccountStepValid, setIsAccountStepValid] = useState(false);

  const update = useCallback((u: Partial<OnboardingData>) => setData(p => ({ ...p, ...u })), []);
  const handleAccountDraftChange = useCallback((draft: AccountStepDraft) => {
    accountDraftRef.current = draft;
  }, []);
  const handleAccountValidityChange = useCallback((valid: boolean) => {
    setIsAccountStepValid(valid);
  }, []);
  const getRegionLabel = useCallback((value: string) => copy.property.regions.find((option) => option.value === value)?.label || value, [copy]);
  const getPropertyTypeLabel = useCallback((value: string) => copy.property.types.find((option) => option.value === value)?.label || value, [copy]);
  const toggleList = (key: 'facilities' | 'selfManage' | 'relevantServices', val: string) => {
    setData(p => ({ ...p, [key]: p[key].includes(val) ? p[key].filter(x => x !== val) : [...p[key], val] }));
  };

  const canNext = (): boolean => {
    switch (step) {
      case 1: return true;
      case 2: return user ? true : isAccountStepValid;
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
      await completeGetStartedOnboarding({ ...data, leadSource }, user);
      setStep(8);
      toast.success(copy.messages.success);
    } catch (err: unknown) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : copy.messages.error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const next = () => {
    if (step === 7) {
      handleSubmit();
    } else if (step < 8) {
      if (step === 2 && !user) {
        setData(p => ({ ...p, ...accountDraftRef.current }));
      }
      setStep(s => s + 1);
    }
  };

  // ─── Step 1: Start ──────────────────────────────────────

  const Step1 = () => (
    <div className="max-w-xl mx-auto text-center">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-8">
          <Heart className="w-8 h-8 text-primary" />
        </div>
        <h2 className="font-display text-3xl md:text-5xl font-bold text-foreground mb-4">
          {copy.intro.title} <span className="text-primary italic">SommerVibes</span>
        </h2>
        <p className="text-muted-foreground text-lg leading-relaxed mb-3 max-w-md mx-auto">
          {copy.intro.text}
        </p>
        <p className="text-muted-foreground/60 text-sm mb-10">
          {copy.intro.subtext}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          {[
            { icon: Clock, text: copy.intro.badges[0] },
            { icon: Shield, text: copy.intro.badges[1] },
            { icon: Star, text: copy.intro.badges[2] },
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
          {copy.intro.help}
        </div>
      </motion.div>
    </div>
  );

  // ─── Step 2: Create Account ─────────────────────────────

  const Step2 = () => {
    return (
      <AccountStep
        user={user}
        initialData={accountDraftRef.current}
        onDraftChange={handleAccountDraftChange}
        onValidityChange={handleAccountValidityChange}
        copy={copy.account}
      />
    );
  };

  // ─── Step 3: Owner Details ──────────────────────────────

  const Step3 = () => (
    <div className="max-w-xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-2">{copy.owner.title}</h2>
        <p className="text-muted-foreground text-sm">{copy.owner.subtitle}</p>
      </div>
      <Card className="border-border/40 bg-card/40 backdrop-blur-sm">
        <CardContent className="p-5 md:p-7 space-y-5">
          <div>
            <Label className="text-foreground font-medium text-sm">{copy.owner.fullName}</Label>
            <Input placeholder={copy.owner.fullNamePlaceholder} value={data.ownerName}
              onChange={e => update({ ownerName: e.target.value })} className="mt-1.5 bg-background/50" />
          </div>
          <div>
            <Label className="text-foreground font-medium text-sm">{copy.owner.phone}</Label>
            <Input type="tel" placeholder="+45 12 34 56 78" value={data.ownerPhone}
              onChange={e => update({ ownerPhone: e.target.value })} className="mt-1.5 bg-background/50" />
          </div>
          <div>
            <Label className="text-foreground font-medium text-sm">{copy.owner.address}</Label>
            <Input placeholder={copy.owner.addressPlaceholder} value={data.ownerAddress}
              onChange={e => update({ ownerAddress: e.target.value })} className="mt-1.5 bg-background/50" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-foreground font-medium text-sm">{copy.owner.postal}</Label>
              <Input placeholder="8000" value={data.ownerPostal}
                onChange={e => update({ ownerPostal: e.target.value })} className="mt-1.5 bg-background/50" />
            </div>
            <div>
              <Label className="text-foreground font-medium text-sm">{copy.owner.city}</Label>
              <Input placeholder="Aarhus" value={data.ownerCity}
                onChange={e => update({ ownerCity: e.target.value })} className="mt-1.5 bg-background/50" />
            </div>
          </div>
          <div>
            <Label className="text-foreground font-medium text-sm mb-2 block">{copy.owner.preferredContact}</Label>
            <RadioGroup value={data.preferredContact} onValueChange={v => update({ preferredContact: v })} className="flex gap-4">
              {[
                { value: 'email', label: copy.owner.email, icon: Mail },
                { value: 'phone', label: copy.owner.phoneOption, icon: Phone },
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
        <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-2">{copy.property.title}</h2>
        <p className="text-muted-foreground text-sm">{copy.property.subtitle}</p>
      </div>
      <Card className="border-border/40 bg-card/40 backdrop-blur-sm">
        <CardContent className="p-5 md:p-7 space-y-5">
          <div>
            <Label className="text-foreground font-medium text-sm">{copy.property.address}</Label>
            <Input placeholder={copy.property.addressPlaceholder} value={data.propertyAddress}
              onChange={e => update({ propertyAddress: e.target.value })} className="mt-1.5 bg-background/50" />
          </div>

          <div>
            <Label className="text-foreground font-medium text-sm">{copy.property.region}</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
              {copy.property.regions.map(r => (
                <button key={r.value} type="button" onClick={() => update({ region: r.value })}
                  className={`p-2.5 rounded-xl border text-left text-sm transition-all ${
                    data.region === r.value ? 'border-primary bg-primary/10 text-primary font-medium' : 'border-border/40 hover:border-primary/30 text-muted-foreground'
                  }`}>
                  <MapPin className="w-3 h-3 inline mr-1 opacity-60" />{r.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-foreground font-medium text-sm">{copy.property.type}</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
              {copy.property.types.map(t => (
                <button key={t.value} type="button" onClick={() => update({ propertyType: t.value })}
                  className={`p-2.5 rounded-xl border text-sm transition-all ${
                    data.propertyType === t.value ? 'border-primary bg-primary/10 text-primary font-medium' : 'border-border/40 hover:border-primary/30 text-muted-foreground'
                  }`}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label className="text-foreground font-medium text-sm flex items-center gap-1.5">
                <Users className="w-3 h-3 text-muted-foreground" /> {copy.property.sleeps}
              </Label>
              <Input type="number" min={1} max={20} value={data.capacity}
                onChange={e => update({ capacity: parseInt(e.target.value) || 1 })} className="mt-1.5 bg-background/50" />
            </div>
            <div>
              <Label className="text-foreground font-medium text-sm flex items-center gap-1.5">
                <Bed className="w-3 h-3 text-muted-foreground" /> {copy.property.rooms}
              </Label>
              <Input type="number" min={1} max={10} value={data.bedrooms}
                onChange={e => update({ bedrooms: parseInt(e.target.value) || 1 })} className="mt-1.5 bg-background/50" />
            </div>
            <div>
              <Label className="text-foreground font-medium text-sm flex items-center gap-1.5">
                <Bath className="w-3 h-3 text-muted-foreground" /> {copy.property.bathrooms}
              </Label>
              <Input type="number" min={1} max={5} value={data.bathrooms}
                onChange={e => update({ bathrooms: parseInt(e.target.value) || 1 })} className="mt-1.5 bg-background/50" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-foreground font-medium text-sm flex items-center gap-1.5">
                <Key className="w-3 h-3 text-muted-foreground" /> {copy.property.hasKeybox}
              </Label>
              <RadioCards value={data.hasKeybox} onChange={v => update({ hasKeybox: v })} options={[
                { value: 'yes', label: copy.common.yes }, { value: 'no', label: copy.common.no },
              ]} />
            </div>
            <div>
              <Label className="text-foreground font-medium text-sm flex items-center gap-1.5">
                <Globe className="w-3 h-3 text-muted-foreground" /> {copy.property.rentalExperience}
              </Label>
              <RadioCards value={data.hasExperience} onChange={v => update({ hasExperience: v })} options={[
                { value: 'yes', label: copy.common.yes }, { value: 'no', label: copy.common.no },
              ]} />
            </div>
          </div>

          <div>
            <Label className="text-foreground font-medium text-sm">{copy.property.facilities}</Label>
            <ToggleChips options={copy.property.facilitiesList} selected={data.facilities} onToggle={(v) => toggleList('facilities', v)} />
          </div>

          <div>
            <Label className="text-foreground font-medium text-sm">{copy.property.existingLink}</Label>
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
        <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-2">{copy.rental.title}</h2>
        <p className="text-muted-foreground text-sm">{copy.rental.subtitle}</p>
      </div>
      <Card className="border-border/40 bg-card/40 backdrop-blur-sm">
        <CardContent className="p-5 md:p-7 space-y-6">
          <div>
            <Label className="text-foreground font-medium text-sm">{copy.rental.startTime}</Label>
            <RadioCards value={data.startTime} onChange={v => update({ startTime: v })} options={copy.rental.startOptions} />
          </div>

          <div>
            <Label className="text-foreground font-medium text-sm">{copy.rental.helpLevel}</Label>
            <RadioCards value={data.helpLevel} onChange={v => update({ helpLevel: v })} options={copy.rental.helpOptions} />
          </div>

          {data.helpLevel === 'partial' && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
              <Label className="text-foreground font-medium text-sm">{copy.rental.selfManage}</Label>
              <ToggleChips options={copy.rental.selfManageOptions} selected={data.selfManage} onToggle={(v) => toggleList('selfManage', v)} />
            </motion.div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-foreground font-medium text-sm flex items-center gap-1.5">
                <Brush className="w-3 h-3 text-muted-foreground" /> {copy.rental.cleaning}
              </Label>
              <RadioCards value={data.hasCleaning} onChange={v => update({ hasCleaning: v })} options={copy.rental.cleaningOptions} />
            </div>
            <div>
              <Label className="text-foreground font-medium text-sm flex items-center gap-1.5">
                <CalendarCheck className="w-3 h-3 text-muted-foreground" /> {copy.rental.ready}
              </Label>
              <RadioCards value={data.propertyReady} onChange={v => update({ propertyReady: v })} options={copy.rental.readyOptions} />
            </div>
          </div>

          <div>
            <Label className="text-foreground font-medium text-sm">{copy.rental.services}</Label>
            <ToggleChips options={copy.rental.servicesOptions} selected={data.relevantServices} onToggle={(v) => toggleList('relevantServices', v)} />
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // ─── Step 6: Agreement Review ───────────────────────────

  const Step6 = () => {
    const sectionIcons = [Sparkles, User, Wallet, Shield];
    const sections = copy.review.sections.map((section, index) => ({ ...section, icon: sectionIcons[index] }));

    return (
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-2">{copy.review.title}</h2>
          <p className="text-muted-foreground text-sm">{copy.review.subtitle}</p>
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
            <span className="text-muted-foreground text-sm">{copy.review.commission}</span>
          </div>
          <p className="text-muted-foreground text-xs">{copy.review.commissionNote}</p>
        </motion.div>
      </div>
    );
  };

  // ─── Step 7: Sign Agreement ─────────────────────────────

  const Step7 = () => (
    <div className="max-w-xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-2">{copy.sign.title}</h2>
        <p className="text-muted-foreground text-sm">{copy.sign.subtitle}</p>
      </div>

      <Card className="border-border/40 bg-card/40 backdrop-blur-sm">
        <CardContent className="p-5 md:p-7 space-y-5">
          {/* Auto-filled summary */}
          <div className="p-4 rounded-xl bg-muted/20 border border-border/20 space-y-2">
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-2">{copy.sign.summary}</p>
            {[
              [copy.sign.owner, data.ownerName || copy.common.dash],
              ['E-mail', data.email || user?.email || copy.common.dash],
              [copy.sign.home, `${data.propertyType ? getPropertyTypeLabel(data.propertyType) : copy.common.dash} ${copy.common.in} ${data.region ? getRegionLabel(data.region) : copy.common.dash}`],
              [copy.sign.address, data.propertyAddress || copy.common.dash],
              [copy.sign.commission, '15%'],
              [copy.sign.binding, copy.sign.bindingValue],
            ].map(([label, value], i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-muted-foreground">{label}</span>
                <span className={`text-foreground font-medium ${label === copy.sign.commission ? 'text-primary' : ''}`}>{value}</span>
              </div>
            ))}
          </div>

          {/* Signature */}
          <div>
            <Label className="text-foreground font-medium text-sm">{copy.sign.signature}</Label>
            <Input placeholder={copy.sign.signaturePlaceholder} value={data.signatureName}
              onChange={e => update({ signatureName: e.target.value })}
              className="mt-1.5 bg-background/50 font-display italic text-lg" />
          </div>

          <div>
            <Label className="text-foreground font-medium text-sm">{copy.sign.date}</Label>
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
                {copy.sign.agreement}
              </label>
            </div>
            <div className="flex items-start gap-3">
              <Checkbox id="marketing" checked={data.acceptMarketing}
                onCheckedChange={(c) => update({ acceptMarketing: c === true })} className="mt-0.5" />
              <label htmlFor="marketing" className="text-sm text-muted-foreground cursor-pointer leading-relaxed">
                {copy.sign.marketing}
              </label>
            </div>
          </div>

          {data.acceptAgreement && data.signatureName.trim().length > 2 && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
              className="p-3 rounded-xl bg-accent/5 border border-accent/15 text-center">
              <p className="text-accent text-sm font-medium">
                ✓ {copy.sign.ready} — "{data.signatureName}"
              </p>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  // ─── Step 8: Confirmation ───────────────────────────────

  const Step8 = () => {
    const timelineIcons = [Phone, Home, Camera, Globe, Star];
    const timeline = copy.confirmation.timeline.map((item, index) => ({ ...item, icon: timelineIcons[index] }));
    const firstName = data.ownerName.split(' ')[0] || copy.confirmation.ownerFallback;

    return (
      <div className="max-w-2xl mx-auto text-center">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6 }}>
          <div className="w-20 h-20 rounded-full bg-accent/10 border-2 border-accent/30 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-accent" />
          </div>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-3">
            {copy.confirmation.title} <span className="text-primary italic">SommerVibes</span>
          </h2>
          <p className="text-muted-foreground text-lg mb-2">
            {copy.confirmation.thanks.replace('{name}', firstName)}
          </p>
          {!user && (
            <p className="text-primary text-sm font-medium mb-8">
              {copy.confirmation.emailConfirm}
            </p>
          )}
        </motion.div>

        {/* Visual timeline */}
        <div className="text-left mt-10 mb-10">
          <h3 className="font-display text-lg font-semibold text-foreground mb-6 text-center">{copy.confirmation.whatsNext}</h3>
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
            {copy.confirmation.dashboard} <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Button>
          <Button variant="outline" size="lg" className="border-border text-muted-foreground gap-2" onClick={() => navigate('/book-vurdering')}>
            <PhoneCall className="w-4 h-4" /> {copy.confirmation.bookCall}
          </Button>
          <Button variant="outline" size="lg" className="border-border text-muted-foreground gap-2" onClick={() => navigate('/app')}>
            <Download className="w-4 h-4" /> {copy.confirmation.downloadApp}
          </Button>
        </div>
      </div>
    );
  };

  // ─── Render ──────────────────────────────────────────────

  const buttonLabel = () => {
    if (step === 1) return copy.common.getStarted;
    if (step === 7) return isSubmitting ? copy.common.creating : copy.common.signAndStart;
    return copy.common.next;
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
            <span className="text-sm font-medium hidden sm:inline">{copy.common.close}</span>
          </button>
          <span className="font-display text-lg font-bold text-primary">SommerVibes</span>
          <div className="w-16" />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-4 py-6 md:py-10">
          {step > 1 && step < 8 && <StepIndicator step={step} labels={copy.steps} />}
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
              <ArrowLeft className="h-4 w-4" /> {copy.common.back}
            </Button>
            <span className="text-xs text-muted-foreground/50 hidden sm:block">{copy.common.step} {step} {copy.common.of} 7</span>
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
