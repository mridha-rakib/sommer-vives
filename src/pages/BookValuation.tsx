import { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { Phone, Mail, CheckCircle2, ArrowRight, Clock, Shield, Star, Home, MapPin, TrendingUp, Users, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import type { Locale } from 'date-fns';
import { da, de, enUS, nl } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { createRentalCheckLead } from '@/lib/rental-check-api';
import { useTranslation, type Language } from '@/lib/i18n';

const regionValues = [
  'Nordsjælland',
  'Vestsjælland',
  'Sydsjælland & Møn',
  'Fyn & Øerne',
  'Østjylland',
  'Vestjylland',
  'Nordjylland',
  'Sønderjylland',
  'Bornholm',
];

const benefitIcons = [Shield, Home, Star, Clock];
const reasonIcons = [TrendingUp, Eye, Users, Shield];

const propertyTypeValues = [
  { value: 'sommerhus', labels: { da: 'Sommerhus', en: 'Holiday home', de: 'Ferienhaus', nl: 'Vakantiehuis' } },
  { value: 'feriebolig', labels: { da: 'Feriebolig', en: 'Vacation property', de: 'Ferienunterkunft', nl: 'Vakantiewoning' } },
  { value: 'lejlighed', labels: { da: 'Ferielejlighed', en: 'Holiday apartment', de: 'Ferienwohnung', nl: 'Vakantieappartement' } },
  { value: 'luksus', labels: { da: 'Luksusvilla', en: 'Luxury villa', de: 'Luxusvilla', nl: 'Luxe villa' } },
  { value: 'bondehus', labels: { da: 'Bondehus / Gård', en: 'Farmhouse / estate', de: 'Bauernhaus / Hof', nl: 'Boerderij / landgoed' } },
];

const dateLocales: Record<Language, Locale> = { da, en: enUS, de, nl };

const copy = {
  da: {
    regions: ['Nordsjælland', 'Vestsjælland', 'Sydsjælland & Møn', 'Fyn & Øerne', 'Østjylland', 'Vestjylland', 'Nordjylland', 'Sønderjylland', 'Bornholm'],
    benefits: ['100% gratis & uforpligtende', 'Vi kører ud til dig', 'Individuel prisanalyse', 'Svar inden 24 timer'],
    reasons: [
      { title: 'Konkret vurdering', desc: 'Få et realistisk billede af dit sommerhus\' udlejningspotentiale baseret på lokale markedsdata.' },
      { title: 'Indblik i indtjening', desc: 'Vi gennemgår forventet omsætning, sæsonmønstre og optimeringsmuligheder for dit hus.' },
      { title: 'Personlig sparring', desc: 'Mød en rådgiver der kender markedet og kan svare på alle dine spørgsmål — ansigt til ansigt.' },
      { title: 'Helt uforpligtende', desc: 'Der er ingen bindinger, ingen skjulte gebyrer. Du bestemmer selv om du vil gå videre.' },
    ],
    requiredError: 'Udfyld venligst alle påkrævede felter',
    successToast: 'Din anmodning er modtaget! Vi kontakter dig inden 24 timer.',
    errorToast: 'Noget gik galt. Prøv igen eller ring til os.',
    submittedTitle: 'Tak for din henvendelse!',
    submittedText: 'Vi kontakter dig inden 24 timer for at aftale en tid til dit gratis udlejningstjek.',
    submittedButton: 'Book endnu et udlejningstjek',
    eyebrow: 'Gratis & uforpligtende',
    titlePrefix: 'Få et gratis',
    titleAccent: 'udlejningstjek',
    subtitle: 'Vi kører ud til dig og vurderer dit sommerhus\' udlejningspotentiale — helt gratis og uforpligtende. Få et konkret overblik over forventet indtjening.',
    formTitle: 'Udfyld dine oplysninger',
    formSubtitle: 'Vi kontakter dig inden 24 timer for at aftale en tid.',
    name: 'Fulde navn *',
    namePlaceholder: 'Dit navn',
    phone: 'Telefon *',
    phonePlaceholder: '+45 12 34 56 78',
    email: 'Email *',
    emailPlaceholder: 'din@email.dk',
    address: 'Sommerhusets adresse *',
    addressPlaceholder: 'Strandvej 42, 3100 Hornbæk',
    area: 'Område *',
    areaPlaceholder: 'Vælg område',
    propertyType: 'Boligtype',
    propertyTypePlaceholder: 'Vælg type',
    message: 'Besked',
    optional: 'valgfrit',
    messagePlaceholder: 'Fortæl os om dit hus…',
    sending: 'Sender...',
    submit: 'Book gratis udlejningstjek',
    privacyPrefix: 'Ved at indsende accepterer du vores',
    privacy: 'privatlivspolitik',
    calendarTitle: 'Vælg ønsket dato',
    calendarSubtitle: 'Vi tilpasser os din kalender',
    selectedDateFormat: 'EEEE d. MMMM yyyy',
    confirmByPhone: 'Vi bekræfter tidspunkt per telefon',
    contactDirect: 'Kontakt os direkte',
    whyTitle: 'Derfor er et udlejningstjek en god idé',
    whySubtitle: 'Et gratis udlejningstjek giver dig et solidt beslutningsgrundlag — uden bindinger.',
    coverageTitle: 'Vi dækker hele Danmark',
    coverageSubtitle: 'Fra Skagen til Rømø — vi kører ud uanset beliggenhed.',
    faqTitle: 'Ofte stillede spørgsmål',
    faq: [
      ['Hvad indebærer et udlejningstjek?', 'Vi besøger dit sommerhus, vurderer stand og beliggenhed, og giver dig en konkret vurdering af udlejningspotentiale og forventet indtjening.'],
      ['Er det virkelig helt gratis?', 'Ja. Udlejningstjekket er 100% gratis og uforpligtende. Du bestemmer selv om du vil gå videre bagefter.'],
      ['Hvornår kan I komme forbi?', 'Vi kontakter dig inden 24 timer og finder en dato der passer dig. Vi er fleksible og kører ud i hele Danmark.'],
    ],
    finalTitle: 'Lad os vurdere dit sommerhus',
    finalSubtitle: 'Book et gratis udlejningstjek eller kontakt os direkte — vi er klar til at hjælpe dig i gang.',
    finalSecondary: 'Udlej dit hus',
  },
  en: {
    regions: ['North Zealand', 'West Zealand', 'South Zealand & Mon', 'Funen & islands', 'East Jutland', 'West Jutland', 'North Jutland', 'Southern Jutland', 'Bornholm'],
    benefits: ['100% free & non-binding', 'We visit your property', 'Individual price analysis', 'Reply within 24 hours'],
    reasons: [
      { title: 'Concrete assessment', desc: 'Get a realistic view of your holiday home\'s rental potential based on local market data.' },
      { title: 'Revenue insight', desc: 'We review expected revenue, seasonal patterns and optimization opportunities for your home.' },
      { title: 'Personal guidance', desc: 'Meet an advisor who knows the market and can answer your questions face to face.' },
      { title: 'Completely non-binding', desc: 'No commitments, no hidden fees. You decide whether you want to continue.' },
    ],
    requiredError: 'Please fill in all required fields',
    successToast: 'Your request has been received. We will contact you within 24 hours.',
    errorToast: 'Something went wrong. Please try again or call us.',
    submittedTitle: 'Thank you for your request!',
    submittedText: 'We will contact you within 24 hours to schedule your free rental check.',
    submittedButton: 'Book another rental check',
    eyebrow: 'Free & non-binding',
    titlePrefix: 'Get a free',
    titleAccent: 'rental check',
    subtitle: 'We visit you and assess your holiday home\'s rental potential — completely free and non-binding. Get a concrete overview of expected earnings.',
    formTitle: 'Fill in your information',
    formSubtitle: 'We will contact you within 24 hours to arrange an appointment.',
    name: 'Full name *',
    namePlaceholder: 'Your name',
    phone: 'Phone *',
    phonePlaceholder: '+45 12 34 56 78',
    email: 'Email *',
    emailPlaceholder: 'your@email.dk',
    address: 'Address of the cottage *',
    addressPlaceholder: 'Strandvej 42, 3100 Hornbaek',
    area: 'Area *',
    areaPlaceholder: 'Select area',
    propertyType: 'Housing type',
    propertyTypePlaceholder: 'Select type',
    message: 'Message',
    optional: 'optional',
    messagePlaceholder: 'Tell us about your house...',
    sending: 'Sending...',
    submit: 'Book a free rental check',
    privacyPrefix: 'By submitting, you agree to our',
    privacy: 'privacy policy',
    calendarTitle: 'Select desired date',
    calendarSubtitle: 'We adapt to your calendar',
    selectedDateFormat: 'EEEE, MMMM d, yyyy',
    confirmByPhone: 'We confirm the time by phone',
    contactDirect: 'Contact us directly',
    whyTitle: 'Why a rental check is a good idea',
    whySubtitle: 'A free rental check gives you a solid decision basis — with no commitment.',
    coverageTitle: 'We cover all of Denmark',
    coverageSubtitle: 'From Skagen to Romo — we visit you no matter where the home is located.',
    faqTitle: 'Frequently asked questions',
    faq: [
      ['What does a rental check include?', 'We visit your holiday home, assess its condition and location, and give you a concrete assessment of rental potential and expected earnings.'],
      ['Is it really completely free?', 'Yes. The rental check is 100% free and non-binding. You decide whether you want to continue afterwards.'],
      ['When can you visit?', 'We contact you within 24 hours and find a date that suits you. We are flexible and cover all of Denmark.'],
    ],
    finalTitle: 'Let us assess your holiday home',
    finalSubtitle: 'Book a free rental check or contact us directly — we are ready to help you get started.',
    finalSecondary: 'Rent out your house',
  },
  de: {
    regions: ['Nordseeland', 'Westseeland', 'Südseeland & Møn', 'Fünen & Inseln', 'Ostjütland', 'Westjütland', 'Nordjütland', 'Südjütland', 'Bornholm'],
    benefits: ['100% kostenlos & unverbindlich', 'Wir besuchen Ihre Immobilie', 'Individuelle Preisanalyse', 'Antwort innerhalb von 24 Stunden'],
    reasons: [
      { title: 'Konkrete Bewertung', desc: 'Erhalten Sie eine realistische Einschätzung des Vermietungspotenzials Ihres Ferienhauses auf Basis lokaler Marktdaten.' },
      { title: 'Einblick in Einnahmen', desc: 'Wir prüfen erwartete Umsätze, Saisonmuster und Optimierungsmöglichkeiten für Ihr Haus.' },
      { title: 'Persönliche Beratung', desc: 'Treffen Sie einen Berater, der den Markt kennt und Ihre Fragen persönlich beantworten kann.' },
      { title: 'Völlig unverbindlich', desc: 'Keine Bindung, keine versteckten Gebühren. Sie entscheiden selbst, ob Sie fortfahren möchten.' },
    ],
    requiredError: 'Bitte füllen Sie alle Pflichtfelder aus',
    successToast: 'Ihre Anfrage wurde empfangen. Wir kontaktieren Sie innerhalb von 24 Stunden.',
    errorToast: 'Etwas ist schiefgelaufen. Bitte versuchen Sie es erneut oder rufen Sie uns an.',
    submittedTitle: 'Vielen Dank für Ihre Anfrage!',
    submittedText: 'Wir kontaktieren Sie innerhalb von 24 Stunden, um Ihren kostenlosen Vermietungscheck zu planen.',
    submittedButton: 'Weiteren Vermietungscheck buchen',
    eyebrow: 'Kostenlos & unverbindlich',
    titlePrefix: 'Erhalten Sie einen kostenlosen',
    titleAccent: 'Vermietungscheck',
    subtitle: 'Wir besuchen Sie und bewerten das Vermietungspotenzial Ihres Ferienhauses — völlig kostenlos und unverbindlich.',
    formTitle: 'Geben Sie Ihre Informationen ein',
    formSubtitle: 'Wir kontaktieren Sie innerhalb von 24 Stunden, um einen Termin zu vereinbaren.',
    name: 'Vollständiger Name *',
    namePlaceholder: 'Ihr Name',
    phone: 'Telefon *',
    phonePlaceholder: '+45 12 34 56 78',
    email: 'E-Mail *',
    emailPlaceholder: 'ihre@email.dk',
    address: 'Adresse des Ferienhauses *',
    addressPlaceholder: 'Strandvej 42, 3100 Hornbaek',
    area: 'Region *',
    areaPlaceholder: 'Region wählen',
    propertyType: 'Objekttyp',
    propertyTypePlaceholder: 'Typ wählen',
    message: 'Nachricht',
    optional: 'optional',
    messagePlaceholder: 'Erzählen Sie uns von Ihrem Haus...',
    sending: 'Wird gesendet...',
    submit: 'Kostenlosen Vermietungscheck buchen',
    privacyPrefix: 'Mit dem Absenden akzeptieren Sie unsere',
    privacy: 'Datenschutzerklärung',
    calendarTitle: 'Wunschtermin wählen',
    calendarSubtitle: 'Wir richten uns nach Ihrem Kalender',
    selectedDateFormat: 'EEEE, d. MMMM yyyy',
    confirmByPhone: 'Wir bestätigen die Uhrzeit telefonisch',
    contactDirect: 'Kontaktieren Sie uns direkt',
    whyTitle: 'Warum ein Vermietungscheck sinnvoll ist',
    whySubtitle: 'Ein kostenloser Vermietungscheck gibt Ihnen eine solide Entscheidungsgrundlage — ohne Bindung.',
    coverageTitle: 'Wir decken ganz Dänemark ab',
    coverageSubtitle: 'Von Skagen bis Rømø — wir kommen unabhängig von der Lage.',
    faqTitle: 'Häufig gestellte Fragen',
    faq: [
      ['Was beinhaltet ein Vermietungscheck?', 'Wir besuchen Ihr Ferienhaus, bewerten Zustand und Lage und geben Ihnen eine konkrete Einschätzung von Vermietungspotenzial und erwarteten Einnahmen.'],
      ['Ist es wirklich kostenlos?', 'Ja. Der Vermietungscheck ist 100% kostenlos und unverbindlich. Sie entscheiden danach selbst.'],
      ['Wann können Sie vorbeikommen?', 'Wir kontaktieren Sie innerhalb von 24 Stunden und finden einen passenden Termin. Wir sind flexibel und fahren in ganz Dänemark.'],
    ],
    finalTitle: 'Lassen Sie uns Ihr Ferienhaus bewerten',
    finalSubtitle: 'Buchen Sie einen kostenlosen Vermietungscheck oder kontaktieren Sie uns direkt — wir helfen Ihnen gern beim Start.',
    finalSecondary: 'Haus vermieten',
  },
  nl: {
    regions: ['Noord-Seeland', 'West-Seeland', 'Zuid-Seeland & Møn', 'Funen & eilanden', 'Oost-Jutland', 'West-Jutland', 'Noord-Jutland', 'Zuid-Jutland', 'Bornholm'],
    benefits: ['100% gratis & vrijblijvend', 'Wij bezoeken uw woning', 'Individuele prijsanalyse', 'Antwoord binnen 24 uur'],
    reasons: [
      { title: 'Concrete beoordeling', desc: 'Krijg een realistisch beeld van het verhuurpotentieel van uw vakantiehuis op basis van lokale marktdata.' },
      { title: 'Inzicht in inkomsten', desc: 'We bekijken verwachte omzet, seizoenspatronen en optimalisatiemogelijkheden voor uw huis.' },
      { title: 'Persoonlijk advies', desc: 'Ontmoet een adviseur die de markt kent en uw vragen persoonlijk kan beantwoorden.' },
      { title: 'Volledig vrijblijvend', desc: 'Geen verplichtingen, geen verborgen kosten. U beslist zelf of u verder wilt gaan.' },
    ],
    requiredError: 'Vul alle verplichte velden in',
    successToast: 'Uw aanvraag is ontvangen. Wij nemen binnen 24 uur contact met u op.',
    errorToast: 'Er is iets misgegaan. Probeer opnieuw of bel ons.',
    submittedTitle: 'Bedankt voor uw aanvraag!',
    submittedText: 'Wij nemen binnen 24 uur contact met u op om uw gratis verhuurcheck te plannen.',
    submittedButton: 'Nog een verhuurcheck boeken',
    eyebrow: 'Gratis & vrijblijvend',
    titlePrefix: 'Krijg een gratis',
    titleAccent: 'verhuurcheck',
    subtitle: 'Wij bezoeken u en beoordelen het verhuurpotentieel van uw vakantiehuis — volledig gratis en vrijblijvend.',
    formTitle: 'Vul uw gegevens in',
    formSubtitle: 'Wij nemen binnen 24 uur contact met u op om een afspraak te maken.',
    name: 'Volledige naam *',
    namePlaceholder: 'Uw naam',
    phone: 'Telefoon *',
    phonePlaceholder: '+45 12 34 56 78',
    email: 'E-mail *',
    emailPlaceholder: 'uw@email.dk',
    address: 'Adres van het vakantiehuis *',
    addressPlaceholder: 'Strandvej 42, 3100 Hornbaek',
    area: 'Regio *',
    areaPlaceholder: 'Kies regio',
    propertyType: 'Woningtype',
    propertyTypePlaceholder: 'Kies type',
    message: 'Bericht',
    optional: 'optioneel',
    messagePlaceholder: 'Vertel ons over uw huis...',
    sending: 'Verzenden...',
    submit: 'Gratis verhuurcheck boeken',
    privacyPrefix: 'Door te verzenden accepteert u ons',
    privacy: 'privacybeleid',
    calendarTitle: 'Gewenste datum kiezen',
    calendarSubtitle: 'Wij passen ons aan uw kalender aan',
    selectedDateFormat: 'EEEE d MMMM yyyy',
    confirmByPhone: 'Wij bevestigen het tijdstip telefonisch',
    contactDirect: 'Neem direct contact op',
    whyTitle: 'Waarom een verhuurcheck een goed idee is',
    whySubtitle: 'Een gratis verhuurcheck geeft u een solide basis voor uw beslissing — zonder verplichtingen.',
    coverageTitle: 'Wij dekken heel Denemarken',
    coverageSubtitle: 'Van Skagen tot Rømø — wij komen langs, ongeacht de locatie.',
    faqTitle: 'Veelgestelde vragen',
    faq: [
      ['Wat houdt een verhuurcheck in?', 'Wij bezoeken uw vakantiehuis, beoordelen staat en locatie en geven een concrete inschatting van verhuurpotentieel en verwachte inkomsten.'],
      ['Is het echt helemaal gratis?', 'Ja. De verhuurcheck is 100% gratis en vrijblijvend. U beslist daarna zelf of u verder wilt.'],
      ['Wanneer kunnen jullie langskomen?', 'Wij nemen binnen 24 uur contact met u op en vinden een datum die past. Wij zijn flexibel en rijden door heel Denemarken.'],
    ],
    finalTitle: 'Laat ons uw vakantiehuis beoordelen',
    finalSubtitle: 'Boek een gratis verhuurcheck of neem direct contact op — wij helpen u graag op weg.',
    finalSecondary: 'Verhuur uw huis',
  },
};

export default function BookValuation() {
  const { language } = useTranslation();
  const [date, setDate] = useState<Date | undefined>();
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '', region: '', propertyType: '', message: '' });
  const c = copy[language];
  const dateLocale = dateLocales[language];
  const regionOptions = regionValues.map((value, index) => ({ value, label: c.regions[index] || value }));
  const benefits = c.benefits.map((label, index) => ({ icon: benefitIcons[index], label }));
  const reasons = c.reasons.map((reason, index) => ({ icon: reasonIcons[index], ...reason }));

  const { ref: heroRef, isInView: heroInView } = useScrollReveal();
  const { ref: formRef, isInView: formInView } = useScrollReveal();
  const { ref: whyRef, isInView: whyInView } = useScrollReveal();
  const { ref: ctaRef, isInView: ctaInView } = useScrollReveal();

  const handleChange = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.phone || !form.address || !form.region) {
      toast.error(c.requiredError);
      return;
    }
    setSubmitting(true);
    try {
      await createRentalCheckLead({
        name: form.name,
        email: form.email,
        phone: form.phone,
        address: form.address,
        region: form.region,
        propertyType: form.propertyType,
        message: form.message,
        desiredDate: date,
      });
      setSubmitted(true);
      toast.success(c.successToast);
    } catch {
      toast.error(c.errorToast);
    } finally {
      setSubmitting(false);
    }
  };

  const reveal = (inView: boolean, delay = 0) => ({
    initial: { opacity: 0, y: 20 },
    animate: inView ? { opacity: 1, y: 0 } : {},
    transition: { duration: 0.7, delay, ease: 'easeOut' as const },
  });

  if (submitted) {
    return (
      <PublicLayout>
        <section className="min-h-[80vh] flex items-center justify-center bg-background">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6 }} className="text-center max-w-lg mx-auto px-6">
            <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-8 h-8 text-accent" />
            </div>
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-3">{c.submittedTitle}</h1>
            <p className="text-muted-foreground text-lg mb-8">{c.submittedText}</p>
            <Button variant="gold" size="lg" onClick={() => setSubmitted(false)} className="gap-2">
              {c.submittedButton} <ArrowRight className="w-4 h-4" />
            </Button>
          </motion.div>
        </section>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      {/* ── Hero ── */}
      <section ref={heroRef} className="relative pt-28 pb-14 md:pt-36 md:pb-20 bg-background overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 30% 40%, hsl(var(--accent)) 0%, transparent 50%)' }} />
        <div className="container mx-auto px-4 md:px-8 relative z-10">
          <motion.div {...reveal(heroInView)} className="max-w-2xl">
            <span className="text-accent/80 font-body text-xs font-semibold tracking-[0.3em] uppercase block mb-3">{c.eyebrow}</span>
            <h1 className="font-display text-3xl md:text-5xl lg:text-6xl font-bold text-foreground mb-5 leading-[1.05]">
              {c.titlePrefix}
              <span className="block text-accent italic font-normal">{c.titleAccent}</span>
            </h1>
            <p className="text-muted-foreground text-base md:text-lg max-w-xl leading-relaxed">
              {c.subtitle}
            </p>
          </motion.div>

          {/* Trust strip */}
          <motion.div {...reveal(heroInView, 0.2)} className="mt-10 flex flex-wrap gap-x-6 gap-y-3">
            {benefits.map((b, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                  <b.icon className="w-4 h-4 text-accent" />
                </div>
                <span className="text-foreground/80 text-sm font-medium">{b.label}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Form + Calendar ── */}
      <section ref={formRef} className="py-14 md:py-20 bg-background">
        <div className="container mx-auto px-4 md:px-8">
          <div className="max-w-5xl mx-auto">
            <div className="grid lg:grid-cols-5 gap-8">
              {/* Form — 3 cols */}
              <motion.form
                onSubmit={handleSubmit}
                {...reveal(formInView)}
                className="lg:col-span-3 p-6 md:p-8 rounded-2xl bg-card border border-border"
              >
                <h2 className="font-display text-xl md:text-2xl font-bold text-foreground mb-1">{c.formTitle}</h2>
                <p className="text-muted-foreground text-sm mb-6">{c.formSubtitle}</p>

                <div className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="name" className="text-foreground/90 text-sm font-medium">{c.name}</Label>
                      <Input id="name" placeholder={c.namePlaceholder} value={form.name} onChange={e => handleChange('name', e.target.value)} className="h-11 bg-background border-border/60 text-foreground placeholder:text-muted-foreground/50 focus:border-accent/40" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="phone" className="text-foreground/90 text-sm font-medium">{c.phone}</Label>
                      <Input id="phone" placeholder={c.phonePlaceholder} value={form.phone} onChange={e => handleChange('phone', e.target.value)} className="h-11 bg-background border-border/60 text-foreground placeholder:text-muted-foreground/50 focus:border-accent/40" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-foreground/90 text-sm font-medium">{c.email}</Label>
                    <Input id="email" type="email" placeholder={c.emailPlaceholder} value={form.email} onChange={e => handleChange('email', e.target.value)} className="h-11 bg-background border-border/60 text-foreground placeholder:text-muted-foreground/50 focus:border-accent/40" />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="address" className="text-foreground/90 text-sm font-medium">{c.address}</Label>
                    <Input id="address" placeholder={c.addressPlaceholder} value={form.address} onChange={e => handleChange('address', e.target.value)} className="h-11 bg-background border-border/60 text-foreground placeholder:text-muted-foreground/50 focus:border-accent/40" />
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-foreground/90 text-sm font-medium">{c.area}</Label>
                      <Select value={form.region} onValueChange={v => handleChange('region', v)}>
                        <SelectTrigger className="h-11 bg-background border-border/60 text-foreground">
                          <SelectValue placeholder={c.areaPlaceholder} />
                        </SelectTrigger>
                        <SelectContent>
                          {regionOptions.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-foreground/90 text-sm font-medium">{c.propertyType}</Label>
                      <Select value={form.propertyType} onValueChange={v => handleChange('propertyType', v)}>
                        <SelectTrigger className="h-11 bg-background border-border/60 text-foreground">
                          <SelectValue placeholder={c.propertyTypePlaceholder} />
                        </SelectTrigger>
                        <SelectContent>
                          {propertyTypeValues.map(type => (
                            <SelectItem key={type.value} value={type.value}>{type.labels[language]}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="message" className="text-foreground/90 text-sm font-medium">{c.message} <span className="text-muted-foreground font-normal">({c.optional})</span></Label>
                    <Textarea id="message" rows={3} placeholder={c.messagePlaceholder} value={form.message} onChange={e => handleChange('message', e.target.value)} className="bg-background border-border/60 text-foreground placeholder:text-muted-foreground/50 focus:border-accent/40" />
                  </div>
                </div>

                <Button type="submit" variant="gold" size="lg" disabled={submitting} className="w-full mt-6 gap-2.5 text-base group h-12">
                  {submitting ? c.sending : c.submit}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
                <p className="text-muted-foreground/60 text-xs text-center mt-3">
                  {c.privacyPrefix} <Link to="/privacy" className="underline hover:text-accent transition-colors">{c.privacy}</Link>.
                </p>
              </motion.form>

              {/* Sidebar — 2 cols */}
              <motion.div {...reveal(formInView, 0.15)} className="lg:col-span-2 space-y-5">
                {/* Calendar card */}
                <div className="rounded-2xl bg-card border border-border p-5 sticky top-28">
                  <div className="flex items-center gap-2.5 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                      <Clock className="w-4 h-4 text-accent" />
                    </div>
                    <div>
                      <h3 className="font-display text-base font-bold text-foreground">{c.calendarTitle}</h3>
                      <p className="text-muted-foreground text-xs">{c.calendarSubtitle}</p>
                    </div>
                  </div>

                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    locale={dateLocale}
                    disabled={(d) => d < new Date()}
                    className="pointer-events-auto rounded-xl"
                  />

                  {date && (
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-3 p-3 rounded-xl bg-accent/8 border border-accent/15">
                      <p className="text-foreground text-sm font-medium">
                        {format(date, c.selectedDateFormat, { locale: dateLocale })}
                      </p>
                      <p className="text-muted-foreground text-xs mt-0.5">{c.confirmByPhone}</p>
                    </motion.div>
                  )}

                  {/* Contact */}
                  <div className="mt-5 pt-4 border-t border-border/60 space-y-2">
                    <p className="text-muted-foreground text-[11px] font-semibold uppercase tracking-wider mb-2">{c.contactDirect}</p>
                    <a href="tel:+4512345678" className="flex items-center gap-2.5 py-2 px-3 rounded-xl hover:bg-secondary/50 transition-colors group">
                      <Phone className="w-3.5 h-3.5 text-accent" />
                      <span className="text-foreground text-sm group-hover:text-accent transition-colors">+45 12 34 56 78</span>
                    </a>
                    <a href="mailto:hello@sommervibes.dk" className="flex items-center gap-2.5 py-2 px-3 rounded-xl hover:bg-secondary/50 transition-colors group">
                      <Mail className="w-3.5 h-3.5 text-accent" />
                      <span className="text-foreground text-sm group-hover:text-accent transition-colors">hello@sommervibes.dk</span>
                    </a>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Why book ── */}
      <section ref={whyRef} className="py-14 md:py-20 bg-secondary/30">
        <div className="container mx-auto px-4 md:px-8">
          <div className="max-w-5xl mx-auto">
            <motion.div {...reveal(whyInView)} className="mb-10">
              <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-2">{c.whyTitle}</h2>
              <p className="text-muted-foreground text-sm max-w-xl">{c.whySubtitle}</p>
            </motion.div>

            <div className="grid sm:grid-cols-2 gap-5">
              {reasons.map((r, i) => (
                <motion.div key={i} {...reveal(whyInView, 0.1 * i)} className="flex gap-4 p-5 rounded-xl bg-card border border-border/60">
                  <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                    <r.icon className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <h3 className="text-foreground font-semibold text-sm mb-1">{r.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{r.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Coverage (compact) ── */}
      <section className="py-12 md:py-16 bg-background border-t border-border/40">
        <div className="container mx-auto px-4 md:px-8">
          <div className="max-w-5xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
              <div>
                <h2 className="font-display text-xl md:text-2xl font-bold text-foreground">{c.coverageTitle}</h2>
                <p className="text-muted-foreground text-sm mt-1">{c.coverageSubtitle}</p>
              </div>
              <MapPin className="w-5 h-5 text-accent hidden md:block" />
            </div>
            <div className="flex flex-wrap gap-2.5">
              {regionOptions.map(r => (
                <span key={r.value} className="px-4 py-2 rounded-full bg-secondary/60 border border-border/40 text-foreground/80 text-sm font-medium">
                  {r.label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ (compact) ── */}
      <section className="py-12 md:py-16 bg-background">
        <div className="container mx-auto px-4 md:px-8">
          <div className="max-w-2xl mx-auto">
            <h2 className="font-display text-xl font-bold text-foreground mb-6">{c.faqTitle}</h2>
            <Accordion type="single" collapsible className="space-y-2">
              {c.faq.map(([question, answer], index) => (
                <AccordionItem key={question} value={String(index + 1)} className="border border-border/50 rounded-xl px-5 bg-card">
                  <AccordionTrigger className="text-foreground text-sm font-medium py-4 hover:no-underline">{question}</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-sm pb-4">{answer}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section ref={ctaRef} className="py-14 md:py-20 bg-secondary/20 border-t border-border/30">
        <div className="container mx-auto px-4 md:px-8">
          <motion.div {...reveal(ctaInView)} className="max-w-2xl mx-auto text-center">
            <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-3">
              {c.finalTitle}
            </h2>
            <p className="text-muted-foreground text-base mb-8 max-w-lg mx-auto">
              {c.finalSubtitle}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                variant="gold"
                size="lg"
                className="gap-2 group"
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              >
                {c.submit}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Link to="/kom-i-gang">
                <Button variant="outline" size="lg" className="border-border/60 text-foreground/80 hover:text-foreground">
                  {c.finalSecondary}
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </PublicLayout>
  );
}
