import { PublicLayout } from '@/components/layout/PublicLayout';
import { HeroSection } from '@/components/landing/HeroSection';
import { HowItWorksSection } from '@/components/landing/HowItWorksSection';
import { ModernPlatformSection } from '@/components/landing/ModernPlatformSection';
import { TaxBenefitSection } from '@/components/landing/TaxBenefitSection';
import { PropertyTypesSection } from '@/components/landing/PropertyTypesSection';
import { TestimonialsSection } from '@/components/landing/TestimonialsSection';
import { FAQSection } from '@/components/landing/FAQSection';
import { ContactExpertsSection } from '@/components/landing/ContactExpertsSection';

const Index = () => {
  return (
    <PublicLayout>
      <HeroSection />
      <ModernPlatformSection />
      <TaxBenefitSection />
      <PropertyTypesSection />
      <HowItWorksSection />
      <TestimonialsSection />
      <FAQSection />
      <ContactExpertsSection />
    </PublicLayout>
  );
};

export default Index;
