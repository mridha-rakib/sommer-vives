import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Target, User, CheckCircle2, Clock, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';

const STAGES = [
  { key: 'lead', label: 'Lead', color: 'bg-slate-100 text-slate-700' },
  { key: 'signup', label: 'Signup', color: 'bg-blue-100 text-blue-700' },
  { key: 'onboarding', label: 'Onboarding', color: 'bg-amber-100 text-amber-700' },
  { key: 'agreement_sent', label: 'Aftale sendt', color: 'bg-orange-100 text-orange-700' },
  { key: 'agreement_signed', label: 'Signeret', color: 'bg-emerald-100 text-emerald-700' },
  { key: 'property_setup', label: 'Ejendom setup', color: 'bg-violet-100 text-violet-700' },
  { key: 'listing_live', label: 'Live', color: 'bg-green-100 text-green-700' },
  { key: 'completed', label: 'Komplet', color: 'bg-teal-100 text-teal-700' },
];

export default function AdminPipeline() {
  const [data, setData] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  const load = async () => {
    const { data: rows } = await supabase.from('owner_onboarding').select('*').order('created_at', { ascending: false });
    if (rows && rows.length > 0) {
      const ids = rows.map(r => r.owner_id);
      const { data: profs } = await supabase.from('profiles').select('id, full_name, email').in('id', ids);
      const map: Record<string, any> = {};
      (profs || []).forEach(p => { map[p.id] = p; });
      setProfiles(map);
    }
    setData(rows || []);
    setLoading(false);
  };

  const stageCount = (key: string) => data.filter(d => d.status === key).length;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-slate-900">Onboarding Pipeline</h1>
            <p className="text-sm text-slate-500">Oversigt over ejer-onboarding stadier</p>
          </div>
        </div>

        {/* Stage summary */}
        <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
          {STAGES.map(s => (
            <Card key={s.key} className="text-center">
              <CardContent className="p-3">
                <div className="text-2xl font-bold text-slate-900">{loading ? '–' : stageCount(s.key)}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">{s.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Pipeline list */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Alle onboardings ({data.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-8 text-center"><div className="w-5 h-5 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin mx-auto" /></div>
            ) : data.length === 0 ? (
              <p className="text-sm text-slate-400 py-8 text-center">Ingen onboardings endnu</p>
            ) : (
              <div className="space-y-2">
                {data.map(row => {
                  const prof = profiles[row.owner_id];
                  const stage = STAGES.find(s => s.key === row.status) || STAGES[0];
                  return (
                    <div key={row.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center">
                          <User className="w-4 h-4 text-slate-500" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-slate-900">{prof?.full_name || prof?.email || 'Ukendt'}</div>
                          <div className="text-[11px] text-slate-500">{prof?.email}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className={`text-[10px] ${stage.color}`}>{stage.label}</Badge>
                        <div className="text-[11px] text-slate-400">
                          {row.created_at ? format(new Date(row.created_at), 'd. MMM', { locale: da }) : ''}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
