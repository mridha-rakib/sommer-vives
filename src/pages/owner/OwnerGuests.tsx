import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { OwnerLayout } from '@/components/layout/OwnerLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Mail, Phone } from 'lucide-react';
import { format } from 'date-fns';
import { da, de, enUS, nl } from 'date-fns/locale';
import { getOwnerGuests, type OwnerGuest } from '@/lib/owner-guests-api';
import { useTranslation } from '@/lib/i18n';

export default function OwnerGuests() {
  const { user } = useAuth();
  const { t, language } = useTranslation();
  const [guests, setGuests] = useState<OwnerGuest[]>([]);
  const [loading, setLoading] = useState(true);
  const dateLocale = { da, en: enUS, de, nl }[language];
  const dateFormat = language === 'en' ? 'MMM d, yyyy' : 'd. MMM yyyy';

  useEffect(() => {
    if (user) loadGuests();
  }, [user]);

  const loadGuests = async () => {
    if (!user) return;
    try {
      setGuests(await getOwnerGuests(user.id));
    } finally {
      setLoading(false);
    }
  };

  return (
    <OwnerLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">{t('owner.guests.title')}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t('owner.guests.subtitle')}</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
        ) : guests.length === 0 ? (
          <div className="text-center py-16">
            <Users className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">{t('owner.guests.empty')}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {guests.map((g, i) => (
              <Card key={i} className="hover:border-accent/20 transition-colors">
                <CardContent className="p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-sm font-semibold text-accent shrink-0">
                      {(g.guest_name || '?')[0].toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-foreground truncate">{g.guest_name || t('owner.guests.unknown')}</div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        {g.guest_email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{g.guest_email}</span>}
                        {g.guest_phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{g.guest_phone}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <Badge variant="secondary" className="text-[10px]">{g.stays} {g.stays === 1 ? t('owner.guests.stay.one') : t('owner.guests.stay.other')}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {t('owner.guests.latest')} {format(new Date(g.check_in), dateFormat, { locale: dateLocale })}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </OwnerLayout>
  );
}
