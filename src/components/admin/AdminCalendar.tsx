import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface CalendarEvent {
  id: string; type: 'booking' | 'block'; listing_id: string; listing_name: string;
  start_date: string; end_date: string; label: string; source?: string;
}

const MONTH_NAMES = ['Januar', 'Februar', 'Marts', 'April', 'Maj', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'December'];

export function AdminCalendar() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [listings, setListings] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedListing, setSelectedListing] = useState('__all__');
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [lRes, bRes, blRes] = await Promise.all([
        supabase.from('listings').select('id, name').order('sort_order'),
        supabase.from('bookings').select('id, property_id, check_in, check_out, guest_name, status, source_channel'),
        supabase.from('listing_blocks').select('id, listing_id, start_date, end_date, reason, source'),
      ]);

      const listingsData = lRes.data || [];
      setListings(listingsData);
      const listingNames: Record<string, string> = {};
      listingsData.forEach(l => { listingNames[l.id] = l.name; });

      const calEvents: CalendarEvent[] = [];

      (bRes.data || []).forEach(b => {
        if (b.status === 'cancelled') return;
        calEvents.push({
          id: b.id, type: 'booking', listing_id: b.property_id,
          listing_name: listingNames[b.property_id] || '?',
          start_date: b.check_in, end_date: b.check_out,
          label: b.guest_name || 'Booking', source: b.source_channel || 'direct',
        });
      });

      (blRes.data || []).forEach(bl => {
        calEvents.push({
          id: bl.id, type: 'block', listing_id: bl.listing_id,
          listing_name: listingNames[bl.listing_id] || '?',
          start_date: bl.start_date, end_date: bl.end_date,
          label: bl.reason || 'Blokeret', source: bl.source,
        });
      });

      setEvents(calEvents);
      setLoading(false);
    })();
  }, []);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = (new Date(year, month, 1).getDay() + 6) % 7; // Mon=0

  const filteredEvents = events.filter(e => selectedListing === '__all__' || e.listing_id === selectedListing);

  const getEventsForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return filteredEvents.filter(e => dateStr >= e.start_date && dateStr < e.end_date);
  };

  const prevMonth = () => setCurrentMonth(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(year, month + 1, 1));

  if (loading) return <div className="flex items-center justify-center py-20 text-muted-foreground gap-2"><Loader2 className="h-5 w-5 animate-spin" /> Henter kalenderdata...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        <div>
          <h2 className="font-display text-2xl font-semibold text-foreground">Kalender</h2>
          <p className="text-sm text-muted-foreground mt-1">Bookinger og blokeringer.</p>
        </div>
        <div className="md:ml-auto flex items-center gap-2">
          <Select value={selectedListing} onValueChange={setSelectedListing}>
            <SelectTrigger className="w-[180px] h-9 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Alle listings</SelectItem>
              {listings.map(l => (<SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-3 rounded bg-blue-500/80" /> Booking</span>
        <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-3 rounded bg-orange-500/80" /> Airbnb</span>
        <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-3 rounded bg-red-500/80" /> Blokering</span>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <Button variant="ghost" size="icon" onClick={prevMonth}><ChevronLeft className="h-4 w-4" /></Button>
          <h3 className="font-medium text-foreground">{MONTH_NAMES[month]} {year}</h3>
          <Button variant="ghost" size="icon" onClick={nextMonth}><ChevronRight className="h-4 w-4" /></Button>
        </div>

        <div className="grid grid-cols-7 text-center text-xs font-medium text-muted-foreground border-b border-border">
          {['Man', 'Tir', 'Ons', 'Tor', 'Fre', 'Lør', 'Søn'].map(d => (<div key={d} className="py-2">{d}</div>))}
        </div>

        <div className="grid grid-cols-7">
          {Array.from({ length: firstDayOfWeek }).map((_, i) => (<div key={`empty-${i}`} className="border-b border-r border-border min-h-[80px]" />))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dayEvents = getEventsForDay(day);
            const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();
            return (
              <div key={day} className={`border-b border-r border-border min-h-[80px] p-1 ${isToday ? 'bg-primary/5' : ''}`}>
                <span className={`text-xs font-medium ${isToday ? 'text-primary' : 'text-foreground'}`}>{day}</span>
                <div className="mt-1 space-y-0.5">
                  {dayEvents.slice(0, 2).map(e => (
                    <div key={e.id} className={`text-[10px] px-1 py-0.5 rounded truncate ${
                      e.type === 'block' ? 'bg-red-500/20 text-red-700' :
                      e.source === 'airbnb' ? 'bg-orange-500/20 text-orange-700' :
                      'bg-blue-500/20 text-blue-700'
                    }`}>
                      {e.label}
                    </div>
                  ))}
                  {dayEvents.length > 2 && <div className="text-[10px] text-muted-foreground">+{dayEvents.length - 2} mere</div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
