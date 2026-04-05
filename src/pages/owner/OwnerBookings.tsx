import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { OwnerLayout } from '@/components/layout/OwnerLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CalendarDays, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format, differenceInDays } from 'date-fns';
import { da } from 'date-fns/locale';

const statusConfig: Record<string, { label: string; className: string }> = {
  pending: { label: 'Afventer', className: 'bg-amber-400/15 text-amber-400 border-amber-400/20' },
  confirmed: { label: 'Bekræftet', className: 'bg-emerald-400/15 text-emerald-400 border-emerald-400/20' },
  checked_in: { label: 'Checked-in', className: 'bg-blue-400/15 text-blue-400 border-blue-400/20' },
  completed: { label: 'Afsluttet', className: 'bg-muted text-muted-foreground border-border' },
  cancelled: { label: 'Annulleret', className: 'bg-destructive/15 text-destructive border-destructive/20' },
};

export default function OwnerBookings() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('upcoming');

  useEffect(() => {
    if (user) loadBookings();
  }, [user]);

  const loadBookings = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('bookings')
      .select('*')
      .eq('owner_id', user.id)
      .order('check_in', { ascending: true });
    setBookings(data || []);
    setLoading(false);
  };

  const today = new Date().toISOString().split('T')[0];
  const filtered = filter === 'upcoming' 
    ? bookings.filter(b => b.check_in >= today && b.status !== 'cancelled')
    : filter === 'past'
    ? bookings.filter(b => b.check_in < today || b.status === 'completed')
    : bookings;

  const upcomingCount = bookings.filter(b => b.check_in >= today && b.status !== 'cancelled').length;

  return (
    <OwnerLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">Bookinger</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {upcomingCount > 0 ? `${upcomingCount} kommende` : 'Vi håndterer gæstekontakten — du følger med herfra'}
            </p>
          </div>
          <Link to="/owner/calendar">
            <Button variant="outline" size="sm" className="gap-2 text-xs rounded-xl">
              <CalendarDays className="w-3.5 h-3.5" /> Kalender
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <div className="flex gap-1.5 p-1 bg-muted/40 rounded-xl w-fit">
          {[
            { key: 'upcoming', label: 'Kommende' },
            { key: 'past', label: 'Tidligere' },
            { key: 'all', label: 'Alle' },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filter === f.key
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Bookings list */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-6 h-6 border-2 border-[hsl(var(--gold))] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-muted/40 flex items-center justify-center mx-auto mb-4">
              <CalendarDays className="w-7 h-7 text-muted-foreground/30" />
            </div>
            <p className="text-muted-foreground text-sm">Ingen bookinger fundet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(booking => {
              const status = statusConfig[booking.status] || statusConfig.pending;
              const nights = booking.nights || '—';
              const daysUntil = differenceInDays(new Date(booking.check_in), new Date());
              const isUpcoming = daysUntil >= 0 && booking.status !== 'cancelled';

              return (
                <Card key={booking.id} className="group hover:border-[hsl(var(--gold)/0.2)] transition-all duration-200">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      {/* Date pill */}
                      <div className="w-12 h-14 rounded-xl bg-muted/50 flex flex-col items-center justify-center shrink-0">
                        <span className="text-base font-bold text-foreground leading-none">
                          {format(new Date(booking.check_in), 'd')}
                        </span>
                        <span className="text-[10px] text-muted-foreground uppercase mt-0.5">
                          {format(new Date(booking.check_in), 'MMM', { locale: da })}
                        </span>
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-sm font-semibold text-foreground truncate">
                            {booking.guest_name || 'Gæst'}
                          </span>
                          <Badge variant="outline" className={`text-[10px] shrink-0 ${status.className}`}>
                            {status.label}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(booking.check_in), 'd. MMM', { locale: da })} → {format(new Date(booking.check_out), 'd. MMM', { locale: da })}
                          {' · '}{nights} {nights === 1 ? 'nat' : 'nætter'}
                          {isUpcoming && daysUntil <= 14 && (
                            <span className="text-[hsl(var(--gold-light))] ml-1.5">· om {daysUntil} dage</span>
                          )}
                        </div>
                      </div>

                      {/* Amount */}
                      <div className="text-right shrink-0">
                        {booking.owner_payout ? (
                          <>
                            <div className="text-sm font-bold text-[hsl(var(--gold-light))]">
                              {Number(booking.owner_payout).toLocaleString('da-DK')} kr
                            </div>
                            <div className="text-[10px] text-muted-foreground">din andel</div>
                          </>
                        ) : (
                          <div className="text-sm font-semibold text-foreground">
                            {Number(booking.total_amount).toLocaleString('da-DK')} kr
                          </div>
                        )}
                      </div>

                      <ChevronRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-[hsl(var(--gold-light))] transition-colors shrink-0" />
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
