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
import { format, differenceInDays, isFuture, isToday } from 'date-fns';
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
    properties: 0,
    publishedProperties: 0,
    totalBookings: 0,
    upcomingBookings: 0,
    totalEarnings: 0,
    pendingPayouts: 0,
    openInquiries: 0,
    pendingTasks: 0,
  });
  const [nextArrival, setNextArrival] = useState<BookingSummary | null>(null);
  const [nextDeparture, setNextDeparture] = useState<BookingSummary | null>(null);
  const [recentBookings, setRecentBookings] = useState<BookingSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) loadDashboard();
  }, [user]);

  const loadDashboard = async () => {
    if (!user) return;
    const today = new Date().toISOString().split('T')[0];

    const [propsRes, bookingsRes, payoutsRes, inquiriesRes, tasksRes] = await Promise.all([
      supabase.from('properties').select('id, status').eq('owner_id', user.id),
      supabase.from('bookings').select('id, check_in, check_out, guest_name, status, total_amount, owner_payout')
        .eq('owner_id', user.id).order('check_in', { ascending: true }),
      supabase.from('payouts').select('amount, status').eq('owner_id', user.id),
      supabase.from('inquiries').select('id', { count: 'exact', head: true })
        .in('property_id', (await supabase.from('properties').select('id').eq('owner_id', user.id)).data?.map(p => p.id) || [])
        .eq('status', 'new'),
      supabase.from('properties').select('id').eq('owner_id', user.id).eq('status', 'draft'),
    ]);

    const props = propsRes.data || [];
    const bookings = bookingsRes.data || [];
    const payouts = payoutsRes.data || [];
    
    const upcoming = bookings.filter(b => b.check_in >= today && b.status !== 'cancelled');
    const arrival = upcoming[0] || null;
    const departure = bookings.find(b => b.check_out >= today && b.status === 'checked_in') || null;
    
    const totalEarnings = payouts.filter(p => p.status === 'completed').reduce((s, p) => s + Number(p.amount), 0);
    const pendingPayouts = payouts.filter(p => p.status === 'pending').reduce((s, p) => s + Number(p.amount), 0);

    setStats({
      properties: props.length,
      publishedProperties: props.filter(p => p.status === 'published').length,
      totalBookings: bookings.filter(b => b.status !== 'cancelled').length,
      upcomingBookings: upcoming.length,
      totalEarnings,
      pendingPayouts,
      openInquiries: inquiriesRes.count || 0,
      pendingTasks: tasksRes.data?.length || 0,
    });
    setNextArrival(arrival);
    setNextDeparture(departure);
    setRecentBookings(upcoming.slice(0, 5));
    setLoading(false);
  };

  const kpiCards = [
    { label: 'Kommende bookinger', value: stats.upcomingBookings, icon: CalendarDays, color: 'text-blue-400', bg: 'bg-blue-400/10', href: '/owner/bookings' },
    { label: 'Forventet udbetaling', value: `${stats.pendingPayouts.toLocaleString('da-DK')} kr`, icon: Wallet, color: 'text-accent', bg: 'bg-accent/10', href: '/owner/earnings' },
    { label: 'Åbne forespørgsler', value: stats.openInquiries, icon: MessageCircle, color: 'text-emerald-400', bg: 'bg-emerald-400/10', href: '/owner/bookings' },
    { label: 'Opgaver', value: stats.pendingTasks, icon: CheckSquare, color: 'text-amber-400', bg: 'bg-amber-400/10', href: '/owner/tasks' },
  ];

  return (
    <OwnerLayout>
      <div className="space-y-6">
        {/* Welcome */}
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">
            Velkommen tilbage
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Her er dit overblik for {format(new Date(), 'EEEE d. MMMM', { locale: da })}
          </p>
        </div>

        {/* Next Arrival / Departure */}
        {(nextArrival || nextDeparture) && (
          <div className="grid md:grid-cols-2 gap-4">
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
                  <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                </CardContent>
              </Card>
            )}
            {nextDeparture && (
              <Card className="border-blue-400/20 bg-blue-400/5">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-400/15 flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5 text-blue-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-medium text-blue-400 uppercase tracking-wide">Næste afrejse</div>
                    <div className="font-display text-lg font-semibold text-foreground truncate">
                      {nextDeparture.guest_name || 'Gæst'}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {format(new Date(nextDeparture.check_out), 'd. MMM yyyy', { locale: da })}
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* KPI Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {kpiCards.map((kpi) => (
            <Link key={kpi.label} to={kpi.href}>
              <Card className="hover:border-accent/30 transition-colors cursor-pointer h-full">
                <CardContent className="p-4">
                  <div className={`w-9 h-9 rounded-lg ${kpi.bg} flex items-center justify-center mb-3`}>
                    <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
                  </div>
                  <div className="text-xs text-muted-foreground mb-0.5">{kpi.label}</div>
                  <div className="font-display text-xl md:text-2xl font-bold text-foreground">
                    {loading ? '—' : kpi.value}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Two columns */}
        <div className="grid lg:grid-cols-5 gap-4 md:gap-6">
          {/* Upcoming bookings */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold">Kommende bookinger</CardTitle>
                  <Link to="/owner/bookings" className="text-xs text-accent hover:underline flex items-center gap-1">
                    Se alle <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="px-6 pb-4">
                {loading ? (
                  <div className="text-sm text-muted-foreground py-8 text-center">Indlæser...</div>
                ) : recentBookings.length === 0 ? (
                  <div className="text-center py-8">
                    <CalendarDays className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Ingen kommende bookinger</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {recentBookings.map(booking => (
                      <div key={booking.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/30 transition-colors">
                        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-xs font-bold text-foreground">
                          {format(new Date(booking.check_in), 'd', { locale: da })}
                          <br />
                          {format(new Date(booking.check_in), 'MMM', { locale: da })}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-foreground truncate">
                            {booking.guest_name || 'Gæst'}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {format(new Date(booking.check_in), 'd. MMM', { locale: da })} – {format(new Date(booking.check_out), 'd. MMM', { locale: da })}
                          </div>
                        </div>
                        <Badge variant="outline" className="text-[10px] shrink-0">
                          {booking.status === 'confirmed' ? 'Bekræftet' : booking.status === 'pending' ? 'Afventer' : booking.status}
                        </Badge>
                        <div className="text-sm font-medium text-foreground shrink-0">
                          {booking.total_amount.toLocaleString('da-DK')} kr
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick actions */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Hurtige handlinger</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {[
                  { label: 'Se min bolig', href: '/owner/property', icon: Building2 },
                  { label: 'Se indtjening', href: '/owner/earnings', icon: TrendingUp },
                  { label: 'Åbn kalender', href: '/owner/calendar', icon: CalendarDays },
                  { label: 'Kontakt support', href: '/owner/support', icon: MessageCircle },
                ].map(action => (
                  <Link key={action.href} to={action.href}>
                    <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/40 transition-colors cursor-pointer group">
                      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                        <action.icon className="w-4 h-4 text-muted-foreground group-hover:text-accent transition-colors" />
                      </div>
                      <span className="text-sm text-foreground">{action.label}</span>
                      <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto" />
                    </div>
                  </Link>
                ))}
              </CardContent>
            </Card>

            {/* SommerVibes status */}
            <Card className="border-accent/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-accent" />
                  <span className="text-sm font-medium text-foreground">SommerVibes Status</span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Boliger</span>
                    <span className="text-foreground font-medium">{loading ? '—' : stats.publishedProperties} aktiv</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Total bookinger</span>
                    <span className="text-foreground font-medium">{loading ? '—' : stats.totalBookings}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Total indtjening</span>
                    <span className="text-accent font-semibold">{loading ? '—' : `${stats.totalEarnings.toLocaleString('da-DK')} kr`}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* App download banner */}
          <AppDownloadBanner variant="compact" context="owner" className="mt-6" />
        </div>
      </div>
    </OwnerLayout>
  );
}
