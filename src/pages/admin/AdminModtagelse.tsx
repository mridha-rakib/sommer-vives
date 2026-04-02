import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Inbox, FileSignature, Upload, FileText, UserCheck } from 'lucide-react';

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
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Modtagelsescenter</h1>
          <p className="text-sm text-muted-foreground">Indgåede aftaler, indsendte oplysninger og uploadede dokumenter</p>
        </div>

        {loading ? (
          <div className="space-y-3">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Agreements */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <FileSignature className="h-4 w-4 text-primary" /> Formidlingsaftaler
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {agreements.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-4 text-center">Ingen nye aftaler</p>
                ) : agreements.map(a => (
                  <div key={a.id} className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
                    <div>
                      <p className="text-sm font-medium text-foreground">{a.owner_name || (a.owner as any)?.full_name}</p>
                      <p className="text-xs text-muted-foreground">{a.property_title || 'Aftale'} · {a.commission_percent}%</p>
                    </div>
                    <Badge className={`text-[10px] border-0 ${
                      a.status === 'signed' ? 'bg-emerald-100 text-emerald-700'
                        : a.status === 'sent' ? 'bg-blue-100 text-blue-700'
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {a.status === 'signed' ? 'Underskrevet' : a.status === 'sent' ? 'Sendt' : 'Genereret'}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Documents */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Upload className="h-4 w-4 text-primary" /> Indsendte dokumenter
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {documents.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-4 text-center">Ingen nye dokumenter</p>
                ) : documents.map(d => (
                  <div key={d.id} className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium text-foreground">{d.title}</p>
                        <p className="text-xs text-muted-foreground">{d.document_type} · {new Date(d.created_at).toLocaleDateString('da-DK')}</p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-[10px]">{d.status}</Badge>
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
