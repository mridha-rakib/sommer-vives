import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { AdminPageHeader } from '@/components/admin/ui/AdminPageHeader';
import { StatusChip } from '@/components/admin/ui/StatusChip';
import { EmptyState } from '@/components/admin/ui/EmptyState';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Inbox, FileSignature, Upload, FileText } from 'lucide-react';

export default function AdminModtagelse() {
  const [agreements, setAgreements] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      supabase.from('agreements').select('*, owner:profiles(full_name, email)').in('status', ['signed', 'sent', 'generated']).order('updated_at', { ascending: false }).limit(20),
      supabase.from('documents').select('*').order('created_at', { ascending: false }).limit(20),
    ]).then(([agr, doc]) => {
      setAgreements(agr.data || []);
      setDocuments(doc.data || []);
      setLoading(false);
    });
  }, []);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <AdminPageHeader title="Modtagelsescenter" subtitle="Indgåede aftaler, indsendte oplysninger og uploadede dokumenter" />

        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {[0, 1].map(i => <div key={i} className="rounded-xl border border-border/40 bg-card/60 p-6"><Skeleton className="h-40 w-full rounded-lg" /></div>)}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <Card className="border-border/40 bg-card/60">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <FileSignature className="h-4 w-4 text-primary" /> Formidlingsaftaler
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                {agreements.length === 0 ? (
                  <EmptyState icon={FileSignature} title="Ingen nye aftaler" className="py-8" />
                ) : agreements.map(a => (
                  <div key={a.id} className="flex items-center justify-between py-2.5 px-2 rounded-lg hover:bg-muted/20 transition-colors -mx-2">
                    <div>
                      <p className="text-sm font-medium text-foreground">{a.owner_name || (a.owner as any)?.full_name}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{a.property_title || 'Aftale'} · {a.commission_percent}%</p>
                    </div>
                    <StatusChip
                      label={a.status === 'signed' ? 'Underskrevet' : a.status === 'sent' ? 'Sendt' : 'Genereret'}
                      variant={a.status === 'signed' ? 'success' : a.status === 'sent' ? 'info' : 'muted'}
                      dot
                    />
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-border/40 bg-card/60">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Upload className="h-4 w-4 text-primary" /> Indsendte dokumenter
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                {documents.length === 0 ? (
                  <EmptyState icon={FileText} title="Ingen nye dokumenter" className="py-8" />
                ) : documents.map(d => (
                  <div key={d.id} className="flex items-center gap-3 py-2.5 px-2 rounded-lg hover:bg-muted/20 transition-colors -mx-2">
                    <div className="w-8 h-8 rounded-lg bg-muted/40 flex items-center justify-center shrink-0">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{d.title}</p>
                      <p className="text-[11px] text-muted-foreground">{d.document_type} · {new Date(d.created_at).toLocaleDateString('da-DK')}</p>
                    </div>
                    <StatusChip label={d.status} variant="muted" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
