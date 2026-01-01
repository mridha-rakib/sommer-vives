import { PublicLayout } from '@/components/layout/PublicLayout';
import { HeroSection } from '@/components/landing/HeroSection';
import { CategorySection } from '@/components/landing/CategorySection';
import { HowItWorksSection } from '@/components/landing/HowItWorksSection';
import { DestinationsSection } from '@/components/landing/DestinationsSection';
import { FeaturedPropertiesSection } from '@/components/landing/FeaturedPropertiesSection';
import { StorySection } from '@/components/landing/StorySection';
import { TestimonialsSection } from '@/components/landing/TestimonialsSection';
import { ValuePropsSection } from '@/components/landing/ValuePropsSection';
import { ComparisonSection } from '@/components/landing/ComparisonSection';
import { FAQSection } from '@/components/landing/FAQSection';
import { CTASection } from '@/components/landing/CTASection';

const Index = () => {
  return (
    <PublicLayout>
      <HeroSection />
      <CategorySection />
      <HowItWorksSection />
      <DestinationsSection />
      <FeaturedPropertiesSection />
      <StorySection />
      <TestimonialsSection />
      <ValuePropsSection />
      <ComparisonSection />
      <FAQSection />
      <CTASection />
    </PublicLayout>
  );
};

export default Index;
