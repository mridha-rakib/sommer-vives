import { PublicLayout } from '@/components/layout/PublicLayout';
import { HeroSection } from '@/components/landing/HeroSection';
import { HowItWorksSection } from '@/components/landing/HowItWorksSection';
import { ValuePropsSection } from '@/components/landing/ValuePropsSection';
import { StorySection } from '@/components/landing/StorySection';
import { ComparisonSection } from '@/components/landing/ComparisonSection';
import { TestimonialsSection } from '@/components/landing/TestimonialsSection';
import { FAQSection } from '@/components/landing/FAQSection';
import { CTASection } from '@/components/landing/CTASection';

const Index = () => {
  return (
    <PublicLayout>
      <HeroSection />
      <HowItWorksSection />
      <ValuePropsSection />
      <StorySection />
      <ComparisonSection />
      <TestimonialsSection />
      <FAQSection />
      <CTASection />
    </PublicLayout>
  );
};

export default Index;
