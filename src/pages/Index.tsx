import { PublicLayout } from '@/components/layout/PublicLayout';
import { HeroSection } from '@/components/landing/HeroSection';
import { SocialProofSection } from '@/components/landing/SocialProofSection';
import { CampaignCard } from '@/components/landing/CampaignCard';
import { ValuePropsSection } from '@/components/landing/ValuePropsSection';
import { RevenueSection } from '@/components/landing/RevenueSection';
import { PropertyTypesSection } from '@/components/landing/PropertyTypesSection';
import { ComparisonSection } from '@/components/landing/ComparisonSection';
import { TaxBenefitSection } from '@/components/landing/TaxBenefitSection';
import { HowItWorksSection } from '@/components/landing/HowItWorksSection';
import { ModernPlatformSection } from '@/components/landing/ModernPlatformSection';
import { TestimonialsSection } from '@/components/landing/TestimonialsSection';
import { FAQSection } from '@/components/landing/FAQSection';
import { ContactExpertsSection } from '@/components/landing/ContactExpertsSection';

const Index = () => {
  return (
    <PublicLayout>
      {/* 1. Hero — full viewport, dark, cinematic */}
      <HeroSection />
      {/* 2. Social proof — minimal stat strip */}
      <SocialProofSection />
      {/* 3. Campaign — conversion card */}
      <CampaignCard />
      {/* 4. Value props — why us */}
      <ValuePropsSection />
      {/* 5. Revenue — Tesla-style interactive */}
      <RevenueSection />
      {/* 6. Property types — full-bleed imagery */}
      <PropertyTypesSection />
      {/* 7. How it works — process */}
      <HowItWorksSection />
      {/* 8. Tax benefit — interactive calc */}
      <TaxBenefitSection />
      {/* 9. Comparison — vs competitors */}
      <ComparisonSection />
      {/* 10. Platform — dashboard mockup */}
      <ModernPlatformSection />
      {/* 11. Testimonials — social proof */}
      <TestimonialsSection />
      {/* 12. FAQ */}
      <FAQSection />
      {/* 13. Final CTA */}
      <ContactExpertsSection />
    </PublicLayout>
  );
};

export default Index;
