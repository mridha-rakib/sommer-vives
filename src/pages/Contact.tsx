import { PublicLayout } from '@/components/layout/PublicLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Mail, Phone, MapPin, Clock, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { useTranslation } from '@/lib/i18n';

function ContactContent() {
  const { ref, isInView } = useScrollReveal();
  const { t } = useTranslation();

  const info = [
    { icon: Mail, title: t('contact.info.email'), detail: 'kontakt@sommervibes.dk', href: 'mailto:kontakt@sommervibes.dk' },
    { icon: Phone, title: t('contact.info.phone'), detail: '+45 12 34 56 78', href: 'tel:+4512345678' },
    { icon: MapPin, title: t('contact.info.address'), detail: t('contact.info.addressValue') },
    { icon: Clock, title: t('contact.info.hours'), detail: t('contact.info.hoursValue') },
  ];

  return (
    <section ref={ref} className="py-24 md:py-32 bg-background">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="grid md:grid-cols-5 gap-12">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7 }}
            className="md:col-span-3"
          >
            <h2 className="font-display text-2xl font-semibold text-primary mb-6">{t('contact.form.title')}</h2>
            <form className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">{t('contact.form.name')}</Label>
                  <Input id="name" placeholder={t('contact.form.namePh')} className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="phone">{t('contact.form.phone')}</Label>
                  <Input id="phone" placeholder="+45 12 34 56 78" className="mt-1" />
                </div>
              </div>
              <div>
                <Label htmlFor="email">{t('contact.form.email')}</Label>
                <Input id="email" type="email" placeholder={t('contact.form.emailPh')} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="subject">{t('contact.form.subject')}</Label>
                <Input id="subject" placeholder={t('contact.form.subjectPh')} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="message">{t('contact.form.message')}</Label>
                <Textarea id="message" placeholder={t('contact.form.messagePh')} rows={5} className="mt-1" />
              </div>
              <Button variant="gold" className="w-full gap-2 group">
                {t('contact.form.send')} <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </form>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="md:col-span-2"
          >
            <h2 className="font-display text-2xl font-semibold text-primary mb-6">{t('contact.info.title')}</h2>
            <div className="space-y-6 mb-8">
              {info.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 15 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.4, delay: 0.3 + i * 0.1 }}
                  className="flex items-start gap-4 group"
                >
                  <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0 group-hover:bg-accent/20 transition-colors">
                    <item.icon className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <div className="font-medium text-primary">{item.title}</div>
                    {item.href ? (
                      <a href={item.href} className="text-muted-foreground hover:text-accent transition-colors">{item.detail}</a>
                    ) : (
                      <div className="text-muted-foreground">{item.detail}</div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.7 }}
              className="bg-card border border-border rounded-xl p-6 text-foreground"
            >
              <h3 className="font-display font-semibold mb-2">{t('contact.cta.title')}</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {t('contact.cta.desc')}
              </p>
              <Link to="/kom-i-gang">
                <Button variant="gold" size="sm" className="gap-2 group">
                  {t('contact.cta.btn')} <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

export default function Contact() {
  const { t } = useTranslation();
  return (
    <PublicLayout>
      <section className="pt-32 pb-16 bg-background text-foreground overflow-hidden">
        <div className="container mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <span className="text-accent font-body text-sm font-semibold tracking-[0.3em] uppercase block mb-6">{t('contact.eyebrow')}</span>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="font-display text-4xl md:text-5xl font-bold mb-4"
          >
            {t('contactPage.title')}
            <span className="block text-accent italic font-normal">{t('contactPage.titleAccent')}</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-lg text-muted-foreground max-w-xl mx-auto"
          >
            {t('contactPage.subtitle')}
          </motion.p>
        </div>
      </section>
      <ContactContent />
    </PublicLayout>
  );
}
