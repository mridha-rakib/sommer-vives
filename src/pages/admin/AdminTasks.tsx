import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
  CheckCircle2, AlertTriangle, ChevronDown, ChevronRight,
  ListChecks, Search, Filter, Clock, Home
} from 'lucide-react';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

type TaskStatus = 'not_started' | 'in_progress' | 'waiting' | 'done';

export default function AdminTasks() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | TaskStatus>('all');
  const [search, setSearch] = useState('');
  const [collapsedSager, setCollapsedSager] = useState<Set<string>>(new Set());
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('system_tasks')
        .select('*')
        .order('due_date', { ascending: true });
      setTasks(data || []);
      setLoading(false);
    };
    load();
  }, []);

  const filtered = useMemo(() => {
    let result = tasks;
    if (filter !== 'all') result = result.filter(t => t.status === filter);
    if (search) result = result.filter(t =>
      t.title?.toLowerCase().includes(search.toLowerCase()) ||
      t.linked_name?.toLowerCase().includes(search.toLowerCase())
    );
    return result;
  }, [tasks, filter, search]);

  // Group by sag (linked_id)
  const grouped = useMemo(() => {
    const map = new Map<string, { name: string; id: string; tasks: any[] }>();
    filtered.forEach(t => {
      const key = t.linked_id || 'unlinked';
      if (!map.has(key)) {
        map.set(key, { name: t.linked_name || 'Uden sag', id: key, tasks: [] });
      }
      map.get(key)!.tasks.push(t);
    });
    return Array.from(map.values());
  }, [filtered]);

  const toggleCollapse = (id: string) => {
    setCollapsedSager(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleTask = async (task: any) => {
    const newStatus: TaskStatus = task.status === 'done' ? 'not_started' : 'done';
    await supabase.from('system_tasks').update({
      status: newStatus,
      completed_at: newStatus === 'done' ? new Date().toISOString() : null,
    } as any).eq('id', task.id);
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: newStatus, completed_at: newStatus === 'done' ? new Date().toISOString() : null } : t));
  };

  const updateStatus = async (task: any, newStatus: string) => {
    await supabase.from('system_tasks').update({ status: newStatus } as any).eq('id', task.id);
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: newStatus } : t));
  };

  const stats = {
    total: tasks.length,
    not_started: tasks.filter(t => t.status === 'not_started').length,
    in_progress: tasks.filter(t => t.status === 'in_progress').length,
    waiting: tasks.filter(t => t.status === 'waiting').length,
    done: tasks.filter(t => t.status === 'done').length,
    overdue: tasks.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'done').length,
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Opgaver</h1>
          <p className="text-sm text-muted-foreground">Alle sagsopgaver samlet</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-6 gap-3">
          {[
            { label: 'Total', value: stats.total, color: 'text-foreground' },
            { label: 'Ikke startet', value: stats.not_started, color: 'text-muted-foreground' },
            { label: 'I gang', value: stats.in_progress, color: 'text-blue-500' },
            { label: 'Afventer', value: stats.waiting, color: 'text-amber-500' },
            { label: 'Færdig', value: stats.done, color: 'text-emerald-500' },
            { label: 'Overskredet', value: stats.overdue, color: 'text-red-500' },
          ].map(s => (
            <div key={s.label} className="rounded-xl border border-border/40 bg-card/60 p-3 text-center">
              <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-[10px] text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex gap-3 items-center">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Søg i opgaver..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 h-9 text-sm"
            />
          </div>
          <div className="flex gap-1.5">
            {(['all', 'not_started', 'in_progress', 'waiting', 'done'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                  filter === f ? 'bg-primary text-primary-foreground' : 'bg-muted/20 text-muted-foreground hover:bg-muted/40'
                )}
              >
                {f === 'all' ? 'Alle' : f === 'not_started' ? 'Ikke startet' : f === 'in_progress' ? 'I gang' : f === 'waiting' ? 'Afventer' : 'Færdig'}
              </button>
            ))}
          </div>
        </div>

        {/* Grouped task list */}
        <div className="space-y-4">
          {loading && <p className="text-sm text-muted-foreground text-center py-12">Indlæser opgaver...</p>}
          {!loading && grouped.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-12">Ingen opgaver matcher filteret</p>
          )}
          {grouped.map(group => {
            const isCollapsed = collapsedSager.has(group.id);
            const groupDone = group.tasks.filter(t => t.status === 'done').length;
            const groupTotal = group.tasks.length;
            const groupOverdue = group.tasks.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'done').length;

            return (
              <div key={group.id} className="rounded-xl border border-border/40 bg-card/60 overflow-hidden">
                {/* Group header */}
                <button
                  onClick={() => toggleCollapse(group.id)}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-muted/20 hover:bg-muted/30 transition-colors text-left"
                >
                  {isCollapsed ? <ChevronRight className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                  <Home className="h-3.5 w-3.5 text-primary" />
                  <span className="text-sm font-semibold text-foreground flex-1">{group.name}</span>
                  <div className="flex items-center gap-3">
                    {groupOverdue > 0 && (
                      <span className="flex items-center gap-1 text-[10px] text-red-500 font-medium">
                        <AlertTriangle className="h-3 w-3" /> {groupOverdue} overskredet
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground">{groupDone}/{groupTotal} færdige</span>
                    {/* Progress bar */}
                    <div className="w-20 h-1.5 rounded-full bg-muted/30 overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${groupTotal > 0 ? (groupDone / groupTotal) * 100 : 0}%` }} />
                    </div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); navigate(`/admin/sager/${group.id}`); }}
                    className="text-[10px] text-primary hover:underline ml-2"
                  >
                    Åbn sag
                  </button>
                </button>

                {/* Tasks */}
                {!isCollapsed && (
                  <div className="divide-y divide-border/20">
                    {group.tasks.map(t => {
                      const isDone = t.status === 'done';
                      const isOverdue = t.due_date && new Date(t.due_date) < new Date() && !isDone;
                      const priorityColor = t.priority === 'urgent' ? 'border-l-red-500' : t.priority === 'high' ? 'border-l-amber-500' : t.priority === 'normal' ? 'border-l-blue-400' : 'border-l-transparent';

                      return (
                        <div key={t.id} className={cn(
                          'px-4 py-2.5 flex items-center gap-3 hover:bg-muted/10 transition-colors border-l-[3px]',
                          priorityColor,
                          isDone && 'opacity-50',
                          isOverdue && 'bg-red-500/5'
                        )}>
                          <button
                            onClick={() => toggleTask(t)}
                            className={cn(
                              'w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all',
                              isDone ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-muted-foreground/30 hover:border-primary'
                            )}
                          >
                            {isDone && <CheckCircle2 className="h-3 w-3" />}
                          </button>
                          <div className="flex-1 min-w-0">
                            <p className={cn('text-sm', isDone ? 'line-through text-muted-foreground' : 'text-foreground')}>{t.title}</p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {isOverdue && <AlertTriangle className="h-3 w-3 text-red-500" />}
                            {t.due_date && (
                              <span className={cn('text-[10px]', isOverdue ? 'text-red-500 font-medium' : 'text-muted-foreground')}>
                                {format(new Date(t.due_date), 'd. MMM', { locale: da })}
                              </span>
                            )}
                            {t.assigned_name && (
                              <span className="text-[10px] bg-muted/30 rounded-full px-2 py-0.5 text-muted-foreground">
                                {t.assigned_name?.split(' ').map((n: string) => n[0]).join('')}
                              </span>
                            )}
                            {!isDone && (
                              <select
                                value={t.status}
                                onChange={(e) => updateStatus(t, e.target.value)}
                                className="text-[10px] bg-muted/20 border-none rounded px-1 py-0.5 text-muted-foreground appearance-auto"
                              >
                                <option value="not_started">Ikke startet</option>
                                <option value="in_progress">I gang</option>
                                <option value="waiting">Afventer</option>
                                <option value="done">Færdig</option>
                              </select>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </AdminLayout>
  );
}
