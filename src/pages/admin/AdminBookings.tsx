import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';
import { 
  Search, Filter, Calendar, Download, Plus, 
  ChevronLeft, ChevronRight, RefreshCw
} from 'lucide-react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { BookingsTable } from '@/components/admin/BookingsTable';
import { supabase } from '@/integrations/supabase/client';
import { Booking } from '@/types/admin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

const ITEMS_PER_PAGE = 20;

export default function AdminBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [channelFilter, setChannelFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const loadBookings = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('bookings')
        .select(`
          *,
          property:properties(id, title, case_number, region),
          guest:guests(id, name, case_number, email),
          owner:profiles!bookings_owner_id_fkey(id, full_name, email)
        `, { count: 'exact' })
        .order('check_in', { ascending: false })
        .range((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE - 1);

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter as any);
      }
      if (channelFilter !== 'all') {
        query = query.eq('source_channel', channelFilter as any);
      }
      if (searchQuery) {
        query = query.or(`case_number.ilike.%${searchQuery}%,guest_name.ilike.%${searchQuery}%,guest_email.ilike.%${searchQuery}%`);
      }

      const { data, count, error } = await query;
      
      if (error) throw error;
      
      setBookings((data as unknown as Booking[]) || []);
      setTotalCount(count || 0);
    } catch (error) {
      toast.error('Kunne ikke hente bookinger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, [page, statusFilter, channelFilter]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setPage(1);
      loadBookings();
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handleStatusChange = async (bookingId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: newStatus as any })
        .eq('id', bookingId);

      if (error) throw error;

      toast.success('Booking status opdateret');
      loadBookings();
    } catch (error) {
      toast.error('Kunne ikke opdatere status');
    }
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Bookinger</h1>
            <p className="text-muted-foreground">
              {totalCount} bookinger i alt
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={loadBookings}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Opdater
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Eksportér
            </Button>
            <Button asChild>
              <Link to="/admin/bookings/new">
                <Plus className="h-4 w-4 mr-2" />
                Ny booking
              </Link>
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Søg på sagsnr., gæst, email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle status</SelectItem>
                  <SelectItem value="pending">Afventer</SelectItem>
                  <SelectItem value="confirmed">Bekræftet</SelectItem>
                  <SelectItem value="checked_in">Checked-in</SelectItem>
                  <SelectItem value="completed">Afsluttet</SelectItem>
                  <SelectItem value="cancelled">Annulleret</SelectItem>
                </SelectContent>
              </Select>
              <Select value={channelFilter} onValueChange={setChannelFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Kanal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle kanaler</SelectItem>
                  <SelectItem value="direct">Direkte</SelectItem>
                  <SelectItem value="airbnb">Airbnb</SelectItem>
                  <SelectItem value="booking_com">Booking.com</SelectItem>
                  <SelectItem value="vrbo">VRBO</SelectItem>
                  <SelectItem value="other">Anden</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        {loading ? (
          <Card>
            <CardContent className="p-4 space-y-3">
              {[...Array(10)].map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </CardContent>
          </Card>
        ) : (
          <BookingsTable 
            bookings={bookings} 
            onStatusChange={handleStatusChange}
          />
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Viser {((page - 1) * ITEMS_PER_PAGE) + 1} - {Math.min(page * ITEMS_PER_PAGE, totalCount)} af {totalCount}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Forrige
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Næste
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
