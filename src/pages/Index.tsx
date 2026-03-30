import { PublicLayout } from '@/components/layout/PublicLayout';
import { HeroSection } from '@/components/landing/HeroSection';
import { PremiumServicesSection } from '@/components/landing/PremiumServicesSection';
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
      <HeroSection />
      <PremiumServicesSection />
      <EarningsSection />
      <PropertyTypesSection />
      <HowItWorksSection />
      <CampaignCard />
      <TestimonialsSection />
      <FAQSection />
      <ContactExpertsSection />
    </PublicLayout>
  );
};

export default Index;
