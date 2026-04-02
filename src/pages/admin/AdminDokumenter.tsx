import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { AdminPageHeader } from '@/components/admin/ui/AdminPageHeader';
import { StatusChip } from '@/components/admin/ui/StatusChip';
import { EmptyState } from '@/components/admin/ui/EmptyState';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText, Search, Download, Eye, FolderOpen } from 'lucide-react';

export default function AdminDokumenter() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('all');

  useEffect(() => {
    supabase.from('documents').select('*').order('created_at', { ascending: false }).limit(200)
      .then(({ data }) => { setDocuments(data || []); setLoading(false); });
  }, []);

  const filtered = documents.filter(d => {
    if (tab !== 'all' && d.document_type !== tab) return false;
    if (search && !d.title?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const types = [...new Set(documents.map(d => d.document_type))];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <AdminPageHeader title="Dokumenter" subtitle="Alle dokumenter tilknyttet sager, ejere, gæster og leads" />

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Søg i dokumenter..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 rounded-xl bg-card/60 border-border/40" />
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button onClick={() => setTab('all')} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${tab === 'all' ? 'bg-primary/10 text-primary border border-primary/20' : 'text-muted-foreground hover:text-foreground hover:bg-muted/30 border border-transparent'}`}>Alle</button>
            {types.map(t => (
              <button key={t} onClick={() => setTab(t)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize ${tab === t ? 'bg-primary/10 text-primary border border-primary/20' : 'text-muted-foreground hover:text-foreground hover:bg-muted/30 border border-transparent'}`}>{t}</button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}</div>
        ) : filtered.length === 0 ? (
          <Card className="border-border/40 bg-card/60">
            <CardContent className="p-0">
              <EmptyState icon={FolderOpen} title="Ingen dokumenter fundet" description="Tilpas dine filtre eller upload et dokument" />
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {filtered.map(d => (
              <Card key={d.id} className="border-border/40 bg-card/60 hover:bg-card/80 transition-all">
                <CardContent className="py-3.5 px-5 flex items-center gap-4">
                  <div className="w-9 h-9 rounded-xl bg-muted/40 flex items-center justify-center shrink-0">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{d.title}</p>
                    <p className="text-[11px] text-muted-foreground">{d.document_type} · {new Date(d.created_at).toLocaleDateString('da-DK')}</p>
                  </div>
                  <StatusChip label={d.status} variant="muted" />
                  {d.file_url && (
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg" asChild>
                        <a href={d.file_url} target="_blank" rel="noreferrer"><Eye className="h-3.5 w-3.5" /></a>
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg" asChild>
                        <a href={d.file_url} download><Download className="h-3.5 w-3.5" /></a>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
