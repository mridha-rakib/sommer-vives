import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';
import { 
  DollarSign, TrendingUp, AlertCircle, Download, 
  ChevronLeft, ChevronRight, Building2, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { StatCard } from '@/components/admin/StatCard';
import { supabase } from '@/integrations/supabase/client';
import { CommissionSplit, DamagePool, Booking } from '@/types/admin';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

export default function AdminPayouts() {
  const [loading, setLoading] = useState(true);
  const [commissionSplits, setCommissionSplits] = useState<CommissionSplit[]>([]);
  const [damagePoolEntries, setDamagePoolEntries] = useState<DamagePool[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    platformEarnings: 0,
    ownerPayouts: 0,
    damagePool: 0,
    ekShare: 0,
    erikShare: 0,
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [
        bookingsRes,
        commissionRes,
        damageRes
      ] = await Promise.all([
        supabase.from('bookings').select(`
          *,
          property:properties(id, title, case_number)
        `).neq('status', 'cancelled'),
        supabase.from('commission_splits').select(`
          *,
          property:properties(id, title, case_number)
        `),
        supabase.from('damage_pool').select(`
          *,
          booking:bookings(id, case_number, property:properties(title))
        `)
      ]);

      const bookingsData = (bookingsRes.data as unknown as Booking[]) || [];
      const commissionsData = (commissionRes.data as unknown as CommissionSplit[]) || [];
      const damageData = (damageRes.data as unknown as DamagePool[]) || [];

      setBookings(bookingsData);
      setCommissionSplits(commissionsData);
      setDamagePoolEntries(damageData);

      // Calculate stats
      const totalRevenue = bookingsData.reduce((sum, b) => sum + Number(b.total_amount || 0), 0);
      const platformEarnings = bookingsData.reduce((sum, b) => sum + Number(b.platform_earnings || 0), 0);
      const ownerPayouts = bookingsData.reduce((sum, b) => sum + Number(b.owner_payout || 0), 0);
      const damagePool = damageData.reduce((sum, d) => sum + Number(d.amount || 0), 0);

      // Calculate EK/Erik split based on commission type
      let ekShare = 0;
      let erikShare = 0;
      
      bookingsData.forEach(booking => {
        const commission = commissionsData.find(c => c.property_id === booking.property_id);
        const platformCut = Number(booking.platform_earnings || 0);
        
        if (commission) {
          ekShare += platformCut * (commission.ek_percentage / 100);
          erikShare += platformCut * (commission.erik_percentage / 100);
        } else {
          // Default 50/50 for platform acquired
          ekShare += platformCut * 0.5;
          erikShare += platformCut * 0.5;
        }
      });

      setStats({
        totalRevenue,
        platformEarnings,
        ownerPayouts,
        damagePool,
        ekShare,
        erikShare,
      });

    } catch (error) {
      toast.error('Kunne ikke hente data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('da-DK', { 
      style: 'currency', 
      currency: 'DKK',
      maximumFractionDigits: 0 
    }).format(value);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Afregning & Udbetalinger</h1>
            <p className="text-muted-foreground">Overblik over økonomi og kommissionsfordeling</p>
          </div>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Eksportér rapport
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {loading ? (
            [...Array(6)].map((_, i) => (
              <Card key={i} className="p-4">
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-8 w-24" />
              </Card>
            ))
          ) : (
            <>
              <StatCard
                title="Samlet omsætning"
                value={formatCurrency(stats.totalRevenue)}
                icon={TrendingUp}
                variant="success"
              />
              <StatCard
                title="Platform-indtjening"
                value={formatCurrency(stats.platformEarnings)}
                icon={DollarSign}
                variant="info"
              />
              <StatCard
                title="Ejer-udbetalinger"
                value={formatCurrency(stats.ownerPayouts)}
                icon={ArrowUpRight}
                variant="default"
              />
              <StatCard
                title="Skadespulje (3%)"
                value={formatCurrency(stats.damagePool)}
                icon={AlertCircle}
                variant="warning"
              />
              <StatCard
                title="EK's andel"
                value={formatCurrency(stats.ekShare)}
                subtitle="Af platform-indtjening"
                icon={ArrowDownRight}
                variant="default"
              />
              <StatCard
                title="Erik's andel"
                value={formatCurrency(stats.erikShare)}
                subtitle="Af platform-indtjening"
                icon={ArrowDownRight}
                variant="default"
              />
            </>
          )}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="commissions" className="space-y-4">
          <TabsList>
            <TabsTrigger value="commissions">Kommissionsfordeling</TabsTrigger>
            <TabsTrigger value="damage-pool">Skadespulje</TabsTrigger>
            <TabsTrigger value="owner-payouts">Ejer-udbetalinger</TabsTrigger>
          </TabsList>

          <TabsContent value="commissions">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Kommissionsfordeling pr. bolig</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Platform (50/50) = Bolig taget via platformen | Salgsmøde (80/20) = Bolig taget via fysisk møde
                </p>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="font-semibold">Bolig</TableHead>
                        <TableHead className="font-semibold">Type</TableHead>
                        <TableHead className="font-semibold text-right">EK %</TableHead>
                        <TableHead className="font-semibold text-right">Erik %</TableHead>
                        <TableHead className="font-semibold">Noter</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {commissionSplits.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                            Ingen kommissionsopsætning endnu
                          </TableCell>
                        </TableRow>
                      ) : (
                        commissionSplits.map((split) => (
                          <TableRow key={split.id}>
                            <TableCell className="font-medium">
                              {split.property?.title || 'Ukendt bolig'}
                            </TableCell>
                            <TableCell>
                              <Badge variant={split.commission_type === 'platform' ? 'secondary' : 'default'}>
                                {split.commission_type === 'platform' ? 'Platform' : 'Salgsmøde'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              {split.ek_percentage}%
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              {split.erik_percentage}%
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {split.notes || '-'}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="damage-pool">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Skadespulje</CardTitle>
                <p className="text-sm text-muted-foreground">
                  3% af platform-indtjeningen går til skadespuljen ved uheld og juridiske problemer
                </p>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="font-semibold">Booking</TableHead>
                        <TableHead className="font-semibold">Bolig</TableHead>
                        <TableHead className="font-semibold text-right">Beløb</TableHead>
                        <TableHead className="font-semibold">Beskrivelse</TableHead>
                        <TableHead className="font-semibold">Dato</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {damagePoolEntries.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                            Ingen skadespulje-poster endnu
                          </TableCell>
                        </TableRow>
                      ) : (
                        damagePoolEntries.map((entry) => (
                          <TableRow key={entry.id}>
                            <TableCell className="font-mono text-sm">
                              {entry.booking?.case_number || '-'}
                            </TableCell>
                            <TableCell>
                              {(entry.booking as any)?.property?.title || '-'}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {formatCurrency(entry.amount)}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {entry.description || '-'}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {format(new Date(entry.created_at), 'd. MMM yyyy', { locale: da })}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="owner-payouts">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Ejer-udbetalinger</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Oversigt over udbetalinger til boligejere
                </p>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="font-semibold">Booking</TableHead>
                        <TableHead className="font-semibold">Bolig</TableHead>
                        <TableHead className="font-semibold text-right">Total</TableHead>
                        <TableHead className="font-semibold text-right">Platform</TableHead>
                        <TableHead className="font-semibold text-right">Udbetaling</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bookings.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                            Ingen bookinger endnu
                          </TableCell>
                        </TableRow>
                      ) : (
                        bookings.slice(0, 20).map((booking) => (
                          <TableRow key={booking.id}>
                            <TableCell className="font-mono text-sm">
                              {booking.case_number || booking.id.slice(0, 8)}
                            </TableCell>
                            <TableCell>
                              {booking.property?.title || '-'}
                            </TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(booking.total_amount)}
                            </TableCell>
                            <TableCell className="text-right text-muted-foreground">
                              {formatCurrency(booking.platform_earnings || 0)}
                            </TableCell>
                            <TableCell className="text-right font-medium text-emerald-600">
                              {formatCurrency(booking.owner_payout || 0)}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
