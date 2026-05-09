import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';

export default function AdminCleaning() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  const load = async () => {
    const { data } = await supabase.from('cleaning_jobs').select('*').order('scheduled_date', { ascending: true });
    setJobs(data || []);
    setLoading(false);
  };

  const filtered = filter === 'all' ? jobs : jobs.filter(j => j.status === filter);

  const statusBadge = (s: string) => {
    switch (s) { case 'completed': return 'bg-emerald-100 text-emerald-700'; case 'in_progress': return 'bg-blue-100 text-blue-700'; case 'pending': return 'bg-amber-100 text-amber-700'; default: return 'bg-slate-100 text-slate-600'; }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">Rengøring</h1>
          <p className="text-sm text-slate-500">Rengøringsopgaver og status</p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Card><CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-slate-900">{jobs.length}</div>
            <div className="text-xs text-slate-500">Total</div>
          </CardContent></Card>
          <Card><CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-amber-600">{jobs.filter(j => j.status === 'pending').length}</div>
            <div className="text-xs text-slate-500">Afventer</div>
          </CardContent></Card>
          <Card><CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-emerald-600">{jobs.filter(j => j.status === 'completed').length}</div>
            <div className="text-xs text-slate-500">Fuldført</div>
          </CardContent></Card>
        </div>

        <div className="flex gap-2">
          {['all', 'pending', 'in_progress', 'completed'].map(f => (
            <Button key={f} variant={filter === f ? 'default' : 'outline'} size="sm" onClick={() => setFilter(f)} className="text-xs">
              {f === 'all' ? 'Alle' : f === 'pending' ? 'Afventer' : f === 'in_progress' ? 'I gang' : 'Fuldført'}
            </Button>
          ))}
        </div>

        <Card>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-slate-200 text-left">
                <th className="px-4 py-3 text-xs font-semibold text-slate-500">Type</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500">Dato</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500">Status</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500">Noter</th>
              </tr></thead>
              <tbody>
                {filtered.map(j => (
                  <tr key={j.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">{j.job_type}</td>
                    <td className="px-4 py-3 text-slate-600">{j.scheduled_date ? format(new Date(j.scheduled_date), 'd. MMM yyyy', { locale: da }) : '—'}</td>
                    <td className="px-4 py-3"><Badge className={`text-[10px] ${statusBadge(j.status)}`}>{j.status}</Badge></td>
                    <td className="px-4 py-3 text-slate-400 text-xs truncate max-w-xs">{j.notes || '—'}</td>
                  </tr>
                ))}
                {filtered.length === 0 && !loading && (
                  <tr><td colSpan={4} className="px-4 py-12 text-center text-slate-400">Ingen rengøringsopgaver</td></tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
