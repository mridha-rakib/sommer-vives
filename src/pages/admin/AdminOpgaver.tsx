import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { AdminPageHeader } from '@/components/admin/ui/AdminPageHeader';
import { StatusChip } from '@/components/admin/ui/StatusChip';
import { EmptyState } from '@/components/admin/ui/EmptyState';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { ListChecks, Search, Plus, Clock, Play, Pause, CheckCircle2, Link2 } from 'lucide-react';

type TabVariant = 'muted' | 'info' | 'warning' | 'success';
const STATUS_MAP: Record<string, { label: string; variant: TabVariant }> = {
  pending: { label: 'Ikke startet', variant: 'muted' },
  in_progress: { label: 'I gang', variant: 'info' },
  waiting: { label: 'Afventer', variant: 'warning' },
  completed: { label: 'Færdig', variant: 'success' },
};

const STATUS_ICONS: Record<string, React.ElementType> = {
  pending: Clock, in_progress: Play, waiting: Pause, completed: CheckCircle2,
};

export default function AdminOpgaver() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('all');

  useEffect(() => {
    supabase.from('tasks').select('*, property:properties(title, case_number)')
      .order('scheduled_date', { ascending: true }).limit(100)
      .then(({ data }) => { setTasks(data || []); setLoading(false); });
  }, []);

  const filtered = tasks.filter(t => {
    if (tab !== 'all' && t.status !== tab) return false;
    if (search && !t.task_type?.toLowerCase().includes(search.toLowerCase()) && !t.notes?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const tabs = [
    { key: 'all', label: 'Alle', count: tasks.length },
    ...Object.entries(STATUS_MAP).map(([k, v]) => ({ key: k, label: v.label, count: tasks.filter(t => t.status === k).length })),
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <AdminPageHeader
          title="Opgaver"
          subtitle="Opgaver tilknyttet leads, ejere, gæster og sager"
          actions={<Button size="sm" className="gap-1.5 rounded-xl"><Plus className="h-3.5 w-3.5" /> Ny opgave</Button>}
        />

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Søg i opgaver..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 rounded-xl bg-card/60 border-border/40" />
          </div>
          <div className="flex gap-1.5">
            {tabs.map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  tab === t.key
                    ? 'bg-primary/10 text-primary border border-primary/20'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/30 border border-transparent'
                }`}
              >
                {t.label} <span className="text-muted-foreground/60 ml-0.5">{t.count}</span>
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>
        ) : filtered.length === 0 ? (
          <Card className="border-border/40 bg-card/60">
            <CardContent className="p-0">
              <EmptyState icon={ListChecks} title="Ingen opgaver fundet" description="Tilpas filtrene eller opret en ny opgave" />
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {filtered.map(t => {
              const st = STATUS_MAP[t.status] || STATUS_MAP.pending;
              return (
                <Card key={t.id} className="border-border/40 bg-card/60 hover:bg-card/80 transition-all cursor-pointer">
                  <CardContent className="py-3.5 px-5 flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{t.task_type}</p>
                      <div className="flex items-center gap-3 mt-1">
                        {t.property && (
                          <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                            <Link2 className="h-3 w-3" /> {(t.property as any)?.title}
                          </span>
                        )}
                        {t.scheduled_date && <span className="text-[11px] text-muted-foreground">{t.scheduled_date}</span>}
                      </div>
                    </div>
                    <StatusChip label={st.label} variant={st.variant} dot />
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
