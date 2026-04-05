import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { OwnerLayout } from '@/components/layout/OwnerLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, FileSignature, Receipt, Download, FolderOpen } from 'lucide-react';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';

const statusBadge = (status: string) => {
  const map: Record<string, { label: string; className: string }> = {
    signed: { label: 'Signeret', className: 'bg-emerald-400/15 text-emerald-400 border-emerald-400/20' },
    draft: { label: 'Kladde', className: 'bg-amber-400/15 text-amber-400 border-amber-400/20' },
    active: { label: 'Aktiv', className: 'bg-emerald-400/15 text-emerald-400 border-emerald-400/20' },
    paid: { label: 'Betalt', className: 'bg-emerald-400/15 text-emerald-400 border-emerald-400/20' },
    issued: { label: 'Udstedt', className: 'bg-blue-400/15 text-blue-400 border-blue-400/20' },
    generated: { label: 'Genereret', className: 'bg-blue-400/15 text-blue-400 border-blue-400/20' },
    sent: { label: 'Sendt', className: 'bg-blue-400/15 text-blue-400 border-blue-400/20' },
  };
  const s = map[status] || { label: status, className: '' };
  return <Badge variant="outline" className={`text-[10px] ${s.className}`}>{s.label}</Badge>;
};

export default function OwnerDocuments() {
  const { user } = useAuth();
  const [agreements, setAgreements] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'all' | 'agreements'>('all');

  useEffect(() => {
    if (user) loadDocs();
  }, [user]);

  const loadDocs = async () => {
    if (!user) return;
    const [agrRes, docRes] = await Promise.all([
      supabase.from('agreements').select('*').eq('owner_id', user.id).order('created_at', { ascending: false }),
      supabase.from('documents').select('*').eq('owner_id', user.id).order('created_at', { ascending: false }),
    ]);
    setAgreements(agrRes.data || []);
    setDocuments(docRes.data || []);
    setLoading(false);
  };

  const allDocs = [
    ...agreements.map(a => ({ type: 'agreement' as const, id: a.id, title: `Formidlingsaftale v${a.version}`, date: a.signed_at || a.created_at, status: a.status, url: a.pdf_url, extra: a.commission_percent ? `${a.commission_percent}%` : '' })),
    ...documents.map(d => ({ type: 'document' as const, id: d.id, title: d.title, date: d.created_at, status: d.status, url: d.file_url, extra: '' })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const filtered = tab === 'agreements' ? allDocs.filter(d => d.type === 'agreement') : allDocs;

  const getIcon = (type: string) => {
    if (type === 'agreement') return FileSignature;
    return FileText;
  };

  return (
    <OwnerLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">Dokumenter</h1>
          <p className="text-sm text-muted-foreground mt-1">Aftaler og filer — altid tilgængeligt</p>
        </div>

        {/* Tab toggle */}
        <div className="flex gap-1.5 p-1 bg-muted/40 rounded-xl w-fit">
          {[
            { key: 'all' as const, label: `Alle (${allDocs.length})` },
            { key: 'agreements' as const, label: `Aftaler (${agreements.length})` },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
                tab === t.key ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-6 h-6 border-2 border-[hsl(var(--gold))] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-muted/40 flex items-center justify-center mx-auto mb-4">
              <FolderOpen className="w-7 h-7 text-muted-foreground/30" />
            </div>
            <p className="text-sm text-muted-foreground">Ingen dokumenter endnu</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(doc => {
              const Icon = getIcon(doc.type);
              return (
                <Card key={doc.id} className="group hover:border-[hsl(var(--gold)/0.2)] transition-all">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center shrink-0">
                      <Icon className="w-4.5 h-4.5 text-[hsl(var(--gold-light))]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-foreground truncate">{doc.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(doc.date), 'd. MMM yyyy', { locale: da })}
                        {doc.extra && ` · ${doc.extra}`}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {statusBadge(doc.status)}
                      {doc.url && (
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" asChild>
                          <a href={doc.url} target="_blank" rel="noopener"><Download className="w-4 h-4" /></a>
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </OwnerLayout>
  );
}
