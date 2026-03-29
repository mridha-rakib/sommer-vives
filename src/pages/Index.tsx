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
      <HeroSection />
      <SocialProofSection />
      <ValuePropsSection />
      <RevenueSection />
      <PropertyTypesSection />
      <ComparisonSection />
      <TaxBenefitSection />
      <HowItWorksSection />
      <ModernPlatformSection />
      <TestimonialsSection />
      <FAQSection />
      <ContactExpertsSection />
    </PublicLayout>
  );
};

export default Index;
