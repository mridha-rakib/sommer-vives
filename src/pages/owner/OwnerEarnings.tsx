import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { OwnerLayout } from '@/components/layout/OwnerLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Wallet, TrendingUp, ArrowDownRight, Receipt, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';
import { EarningsChart } from '@/components/owner/EarningsChart';

export default function OwnerEarnings() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<any[]>([]);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    const [bRes, pRes] = await Promise.all([
      supabase.from('bookings').select('*').eq('owner_id', user.id).neq('status', 'cancelled').order('check_in', { ascending: false }),
      supabase.from('payouts').select('*').eq('owner_id', user.id).order('created_at', { ascending: false }),
    ]);
    setBookings(bRes.data || []);
    setPayouts(pRes.data || []);
    setLoading(false);
  };

  const totalGross = bookings.reduce((s, b) => s + Number(b.total_amount || 0), 0);
  const totalCommission = bookings.reduce((s, b) => s + Number(b.platform_earnings || 0), 0);
  const totalOwnerPayout = bookings.reduce((s, b) => s + Number(b.owner_payout || 0), 0);
  const completedPayouts = payouts.filter(p => p.status === 'completed').reduce((s, p) => s + Number(p.amount), 0);
  const pendingPayouts = payouts.filter(p => p.status === 'pending').reduce((s, p) => s + Number(p.amount), 0);
  const estimatedTax = totalOwnerPayout * 0.37;

  const kpis = [
    { label: 'Brutto omsætning', value: totalGross, icon: TrendingUp, color: 'text-foreground', bg: 'bg-muted' },
    { label: 'Din indtjening (85%)', value: totalOwnerPayout, icon: Wallet, color: 'text-accent', bg: 'bg-accent/10' },
    { label: 'Kommission (15%)', value: totalCommission, icon: ArrowDownRight, color: 'text-amber-400', bg: 'bg-amber-400/10' },
    { label: 'Udbetalt', value: completedPayouts, icon: DollarSign, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
  ];

  return (
    <OwnerLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Indtjening</h1>
          <p className="text-sm text-muted-foreground mt-1">Overblik over din økonomi og udbetalinger</p>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {kpis.map(kpi => (
            <Card key={kpi.label}>
              <CardContent className="p-4">
                <div className={`w-9 h-9 rounded-lg ${kpi.bg} flex items-center justify-center mb-3`}>
                  <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
                </div>
                <div className="text-xs text-muted-foreground mb-0.5">{kpi.label}</div>
                <div className="font-display text-xl font-bold text-foreground">
                  {loading ? '—' : `${kpi.value.toLocaleString('da-DK')} kr`}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Pending + Tax */}
        <div className="grid md:grid-cols-2 gap-4">
          <Card className="border-accent/20">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-1">
                <Receipt className="w-4 h-4 text-accent" />
                <span className="text-sm font-medium text-foreground">Afventende udbetaling</span>
              </div>
              <div className="font-display text-2xl font-bold text-accent">
                {loading ? '—' : `${pendingPayouts.toLocaleString('da-DK')} kr`}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Beløb klar til næste udbetaling</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-1">
                <ArrowDownRight className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">Estimeret skat (~37%)</span>
              </div>
              <div className="font-display text-2xl font-bold text-foreground">
                {loading ? '—' : `${Math.round(estimatedTax).toLocaleString('da-DK')} kr`}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Vejledende — kontakt din revisor</p>
            </CardContent>
          </Card>
        </div>

        {/* Booking income details */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Booking-niveau indtjening</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-sm text-muted-foreground text-center py-8">Indlæser...</div>
            ) : bookings.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-8">Ingen bookinger endnu</div>
            ) : (
              <div className="space-y-1.5">
                <div className="grid grid-cols-5 gap-2 px-3 py-2 text-[11px] text-muted-foreground uppercase tracking-wide font-medium">
                  <span>Gæst</span>
                  <span>Periode</span>
                  <span className="text-right">Brutto</span>
                  <span className="text-right">Kommission</span>
                  <span className="text-right">Din andel</span>
                </div>
                {bookings.slice(0, 20).map(b => (
                  <div key={b.id} className="grid grid-cols-5 gap-2 px-3 py-2.5 rounded-lg hover:bg-muted/30 text-sm">
                    <span className="text-foreground truncate">{b.guest_name || 'Gæst'}</span>
                    <span className="text-muted-foreground text-xs">
                      {format(new Date(b.check_in), 'd/M', { locale: da })} – {format(new Date(b.check_out), 'd/M', { locale: da })}
                    </span>
                    <span className="text-right text-foreground">{Number(b.total_amount).toLocaleString('da-DK')}</span>
                    <span className="text-right text-amber-400">{Number(b.platform_earnings || 0).toLocaleString('da-DK')}</span>
                    <span className="text-right text-accent font-medium">{Number(b.owner_payout || 0).toLocaleString('da-DK')}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payout history */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Udbetalingshistorik</CardTitle>
          </CardHeader>
          <CardContent>
            {payouts.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Ingen udbetalinger endnu</p>
            ) : (
              <div className="space-y-2">
                {payouts.map(p => (
                  <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <div>
                      <div className="text-sm font-medium text-foreground">{p.description || 'Udbetaling'}</div>
                      <div className="text-xs text-muted-foreground">
                        {p.payout_date ? format(new Date(p.payout_date), 'd. MMM yyyy', { locale: da }) : '—'}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className={p.status === 'completed' ? 'bg-emerald-400/15 text-emerald-400 border-emerald-400/20' : 'bg-amber-400/15 text-amber-400 border-amber-400/20'}>
                        {p.status === 'completed' ? 'Udbetalt' : 'Afventer'}
                      </Badge>
                      <span className="text-sm font-semibold text-foreground">{Number(p.amount).toLocaleString('da-DK')} kr</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </OwnerLayout>
  );
}
