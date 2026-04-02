import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { formatDKK } from '@/lib/status-badges';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StatCard } from '@/components/admin/StatCard';
import { Wallet, ArrowUpRight, CreditCard, Users, ShoppingBag, TrendingUp } from 'lucide-react';

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

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Økonomi</h1>
          <p className="text-sm text-muted-foreground">Betalinger, udbetalinger, tilkøb og økonomisk overblik</p>
        </div>

        {/* KPI */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {loading ? (
            [...Array(4)].map((_, i) => <Card key={i} className="p-4"><Skeleton className="h-4 w-20 mb-2" /><Skeleton className="h-8 w-24" /></Card>)
          ) : (
            <>
              <StatCard title="Betalinger modtaget" value={formatDKK(totalPaid)} icon={CreditCard} variant="success" />
              <StatCard title="Udbetalinger" value={formatDKK(totalPayouts)} icon={ArrowUpRight} variant="info" />
              <StatCard title="Afventer betaling" value={pendingPayments.length} icon={Wallet} variant="warning" />
              <StatCard title="Transaktioner" value={payments.length + payouts.length} icon={TrendingUp} variant="default" />
            </>
          )}
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="overview" className="text-xs">Overblik</TabsTrigger>
            <TabsTrigger value="payments" className="text-xs gap-1"><CreditCard className="h-3 w-3" /> Betalinger</TabsTrigger>
            <TabsTrigger value="payouts" className="text-xs gap-1"><ArrowUpRight className="h-3 w-3" /> Udbetalinger</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Seneste betalinger</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  {payments.slice(0, 8).map(p => (
                    <div key={p.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                      <div>
                        <p className="text-sm font-medium text-foreground">{formatDKK(p.amount)}</p>
                        <p className="text-xs text-muted-foreground">{p.payment_method || 'Stripe'} · {new Date(p.created_at).toLocaleDateString('da-DK')}</p>
                      </div>
                      <Badge className={`text-[10px] border-0 ${p.status === 'paid' ? 'bg-emerald-100 text-emerald-700' : p.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                        {p.status === 'paid' ? 'Betalt' : p.status === 'pending' ? 'Afventer' : 'Fejlet'}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Seneste udbetalinger</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  {payouts.slice(0, 8).map(p => (
                    <div key={p.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                      <div>
                        <p className="text-sm font-medium text-foreground">{formatDKK(p.amount)}</p>
                        <p className="text-xs text-muted-foreground">{p.description || 'Ejer-udbetaling'} · {p.payout_date || new Date(p.created_at).toLocaleDateString('da-DK')}</p>
                      </div>
                      <Badge variant="secondary" className="text-[10px]">{p.status || 'Afventer'}</Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="payments" className="mt-4 space-y-2">
            {payments.map(p => (
              <Card key={p.id}>
                <CardContent className="py-3 px-4 flex items-center gap-3">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1"><p className="text-sm font-medium text-foreground">{formatDKK(p.amount)}</p><p className="text-xs text-muted-foreground">{new Date(p.created_at).toLocaleDateString('da-DK')}</p></div>
                  <Badge className={`text-[10px] border-0 ${p.status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{p.status === 'paid' ? 'Betalt' : 'Afventer'}</Badge>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="payouts" className="mt-4 space-y-2">
            {payouts.map(p => (
              <Card key={p.id}>
                <CardContent className="py-3 px-4 flex items-center gap-3">
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1"><p className="text-sm font-medium text-foreground">{formatDKK(p.amount)}</p><p className="text-xs text-muted-foreground">{p.description || 'Udbetaling'}</p></div>
                  <Badge variant="secondary" className="text-[10px]">{p.status || 'Afventer'}</Badge>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
