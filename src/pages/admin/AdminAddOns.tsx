import { AdminLayout } from '@/components/layout/AdminLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AdminAddOns as AdminAddOnsManager } from '@/components/admin/AdminAddOns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ShoppingBag, Receipt, CheckCircle2, Clock, XCircle } from 'lucide-react';

const STATUS_STYLES: Record<string, { label: string; className: string }> = {
  paid: { label: 'Betalt', className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  pending: { label: 'Afventer', className: 'bg-accent/20 text-accent' },
  unpaid: { label: 'Ubetalt', className: 'bg-muted text-muted-foreground' },
  failed: { label: 'Fejlet', className: 'bg-destructive/10 text-destructive' },
  refunded: { label: 'Refunderet', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
};

export default function AdminAddOns() {
  const { data: orders = [] } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
  });

  const formatAmount = (cents: number) => `${(cents / 100).toLocaleString('da-DK')} kr`;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Tilkøb & Ordrer</h1>
          <p className="text-sm text-muted-foreground mt-1">Administrer tilkøbsservices og se ordrer</p>
        </div>

        <Tabs defaultValue="catalog" className="w-full">
          <TabsList className="bg-muted/50 h-10 p-1 gap-1">
            <TabsTrigger value="catalog" className="text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md px-4">
              Tilkøbskatalog
            </TabsTrigger>
            <TabsTrigger value="orders" className="text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md px-4">
              Ordrer ({orders.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="catalog" className="mt-6">
            <AdminAddOnsManager />
          </TabsContent>

          <TabsContent value="orders" className="mt-6">
            {orders.length === 0 ? (
              <div className="bg-card border border-border rounded-xl p-12 text-center">
                <Receipt className="w-12 h-12 mx-auto mb-4 text-muted-foreground/40" />
                <p className="text-muted-foreground">Ingen ordrer endnu.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {orders.map((order: any) => {
                  const s = STATUS_STYLES[order.payment_status] || STATUS_STYLES.pending;
                  return (
                    <div key={order.id} className="bg-card border border-border rounded-xl p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline" className="text-[10px]">{order.user_type === 'owner' ? 'Ejer' : 'Gæst'}</Badge>
                            <Badge className={`text-[10px] ${s.className}`}>{s.label}</Badge>
                          </div>
                          <div className="mt-1.5 space-y-0.5">
                            {order.order_items?.map((item: any) => (
                              <p key={item.id} className="text-sm text-foreground">
                                {item.label} {item.quantity > 1 ? `×${item.quantity}` : ''} — {formatAmount(item.total)}
                              </p>
                            ))}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(order.created_at).toLocaleDateString('da-DK', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-semibold">{formatAmount(order.total)}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
