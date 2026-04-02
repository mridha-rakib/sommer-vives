import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Archive, Target } from 'lucide-react';

export default function AdminCrmArkiv() {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    supabase.from('leads').select('*')
      .in('status', ['won', 'lost', 'converted', 'archived'])
      .order('updated_at', { ascending: false })
      .limit(100)
      .then(({ data }) => { setLeads(data || []); setLoading(false); });
  }, []);

  const filtered = leads.filter(l => !search || l.name?.toLowerCase().includes(search.toLowerCase()) || l.email?.toLowerCase().includes(search.toLowerCase()));

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Arkiv</h1>
          <p className="text-sm text-muted-foreground">Behandlede og arkiverede leads</p>
        </div>
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Søg i arkiv..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        {loading ? (
          <div className="space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
        ) : filtered.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-sm text-muted-foreground"><Archive className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />Ingen arkiverede leads</CardContent></Card>
        ) : (
          <div className="space-y-2">
            {filtered.map(l => (
              <Card key={l.id} className="hover:bg-muted/20 transition-colors">
                <CardContent className="py-3 px-4 flex items-center gap-3">
                  <Target className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{l.name}</p>
                    <p className="text-xs text-muted-foreground">{l.email} · {l.source}</p>
                  </div>
                  <Badge variant="secondary" className="text-[10px]">{l.status === 'won' ? 'Vundet' : l.status === 'lost' ? 'Tabt' : 'Arkiveret'}</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
