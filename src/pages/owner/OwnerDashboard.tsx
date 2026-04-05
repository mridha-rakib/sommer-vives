import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { OwnerLayout } from '@/components/layout/OwnerLayout';
import { Link } from 'react-router-dom';
import { 
  CalendarDays, Wallet, TrendingUp, ChevronRight, 
  Crown, Star, Shield, Sparkles, ArrowRight, BookOpen
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { format, differenceInDays } from 'date-fns';
import { da } from 'date-fns/locale';

interface BookingSummary {
  id: string;
  check_in: string;
  check_out: string;
  guest_name: string | null;
  status: string | null;
  total_amount: number;
  owner_payout: number | null;
  created_at: string | null;
}

export default function OwnerDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalBookings: 0, upcomingBookings: 0, totalEarnings: 0, pendingPayouts: 0,
  });
  const [nextArrival, setNextArrival] = useState<BookingSummary | null>(null);
  const [recentBookings, setRecentBookings] = useState<BookingSummary[]>([]);
  const [property, setProperty] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [ownerName, setOwnerName] = useState('');

  useEffect(() => {
    if (user) loadDashboard();
  }, [user]);

  const loadDashboard = async () => {
    if (!user) return;
    const today = new Date().toISOString().split('T')[0];

    const [propsRes, bookingsRes, payoutsRes, profileRes] = await Promise.all([
      supabase.from('properties').select('*').eq('owner_id', user.id).limit(1).single(),
      supabase.from('bookings').select('id, check_in, check_out, guest_name, status, total_amount, owner_payout, created_at')
        .eq('owner_id', user.id).order('check_in', { ascending: true }),
      supabase.from('payouts').select('amount, status').eq('owner_id', user.id),
      supabase.from('profiles').select('full_name').eq('id', user.id).single(),
    ]);

    const prop = propsRes.data;
    const bookings = bookingsRes.data || [];
    const payouts = payoutsRes.data || [];
    const upcoming = bookings.filter(b => b.check_in >= today && b.status !== 'cancelled');
    const totalEarnings = payouts.filter(p => p.status === 'completed').reduce((s, p) => s + Number(p.amount), 0);
    const pendingPayouts = payouts.filter(p => p.status === 'pending').reduce((s, p) => s + Number(p.amount), 0);

    setProperty(prop);
    setOwnerName(profileRes.data?.full_name || user.email?.split('@')[0] || '');
    setStats({
      totalBookings: bookings.filter(b => b.status !== 'cancelled').length,
      upcomingBookings: upcoming.length,
      totalEarnings, pendingPayouts,
    });
    setNextArrival(upcoming[0] || null);
    setRecentBookings(upcoming.slice(0, 4));
    setLoading(false);
  };

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Godmorgen';
    if (h < 18) return 'God eftermiddag';
    return 'God aften';
  };

  const firstName = ownerName.split(' ')[0] || 'der';

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
                SommerVibes Medlem
              </span>
            </div>

            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">
              {greeting()}, <span className="text-[hsl(var(--gold-light))]">{firstName}</span>
            </h1>
            <p className="text-muted-foreground text-sm md:text-base max-w-lg">
              {format(new Date(), "EEEE 'den' d. MMMM yyyy", { locale: da })}
            </p>

            {/* Trust row */}
            <div className="flex flex-wrap items-center gap-4 mt-6 pt-5 border-t border-[hsl(var(--gold)/0.1)]">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                <span>Forsikret bolig</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Star className="w-3.5 h-3.5 text-[hsl(var(--gold-light))]" />
                <span>Premium formidling</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Sparkles className="w-3.5 h-3.5 text-[hsl(var(--gold-light))]" />
                <span>Dedikeret team</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── KPI Cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'Kommende bookinger', value: stats.upcomingBookings, icon: CalendarDays, href: '/owner/bookings', color: 'text-accent' },
            { label: 'Afventer udbetaling', value: `${stats.pendingPayouts.toLocaleString('da-DK')} kr`, icon: Wallet, href: '/owner/payouts', color: 'text-emerald-400' },
            { label: 'Total indtjening', value: `${stats.totalEarnings.toLocaleString('da-DK')} kr`, icon: TrendingUp, href: '/owner/earnings', color: 'text-[hsl(var(--gold-light))]' },
            { label: 'Samlede bookinger', value: stats.totalBookings, icon: BookOpen, href: '/owner/bookings', color: 'text-primary' },
          ].map((kpi) => (
            <Link key={kpi.label} to={kpi.href}>
              <Card className="group hover:border-[hsl(var(--gold)/0.3)] transition-all duration-300 h-full">
                <CardContent className="p-4 md:p-5">
                  <div className={`w-9 h-9 rounded-xl bg-muted/60 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform`}>
                    <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
                  </div>
                  <div className="text-[11px] text-muted-foreground uppercase tracking-wide mb-1">{kpi.label}</div>
                  <div className="font-display text-2xl font-bold text-foreground">
                    {loading ? '—' : kpi.value}
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
                  {format(new Date(nextArrival.check_in), 'MMM', { locale: da })}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[10px] font-semibold text-[hsl(var(--gold-light))] uppercase tracking-widest mb-0.5">Næste ankomst</div>
                <div className="font-display text-lg font-semibold text-foreground truncate">
                  {nextArrival.guest_name || 'Gæst'}
                </div>
                <div className="text-xs text-muted-foreground">
                  om {differenceInDays(new Date(nextArrival.check_in), new Date())} dage · {nextArrival.total_amount.toLocaleString('da-DK')} kr
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

        {/* ── Recent Bookings ── */}
        {recentBookings.length > 0 && (
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display text-base font-semibold text-foreground">Kommende bookinger</h2>
                <Link to="/owner/bookings" className="text-xs text-accent hover:underline flex items-center gap-1">
                  Se alle <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
              <div className="space-y-1">
                {recentBookings.map(b => (
                  <div key={b.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/30 transition-colors">
                    <div className="w-10 h-10 rounded-xl bg-muted flex flex-col items-center justify-center leading-none">
                      <span className="text-sm font-bold text-foreground">{format(new Date(b.check_in), 'd')}</span>
                      <span className="text-[9px] text-muted-foreground uppercase">{format(new Date(b.check_in), 'MMM', { locale: da })}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-foreground truncate">{b.guest_name || 'Gæst'}</div>
                      <div className="text-[11px] text-muted-foreground">
                        {format(new Date(b.check_in), 'd. MMM', { locale: da })} – {format(new Date(b.check_out), 'd. MMM', { locale: da })}
                      </div>
                    </div>
                    <div className="text-sm font-semibold text-foreground">{b.total_amount.toLocaleString('da-DK')} kr</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── Quick Links ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Min bolig', href: '/owner/property', icon: '🏡' },
            { label: 'Kalender', href: '/owner/calendar', icon: '📅' },
            { label: 'Beskeder', href: '/owner/messages', icon: '💬' },
            { label: 'Dokumenter', href: '/owner/documents', icon: '📄' },
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
