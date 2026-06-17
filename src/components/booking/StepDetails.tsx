import { useBooking } from './BookingContext';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useTranslation } from '@/lib/i18n';

export const StepDetails = () => {
  const { state, update } = useBooking();
  const { t } = useTranslation();

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="font-display text-3xl md:text-4xl font-semibold text-foreground mb-2">{t('booking.details.title')}</h2>
        <p className="text-muted-foreground">{t('booking.details.subtitle')}</p>
      </div>

      <div className="max-w-lg mx-auto space-y-5">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">{t('booking.details.fullName')}</label>
          <Input value={state.name} onChange={(e) => update({ name: e.target.value })}
            placeholder={t('booking.details.fullNamePlaceholder')} className="bg-card border-border h-12" />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">{t('booking.details.email')}</label>
          <Input type="email" value={state.email} onChange={(e) => update({ email: e.target.value })}
            placeholder={t('booking.details.emailPlaceholder')} className="bg-card border-border h-12" />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">{t('booking.details.phone')}</label>
          <Input type="tel" value={state.phone} onChange={(e) => update({ phone: e.target.value })}
            placeholder="+45 12 34 56 78" className="bg-card border-border h-12" />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">{t('booking.details.message')}</label>
          <Textarea value={state.message} onChange={(e) => update({ message: e.target.value })}
            placeholder={t('booking.details.messagePlaceholder')} className="bg-card border-border min-h-[120px]" />
        </div>
      </div>
    </div>
  );
};
