import { useState } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { AdminPageHeader } from '@/components/admin/ui/AdminPageHeader';
import { KPICard } from '@/components/admin/ui/KPICard';
import { StatusChip } from '@/components/admin/ui/StatusChip';
import { EmptyState } from '@/components/admin/ui/EmptyState';
import { supabase } from '@/integrations/supabase/client';
import { formatDKK } from '@/lib/status-badges';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import {
  CreditCard, ArrowUpRight, Wallet, TrendingUp, Search,
  Receipt, ShoppingBag, AlertCircle, CheckCircle2, Clock,
  ExternalLink, Download, ChevronRight, Banknote
} from 'lucide-react';

type Tab = 'overview' | 'payments' | 'payouts' | 'addons' | 'outstanding';

const TABS: { key: Tab; label: string }[] = [
  { key: 'overview', label: 'Overblik' },
  { key: 'payments', label: 'Betalinger' },
  { key: 'payouts', label: 'Udbetalinger' },
  { key: 'addons', label: 'Tilkøb' },
  { key: 'outstanding', label: 'Udestående' },
];

const PAY_STATUS: Record<string, { label: string; variant: 'success' | 'warning' | 'danger' | 'muted' }> = {
  paid: { label: 'Betalt', variant: 'success' },
  pending: { label: 'Afventer', variant: 'warning' },
  failed: { label: 'Fejlet', variant: 'danger' },
  refunded: { label: 'Refunderet', variant: 'muted' },
  processing: { label: 'Behandles', variant: 'warning' },
  issued: { label: 'Udstedt', variant: 'warning' },
  completed: { label: 'Gennemført', variant: 'success' },
};

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('da-DK', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function AdminOekonomi() {
  const [tab, setTab] = useState<Tab>('overview');
  const [search, setSearch] = useState('');
  const [detail, setDetail] = useState<any>(null);
  const [detailType, setDetailType] = useState<'payment' | 'payout' | 'order'>('payment');

  const { data: payments = [], isLoading: loadP } = useQuery({
    queryKey: ['admin-payments'],
    queryFn: async () => {
      const { data } = await supabase.from('payments').select('*').order('created_at', { ascending: false }).limit(200);
      return data || [];
    },
  });

  const { data: payouts = [], isLoading: loadPo } = useQuery({
    queryKey: ['admin-payouts'],
    queryFn: async () => {
      const { data } = await supabase.from('payouts').select('*').order('created_at', { ascending: false }).limit(200);
      return data || [];
    },
  });

  const { data: orders = [], isLoading: loadO } = useQuery({
    queryKey: ['admin-orders-finance'],
    queryFn: async () => {
      const { data } = await supabase.from('orders').select('*, order_items(*)').order('created_at', { ascending: false }).limit(100);
      return data || [];
    },
  });

  const loading = loadP || loadPo || loadO;

  const totalPaid = payments.filter((p: any) => p.status === 'paid').reduce((s: number, p: any) => s + (p.amount || 0), 0);
  const totalPayouts = payouts.reduce((s: number, p: any) => s + (p.amount || 0), 0);
  const pendingPayments = payments.filter((p: any) => p.status === 'pending');
  const addonRevenue = orders.filter((o: any) => o.payment_status === 'paid').reduce((s: number, o: any) => s + (o.total || 0), 0);
  const outstanding = payments.filter((p: any) => p.status === 'pending' || p.status === 'processing');

  const openDetail = (item: any, type: 'payment' | 'payout' | 'order') => {
    setDetail(item);
    setDetailType(type);
  };

  const filterBySearch = (items: any[], keys: string[]) => {
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter((i: any) => keys.some(k => String(i[k] || '').toLowerCase().includes(q)));
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <AdminPageHeader
          title="Økonomi"
          subtitle="Betalinger, udbetalinger og økonomisk overblik"
          actions={
            <div className="relative w-56">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Søg betalinger…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 h-9 text-xs bg-card/60 border-border/40"
              />
            </div>
          }
        />

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {loading ? (
            [...Array(5)].map((_, i) => (
              <div key={i} className="rounded-xl border border-border/60 bg-card/80 p-5">
                <Skeleton className="h-3 w-20 mb-3" /><Skeleton className="h-7 w-24" />
              </div>
            ))
          ) : (
            <>
              <KPICard title="Betalinger modtaget" value={formatDKK(totalPaid)} icon={CreditCard} variant="success" />
              <KPICard title="Udbetalinger" value={formatDKK(totalPayouts)} icon={ArrowUpRight} variant="gold" />
              <KPICard title="Tilkøbs-omsætning" value={formatDKK(addonRevenue)} icon={ShoppingBag} variant="default" />
              <KPICard title="Afventer" value={pendingPayments.length} icon={Clock} variant="warning" subtitle={pendingPayments.length > 0 ? `${formatDKK(pendingPayments.reduce((s: number, p: any) => s + (p.amount || 0), 0))} total` : undefined} />
              <KPICard title="Transaktioner" value={payments.length + payouts.length + orders.length} icon={TrendingUp} />
            </>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                tab === t.key
                  ? 'bg-primary/10 text-primary border border-primary/20'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/30 border border-transparent'
              }`}
            >
              {t.label}
              {t.key === 'outstanding' && outstanding.length > 0 && (
                <span className="ml-1.5 bg-amber-500/20 text-amber-400 text-[10px] font-semibold px-1.5 py-0.5 rounded-full">{outstanding.length}</span>
              )}
            </button>
          ))}
        </div>

        {/* Overview */}
        {tab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <Card className="border-border/40 bg-card/60">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold">Seneste betalinger</CardTitle>
                  <button onClick={() => setTab('payments')} className="text-[11px] text-primary hover:underline flex items-center gap-0.5">Se alle <ChevronRight className="h-3 w-3" /></button>
                </div>
              </CardHeader>
              <CardContent className="space-y-0.5">
                {payments.length === 0 ? (
                  <EmptyState icon={CreditCard} title="Ingen betalinger endnu" className="py-8" />
                ) : payments.slice(0, 6).map((p: any) => {
                  const s = PAY_STATUS[p.status] || PAY_STATUS.pending;
                  return (
                    <button key={p.id} onClick={() => openDetail(p, 'payment')} className="w-full flex items-center justify-between py-2.5 px-2 rounded-lg hover:bg-muted/20 transition-colors -mx-2 text-left">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground">{formatDKK(p.amount)}</p>
                        <p className="text-[11px] text-muted-foreground">{p.payment_method || 'Stripe'} · {fmtDate(p.created_at)}</p>
                      </div>
                      <StatusChip label={s.label} variant={s.variant} dot />
                    </button>
                  );
                })}
              </CardContent>
            </Card>

            <Card className="border-border/40 bg-card/60">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold">Seneste udbetalinger</CardTitle>
                  <button onClick={() => setTab('payouts')} className="text-[11px] text-primary hover:underline flex items-center gap-0.5">Se alle <ChevronRight className="h-3 w-3" /></button>
                </div>
              </CardHeader>
              <CardContent className="space-y-0.5">
                {payouts.length === 0 ? (
                  <EmptyState icon={ArrowUpRight} title="Ingen udbetalinger endnu" className="py-8" />
                ) : payouts.slice(0, 6).map((p: any) => {
                  const s = PAY_STATUS[p.status] || PAY_STATUS.pending;
                  return (
                    <button key={p.id} onClick={() => openDetail(p, 'payout')} className="w-full flex items-center justify-between py-2.5 px-2 rounded-lg hover:bg-muted/20 transition-colors -mx-2 text-left">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground">{formatDKK(p.amount)}</p>
                        <p className="text-[11px] text-muted-foreground">{p.description || 'Ejer-udbetaling'} · {fmtDate(p.created_at)}</p>
                      </div>
                      <StatusChip label={s.label} variant={s.variant} dot />
                    </button>
                  );
                })}
              </CardContent>
            </Card>

            {/* Add-on summary */}
            <Card className="border-border/40 bg-card/60 lg:col-span-2">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold">Seneste tilkøbsordrer</CardTitle>
                  <button onClick={() => setTab('addons')} className="text-[11px] text-primary hover:underline flex items-center gap-0.5">Se alle <ChevronRight className="h-3 w-3" /></button>
                </div>
              </CardHeader>
              <CardContent>
                {orders.length === 0 ? (
                  <EmptyState icon={ShoppingBag} title="Ingen tilkøbsordrer endnu" className="py-8" />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {orders.slice(0, 4).map((o: any) => {
                      const s = PAY_STATUS[o.payment_status] || PAY_STATUS.pending;
                      return (
                        <button key={o.id} onClick={() => openDetail(o, 'order')} className="text-left flex items-center gap-3 p-3 rounded-xl border border-border/30 hover:border-border/60 hover:bg-muted/10 transition-all">
                          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                            <ShoppingBag className="h-4 w-4 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                              {o.order_items?.map((i: any) => i.label).join(', ') || 'Ordre'}
                            </p>
                            <p className="text-[11px] text-muted-foreground">{fmtDate(o.created_at)}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-sm font-semibold">{formatDKK(o.total)}</p>
                            <StatusChip label={s.label} variant={s.variant} />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Payments list */}
        {tab === 'payments' && (
          <div className="space-y-2">
            {filterBySearch(payments, ['payment_method', 'note', 'stripe_payment_id']).length === 0 ? (
              <EmptyState icon={CreditCard} title="Ingen betalinger fundet" className="py-12" />
            ) : filterBySearch(payments, ['payment_method', 'note', 'stripe_payment_id']).map((p: any) => {
              const s = PAY_STATUS[p.status] || PAY_STATUS.pending;
              return (
                <button key={p.id} onClick={() => openDetail(p, 'payment')} className="w-full text-left">
                  <Card className="border-border/40 bg-card/60 hover:border-border/60 transition-all">
                    <CardContent className="py-3.5 px-5 flex items-center gap-4">
                      <div className="w-9 h-9 rounded-xl bg-muted/40 flex items-center justify-center shrink-0">
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">{formatDKK(p.amount)}</p>
                        <p className="text-[11px] text-muted-foreground">{p.payment_method || 'Stripe'} · {fmtDate(p.created_at)}</p>
                      </div>
                      {p.note && <p className="text-[11px] text-muted-foreground truncate max-w-[140px] hidden md:block">{p.note}</p>}
                      <StatusChip label={s.label} variant={s.variant} dot />
                    </CardContent>
                  </Card>
                </button>
              );
            })}
          </div>
        )}

        {/* Payouts list */}
        {tab === 'payouts' && (
          <div className="space-y-2">
            {filterBySearch(payouts, ['description']).length === 0 ? (
              <EmptyState icon={Banknote} title="Ingen udbetalinger fundet" className="py-12" />
            ) : filterBySearch(payouts, ['description']).map((p: any) => {
              const s = PAY_STATUS[p.status] || PAY_STATUS.pending;
              return (
                <button key={p.id} onClick={() => openDetail(p, 'payout')} className="w-full text-left">
                  <Card className="border-border/40 bg-card/60 hover:border-border/60 transition-all">
                    <CardContent className="py-3.5 px-5 flex items-center gap-4">
                      <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <ArrowUpRight className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">{formatDKK(p.amount)}</p>
                        <p className="text-[11px] text-muted-foreground">{p.description || 'Ejer-udbetaling'} · {fmtDate(p.created_at)}</p>
                      </div>
                      <StatusChip label={s.label} variant={s.variant} dot />
                    </CardContent>
                  </Card>
                </button>
              );
            })}
          </div>
        )}

        {/* Add-ons revenue */}
        {tab === 'addons' && (
          <div className="space-y-2">
            {orders.length === 0 ? (
              <EmptyState icon={ShoppingBag} title="Ingen tilkøbsordrer endnu" className="py-12" />
            ) : orders.map((o: any) => {
              const s = PAY_STATUS[o.payment_status] || PAY_STATUS.pending;
              return (
                <button key={o.id} onClick={() => openDetail(o, 'order')} className="w-full text-left">
                  <Card className="border-border/40 bg-card/60 hover:border-border/60 transition-all">
                    <CardContent className="py-3.5 px-5 flex items-center gap-4">
                      <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <ShoppingBag className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-foreground truncate">
                            {o.order_items?.map((i: any) => i.label).join(', ') || 'Ordre'}
                          </p>
                          <Badge variant="outline" className="text-[10px] shrink-0">{o.user_type === 'owner' ? 'Ejer' : 'Gæst'}</Badge>
                        </div>
                        <p className="text-[11px] text-muted-foreground">{fmtDate(o.created_at)}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-semibold">{formatDKK(o.total)}</p>
                      </div>
                      <StatusChip label={s.label} variant={s.variant} dot />
                    </CardContent>
                  </Card>
                </button>
              );
            })}
          </div>
        )}

        {/* Outstanding */}
        {tab === 'outstanding' && (
          <div className="space-y-2">
            {outstanding.length === 0 ? (
              <div className="bg-card/60 border border-border/40 rounded-xl p-12 text-center">
                <CheckCircle2 className="w-10 h-10 mx-auto mb-3 text-emerald-400" />
                <p className="text-sm font-medium text-foreground">Ingen udestående betalinger</p>
                <p className="text-xs text-muted-foreground mt-1">Alt er opdateret</p>
              </div>
            ) : outstanding.map((p: any) => {
              const s = PAY_STATUS[p.status] || PAY_STATUS.pending;
              return (
                <button key={p.id} onClick={() => openDetail(p, 'payment')} className="w-full text-left">
                  <Card className="border-amber-500/20 bg-card/60 hover:border-amber-500/40 transition-all">
                    <CardContent className="py-3.5 px-5 flex items-center gap-4">
                      <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                        <AlertCircle className="h-4 w-4 text-amber-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">{formatDKK(p.amount)}</p>
                        <p className="text-[11px] text-muted-foreground">{p.payment_method || 'Stripe'} · {fmtDate(p.created_at)}</p>
                      </div>
                      <StatusChip label={s.label} variant={s.variant} dot />
                    </CardContent>
                  </Card>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Detail drawer */}
      <Sheet open={!!detail} onOpenChange={() => setDetail(null)}>
        <SheetContent className="sm:max-w-md border-border/40 bg-background overflow-y-auto">
          {detail && (
            <>
              <SheetHeader>
                <SheetTitle className="text-lg font-bold">
                  {detailType === 'payment' && 'Betaling'}
                  {detailType === 'payout' && 'Udbetaling'}
                  {detailType === 'order' && 'Tilkøbsordre'}
                </SheetTitle>
              </SheetHeader>

              <div className="mt-6 space-y-5">
                {/* Amount */}
                <div className="text-center py-6 rounded-xl bg-muted/20 border border-border/30">
                  <p className="text-3xl font-bold text-foreground">{formatDKK(detail.amount || detail.total || 0)}</p>
                  <div className="mt-2">
                    <StatusChip
                      label={(PAY_STATUS[detail.status || detail.payment_status] || PAY_STATUS.pending).label}
                      variant={(PAY_STATUS[detail.status || detail.payment_status] || PAY_STATUS.pending).variant}
                      dot
                    />
                  </div>
                </div>

                {/* Meta */}
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Dato</span>
                    <span className="text-foreground font-medium">{fmtDate(detail.created_at)}</span>
                  </div>
                  {detail.payment_method && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Betalingsmetode</span>
                      <span className="text-foreground font-medium">{detail.payment_method}</span>
                    </div>
                  )}
                  {detail.currency && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Valuta</span>
                      <span className="text-foreground font-medium">{detail.currency}</span>
                    </div>
                  )}
                  {detail.note && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Note</span>
                      <span className="text-foreground font-medium text-right max-w-[200px]">{detail.note}</span>
                    </div>
                  )}
                  {detail.description && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Beskrivelse</span>
                      <span className="text-foreground font-medium text-right max-w-[200px]">{detail.description}</span>
                    </div>
                  )}
                  {detail.paid_at && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Betalt</span>
                      <span className="text-foreground font-medium">{fmtDate(detail.paid_at)}</span>
                    </div>
                  )}
                </div>

                {/* Order items */}
                {detail.order_items && detail.order_items.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Ordrelinjer</p>
                    {detail.order_items.map((item: any) => (
                      <div key={item.id} className="flex justify-between items-center py-2 px-3 rounded-lg bg-muted/10 border border-border/20">
                        <div>
                          <p className="text-sm text-foreground">{item.label}</p>
                          {item.quantity > 1 && <p className="text-[11px] text-muted-foreground">×{item.quantity}</p>}
                        </div>
                        <p className="text-sm font-medium">{formatDKK(item.total)}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Stripe ref */}
                {(detail.stripe_payment_id || detail.stripe_payment_intent_id) && (
                  <div className="pt-3 border-t border-border/30">
                    <p className="text-[11px] text-muted-foreground font-mono truncate">
                      Ref: {detail.stripe_payment_intent_id || detail.stripe_payment_id}
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </AdminLayout>
  );
}
