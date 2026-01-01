import { useState, useEffect } from 'react';
import { 
  Home, Calendar, Users, TrendingUp, DollarSign, 
  AlertCircle, CheckCircle, Clock, XCircle, ArrowUpRight,
  Building2, UserCheck
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { StatCard } from '@/components/admin/StatCard';
import { BookingsTable } from '@/components/admin/BookingsTable';
import { ActivityLog } from '@/components/admin/ActivityLog';
import { useAdminStats } from '@/hooks/useAdminStats';
import { supabase } from '@/integrations/supabase/client';
import { Booking } from '@/types/admin';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminDashboard() {
  const { stats, loading: statsLoading } = useAdminStats();
  const [upcomingBookings, setUpcomingBookings] = useState<Booking[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);

  useEffect(() => {
    const loadUpcomingBookings = async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data } = await supabase
        .from('bookings')
        .select(`
          *,
          property:properties(id, title, case_number),
          guest:guests(id, name, case_number)
        `)
        .gte('check_in', today)
        .neq('status', 'cancelled')
        .order('check_in', { ascending: true })
        .limit(10);
      
      setUpcomingBookings((data as unknown as Booking[]) || []);
      setBookingsLoading(false);
    };

    loadUpcomingBookings();
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
            <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground">Overblik over dit sommerhusbureau</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link to="/admin/bookings/new">
                <Calendar className="h-4 w-4 mr-2" />
                Ny booking
              </Link>
            </Button>
            <Button asChild>
              <Link to="/admin/properties/new">
                <Home className="h-4 w-4 mr-2" />
                Ny bolig
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {statsLoading ? (
            [...Array(6)].map((_, i) => (
              <Card key={i} className="p-4">
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-8 w-16" />
              </Card>
            ))
          ) : stats && (
            <>
              <StatCard
                title="Boliger"
                value={stats.totalProperties}
                subtitle={`${stats.activeProperties} aktive`}
                icon={Building2}
                variant="default"
              />
              <StatCard
                title="Bookinger"
                value={stats.totalBookings}
                icon={Calendar}
                variant="info"
              />
              <StatCard
                title="Kommende (30d)"
                value={stats.upcomingBookings}
                icon={Clock}
                variant="success"
              />
              <StatCard
                title="Afholdte (30d)"
                value={stats.pastBookings}
                icon={CheckCircle}
                variant="default"
              />
              <StatCard
                title="Annullerede"
                value={stats.cancelledBookings}
                icon={XCircle}
                variant="danger"
              />
              <StatCard
                title="Ejere"
                value={stats.totalOwners}
                icon={UserCheck}
                variant="default"
              />
            </>
          )}
        </div>

        {/* Revenue Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {statsLoading ? (
            [...Array(3)].map((_, i) => (
              <Card key={i} className="p-4">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-10 w-32" />
              </Card>
            ))
          ) : stats && (
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
                title="Skadespulje"
                value={formatCurrency(stats.damagePoolTotal)}
                subtitle="3% af platform-indtjening"
                icon={AlertCircle}
                variant="warning"
              />
            </>
          )}
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Upcoming Bookings */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg font-semibold">Kommende bookinger</CardTitle>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/admin/bookings">
                    Se alle
                    <ArrowUpRight className="h-4 w-4 ml-1" />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                {bookingsLoading ? (
                  <div className="p-4 space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : (
                  <BookingsTable bookings={upcomingBookings} compact />
                )}
              </CardContent>
            </Card>
          </div>

          {/* Activity Log */}
          <div>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg font-semibold">Seneste aktivitet</CardTitle>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/admin/audit-log">
                    Se alle
                    <ArrowUpRight className="h-4 w-4 ml-1" />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                <ActivityLog limit={10} />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
