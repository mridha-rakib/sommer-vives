import { PublicLayout } from '@/components/layout/PublicLayout';
import { HeroSection } from '@/components/landing/HeroSection';
import { PremiumServicesSection } from '@/components/landing/PremiumServicesSection';
import { ValuePropsSection } from '@/components/landing/ValuePropsSection';
import { ExitIntentPopup } from '@/components/landing/ExitIntentPopup';
import { EarningsSection } from '@/components/landing/EarningsSection';
import { PropertyTypesSection } from '@/components/landing/PropertyTypesSection';
import { HowItWorksSection } from '@/components/landing/HowItWorksSection';
import { CampaignCard } from '@/components/landing/CampaignCard';
import { TestimonialsSection } from '@/components/landing/TestimonialsSection';
import { FAQSection } from '@/components/landing/FAQSection';
import { ContactExpertsSection } from '@/components/landing/ContactExpertsSection';

const Index = () => {
  return (
    <PublicLayout>
      <ExitIntentPopup />
      {/* 1. Hero — full viewport + stats + channel marquee */}
      <HeroSection />
      {/* 2. Value props — interactive tabs (cream) */}
      <ValuePropsSection />
      {/* 3. Earnings — revenue + tax calc tabs (dark) */}
      <EarningsSection />
      {/* 4. Property types — carousel (white) */}
      <PropertyTypesSection />
      {/* 5. How it works — process steps (dark) */}
      <HowItWorksSection />
      {/* 6. Campaign — conversion offer */}
      <CampaignCard />
      {/* 7. Testimonials — carousel */}
      <TestimonialsSection />
      {/* 8. FAQ — accordion */}
      <FAQSection />
      {/* 9. Final CTA (dark) */}
      <ContactExpertsSection />
    </PublicLayout>
  );
};

export default Index;
