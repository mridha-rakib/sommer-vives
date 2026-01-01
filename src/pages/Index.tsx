import { PublicLayout } from '@/components/layout/PublicLayout';
import { HeroSection } from '@/components/landing/HeroSection';
import { CategorySection } from '@/components/landing/CategorySection';
import { DestinationsSection } from '@/components/landing/DestinationsSection';
import { FeaturedPropertiesSection } from '@/components/landing/FeaturedPropertiesSection';
import { ValuePropsSection } from '@/components/landing/ValuePropsSection';
import { ComparisonSection } from '@/components/landing/ComparisonSection';
import { FAQSection } from '@/components/landing/FAQSection';
import { CTASection } from '@/components/landing/CTASection';

const Index = () => {
  return (
    <PublicLayout>
      <HeroSection />
      <CategorySection />
      <DestinationsSection />
      <FeaturedPropertiesSection />
      <ValuePropsSection />
      <ComparisonSection />
      <FAQSection />
      <CTASection />
    </PublicLayout>
  );
};

export default Index;
