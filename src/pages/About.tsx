import { PublicLayout } from '@/components/layout/PublicLayout';
import { StorySection } from '@/components/landing/StorySection';

export default function About() {
  return (
    <PublicLayout>
      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4 md:px-8 max-w-4xl">
          <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-6">
            Om Sommer<span className="text-primary italic">Vibes</span>
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed mb-12">
            Vi er en moderne platform, der forbinder sommerhusejere med gæster, der søger autentiske ferieoplevelser i Danmark. Vores mission er at gøre sommerhusudlejning enkel, gennemsigtig og værdiskabende — for alle parter.
          </p>
        </div>
        <StorySection />
      </div>
    </PublicLayout>
  );
}
