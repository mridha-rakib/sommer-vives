import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Download } from 'lucide-react';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';

export default function AdminDocuments() {
  const [docs, setDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  const load = async () => {
    const { data } = await supabase.from('documents').select('*').order('created_at', { ascending: false });
    setDocs(data || []);
    setLoading(false);
  };

  const typeLabel = (t: string) => {
    const map: Record<string, string> = { agreement: 'Aftale', invoice: 'Faktura', payout_statement: 'Afregning', insurance: 'Forsikring', other: 'Andet' };
    return map[t] || t;
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">Dokumenter</h1>
          <p className="text-sm text-slate-500">Alle platform-dokumenter</p>
        </div>

        <Card>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-slate-200 text-left">
                <th className="px-4 py-3 text-xs font-semibold text-slate-500">Titel</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500">Type</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500">Status</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500">Oprettet</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500"></th>
              </tr></thead>
              <tbody>
                {docs.map(d => (
                  <tr key={d.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">{d.title}</td>
                    <td className="px-4 py-3"><Badge variant="outline" className="text-[10px]">{typeLabel(d.document_type)}</Badge></td>
                    <td className="px-4 py-3"><Badge className={`text-[10px] ${d.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{d.status}</Badge></td>
                    <td className="px-4 py-3 text-xs text-slate-400">{format(new Date(d.created_at), 'd. MMM yyyy', { locale: da })}</td>
                    <td className="px-4 py-3">{d.file_url && <a href={d.file_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-xs flex items-center gap-1"><Download className="w-3 h-3" />Hent</a>}</td>
                  </tr>
                ))}
                {docs.length === 0 && !loading && (
                  <tr><td colSpan={5} className="px-4 py-12 text-center text-slate-400">Ingen dokumenter</td></tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
