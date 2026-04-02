import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { FileText, Search, Download, Eye, FolderOpen } from 'lucide-react';

export default function AdminDokumenter() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('all');

  useEffect(() => {
    supabase.from('documents').select('*')
      .order('created_at', { ascending: false })
      .limit(200)
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
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dokumenter</h1>
          <p className="text-sm text-muted-foreground">Alle dokumenter tilknyttet sager, ejere, gæster og leads</p>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Søg i dokumenter..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="flex-wrap">
            <TabsTrigger value="all" className="text-xs">Alle</TabsTrigger>
            {types.map(t => (
              <TabsTrigger key={t} value={t} className="text-xs capitalize">{t}</TabsTrigger>
            ))}
          </TabsList>
          <TabsContent value={tab} className="mt-4">
            {loading ? (
              <div className="space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
            ) : filtered.length === 0 ? (
              <Card><CardContent className="py-12 text-center text-sm text-muted-foreground"><FolderOpen className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />Ingen dokumenter fundet</CardContent></Card>
            ) : (
              <div className="space-y-2">
                {filtered.map(d => (
                  <Card key={d.id} className="hover:bg-muted/20 transition-colors">
                    <CardContent className="py-3 px-4 flex items-center gap-3">
                      <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">{d.title}</p>
                        <p className="text-xs text-muted-foreground">{d.document_type} · {new Date(d.created_at).toLocaleDateString('da-DK')} · {d.mime_type || 'Ukendt'}</p>
                      </div>
                      <Badge variant="secondary" className="text-[10px]">{d.status}</Badge>
                      <div className="flex gap-1">
                        {d.file_url && (
                          <>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" asChild>
                              <a href={d.file_url} target="_blank" rel="noreferrer"><Eye className="h-3.5 w-3.5" /></a>
                            </Button>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" asChild>
                              <a href={d.file_url} download><Download className="h-3.5 w-3.5" /></a>
                            </Button>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
