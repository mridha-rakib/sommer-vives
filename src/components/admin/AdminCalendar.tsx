import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, ChevronLeft, ChevronRight, Plus, Trash2, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  getAdminCalendarEvents,
  createAdminCalendarEvent,
  deleteAdminCalendarEvent,
  type AdminCalendarEvent,
  type AdminEventType,
} from '@/lib/admin-calendar-api';

// ─── Constants ─────────────────────────────────────────────────────────────────

const MONTH_NAMES = [
  'januar', 'februar', 'marts', 'april', 'maj', 'juni',
  'juli', 'august', 'september', 'oktober', 'november', 'december',
];
const MONTH_NAMES_FULL = [
  'Januar', 'Februar', 'Marts', 'April', 'Maj', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'December',
];
const WEEK_DAYS_SHORT = ['Man', 'Tir', 'Ons', 'Tor', 'Fre', 'Lør', 'Søn'];
const WEEK_DAYS_LONG  = ['mandag', 'tirsdag', 'onsdag', 'torsdag', 'fredag', 'lørdag', 'søndag'];

type CalendarView  = 'month' | 'week' | 'day';
type EventFilter   = 'all' | AdminEventType | 'checkin' | 'checkout';

interface CalendarBooking {
  id: string;
  property_id: string;
  check_in: string;
  check_out: string;
  guest_name: string | null;
  status: string;
  source_channel: string | null;
}

interface DisplayEvent {
  id: string;
  label: string;
  dotColor: string;         // for legend dot
  chipClass: string;        // for calendar chip
  filter: EventFilter;
  rawEvent?: AdminCalendarEvent;
}

// Ordered exactly as shown in the screenshot legend
const EVENT_DEFS: {
  filter: EventFilter;
  label: string;
  dotColor: string;
  chipClass: string;
}[] = [
  { filter: 'meeting',       label: 'Møde',            dotColor: 'bg-violet-500',  chipClass: 'bg-violet-500/20 text-violet-700' },
  { filter: 'visit',         label: 'Besøg',           dotColor: 'bg-emerald-500', chipClass: 'bg-emerald-500/20 text-emerald-700' },
  { filter: 'task',          label: 'Opgave',          dotColor: 'bg-orange-500',  chipClass: 'bg-orange-500/20 text-orange-700' },
  { filter: 'reminder',      label: 'Påmindelse',      dotColor: 'bg-amber-400',   chipClass: 'bg-amber-400/20 text-amber-700' },
  { filter: 'udlejningstjek',label: 'Udlejningstjek',  dotColor: 'bg-sky-400',     chipClass: 'bg-sky-400/20 text-sky-700' },
  { filter: 'lead_followup', label: 'Lead opfølgning', dotColor: 'bg-pink-500',    chipClass: 'bg-pink-500/20 text-pink-700' },
  { filter: 'checkin',       label: 'Check-in',        dotColor: 'bg-teal-500',    chipClass: 'bg-teal-500/20 text-teal-700' },
  { filter: 'checkout',      label: 'Check-out',       dotColor: 'bg-red-500',     chipClass: 'bg-red-500/20 text-red-700' },
];

// Only the types stored in admin_calendar_events (excludes checkin/checkout which come from bookings)
const CREATE_TYPE_OPTIONS: { value: AdminEventType; label: string }[] = [
  { value: 'meeting',        label: 'Møde' },
  { value: 'visit',          label: 'Besøg' },
  { value: 'task',           label: 'Opgave' },
  { value: 'reminder',       label: 'Påmindelse' },
  { value: 'udlejningstjek', label: 'Udlejningstjek' },
  { value: 'lead_followup',  label: 'Lead opfølgning' },
];

const DEFAULT_FORM = {
  event_type:   'meeting' as AdminEventType,
  title:        '',
  event_date:   '',
  event_time:   '',
  contact_name: '',
  notes:        '',
};

// ─── Helpers ───────────────────────────────────────────────────────────────────

function padDate(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); // Mon=0
  d.setHours(0, 0, 0, 0);
  return d;
}

function getLegendDef(filter: EventFilter) {
  return EVENT_DEFS.find(d => d.filter === filter) ?? EVENT_DEFS[0];
}

function getChipClassForType(type: AdminEventType): string {
  return EVENT_DEFS.find(d => d.filter === type)?.chipClass ?? 'bg-muted/40 text-muted-foreground';
}

// ─── Component ─────────────────────────────────────────────────────────────────

export function AdminCalendar() {
  const [adminEvents, setAdminEvents] = useState<AdminCalendarEvent[]>([]);
  const [bookings,    setBookings]    = useState<CalendarBooking[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [view,        setView]        = useState<CalendarView>('day');
  const [filter,      setFilter]      = useState<EventFilter | 'all'>('all');

  const [showCreate,  setShowCreate]  = useState(false);
  const [saving,      setSaving]      = useState(false);
  const [form,        setForm]        = useState(DEFAULT_FORM);

  const [selected,    setSelected]    = useState<AdminCalendarEvent | null>(null);
  const [deleting,    setDeleting]    = useState(false);

  const year  = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // ── Data loading ─────────────────────────────────────────────────────────

  const loadData = useCallback(async () => {
    setLoading(true);

    let from: string;
    let to:   string;

    if (view === 'day') {
      const d = currentDate.getDate();
      from = to = padDate(year, month, d);
    } else if (view === 'week') {
      const ws = startOfWeek(currentDate);
      from = padDate(ws.getFullYear(), ws.getMonth(), ws.getDate());
      const we = new Date(ws); we.setDate(we.getDate() + 6);
      to = padDate(we.getFullYear(), we.getMonth(), we.getDate());
    } else {
      from = padDate(year, month, 1);
      to   = padDate(year, month, new Date(year, month + 1, 0).getDate());
    }

    const [eventsData, bRes] = await Promise.all([
      getAdminCalendarEvents(from, to).catch(() => [] as AdminCalendarEvent[]),
      supabase
        .from('bookings')
        .select('id, property_id, check_in, check_out, guest_name, status, source_channel')
        .lte('check_in', to)
        .gte('check_out', from)
        .neq('status', 'cancelled'),
    ]);

    setAdminEvents(eventsData);
    setBookings(bRes.data ?? []);
    setLoading(false);
  }, [currentDate, view, year, month]);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Navigation ──────────────────────────────────────────────────────────

  const navigate = (dir: -1 | 1) => {
    setCurrentDate(prev => {
      const d = new Date(prev);
      if (view === 'month')     d.setMonth(d.getMonth() + dir);
      else if (view === 'week') d.setDate(d.getDate() + dir * 7);
      else                      d.setDate(d.getDate() + dir);
      return d;
    });
  };

  const goToday = () => setCurrentDate(new Date());

  // ── Build display events for a given date string ────────────────────────

  const getEventsForDate = useCallback((dateStr: string): DisplayEvent[] => {
    const result: DisplayEvent[] = [];

    // Admin events
    adminEvents
      .filter(e => {
        if (e.event_date !== dateStr) return false;
        return filter === 'all' || filter === e.event_type;
      })
      .forEach(e => {
        result.push({
          id:       e.id,
          label:    e.event_time ? `${e.event_time.slice(0, 5)} ${e.title}` : e.title,
          dotColor: getLegendDef(e.event_type).dotColor,
          chipClass: getChipClassForType(e.event_type),
          filter:   e.event_type,
          rawEvent: e,
        });
      });

    // Check-ins
    if (filter === 'all' || filter === 'checkin') {
      bookings
        .filter(b => b.check_in === dateStr)
        .forEach(b => {
          result.push({
            id:        `ci-${b.id}`,
            label:     `Check-in: ${b.guest_name ?? 'Gæst'}`,
            dotColor:  'bg-teal-500',
            chipClass: 'bg-teal-500/20 text-teal-700',
            filter:    'checkin',
          });
        });
    }

    // Check-outs
    if (filter === 'all' || filter === 'checkout') {
      bookings
        .filter(b => b.check_out === dateStr)
        .forEach(b => {
          result.push({
            id:        `co-${b.id}`,
            label:     `Check-out: ${b.guest_name ?? 'Gæst'}`,
            dotColor:  'bg-red-500',
            chipClass: 'bg-red-500/20 text-red-700',
            filter:    'checkout',
          });
        });
    }

    return result;
  }, [adminEvents, bookings, filter]);

  // ── Create ──────────────────────────────────────────────────────────────

  const handleCreate = async () => {
    if (!form.title.trim()) { toast.error('Titel er påkrævet'); return; }
    if (!form.event_date)   { toast.error('Dato er påkrævet');  return; }

    setSaving(true);
    try {
      await createAdminCalendarEvent({
        event_type:   form.event_type,
        title:        form.title,
        event_date:   form.event_date,
        event_time:   form.event_time   || undefined,
        contact_name: form.contact_name || undefined,
        notes:        form.notes        || undefined,
      });
      toast.success('Begivenhed tilføjet');
      setForm(DEFAULT_FORM);
      setShowCreate(false);
      loadData();
    } catch (e: any) {
      toast.error('Kunne ikke tilføje: ' + (e?.message ?? 'Ukendt fejl'));
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ──────────────────────────────────────────────────────────────

  const handleDelete = async () => {
    if (!selected) return;
    setDeleting(true);
    try {
      await deleteAdminCalendarEvent(selected.id);
      toast.success('Begivenhed slettet');
      setSelected(null);
      loadData();
    } catch {
      toast.error('Kunne ikke slette begivenhed');
    } finally {
      setDeleting(false);
    }
  };

  // ── Period label ─────────────────────────────────────────────────────────

  const periodLabel = () => {
    if (view === 'month') {
      return `${MONTH_NAMES_FULL[month]} ${year}`;
    }
    if (view === 'day') {
      const wd = (currentDate.getDay() + 6) % 7;
      return `${WEEK_DAYS_LONG[wd]} ${currentDate.getDate()}. ${MONTH_NAMES[month]}`;
    }
    const ws = startOfWeek(currentDate);
    const we = new Date(ws); we.setDate(we.getDate() + 6);
    return `${ws.getDate()}. – ${we.getDate()}. ${MONTH_NAMES[ws.getMonth()]} ${ws.getFullYear()}`;
  };

  const todayStr = new Date().toISOString().split('T')[0];

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">

      {/* ── Page header ────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
        <div className="flex-1">
          <h2 className="font-display text-2xl font-bold text-foreground">Kalender</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Møder, lead-opfølgninger, check-ins og opgaver
          </p>
        </div>
        <Button
          onClick={() => setShowCreate(true)}
          className="gap-1.5 rounded-xl self-start shrink-0"
        >
          <Plus className="h-4 w-4" /> Tilføj
        </Button>
      </div>

      {/* ── Navigation bar ─────────────────────────────────────────────── */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <Button variant="ghost" size="icon" className="rounded-xl h-8 w-8" onClick={() => navigate(-1)}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="font-semibold text-foreground text-sm min-w-[180px] text-center">
          {periodLabel()}
        </span>
        <Button variant="ghost" size="icon" className="rounded-xl h-8 w-8" onClick={() => navigate(1)}>
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={goToday}
          className="ml-1 rounded-xl text-xs h-8 px-3"
        >
          I dag
        </Button>

        {/* View toggle */}
        <div className="ml-auto flex items-center border border-border rounded-xl overflow-hidden">
          {(['month', 'week', 'day'] as const).map((v, i) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                view === v
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              } ${i > 0 ? 'border-l border-border' : ''}`}
            >
              {v === 'month' ? 'Måned' : v === 'week' ? 'Uge' : 'Dag'}
            </button>
          ))}
        </div>
      </div>

      {/* ── Event type legend / filter ──────────────────────────────────── */}
      <div className="flex flex-wrap gap-x-4 gap-y-1.5">
        {EVENT_DEFS.map(def => (
          <button
            key={def.filter}
            onClick={() => setFilter(f => f === def.filter ? 'all' : def.filter)}
            className={`flex items-center gap-1.5 text-xs transition-opacity ${
              filter !== 'all' && filter !== def.filter ? 'opacity-40' : 'opacity-100'
            }`}
          >
            <span className={`inline-block w-2.5 h-2.5 rounded-full ${def.dotColor}`} />
            <span className="text-muted-foreground hover:text-foreground">{def.label}</span>
          </button>
        ))}
      </div>

      {/* ── Calendar body ───────────────────────────────────────────────── */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground gap-2">
          <Loader2 className="h-5 w-5 animate-spin" /> Henter kalenderdata...
        </div>
      ) : (
        <>
          {view === 'month' && (
            <MonthView
              year={year}
              month={month}
              todayStr={todayStr}
              getEventsForDate={getEventsForDate}
              onEventClick={e => e.rawEvent && setSelected(e.rawEvent)}
              onDayClick={dateStr => {
                setForm(p => ({ ...p, event_date: dateStr }));
                setShowCreate(true);
              }}
            />
          )}
          {view === 'week' && (
            <WeekView
              weekStart={startOfWeek(currentDate)}
              todayStr={todayStr}
              getEventsForDate={getEventsForDate}
              onEventClick={e => e.rawEvent && setSelected(e.rawEvent)}
            />
          )}
          {view === 'day' && (
            <DayView
              date={currentDate}
              todayStr={todayStr}
              getEventsForDate={getEventsForDate}
              onEventClick={e => e.rawEvent && setSelected(e.rawEvent)}
              onAddClick={() => {
                const ds = padDate(year, month, currentDate.getDate());
                setForm(p => ({ ...p, event_date: ds }));
                setShowCreate(true);
              }}
            />
          )}
        </>
      )}

      {/* ── Create dialog ───────────────────────────────────────────────── */}
      <Dialog open={showCreate} onOpenChange={v => { if (!v) { setShowCreate(false); setForm(DEFAULT_FORM); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-4 w-4 text-primary" /> Tilføj til kalender
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-1">
            <div>
              <Label className="text-xs">Type</Label>
              <Select
                value={form.event_type}
                onValueChange={v => setForm(p => ({ ...p, event_type: v as AdminEventType }))}
              >
                <SelectTrigger className="mt-1 rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CREATE_TYPE_OPTIONS.map(o => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs">Titel *</Label>
              <Input
                value={form.title}
                onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                className="mt-1 rounded-xl"
                placeholder="Fremvisning sommerhus"
                onKeyDown={e => e.key === 'Enter' && !saving && handleCreate()}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Dato *</Label>
                <Input
                  type="date"
                  value={form.event_date}
                  onChange={e => setForm(p => ({ ...p, event_date: e.target.value }))}
                  className="mt-1 rounded-xl"
                />
              </div>
              <div>
                <Label className="text-xs">Tidspunkt</Label>
                <Input
                  type="time"
                  value={form.event_time}
                  onChange={e => setForm(p => ({ ...p, event_time: e.target.value }))}
                  className="mt-1 rounded-xl"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs">Kontaktperson / tilknytning</Label>
              <Input
                value={form.contact_name}
                onChange={e => setForm(p => ({ ...p, contact_name: e.target.value }))}
                className="mt-1 rounded-xl"
                placeholder="Navn"
              />
            </div>

            <div>
              <Label className="text-xs">Noter</Label>
              <Textarea
                value={form.notes}
                onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                className="mt-1 rounded-xl"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => { setShowCreate(false); setForm(DEFAULT_FORM); }}
              className="rounded-xl"
            >
              Annuller
            </Button>
            <Button onClick={handleCreate} disabled={saving} className="rounded-xl gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              {saving ? 'Tilføjer...' : 'Tilføj'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Event detail / delete ───────────────────────────────────────── */}
      <Dialog open={!!selected} onOpenChange={v => !v && setSelected(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base">{selected?.title}</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-1.5 text-sm text-muted-foreground py-1">
              <p>
                <span className="font-medium text-foreground">Type: </span>
                {CREATE_TYPE_OPTIONS.find(o => o.value === selected.event_type)?.label}
              </p>
              <p>
                <span className="font-medium text-foreground">Dato: </span>
                {selected.event_date}
                {selected.event_time && ` kl. ${selected.event_time.slice(0, 5)}`}
              </p>
              {selected.contact_name && (
                <p><span className="font-medium text-foreground">Kontakt: </span>{selected.contact_name}</p>
              )}
              {selected.notes && (
                <p><span className="font-medium text-foreground">Noter: </span>{selected.notes}</p>
              )}
            </div>
          )}
          <DialogFooter className="flex-row justify-between">
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={deleting}
              className="gap-1.5 rounded-xl"
            >
              <Trash2 className="h-3.5 w-3.5" />
              {deleting ? 'Sletter...' : 'Slet'}
            </Button>
            <Button variant="outline" size="sm" onClick={() => setSelected(null)} className="rounded-xl">
              Luk
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Sub-views ─────────────────────────────────────────────────────────────────

interface EventChipProps {
  event: DisplayEvent;
  onClick?: () => void;
}
function EventChip({ event, onClick }: EventChipProps) {
  return (
    <div
      onClick={e => { e.stopPropagation(); onClick?.(); }}
      className={`text-[10px] px-1.5 py-0.5 rounded truncate leading-4 select-none ${event.chipClass} ${
        event.rawEvent ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''
      }`}
    >
      {event.label}
    </div>
  );
}

// Month view
function MonthView({
  year, month, todayStr, getEventsForDate, onEventClick, onDayClick,
}: {
  year: number; month: number; todayStr: string;
  getEventsForDate: (d: string) => DisplayEvent[];
  onEventClick: (e: DisplayEvent) => void;
  onDayClick: (d: string) => void;
}) {
  const daysInMonth    = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = (new Date(year, month, 1).getDay() + 6) % 7;

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="grid grid-cols-7 text-center text-xs font-medium text-muted-foreground border-b border-border">
        {WEEK_DAYS_SHORT.map(d => <div key={d} className="py-2.5">{d}</div>)}
      </div>
      <div className="grid grid-cols-7">
        {Array.from({ length: firstDayOfWeek }).map((_, i) => (
          <div key={`e${i}`} className="border-b border-r border-border min-h-[90px] bg-muted/5" />
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day     = i + 1;
          const dateStr = padDate(year, month, day);
          const events  = getEventsForDate(dateStr);
          const isToday = dateStr === todayStr;
          return (
            <div
              key={day}
              onClick={() => onDayClick(dateStr)}
              className={`border-b border-r border-border min-h-[90px] p-1.5 cursor-pointer hover:bg-muted/10 transition-colors ${isToday ? 'bg-primary/5' : ''}`}
            >
              <span className={`text-xs font-semibold inline-flex items-center justify-center w-5 h-5 rounded-full ${
                isToday ? 'bg-primary text-primary-foreground' : 'text-foreground'
              }`}>
                {day}
              </span>
              <div className="mt-1 space-y-0.5">
                {events.slice(0, 3).map(e => (
                  <EventChip key={e.id} event={e} onClick={() => onEventClick(e)} />
                ))}
                {events.length > 3 && (
                  <div className="text-[10px] text-muted-foreground pl-1">+{events.length - 3} mere</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Week view
function WeekView({
  weekStart, todayStr, getEventsForDate, onEventClick,
}: {
  weekStart: Date; todayStr: string;
  getEventsForDate: (d: string) => DisplayEvent[];
  onEventClick: (e: DisplayEvent) => void;
}) {
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart); d.setDate(d.getDate() + i); return d;
  });

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="grid grid-cols-7 border-b border-border">
        {days.map((d, i) => {
          const ds      = padDate(d.getFullYear(), d.getMonth(), d.getDate());
          const isToday = ds === todayStr;
          return (
            <div key={i} className={`text-center py-2.5 border-r last:border-r-0 border-border ${isToday ? 'bg-primary/5' : ''}`}>
              <p className="text-xs font-medium text-muted-foreground">{WEEK_DAYS_SHORT[i]}</p>
              <p className={`text-sm font-bold mt-0.5 ${isToday ? 'text-primary' : 'text-foreground'}`}>{d.getDate()}</p>
            </div>
          );
        })}
      </div>
      <div className="grid grid-cols-7 min-h-[220px]">
        {days.map((d, i) => {
          const ds      = padDate(d.getFullYear(), d.getMonth(), d.getDate());
          const events  = getEventsForDate(ds);
          const isToday = ds === todayStr;
          return (
            <div key={i} className={`border-r last:border-r-0 border-border p-1.5 space-y-0.5 ${isToday ? 'bg-primary/5' : ''}`}>
              {events.map(e => <EventChip key={e.id} event={e} onClick={() => onEventClick(e)} />)}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Day view (matches production screenshot exactly)
function DayView({
  date, todayStr, getEventsForDate, onEventClick, onAddClick,
}: {
  date: Date; todayStr: string;
  getEventsForDate: (d: string) => DisplayEvent[];
  onEventClick: (e: DisplayEvent) => void;
  onAddClick: () => void;
}) {
  const ds      = padDate(date.getFullYear(), date.getMonth(), date.getDate());
  const events  = getEventsForDate(ds);
  const isToday = ds === todayStr;

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      {events.length === 0 ? (
        /* Empty state — matches screenshot exactly */
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-muted-foreground">
          <Calendar className="h-10 w-10 opacity-25" />
          <p className="text-sm">Ingen begivenheder denne dag</p>
          <Button
            variant="outline"
            size="sm"
            onClick={onAddClick}
            className="gap-1.5 rounded-xl text-xs h-8"
          >
            <Plus className="h-3.5 w-3.5" /> Tilføj begivenhed
          </Button>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {events.map(e => (
            <div
              key={e.id}
              onClick={() => onEventClick(e)}
              className={`flex items-center gap-3 px-5 py-3 text-sm ${e.chipClass} ${
                e.rawEvent ? 'cursor-pointer hover:opacity-80' : ''
              } transition-opacity`}
            >
              <span className={`w-2 h-2 rounded-full shrink-0 ${e.dotColor}`} />
              <span className="font-medium flex-1 truncate">{e.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
