import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';

export default function AdminPropertiesMgmt() {
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  const load = async () => {
    const { data } = await supabase.from('properties').select('*').order('created_at', { ascending: false });
    setProperties(data || []);
    setLoading(false);
  };

  const statusBadge = (s: string) => {
    switch (s) {
      case 'published': return 'bg-emerald-100 text-emerald-700';
      case 'draft': return 'bg-slate-100 text-slate-600';
      case 'review': return 'bg-amber-100 text-amber-700';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">Ejendomme</h1>
          <p className="text-sm text-slate-500">Alle registrerede sommerhuse</p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Card><CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-slate-900">{properties.length}</div>
            <div className="text-xs text-slate-500">Total</div>
          </CardContent></Card>
          <Card><CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-emerald-600">{properties.filter(p => p.status === 'published').length}</div>
            <div className="text-xs text-slate-500">Publiceret</div>
          </CardContent></Card>
          <Card><CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-amber-600">{properties.filter(p => p.status === 'draft').length}</div>
            <div className="text-xs text-slate-500">Kladde</div>
          </CardContent></Card>
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-slate-200 text-left">
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500">Ejendom</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500">Region</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500">Kapacitet</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500">Status</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500">Sagsnr.</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500">Oprettet</th>
                </tr></thead>
                <tbody>
                  {properties.map(p => (
                    <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900">{p.title}</div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1"><MapPin className="w-3 h-3" />{p.address}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{p.region}</td>
                      <td className="px-4 py-3 text-slate-600">{p.capacity} pers.</td>
                      <td className="px-4 py-3"><Badge className={`text-[10px] ${statusBadge(p.status)}`}>{p.status}</Badge></td>
                      <td className="px-4 py-3 text-slate-400 font-mono text-xs">{p.case_number || '—'}</td>
                      <td className="px-4 py-3 text-slate-400 text-xs">{format(new Date(p.created_at), 'd. MMM yyyy', { locale: da })}</td>
                    </tr>
                  ))}
                  {properties.length === 0 && !loading && (
                    <tr><td colSpan={6} className="px-4 py-12 text-center text-slate-400">Ingen ejendomme</td></tr>
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
