import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { OwnerLayout } from '@/components/layout/OwnerLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Wallet, TrendingUp, CreditCard, CheckCircle2, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';
import { EarningsChart } from '@/components/owner/EarningsChart';

export default function OwnerEarnings() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<any[]>([]);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'overview' | 'payouts'>('overview');

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

  const totalOwnerPayout = bookings.reduce((s, b) => s + Number(b.owner_payout || 0), 0);
  const completedPayouts = payouts.filter(p => p.status === 'completed').reduce((s, p) => s + Number(p.amount), 0);
  const pendingPayouts = payouts.filter(p => p.status === 'pending').reduce((s, p) => s + Number(p.amount), 0);

  const kpis = [
    { label: 'Din indtjening', value: totalOwnerPayout, icon: TrendingUp, accent: true },
    { label: 'Udbetalt', value: completedPayouts, icon: CheckCircle2, accent: false },
    { label: 'Afventer', value: pendingPayouts, icon: Clock, accent: false },
  ];

  return (
    <OwnerLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">Økonomi</h1>
          <p className="text-sm text-muted-foreground mt-1">Følg din indtjening og udbetalinger</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-3 gap-3">
          {kpis.map(kpi => (
            <Card key={kpi.label} className={kpi.accent ? 'border-[hsl(var(--gold)/0.2)] bg-gradient-to-br from-[hsl(var(--gold)/0.06)] to-transparent' : ''}>
              <CardContent className="p-4 md:p-5">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${
                  kpi.accent ? 'bg-[hsl(var(--gold)/0.12)]' : 'bg-muted/60'
                }`}>
                  <kpi.icon className={`w-4 h-4 ${kpi.accent ? 'text-[hsl(var(--gold-light))]' : 'text-muted-foreground'}`} />
                </div>
                <div className="text-[11px] text-muted-foreground uppercase tracking-wide mb-1">{kpi.label}</div>
                <div className={`font-display text-xl md:text-2xl font-bold ${kpi.accent ? 'text-[hsl(var(--gold-light))]' : 'text-foreground'}`}>
                  {loading ? '—' : `${kpi.value.toLocaleString('da-DK')} kr`}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tab toggle */}
        <div className="flex gap-1.5 p-1 bg-muted/40 rounded-xl w-fit">
          {[
            { key: 'overview' as const, label: 'Overblik' },
            { key: 'payouts' as const, label: 'Udbetalinger' },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
                tab === t.key
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'overview' ? (
          <>
            <EarningsChart bookings={bookings} />

            {/* Recent bookings earnings */}
            {bookings.length > 0 && (
              <Card>
                <CardContent className="p-5">
                  <h3 className="text-sm font-semibold text-foreground mb-4">Seneste bookinger</h3>
                  <div className="space-y-2">
                    {bookings.slice(0, 8).map(b => (
                      <div key={b.id} className="flex items-center justify-between py-2.5 border-b border-border/30 last:border-0">
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-foreground truncate">{b.guest_name || 'Gæst'}</div>
                          <div className="text-xs text-muted-foreground">
                            {format(new Date(b.check_in), 'd. MMM', { locale: da })} – {format(new Date(b.check_out), 'd. MMM', { locale: da })}
                          </div>
                        </div>
                        <span className="text-sm font-semibold text-[hsl(var(--gold-light))] shrink-0">
                          {Number(b.owner_payout || 0).toLocaleString('da-DK')} kr
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        ) : (
          <>
            {/* Pending payouts */}
            {payouts.filter(p => p.status === 'pending').length > 0 && (
              <Card className="border-[hsl(var(--gold)/0.2)] bg-[hsl(var(--gold)/0.03)]">
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Clock className="w-4 h-4 text-[hsl(var(--gold-light))]" />
                    <span className="text-sm font-semibold text-foreground">Kommende udbetalinger</span>
                  </div>
                  <div className="space-y-2">
                    {payouts.filter(p => p.status === 'pending').map(p => (
                      <div key={p.id} className="flex items-center justify-between p-3 rounded-xl bg-card">
                        <div>
                          <div className="text-sm font-medium text-foreground">{p.description || 'Udbetaling'}</div>
                          <div className="text-xs text-muted-foreground">
                            {p.payout_date ? format(new Date(p.payout_date), 'd. MMM yyyy', { locale: da }) : 'Dato afventes'}
                          </div>
                        </div>
                        <span className="text-sm font-bold text-[hsl(var(--gold-light))]">{Number(p.amount).toLocaleString('da-DK')} kr</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Payout history */}
            <Card>
              <CardContent className="p-5">
                <h3 className="text-sm font-semibold text-foreground mb-4">Udbetalingshistorik</h3>
                {payouts.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-14 h-14 rounded-2xl bg-muted/40 flex items-center justify-center mx-auto mb-3">
                      <Wallet className="w-6 h-6 text-muted-foreground/30" />
                    </div>
                    <p className="text-sm text-muted-foreground">Ingen udbetalinger endnu</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">Udbetaling sker automatisk 5 hverdage efter afrejse</p>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {payouts.map(p => (
                      <div key={p.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/30 transition-colors">
                        <div>
                          <div className="text-sm font-medium text-foreground">{p.description || 'Udbetaling'}</div>
                          <div className="text-xs text-muted-foreground">
                            {format(new Date(p.created_at), 'd. MMM yyyy', { locale: da })}
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <Badge variant="outline" className={`text-[10px] ${
                            p.status === 'completed' ? 'bg-emerald-400/15 text-emerald-400 border-emerald-400/20' : 'bg-amber-400/15 text-amber-400 border-amber-400/20'
                          }`}>
                            {p.status === 'completed' ? 'Udbetalt' : 'Afventer'}
                          </Badge>
                          <span className="text-sm font-semibold text-foreground">
                            {Number(p.amount).toLocaleString('da-DK')} kr
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* How it works */}
            <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/30 border border-border/40">
              <CreditCard className="w-5 h-5 text-muted-foreground shrink-0" />
              <p className="text-xs text-muted-foreground">
                Vi overfører automatisk til din konto 5 hverdage efter gæstens afrejse. Ingen opsætning nødvendig.
              </p>
            </div>
          </>
        )}
      </div>
    </OwnerLayout>
  );
}
