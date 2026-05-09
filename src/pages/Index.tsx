import { PublicLayout } from '@/components/layout/PublicLayout';
import { HeroSection } from '@/components/landing/HeroSection';
import { PremiumServicesSection } from '@/components/landing/PremiumServicesSection';
import { ExitIntentPopup } from '@/components/landing/ExitIntentPopup';
import { EarningsSection } from '@/components/landing/EarningsSection';
import { HowItWorksSection } from '@/components/landing/HowItWorksSection';
import { WhyUsPricingSection } from '@/components/landing/WhyUsPricingSection';
import { TestimonialsFAQSection } from '@/components/landing/TestimonialsFAQSection';
import { ContactExpertsSection } from '@/components/landing/ContactExpertsSection';
import { useTranslation } from '@/lib/i18n';

const Index = () => {
  const { t } = useTranslation();

  const homeFAQs = [
    { q: t('faq.q1'), a: t('faq.a1') },
    { q: t('faq.q2'), a: t('faq.a2') },
    { q: t('faq.q3'), a: t('faq.a3') },
    { q: t('faq.q4'), a: t('faq.a4') },
    { q: t('faq.q5'), a: t('faq.a5') },
    { q: t('faq.q6'), a: t('faq.a6') },
    { q: t('faq.q7'), a: t('faq.a7') },
    { q: t('faq.q8'), a: t('faq.a8') },
    { q: t('faq.q9'), a: t('faq.a9') },
    { q: t('faq.q10'), a: t('faq.a10') },
  ];

  return (
    <PublicLayout>
      <ExitIntentPopup />
      <HeroSection />
      <PremiumServicesSection />
      <EarningsSection />
      <div id="saadan-virker-det">
        <HowItWorksSection />
      </div>
      <WhyUsPricingSection />
      <div id="faq">
        <TestimonialsFAQSection
          faqItems={homeFAQs}
          faqHeading={t('faq.heading')}
          faqSubheading={t('faq.subheading')}
        />
      </div>
      <ContactExpertsSection />
    </PublicLayout>
  );
};

export default Index;
