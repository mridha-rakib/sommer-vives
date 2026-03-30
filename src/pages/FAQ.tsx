import { PublicLayout } from '@/components/layout/PublicLayout';
import { FAQSection } from '@/components/landing/FAQSection';

export default function FAQ() {
  return (
    <PublicLayout>
      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4 md:px-8 max-w-4xl mb-12">
          <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
            Ofte stillede spørgsmål
          </h1>
          <p className="text-lg text-muted-foreground">
            Find svar på de mest almindelige spørgsmål om SommerVibes.
          </p>
        </div>
        <FAQSection />
      </div>
    </PublicLayout>
  );
}
