import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, CheckCircle2, Clock, Send } from 'lucide-react';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';

export default function AdminAgreements() {
  const [agreements, setAgreements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  const load = async () => {
    const { data } = await supabase.from('agreements').select('*').order('created_at', { ascending: false });
    setAgreements(data || []);
    setLoading(false);
  };

  const statusBadge = (s: string) => {
    switch (s) {
      case 'signed': return 'bg-emerald-100 text-emerald-700';
      case 'draft': return 'bg-slate-100 text-slate-600';
      case 'sent': return 'bg-blue-100 text-blue-700';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  const counts = {
    total: agreements.length,
    signed: agreements.filter(a => a.status === 'signed').length,
    draft: agreements.filter(a => a.status === 'draft').length,
    sent: agreements.filter(a => a.status === 'sent').length,
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">Formidlingsaftaler</h1>
          <p className="text-sm text-slate-500">Alle aftaler og signaturer</p>
        </div>

        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Total', value: counts.total, icon: FileText },
            { label: 'Signeret', value: counts.signed, icon: CheckCircle2 },
            { label: 'Sendt', value: counts.sent, icon: Send },
            { label: 'Kladde', value: counts.draft, icon: Clock },
          ].map(c => (
            <Card key={c.label}><CardContent className="p-4 text-center">
              <c.icon className="w-5 h-5 text-slate-400 mx-auto mb-1" />
              <div className="text-xl font-bold text-slate-900">{loading ? '–' : c.value}</div>
              <div className="text-[11px] text-slate-500">{c.label}</div>
            </CardContent></Card>
          ))}
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-slate-200 text-left">
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500">Ejer</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500">Ejendom</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500">Provision</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500">Status</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500">Signeret</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500">Version</th>
                </tr></thead>
                <tbody>
                  {agreements.map(a => (
                    <tr key={a.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900">{a.owner_name || '—'}</div>
                        <div className="text-[11px] text-slate-400">{a.owner_email}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{a.property_title || '—'}</td>
                      <td className="px-4 py-3 text-slate-600">{a.commission_percent}%</td>
                      <td className="px-4 py-3"><Badge className={`text-[10px] ${statusBadge(a.status)}`}>{a.status}</Badge></td>
                      <td className="px-4 py-3 text-slate-500 text-xs">{a.signed_at ? format(new Date(a.signed_at), 'd. MMM yyyy', { locale: da }) : '—'}</td>
                      <td className="px-4 py-3 text-slate-400 font-mono text-xs">v{a.version}</td>
                    </tr>
                  ))}
                  {agreements.length === 0 && !loading && (
                    <tr><td colSpan={6} className="px-4 py-12 text-center text-slate-400">Ingen aftaler endnu</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
