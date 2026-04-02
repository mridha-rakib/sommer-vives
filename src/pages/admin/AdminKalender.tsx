import { useState, useEffect, useMemo } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { AdminPageHeader } from '@/components/admin/ui/AdminPageHeader';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ChevronLeft, ChevronRight, Calendar as CalIcon, Eye, MapPin,
  Clock, Plus, Video, Phone, ClipboardCheck, Bell
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

const DAYS = ['Man', 'Tir', 'Ons', 'Tor', 'Fre', 'Lør', 'Søn'];
const MONTHS = ['Januar', 'Februar', 'Marts', 'April', 'Maj', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'December'];

type EventType = 'meeting' | 'visit' | 'task' | 'reminder' | 'inspection';

const EVENT_CFG: Record<EventType, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  meeting:    { label: 'Møde',            color: 'text-blue-400',    bg: 'bg-blue-500/15',    icon: Video },
  visit:      { label: 'Besøg',           color: 'text-emerald-400', bg: 'bg-emerald-500/15', icon: MapPin },
  task:       { label: 'Opgave',          color: 'text-amber-400',   bg: 'bg-amber-500/15',   icon: ClipboardCheck },
  reminder:   { label: 'Påmindelse',      color: 'text-violet-400',  bg: 'bg-violet-500/15',  icon: Bell },
  inspection: { label: 'Udlejningstjek',  color: 'text-primary',     bg: 'bg-primary/15',     icon: Eye },
};

function mapTaskToEvent(t: any): { id: string; type: EventType; title: string; date: string; time?: string; linked?: string } {
  const type: EventType =
    t.task_type?.includes('møde') || t.task_type?.includes('meeting') ? 'meeting' :
    t.task_type?.includes('besøg') || t.task_type?.includes('visit') ? 'visit' :
    t.task_type?.includes('tjek') || t.task_type?.includes('inspection') ? 'inspection' :
    t.task_type?.includes('påmind') || t.task_type?.includes('reminder') ? 'reminder' : 'task';
  return {
    id: t.id,
    type,
    title: t.task_type || 'Opgave',
    date: t.scheduled_date,
    linked: (t.property as any)?.title,
  };
}

export default function AdminKalender() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  useEffect(() => {
    const start = new Date(year, month - 1, 1).toISOString().split('T')[0];
    const end = new Date(year, month + 2, 0).toISOString().split('T')[0];
    supabase.from('tasks').select('*, property:properties(title)')
      .gte('scheduled_date', start).lte('scheduled_date', end)
      .then(({ data }) => { setTasks(data || []); setLoading(false); });
  }, [year, month]);

  const events = useMemo(() => tasks.map(mapTaskToEvent), [tasks]);
  const today = new Date().toISOString().split('T')[0];

  const eventsForDate = (date: string) => events.filter(e => e.date === date);

  const navigate = (dir: number) => {
    if (view === 'month') setCurrentDate(new Date(year, month + dir));
    else if (view === 'week') setCurrentDate(new Date(currentDate.getTime() + dir * 7 * 86400000));
    else setCurrentDate(new Date(currentDate.getTime() + dir * 86400000));
  };

  // Month view helpers
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const offset = (firstDay + 6) % 7;

  // Week view helpers
  const weekStart = new Date(currentDate);
  const dayOfWeek = (weekStart.getDay() + 6) % 7;
  weekStart.setDate(weekStart.getDate() - dayOfWeek);
  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d.toISOString().split('T')[0];
  });

  // Day view
  const dayStr = currentDate.toISOString().split('T')[0];
  const dayEvents = eventsForDate(dayStr);

  const todayCount = eventsForDate(today).length;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <AdminPageHeader
          title="Kalender"
          subtitle="Din operationelle kalender — møder, besøg, deadlines og opgaver"
          actions={
            <div className="flex items-center gap-2">
              {todayCount > 0 && (
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-xs font-semibold px-2.5 py-1">
                  {todayCount} i dag
                </Badge>
              )}
              <Button size="sm" className="gap-1.5 rounded-xl text-xs">
                <Plus className="h-3.5 w-3.5" /> Tilføj
              </Button>
            </div>
          }
        />

        {/* Toolbar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => navigate(-1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-base font-semibold text-foreground min-w-[180px] text-center">
              {view === 'month' && `${MONTHS[month]} ${year}`}
              {view === 'week' && `Uge ${Math.ceil((currentDate.getDate() + offset) / 7)} · ${MONTHS[month]} ${year}`}
              {view === 'day' && currentDate.toLocaleDateString('da-DK', { weekday: 'long', day: 'numeric', month: 'long' })}
            </h2>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => navigate(1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" className="rounded-xl text-xs h-8 ml-2" onClick={() => setCurrentDate(new Date())}>
              I dag
            </Button>
          </div>

          <Tabs value={view} onValueChange={v => setView(v as any)} className="w-auto">
            <TabsList className="h-8 bg-muted/20 border border-border/30 rounded-xl p-0.5">
              <TabsTrigger value="month" className="text-xs rounded-lg px-3 h-6">Måned</TabsTrigger>
              <TabsTrigger value="week" className="text-xs rounded-lg px-3 h-6">Uge</TabsTrigger>
              <TabsTrigger value="day" className="text-xs rounded-lg px-3 h-6">Dag</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3">
          {Object.entries(EVENT_CFG).map(([key, cfg]) => (
            <div key={key} className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${cfg.bg} border ${cfg.color.replace('text-', 'border-')}`} />
              <span className="text-[11px] text-muted-foreground">{cfg.label}</span>
            </div>
          ))}
        </div>

        {loading ? (
          <Skeleton className="h-[500px] w-full rounded-xl" />
        ) : view === 'month' ? (
          /* ── Month ── */
          <div className="rounded-xl border border-border/40 bg-card/40 overflow-hidden">
            <div className="grid grid-cols-7">
              {DAYS.map(d => (
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
                const isSelected = dateStr === selectedDay;
                return (
                  <div
                    key={day}
                    onClick={() => { setSelectedDay(dateStr); setCurrentDate(new Date(dateStr)); setView('day'); }}
                    className={`border-b border-r border-border/10 min-h-[100px] p-2 cursor-pointer transition-colors hover:bg-muted/10 ${
                      isToday ? 'bg-primary/[0.03]' : ''
                    } ${isSelected ? 'ring-1 ring-inset ring-primary/30' : ''}`}
                  >
                    <span className={`text-xs font-medium inline-flex items-center justify-center w-6 h-6 rounded-full ${
                      isToday ? 'bg-primary text-primary-foreground font-bold' : 'text-foreground'
                    }`}>
                      {day}
                    </span>
                    <div className="mt-1 space-y-0.5">
                      {dayEvts.slice(0, 3).map(evt => {
                        const cfg = EVENT_CFG[evt.type];
                        return (
                          <div key={evt.id} className={`text-[10px] px-1.5 py-0.5 rounded-md ${cfg.bg} ${cfg.color} truncate font-medium`}>
                            {evt.title}
                          </div>
                        );
                      })}
                      {dayEvts.length > 3 && (
                        <span className="text-[10px] text-muted-foreground/60 pl-1">+{dayEvts.length - 3}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : view === 'week' ? (
          /* ── Week ── */
          <div className="rounded-xl border border-border/40 bg-card/40 overflow-hidden">
            <div className="grid grid-cols-7">
              {weekDates.map((dateStr, i) => {
                const d = new Date(dateStr);
                const isToday = dateStr === today;
                const dayEvts = eventsForDate(dateStr);
                return (
                  <div key={dateStr} className="border-r border-border/10 last:border-r-0">
                    <div className={`p-3 border-b border-border/20 text-center ${isToday ? 'bg-primary/[0.05]' : 'bg-muted/10'}`}>
                      <span className="text-[10px] text-muted-foreground/60 uppercase block">{DAYS[i]}</span>
                      <span className={`text-lg font-semibold ${isToday ? 'text-primary' : 'text-foreground'}`}>
                        {d.getDate()}
                      </span>
                    </div>
                    <div className="p-2 min-h-[300px] space-y-1.5">
                      {dayEvts.map(evt => {
                        const cfg = EVENT_CFG[evt.type];
                        return (
                          <div key={evt.id} className={`p-2 rounded-lg ${cfg.bg} border border-transparent hover:border-border/30 transition-colors cursor-pointer`}>
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <cfg.icon className={`w-3 h-3 ${cfg.color}`} />
                              <span className={`text-[10px] font-semibold ${cfg.color}`}>{cfg.label}</span>
                            </div>
                            <p className="text-xs font-medium text-foreground truncate">{evt.title}</p>
                            {evt.linked && <p className="text-[10px] text-muted-foreground truncate mt-0.5">{evt.linked}</p>}
                          </div>
                        );
                      })}
                      {dayEvts.length === 0 && (
                        <p className="text-[10px] text-muted-foreground/30 text-center pt-8">Ingen</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* ── Day ── */
          <div className="rounded-xl border border-border/40 bg-card/40 overflow-hidden">
            <div className="p-5">
              {dayEvents.length === 0 ? (
                <div className="text-center py-16">
                  <CalIcon className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">Ingen begivenheder denne dag</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {dayEvents.map(evt => {
                    const cfg = EVENT_CFG[evt.type];
                    return (
                      <div key={evt.id} className={`flex items-start gap-4 p-4 rounded-xl ${cfg.bg} border border-border/20 hover:border-border/40 transition-colors cursor-pointer`}>
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 bg-background/50`}>
                          <cfg.icon className={`w-5 h-5 ${cfg.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className={`text-[10px] font-semibold uppercase tracking-wider ${cfg.color}`}>{cfg.label}</span>
                          </div>
                          <p className="text-sm font-semibold text-foreground">{evt.title}</p>
                          {evt.linked && (
                            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                              <MapPin className="w-3 h-3" /> {evt.linked}
                            </p>
                          )}
                          {evt.time && <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1"><Clock className="w-3 h-3" /> {evt.time}</p>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
