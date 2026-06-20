import { useState } from 'react';
import { useTranslation } from '@/lib/i18n';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { AdminPageHeader } from '@/components/admin/ui/AdminPageHeader';
import { KPICard } from '@/components/admin/ui/KPICard';
import { StatusChip } from '@/components/admin/ui/StatusChip';
import { EmptyState } from '@/components/admin/ui/EmptyState';
import { supabase } from '@/integrations/supabase/client';
import { formatDKK } from '@/lib/pricing';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  CreditCard, ArrowUpRight, TrendingUp, Search,
  ShoppingBag, AlertCircle, CheckCircle2, Clock,
  ExternalLink, ChevronRight, Banknote, Loader2
} from 'lucide-react';

type Tab = 'overview' | 'payments' | 'payouts' | 'addons' | 'outstanding';

const PAY_STATUS: Record<string, { label: string; variant: 'success' | 'warning' | 'danger' | 'muted' }> = {
  paid: { label: 'Betalt', variant: 'success' },
  partially_paid: { label: 'Delvist betalt', variant: 'warning' },
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
  const { t: tr } = useTranslation();
  const TABS: { key: Tab; label: string }[] = [
    { key: 'overview', label: tr('oekonomi.tab.overview') },
    { key: 'payments', label: tr('oekonomi.tab.payments') },
    { key: 'payouts', label: tr('oekonomi.tab.payouts') },
    { key: 'addons', label: tr('oekonomi.tab.additional') },
    { key: 'outstanding', label: tr('oekonomi.tab.outstanding') },
  ];
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>('overview');
  const [search, setSearch] = useState('');
  const [detail, setDetail] = useState<any>(null);
  const [detailType, setDetailType] = useState<'payment' | 'payout' | 'order' | 'booking'>('payment');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');

  const { data: payments = [], isLoading: loadP } = useQuery({
    queryKey: ['admin-payments'],
    queryFn: async () => {
      const { data } = await supabase
        .from('payments')
        .select('*, booking:bookings(id, case_number, guest_name, guest_email, amount_paid, amount_remaining, total_amount, payment_status, status, currency, created_at, owner_id, property_id)')
        .order('created_at', { ascending: false })
        .limit(200);
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

  const { data: outstandingBookings = [], isLoading: loadB } = useQuery({
    queryKey: ['admin-outstanding-bookings'],
    queryFn: async () => {
      const { data } = await supabase
        .from('bookings')
        .select('id, case_number, guest_name, guest_email, amount_paid, amount_remaining, total_amount, payment_status, status, currency, created_at, owner_id, property_id')
        .gt('amount_remaining', 0)
        .neq('status', 'cancelled')
        .order('created_at', { ascending: false })
        .limit(100);
      return data || [];
    },
  });

  const loading = loadP || loadPo || loadO || loadB;

  const totalPaid = payments
    .filter((p: any) => p.status === 'paid' || p.status === 'completed')
    .reduce((s: number, p: any) => s + ((p.amount || 0) - (p.refunded_amount || 0)), 0);
  const totalPayouts = payouts.reduce((s: number, p: any) => s + (p.amount || 0), 0);
  const pendingPayments = payments.filter((p: any) => p.status === 'pending');
  const addonRevenue = orders.filter((o: any) => o.payment_status === 'paid').reduce((s: number, o: any) => s + (o.total || 0), 0);
  const outstandingPayments = payments.filter((p: any) => p.status === 'pending' || p.status === 'processing');
  const outstanding = [
    ...outstandingPayments,
    ...outstandingBookings.filter((b: any) => !outstandingPayments.some((p: any) => p.booking_id === b.id)),
  ];

  const openDetail = (item: any, type: 'payment' | 'payout' | 'order' | 'booking') => {
    setDetail(item);
    setDetailType(type);
    setRefundAmount('');
    setRefundReason('');
  };

  const filterBySearch = (items: any[], keys: string[]) => {
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter((i: any) => keys.some(k => String(i[k] || '').toLowerCase().includes(q)));
  };

  const refreshFinance = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-payments'] });
    queryClient.invalidateQueries({ queryKey: ['admin-payouts'] });
    queryClient.invalidateQueries({ queryKey: ['admin-outstanding-bookings'] });
  };

  const getDetailBooking = () => detailType === 'payment' ? detail?.booking : detailType === 'booking' ? detail : null;

  const createPaymentLink = async () => {
    const booking = getDetailBooking();
    if (!booking?.id) return;
    setActionLoading('payment-link');
    const { data, error } = await supabase.functions.invoke('create-booking-payment', {
      body: { bookingId: booking.id },
    });
    setActionLoading(null);
    if (error) {
      toast.error(error.message || 'Betalingslink kunne ikke oprettes');
      return;
    }
    if (data?.checkout_url) {
      window.open(data.checkout_url, '_blank', 'noopener,noreferrer');
      toast.success('Betalingslink oprettet');
      refreshFinance();
    }
  };

  const issueRefund = async () => {
    if (!detail?.id) return;
    const refundAmountMinor = refundAmount.trim() ? Math.round(Number(refundAmount.replace(',', '.')) * 100) : null;
    if (refundAmountMinor !== null && (!Number.isFinite(refundAmountMinor) || refundAmountMinor <= 0)) {
      toast.error('Indtast et gyldigt refunderingsbeløb');
      return;
    }
    const refundable = Math.max(0, Number(detail.amount || 0) - Number(detail.refunded_amount || 0));
    if (refundAmountMinor !== null && refundAmountMinor > refundable) {
      toast.error('Beløbet overstiger det refunderbare beløb');
      return;
    }
    if (!window.confirm('Refundér denne betaling via Stripe?')) return;
    setActionLoading('refund');
    const { error } = await supabase.functions.invoke('issue-refund', {
      body: {
        paymentId: detail.id,
        amount: refundAmountMinor,
        reason: 'requested_by_customer',
        note: refundReason.trim() || null,
      },
    });
    setActionLoading(null);
    if (error) {
      toast.error(error.message || 'Refundering kunne ikke gennemføres');
      return;
    }
    toast.success('Betalingen er refunderet');
    refreshFinance();
    setDetail(null);
  };

  const createConnectLink = async () => {
    if (!detail?.owner_id) return;
    setActionLoading('connect');
    const { data, error } = await supabase.functions.invoke('create-connect-account', {
      body: { ownerId: detail.owner_id },
    });
    setActionLoading(null);
    if (error) {
      toast.error(error.message || 'Connect-link kunne ikke oprettes');
      return;
    }
    if (data?.onboarding_url) {
      window.open(data.onboarding_url, '_blank', 'noopener,noreferrer');
      toast.success('Stripe Connect-link oprettet');
    }
  };

  const executePayout = async () => {
    if (!detail?.id) return;
    if (!window.confirm('Udbetal dette beløb via Stripe Connect?')) return;
    setActionLoading('payout');
    const { error } = await supabase.functions.invoke('execute-owner-payout', {
      body: { payoutId: detail.id },
    });
    setActionLoading(null);
    if (error) {
      toast.error(error.message || 'Udbetaling kunne ikke gennemføres');
      return;
    }
    toast.success('Udbetalingen er gennemført');
    refreshFinance();
    setDetail(null);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <AdminPageHeader
          title={tr("oekonomi.title")}
          subtitle={tr("oekonomi.subtitle")}
          actions={
            <div className="relative w-56">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder={tr("oekonomi.search")}
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
              <KPICard title={tr("oekonomi.kpi.received")} value={formatDKK(totalPaid)} icon={CreditCard} variant="success" />
              <KPICard title={tr("oekonomi.kpi.payouts")} value={formatDKK(totalPayouts)} icon={ArrowUpRight} variant="gold" />
              <KPICard title={tr("oekonomi.kpi.acquisition")} value={formatDKK(addonRevenue)} icon={ShoppingBag} variant="default" />
              <KPICard title={tr("oekonomi.kpi.awaiting")} value={pendingPayments.length} icon={Clock} variant="warning" subtitle={pendingPayments.length > 0 ? `${formatDKK(pendingPayments.reduce((s: number, p: any) => s + (p.amount || 0), 0))} total` : undefined} />
              <KPICard title={tr("oekonomi.kpi.transactions")} value={payments.length + payouts.length + orders.length} icon={TrendingUp} />
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
                  <CardTitle className="text-sm font-semibold">{tr("oekonomi.recent")}</CardTitle>
                  <button onClick={() => setTab('payments')} className="text-[11px] text-primary hover:underline flex items-center gap-0.5">{tr("oekonomi.seeAll")} <ChevronRight className="h-3 w-3" /></button>
                </div>
              </CardHeader>
              <CardContent className="space-y-0.5">
                {payments.length === 0 ? (
                  <EmptyState icon={CreditCard} title={tr("oekonomi.noPayments")} className="py-8" />
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
                  <CardTitle className="text-sm font-semibold">{tr("oekonomi.latest")}</CardTitle>
                  <button onClick={() => setTab('payouts')} className="text-[11px] text-primary hover:underline flex items-center gap-0.5">{tr("oekonomi.seeAll")} <ChevronRight className="h-3 w-3" /></button>
                </div>
              </CardHeader>
              <CardContent className="space-y-0.5">
                {payouts.length === 0 ? (
                  <EmptyState icon={ArrowUpRight} title={tr("oekonomi.noPayouts")} className="py-8" />
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
                  <CardTitle className="text-sm font-semibold">{tr("oekonomi.latestOrders")}</CardTitle>
                  <button onClick={() => setTab('addons')} className="text-[11px] text-primary hover:underline flex items-center gap-0.5">{tr("oekonomi.seeAll")} <ChevronRight className="h-3 w-3" /></button>
                </div>
              </CardHeader>
              <CardContent>
                {orders.length === 0 ? (
                  <EmptyState icon={ShoppingBag} title={tr("oekonomi.noOrders")} className="py-8" />
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
              <EmptyState icon={ShoppingBag} title={tr("oekonomi.noOrders")} className="py-12" />
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
              const isBooking = !p.payment_method && p.amount_remaining !== undefined;
              const s = PAY_STATUS[p.status || p.payment_status] || PAY_STATUS.pending;
              return (
                <button key={`${isBooking ? 'booking' : 'payment'}-${p.id}`} onClick={() => openDetail(p, isBooking ? 'booking' : 'payment')} className="w-full text-left">
                  <Card className="border-amber-500/20 bg-card/60 hover:border-amber-500/40 transition-all">
                    <CardContent className="py-3.5 px-5 flex items-center gap-4">
                      <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                        <AlertCircle className="h-4 w-4 text-amber-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">{formatDKK(isBooking ? p.amount_remaining : p.amount)}</p>
                        <p className="text-[11px] text-muted-foreground">{isBooking ? (p.case_number || p.guest_name || 'Booking') : (p.payment_method || 'Stripe')} · {fmtDate(p.created_at)}</p>
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
                  {detailType === 'booking' && 'Udestående betaling'}
                </SheetTitle>
              </SheetHeader>

              <div className="mt-6 space-y-5">
                {/* Amount */}
                <div className="text-center py-6 rounded-xl bg-muted/20 border border-border/30">
                  <p className="text-3xl font-bold text-foreground">{formatDKK(detail.amount || detail.total || detail.amount_remaining || 0)}</p>
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
                  {detail.case_number && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Booking</span>
                      <span className="text-foreground font-medium">{detail.case_number}</span>
                    </div>
                  )}
                  {detail.guest_name && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Gæst</span>
                      <span className="text-foreground font-medium text-right max-w-[200px]">{detail.guest_name}</span>
                    </div>
                  )}
                  {getDetailBooking()?.amount_remaining > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Restbeløb</span>
                      <span className="text-foreground font-medium">{formatDKK(getDetailBooking().amount_remaining)}</span>
                    </div>
                  )}
                  {detail.refunded_amount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Refunderet</span>
                      <span className="text-foreground font-medium">{formatDKK(detail.refunded_amount)}</span>
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
                {(detail.stripe_payment_id || detail.stripe_payment_intent_id || detail.stripe_transfer_id || detail.stripe_payout_id) && (
                  <div className="pt-3 border-t border-border/30">
                    <p className="text-[11px] text-muted-foreground font-mono truncate">
                      Ref: {detail.stripe_payment_intent_id || detail.stripe_payment_id || detail.stripe_transfer_id || detail.stripe_payout_id}
                    </p>
                  </div>
                )}

                {(detailType === 'payment' || detailType === 'booking' || detailType === 'payout') && (
                  <div className="pt-3 border-t border-border/30 space-y-2">
                    {(detailType === 'payment' && (detail.status === 'completed' || detail.status === 'paid') && detail.stripe_payment_intent_id && detail.status !== 'refunded') && (
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <p className="text-[11px] text-muted-foreground mb-1">Beløb (DKK)</p>
                            <Input
                              type="number"
                              min={0}
                              step="0.01"
                              value={refundAmount}
                              onChange={(event) => setRefundAmount(event.target.value)}
                              placeholder={`${Math.max(0, (Number(detail.amount || 0) - Number(detail.refunded_amount || 0)) / 100).toLocaleString('da-DK')}`}
                              className="h-9 text-sm"
                            />
                          </div>
                          <div>
                            <p className="text-[11px] text-muted-foreground mb-1">Refunderbart</p>
                            <div className="h-9 rounded-md border border-input bg-background px-3 flex items-center text-sm text-foreground">
                              {formatDKK(Math.max(0, Number(detail.amount || 0) - Number(detail.refunded_amount || 0)))}
                            </div>
                          </div>
                        </div>
                        <Textarea
                          value={refundReason}
                          onChange={(event) => setRefundReason(event.target.value)}
                          placeholder="Intern note (valgfri)"
                          rows={2}
                          className="min-h-[64px] text-sm"
                        />
                        <Button onClick={issueRefund} disabled={actionLoading === 'refund'} variant="outline" className="w-full justify-center gap-2">
                          {actionLoading === 'refund' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CreditCard className="h-3.5 w-3.5" />}
                          Refundér via Stripe
                        </Button>
                      </div>
                    )}
                    {getDetailBooking()?.amount_remaining > 0 && (
                      <Button onClick={createPaymentLink} disabled={actionLoading === 'payment-link'} variant="outline" className="w-full justify-center gap-2">
                        {actionLoading === 'payment-link' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ExternalLink className="h-3.5 w-3.5" />}
                        Opret betalingslink
                      </Button>
                    )}
                    {detailType === 'payout' && detail.status !== 'completed' && (
                      <>
                        <Button onClick={executePayout} disabled={actionLoading === 'payout'} className="w-full justify-center gap-2">
                          {actionLoading === 'payout' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ArrowUpRight className="h-3.5 w-3.5" />}
                          Udbetal via Stripe
                        </Button>
                        <Button onClick={createConnectLink} disabled={actionLoading === 'connect'} variant="outline" className="w-full justify-center gap-2">
                          {actionLoading === 'connect' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ExternalLink className="h-3.5 w-3.5" />}
                          Opret Connect-link
                        </Button>
                      </>
                    )}
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
