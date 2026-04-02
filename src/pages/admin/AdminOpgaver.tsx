import { useState, useEffect, useMemo } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { AdminPageHeader } from '@/components/admin/ui/AdminPageHeader';
import { StatusChip, type StatusVariant } from '@/components/admin/ui/StatusChip';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ListChecks, Search, Plus, Clock, Play, Pause, CheckCircle2,
  Link2, MapPin, User, CalendarDays, FileText, ChevronRight
} from 'lucide-react';

/* ── Config ── */
type TaskStatus = 'pending' | 'in_progress' | 'waiting' | 'completed';

const STATUS_CFG: Record<TaskStatus, { label: string; variant: StatusVariant; icon: React.ElementType; color: string }> = {
  pending:     { label: 'Ikke startet', variant: 'muted',   icon: Clock,        color: 'border-t-muted-foreground/30' },
  in_progress: { label: 'I gang',       variant: 'info',    icon: Play,         color: 'border-t-blue-500/60' },
  waiting:     { label: 'Afventer',     variant: 'warning', icon: Pause,        color: 'border-t-amber-500/60' },
  completed:   { label: 'Færdig',       variant: 'success', icon: CheckCircle2, color: 'border-t-emerald-500/60' },
};

const STATUSES = Object.keys(STATUS_CFG) as TaskStatus[];

export default function AdminOpgaver() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | TaskStatus>('all');
  const [viewMode, setViewMode] = useState<'board' | 'list'>('board');
  const [selected, setSelected] = useState<any | null>(null);

  useEffect(() => {
    supabase.from('tasks').select('*, property:properties(title, case_number)')
      .order('scheduled_date', { ascending: true }).limit(200)
      .then(({ data }) => { setTasks(data || []); setLoading(false); });
  }, []);

  const filtered = useMemo(() => {
    return tasks.filter(t => {
      if (statusFilter !== 'all' && t.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return t.task_type?.toLowerCase().includes(q) || t.notes?.toLowerCase().includes(q);
      }
      return true;
    });
  }, [tasks, statusFilter, search]);

  const counts = useMemo(() => ({
    total: tasks.length,
    pending: tasks.filter(t => t.status === 'pending').length,
    in_progress: tasks.filter(t => t.status === 'in_progress').length,
    waiting: tasks.filter(t => t.status === 'waiting').length,
    completed: tasks.filter(t => t.status === 'completed').length,
  }), [tasks]);

  const grouped = useMemo(() => {
    const result: Record<TaskStatus, any[]> = { pending: [], in_progress: [], waiting: [], completed: [] };
    filtered.forEach(t => {
      const s = (t.status as TaskStatus) || 'pending';
      if (result[s]) result[s].push(t);
    });
    return result;
  }, [filtered]);

  const updateStatus = (id: string, newStatus: TaskStatus) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: newStatus } : t));
    supabase.from('tasks').update({ status: newStatus }).eq('id', id);
    if (selected?.id === id) setSelected((prev: any) => prev ? { ...prev, status: newStatus } : null);
  };

  const TaskCard = ({ task }: { task: any }) => {
    const st = STATUS_CFG[(task.status as TaskStatus) || 'pending'];
    const isPast = task.scheduled_date && new Date(task.scheduled_date) < new Date();
    return (
      <div
        onClick={() => setSelected(task)}
        className={`rounded-xl border border-border/40 bg-card/60 hover:bg-card/80 transition-all cursor-pointer p-3.5 border-t-2 ${st.color}`}
      >
        <div className="flex items-start justify-between gap-2 mb-2">
          <p className="text-sm font-medium text-foreground leading-tight">{task.task_type || 'Opgave'}</p>
          <st.icon className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${st.variant === 'success' ? 'text-emerald-400' : st.variant === 'info' ? 'text-blue-400' : st.variant === 'warning' ? 'text-amber-400' : 'text-muted-foreground'}`} />
        </div>

        {task.notes && (
          <p className="text-[11px] text-muted-foreground line-clamp-2 mb-2">{task.notes}</p>
        )}

        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {task.property && (
              <span className="text-[10px] text-muted-foreground flex items-center gap-0.5 truncate max-w-[120px]">
                <MapPin className="w-2.5 h-2.5 shrink-0" /> {(task.property as any)?.title}
              </span>
            )}
          </div>
          {task.scheduled_date && (
            <span className={`text-[10px] flex items-center gap-0.5 ${isPast && task.status !== 'completed' ? 'text-red-400 font-medium' : 'text-muted-foreground'}`}>
              <CalendarDays className="w-2.5 h-2.5" />
              {new Date(task.scheduled_date).toLocaleDateString('da-DK', { day: 'numeric', month: 'short' })}
            </span>
          )}
        </div>

        {task.assigned_to && (
          <div className="mt-2 pt-2 border-t border-border/20 flex items-center gap-1.5">
            <User className="w-3 h-3 text-muted-foreground/50" />
            <span className="text-[10px] text-muted-foreground">{task.assigned_to}</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <AdminPageHeader
          title="Opgaver"
          subtitle="Opgaver tilknyttet leads, ejere, gæster og sager"
          actions={
            <Button size="sm" className="gap-1.5 rounded-xl text-xs">
              <Plus className="h-3.5 w-3.5" /> Ny opgave
            </Button>
          }
        />

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {([
            { label: 'Alle', value: counts.total, icon: ListChecks, color: 'text-foreground' },
            { label: 'Ikke startet', value: counts.pending, icon: Clock, color: 'text-muted-foreground' },
            { label: 'I gang', value: counts.in_progress, icon: Play, color: 'text-blue-400' },
            { label: 'Afventer', value: counts.waiting, icon: Pause, color: 'text-amber-400' },
            { label: 'Færdige', value: counts.completed, icon: CheckCircle2, color: 'text-emerald-400' },
          ]).map(kpi => (
            <div key={kpi.label} className="rounded-xl border border-border/40 bg-card/60 p-4">
              <div className="flex items-center gap-2 mb-2">
                <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
                <span className="text-[11px] text-muted-foreground font-medium">{kpi.label}</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{kpi.value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Søg i opgaver..." value={search} onChange={e => setSearch(e.target.value)}
              className="pl-9 h-9 bg-muted/20 border-border/40 rounded-xl text-sm" />
          </div>

          <Tabs value={statusFilter} onValueChange={v => setStatusFilter(v as any)} className="w-auto">
            <TabsList className="h-9 bg-muted/20 border border-border/30 rounded-xl p-0.5">
              <TabsTrigger value="all" className="text-xs rounded-lg px-3 h-7">Alle</TabsTrigger>
              <TabsTrigger value="pending" className="text-xs rounded-lg px-3 h-7">Ikke startet</TabsTrigger>
              <TabsTrigger value="in_progress" className="text-xs rounded-lg px-3 h-7">I gang</TabsTrigger>
              <TabsTrigger value="waiting" className="text-xs rounded-lg px-3 h-7">Afventer</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* View toggle */}
          <div className="flex items-center border border-border/30 rounded-xl overflow-hidden bg-muted/20 ml-auto">
            <button onClick={() => setViewMode('board')} className={`px-3 py-1.5 text-xs font-medium transition-colors ${viewMode === 'board' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
              Board
            </button>
            <button onClick={() => setViewMode('list')} className={`px-3 py-1.5 text-xs font-medium transition-colors ${viewMode === 'list' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
              Liste
            </button>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {STATUSES.map(s => <Skeleton key={s} className="h-[300px] rounded-xl" />)}
          </div>
        ) : viewMode === 'board' ? (
          /* ── Board view ── */
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {STATUSES.map(status => {
              const cfg = STATUS_CFG[status];
              const items = grouped[status];
              return (
                <div key={status} className="space-y-3">
                  <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-2">
                      <cfg.icon className={`w-3.5 h-3.5 ${cfg.variant === 'success' ? 'text-emerald-400' : cfg.variant === 'info' ? 'text-blue-400' : cfg.variant === 'warning' ? 'text-amber-400' : 'text-muted-foreground'}`} />
                      <span className="text-xs font-semibold text-foreground">{cfg.label}</span>
                    </div>
                    <Badge variant="outline" className="text-[10px] h-5 px-1.5 bg-muted/20 border-border/30">
                      {items.length}
                    </Badge>
                  </div>
                  <div className="space-y-2 min-h-[200px]">
                    {items.map(task => <TaskCard key={task.id} task={task} />)}
                    {items.length === 0 && (
                      <div className="rounded-xl border border-dashed border-border/30 p-6 text-center">
                        <p className="text-[11px] text-muted-foreground/40">Ingen opgaver</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* ── List view ── */
          <div className="rounded-xl border border-border/40 bg-card/40 divide-y divide-border/30 overflow-hidden">
            {filtered.length === 0 ? (
              <div className="p-16 text-center">
                <ListChecks className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Ingen opgaver fundet</p>
              </div>
            ) : filtered.map(task => {
              const st = STATUS_CFG[(task.status as TaskStatus) || 'pending'];
              const isPast = task.scheduled_date && new Date(task.scheduled_date) < new Date() && task.status !== 'completed';
              return (
                <div
                  key={task.id}
                  onClick={() => setSelected(task)}
                  className="flex items-center gap-4 px-4 py-3 hover:bg-muted/15 transition-colors cursor-pointer group"
                >
                  <st.icon className={`w-4 h-4 shrink-0 ${st.variant === 'success' ? 'text-emerald-400' : st.variant === 'info' ? 'text-blue-400' : st.variant === 'warning' ? 'text-amber-400' : 'text-muted-foreground'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{task.task_type || 'Opgave'}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {task.property && (
                        <span className="text-[11px] text-muted-foreground flex items-center gap-0.5">
                          <Link2 className="w-2.5 h-2.5" /> {(task.property as any)?.title}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="hidden sm:flex items-center gap-3 shrink-0">
                    {task.scheduled_date && (
                      <span className={`text-[11px] ${isPast ? 'text-red-400 font-medium' : 'text-muted-foreground'}`}>
                        {new Date(task.scheduled_date).toLocaleDateString('da-DK', { day: 'numeric', month: 'short' })}
                      </span>
                    )}
                    <StatusChip label={st.label} variant={st.variant} dot size="sm" />
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-muted-foreground transition-colors shrink-0" />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Detail drawer ── */}
      <Sheet open={!!selected} onOpenChange={open => !open && setSelected(null)}>
        <SheetContent className="sm:max-w-lg bg-card border-border/50 overflow-y-auto">
          {selected && (() => {
            const st = STATUS_CFG[(selected.status as TaskStatus) || 'pending'];
            return (
              <>
                <SheetHeader className="pb-4 border-b border-border/30">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-muted/30 flex items-center justify-center">
                      <st.icon className={`w-5 h-5 ${st.variant === 'success' ? 'text-emerald-400' : st.variant === 'info' ? 'text-blue-400' : st.variant === 'warning' ? 'text-amber-400' : 'text-muted-foreground'}`} />
                    </div>
                    <div>
                      <SheetTitle className="text-base">{selected.task_type || 'Opgave'}</SheetTitle>
                      <StatusChip label={st.label} variant={st.variant} dot className="mt-1" />
                    </div>
                  </div>
                </SheetHeader>

                {/* Info */}
                <div className="py-5 space-y-4 border-b border-border/30">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-semibold mb-1">Dato</p>
                      <p className="text-sm font-medium text-foreground">
                        {selected.scheduled_date ? new Date(selected.scheduled_date).toLocaleDateString('da-DK', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-semibold mb-1">Tildelt</p>
                      <p className="text-sm font-medium text-foreground">{selected.assigned_to || 'Ingen'}</p>
                    </div>
                  </div>
                  {selected.property && (
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-semibold mb-1">Sag</p>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="text-sm font-medium text-foreground">{(selected.property as any)?.title}</span>
                        {(selected.property as any)?.case_number && (
                          <Badge variant="outline" className="text-[10px] ml-1">{(selected.property as any)?.case_number}</Badge>
                        )}
                      </div>
                    </div>
                  )}
                  {selected.notes && (
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-semibold mb-1">Noter</p>
                      <p className="text-sm text-foreground whitespace-pre-wrap">{selected.notes}</p>
                    </div>
                  )}
                </div>

                {/* Status change */}
                <div className="py-5 space-y-3">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-semibold">Skift status</p>
                  <div className="grid grid-cols-2 gap-2">
                    {STATUSES.map(s => {
                      const cfg = STATUS_CFG[s];
                      return (
                        <Button
                          key={s}
                          variant={selected.status === s ? 'default' : 'outline'}
                          size="sm"
                          className="rounded-xl text-xs h-9 gap-1.5 justify-start"
                          onClick={() => updateStatus(selected.id, s)}
                        >
                          <cfg.icon className="w-3.5 h-3.5" />
                          {cfg.label}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              </>
            );
          })()}
        </SheetContent>
      </Sheet>
    </AdminLayout>
  );
}
