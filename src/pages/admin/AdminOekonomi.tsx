import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { AdminPageHeader } from '@/components/admin/ui/AdminPageHeader';
import { KPICard } from '@/components/admin/ui/KPICard';
import { StatusChip } from '@/components/admin/ui/StatusChip';
import { EmptyState } from '@/components/admin/ui/EmptyState';
import { supabase } from '@/integrations/supabase/client';
import { formatDKK } from '@/lib/status-badges';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { CreditCard, ArrowUpRight, Wallet, TrendingUp } from 'lucide-react';

export default function AdminOekonomi() {
  const [payments, setPayments] = useState<any[]>([]);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('overview');

  useEffect(() => {
    Promise.all([
      supabase.from('payments').select('*').order('created_at', { ascending: false }).limit(50),
      supabase.from('payouts').select('*').order('created_at', { ascending: false }).limit(50),
    ]).then(([p, po]) => {
      setPayments(p.data || []);
      setPayouts(po.data || []);
      setLoading(false);
    });
  }, []);

  const totalPaid = payments.filter(p => p.status === 'paid').reduce((s, p) => s + (p.amount || 0), 0);
  const totalPayouts = payouts.reduce((s, p) => s + (p.amount || 0), 0);
  const pendingPayments = payments.filter(p => p.status === 'pending');

  const tabs = [
    { key: 'overview', label: 'Overblik' },
    { key: 'payments', label: 'Betalinger' },
    { key: 'payouts', label: 'Udbetalinger' },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <AdminPageHeader title="Økonomi" subtitle="Betalinger, udbetalinger og økonomisk overblik" />

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {loading ? (
            [...Array(4)].map((_, i) => <div key={i} className="rounded-xl border border-border/60 bg-card/80 p-5"><Skeleton className="h-3 w-20 mb-3" /><Skeleton className="h-7 w-24" /></div>)
          ) : (
            <>
              <KPICard title="Betalinger modtaget" value={formatDKK(totalPaid)} icon={CreditCard} variant="success" />
              <KPICard title="Udbetalinger" value={formatDKK(totalPayouts)} icon={ArrowUpRight} variant="gold" />
              <KPICard title="Afventer betaling" value={pendingPayments.length} icon={Wallet} variant="warning" />
              <KPICard title="Transaktioner" value={payments.length + payouts.length} icon={TrendingUp} />
            </>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1.5">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                tab === t.key
                  ? 'bg-primary/10 text-primary border border-primary/20'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/30 border border-transparent'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <Card className="border-border/40 bg-card/60">
              <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Seneste betalinger</CardTitle></CardHeader>
              <CardContent className="space-y-1">
                {payments.length === 0 ? (
                  <EmptyState icon={CreditCard} title="Ingen betalinger endnu" className="py-8" />
                ) : payments.slice(0, 8).map(p => (
                  <div key={p.id} className="flex items-center justify-between py-2.5 px-2 rounded-lg hover:bg-muted/20 transition-colors -mx-2">
                    <div>
                      <p className="text-sm font-medium text-foreground">{formatDKK(p.amount)}</p>
                      <p className="text-[11px] text-muted-foreground">{p.payment_method || 'Stripe'} · {new Date(p.created_at).toLocaleDateString('da-DK')}</p>
                    </div>
                    <StatusChip label={p.status === 'paid' ? 'Betalt' : 'Afventer'} variant={p.status === 'paid' ? 'success' : 'warning'} dot />
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card className="border-border/40 bg-card/60">
              <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Seneste udbetalinger</CardTitle></CardHeader>
              <CardContent className="space-y-1">
                {payouts.length === 0 ? (
                  <EmptyState icon={ArrowUpRight} title="Ingen udbetalinger endnu" className="py-8" />
                ) : payouts.slice(0, 8).map(p => (
                  <div key={p.id} className="flex items-center justify-between py-2.5 px-2 rounded-lg hover:bg-muted/20 transition-colors -mx-2">
                    <div>
                      <p className="text-sm font-medium text-foreground">{formatDKK(p.amount)}</p>
                      <p className="text-[11px] text-muted-foreground">{p.description || 'Ejer-udbetaling'}</p>
                    </div>
                    <StatusChip label={p.status || 'Afventer'} variant="muted" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}

        {tab === 'payments' && (
          <div className="space-y-2">
            {payments.map(p => (
              <Card key={p.id} className="border-border/40 bg-card/60">
                <CardContent className="py-3.5 px-5 flex items-center gap-4">
                  <div className="w-9 h-9 rounded-xl bg-muted/40 flex items-center justify-center shrink-0">
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1"><p className="text-sm font-medium text-foreground">{formatDKK(p.amount)}</p><p className="text-[11px] text-muted-foreground">{new Date(p.created_at).toLocaleDateString('da-DK')}</p></div>
                  <StatusChip label={p.status === 'paid' ? 'Betalt' : 'Afventer'} variant={p.status === 'paid' ? 'success' : 'warning'} dot />
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {tab === 'payouts' && (
          <div className="space-y-2">
            {payouts.map(p => (
              <Card key={p.id} className="border-border/40 bg-card/60">
                <CardContent className="py-3.5 px-5 flex items-center gap-4">
                  <div className="w-9 h-9 rounded-xl bg-muted/40 flex items-center justify-center shrink-0">
                    <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1"><p className="text-sm font-medium text-foreground">{formatDKK(p.amount)}</p><p className="text-[11px] text-muted-foreground">{p.description || 'Udbetaling'}</p></div>
                  <StatusChip label={p.status || 'Afventer'} variant="muted" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
