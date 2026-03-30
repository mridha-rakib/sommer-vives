import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { OwnerLayout } from '@/components/layout/OwnerLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, FileSignature, Receipt, Download, ShieldCheck, Upload, FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';

const statusBadge = (status: string) => {
  const map: Record<string, { label: string; className: string }> = {
    signed: { label: 'Signeret', className: 'bg-emerald-400/15 text-emerald-400 border-emerald-400/20' },
    draft: { label: 'Kladde', className: 'bg-amber-400/15 text-amber-400 border-amber-400/20' },
    generated: { label: 'Genereret', className: 'bg-blue-400/15 text-blue-400 border-blue-400/20' },
    sent: { label: 'Sendt', className: 'bg-blue-400/15 text-blue-400 border-blue-400/20' },
    active: { label: 'Aktiv', className: 'bg-emerald-400/15 text-emerald-400 border-emerald-400/20' },
    paid: { label: 'Betalt', className: 'bg-emerald-400/15 text-emerald-400 border-emerald-400/20' },
    issued: { label: 'Udstedt', className: 'bg-blue-400/15 text-blue-400 border-blue-400/20' },
  };
  const s = map[status] || { label: status, className: '' };
  return <Badge variant="outline" className={`text-[10px] ${s.className}`}>{s.label}</Badge>;
};

export default function OwnerDocuments() {
  const { user } = useAuth();
  const [agreements, setAgreements] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) loadDocs();
  }, [user]);

  const loadDocs = async () => {
    if (!user) return;
    const [agrRes, docRes, invRes] = await Promise.all([
      supabase.from('agreements').select('*').eq('owner_id', user.id).order('created_at', { ascending: false }),
      supabase.from('documents').select('*').eq('owner_id', user.id).order('created_at', { ascending: false }),
      supabase.from('invoices').select('*, orders(user_type)').order('created_at', { ascending: false }),
    ]);
    setAgreements(agrRes.data || []);
    setDocuments(docRes.data || []);
    setInvoices(invRes.data || []);
    setLoading(false);
  };

  const formatAmount = (cents: number) => `${(cents / 100).toLocaleString('da-DK')} kr`;

  const docTypeLabels: Record<string, string> = {
    agreement: 'Aftale', invoice: 'Faktura', receipt: 'Kvittering',
    payout_statement: 'Udbetalingsoversigt', insurance: 'Forsikring', other: 'Andet',
  };

  return (
    <OwnerLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Dit arkiv</h1>
          <p className="text-sm text-muted-foreground mt-1">Aftaler, fakturaer og filer — altid tilgængeligt, når du har brug for dem</p>
        </div>

        {/* Category summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { icon: FileSignature, label: 'Aftaler', count: agreements.length },
            { icon: Receipt, label: 'Fakturaer', count: invoices.length },
            { icon: FolderOpen, label: 'Dokumenter', count: documents.length },
            { icon: ShieldCheck, label: 'I alt', count: agreements.length + invoices.length + documents.length },
          ].map(cat => (
            <Card key={cat.label}>
              <CardContent className="p-4 text-center">
                <cat.icon className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
                <div className="text-xs text-muted-foreground">{cat.label}</div>
                <div className="font-display text-lg font-bold text-foreground mt-1">{loading ? '—' : cat.count}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="agreements" className="w-full">
          <TabsList className="bg-muted/50 h-10 p-1 gap-1">
            <TabsTrigger value="agreements" className="text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md px-4">
              Aftaler ({agreements.length})
            </TabsTrigger>
            <TabsTrigger value="invoices" className="text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md px-4">
              Fakturaer ({invoices.length})
            </TabsTrigger>
            <TabsTrigger value="files" className="text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md px-4">
              Filer ({documents.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="agreements" className="mt-6">
            {loading ? (
              <div className="text-sm text-muted-foreground text-center py-8">Indlæser...</div>
            ) : agreements.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <FileSignature className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Ingen aftaler endnu</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {agreements.map(a => (
                  <Card key={a.id}>
                    <CardContent className="p-4 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <FileSignature className="w-5 h-5 text-accent shrink-0" />
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-foreground">Formidlingsaftale v{a.version}</div>
                          <div className="text-xs text-muted-foreground">
                            {a.signed_at ? `Signeret ${format(new Date(a.signed_at), 'd. MMM yyyy', { locale: da })}` : 'Kladde'}
                            {a.commission_percent && ` · ${a.commission_percent}% kommission`}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {statusBadge(a.status)}
                        {a.pdf_url && (
                          <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                            <a href={a.pdf_url} target="_blank" rel="noopener"><Download className="w-4 h-4" /></a>
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="invoices" className="mt-6">
            {invoices.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Receipt className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Ingen fakturaer endnu</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {invoices.map((inv: any) => (
                  <Card key={inv.id}>
                    <CardContent className="p-4 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <Receipt className="w-5 h-5 text-accent shrink-0" />
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-foreground">{inv.invoice_number}</div>
                          <div className="text-xs text-muted-foreground">
                            {format(new Date(inv.issued_at), 'd. MMM yyyy', { locale: da })}
                            {inv.recipient_name && ` · ${inv.recipient_name}`}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-sm font-semibold text-foreground">{formatAmount(inv.total)}</span>
                        {statusBadge(inv.status)}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="files" className="mt-6">
            {documents.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <FolderOpen className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Ingen uploadede filer</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {documents.map(doc => (
                  <Card key={doc.id}>
                    <CardContent className="p-4 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <FileText className="w-5 h-5 text-muted-foreground shrink-0" />
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-foreground truncate">{doc.title}</div>
                          <div className="text-xs text-muted-foreground">
                            {docTypeLabels[doc.document_type] || doc.document_type}
                            {' · '}{format(new Date(doc.created_at), 'd. MMM yyyy', { locale: da })}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {statusBadge(doc.status)}
                        {doc.file_url && (
                          <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                            <a href={doc.file_url} target="_blank" rel="noopener"><Download className="w-4 h-4" /></a>
                          </Button>
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
    </OwnerLayout>
  );
}
