import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Key, CheckCircle2, Clock } from 'lucide-react';

export default function AdminKeyboxes() {
  const [keyboxes, setKeyboxes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  const load = async () => {
    const { data } = await supabase.from('keybox_installations').select('*').order('created_at', { ascending: false });
    setKeyboxes(data || []);
    setLoading(false);
  };

  const statusBadge = (s: string) => {
    switch (s) {
      case 'installed': return 'bg-emerald-100 text-emerald-700';
      case 'pending': return 'bg-amber-100 text-amber-700';
      case 'scheduled': return 'bg-blue-100 text-blue-700';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">Nøglebokse</h1>
          <p className="text-sm text-slate-500">Installation og status for nøglebokse</p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Card><CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-slate-900">{keyboxes.length}</div>
            <div className="text-xs text-slate-500">Total</div>
          </CardContent></Card>
          <Card><CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-emerald-600">{keyboxes.filter(k => k.status === 'installed').length}</div>
            <div className="text-xs text-slate-500">Installeret</div>
          </CardContent></Card>
          <Card><CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-amber-600">{keyboxes.filter(k => k.status === 'pending').length}</div>
            <div className="text-xs text-slate-500">Afventer</div>
          </CardContent></Card>
        </div>

        <Card>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-slate-200 text-left">
                <th className="px-4 py-3 text-xs font-semibold text-slate-500">Placering</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500">Model</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500">Status</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500">Dato</th>
              </tr></thead>
              <tbody>
                {keyboxes.map(k => (
                  <tr key={k.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-900">{k.keybox_location || '—'}</td>
                    <td className="px-4 py-3 text-slate-600">{k.keybox_model || '—'}</td>
                    <td className="px-4 py-3"><Badge className={`text-[10px] ${statusBadge(k.status)}`}>{k.status}</Badge></td>
                    <td className="px-4 py-3 text-xs text-slate-400">{k.installation_date || '—'}</td>
                  </tr>
                ))}
                {keyboxes.length === 0 && !loading && (
                  <tr><td colSpan={4} className="px-4 py-12 text-center text-slate-400">Ingen nøglebokse registreret</td></tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
