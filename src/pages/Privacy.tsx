import { PublicLayout } from '@/components/layout/PublicLayout';
import { motion } from 'framer-motion';
import { useTranslation } from '@/lib/i18n';

export default function Privacy() {
  const { t } = useTranslation();
  const sections = Array.from({ length: 9 }, (_, i) => ({
    title: t(`privacy.s${i + 1}.title`),
    content: t(`privacy.s${i + 1}.content`),
  }));

  return (
    <PublicLayout>
      <section className="pt-32 pb-8 bg-background">
        <div className="container mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <span className="text-primary font-body text-sm font-semibold tracking-[0.3em] uppercase block mb-6">{t('legal.eyebrow')}</span>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4"
          >
            {t('privacy.title')}<span className="text-primary italic font-normal">{t('privacy.titleAccent')}</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.4 }}
            className="text-muted-foreground max-w-xl mx-auto">
            {t('legal.lastUpdated')}
          </motion.p>
        </div>
      </section>

      <section className="py-16 bg-background">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="prose prose-invert max-w-none space-y-8">
            {sections.map((section, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
              >
                <h2 className="font-display text-xl font-semibold text-foreground mb-3">{section.title}</h2>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{section.content}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
