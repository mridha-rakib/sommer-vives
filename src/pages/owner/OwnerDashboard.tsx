import { useAuth } from '@/lib/auth';
import { OwnerLayout } from '@/components/layout/OwnerLayout';
import { Link } from 'react-router-dom';
import { 
  CalendarDays, Wallet, TrendingUp, ChevronRight, 
  Crown, Star, Shield, Sparkles, ArrowRight, BookOpen, AlertCircle, RefreshCw
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { format, differenceInDays } from 'date-fns';
import { da, de, enUS, nl } from 'date-fns/locale';
import { useTranslation } from '@/lib/i18n';
import { useQuery } from '@tanstack/react-query';
import { getOwnerDashboard } from '@/lib/owner-dashboard-api';
import { SmartNextSteps } from '@/components/owner/SmartNextSteps';
import {
  getOwnerTaskCompletion,
  getOwnerTaskSignals,
} from '@/lib/owner-tasks-api';

export default function OwnerDashboard() {
  const { user } = useAuth();
  const { t, language } = useTranslation();

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['owner-dashboard', user?.id],
    queryFn: () => getOwnerDashboard(user!.id),
    enabled: !!user?.id,
  });
  const { data: taskSignals } = useQuery({
    queryKey: ['owner-task-signals', user?.id],
    queryFn: () => getOwnerTaskSignals(user!.id),
    enabled: !!user?.id,
  });

  const stats = data?.stats || {
    totalBookings: 0, upcomingBookings: 0, totalEarnings: 0, pendingPayouts: 0,
  };
  const nextArrival = data?.nextArrival || null;
  const recentBookings = data?.recentBookings || [];
  const ownerName = data?.profile?.full_name || user?.email?.split('@')[0] || '';

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return t('owner.dashboard.greetingMorning');
    if (h < 18) return t('owner.dashboard.greetingAfternoon');
    return t('owner.dashboard.greetingEvening');
  };

  const dateLocale = { da, en: enUS, de, nl }[language];
  const dateFormat = language === 'da'
    ? "EEEE 'den' d. MMMM yyyy"
    : language === 'en'
      ? 'EEEE, MMMM d, yyyy'
      : 'EEEE, d. MMMM yyyy';
  const shortDateFormat = language === 'en' ? 'MMM d' : 'd. MMM';
  const localeCode = language === 'da' ? 'da-DK' : language === 'de' ? 'de-DE' : language === 'nl' ? 'nl-NL' : 'en-US';
  const formatMoney = (amount: number) => {
    const formatted = (amount / 100).toLocaleString(localeCode);
    return language === 'da' ? `${formatted} kr` : `DKK ${formatted}`;
  };
  const formatDaysUntil = (days: number) =>
    (days === 1 ? t('owner.dashboard.daysUntilOne') : t('owner.dashboard.daysUntil')).replace('{count}', String(days));

  const firstName = ownerName.split(' ')[0] || t('owner.dashboard.defaultFirstName');
  const taskCompletion = taskSignals ? getOwnerTaskCompletion(taskSignals) : null;

  if (isError) {
    return (
      <OwnerLayout>
        <div className="space-y-8 max-w-5xl mx-auto">
          <Card>
            <CardContent className="p-10 text-center max-w-md mx-auto">
              <div className="w-14 h-14 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-6 h-6 text-destructive/70" />
              </div>
              <h1 className="font-display text-xl font-semibold text-foreground mb-2">{t('owner.dashboard.errorTitle')}</h1>
              <p className="text-sm text-muted-foreground mb-5">
                {error instanceof Error ? error.message : t('owner.dashboard.errorDescription')}
              </p>
              <Button variant="outline" size="sm" className="gap-2 rounded-xl" onClick={() => refetch()} disabled={isFetching}>
                <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
                {t('owner.dashboard.retry')}
              </Button>
            </CardContent>
          </Card>
        </div>
      </OwnerLayout>
    );
  }

  return (
    <OwnerLayout>
      <div className="space-y-8 max-w-5xl mx-auto">

        {/* ── Premium Welcome Hero ── */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[hsl(var(--gold-dark)/0.15)] via-card to-[hsl(var(--gold)/0.08)] border border-[hsl(var(--gold)/0.2)] p-6 md:p-10">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-[hsl(var(--gold)/0.06)] rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-[hsl(var(--gold)/0.04)] rounded-full blur-2xl translate-y-1/2 -translate-x-1/4" />
          
          <div className="relative z-10">
            {/* Member badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[hsl(var(--gold)/0.12)] border border-[hsl(var(--gold)/0.25)] mb-5">
              <Crown className="w-3.5 h-3.5 text-[hsl(var(--gold-light))]" />
              <span className="text-[11px] font-semibold tracking-wider uppercase text-[hsl(var(--gold-light))]">
                {t('owner.dashboard.member')}
              </span>
            </div>

            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">
              {greeting()}, <span className="text-[hsl(var(--gold-light))]">{firstName}</span>
            </h1>
            <p className="text-muted-foreground text-sm md:text-base max-w-lg">
              {format(new Date(), dateFormat, { locale: dateLocale })}
            </p>

            {/* Trust row */}
            <div className="flex flex-wrap items-center gap-4 mt-6 pt-5 border-t border-[hsl(var(--gold)/0.1)]">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                <span>{t('owner.dashboard.insuredHome')}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Star className="w-3.5 h-3.5 text-[hsl(var(--gold-light))]" />
                <span>{t('owner.dashboard.premiumManagement')}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Sparkles className="w-3.5 h-3.5 text-[hsl(var(--gold-light))]" />
                <span>{t('owner.dashboard.dedicatedTeam')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── KPI Cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: t('owner.dashboard.kpi.upcomingBookings'), value: stats.upcomingBookings, icon: CalendarDays, href: '/owner/bookings', color: 'text-accent' },
            { label: t('owner.dashboard.kpi.pendingPayout'), value: formatMoney(stats.pendingPayouts), icon: Wallet, href: '/owner/payouts', color: 'text-emerald-400' },
            { label: t('owner.dashboard.kpi.totalEarnings'), value: formatMoney(stats.totalEarnings), icon: TrendingUp, href: '/owner/earnings', color: 'text-[hsl(var(--gold-light))]' },
            { label: t('owner.dashboard.kpi.totalBookings'), value: stats.totalBookings, icon: BookOpen, href: '/owner/bookings', color: 'text-primary' },
          ].map((kpi) => (
            <Link key={kpi.label} to={kpi.href}>
              <Card className="group hover:border-[hsl(var(--gold)/0.3)] transition-all duration-300 h-full">
                <CardContent className="p-4 md:p-5">
                  <div className={`w-9 h-9 rounded-xl bg-muted/60 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform`}>
                    <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
                  </div>
                  <div className="text-[11px] text-muted-foreground uppercase tracking-wide mb-1">{kpi.label}</div>
                  <div className="font-display text-2xl font-bold text-foreground">
                    {isLoading ? '—' : kpi.value}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* ── Next Arrival ── */}
        {nextArrival && (
          <Card className="border-[hsl(var(--gold)/0.2)] bg-gradient-to-r from-card to-[hsl(var(--gold)/0.04)]">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-[hsl(var(--gold)/0.1)] flex flex-col items-center justify-center shrink-0">
                <span className="text-lg font-bold text-[hsl(var(--gold-light))] leading-none">
                  {format(new Date(nextArrival.check_in), 'd')}
                </span>
                <span className="text-[10px] uppercase text-muted-foreground">
                  {format(new Date(nextArrival.check_in), 'MMM', { locale: dateLocale })}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[10px] font-semibold text-[hsl(var(--gold-light))] uppercase tracking-widest mb-0.5">{t('owner.dashboard.nextArrival')}</div>
                <div className="font-display text-lg font-semibold text-foreground truncate">
                  {nextArrival.guest_name || t('owner.dashboard.guestFallback')}
                </div>
                <div className="text-xs text-muted-foreground">
                  {formatDaysUntil(differenceInDays(new Date(nextArrival.check_in), new Date()))} · {formatMoney(nextArrival.total_amount)}
                </div>
              </div>
              <Link to="/owner/bookings">
                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-[hsl(var(--gold)/0.1)]">
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {taskSignals && (
          <SmartNextSteps
            property={taskSignals.property}
            onboarding={taskSignals.onboarding}
            agreement={taskSignals.agreement}
            listings={taskSignals.listings}
            signals={taskSignals}
            completion={taskCompletion}
          />
        )}

        {/* ── Recent Bookings ── */}
        {recentBookings.length > 0 && (
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display text-base font-semibold text-foreground">{t('owner.dashboard.recentBookings')}</h2>
                <Link to="/owner/bookings" className="text-xs text-accent hover:underline flex items-center gap-1">
                  {t('owner.dashboard.seeAll')} <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
              <div className="space-y-1">
                {recentBookings.map(b => (
                  <div key={b.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/30 transition-colors">
                    <div className="w-10 h-10 rounded-xl bg-muted flex flex-col items-center justify-center leading-none">
                      <span className="text-sm font-bold text-foreground">{format(new Date(b.check_in), 'd')}</span>
                      <span className="text-[9px] text-muted-foreground uppercase">{format(new Date(b.check_in), 'MMM', { locale: dateLocale })}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-foreground truncate">{b.guest_name || t('owner.dashboard.guestFallback')}</div>
                      <div className="text-[11px] text-muted-foreground">
                        {format(new Date(b.check_in), shortDateFormat, { locale: dateLocale })} – {format(new Date(b.check_out), shortDateFormat, { locale: dateLocale })}
                      </div>
                    </div>
                    <div className="text-sm font-semibold text-foreground">{formatMoney(b.total_amount)}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── Quick Links ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: t('owner.nav.property'), href: '/owner/property', icon: '🏡' },
            { label: t('owner.nav.calendar'), href: '/owner/calendar', icon: '📅' },
            { label: t('owner.nav.messages'), href: '/owner/messages', icon: '💬' },
            { label: t('owner.nav.documents'), href: '/owner/documents', icon: '📄' },
          ].map(link => (
            <Link key={link.href} to={link.href}>
              <Card className="group hover:border-[hsl(var(--gold)/0.25)] transition-all duration-300">
                <CardContent className="p-4 flex items-center gap-3">
                  <span className="text-xl">{link.icon}</span>
                  <span className="text-sm font-medium text-foreground group-hover:text-[hsl(var(--gold-light))] transition-colors">{link.label}</span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground/40 ml-auto group-hover:text-accent transition-colors" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

      </div>
    </OwnerLayout>
  );
}
