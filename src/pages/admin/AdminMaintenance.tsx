import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Wrench } from 'lucide-react';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';

export default function AdminMaintenance() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  const load = async () => {
    const { data } = await supabase.from('maintenance_jobs').select('*').order('created_at', { ascending: false });
    setJobs(data || []);
    setLoading(false);
  };

  const filtered = filter === 'all' ? jobs : jobs.filter(j => j.status === filter);

  const statusBadge = (s: string) => {
    switch (s) { case 'completed': return 'bg-emerald-100 text-emerald-700'; case 'in_progress': return 'bg-blue-100 text-blue-700'; case 'reported': return 'bg-red-100 text-red-700'; default: return 'bg-slate-100 text-slate-600'; }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">Vedligeholdelse</h1>
          <p className="text-sm text-slate-500">Reparationer og vedligeholdelsesopgaver</p>
        </div>

        <div className="flex gap-2">
          {['all', 'reported', 'in_progress', 'completed'].map(f => (
            <Button key={f} variant={filter === f ? 'default' : 'outline'} size="sm" onClick={() => setFilter(f)} className="text-xs">
              {f === 'all' ? 'Alle' : f === 'reported' ? 'Rapporteret' : f === 'in_progress' ? 'I gang' : 'Fuldført'}
            </Button>
          ))}
        </div>

        <Card>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-slate-200 text-left">
                <th className="px-4 py-3 text-xs font-semibold text-slate-500">Titel</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500">Kategori</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500">Prioritet</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500">Status</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500">Est. pris</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500">Oprettet</th>
              </tr></thead>
              <tbody>
                {filtered.map(j => (
                  <tr key={j.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">{j.title}</div>
                      {j.description && <div className="text-[11px] text-slate-400 truncate max-w-xs">{j.description}</div>}
                    </td>
                    <td className="px-4 py-3 text-slate-600 text-xs">{j.category}</td>
                    <td className="px-4 py-3"><Badge className={`text-[10px] ${j.priority === 'urgent' ? 'bg-red-100 text-red-700' : 'bg-slate-50 text-slate-500'}`}>{j.priority}</Badge></td>
                    <td className="px-4 py-3"><Badge className={`text-[10px] ${statusBadge(j.status)}`}>{j.status}</Badge></td>
                    <td className="px-4 py-3 text-slate-600 text-xs">{j.cost_estimate ? `${j.cost_estimate} DKK` : '—'}</td>
                    <td className="px-4 py-3 text-xs text-slate-400">{format(new Date(j.created_at), 'd. MMM', { locale: da })}</td>
                  </tr>
                ))}
                {filtered.length === 0 && !loading && (
                  <tr><td colSpan={6} className="px-4 py-12 text-center text-slate-400">Ingen vedligeholdelsesopgaver</td></tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
