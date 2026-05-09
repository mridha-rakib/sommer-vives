import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LifeBuoy, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';

export default function AdminSupportTickets() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  const load = async () => {
    const { data } = await supabase.from('support_tickets').select('*').order('created_at', { ascending: false });
    setTickets(data || []);
    setLoading(false);
  };

  const filtered = filter === 'all' ? tickets : tickets.filter(t => t.status === filter);

  const statusBadge = (s: string) => {
    switch (s) {
      case 'open': return 'bg-red-100 text-red-700';
      case 'in_progress': return 'bg-amber-100 text-amber-700';
      case 'resolved': return 'bg-emerald-100 text-emerald-700';
      case 'closed': return 'bg-slate-100 text-slate-600';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  const priorityBadge = (p: string) => {
    switch (p) {
      case 'urgent': return 'bg-red-100 text-red-700';
      case 'high': return 'bg-orange-100 text-orange-700';
      default: return 'bg-slate-50 text-slate-500';
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">Support-sager</h1>
          <p className="text-sm text-slate-500">Alle henvendelser fra ejere og gæster</p>
        </div>

        <div className="flex items-center gap-2">
          {['all', 'open', 'in_progress', 'resolved', 'closed'].map(f => (
            <Button key={f} variant={filter === f ? 'default' : 'outline'} size="sm" onClick={() => setFilter(f)} className="text-xs">
              {f === 'all' ? 'Alle' : f === 'open' ? 'Åbne' : f === 'in_progress' ? 'I gang' : f === 'resolved' ? 'Løst' : 'Lukket'}
              {f !== 'all' && <span className="ml-1 opacity-70">({tickets.filter(t => t.status === f).length})</span>}
            </Button>
          ))}
        </div>

        <Card>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-slate-200 text-left">
                <th className="px-4 py-3 text-xs font-semibold text-slate-500">Emne</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500">Afsender</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500">Kategori</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500">Prioritet</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500">Status</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500">Oprettet</th>
              </tr></thead>
              <tbody>
                {filtered.map(t => (
                  <tr key={t.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">{t.subject}</div>
                      {t.description && <div className="text-[11px] text-slate-400 truncate max-w-xs">{t.description}</div>}
                    </td>
                    <td className="px-4 py-3 text-slate-600 text-xs">{t.requester_email || '—'}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{t.category}</td>
                    <td className="px-4 py-3"><Badge className={`text-[10px] ${priorityBadge(t.priority)}`}>{t.priority}</Badge></td>
                    <td className="px-4 py-3"><Badge className={`text-[10px] ${statusBadge(t.status)}`}>{t.status}</Badge></td>
                    <td className="px-4 py-3 text-xs text-slate-400">{format(new Date(t.created_at), 'd. MMM', { locale: da })}</td>
                  </tr>
                ))}
                {filtered.length === 0 && !loading && (
                  <tr><td colSpan={6} className="px-4 py-12 text-center text-slate-400">Ingen support-sager</td></tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
