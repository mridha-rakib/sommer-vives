import { PublicLayout } from '@/components/layout/PublicLayout';
import { FAQSection } from '@/components/landing/FAQSection';
import { useTranslation } from '@/lib/i18n';

export default function FAQ() {
  const { t } = useTranslation();
  return (
    <PublicLayout>
      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4 md:px-8 max-w-4xl mb-12">
          <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
            {t('faqPage.title')}
          </h1>
          <p className="text-lg text-muted-foreground">
            {t('faqPage.subtitle')}
          </p>
        </div>
        <FAQSection />
      </div>
    </PublicLayout>
  );
}
