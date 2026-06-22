import { PublicLayout } from '@/components/layout/PublicLayout';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BarChart3,
  CalendarCheck,
  Camera,
  Check,
  Clock,
  FileCheck,
  Globe,
  Headphones,
  Home,
  Key,
  MessageCircle,
  Shield,
  Sparkles,
  X,
  type LucideIcon,
} from 'lucide-react';
import { ContextualFAQ } from '@/components/landing/ContextualFAQ';
import { motion } from 'framer-motion';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { useTranslation, type Language } from '@/lib/i18n';
import { usePageSeo } from '@/lib/seo';
import pricingHero from '@/assets/kvie-soe-drone.jpg';

const ownerOnboardingPath = '/kom-i-gang?source=pricing_get_started';
const valuationPath = '/book-vurdering';

const includedServices = [
  { icon: Globe, titleKey: 'services.s3.title', textKey: 'services.s3.headline' },
  { icon: Camera, titleKey: 'services.s1.title', textKey: 'services.s1.headline' },
  { icon: MessageCircle, titleKey: 'services.s2.title', textKey: 'services.s2.headline' },
  { icon: BarChart3, titleKey: 'services.s5.title', textKey: 'services.s5.headline' },
  { icon: Key, titleKey: 'services.s6.title', textKey: 'services.s6.headline' },
  { icon: Shield, titleKey: 'services.s7.title', textKey: 'services.s7.headline' },
];

const pricingPageCopy: Record<Language, {
  seoDescription: string;
  heroSuffix: string;
  includedTitle: string;
  includedText: string;
  flowEyebrow: string;
  flowTitle: string;
  flowText: string;
  journey: Array<{ icon: LucideIcon; title: string; text: string }>;
}> = {
  da: {
    seoDescription: 'Gennemsigtige ejerpriser for professionel sommerhusudlejning: 15% ejerkommission, gratis opstart, ingen månedlige gebyrer og gratis onboarding.',
    heroSuffix: 'Start med gratis ejer-onboarding, eller book et udlejningstjek før du beslutter dig.',
    includedTitle: 'Alt hvad ejere behøver for at tjene mere med mindre arbejde',
    includedText: 'SommerVibes er bygget til boligejere, der ønsker professionel ferieboligudlejning uden opstartsgebyrer, månedlige udgifter eller en kompliceret bureauaftale.',
    flowEyebrow: 'Ejerflow',
    flowTitle: 'Vælg næste skridt ud fra hvor du er',
    flowText: 'Du kan starte den fulde ejer-onboarding nu, eller få et gratis udlejningstjek først, hvis du ønsker et personligt estimat før udlejning.',
    journey: [
      {
        icon: Home,
        title: 'Fortæl os om dit sommerhus',
        text: 'Brug ejer-onboardingen til at dele adresse, faciliteter og hvor meget hjælp du ønsker.',
      },
      {
        icon: CalendarCheck,
        title: 'Få et gratis udlejningstjek',
        text: 'Hvis du vil have rådgivning først, booker du en uforpligtende vurdering, hvor vi gennemgår boligen med dig.',
      },
      {
        icon: FileCheck,
        title: 'Start først når det giver mening',
        text: 'Du ser modellen tydeligt før signering. Oprettelse er gratis, og kommission gælder kun gennemførte bookinger.',
      },
    ],
  },
  en: {
    seoDescription: 'Transparent owner pricing for vacation rental management: 15% owner commission, no setup fee, no monthly cost, and free onboarding.',
    heroSuffix: 'Start with a free owner onboarding or book a rental check before you decide.',
    includedTitle: 'Everything owners need to earn with less work',
    includedText: 'SommerVibes is built for homeowners who want professional vacation rental management without upfront fees, monthly costs or a complicated agency agreement.',
    flowEyebrow: 'Owner flow',
    flowTitle: 'Choose the next step that fits where you are',
    flowText: 'You can start the full owner onboarding now, or get a free rental check first if you want a personal estimate before listing.',
    journey: [
      {
        icon: Home,
        title: 'Tell us about your summer home',
        text: 'Use the owner onboarding flow to share the address, facilities and how much help you want.',
      },
      {
        icon: CalendarCheck,
        title: 'Get a free rental check',
        text: 'If you prefer advice first, book a non-binding valuation and we will review the home with you.',
      },
      {
        icon: FileCheck,
        title: 'Start only when it makes sense',
        text: 'You see the model clearly before you sign. Setup is free, and commission only applies to completed bookings.',
      },
    ],
  },
  de: {
    seoDescription: 'Transparente Eigentümerpreise für Ferienhausvermietung: 15% Provision, keine Einrichtungsgebühr, keine monatlichen Kosten und kostenlose Onboarding.',
    heroSuffix: 'Starten Sie mit kostenlosem Eigentümer-Onboarding oder buchen Sie zuerst einen Vermietungscheck.',
    includedTitle: 'Alles, was Eigentümer brauchen, um mit weniger Aufwand mehr zu verdienen',
    includedText: 'SommerVibes ist für Hauseigentümer gemacht, die professionelle Ferienhausvermietung ohne Startgebühren, Monatskosten oder komplizierte Agenturverträge wünschen.',
    flowEyebrow: 'Eigentümerflow',
    flowTitle: 'Wählen Sie den nächsten Schritt, der zu Ihrer Situation passt',
    flowText: 'Sie können jetzt mit dem vollständigen Onboarding starten oder zuerst einen kostenlosen Vermietungscheck buchen, wenn Sie vor der Veröffentlichung eine persönliche Einschätzung wünschen.',
    journey: [
      {
        icon: Home,
        title: 'Erzählen Sie uns von Ihrem Ferienhaus',
        text: 'Im Eigentümer-Onboarding teilen Sie Adresse, Ausstattung und wie viel Unterstützung Sie wünschen.',
      },
      {
        icon: CalendarCheck,
        title: 'Kostenlosen Vermietungscheck erhalten',
        text: 'Wenn Sie zuerst Beratung möchten, buchen Sie eine unverbindliche Bewertung und wir prüfen das Haus gemeinsam mit Ihnen.',
      },
      {
        icon: FileCheck,
        title: 'Starten, wenn es sinnvoll ist',
        text: 'Sie sehen das Modell klar vor der Unterschrift. Die Einrichtung ist kostenlos, Provision gilt nur für abgeschlossene Buchungen.',
      },
    ],
  },
  nl: {
    seoDescription: 'Transparante eigenaarsprijzen voor vakantieverhuur: 15% commissie, geen opstartkosten, geen maandelijkse kosten en gratis onboarding.',
    heroSuffix: 'Start met gratis eigenaarsonboarding of boek eerst een verhuurcheck voordat u beslist.',
    includedTitle: 'Alles wat eigenaren nodig hebben om met minder werk meer te verdienen',
    includedText: 'SommerVibes is gemaakt voor huiseigenaren die professioneel vakantieverhuurbeheer willen zonder opstartkosten, maandelijkse kosten of ingewikkelde bureau-afspraken.',
    flowEyebrow: 'Eigenarenflow',
    flowTitle: 'Kies de volgende stap die bij uw situatie past',
    flowText: 'U kunt nu met de volledige eigenaarsonboarding starten, of eerst een gratis verhuurcheck boeken als u een persoonlijke inschatting wilt.',
    journey: [
      {
        icon: Home,
        title: 'Vertel ons over uw vakantiehuis',
        text: 'Gebruik de eigenaarsonboarding om adres, faciliteiten en het gewenste serviceniveau te delen.',
      },
      {
        icon: CalendarCheck,
        title: 'Krijg een gratis verhuurcheck',
        text: 'Wilt u eerst advies, boek dan een vrijblijvende beoordeling en wij bekijken de woning samen met u.',
      },
      {
        icon: FileCheck,
        title: 'Start pas wanneer het logisch is',
        text: 'U ziet het model duidelijk voordat u tekent. Opstarten is gratis en commissie geldt alleen voor afgeronde boekingen.',
      },
    ],
  },
};

function PricingContent({ copy }: { copy: (typeof pricingPageCopy)[Language] }) {
  const { ref, isInView } = useScrollReveal();
  const { t } = useTranslation();
  const valuePoints = [
    t('pricing.page.value1'),
    t('pricing.page.value2'),
    t('pricing.page.value3'),
    t('pricing.page.value4'),
    t('hero.benefit3'),
    t('hero.benefit9'),
  ];
  const comparison = [
    { feature: t('pricing.rowCommission'), us: '15 %', others: '18–25 %' },
    { feature: t('pricing.rowGuestFee'), us: '5 %', others: '12–18 %' },
    { feature: t('pricing.rowBinding'), us: t('pricing.valueBindingUs'), others: t('pricing.valueBindingOthers') },
    { feature: t('pricing.rowSetup'), us: t('pricing.valueSetupUs'), others: t('pricing.valueSetupOthers') },
    { feature: t('pricing.rowAdvisor'), us: '✓', others: '✗', usIcon: true, othersIcon: true },
  ];

  return (
    <section ref={ref} className="py-16 md:py-24 bg-background">
      <div className="container mx-auto px-4 md:px-8 max-w-6xl">
        <div className="grid lg:grid-cols-[0.9fr_1.1fr] gap-10 lg:gap-14 items-start">
          {/* Left - Price Card */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="bg-card border border-border/60 rounded-2xl p-6 md:p-8 lg:sticky lg:top-24 shadow-elevated"
          >
            <div className="mb-8">
              <div className="flex items-baseline gap-1 mb-2">
                <span className="font-display text-6xl md:text-7xl font-bold text-accent">15</span>
                <span className="font-display text-3xl font-bold text-accent">%</span>
              </div>
              <p className="text-foreground/80 text-lg leading-relaxed">
                {t('pricing.commission')}
              </p>
            </div>

            <div className="bg-muted/30 rounded-xl px-5 py-4 mb-8 border border-border/40">
              <div className="flex items-baseline gap-2">
                <span className="font-display text-xl font-semibold text-accent">5 %</span>
                <span className="text-sm text-muted-foreground">{t('pricing.guestFee')}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {t('pricing.guestFeeNote')}
              </p>
            </div>

            <ul className="space-y-3.5 mb-8">
              {valuePoints.map((point, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.3, delay: 0.3 + i * 0.06 }}
                  className="flex items-center gap-3"
                >
                  <div className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 text-accent" />
                  </div>
                  <span className="text-foreground/90 text-sm">{point}</span>
                </motion.li>
              ))}
            </ul>

            <p className="text-xs text-muted-foreground mb-6 leading-relaxed">
              {t('pricing.page.noHidden')}
            </p>

            <Link to={ownerOnboardingPath}>
              <Button variant="gold" size="lg" className="w-full gap-2 group text-base">
                {t('pricing.cta')} <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </motion.div>

          {/* Right - Services + Comparison + Example */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="space-y-8"
          >
            <div>
              <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-3">
                {copy.includedTitle}
              </h2>
              <p className="text-muted-foreground text-sm md:text-base leading-relaxed max-w-2xl">
                {copy.includedText}
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              {includedServices.map((service, i) => {
                const Icon = service.icon;
                return (
                  <motion.div
                    key={service.titleKey}
                    initial={{ opacity: 0, y: 14 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.4, delay: 0.2 + i * 0.05 }}
                    className="rounded-xl border border-border/45 bg-card/45 p-4"
                  >
                    <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center mb-3">
                      <Icon className="w-4 h-4 text-accent" />
                    </div>
                    <h3 className="font-display text-base font-semibold text-foreground mb-1">
                      {t(service.titleKey)}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {t(service.textKey)}
                    </p>
                  </motion.div>
                );
              })}
            </div>

            {/* Comparison table */}
            <div>
              <h3 className="font-display text-lg font-semibold text-foreground mb-4">
                {t('pricing.compareTitle')}
              </h3>
              <div className="rounded-xl border border-border/50 overflow-x-auto">
                <div className="min-w-[440px]">
                  <div className="grid grid-cols-3 bg-muted/40 px-5 py-3 text-xs font-medium uppercase tracking-wider">
                    <span className="text-muted-foreground"></span>
                    <span className="text-accent text-center">{t('pricing.colUs')}</span>
                    <span className="text-muted-foreground text-center">{t('pricing.colOthers')}</span>
                  </div>
                  {comparison.map((row, i) => (
                    <div
                      key={i}
                      className="grid grid-cols-3 px-5 py-3.5 border-t border-border/30 text-sm"
                    >
                      <span className="text-foreground/80">{row.feature}</span>
                      <span className="text-center font-medium text-accent">
                        {row.usIcon ? <Check className="w-4 h-4 mx-auto text-accent" /> : row.us}
                      </span>
                      <span className="text-center text-muted-foreground">
                        {row.othersIcon ? <X className="w-4 h-4 mx-auto text-muted-foreground/60" /> : row.others}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-4 leading-relaxed">{t('pricing.footer')}</p>
            </div>

            {/* Payout example */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="bg-muted/20 rounded-xl p-6 border border-border/30"
            >
              <h3 className="font-display text-base font-semibold text-foreground mb-4">
                {t('pricing.page.payoutExample')}
              </h3>
              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('pricing.grossRevenue')}</span>
                  <span className="font-medium text-foreground">100.000 kr.</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('pricing.page.commissionLine')}</span>
                  <span className="text-destructive">−15.000 kr.</span>
                </div>
                <div className="border-t border-border/40 pt-3 flex justify-between items-baseline">
                  <span className="font-semibold text-foreground">{t('pricing.yourPayout')}</span>
                  <span className="font-display font-bold text-accent text-xl">85.000 kr.</span>
                </div>
                <div className="flex justify-between text-xs pt-1">
                  <span className="text-muted-foreground">{t('pricing.page.taxFree')}</span>
                  <span className="text-foreground/70">50.200 kr.</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

export default function Pricing() {
  const { t, language } = useTranslation();
  const copy = pricingPageCopy[language];
  usePageSeo({
    title: `${t('nav.pricing')} | SommerVibes`,
    description: copy.seoDescription,
    canonicalPath: '/pricing',
    image: '/og-image.png',
  });

  const pricingFAQs = [
    { q: t('pricing.page.faq1.q'), a: t('pricing.page.faq1.a') },
    { q: t('pricing.page.faq2.q'), a: t('pricing.page.faq2.a') },
    { q: t('pricing.page.faq3.q'), a: t('pricing.page.faq3.a') },
    { q: t('pricing.page.faq4.q'), a: t('pricing.page.faq4.a') },
  ];

  return (
    <PublicLayout>
      <section className="relative pt-28 md:pt-36 pb-14 md:pb-20 bg-background text-foreground overflow-hidden">
        <img src={pricingHero} alt="" className="absolute inset-0 h-full w-full object-cover opacity-25" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/92 to-background/78" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-transparent to-background" />
        <div className="container mx-auto px-4 md:px-8 relative z-10">
          <div className="max-w-[21.5rem] sm:max-w-3xl min-w-0">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <span className="text-accent font-body text-xs md:text-sm font-semibold tracking-[0.3em] uppercase block mb-5">{t('pricing.eyebrow')}</span>
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.15 }}
              className="font-display text-[2rem] min-[420px]:text-4xl md:text-6xl font-bold mb-5 leading-[1.08] md:leading-[1.05] max-w-full break-words"
            >
              {t('pricing.page.heroTitle')}
              <span className="block text-accent italic font-normal">{t('pricing.page.heroAccent')}</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.35 }}
              className="text-base md:text-lg text-muted-foreground leading-relaxed max-w-2xl"
            >
              {t('pricing.subtitle')} {copy.heroSuffix}
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.48 }}
              className="mt-8 flex flex-col sm:flex-row gap-3"
            >
              <Link to={ownerOnboardingPath} className="w-full sm:w-auto">
                <Button variant="gold" size="lg" className="w-full sm:w-auto gap-2 group">
                  {t('pricing.cta')} <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link to={valuationPath} className="w-full sm:w-auto">
                <Button variant="outline" size="lg" className="w-full sm:w-auto border-accent/40 text-accent hover:bg-accent/10">
                  {t('hero.cta2')}
                </Button>
              </Link>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.58 }}
              className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl"
            >
              {[
                { icon: Sparkles, label: t('pricing.valueSetupUs') },
                { icon: Clock, label: t('pricing.valueBindingUs') },
                { icon: Headphones, label: t('pricing.rowAdvisor') },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2.5 rounded-xl border border-border/45 bg-card/40 px-4 py-3">
                  <item.icon className="w-4 h-4 text-accent shrink-0" />
                  <span className="text-sm text-foreground/85">{item.label}</span>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>
      <PricingContent copy={copy} />
      <section className="py-16 md:py-24 bg-secondary/20 border-y border-border/30">
        <div className="container mx-auto px-4 md:px-8 max-w-6xl">
          <div className="max-w-2xl mb-10">
            <span className="text-accent/70 font-body text-[10px] font-semibold tracking-[0.35em] uppercase block mb-4">
              {copy.flowEyebrow}
            </span>
            <h2 className="font-display text-2xl md:text-4xl font-bold text-foreground mb-3">
              {copy.flowTitle}
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {copy.flowText}
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {copy.journey.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={step.title} className="rounded-xl border border-border/45 bg-card/45 p-5">
                  <div className="flex items-center justify-between mb-5">
                    <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-accent" />
                    </div>
                    <span className="text-xs text-muted-foreground/70">0{index + 1}</span>
                  </div>
                  <h3 className="font-display text-lg font-semibold text-foreground mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{step.text}</p>
                </div>
              );
            })}
          </div>
          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <Link to={ownerOnboardingPath} className="w-full sm:w-auto">
              <Button variant="gold" size="lg" className="w-full sm:w-auto gap-2 group">
                {t('hero.cta1')} <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link to={valuationPath} className="w-full sm:w-auto">
              <Button variant="outline" size="lg" className="w-full sm:w-auto border-border/60 text-foreground/80 hover:text-foreground">
                {t('hero.cta2')}
              </Button>
            </Link>
          </div>
        </div>
      </section>
      <ContextualFAQ
        eyebrow={t('pricing.page.faqEyebrow')}
        heading={t('pricing.page.faqHeading')}
        items={pricingFAQs}
      />
      {/* Dual CTA */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container mx-auto px-4 text-center max-w-xl">
          <h2 className="font-display text-2xl md:text-4xl font-bold text-foreground mb-4">
            {t('pricing.page.bottomTitle')}
          </h2>
          <p className="text-muted-foreground mb-8">
            {t('pricing.page.bottomSubtitle')}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to={ownerOnboardingPath} className="w-full sm:w-auto">
              <Button variant="gold" size="lg" className="w-full sm:w-auto gap-2 group">
                {t('hero.cta1')} <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link to={valuationPath} className="w-full sm:w-auto">
              <Button variant="outline" size="lg" className="w-full sm:w-auto border-accent/40 text-accent hover:bg-accent/10">
                {t('hero.cta2')}
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
