import { useState, useEffect, useCallback } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { AdminPageHeader } from '@/components/admin/ui/AdminPageHeader';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';
import {
  ChevronLeft, ChevronRight, Calendar as CalIcon,
  Eye, MapPin, Clock, Plus, Video, ClipboardCheck,
  Bell, Target, UserCheck, Bed, Trash2
} from 'lucide-react';

type EventType = 'meeting' | 'visit' | 'task' | 'reminder' | 'inspection' | 'lead_followup' | 'checkin' | 'checkout';

const EVENT_VIS: Record<EventType, { labelKey: string; color: string; bg: string; icon: React.ElementType }> = {
  meeting:       { labelKey: 'admin.calendar.legend.meeting',      color: 'text-blue-400',    bg: 'bg-blue-500/15',    icon: Video },
  visit:         { labelKey: 'admin.calendar.legend.visit',        color: 'text-emerald-400', bg: 'bg-emerald-500/15', icon: MapPin },
  task:          { labelKey: 'admin.calendar.legend.task',         color: 'text-amber-400',   bg: 'bg-amber-500/15',   icon: ClipboardCheck },
  reminder:      { labelKey: 'admin.calendar.legend.reminder',     color: 'text-violet-400',  bg: 'bg-violet-500/15',  icon: Bell },
  inspection:    { labelKey: 'admin.calendar.legend.inspection',   color: 'text-primary',     bg: 'bg-primary/15',     icon: Eye },
  lead_followup: { labelKey: 'admin.calendar.legend.leadFollowup', color: 'text-orange-400',  bg: 'bg-orange-500/15',  icon: Target },
  checkin:       { labelKey: 'admin.calendar.legend.checkin',      color: 'text-emerald-400', bg: 'bg-emerald-500/15', icon: UserCheck },
  checkout:      { labelKey: 'admin.calendar.legend.checkout',     color: 'text-rose-400',    bg: 'bg-rose-500/15',    icon: Bed },
};

interface CalEvent {
  id: string;
  type: EventType;
  title: string;
  date: string;
  time?: string;
  linked?: string;
  source: 'system_task' | 'lead' | 'booking' | 'task';
  sourceId: string;
}

export default function AdminKalender() {
  const { t, language } = useTranslation();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');
  const [, setSelectedDay] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [detailEvent, setDetailEvent] = useState<CalEvent | null>(null);

  const localeTag = language === 'da' ? 'da-DK' : language === 'de' ? 'de-DE' : language === 'nl' ? 'nl-NL' : 'en-GB';
  const DAYS_SHORT = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(2024, 0, 1 + i); // Mon=Jan 1 2024
    return d.toLocaleDateString(localeTag, { weekday: 'short' });
  });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthName = new Date(year, month, 1).toLocaleDateString(localeTag, { month: 'long' });

  function mapSystemTask(task: any): CalEvent | null {
    if (!task.due_date) return null;
    const dateStr = typeof task.due_date === 'string' ? task.due_date.split('T')[0] : '';
    if (!dateStr) return null;
    const timePart = task.due_date.includes('T') ? task.due_date.split('T')[1]?.substring(0, 5) : undefined;

    let type: EventType = 'task';
    if (task.linked_type === 'meeting' || task.title?.startsWith('📅')) type = 'meeting';
    else if (task.priority === 'urgent') type = 'reminder';

    return {
      id: `st-${task.id}`, type, title: task.title?.replace(/^📅\s*/, '') || t('admin.calendar.legend.task'),
      date: dateStr, time: timePart && timePart !== '00:00' ? timePart : undefined,
      linked: task.linked_name || undefined, source: 'system_task', sourceId: task.id,
    };
  }

  function mapLead(l: any): CalEvent | null {
    if (!l.next_step_date) return null;
    return {
      id: `lead-${l.id}`, type: 'lead_followup',
      title: l.next_step || `${t('admin.calendar.followUpFor')}: ${l.name}`,
      date: l.next_step_date, linked: l.name,
      source: 'lead', sourceId: l.id,
    };
  }

  function mapBooking(b: any, type: 'checkin' | 'checkout'): CalEvent {
    const date = type === 'checkin' ? b.check_in : b.check_out;
    const prefix = type === 'checkin' ? t('admin.calendar.checkinPrefix') : t('admin.calendar.checkoutPrefix');
    return {
      id: `bk-${type}-${b.id}`, type,
      title: `${prefix}: ${b.guest_name || t('admin.calendar.guest')}`,
      date, linked: b.property_title, source: 'booking', sourceId: b.id,
    };
  }

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const start = new Date(year, month - 1, 1).toISOString().split('T')[0];
    const end = new Date(year, month + 2, 0).toISOString().split('T')[0];

    const [stRes, leadRes, bookRes] = await Promise.all([
      supabase.from('system_tasks' as any).select('*')
        .not('due_date', 'is', null)
        .gte('due_date', start).lte('due_date', end + 'T23:59:59'),
      supabase.from('leads').select('id, name, next_step, next_step_date, status')
        .not('next_step_date', 'is', null)
        .gte('next_step_date', start).lte('next_step_date', end),
      supabase.from('bookings').select('id, guest_name, check_in, check_out, status, property_id')
        .or(`check_in.gte.${start},check_out.lte.${end}`)
        .not('status', 'eq', 'cancelled'),
    ]);

    const allEvents: CalEvent[] = [];

    ((stRes.data as any[]) || []).forEach(task => {
      const evt = mapSystemTask(task);
      if (evt) allEvents.push(evt);
    });

    ((leadRes.data as any[]) || []).forEach(l => {
      if (l.status === 'won' || l.status === 'lost') return;
      const evt = mapLead(l);
      if (evt) allEvents.push(evt);
    });

    ((bookRes.data as any[]) || []).forEach(b => {
      if (b.check_in >= start && b.check_in <= end) allEvents.push(mapBooking(b, 'checkin'));
      if (b.check_out >= start && b.check_out <= end) allEvents.push(mapBooking(b, 'checkout'));
    });

    setEvents(allEvents);
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, month, language]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const today = new Date().toISOString().split('T')[0];
  const eventsForDate = (date: string) => events.filter(e => e.date === date)
    .sort((a, b) => (a.time || '99:99').localeCompare(b.time || '99:99'));

  const nav = (dir: number) => {
    if (view === 'month') setCurrentDate(new Date(year, month + dir));
    else if (view === 'week') setCurrentDate(new Date(currentDate.getTime() + dir * 7 * 86400000));
    else setCurrentDate(new Date(currentDate.getTime() + dir * 86400000));
  };

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const offset = (firstDay + 6) % 7;

  const weekStart = new Date(currentDate);
  const dayOfWeek = (weekStart.getDay() + 6) % 7;
  weekStart.setDate(weekStart.getDate() - dayOfWeek);
  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d.toISOString().split('T')[0];
  });

  const dayStr = currentDate.toISOString().split('T')[0];
  const dayEvents = eventsForDate(dayStr);
  const todayCount = eventsForDate(today).length;

  const handleDelete = async (evt: CalEvent) => {
    if (evt.source === 'system_task') {
      if (!confirm(t('admin.calendar.confirm.delete'))) return;
      await supabase.from('system_tasks' as any).delete().eq('id', evt.sourceId);
      toast.success(t('admin.calendar.toast.deleted'));
      setDetailEvent(null);
      fetchAll();
    } else if (evt.source === 'lead') {
      if (!confirm(t('admin.calendar.confirm.removeLead'))) return;
      await supabase.from('leads').update({ next_step_date: null }).eq('id', evt.sourceId);
      toast.success(t('admin.calendar.toast.followUpRemoved'));
      setDetailEvent(null);
      fetchAll();
    }
  };

  const EventChip = ({ evt, compact = false }: { evt: CalEvent; compact?: boolean }) => {
    const cfg = EVENT_VIS[evt.type];
    if (compact) {
      return (
        <button
          onClick={e => { e.stopPropagation(); setDetailEvent(evt); }}
          className={cn('text-[10px] px-1.5 py-0.5 rounded-md truncate font-medium text-left w-full', cfg.bg, cfg.color)}
        >
          {evt.time ? `${evt.time} ` : ''}{evt.title}
        </button>
      );
    }
    return (
      <button
        onClick={() => setDetailEvent(evt)}
        className={cn('flex items-start gap-3 p-3.5 rounded-xl border border-border/20 hover:border-border/40 transition-colors cursor-pointer w-full text-left', cfg.bg)}
      >
        <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-background/50">
          <cfg.icon className={cn('w-4 h-4', cfg.color)} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className={cn('text-[10px] font-semibold uppercase tracking-wider', cfg.color)}>{t(cfg.labelKey)}</span>
            {evt.time && <span className="text-[10px] text-muted-foreground flex items-center gap-0.5"><Clock className="w-2.5 h-2.5" />{evt.time}</span>}
          </div>
          <p className="text-sm font-semibold text-foreground truncate">{evt.title}</p>
          {evt.linked && <p className="text-xs text-muted-foreground mt-0.5 truncate">{evt.linked}</p>}
        </div>
      </button>
    );
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <AdminPageHeader
          title={t('admin.calendar.title')}
          subtitle={t('admin.calendar.subtitle')}
          actions={
            <div className="flex items-center gap-2">
              {todayCount > 0 && (
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-xs font-semibold px-2.5 py-1">
                  {todayCount} {t('admin.calendar.inToday')}
                </Badge>
              )}
              <Button size="sm" className="gap-1.5 rounded-xl text-xs" onClick={() => setCreateOpen(true)}>
                <Plus className="h-3.5 w-3.5" /> {t('admin.calendar.add')}
              </Button>
            </div>
          }
        />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => nav(-1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-base font-semibold text-foreground min-w-[180px] text-center capitalize">
              {view === 'month' && `${monthName} ${year}`}
              {view === 'week' && `${t('admin.calendar.weekPrefix')} — ${monthName} ${year}`}
              {view === 'day' && currentDate.toLocaleDateString(localeTag, { weekday: 'long', day: 'numeric', month: 'long' })}
            </h2>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => nav(1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" className="rounded-xl text-xs h-8 ml-2" onClick={() => setCurrentDate(new Date())}>
              {t('admin.calendar.today')}
            </Button>
          </div>
          <Tabs value={view} onValueChange={v => setView(v as any)} className="w-auto">
            <TabsList className="h-8 bg-muted/20 border border-border/30 rounded-xl p-0.5">
              <TabsTrigger value="month" className="text-xs rounded-lg px-3 h-6">{t('admin.calendar.view.month')}</TabsTrigger>
              <TabsTrigger value="week" className="text-xs rounded-lg px-3 h-6">{t('admin.calendar.view.week')}</TabsTrigger>
              <TabsTrigger value="day" className="text-xs rounded-lg px-3 h-6">{t('admin.calendar.view.day')}</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="flex flex-wrap gap-3">
          {Object.entries(EVENT_VIS).map(([key, cfg]) => (
            <div key={key} className="flex items-center gap-1.5">
              <span className={cn('w-2 h-2 rounded-full', cfg.bg)} />
              <span className="text-[11px] text-muted-foreground">{t(cfg.labelKey)}</span>
            </div>
          ))}
        </div>

        {loading ? (
          <Skeleton className="h-[500px] w-full rounded-xl" />
        ) : view === 'month' ? (
          <div className="rounded-xl border border-border/40 bg-card/40 overflow-hidden">
            <div className="grid grid-cols-7">
              {DAYS_SHORT.map(d => (
                <div key={d} className="border-b border-r border-border/20 p-2.5 text-center text-[11px] font-semibold text-muted-foreground/60 uppercase tracking-wide bg-muted/10">
                  {d}
                </div>
              ))}
              {[...Array(offset)].map((_, i) => <div key={`e-${i}`} className="border-b border-r border-border/10 min-h-[100px] bg-card/20" />)}
              {[...Array(daysInMonth)].map((_, i) => {
                const day = i + 1;
                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const dayEvts = eventsForDate(dateStr);
                const isToday = dateStr === today;
                return (
                  <div
                    key={day}
                    onClick={() => { setSelectedDay(dateStr); setCurrentDate(new Date(dateStr)); setView('day'); }}
                    className={cn(
                      'border-b border-r border-border/10 min-h-[100px] p-2 cursor-pointer transition-colors hover:bg-muted/10',
                      isToday && 'bg-primary/[0.03]'
                    )}
                  >
                    <span className={cn(
                      'text-xs font-medium inline-flex items-center justify-center w-6 h-6 rounded-full',
                      isToday ? 'bg-primary text-primary-foreground font-bold' : 'text-foreground'
                    )}>
                      {day}
                    </span>
                    <div className="mt-1 space-y-0.5">
                      {dayEvts.slice(0, 3).map(evt => <EventChip key={evt.id} evt={evt} compact />)}
                      {dayEvts.length > 3 && <span className="text-[10px] text-muted-foreground/60 pl-1">+{dayEvts.length - 3}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : view === 'week' ? (
          <div className="rounded-xl border border-border/40 bg-card/40 overflow-hidden">
            <div className="grid grid-cols-7">
              {weekDates.map((dateStr, i) => {
                const d = new Date(dateStr);
                const isToday = dateStr === today;
                const dayEvts = eventsForDate(dateStr);
                return (
                  <div key={dateStr} className="border-r border-border/10 last:border-r-0">
                    <div className={cn('p-3 border-b border-border/20 text-center', isToday ? 'bg-primary/[0.05]' : 'bg-muted/10')}>
                      <span className="text-[10px] text-muted-foreground/60 uppercase block">{DAYS_SHORT[i]}</span>
                      <span className={cn('text-lg font-semibold', isToday ? 'text-primary' : 'text-foreground')}>{d.getDate()}</span>
                    </div>
                    <div className="p-2 min-h-[300px] space-y-1.5">
                      {dayEvts.map(evt => {
                        const cfg = EVENT_VIS[evt.type];
                        return (
                          <button
                            key={evt.id}
                            onClick={() => setDetailEvent(evt)}
                            className={cn('w-full text-left p-2 rounded-lg border border-transparent hover:border-border/30 transition-colors cursor-pointer', cfg.bg)}
                          >
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <cfg.icon className={cn('w-3 h-3', cfg.color)} />
                              <span className={cn('text-[10px] font-semibold', cfg.color)}>{t(cfg.labelKey)}</span>
                            </div>
                            <p className="text-xs font-medium text-foreground truncate">{evt.title}</p>
                            {evt.linked && <p className="text-[10px] text-muted-foreground truncate mt-0.5">{evt.linked}</p>}
                          </button>
                        );
                      })}
                      {dayEvts.length === 0 && <p className="text-[10px] text-muted-foreground/30 text-center pt-8">{t('admin.calendar.empty.weekDay')}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-border/40 bg-card/40 overflow-hidden">
            <div className="p-5">
              {dayEvents.length === 0 ? (
                <div className="text-center py-16">
                  <CalIcon className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">{t('admin.calendar.empty.day')}</p>
                  <Button variant="outline" size="sm" className="mt-4 rounded-xl text-xs gap-1.5" onClick={() => setCreateOpen(true)}>
                    <Plus className="h-3.5 w-3.5" />{t('admin.calendar.empty.addEvent')}
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {dayEvents.map(evt => <EventChip key={evt.id} evt={evt} />)}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <Dialog open={!!detailEvent} onOpenChange={v => { if (!v) setDetailEvent(null); }}>
        <DialogContent className="max-w-sm">
          {detailEvent && (() => {
            const cfg = EVENT_VIS[detailEvent.type];
            return (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <cfg.icon className={cn('h-4 w-4', cfg.color)} />
                    {detailEvent.title}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-3 py-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={cn('text-xs', cfg.bg, cfg.color)}>{t(cfg.labelKey)}</Badge>
                    {detailEvent.time && <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />{detailEvent.time}</span>}
                  </div>
                  <div className="rounded-lg border border-border/30 bg-muted/10 p-3 space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">{t('admin.calendar.detail.date')}</span>
                      <span className="font-medium text-foreground">{new Date(detailEvent.date).toLocaleDateString(localeTag, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
                    </div>
                    {detailEvent.linked && (
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">{t('admin.calendar.detail.linked')}</span>
                        <span className="font-medium text-foreground">{detailEvent.linked}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">{t('admin.calendar.detail.source')}</span>
                      <span className="font-medium text-foreground capitalize">
                        {detailEvent.source === 'system_task' ? t('admin.calendar.source.task')
                          : detailEvent.source === 'lead' ? t('admin.calendar.source.lead')
                          : t('admin.calendar.source.booking')}
                      </span>
                    </div>
                  </div>
                </div>
                <DialogFooter className="gap-2">
                  {(detailEvent.source === 'system_task' || detailEvent.source === 'lead') && (
                    <Button variant="outline" size="sm" className="rounded-xl text-xs gap-1 text-red-400 border-red-500/20 hover:bg-red-500/5" onClick={() => handleDelete(detailEvent)}>
                      <Trash2 className="h-3 w-3" />{t('admin.calendar.detail.delete')}
                    </Button>
                  )}
                  <Button variant="outline" size="sm" className="rounded-xl text-xs" onClick={() => setDetailEvent(null)}>{t('admin.calendar.detail.close')}</Button>
                </DialogFooter>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      <CreateCalendarEventDialog open={createOpen} onClose={() => setCreateOpen(false)} onCreated={fetchAll} defaultDate={view === 'day' ? dayStr : today} />
    </AdminLayout>
  );
}

function CreateCalendarEventDialog({ open, onClose, onCreated, defaultDate }: { open: boolean; onClose: () => void; onCreated: () => void; defaultDate: string }) {
  const { t } = useTranslation();
  const [eventType, setEventType] = useState<'meeting' | 'task' | 'lead_followup'>('meeting');
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(defaultDate);
  const [time, setTime] = useState('');
  const [linkedName, setLinkedName] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (open) setDate(defaultDate); }, [open, defaultDate]);

  const reset = () => { setTitle(''); setDate(defaultDate); setTime(''); setLinkedName(''); setNotes(''); setEventType('meeting'); };

  const save = async () => {
    if (!title.trim()) { toast.error(t('admin.calendar.toast.titleRequired')); return; }
    if (!date) { toast.error(t('admin.calendar.toast.dateRequired')); return; }
    setSaving(true);

    const { data: { user } } = await supabase.auth.getUser();
    const dueDate = date + (time ? `T${time}` : '');

    const insertPayload: any = {
      description: notes.trim() || null,
      priority: 'normal',
      linked_name: linkedName.trim() || null,
      due_date: dueDate,
      assigned_to: user?.id || null,
      created_by: user?.id || null,
      source: 'manual',
    };

    if (eventType === 'lead_followup') {
      insertPayload.title = title.trim();
      insertPayload.linked_type = 'lead';
    } else if (eventType === 'meeting') {
      insertPayload.title = `📅 ${title.trim()}`;
      insertPayload.linked_type = 'meeting';
    } else {
      insertPayload.title = title.trim();
      insertPayload.linked_type = null;
    }

    const { error } = await supabase.from('system_tasks' as any).insert(insertPayload);
    if (error) { toast.error(`Error: ${error.message}`); setSaving(false); return; }

    toast.success(t('admin.calendar.toast.added'));
    reset();
    setSaving(false);
    onClose();
    onCreated();
  };

  const titlePlaceholder = eventType === 'meeting'
    ? t('admin.calendar.create.titlePlaceholderMeeting')
    : eventType === 'lead_followup'
      ? t('admin.calendar.create.titlePlaceholderLead')
      : t('admin.calendar.create.titlePlaceholderTask');

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Plus className="h-4 w-4 text-primary" />{t('admin.calendar.create.title')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label className="text-xs">{t('admin.calendar.create.type')}</Label>
            <Select value={eventType} onValueChange={v => setEventType(v as any)}>
              <SelectTrigger className="mt-1 rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="meeting">{t('admin.calendar.legend.meeting')}</SelectItem>
                <SelectItem value="task">{t('admin.calendar.legend.task')}</SelectItem>
                <SelectItem value="lead_followup">{t('admin.calendar.legend.leadFollowup')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">{t('admin.calendar.create.eventTitle')}</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} className="mt-1 rounded-xl" placeholder={titlePlaceholder} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs">{t('admin.calendar.create.eventDate')}</Label><Input type="date" value={date} onChange={e => setDate(e.target.value)} className="mt-1 rounded-xl" /></div>
            <div><Label className="text-xs">{t('admin.calendar.create.eventTime')}</Label><Input type="time" value={time} onChange={e => setTime(e.target.value)} className="mt-1 rounded-xl" /></div>
          </div>
          <div>
            <Label className="text-xs">{eventType === 'lead_followup' ? t('admin.calendar.create.leadName') : t('admin.calendar.create.contact')}</Label>
            <Input value={linkedName} onChange={e => setLinkedName(e.target.value)} className="mt-1 rounded-xl" placeholder={t('admin.calendar.create.namePlaceholder')} />
          </div>
          <div>
            <Label className="text-xs">{t('admin.calendar.create.notes')}</Label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} className="mt-1 rounded-xl" rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="rounded-xl">{t('admin.calendar.create.cancel')}</Button>
          <Button onClick={save} disabled={saving} className="rounded-xl gap-1.5">
            <Plus className="h-3.5 w-3.5" />{saving ? t('admin.calendar.create.saving') : t('admin.calendar.create.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
