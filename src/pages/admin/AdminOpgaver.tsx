import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ListChecks, Search, Plus, Clock, Play, Pause, CheckCircle2, Link2 } from 'lucide-react';

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending: { label: 'Ikke startet', color: 'bg-muted text-muted-foreground' },
  in_progress: { label: 'I gang', color: 'bg-blue-100 text-blue-700' },
  waiting: { label: 'Afventer', color: 'bg-amber-100 text-amber-700' },
  completed: { label: 'Færdig', color: 'bg-emerald-100 text-emerald-700' },
};

export default function AdminOpgaver() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('all');

  useEffect(() => {
    supabase.from('tasks').select('*, property:properties(title, case_number)')
      .order('scheduled_date', { ascending: true })
      .limit(100)
      .then(({ data }) => { setTasks(data || []); setLoading(false); });
  }, []);

  const filtered = tasks.filter(t => {
    if (tab !== 'all' && t.status !== tab) return false;
    if (search && !t.task_type?.toLowerCase().includes(search.toLowerCase()) && !t.notes?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Opgaver</h1>
            <p className="text-sm text-muted-foreground">Opgaver knyttet til leads, ejere, gæster, sager og dokumenter</p>
          </div>
          <Button size="sm" className="gap-1.5"><Plus className="h-3.5 w-3.5" /> Ny opgave</Button>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Søg i opgaver..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="all" className="text-xs">Alle</TabsTrigger>
            <TabsTrigger value="pending" className="text-xs gap-1"><Clock className="h-3 w-3" /> Ikke startet</TabsTrigger>
            <TabsTrigger value="in_progress" className="text-xs gap-1"><Play className="h-3 w-3" /> I gang</TabsTrigger>
            <TabsTrigger value="waiting" className="text-xs gap-1"><Pause className="h-3 w-3" /> Afventer</TabsTrigger>
            <TabsTrigger value="completed" className="text-xs gap-1"><CheckCircle2 className="h-3 w-3" /> Færdig</TabsTrigger>
          </TabsList>

          <TabsContent value={tab} className="mt-4">
            {loading ? (
              <div className="space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
            ) : filtered.length === 0 ? (
              <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">Ingen opgaver fundet</CardContent></Card>
            ) : (
              <div className="space-y-2">
                {filtered.map(t => {
                  const st = STATUS_MAP[t.status] || STATUS_MAP.pending;
                  return (
                    <Card key={t.id} className="hover:bg-muted/20 transition-colors">
                      <CardContent className="py-3 px-4 flex items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground">{t.task_type}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {t.property && (
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Link2 className="h-3 w-3" /> {(t.property as any)?.title}
                              </span>
                            )}
                            <span className="text-xs text-muted-foreground">{t.scheduled_date}</span>
                          </div>
                        </div>
                        <Badge className={`text-[10px] border-0 ${st.color}`}>{st.label}</Badge>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
