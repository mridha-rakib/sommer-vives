import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { AdminPageHeader } from '@/components/admin/ui/AdminPageHeader';
import { StatusChip } from '@/components/admin/ui/StatusChip';
import { EmptyState } from '@/components/admin/ui/EmptyState';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Archive, Target, MapPin } from 'lucide-react';

export default function AdminCrmArkiv() {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('all');

  useEffect(() => {
    supabase.from('leads').select('*')
      .in('status', ['won', 'lost', 'converted', 'archived'])
      .order('updated_at', { ascending: false })
      .limit(200)
      .then(({ data }) => { setLeads(data || []); setLoading(false); });
  }, []);

  const filtered = leads.filter(l => {
    if (tab === 'won' && l.status !== 'won' && l.status !== 'converted') return false;
    if (tab === 'lost' && l.status !== 'lost') return false;
    if (search && !l.name?.toLowerCase().includes(search.toLowerCase()) && !l.email?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const wonCount = leads.filter(l => l.status === 'won' || l.status === 'converted').length;
  const lostCount = leads.filter(l => l.status === 'lost').length;

  const tabs = [
    { key: 'all', label: 'Alle', count: leads.length },
    { key: 'won', label: 'Vundet', count: wonCount },
    { key: 'lost', label: 'Tabt', count: lostCount },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <AdminPageHeader title="Arkiv" subtitle="Behandlede og arkiverede leads" />

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Søg i arkiv..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 rounded-xl bg-card/60 border-border/40" />
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
              <EmptyState icon={Archive} title="Ingen arkiverede leads" description="Vundne og tabte leads vises her" />
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {filtered.map(l => (
              <Card key={l.id} className="border-border/40 bg-card/60 hover:bg-card/80 transition-all">
                <CardContent className="py-3.5 px-5 flex items-center gap-4">
                  <div className="w-9 h-9 rounded-xl bg-muted/30 flex items-center justify-center shrink-0">
                    <Target className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{l.name}</p>
                    <div className="flex items-center gap-3 mt-0.5">
                      {l.email && <span className="text-[11px] text-muted-foreground">{l.email}</span>}
                      {l.region && <span className="text-[11px] text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" />{l.region}</span>}
                    </div>
                  </div>
                  <span className="text-[11px] text-muted-foreground shrink-0">
                    {format(new Date(l.updated_at), 'd. MMM yyyy', { locale: da })}
                  </span>
                  <StatusChip
                    label={l.status === 'won' || l.status === 'converted' ? 'Vundet' : 'Tabt'}
                    variant={l.status === 'won' || l.status === 'converted' ? 'success' : 'danger'}
                    dot
                  />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
