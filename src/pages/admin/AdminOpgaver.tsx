import { useState, useEffect, useMemo, useCallback } from 'react';
import React from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { StatusChip, type StatusVariant } from '@/components/admin/ui/StatusChip';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  format, isToday, isPast, isBefore, addDays,
  startOfWeek, endOfWeek, startOfDay,
} from 'date-fns';
import { da } from 'date-fns/locale';
import {
  Plus, Search, ListChecks, LayoutGrid, List, X, CheckCircle2,
  Clock, Pause, Flag, CalendarDays, User, Link2,
  StickyNote, Trash2, ChevronRight, Zap, Briefcase,
  CalendarClock, Calendar,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type SystemTask = Database['public']['Tables']['system_tasks']['Row'];
type TaskInsert = Database['public']['Tables']['system_tasks']['Insert'];
type TaskStatus = Database['public']['Enums']['task_status'];
type TaskPriority = Database['public']['Enums']['task_priority'];
type SectionTab = 'all' | 'personal' | 'case';
type DateScope = 'today' | 'week' | 'all';

// ─── Config ───────────────────────────────────────────────────────────────────

const STATUS_CFG: Record<TaskStatus, { label: string; variant: StatusVariant; icon: React.ElementType }> = {
  not_started: { label: 'Ikke startet', variant: 'muted', icon: Clock },
  in_progress: { label: 'I gang', variant: 'info', icon: Zap },
  waiting: { label: 'Afventer', variant: 'warning', icon: Pause },
  done: { label: 'Færdig', variant: 'success', icon: CheckCircle2 },
};
const PRIORITY_CFG: Record<TaskPriority, { label: string; variant: StatusVariant }> = {
  low: { label: 'Lav', variant: 'muted' },
  normal: { label: 'Normal', variant: 'info' },
  high: { label: 'Høj', variant: 'warning' },
  urgent: { label: 'Akut', variant: 'danger' },
};
const LINKED_TYPES = [
  { value: 'lead', label: 'Lead' },
  { value: 'owner', label: 'Ejer' },
  { value: 'guest', label: 'Gæst' },
  { value: 'listing', label: 'Sag / Listing' },
  { value: 'document', label: 'Dokument' },
  { value: 'meeting', label: 'Møde' },
  { value: 'booking', label: 'Booking' },
] as const;
const STATUSES: TaskStatus[] = ['not_started', 'in_progress', 'waiting', 'done'];
const PRIORITIES: TaskPriority[] = ['low', 'normal', 'high', 'urgent'];

// ─── SummaryCard ─────────────────────────────────────────────────────────────

function SummaryCard({
  label, value, icon: Icon, active, onClick,
}: {
  label: string; value: number; icon: React.ElementType; active?: boolean; onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'rounded-xl border p-4 text-left transition-all hover:shadow-sm',
        active ? 'border-primary/30 bg-primary/5' : 'border-border/40 bg-card/60 hover:border-border/60',
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <Icon className={cn('h-4 w-4', active ? 'text-primary' : 'text-muted-foreground')} />
        <span className={cn('text-2xl font-bold', value > 0 ? 'text-foreground' : 'text-muted-foreground/40')}>{value}</span>
      </div>
      <p className="text-[11px] text-muted-foreground font-medium">{label}</p>
    </button>
  );
}

// ─── CreateTaskDialog ─────────────────────────────────────────────────────────

function CreateTaskDialog({
  open, onClose, onCreated,
}: {
  open: boolean; onClose: () => void; onCreated: () => void;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('normal');
  const [linkedType, setLinkedType] = useState('');
  const [linkedName, setLinkedName] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [assignedName, setAssignedName] = useState('');
  const [saving, setSaving] = useState(false);

  if (!open) return null;

  const reset = () => {
    setTitle(''); setDescription(''); setPriority('normal');
    setLinkedType(''); setLinkedName(''); setDueDate(''); setAssignedName('');
  };

  const handleSave = async () => {
    if (!title.trim()) { toast.error('Titel er påkrævet'); return; }
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    const payload: TaskInsert = {
      title: title.trim(),
      description: description.trim() || null,
      priority,
      linked_type: (linkedType as TaskInsert['linked_type']) || null,
      linked_name: linkedName.trim() || null,
      due_date: dueDate || format(new Date(), 'yyyy-MM-dd'),
      assigned_name: assignedName.trim() || null,
      assigned_to: user?.id ?? null,
      created_by: user?.id ?? null,
      source: 'manual',
      status: 'not_started',
    };
    const { error } = await supabase.from('system_tasks').insert(payload);
    setSaving(false);
    if (error) { toast.error('Kunne ikke oprette opgave'); return; }
    toast.success('Opgave oprettet');
    reset();
    onCreated();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg mx-4 rounded-2xl border border-border/40 bg-card shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-border/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Plus className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Ny opgave</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted/30">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
        <div className="px-6 py-4 space-y-4">
          <div className="space-y-1.5">
            <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Titel *</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Hvad skal gøres?" className="h-9 text-sm rounded-lg" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Beskrivelse</Label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Valgfri beskrivelse..." rows={2} className="text-sm rounded-lg resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Prioritet</Label>
              <select value={priority} onChange={e => setPriority(e.target.value as TaskPriority)} className="w-full h-9 text-sm rounded-lg border border-border bg-background px-3">
                {PRIORITIES.map(p => <option key={p} value={p}>{PRIORITY_CFG[p].label}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Forfaldsdato</Label>
              <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="h-9 text-sm rounded-lg" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Tilknyt type</Label>
              <select value={linkedType} onChange={e => setLinkedType(e.target.value)} className="w-full h-9 text-sm rounded-lg border border-border bg-background px-3">
                <option value="">Ingen</option>
                {LINKED_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Tilknyt navn</Label>
              <Input value={linkedName} onChange={e => setLinkedName(e.target.value)} placeholder="F.eks. navn på lead" className="h-9 text-sm rounded-lg" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Tildelt til</Label>
            <Input value={assignedName} onChange={e => setAssignedName(e.target.value)} placeholder="Navn" className="h-9 text-sm rounded-lg" />
          </div>
        </div>
        <div className="px-6 py-4 border-t border-border/30 flex justify-end gap-2">
          <Button variant="outline" size="sm" className="rounded-xl text-xs" onClick={onClose}>Annuller</Button>
          <Button size="sm" className="rounded-xl text-xs gap-1.5" onClick={handleSave} disabled={saving}>
            <Plus className="h-3.5 w-3.5" />{saving ? 'Opretter...' : 'Opret opgave'}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── TaskDrawer ───────────────────────────────────────────────────────────────

function TaskDrawer({
  task, onClose, onRefresh, onTaskUpdated,
}: {
  task: SystemTask | null;
  onClose: () => void;
  onRefresh: () => void;
  onTaskUpdated: (updated: SystemTask) => void;
}) {
  const [notes, setNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [dueDate, setDueDate] = useState('');

  useEffect(() => {
    if (task) { setNotes(task.notes || ''); setDueDate(task.due_date || ''); }
  }, [task?.id]);

  if (!task) return null;

  const patchTask = async (patch: Database['public']['Tables']['system_tasks']['Update']) => {
    const { data, error } = await supabase
      .from('system_tasks')
      .update(patch)
      .eq('id', task.id)
      .select()
      .single();
    if (error) { toast.error('Kunne ikke opdatere opgave'); return null; }
    return data as SystemTask;
  };

  const updateStatus = async (status: TaskStatus) => {
    const updated = await patchTask({
      status,
      completed_at: status === 'done' ? new Date().toISOString() : null,
    });
    if (updated) { toast.success(`Status: ${STATUS_CFG[status].label}`); onTaskUpdated(updated); onRefresh(); }
  };

  const updateDueDate = async (newDate: string) => {
    setDueDate(newDate);
    const updated = await patchTask({ due_date: newDate });
    if (updated) {
      toast.success(`Udsat til ${format(new Date(newDate), 'd. MMM yyyy', { locale: da })}`);
      onTaskUpdated(updated);
      onRefresh();
    }
  };

  const saveNotes = async () => {
    setSavingNotes(true);
    const updated = await patchTask({ notes });
    setSavingNotes(false);
    if (updated) { toast.success('Noter gemt'); onTaskUpdated(updated); onRefresh(); }
  };

  const deleteTask = async () => {
    if (!confirm('Slet denne opgave?')) return;
    const { error } = await supabase.from('system_tasks').delete().eq('id', task.id);
    if (error) { toast.error('Kunne ikke slette opgave'); return; }
    toast.success('Opgave slettet');
    onRefresh();
    onClose();
  };

  const pCfg = PRIORITY_CFG[task.priority];
  const sCfg = STATUS_CFG[task.status];
  const isOverdue = task.due_date && isPast(new Date(task.due_date + 'T23:59:59')) && task.status !== 'done';

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div
        className="w-full max-w-md bg-card border-l border-border/40 shadow-2xl h-full overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-border/30 flex items-center justify-between sticky top-0 bg-card z-10">
          <h2 className="text-sm font-semibold text-foreground truncate pr-4">{task.title}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted/30 shrink-0">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
        <div className="px-6 py-5 space-y-5">
          <div className="flex items-center gap-2 flex-wrap">
            <StatusChip label={sCfg.label} variant={sCfg.variant} dot size="md" />
            <StatusChip label={pCfg.label} variant={pCfg.variant} size="md" />
            {task.source === 'system' && <StatusChip label="Systemgenereret" variant="info" size="sm" />}
            {isOverdue && <StatusChip label="Forfalden" variant="danger" dot size="sm" />}
          </div>

          {task.description && (
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Beskrivelse</p>
              <p className="text-sm text-foreground leading-relaxed">{task.description}</p>
            </div>
          )}

          <div className="rounded-xl border border-border/30 bg-muted/10 p-4 space-y-2.5">
            {task.linked_type && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground flex items-center gap-1.5"><Link2 className="h-3 w-3" />Tilknyttet</span>
                <span className="text-xs font-medium text-foreground">
                  {LINKED_TYPES.find(t => t.value === task.linked_type)?.label}: {task.linked_name || '—'}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground flex items-center gap-1.5"><CalendarDays className="h-3 w-3" />Forfaldsdato</span>
              <Input
                type="date"
                value={dueDate}
                onChange={e => updateDueDate(e.target.value)}
                className="h-7 text-xs w-36 rounded-lg"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground mr-auto">Hurtig udsæt:</span>
              <Button size="sm" variant="outline" className="h-6 text-[10px] px-2 rounded-lg" onClick={() => updateDueDate(format(addDays(new Date(), 1), 'yyyy-MM-dd'))}>I morgen</Button>
              <Button size="sm" variant="outline" className="h-6 text-[10px] px-2 rounded-lg" onClick={() => updateDueDate(format(addDays(new Date(), 3), 'yyyy-MM-dd'))}>+3 dage</Button>
              <Button size="sm" variant="outline" className="h-6 text-[10px] px-2 rounded-lg" onClick={() => updateDueDate(format(addDays(new Date(), 7), 'yyyy-MM-dd'))}>+1 uge</Button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground flex items-center gap-1.5"><User className="h-3 w-3" />Tildelt</span>
              <span className="text-xs font-medium text-foreground">{task.assigned_name || '—'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Oprettet</span>
              <span className="text-xs text-foreground">{format(new Date(task.created_at), 'd. MMM yyyy HH:mm', { locale: da })}</span>
            </div>
            {task.completed_at && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Færdiggjort</span>
                <span className="text-xs text-emerald-400">{format(new Date(task.completed_at), 'd. MMM yyyy HH:mm', { locale: da })}</span>
              </div>
            )}
          </div>

          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Skift status</p>
            <div className="flex flex-wrap gap-1.5">
              {STATUSES.map(s => (
                <Button
                  key={s}
                  size="sm"
                  variant={task.status === s ? 'default' : 'outline'}
                  className="rounded-xl text-xs h-8 gap-1"
                  onClick={() => updateStatus(s)}
                  disabled={task.status === s}
                >
                  {React.createElement(STATUS_CFG[s].icon, { className: 'h-3 w-3' })}
                  {STATUS_CFG[s].label}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Noter</p>
            <Textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Tilføj noter..."
              rows={3}
              className="text-sm rounded-lg resize-none mb-2"
            />
            <Button size="sm" variant="outline" className="rounded-xl text-xs gap-1" onClick={saveNotes} disabled={savingNotes}>
              <StickyNote className="h-3 w-3" />{savingNotes ? 'Gemmer...' : 'Gem noter'}
            </Button>
          </div>

          <Button
            size="sm"
            variant="outline"
            className="rounded-xl text-xs gap-1 text-red-400 border-red-500/20 hover:bg-red-500/5 w-full"
            onClick={deleteTask}
          >
            <Trash2 className="h-3 w-3" />Slet opgave
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── BoardCard ────────────────────────────────────────────────────────────────

function BoardCard({
  task, onClick, selected, onSelect,
}: {
  task: SystemTask; onClick: () => void; selected: boolean; onSelect: (checked: boolean) => void;
}) {
  const pCfg = PRIORITY_CFG[task.priority];
  const isOverdue = task.due_date && isPast(new Date(task.due_date + 'T23:59:59')) && task.status !== 'done';
  return (
    <div className="flex items-start gap-2">
      <Checkbox checked={selected} onCheckedChange={onSelect} className="mt-3 shrink-0" />
      <button onClick={onClick} className="flex-1 text-left rounded-xl border border-border/30 bg-card/80 p-3 hover:border-border/50 hover:shadow-sm transition-all">
        <p className="text-xs font-semibold text-foreground mb-1.5 line-clamp-2">{task.title}</p>
        <div className="flex items-center gap-1.5 flex-wrap">
          <StatusChip label={pCfg.label} variant={pCfg.variant} size="sm" />
          {task.source === 'system' && <StatusChip label="System" variant="info" size="sm" />}
          {isOverdue && <StatusChip label="Forfalden" variant="danger" size="sm" />}
        </div>
        {(task.due_date || task.linked_name) && (
          <div className="mt-2 space-y-1">
            {task.due_date && (
              <p className={cn('text-[10px] flex items-center gap-1', isOverdue ? 'text-red-400' : 'text-muted-foreground')}>
                <CalendarDays className="h-2.5 w-2.5" />{format(new Date(task.due_date), 'd. MMM', { locale: da })}
              </p>
            )}
            {task.linked_name && (
              <p className="text-[10px] text-muted-foreground flex items-center gap-1 truncate">
                <Link2 className="h-2.5 w-2.5" />{task.linked_name}
              </p>
            )}
          </div>
        )}
      </button>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminOpgaver() {
  const [tasks, setTasks] = useState<SystemTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [view, setView] = useState<'list' | 'board'>('list');
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<SystemTask | null>(null);
  const [filterStatus, setFilterStatus] = useState<TaskStatus | 'all'>('all');
  const [filterPriority, setFilterPriority] = useState<TaskPriority | 'all'>('all');
  const [filterLinked, setFilterLinked] = useState('all');
  const [section, setSection] = useState<SectionTab>('all');
  const [dateScope, setDateScope] = useState<DateScope>('today');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Fetch current user once
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setCurrentUserId(data.user?.id ?? null));
  }, []);

  // Fetch all tasks
  const fetchTasks = useCallback(async () => {
    const { data, error } = await supabase
      .from('system_tasks')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(500);
    if (error) { toast.error('Kunne ikke hente opgaver'); return; }
    setTasks((data as SystemTask[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('system_tasks_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'system_tasks' },
        () => { fetchTasks(); },
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchTasks]);

  // ── Date helpers ──────────────────────────────────────────────────────────
  const now = new Date();
  const wStart = startOfWeek(now, { weekStartsOn: 1 });
  const wEnd = endOfWeek(now, { weekStartsOn: 1 });

  // ── Derived data ──────────────────────────────────────────────────────────
  const sectionTasks = useMemo(() => {
    if (section === 'personal') return tasks.filter(t => !t.linked_id && t.created_by === currentUserId);
    if (section === 'case') return tasks.filter(t => !!t.linked_id);
    return tasks;
  }, [tasks, section, currentUserId]);

  const dateScopedTasks = useMemo(() => sectionTasks.filter(t => {
    if (dateScope === 'today') {
      if (!t.due_date) return t.status !== 'done';
      const d = new Date(t.due_date);
      return isToday(d) || (isBefore(d, startOfDay(now)) && t.status !== 'done');
    }
    if (dateScope === 'week') {
      if (!t.due_date) return true;
      const d = new Date(t.due_date);
      return (d >= wStart && d <= wEnd) || (isBefore(d, wStart) && t.status !== 'done');
    }
    return true;
  }), [sectionTasks, dateScope]);

  const counts = useMemo(() => ({
    active: dateScopedTasks.filter(t => t.status !== 'done').length,
    dueToday: sectionTasks.filter(t => t.due_date && isToday(new Date(t.due_date)) && t.status !== 'done').length,
    highPrio: dateScopedTasks.filter(t => (t.priority === 'high' || t.priority === 'urgent') && t.status !== 'done').length,
    waiting: dateScopedTasks.filter(t => t.status === 'waiting').length,
    doneThisWeek: sectionTasks.filter(t => t.completed_at && new Date(t.completed_at) >= wStart && new Date(t.completed_at) <= wEnd).length,
  }), [dateScopedTasks, sectionTasks]);

  const filtered = useMemo(() => dateScopedTasks.filter(t => {
    if (filterStatus === 'all' && t.status === 'done') return false;
    if (filterStatus !== 'all' && t.status !== filterStatus) return false;
    if (filterPriority !== 'all' && t.priority !== filterPriority) return false;
    if (filterLinked !== 'all' && t.linked_type !== filterLinked) return false;
    if (search && !t.title.toLowerCase().includes(search.toLowerCase()) && !(t.linked_name || '').toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [dateScopedTasks, filterStatus, filterPriority, filterLinked, search]);

  const clearFilters = () => { setFilterStatus('all'); setFilterPriority('all'); setFilterLinked('all'); setSearch(''); };
  const hasFilters = filterStatus !== 'all' || filterPriority !== 'all' || filterLinked !== 'all' || !!search;

  // ── Selection helpers ─────────────────────────────────────────────────────
  const toggleSelect = (id: string, checked: boolean) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (checked) next.add(id); else next.delete(id);
      return next;
    });
  };
  const selectAll = () => {
    setSelectedIds(selectedIds.size === filtered.length ? new Set() : new Set(filtered.map(t => t.id)));
  };

  // ── Bulk actions (batch queries) ──────────────────────────────────────────
  const bulkUpdate = async (patch: Database['public']['Tables']['system_tasks']['Update'], successMsg: string) => {
    const ids = Array.from(selectedIds);
    if (!ids.length) return;
    const { error } = await supabase.from('system_tasks').update(patch).in('id', ids);
    if (error) { toast.error('Bulk-opdatering fejlede'); return; }
    toast.success(successMsg);
    setSelectedIds(new Set());
    fetchTasks();
  };

  const bulkPostpone = (days: number) => {
    const newDate = format(addDays(new Date(), days), 'yyyy-MM-dd');
    const n = selectedIds.size;
    bulkUpdate(
      { due_date: newDate },
      `${n} opgave${n > 1 ? 'r' : ''} udsat til ${format(addDays(new Date(), days), 'd. MMM', { locale: da })}`,
    );
  };

  const bulkSetDate = (date: string) => {
    const n = selectedIds.size;
    bulkUpdate(
      { due_date: date },
      `${n} opgave${n > 1 ? 'r' : ''} sat til ${format(new Date(date), 'd. MMM', { locale: da })}`,
    );
  };

  const bulkComplete = () => {
    const n = selectedIds.size;
    bulkUpdate(
      { status: 'done', completed_at: new Date().toISOString() },
      `${n} opgave${n > 1 ? 'r' : ''} markeret som færdige ✅`,
    );
  };

  const bulkDelete = async () => {
    const ids = Array.from(selectedIds);
    if (!ids.length) return;
    if (!confirm(`Slet ${ids.length} opgave${ids.length > 1 ? 'r' : ''}?`)) return;
    const { error } = await supabase.from('system_tasks').delete().in('id', ids);
    if (error) { toast.error('Sletning fejlede'); return; }
    toast.success(`${ids.length} opgave${ids.length > 1 ? 'r' : ''} slettet`);
    setSelectedIds(new Set());
    fetchTasks();
  };

  // ── Drawer callbacks ──────────────────────────────────────────────────────
  const handleTaskUpdated = (updated: SystemTask) => {
    setSelectedTask(updated);
    setTasks(prev => prev.map(t => (t.id === updated.id ? updated : t)));
  };

  const dateScopeLabels: Record<DateScope, string> = { today: 'I dag', week: 'Denne uge', all: 'Alle' };

  return (
    <AdminLayout>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-foreground">Alle opgaver</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Alt der skal gøres — ét samlet overblik</p>
          </div>
          <Button size="sm" className="rounded-xl gap-1.5" onClick={() => setCreateOpen(true)}>
            <Plus className="h-3.5 w-3.5" />Ny opgave
          </Button>
        </div>

        {/* Date scope tabs */}
        <div className="flex items-center gap-1 bg-muted/30 rounded-xl p-1 w-fit border border-border/40">
          {(['today', 'week', 'all'] as DateScope[]).map(scope => (
            <button
              key={scope}
              onClick={() => { setDateScope(scope); setSelectedIds(new Set()); }}
              className={cn(
                'px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5',
                dateScope === scope ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {scope === 'today' && <CalendarDays className="h-3.5 w-3.5" />}
              {scope === 'week' && <Calendar className="h-3.5 w-3.5" />}
              {scope === 'all' && <ListChecks className="h-3.5 w-3.5" />}
              {dateScopeLabels[scope]}
              <span className={cn(
                'text-[10px] px-1.5 py-0.5 rounded-full',
                dateScope === scope ? 'bg-primary/10 text-primary' : 'bg-muted/50 text-muted-foreground',
              )}>
                {scope === 'today'
                  ? counts.dueToday + sectionTasks.filter(t => !t.due_date && t.status !== 'done').length
                  : scope === 'week'
                    ? sectionTasks.filter(t => {
                      if (!t.due_date) return true;
                      const d = new Date(t.due_date);
                      return (d >= wStart && d <= wEnd) || (isBefore(d, wStart) && t.status !== 'done');
                    }).length
                    : sectionTasks.length}
              </span>
            </button>
          ))}
        </div>

        {/* Section tabs */}
        <Tabs
          value={section}
          onValueChange={v => { setSection(v as SectionTab); setSelectedIds(new Set()); }}
          className="w-full"
        >
          <TabsList className="bg-muted/30 border border-border/40">
            <TabsTrigger value="all" className="gap-1.5 text-xs">
              <ListChecks className="h-3.5 w-3.5" /> Alle opgaver
            </TabsTrigger>
            <TabsTrigger value="personal" className="gap-1.5 text-xs">
              <User className="h-3.5 w-3.5" /> ToDo Personlig
            </TabsTrigger>
            <TabsTrigger value="case" className="gap-1.5 text-xs">
              <Briefcase className="h-3.5 w-3.5" /> Sagsopgaver
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <SummaryCard label="Alle aktive" value={counts.active} icon={ListChecks} active={!hasFilters} onClick={clearFilters} />
          <SummaryCard label="I dag" value={counts.dueToday} icon={CalendarDays} />
          <SummaryCard label="Høj prioritet" value={counts.highPrio} icon={Flag} active={filterPriority === 'high' || filterPriority === 'urgent'} onClick={() => { clearFilters(); setFilterPriority('high'); }} />
          <SummaryCard label="Afventer" value={counts.waiting} icon={Pause} active={filterStatus === 'waiting'} onClick={() => { clearFilters(); setFilterStatus('waiting'); }} />
          <SummaryCard label="Færdige i uge" value={counts.doneThisWeek} icon={CheckCircle2} active={filterStatus === 'done'} onClick={() => { clearFilters(); setFilterStatus('done'); }} />
        </div>

        {/* Bulk action bar */}
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-2 bg-primary/5 border border-primary/20 rounded-xl px-4 py-2.5 animate-in slide-in-from-top-2 flex-wrap">
            <span className="text-xs font-semibold text-foreground">{selectedIds.size} valgt</span>
            <span className="text-border">|</span>
            <Button size="sm" variant="outline" className="h-7 text-[11px] gap-1 rounded-lg" onClick={() => bulkSetDate(format(new Date(), 'yyyy-MM-dd'))}>
              <Calendar className="h-3 w-3" /> I dag
            </Button>
            <Button size="sm" variant="outline" className="h-7 text-[11px] gap-1 rounded-lg" onClick={() => bulkPostpone(1)}>
              <CalendarClock className="h-3 w-3" /> I morgen
            </Button>
            <Button size="sm" variant="outline" className="h-7 text-[11px] gap-1 rounded-lg" onClick={() => bulkPostpone(3)}>
              +3 dage
            </Button>
            <Button size="sm" variant="outline" className="h-7 text-[11px] gap-1 rounded-lg" onClick={() => bulkPostpone(7)}>
              +1 uge
            </Button>
            <Popover>
              <PopoverTrigger asChild>
                <Button size="sm" variant="outline" className="h-7 text-[11px] gap-1 rounded-lg">
                  <CalendarDays className="h-3 w-3" /> Vælg dato
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={undefined}
                  onSelect={date => { if (date) bulkSetDate(format(date, 'yyyy-MM-dd')); }}
                  initialFocus
                  className={cn('p-3 pointer-events-auto')}
                />
              </PopoverContent>
            </Popover>
            <span className="text-border">|</span>
            <Button size="sm" variant="outline" className="h-7 text-[11px] gap-1 rounded-lg text-emerald-600" onClick={bulkComplete}>
              <CheckCircle2 className="h-3 w-3" /> Færdig
            </Button>
            <Button size="sm" variant="outline" className="h-7 text-[11px] gap-1 rounded-lg text-red-400" onClick={bulkDelete}>
              <Trash2 className="h-3 w-3" /> Slet
            </Button>
            <span className="flex-1" />
            <Button size="sm" variant="ghost" className="h-7 text-[11px] rounded-lg" onClick={() => setSelectedIds(new Set())}>
              <X className="h-3 w-3" /> Fravælg alle
            </Button>
          </div>
        )}

        {/* Filters + view toggle */}
        <div className="flex items-center gap-3 justify-between">
          <div className="inline-flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Søg opgaver..." className="pl-9 h-8 text-xs w-44 rounded-lg" />
            </div>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as TaskStatus | 'all')} style={{ width: 'auto' }} className="h-8 text-xs rounded-lg border border-border bg-background px-2">
              <option value="all">Status</option>
              {STATUSES.map(s => <option key={s} value={s}>{STATUS_CFG[s].label}</option>)}
            </select>
            <select value={filterPriority} onChange={e => setFilterPriority(e.target.value as TaskPriority | 'all')} style={{ width: 'auto' }} className="h-8 text-xs rounded-lg border border-border bg-background px-2">
              <option value="all">Prioritet</option>
              {PRIORITIES.map(p => <option key={p} value={p}>{PRIORITY_CFG[p].label}</option>)}
            </select>
            <select value={filterLinked} onChange={e => setFilterLinked(e.target.value)} style={{ width: 'auto' }} className="h-8 text-xs rounded-lg border border-border bg-background px-2">
              <option value="all">Type</option>
              {LINKED_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            {hasFilters && (
              <button onClick={clearFilters} className="text-[11px] text-primary hover:underline flex items-center gap-1">
                <X className="h-3 w-3" />Nulstil
              </button>
            )}
          </div>
          <div className="flex items-center gap-1 bg-muted/30 rounded-lg p-0.5">
            <button onClick={() => setView('list')} className={cn('px-2.5 py-1 rounded-md text-xs font-medium transition-all', view === 'list' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground')}>
              <List className="h-3.5 w-3.5" />
            </button>
            <button onClick={() => setView('board')} className={cn('px-2.5 py-1 rounded-md text-xs font-medium transition-all', view === 'board' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground')}>
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Task list / board */}
        {loading ? (
          <div className="text-center py-16"><p className="text-xs text-muted-foreground">Indlæser opgaver...</p></div>
        ) : view === 'list' ? (
          <div className="rounded-xl border border-border/40 bg-card/60 overflow-hidden">
            {filtered.length === 0 ? (
              <div className="py-16 text-center">
                <CheckCircle2 className="h-10 w-10 text-emerald-400/30 mx-auto mb-3" />
                <p className="text-sm font-medium text-foreground">
                  {dateScope === 'today' ? '🎉 Ingen opgaver i dag — godt arbejde!' : 'Ingen opgaver fundet'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {dateScope === 'today' ? 'Du har ryddet din dags-liste' : 'Prøv at ændre filtre eller dato-visning'}
                </p>
              </div>
            ) : (
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border/20 text-muted-foreground">
                    <th className="text-left px-3 py-2.5 w-8">
                      <Checkbox
                        checked={selectedIds.size === filtered.length && filtered.length > 0}
                        onCheckedChange={selectAll}
                      />
                    </th>
                    <th className="text-left px-3 py-2.5 font-medium">Opgave</th>
                    <th className="text-left px-3 py-2.5 font-medium hidden sm:table-cell">Tilknyttet</th>
                    <th className="text-left px-3 py-2.5 font-medium">Status</th>
                    <th className="text-left px-3 py-2.5 font-medium hidden sm:table-cell">Prioritet</th>
                    <th className="text-left px-3 py-2.5 font-medium hidden md:table-cell">Forfald</th>
                    <th className="text-left px-3 py-2.5 font-medium hidden lg:table-cell">Tildelt</th>
                    <th className="w-8"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(t => {
                    const pc = PRIORITY_CFG[t.priority];
                    const sc = STATUS_CFG[t.status];
                    const overdue = t.due_date && isPast(new Date(t.due_date + 'T23:59:59')) && t.status !== 'done';
                    const isSelected = selectedIds.has(t.id);
                    return (
                      <tr
                        key={t.id}
                        className={cn(
                          'border-b border-border/10 hover:bg-muted/5 cursor-pointer transition-colors',
                          isSelected && 'bg-primary/5',
                        )}
                      >
                        <td className="px-3 py-2.5" onClick={e => e.stopPropagation()}>
                          <Checkbox checked={isSelected} onCheckedChange={checked => toggleSelect(t.id, !!checked)} />
                        </td>
                        <td className="px-3 py-2.5" onClick={() => setSelectedTask(t)}>
                          <p className={cn('font-medium text-foreground', t.status === 'done' && 'line-through text-muted-foreground')}>{t.title}</p>
                          {t.description && <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">{t.description}</p>}
                          {t.source === 'system' && <StatusChip label="System" variant="info" size="sm" className="mt-1" />}
                        </td>
                        <td className="px-3 py-2.5 hidden sm:table-cell" onClick={() => setSelectedTask(t)}>
                          {t.linked_name
                            ? <span className="text-muted-foreground flex items-center gap-1 truncate max-w-[140px]"><Link2 className="h-3 w-3 shrink-0" />{t.linked_name}</span>
                            : <span className="text-muted-foreground/30">—</span>}
                        </td>
                        <td className="px-3 py-2.5" onClick={() => setSelectedTask(t)}>
                          <StatusChip label={sc.label} variant={sc.variant} dot size="sm" />
                        </td>
                        <td className="px-3 py-2.5 hidden sm:table-cell" onClick={() => setSelectedTask(t)}>
                          <StatusChip label={pc.label} variant={pc.variant} size="sm" />
                        </td>
                        <td className="px-3 py-2.5 hidden md:table-cell" onClick={() => setSelectedTask(t)}>
                          {t.due_date
                            ? <span className={cn('text-xs', overdue ? 'text-red-400 font-medium' : isToday(new Date(t.due_date)) ? 'text-primary font-medium' : 'text-muted-foreground')}>
                              {format(new Date(t.due_date), 'd. MMM', { locale: da })}
                            </span>
                            : <span className="text-muted-foreground/30">—</span>}
                        </td>
                        <td className="px-3 py-2.5 hidden lg:table-cell text-muted-foreground truncate max-w-[100px]" onClick={() => setSelectedTask(t)}>
                          {t.assigned_name || '—'}
                        </td>
                        <td className="px-3 py-2.5" onClick={() => setSelectedTask(t)}>
                          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/30" />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {STATUSES.map(status => {
              const col = filtered.filter(t => t.status === status);
              const cfg = STATUS_CFG[status];
              return (
                <div key={status} className="rounded-xl border border-border/40 bg-card/60 overflow-hidden">
                  <div className="px-4 py-3 border-b border-border/30 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {React.createElement(cfg.icon, {
                        className: cn('h-3.5 w-3.5',
                          cfg.variant === 'success' ? 'text-emerald-400'
                          : cfg.variant === 'info' ? 'text-primary'
                          : cfg.variant === 'warning' ? 'text-amber-400'
                          : 'text-muted-foreground'),
                      })}
                      <span className="text-[11px] font-semibold text-foreground">{cfg.label}</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground bg-muted/30 px-1.5 py-0.5 rounded-full">{col.length}</span>
                  </div>
                  <div className="p-3 space-y-2 min-h-[120px]">
                    {col.length === 0 && <p className="text-[10px] text-muted-foreground/40 text-center py-4">Ingen opgaver</p>}
                    {col.map(t => (
                      <BoardCard
                        key={t.id}
                        task={t}
                        onClick={() => setSelectedTask(t)}
                        selected={selectedIds.has(t.id)}
                        onSelect={checked => toggleSelect(t.id, checked)}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <CreateTaskDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={fetchTasks}
      />
      <TaskDrawer
        task={selectedTask}
        onClose={() => setSelectedTask(null)}
        onRefresh={fetchTasks}
        onTaskUpdated={handleTaskUpdated}
      />
    </AdminLayout>
  );
}
