import { useAuth } from '@/lib/auth';
import { OwnerLayout } from '@/components/layout/OwnerLayout';
import { MessageSquare, Calendar, Users, Mail } from 'lucide-react';
import { format } from 'date-fns';
import { da, de, enUS, nl } from 'date-fns/locale';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from '@/lib/i18n';
import { getOwnerInquiries } from '@/lib/owner-inquiries-api';

export default function OwnerInquiries() {
  const { user } = useAuth();
  const { t, language } = useTranslation();
  const { data, isLoading: loading } = useQuery({
    queryKey: ['owner-inquiries', user?.id],
    queryFn: () => getOwnerInquiries(user!.id),
    enabled: !!user?.id,
  });
  const inquiries = data?.inquiries || [];
  const properties = data?.propertiesById || {};
  const dateLocale = { da, en: enUS, de, nl }[language];
  const shortDateFormat = language === 'en' ? 'MMM d' : 'd. MMM';
  const longDateFormat = language === 'en' ? 'MMM d, yyyy' : 'd. MMM yyyy';

  const getStatusBadge = (status: string | null) => {
    const styles: Record<string, string> = {
      new: 'bg-accent/20 text-accent',
      contacted: 'bg-blue-100 text-blue-700',
      confirmed: 'bg-green-100 text-green-700',
      cancelled: 'bg-destructive/10 text-destructive',
    };
    const labels: Record<string, string> = {
      new: t('owner.inquiries.status.new'),
      contacted: t('owner.inquiries.status.contacted'),
      confirmed: t('owner.inquiries.status.confirmed'),
      cancelled: t('owner.inquiries.status.cancelled'),
    };
    const resolvedStatus = status || 'new';
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[resolvedStatus] || styles.new}`}>
        {labels[resolvedStatus] || resolvedStatus}
      </span>
    );
  };

  return (
    <OwnerLayout>
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-primary">{t('owner.inquiries.title')}</h1>
        <p className="text-muted-foreground">{t('owner.inquiries.subtitle')}</p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">{t('owner.inquiries.loading')}</div>
      ) : inquiries.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-12 text-center">
          <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="font-display text-xl font-semibold text-primary mb-2">{t('owner.inquiries.emptyTitle')}</h2>
          <p className="text-muted-foreground">{t('owner.inquiries.emptyDescription')}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {inquiries.map(inquiry => (
            <div key={inquiry.id} className="bg-card rounded-xl border border-border p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-display text-lg font-semibold text-primary">{inquiry.guest_name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {properties[inquiry.property_id]?.title || t('owner.inquiries.unknownProperty')}
                  </p>
                </div>
                {getStatusBadge(inquiry.status)}
              </div>

              <div className="grid md:grid-cols-4 gap-4 mb-4">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-accent" />
                  <span>
                    {format(new Date(inquiry.check_in), shortDateFormat, { locale: dateLocale })} - {format(new Date(inquiry.check_out), longDateFormat, { locale: dateLocale })}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Users className="w-4 h-4 text-accent" />
                  <span>{inquiry.guests} {t(inquiry.guests === 1 ? 'owner.inquiries.guest.one' : 'owner.inquiries.guest.other')}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="w-4 h-4 text-accent" />
                  <a href={`mailto:${inquiry.guest_email}`} className="text-accent hover:underline">
                    {inquiry.guest_email}
                  </a>
                </div>
                <div className="text-sm text-muted-foreground">
                  {format(new Date(inquiry.created_at), longDateFormat, { locale: dateLocale })}
                </div>
              </div>

              {inquiry.message && (
                <div className="bg-muted rounded-lg p-4 text-sm">
                  "{inquiry.message}"
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </OwnerLayout>
  );
}
