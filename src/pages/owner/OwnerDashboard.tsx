import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { OwnerLayout } from '@/components/layout/OwnerLayout';
import { Link } from 'react-router-dom';
import { 
  CalendarDays, Wallet, Building2, TrendingUp, Users, CheckSquare, 
  ArrowRight, Clock, MessageCircle, ChevronRight, Sparkles
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AppDownloadBanner } from '@/components/app/AppDownloadBanner';
import { OwnerStatusWidget } from '@/components/owner/OwnerStatusWidget';
import { SmartNextSteps } from '@/components/owner/SmartNextSteps';
import { PropertyActivationTimeline } from '@/components/owner/PropertyActivationTimeline';
import { ListingReadinessScore } from '@/components/owner/ListingReadinessScore';
import { format, differenceInDays } from 'date-fns';
import { da } from 'date-fns/locale';

interface BookingSummary {
  id: string;
  check_in: string;
  check_out: string;
  guest_name: string | null;
  status: string | null;
  total_amount: number;
}

export default function OwnerDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    properties: 0, publishedProperties: 0, totalBookings: 0,
    upcomingBookings: 0, totalEarnings: 0, pendingPayouts: 0,
    openInquiries: 0, pendingTasks: 0,
  });
  const [nextArrival, setNextArrival] = useState<BookingSummary | null>(null);
  const [recentBookings, setRecentBookings] = useState<BookingSummary[]>([]);
  const [property, setProperty] = useState<any>(null);
  const [onboarding, setOnboarding] = useState<any>(null);
  const [agreement, setAgreement] = useState<any>(null);
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) loadDashboard();
  }, [user]);

  const loadDashboard = async () => {
    if (!user) return;
    const today = new Date().toISOString().split('T')[0];

    const [propsRes, bookingsRes, payoutsRes, onbRes, agrRes, listRes] = await Promise.all([
      supabase.from('properties').select('*').eq('owner_id', user.id).limit(1).single(),
      supabase.from('bookings').select('id, check_in, check_out, guest_name, status, total_amount, owner_payout')
        .eq('owner_id', user.id).order('check_in', { ascending: true }),
      supabase.from('payouts').select('amount, status').eq('owner_id', user.id),
      supabase.from('owner_onboarding').select('*').eq('owner_id', user.id).limit(1).single(),
      supabase.from('agreements').select('*').eq('owner_id', user.id).order('created_at', { ascending: false }).limit(1).single(),
      supabase.from('listings').select('*').eq('owner_id', user.id),
    ]);

    const prop = propsRes.data;
    const bookings = bookingsRes.data || [];
    const payouts = payoutsRes.data || [];
    const upcoming = bookings.filter(b => b.check_in >= today && b.status !== 'cancelled');
    const totalEarnings = payouts.filter(p => p.status === 'completed').reduce((s, p) => s + Number(p.amount), 0);
    const pendingPayouts = payouts.filter(p => p.status === 'pending').reduce((s, p) => s + Number(p.amount), 0);

    setProperty(prop);
    setOnboarding(onbRes.data);
    setAgreement(agrRes.data);
    setListings(listRes.data || []);
    setStats({
      properties: prop ? 1 : 0,
      publishedProperties: prop?.status === 'published' ? 1 : 0,
      totalBookings: bookings.filter(b => b.status !== 'cancelled').length,
      upcomingBookings: upcoming.length,
      totalEarnings, pendingPayouts,
      openInquiries: 0,
      pendingTasks: 0,
    });
    setNextArrival(upcoming[0] || null);
    setRecentBookings(upcoming.slice(0, 5));
    setLoading(false);
  };

  const kpiCards = [
    { label: 'Kommende bookinger', value: stats.upcomingBookings, icon: CalendarDays, href: '/owner/bookings' },
    { label: 'Forventet udbetaling', value: `${stats.pendingPayouts.toLocaleString('da-DK')} kr`, icon: Wallet, href: '/owner/earnings' },
    { label: 'Total indtjening', value: `${stats.totalEarnings.toLocaleString('da-DK')} kr`, icon: TrendingUp, href: '/owner/earnings' },
    { label: 'Opgaver', value: stats.pendingTasks, icon: CheckSquare, href: '/owner/tasks' },
  ];

  return (
    <OwnerLayout>
      <div className="space-y-6">
        {/* Welcome */}
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">
            Dit overblik
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {format(new Date(), 'EEEE d. MMMM', { locale: da })} — alt er samlet her
          </p>
        </div>

        {/* Smart Status + Next Steps */}
        <div className="grid lg:grid-cols-2 gap-4">
          <OwnerStatusWidget
            property={property}
            onboarding={onboarding}
            agreement={agreement}
            listings={listings}
            stats={stats}
          />
          <SmartNextSteps
            property={property}
            onboarding={onboarding}
            agreement={agreement}
            listings={listings}
          />
        </div>

        {/* Next Arrival highlight */}
        {nextArrival && (
          <Card className="border-accent/20 bg-accent/5">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-accent/15 flex items-center justify-center shrink-0">
                <CalendarDays className="w-5 h-5 text-accent" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-medium text-accent uppercase tracking-wide">Næste ankomst</div>
                <div className="font-display text-lg font-semibold text-foreground truncate">
                  {nextArrival.guest_name || 'Gæst'}
                </div>
                <div className="text-sm text-muted-foreground">
                  {format(new Date(nextArrival.check_in), 'd. MMM yyyy', { locale: da })}
                  {' · '}
                  {differenceInDays(new Date(nextArrival.check_in), new Date())} dage
                </div>
              </div>
              <Link to="/owner/bookings">
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </Link>
            </CardContent>
          </Card>
        )}

        {/* KPI Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {kpiCards.map((kpi) => (
            <Link key={kpi.label} to={kpi.href}>
              <Card className="hover:border-accent/30 transition-colors cursor-pointer h-full">
                <CardContent className="p-4">
                  <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center mb-3">
                    <kpi.icon className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="text-xs text-muted-foreground mb-0.5">{kpi.label}</div>
                  <div className="font-display text-xl font-bold text-foreground">
                    {loading ? '—' : kpi.value}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Three columns: Bookings | Timeline | Readiness */}
        <div className="grid lg:grid-cols-3 gap-4">
          {/* Recent bookings */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Bookinger</CardTitle>
                  <Link to="/owner/bookings" className="text-xs text-accent hover:underline flex items-center gap-1">
                    Alle <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                {loading ? (
                  <div className="text-sm text-muted-foreground py-6 text-center">Indlæser...</div>
                ) : recentBookings.length === 0 ? (
                  <div className="text-center py-6">
                    <CalendarDays className="w-7 h-7 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground">Ingen kommende</p>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {recentBookings.slice(0, 4).map(b => (
                      <div key={b.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/30 transition-colors">
                        <div className="w-9 h-9 rounded-lg bg-muted flex flex-col items-center justify-center text-center leading-none">
                          <span className="text-xs font-bold text-foreground">{format(new Date(b.check_in), 'd')}</span>
                          <span className="text-[9px] text-muted-foreground">{format(new Date(b.check_in), 'MMM', { locale: da })}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-foreground truncate">{b.guest_name || 'Gæst'}</div>
                          <div className="text-[11px] text-muted-foreground">
                            {format(new Date(b.check_in), 'd/M')} – {format(new Date(b.check_out), 'd/M')}
                          </div>
                        </div>
                        <div className="text-xs font-medium text-foreground">{b.total_amount.toLocaleString('da-DK')} kr</div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Activation Timeline */}
          <PropertyActivationTimeline onboarding={onboarding} />

          {/* Listing Readiness */}
          <ListingReadinessScore property={property} listings={listings} />
        </div>

        {/* App download */}
        <AppDownloadBanner variant="compact" context="owner" />
      </div>
    </OwnerLayout>
  );
}
