import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ClipboardList } from 'lucide-react';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';

export default function AdminTasks() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  const load = async () => {
    const { data } = await supabase.from('tasks').select('*').order('scheduled_date', { ascending: true });
    setTasks(data || []);
    setLoading(false);
  };

  const filtered = filter === 'all' ? tasks : tasks.filter(t => t.status === filter);

  const statusBadge = (s: string) => {
    switch (s) { case 'completed': return 'bg-emerald-100 text-emerald-700'; case 'in_progress': return 'bg-blue-100 text-blue-700'; case 'pending': return 'bg-amber-100 text-amber-700'; default: return 'bg-slate-100 text-slate-600'; }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">Opgaver</h1>
          <p className="text-sm text-slate-500">Interne og ejer-opgaver</p>
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
                <th className="px-4 py-3 text-xs font-semibold text-slate-500">Planlagt</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500">Tildelt</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500">Status</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500">Noter</th>
              </tr></thead>
              <tbody>
                {filtered.map(t => (
                  <tr key={t.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">{t.task_type}</td>
                    <td className="px-4 py-3 text-slate-600 text-xs">{format(new Date(t.scheduled_date), 'd. MMM yyyy', { locale: da })}</td>
                    <td className="px-4 py-3 text-slate-600 text-xs">{t.assigned_to || '—'}</td>
                    <td className="px-4 py-3"><Badge className={`text-[10px] ${statusBadge(t.status)}`}>{t.status}</Badge></td>
                    <td className="px-4 py-3 text-slate-400 text-xs truncate max-w-xs">{t.notes || '—'}</td>
                  </tr>
                ))}
                {filtered.length === 0 && !loading && (
                  <tr><td colSpan={5} className="px-4 py-12 text-center text-slate-400">Ingen opgaver</td></tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
