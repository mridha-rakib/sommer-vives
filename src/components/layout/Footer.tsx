import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { BrandLogo } from '@/components/ui/BrandLogo';

export function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="bg-card text-foreground">
      <div className="container mx-auto px-4 md:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12">
          <div className="md:col-span-1">
            <BrandLogo variant="mark" tone="light" size="lg" className="mb-4" />
            <p className="text-foreground/70 text-sm leading-relaxed">{t('footer.desc')}</p>
          </div>

          <div>
            <h4 className="font-display text-lg font-semibold mb-4">{t('footer.forOwners')}</h4>
            <ul className="space-y-2">
              <li><Link to="/how-it-works" className="text-sm text-foreground/70 hover:text-primary transition-colors">{t('footer.howItWorks')}</Link></li>
              <li><Link to="/pricing" className="text-sm text-foreground/70 hover:text-primary transition-colors">{t('footer.prices')}</Link></li>
              <li><Link to="/kom-i-gang" className="text-sm text-foreground/70 hover:text-primary transition-colors">{t('footer.createHouse')}</Link></li>
              <li><Link to="/refer-a-host" className="text-sm text-foreground/70 hover:text-primary transition-colors">{t('footer.referHost')}</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-display text-lg font-semibold mb-4">{t('footer.aboutUs')}</h4>
            <ul className="space-y-2">
              <li><Link to="/about" className="text-sm text-foreground/70 hover:text-primary transition-colors">{t('footer.ourStory')}</Link></li>
              <li><Link to="/about#kontakt" className="text-sm text-foreground/70 hover:text-primary transition-colors">{t('footer.contactUs')}</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-display text-lg font-semibold mb-4">{t('footer.contact')}</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-sm text-foreground/70">
                <Mail className="h-4 w-4 text-primary" />kontakt@sommervibes.dk
              </li>
              <li className="flex items-center gap-2 text-sm text-foreground/70">
                <Phone className="h-4 w-4 text-primary" />+45 12 34 56 78
              </li>
              <li className="flex items-center gap-2 text-sm text-foreground/70">
                <MapPin className="h-4 w-4 text-primary" />København, Danmark
              </li>
            </ul>
            <div className="mt-4 space-y-1.5">
              <p className="text-xs text-foreground/50 font-semibold uppercase tracking-wider mb-2">{t('footer.hours')}</p>
              {[
                { day: t('footer.day.mon'), hours: '10.00 – 16.00' },
                { day: t('footer.day.tue'), hours: '10.00 – 16.00' },
                { day: t('footer.day.wed'), hours: '10.00 – 16.00' },
                { day: t('footer.day.thu'), hours: '10.00 – 16.00' },
                { day: t('footer.day.fri'), hours: t('footer.byAppointment') },
                { day: t('footer.day.sat'), hours: t('footer.byAppointment') },
                { day: t('footer.day.sun'), hours: t('footer.byAppointment') },
              ].map(row => (
                <div key={row.day} className="flex items-center gap-3 text-sm text-foreground/70">
                  <span className="w-20 shrink-0">{row.day}</span>
                  <span>{row.hours}</span>
                </div>
              ))}
              <p className="text-xs text-foreground/50 mt-3">{t('footer.chatSupport')}</p>
            </div>
          </div>
        </div>

        <div className="border-t border-foreground/10 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-foreground/50">© {new Date().getFullYear()} SommerVibes. {t('footer.rights')}</p>
          <div className="flex gap-6">
            <Link to="/privacy" className="text-sm text-foreground/50 hover:text-primary transition-colors">{t('footer.privacy')}</Link>
            <Link to="/terms" className="text-sm text-foreground/50 hover:text-primary transition-colors">{t('footer.terms')}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
