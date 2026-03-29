import { PublicLayout } from '@/components/layout/PublicLayout';
import { HeroSection } from '@/components/landing/HeroSection';
import { SocialProofSection } from '@/components/landing/SocialProofSection';
import { CampaignCard } from '@/components/landing/CampaignCard';
import { ValuePropsSection } from '@/components/landing/ValuePropsSection';
import { ExitIntentPopup } from '@/components/landing/ExitIntentPopup';
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
      {/* 2. Social proof — minimal stat strip + logo marquee */}
      <SocialProofSection />
      {/* 3. Value props — why us (cream) */}
      <ValuePropsSection />
      {/* 4. Revenue — +20% interactive (dark) */}
      <RevenueSection />
      {/* 5. Property types — full-bleed imagery (white) */}
      <PropertyTypesSection />
      {/* 6. How it works — process (dark) */}
      <HowItWorksSection />
      {/* 7. Campaign — conversion offer (white, after understanding value) */}
      <CampaignCard />
      {/* 8. Tax benefit — interactive calc (cream) */}
      <TaxBenefitSection />
      {/* 9. Comparison — vs competitors (dark) */}
      <ComparisonSection />
      {/* 10. Testimonials — social proof (white) */}
      <TestimonialsSection />
      {/* 11. Platform — dashboard mockup (cream) */}
      <ModernPlatformSection />
      {/* 12. FAQ (white) */}
      <FAQSection />
      {/* 13. Final CTA (dark) */}
      <ContactExpertsSection />
    </PublicLayout>
  );
};

export default Index;
