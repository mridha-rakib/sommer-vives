import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { OwnerLayout } from '@/components/layout/OwnerLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CalendarDays, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';

const statusConfig: Record<string, { label: string; className: string }> = {
  pending: { label: 'Afventer', className: 'bg-amber-400/15 text-amber-400 border-amber-400/20' },
  confirmed: { label: 'Bekræftet', className: 'bg-blue-400/15 text-blue-400 border-blue-400/20' },
  checked_in: { label: 'Checked-in', className: 'bg-emerald-400/15 text-emerald-400 border-emerald-400/20' },
  completed: { label: 'Afsluttet', className: 'bg-muted text-muted-foreground border-border' },
  cancelled: { label: 'Annulleret', className: 'bg-destructive/15 text-destructive border-destructive/20' },
};

export default function OwnerBookings() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (user) loadBookings();
  }, [user]);

  const loadBookings = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('bookings')
      .select('*')
      .eq('owner_id', user.id)
      .order('check_in', { ascending: false });
    setBookings(data || []);
    setLoading(false);
  };

  const filtered = filter === 'all' ? bookings : bookings.filter(b => b.status === filter);

  const filters = [
    { key: 'all', label: 'Alle' },
    { key: 'confirmed', label: 'Bekræftet' },
    { key: 'pending', label: 'Afventer' },
    { key: 'checked_in', label: 'Checked-in' },
    { key: 'completed', label: 'Afsluttet' },
    { key: 'cancelled', label: 'Annulleret' },
  ];

  return (
    <OwnerLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Dine bookinger</h1>
          <p className="text-sm text-muted-foreground mt-1">Vi håndterer gæstekontakten — du følger med herfra</p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {filters.map(f => (
            <Button
              key={f.key}
              variant={filter === f.key ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(f.key)}
              className="text-xs shrink-0"
            >
              {f.label}
              {f.key !== 'all' && (
                <span className="ml-1.5 opacity-60">
                  {bookings.filter(b => b.status === f.key).length}
                </span>
              )}
            </Button>
          ))}
        </div>

        {/* Bookings list */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <CalendarDays className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">Ingen bookinger fundet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(booking => {
              const status = statusConfig[booking.status] || statusConfig.pending;
              const nights = booking.nights || '—';
              return (
                <Card key={booking.id} className="hover:border-accent/20 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="w-11 h-11 rounded-lg bg-muted flex flex-col items-center justify-center text-center shrink-0">
                          <div className="text-xs font-bold text-foreground leading-none">
                            {format(new Date(booking.check_in), 'd')}
                          </div>
                          <div className="text-[10px] text-muted-foreground uppercase">
                            {format(new Date(booking.check_in), 'MMM', { locale: da })}
                          </div>
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-sm font-semibold text-foreground truncate">
                              {booking.guest_name || 'Gæst'}
                            </span>
                            <Badge variant="outline" className={`text-[10px] shrink-0 ${status.className}`}>
                              {status.label}
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {format(new Date(booking.check_in), 'd. MMM', { locale: da })} → {format(new Date(booking.check_out), 'd. MMM yyyy', { locale: da })}
                            {' · '}{nights} {nights === 1 ? 'nat' : 'nætter'}
                          </div>
                          {booking.case_number && (
                            <div className="text-[11px] text-muted-foreground/60 font-mono mt-0.5">{booking.case_number}</div>
                          )}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-sm font-semibold text-foreground">
                          {Number(booking.total_amount).toLocaleString('da-DK')} {booking.currency}
                        </div>
                        {booking.owner_payout && (
                          <div className="text-xs text-accent">
                            Udbetaling: {Number(booking.owner_payout).toLocaleString('da-DK')} kr
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </OwnerLayout>
  );
}
