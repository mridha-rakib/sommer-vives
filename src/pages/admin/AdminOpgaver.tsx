import { useState, useEffect, useMemo } from 'react';
import React from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { StatusChip, type StatusVariant } from '@/components/admin/ui/StatusChip';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { format, isToday, isPast, startOfWeek, endOfWeek } from 'date-fns';
import { da } from 'date-fns/locale';
import {
  Plus, Search, ListChecks, LayoutGrid, List, X, CheckCircle2,
  Clock, Pause, Flag, CalendarDays, User, Link2,
  StickyNote, Trash2, ChevronRight, Zap, Tag, Briefcase
} from 'lucide-react';

type TaskStatus = 'not_started' | 'in_progress' | 'waiting' | 'done';
type TaskPriority = 'low' | 'normal' | 'high' | 'urgent';
type SectionTab = 'all' | 'personal' | 'case';

interface SystemTask {
  id: string; title: string; description: string | null; linked_type: string | null; linked_id: string | null; linked_name: string | null;
  assigned_to: string | null; assigned_name: string | null; priority: TaskPriority; status: TaskStatus; source: string;
  due_date: string | null; notes: string | null; created_by: string | null; completed_at: string | null; created_at: string; updated_at: string;
}

const STATUS_CFG: Record<TaskStatus, { label: string; variant: StatusVariant; icon: React.ElementType }> = {
  not_started: { label: 'Ikke startet', variant: 'muted', icon: Clock },
  in_progress: { label: 'I gang', variant: 'info', icon: Zap },
  waiting: { label: 'Afventer', variant: 'warning', icon: Pause },
  done: { label: 'Færdig', variant: 'success', icon: CheckCircle2 },
};
const PRIORITY_CFG: Record<TaskPriority, { label: string; variant: StatusVariant }> = {
  low: { label: 'Lav', variant: 'muted' }, normal: { label: 'Normal', variant: 'info' },
  high: { label: 'Høj', variant: 'warning' }, urgent: { label: 'Akut', variant: 'danger' },
};
const LINKED_TYPES = [
  { value: 'lead', label: 'Lead' }, { value: 'owner', label: 'Ejer' }, { value: 'guest', label: 'Gæst' },
  { value: 'listing', label: 'Sag / Listing' }, { value: 'document', label: 'Dokument' },
  { value: 'meeting', label: 'Møde' }, { value: 'booking', label: 'Booking' },
];
const STATUSES: TaskStatus[] = ['not_started', 'in_progress', 'waiting', 'done'];
const PRIORITIES: TaskPriority[] = ['low', 'normal', 'high', 'urgent'];

function SummaryCard({ label, value, icon: Icon, active, onClick }: { label: string; value: number; icon: React.ElementType; active?: boolean; onClick?: () => void }) {
  return (
    <button onClick={onClick} className={cn('rounded-xl border p-4 text-left transition-all hover:shadow-sm', active ? 'border-primary/30 bg-primary/5' : 'border-border/40 bg-card/60 hover:border-border/60')}>
      <div className="flex items-center justify-between mb-2">
        <Icon className={cn('h-4 w-4', active ? 'text-primary' : 'text-muted-foreground')} />
        <span className={cn('text-2xl font-bold', value > 0 ? 'text-foreground' : 'text-muted-foreground/40')}>{value}</span>
      </div>
      <p className="text-[11px] text-muted-foreground font-medium">{label}</p>
    </button>
  );
}

function CreateTaskDialog({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('normal');
  const [linkedType, setLinkedType] = useState('');
  const [linkedName, setLinkedName] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [assignedName, setAssignedName] = useState('');
  const [saving, setSaving] = useState(false);
  if (!open) return null;
  const handleSave = async () => {
    if (!title.trim()) { toast.error('Titel er påkrævet'); return; }
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from('system_tasks' as any).insert({
      title: title.trim(), description: description.trim() || null, priority,
      linked_type: linkedType || null, linked_name: linkedName.trim() || null,
      due_date: dueDate || null, assigned_name: assignedName.trim() || null,
      assigned_to: user?.id || null, created_by: user?.id || null, source: 'manual',
    });
    if (error) { toast.error('Kunne ikke oprette opgave'); setSaving(false); return; }
    toast.success('Opgave oprettet');
    setTitle(''); setDescription(''); setPriority('normal'); setLinkedType(''); setLinkedName(''); setDueDate(''); setAssignedName('');
    onCreated(); onClose(); setSaving(false);
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg mx-4 rounded-2xl border border-border/40 bg-card shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-border/30 flex items-center justify-between">
          <div className="flex items-center gap-2"><Plus className="h-4 w-4 text-primary" /><h2 className="text-sm font-semibold text-foreground">Ny opgave</h2></div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted/30"><X className="h-4 w-4 text-muted-foreground" /></button>
        </div>
        <div className="px-6 py-4 space-y-4">
          <div className="space-y-1.5"><Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Titel *</Label><Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Hvad skal gøres?" className="h-9 text-sm rounded-lg" /></div>
          <div className="space-y-1.5"><Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Beskrivelse</Label><Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Valgfri beskrivelse..." rows={2} className="text-sm rounded-lg resize-none" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Prioritet</Label><select value={priority} onChange={e => setPriority(e.target.value as TaskPriority)} className="w-full h-9 text-sm rounded-lg border border-border bg-background px-3">{PRIORITIES.map(p => <option key={p} value={p}>{PRIORITY_CFG[p].label}</option>)}</select></div>
            <div className="space-y-1.5"><Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Forfaldsdato</Label><Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="h-9 text-sm rounded-lg" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Tilknyt type</Label><select value={linkedType} onChange={e => setLinkedType(e.target.value)} className="w-full h-9 text-sm rounded-lg border border-border bg-background px-3"><option value="">Ingen</option>{LINKED_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}</select></div>
            <div className="space-y-1.5"><Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Tilknyt navn</Label><Input value={linkedName} onChange={e => setLinkedName(e.target.value)} placeholder="F.eks. navn på lead" className="h-9 text-sm rounded-lg" /></div>
          </div>
          <div className="space-y-1.5"><Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Tildelt til</Label><Input value={assignedName} onChange={e => setAssignedName(e.target.value)} placeholder="Navn" className="h-9 text-sm rounded-lg" /></div>
        </div>
        <div className="px-6 py-4 border-t border-border/30 flex justify-end gap-2">
          <Button variant="outline" size="sm" className="rounded-xl text-xs" onClick={onClose}>Annuller</Button>
          <Button size="sm" className="rounded-xl text-xs gap-1.5" onClick={handleSave} disabled={saving}><Plus className="h-3.5 w-3.5" />{saving ? 'Opretter...' : 'Opret opgave'}</Button>
        </div>
      </div>
    </div>
  );
}

function TaskDrawer({ task, onClose, onUpdated }: { task: SystemTask | null; onClose: () => void; onUpdated: () => void }) {
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  useEffect(() => { setNotes(task?.notes || ''); }, [task?.id]);
  if (!task) return null;
  const updateStatus = async (status: TaskStatus) => {
    await supabase.from('system_tasks' as any).update({ status, completed_at: status === 'done' ? new Date().toISOString() : null }).eq('id', task.id);
    toast.success(`Status: ${STATUS_CFG[status].label}`); onUpdated();
  };
  const saveNotes = async () => { setSaving(true); await supabase.from('system_tasks' as any).update({ notes }).eq('id', task.id); toast.success('Noter gemt'); setSaving(false); onUpdated(); };
  const deleteTask = async () => { await supabase.from('system_tasks' as any).delete().eq('id', task.id); toast.success('Opgave slettet'); onUpdated(); onClose(); };
  const pCfg = PRIORITY_CFG[task.priority]; const sCfg = STATUS_CFG[task.status];
  const isOverdue = task.due_date && isPast(new Date(task.due_date + 'T23:59:59')) && task.status !== 'done';
  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div className="w-full max-w-md bg-card border-l border-border/40 shadow-2xl h-full overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-border/30 flex items-center justify-between sticky top-0 bg-card z-10">
          <h2 className="text-sm font-semibold text-foreground truncate pr-4">{task.title}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted/30 shrink-0"><X className="h-4 w-4 text-muted-foreground" /></button>
        </div>
        <div className="px-6 py-5 space-y-5">
          <div className="flex items-center gap-2 flex-wrap">
            <StatusChip label={sCfg.label} variant={sCfg.variant} dot size="md" />
            <StatusChip label={pCfg.label} variant={pCfg.variant} size="md" />
            {task.source === 'system' && <StatusChip label="Systemgenereret" variant="info" size="sm" />}
            {isOverdue && <StatusChip label="Forfalden" variant="danger" dot size="sm" />}
          </div>
          {task.description && <div><p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Beskrivelse</p><p className="text-sm text-foreground leading-relaxed">{task.description}</p></div>}
          <div className="rounded-xl border border-border/30 bg-muted/10 p-4 space-y-2.5">
            {task.linked_type && <div className="flex items-center justify-between"><span className="text-xs text-muted-foreground flex items-center gap-1.5"><Link2 className="h-3 w-3" />Tilknyttet</span><span className="text-xs font-medium text-foreground">{LINKED_TYPES.find(t => t.value === task.linked_type)?.label}: {task.linked_name || '—'}</span></div>}
            <div className="flex items-center justify-between"><span className="text-xs text-muted-foreground flex items-center gap-1.5"><CalendarDays className="h-3 w-3" />Forfaldsdato</span><span className={cn('text-xs font-medium', isOverdue ? 'text-red-400' : 'text-foreground')}>{task.due_date ? format(new Date(task.due_date), 'd. MMM yyyy', { locale: da }) : '—'}</span></div>
            <div className="flex items-center justify-between"><span className="text-xs text-muted-foreground flex items-center gap-1.5"><User className="h-3 w-3" />Tildelt</span><span className="text-xs font-medium text-foreground">{task.assigned_name || '—'}</span></div>
            <div className="flex items-center justify-between"><span className="text-xs text-muted-foreground">Oprettet</span><span className="text-xs text-foreground">{format(new Date(task.created_at), "d. MMM yyyy HH:mm", { locale: da })}</span></div>
            {task.completed_at && <div className="flex items-center justify-between"><span className="text-xs text-muted-foreground">Færdiggjort</span><span className="text-xs text-emerald-400">{format(new Date(task.completed_at), "d. MMM yyyy HH:mm", { locale: da })}</span></div>}
          </div>
          <div><p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Skift status</p>
            <div className="flex flex-wrap gap-1.5">{STATUSES.map(s => <Button key={s} size="sm" variant={task.status === s ? 'default' : 'outline'} className="rounded-xl text-xs h-8 gap-1" onClick={() => updateStatus(s)} disabled={task.status === s}>{React.createElement(STATUS_CFG[s].icon, { className: 'h-3 w-3' })}{STATUS_CFG[s].label}</Button>)}</div>
          </div>
          <div><p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Noter</p>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Tilføj noter..." rows={3} className="text-sm rounded-lg resize-none mb-2" />
            <Button size="sm" variant="outline" className="rounded-xl text-xs gap-1" onClick={saveNotes} disabled={saving}><StickyNote className="h-3 w-3" />{saving ? 'Gemmer...' : 'Gem noter'}</Button>
          </div>
          <Button size="sm" variant="outline" className="rounded-xl text-xs gap-1 text-red-400 border-red-500/20 hover:bg-red-500/5 w-full" onClick={deleteTask}><Trash2 className="h-3 w-3" />Slet opgave</Button>
        </div>
      </div>
    </div>
  );
}

function BoardCard({ task, onClick }: { task: SystemTask; onClick: () => void }) {
  const pCfg = PRIORITY_CFG[task.priority];
  const isOverdue = task.due_date && isPast(new Date(task.due_date + 'T23:59:59')) && task.status !== 'done';
  return (
    <button onClick={onClick} className="w-full text-left rounded-xl border border-border/30 bg-card/80 p-3 hover:border-border/50 hover:shadow-sm transition-all">
      <p className="text-xs font-semibold text-foreground mb-1.5 line-clamp-2">{task.title}</p>
      <div className="flex items-center gap-1.5 flex-wrap">
        <StatusChip label={pCfg.label} variant={pCfg.variant} size="sm" />
        {task.source === 'system' && <StatusChip label="System" variant="info" size="sm" />}
        {isOverdue && <StatusChip label="Forfalden" variant="danger" size="sm" />}
      </div>
      {(task.due_date || task.linked_name) && <div className="mt-2 space-y-1">
        {task.due_date && <p className={cn('text-[10px] flex items-center gap-1', isOverdue ? 'text-red-400' : 'text-muted-foreground')}><CalendarDays className="h-2.5 w-2.5" />{format(new Date(task.due_date), 'd. MMM', { locale: da })}</p>}
        {task.linked_name && <p className="text-[10px] text-muted-foreground flex items-center gap-1 truncate"><Link2 className="h-2.5 w-2.5" />{task.linked_name}</p>}
      </div>}
    </button>
  );
}

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
  const [filterSpecial, setFilterSpecial] = useState<'all' | 'today' | 'overdue'>('all');
  const [section, setSection] = useState<SectionTab>('all');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => { supabase.auth.getUser().then(({ data }) => setCurrentUserId(data.user?.id || null)); }, []);

  const fetchTasks = async () => {
    const { data } = await supabase.from('system_tasks' as any).select('*').order('created_at', { ascending: false }).limit(500);
    setTasks((data as any as SystemTask[]) || []); setLoading(false);
  };
  useEffect(() => { fetchTasks(); }, []);

  const now = new Date();
  const wStart = startOfWeek(now, { weekStartsOn: 1 });
  const wEnd = endOfWeek(now, { weekStartsOn: 1 });

  const counts = useMemo(() => ({
    active: tasks.filter(t => t.status !== 'done').length,
    dueToday: tasks.filter(t => t.due_date && isToday(new Date(t.due_date)) && t.status !== 'done').length,
    highPrio: tasks.filter(t => (t.priority === 'high' || t.priority === 'urgent') && t.status !== 'done').length,
    waiting: tasks.filter(t => t.status === 'waiting').length,
    doneThisWeek: tasks.filter(t => t.completed_at && new Date(t.completed_at) >= wStart && new Date(t.completed_at) <= wEnd).length,
  }), [tasks]);

  const sectionTasks = useMemo(() => {
    if (section === 'personal') return tasks.filter(t => !t.linked_id && t.created_by === currentUserId);
    if (section === 'case') return tasks.filter(t => !!t.linked_id);
    return tasks;
  }, [tasks, section, currentUserId]);

  const filtered = useMemo(() => sectionTasks.filter(t => {
    if (filterStatus !== 'all' && t.status !== filterStatus) return false;
    if (filterPriority !== 'all' && t.priority !== filterPriority) return false;
    if (filterLinked !== 'all' && t.linked_type !== filterLinked) return false;
    if (filterSpecial === 'today' && !(t.due_date && isToday(new Date(t.due_date)))) return false;
    if (filterSpecial === 'overdue' && !(t.due_date && isPast(new Date(t.due_date + 'T23:59:59')) && t.status !== 'done')) return false;
    if (search && !t.title.toLowerCase().includes(search.toLowerCase()) && !(t.linked_name || '').toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [sectionTasks, filterStatus, filterPriority, filterLinked, filterSpecial, search]);

  const clearFilters = () => { setFilterStatus('all'); setFilterPriority('all'); setFilterLinked('all'); setFilterSpecial('all'); setSearch(''); };
  const hasFilters = filterStatus !== 'all' || filterPriority !== 'all' || filterLinked !== 'all' || filterSpecial !== 'all' || !!search;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div><h1 className="text-xl font-bold text-foreground">Alle opgaver</h1><p className="text-sm text-muted-foreground mt-0.5">Alt der skal gøres — ét samlet overblik</p></div>
          <Button size="sm" className="rounded-xl gap-1.5" onClick={() => setCreateOpen(true)}><Plus className="h-3.5 w-3.5" />Ny opgave</Button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <SummaryCard label="Alle aktive" value={counts.active} icon={ListChecks} active={!hasFilters} onClick={clearFilters} />
          <SummaryCard label="Forfalder i dag" value={counts.dueToday} icon={CalendarDays} active={filterSpecial === 'today'} onClick={() => { clearFilters(); setFilterSpecial('today'); }} />
          <SummaryCard label="Høj prioritet" value={counts.highPrio} icon={Flag} active={filterPriority === 'high' || filterPriority === 'urgent'} onClick={() => { clearFilters(); setFilterPriority('high'); }} />
          <SummaryCard label="Afventer" value={counts.waiting} icon={Pause} active={filterStatus === 'waiting'} onClick={() => { clearFilters(); setFilterStatus('waiting'); }} />
          <SummaryCard label="Færdige i uge" value={counts.doneThisWeek} icon={CheckCircle2} active={filterStatus === 'done'} onClick={() => { clearFilters(); setFilterStatus('done'); }} />
        </div>

        <div className="flex items-center gap-3 justify-between">
          <div className="inline-flex items-center gap-2">
            <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" /><Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Søg opgaver..." className="pl-9 h-8 text-xs w-44 rounded-lg" /></div>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as any)} style={{ width: 'auto' }} className="h-8 text-xs rounded-lg border border-border bg-background px-2"><option value="all">Status</option>{STATUSES.map(s => <option key={s} value={s}>{STATUS_CFG[s].label}</option>)}</select>
            <select value={filterPriority} onChange={e => setFilterPriority(e.target.value as any)} style={{ width: 'auto' }} className="h-8 text-xs rounded-lg border border-border bg-background px-2"><option value="all">Prioritet</option>{PRIORITIES.map(p => <option key={p} value={p}>{PRIORITY_CFG[p].label}</option>)}</select>
            <select value={filterLinked} onChange={e => setFilterLinked(e.target.value)} style={{ width: 'auto' }} className="h-8 text-xs rounded-lg border border-border bg-background px-2"><option value="all">Type</option>{LINKED_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}</select>
            <select value={filterSpecial} onChange={e => setFilterSpecial(e.target.value as any)} style={{ width: 'auto' }} className="h-8 text-xs rounded-lg border border-border bg-background px-2"><option value="all">Dato</option><option value="today">I dag</option><option value="overdue">Forfaldne</option></select>
            {hasFilters && <button onClick={clearFilters} className="text-[11px] text-primary hover:underline flex items-center gap-1"><X className="h-3 w-3" />Nulstil</button>}
          </div>
          <div className="flex items-center gap-1 bg-muted/30 rounded-lg p-0.5">
            <button onClick={() => setView('list')} className={cn('px-2.5 py-1 rounded-md text-xs font-medium transition-all', view === 'list' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground')}><List className="h-3.5 w-3.5" /></button>
            <button onClick={() => setView('board')} className={cn('px-2.5 py-1 rounded-md text-xs font-medium transition-all', view === 'board' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground')}><LayoutGrid className="h-3.5 w-3.5" /></button>
          </div>
        </div>

        {loading ? <div className="text-center py-16"><p className="text-xs text-muted-foreground">Indlæser opgaver...</p></div>
        : view === 'list' ? (
          <div className="rounded-xl border border-border/40 bg-card/60 overflow-hidden">
            {filtered.length === 0 ? <div className="py-16 text-center"><ListChecks className="h-8 w-8 text-muted-foreground/20 mx-auto mb-3" /><p className="text-sm text-muted-foreground">Ingen opgaver fundet</p></div>
            : <table className="w-full text-xs"><thead><tr className="border-b border-border/20 text-muted-foreground"><th className="text-left px-4 py-2.5 font-medium">Opgave</th><th className="text-left px-4 py-2.5 font-medium hidden sm:table-cell">Tilknyttet</th><th className="text-left px-4 py-2.5 font-medium">Status</th><th className="text-left px-4 py-2.5 font-medium hidden sm:table-cell">Prioritet</th><th className="text-left px-4 py-2.5 font-medium hidden md:table-cell">Forfald</th><th className="text-left px-4 py-2.5 font-medium hidden lg:table-cell">Tildelt</th><th className="w-8"></th></tr></thead>
              <tbody>{filtered.map(t => {
                const pc = PRIORITY_CFG[t.priority]; const sc = STATUS_CFG[t.status];
                const overdue = t.due_date && isPast(new Date(t.due_date + 'T23:59:59')) && t.status !== 'done';
                return (
                  <tr key={t.id} onClick={() => setSelectedTask(t)} className="border-b border-border/10 hover:bg-muted/5 cursor-pointer transition-colors">
                    <td className="px-4 py-2.5"><p className={cn('font-medium text-foreground', t.status === 'done' && 'line-through text-muted-foreground')}>{t.title}</p>{t.description && <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">{t.description}</p>}{t.source === 'system' && <StatusChip label="System" variant="info" size="sm" className="mt-1" />}</td>
                    <td className="px-4 py-2.5 hidden sm:table-cell">{t.linked_name ? <span className="text-muted-foreground flex items-center gap-1 truncate max-w-[140px]"><Link2 className="h-3 w-3 shrink-0" />{t.linked_name}</span> : <span className="text-muted-foreground/30">—</span>}</td>
                    <td className="px-4 py-2.5"><StatusChip label={sc.label} variant={sc.variant} dot size="sm" /></td>
                    <td className="px-4 py-2.5 hidden sm:table-cell"><StatusChip label={pc.label} variant={pc.variant} size="sm" /></td>
                    <td className="px-4 py-2.5 hidden md:table-cell">{t.due_date ? <span className={cn('text-xs', overdue ? 'text-red-400 font-medium' : 'text-muted-foreground')}>{format(new Date(t.due_date), 'd. MMM', { locale: da })}</span> : <span className="text-muted-foreground/30">—</span>}</td>
                    <td className="px-4 py-2.5 hidden lg:table-cell text-muted-foreground truncate max-w-[100px]">{t.assigned_name || '—'}</td>
                    <td className="px-4 py-2.5"><ChevronRight className="h-3.5 w-3.5 text-muted-foreground/30" /></td>
                  </tr>);
              })}</tbody></table>}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {STATUSES.map(status => {
              const col = filtered.filter(t => t.status === status); const cfg = STATUS_CFG[status];
              return (
                <div key={status} className="rounded-xl border border-border/40 bg-card/60 overflow-hidden">
                  <div className="px-4 py-3 border-b border-border/30 flex items-center justify-between">
                    <div className="flex items-center gap-2">{React.createElement(cfg.icon, { className: cn('h-3.5 w-3.5', cfg.variant === 'success' ? 'text-emerald-400' : cfg.variant === 'info' ? 'text-primary' : cfg.variant === 'warning' ? 'text-amber-400' : 'text-muted-foreground') })}<span className="text-[11px] font-semibold text-foreground">{cfg.label}</span></div>
                    <span className="text-[10px] text-muted-foreground bg-muted/30 px-1.5 py-0.5 rounded-full">{col.length}</span>
                  </div>
                  <div className="p-3 space-y-2 min-h-[120px]">{col.length === 0 && <p className="text-[10px] text-muted-foreground/40 text-center py-4">Ingen opgaver</p>}{col.map(t => <BoardCard key={t.id} task={t} onClick={() => setSelectedTask(t)} />)}</div>
                </div>);
            })}
          </div>
        )}
      </div>
      <CreateTaskDialog open={createOpen} onClose={() => setCreateOpen(false)} onCreated={fetchTasks} />
      <TaskDrawer task={selectedTask} onClose={() => setSelectedTask(null)} onUpdated={() => { fetchTasks(); setSelectedTask(null); }} />
    </AdminLayout>
  );
}
