import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { OwnerLayout } from '@/components/layout/OwnerLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, CalendarDays, ChevronRight, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format, differenceInDays } from 'date-fns';
import type { Locale } from 'date-fns';
import { da, de, enUS, nl } from 'date-fns/locale';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation, type Language } from '@/lib/i18n';
import {
  countUpcomingOwnerBookings,
  filterOwnerBookings,
  getOwnerBookings,
  type OwnerBooking,
  type OwnerBookingFilter,
} from '@/lib/owner-bookings-api';

const dateLocales: Record<Language, Locale> = {
  da,
  en: enUS,
  de,
  nl,
};

const localeCodes: Record<Language, string> = {
  da: 'da-DK',
  en: 'en-US',
  de: 'de-DE',
  nl: 'nl-NL',
};

const propertyTypeKeys: Record<string, string> = {
  Sommerhus: 'summerHouse',
  Feriehus: 'holidayHome',
  Lejlighed: 'apartment',
  Villa: 'villa',
  Poolhus: 'poolHouse',
  Luksushus: 'luxuryHouse',
};

const regionKeys: Record<string, string> = {
  Nordjylland: 'northJutland',
  Midtjylland: 'midJutland',
  Syddanmark: 'southernDenmark',
  Sjælland: 'zealand',
  Hovedstaden: 'capital',
  Bornholm: 'bornholm',
};

const statusConfig: Record<string, { labelKey: string; className: string }> = {
  pending: { labelKey: 'owner.bookings.status.pending', className: 'bg-amber-400/15 text-amber-400 border-amber-400/20' },
  confirmed: { labelKey: 'owner.bookings.status.confirmed', className: 'bg-emerald-400/15 text-emerald-400 border-emerald-400/20' },
  checked_in: { labelKey: 'owner.bookings.status.checkedIn', className: 'bg-blue-400/15 text-blue-400 border-blue-400/20' },
  completed: { labelKey: 'owner.bookings.status.completed', className: 'bg-muted text-muted-foreground border-border' },
  cancelled: { labelKey: 'owner.bookings.status.cancelled', className: 'bg-destructive/15 text-destructive border-destructive/20' },
};

export default function OwnerBookings() {
  const { user } = useAuth();
  const { t, language } = useTranslation();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<OwnerBookingFilter>('upcoming');

  const {
    data: bookings = [],
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['owner-bookings', user?.id],
    queryFn: () => getOwnerBookings(user!.id),
    enabled: !!user?.id,
  });

  useEffect(() => {
    if (!user?.id) return undefined;

    const channel = supabase
      .channel(`owner-bookings-${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bookings' },
        () => queryClient.invalidateQueries({ queryKey: ['owner-bookings', user.id] }),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'inquiries' },
        () => queryClient.invalidateQueries({ queryKey: ['owner-bookings', user.id] }),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, user?.id]);

  const dateLocale = dateLocales[language];
  const shortDateFormat = language === 'en' ? 'MMM d' : 'd. MMM';
  const formatMoney = (amount: number | null | undefined) => {
    if (!amount) return '—';
    const formatted = Number(amount).toLocaleString(localeCodes[language]);
    return language === 'da' ? `${formatted} kr` : `DKK ${formatted}`;
  };
  const translateRegion = (value?: string | null) => {
    if (!value) return '';
    const key = regionKeys[value];
    return key ? t(`owner.property.region.${key}`) : value;
  };
  const translatePropertyType = (value: string) => {
    const key = propertyTypeKeys[value];
    return key ? t(`owner.property.type.${key}`) : value;
  };
  const translateGeneratedTitle = (title?: string | null) => {
    if (!title) return '';
    const generatedTitleMatch = title.match(/^(.+) i (.+)$/);
    if (!generatedTitleMatch) return title;

    const [, type, region] = generatedTitleMatch;
    const translatedType = translatePropertyType(type);
    const translatedRegion = translateRegion(region);
    if (translatedType === type && translatedRegion === region) return title;

    return t('owner.property.generatedTitle')
      .replace('{type}', translatedType)
      .replace('{region}', translatedRegion);
  };
  const formatNights = (nights: number | null | undefined, booking: OwnerBooking) => {
    const nightCount = nights ?? Math.max(1, differenceInDays(new Date(booking.check_out), new Date(booking.check_in)));
    const label = nightCount === 1 ? t('owner.bookings.night.one') : t('owner.bookings.night.other');
    return `${nightCount} ${label}`;
  };
  const formatDaysUntil = (days: number) =>
    (days === 1 ? t('owner.bookings.daysUntil.one') : t('owner.bookings.daysUntil.other')).replace('{count}', String(days));

  const filtered = filterOwnerBookings(bookings, filter);
  const upcomingCount = countUpcomingOwnerBookings(bookings);

  return (
    <OwnerLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">{t('owner.nav.bookings')}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {upcomingCount > 0
                ? t('owner.bookings.upcomingSummary').replace('{count}', String(upcomingCount))
                : t('owner.bookings.subtitle')}
            </p>
          </div>
          <Link to="/owner/calendar">
            <Button variant="outline" size="sm" className="gap-2 text-xs rounded-xl">
              <CalendarDays className="w-3.5 h-3.5" /> {t('owner.nav.calendar')}
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <div className="flex gap-1.5 p-1 bg-muted/40 rounded-xl w-fit">
          {[
            { key: 'upcoming' as const, label: t('owner.bookings.filter.upcoming') },
            { key: 'past' as const, label: t('owner.bookings.filter.past') },
            { key: 'all' as const, label: t('owner.bookings.filter.all') },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filter === f.key
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Bookings list */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="w-6 h-6 border-2 border-[hsl(var(--gold))] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : isError ? (
          <div className="text-center py-20 max-w-sm mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-7 h-7 text-destructive/70" />
            </div>
            <p className="text-foreground text-sm font-medium">{t('owner.bookings.errorTitle')}</p>
            <p className="text-muted-foreground text-xs mt-1 mb-4">{error instanceof Error ? error.message : t('owner.bookings.errorDescription')}</p>
            <Button variant="outline" size="sm" className="gap-2 rounded-xl" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
              {t('owner.bookings.retry')}
            </Button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-muted/40 flex items-center justify-center mx-auto mb-4">
              <CalendarDays className="w-7 h-7 text-muted-foreground/30" />
            </div>
            <p className="text-muted-foreground text-sm">{t('owner.bookings.empty')}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(booking => {
              const status = statusConfig[booking.status || 'pending'] || statusConfig.pending;
              const daysUntil = differenceInDays(new Date(booking.check_in), new Date());
              const isUpcoming = daysUntil >= 0 && booking.status !== 'cancelled';
              const propertyTitle = translateGeneratedTitle(booking.property?.title);

              return (
                <Card key={booking.id} className="group hover:border-[hsl(var(--gold)/0.2)] transition-all duration-200">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      {/* Date pill */}
                      <div className="w-12 h-14 rounded-xl bg-muted/50 flex flex-col items-center justify-center shrink-0">
                        <span className="text-base font-bold text-foreground leading-none">
                          {format(new Date(booking.check_in), 'd')}
                        </span>
                        <span className="text-[10px] text-muted-foreground uppercase mt-0.5">
                          {format(new Date(booking.check_in), 'MMM', { locale: dateLocale })}
                        </span>
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-sm font-semibold text-foreground truncate">
                            {booking.guest_name || t('owner.dashboard.guestFallback')}
                          </span>
                          <Badge variant="outline" className={`text-[10px] shrink-0 ${status.className}`}>
                            {t(status.labelKey)}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(booking.check_in), shortDateFormat, { locale: dateLocale })} → {format(new Date(booking.check_out), shortDateFormat, { locale: dateLocale })}
                          {' · '}{formatNights(booking.nights, booking)}
                          {isUpcoming && daysUntil <= 14 && (
                            <span className="text-[hsl(var(--gold-light))] ml-1.5">· {formatDaysUntil(daysUntil)}</span>
                          )}
                        </div>
                        {propertyTitle && (
                          <div className="text-[11px] text-muted-foreground/70 truncate mt-0.5">{propertyTitle}</div>
                        )}
                      </div>

                      {/* Amount */}
                      <div className="text-right shrink-0">
                        {booking.owner_payout ? (
                          <>
                            <div className="text-sm font-bold text-[hsl(var(--gold-light))]">
                              {formatMoney(booking.owner_payout)}
                            </div>
                            <div className="text-[10px] text-muted-foreground">{t('owner.bookings.ownerShare')}</div>
                          </>
                        ) : (
                          <div className="text-sm font-semibold text-foreground">
                            {formatMoney(booking.total_amount)}
                          </div>
                        )}
                      </div>

                      <ChevronRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-[hsl(var(--gold-light))] transition-colors shrink-0" />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </OwnerLayout>
  );
}
