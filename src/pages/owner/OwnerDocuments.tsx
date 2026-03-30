import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { OwnerLayout } from '@/components/layout/OwnerLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, FileSignature, Receipt, Download, ShieldCheck } from 'lucide-react';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';

export default function OwnerDocuments() {
  const { user } = useAuth();
  const [agreements, setAgreements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) loadDocs();
  }, [user]);

  const loadDocs = async () => {
    if (!user) return;
    const { data } = await supabase.from('agreements').select('*').eq('owner_id', user.id).order('created_at', { ascending: false });
    setAgreements(data || []);
    setLoading(false);
  };

  const docCategories = [
    { icon: FileSignature, label: 'Formidlingsaftale', count: agreements.filter(a => a.status === 'signed').length },
    { icon: Receipt, label: 'Udbetalingskvitteringer', count: 0 },
    { icon: FileText, label: 'Fakturaer', count: 0 },
    { icon: ShieldCheck, label: 'Forsikringsdokumenter', count: 0 },
  ];

  return (
    <OwnerLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Dokumenter</h1>
          <p className="text-sm text-muted-foreground mt-1">Alle dine dokumenter og aftaler samlet ét sted</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {docCategories.map(cat => (
            <Card key={cat.label}>
              <CardContent className="p-4 text-center">
                <cat.icon className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
                <div className="text-xs text-muted-foreground">{cat.label}</div>
                <div className="font-display text-lg font-bold text-foreground mt-1">{cat.count}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Signerede aftaler</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-sm text-muted-foreground text-center py-8">Indlæser...</div>
            ) : agreements.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Ingen dokumenter endnu</p>
              </div>
            ) : (
              <div className="space-y-2">
                {agreements.map(a => (
                  <div key={a.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <div className="flex items-center gap-3">
                      <FileSignature className="w-5 h-5 text-accent" />
                      <div>
                        <div className="text-sm font-medium text-foreground">Formidlingsaftale v{a.version}</div>
                        <div className="text-xs text-muted-foreground">
                          {a.signed_at ? `Signeret ${format(new Date(a.signed_at), 'd. MMM yyyy', { locale: da })}` : 'Kladde'}
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline" className={a.status === 'signed' ? 'bg-emerald-400/15 text-emerald-400 border-emerald-400/20' : ''}>
                      {a.status === 'signed' ? 'Signeret' : a.status === 'draft' ? 'Kladde' : a.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </OwnerLayout>
  );
}
