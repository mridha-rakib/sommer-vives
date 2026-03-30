import { PublicLayout } from '@/components/layout/PublicLayout';
import { HeroSection } from '@/components/landing/HeroSection';
import { PremiumServicesSection } from '@/components/landing/PremiumServicesSection';
import { ExitIntentPopup } from '@/components/landing/ExitIntentPopup';
import { PropertyTypesSection } from '@/components/landing/PropertyTypesSection';
import { HowItWorksSection } from '@/components/landing/HowItWorksSection';
import { TestimonialsSection } from '@/components/landing/TestimonialsSection';
import { FAQSection } from '@/components/landing/FAQSection';
import { ContactExpertsSection } from '@/components/landing/ContactExpertsSection';

const Index = () => {
  return (
    <PublicLayout>
      <ExitIntentPopup />
      <HeroSection />
      <PremiumServicesSection />
      <PropertyTypesSection />
      <HowItWorksSection />
      <TestimonialsSection />
      <FAQSection />
      <ContactExpertsSection />
    </PublicLayout>
  );
};

export default Index;
