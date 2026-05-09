import { useState } from 'react';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';
import { CreditCard, Receipt, AlertTriangle, RefreshCw, Search, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery } from '@tanstack/react-query';

const PAYMENT_STATUS: Record<string, { label: string; cls: string }> = {
  paid: { label: 'Betalt', cls: 'bg-emerald-100 text-emerald-700' },
  pending: { label: 'Afventer', cls: 'bg-amber-100 text-amber-700' },
  failed: { label: 'Fejlet', cls: 'bg-red-100 text-red-700' },
  refunded: { label: 'Refunderet', cls: 'bg-blue-100 text-blue-700' },
};

const fmt = (v: number) => new Intl.NumberFormat('da-DK', { style: 'currency', currency: 'DKK', maximumFractionDigits: 0 }).format(v);

export default function AdminPayments() {
  const [search, setSearch] = useState('');

  const { data: payments = [], isLoading: paymentsLoading } = useQuery({
    queryKey: ['admin-payments'],
    queryFn: async () => {
      const { data } = await supabase.from('payments').select('*, booking:bookings(id, case_number, guest_name, property:properties(title))').order('created_at', { ascending: false });
      return data || [];
    },
  });

  const { data: orders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ['admin-orders-payments'],
    queryFn: async () => {
      const { data } = await supabase.from('orders').select('*, order_items(*)').order('created_at', { ascending: false });
      return data || [];
    },
  });

  const totalPaid = payments.filter(p => p.status === 'paid').reduce((s, p) => s + Number(p.amount || 0), 0);
  const totalPending = payments.filter(p => p.status === 'pending').reduce((s, p) => s + Number(p.amount || 0), 0);
  const totalFailed = payments.filter(p => p.status === 'failed').length;
  const orderRevenue = orders.filter(o => o.payment_status === 'paid').reduce((s, o) => s + Number(o.total || 0), 0);

  const filteredPayments = search
    ? payments.filter(p => (p.booking as any)?.guest_name?.toLowerCase().includes(search.toLowerCase()) || (p.booking as any)?.case_number?.toLowerCase().includes(search.toLowerCase()))
    : payments;

  const filteredOrders = search
    ? orders.filter(o => o.id.includes(search))
    : orders;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Betalinger</h1>
            <p className="text-muted-foreground">Alle indgående betalinger og ordrer</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card><CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1"><ArrowUpRight className="w-4 h-4 text-emerald-500" /><span className="text-xs text-muted-foreground">Modtaget</span></div>
            <div className="text-xl font-bold text-emerald-600">{fmt(totalPaid)}</div>
          </CardContent></Card>
          <Card><CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1"><CreditCard className="w-4 h-4 text-amber-500" /><span className="text-xs text-muted-foreground">Afventer</span></div>
            <div className="text-xl font-bold text-amber-600">{fmt(totalPending)}</div>
          </CardContent></Card>
          <Card><CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1"><AlertTriangle className="w-4 h-4 text-red-500" /><span className="text-xs text-muted-foreground">Fejlede</span></div>
            <div className="text-xl font-bold text-red-600">{totalFailed}</div>
          </CardContent></Card>
          <Card><CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1"><Receipt className="w-4 h-4 text-blue-500" /><span className="text-xs text-muted-foreground">Ordreindtægt</span></div>
            <div className="text-xl font-bold text-blue-600">{fmt(orderRevenue)}</div>
          </CardContent></Card>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="p-4">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Søg på gæst, sagsnr..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="booking-payments">
          <TabsList>
            <TabsTrigger value="booking-payments">Booking-betalinger</TabsTrigger>
            <TabsTrigger value="orders">Ordrer & Tilkøb</TabsTrigger>
          </TabsList>

          <TabsContent value="booking-payments">
            <Card>
              <CardContent className="p-0">
                {paymentsLoading ? (
                  <div className="p-4 space-y-3">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead><tr className="border-b border-border text-left">
                        <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Booking</th>
                        <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Gæst</th>
                        <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Bolig</th>
                        <th className="px-4 py-3 text-xs font-semibold text-muted-foreground text-right">Beløb</th>
                        <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Metode</th>
                        <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Status</th>
                        <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Dato</th>
                      </tr></thead>
                      <tbody>
                        {filteredPayments.map(p => (
                          <tr key={p.id} className="border-b border-border/50 hover:bg-muted/30">
                            <td className="px-4 py-3 font-mono text-xs">{(p.booking as any)?.case_number || p.booking_id?.slice(0, 8)}</td>
                            <td className="px-4 py-3 text-foreground">{(p.booking as any)?.guest_name || '—'}</td>
                            <td className="px-4 py-3 text-muted-foreground text-xs">{(p.booking as any)?.property?.title || '—'}</td>
                            <td className="px-4 py-3 text-right font-medium">{fmt(p.amount)}</td>
                            <td className="px-4 py-3 text-xs text-muted-foreground">{p.payment_method || 'Stripe'}</td>
                            <td className="px-4 py-3">
                              <Badge className={`text-[10px] ${PAYMENT_STATUS[p.status]?.cls || 'bg-muted text-muted-foreground'}`}>
                                {PAYMENT_STATUS[p.status]?.label || p.status}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 text-xs text-muted-foreground">{format(new Date(p.created_at), 'd. MMM yyyy', { locale: da })}</td>
                          </tr>
                        ))}
                        {filteredPayments.length === 0 && (
                          <tr><td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">Ingen betalinger</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="orders">
            <Card>
              <CardContent className="p-0">
                {ordersLoading ? (
                  <div className="p-4 space-y-3">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead><tr className="border-b border-border text-left">
                        <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Ordre-ID</th>
                        <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Type</th>
                        <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Varer</th>
                        <th className="px-4 py-3 text-xs font-semibold text-muted-foreground text-right">Total</th>
                        <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Betaling</th>
                        <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Dato</th>
                      </tr></thead>
                      <tbody>
                        {filteredOrders.map(o => (
                          <tr key={o.id} className="border-b border-border/50 hover:bg-muted/30">
                            <td className="px-4 py-3 font-mono text-xs">{o.id.slice(0, 8)}</td>
                            <td className="px-4 py-3">
                              <Badge variant="outline" className="text-[10px]">{o.user_type === 'guest' ? 'Gæst' : 'Ejer'}</Badge>
                            </td>
                            <td className="px-4 py-3 text-xs text-muted-foreground">{o.order_items?.length || 0} varer</td>
                            <td className="px-4 py-3 text-right font-medium">{fmt(o.total)}</td>
                            <td className="px-4 py-3">
                              <Badge className={`text-[10px] ${PAYMENT_STATUS[o.payment_status]?.cls || 'bg-muted text-muted-foreground'}`}>
                                {PAYMENT_STATUS[o.payment_status]?.label || o.payment_status}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 text-xs text-muted-foreground">{format(new Date(o.created_at), 'd. MMM yyyy', { locale: da })}</td>
                          </tr>
                        ))}
                        {filteredOrders.length === 0 && (
                          <tr><td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">Ingen ordrer</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
