import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Target, User, CheckCircle2, Clock, ArrowRight, ChevronRight, MoreHorizontal, Phone, Mail, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';
import { toast } from 'sonner';

const STAGES = [
  { key: 'lead', label: 'Lead', color: 'bg-slate-500', lightColor: 'bg-slate-100 text-slate-700', icon: Target },
  { key: 'signup', label: 'Signup', color: 'bg-blue-500', lightColor: 'bg-blue-100 text-blue-700', icon: User },
  { key: 'onboarding', label: 'Onboarding', color: 'bg-amber-500', lightColor: 'bg-amber-100 text-amber-700', icon: Clock },
  { key: 'agreement_sent', label: 'Aftale sendt', color: 'bg-orange-500', lightColor: 'bg-orange-100 text-orange-700', icon: Mail },
  { key: 'agreement_signed', label: 'Signeret', color: 'bg-emerald-500', lightColor: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
  { key: 'property_setup', label: 'Setup', color: 'bg-violet-500', lightColor: 'bg-violet-100 text-violet-700', icon: Calendar },
  { key: 'listing_live', label: 'Live', color: 'bg-green-500', lightColor: 'bg-green-100 text-green-700', icon: CheckCircle2 },
  { key: 'completed', label: 'Komplet', color: 'bg-teal-500', lightColor: 'bg-teal-100 text-teal-700', icon: CheckCircle2 },
];

export default function AdminPipeline() {
  const [data, setData] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<Record<string, any>>({});
  const [properties, setProperties] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');

  useEffect(() => { load(); }, []);

  const load = async () => {
    const { data: rows } = await supabase.from('owner_onboarding').select('*').order('created_at', { ascending: false });
    if (rows && rows.length > 0) {
      const ids = rows.map(r => r.owner_id);
      const [profsRes, propsRes] = await Promise.all([
        supabase.from('profiles').select('id, full_name, email, phone').in('id', ids),
        supabase.from('properties').select('id, owner_id, title, region, status').in('owner_id', ids),
      ]);
      const profMap: Record<string, any> = {};
      (profsRes.data || []).forEach(p => { profMap[p.id] = p; });
      const propMap: Record<string, any> = {};
      (propsRes.data || []).forEach(p => { propMap[p.owner_id] = p; });
      setProfiles(profMap);
      setProperties(propMap);
    }
    setData(rows || []);
    setLoading(false);
  };

  const moveToStage = async (rowId: string, newStatus: string) => {
    const timestampField = {
      agreement_signed: 'agreement_signed_at',
      property_setup: 'property_visit_scheduled_at',
      listing_live: 'listing_published_at',
      completed: 'listing_published_at',
    }[newStatus];

    const update: any = { status: newStatus };
    if (timestampField && !data.find(d => d.id === rowId)?.[timestampField]) {
      update[timestampField] = new Date().toISOString();
    }

    const { error } = await supabase.from('owner_onboarding').update(update).eq('id', rowId);
    if (error) {
      toast.error('Kunne ikke opdatere status');
    } else {
      toast.success(`Flyttet til ${STAGES.find(s => s.key === newStatus)?.label}`);
      load();
    }
  };

  const stageData = (stageKey: string) => data.filter(d => d.status === stageKey);

  const OwnerCard = ({ row }: { row: any }) => {
    const prof = profiles[row.owner_id];
    const prop = properties[row.owner_id];
    const stage = STAGES.find(s => s.key === row.status) || STAGES[0];
    const daysSince = row.created_at ? Math.floor((Date.now() - new Date(row.created_at).getTime()) / 86400000) : 0;

    return (
      <div className="p-3 rounded-lg bg-white border border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all cursor-pointer group">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
              <User className="w-3.5 h-3.5 text-slate-500" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-slate-900 truncate">{prof?.full_name || 'Ukendt'}</div>
              <div className="text-[10px] text-slate-400 truncate">{prof?.email}</div>
            </div>
          </div>
          <Select value={row.status} onValueChange={(v) => moveToStage(row.id, v)}>
            <SelectTrigger className="h-6 w-auto border-0 bg-transparent p-0 opacity-0 group-hover:opacity-100 transition-opacity">
              <MoreHorizontal className="w-3.5 h-3.5 text-slate-400" />
            </SelectTrigger>
            <SelectContent>
              {STAGES.map(s => (
                <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {prop && (
          <div className="text-xs text-slate-600 mb-2 flex items-center gap-1">
            <span className="truncate">{prop.title}</span>
            {prop.region && <span className="text-slate-400">· {prop.region}</span>}
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {prof?.phone && <Phone className="w-3 h-3 text-slate-300" />}
            {prof?.email && <Mail className="w-3 h-3 text-slate-300" />}
          </div>
          <span className="text-[10px] text-slate-400">
            {daysSince}d siden
          </span>
        </div>
      </div>
    );
  };

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-slate-900">Onboarding Pipeline</h1>
            <p className="text-sm text-slate-500">{data.length} ejere i systemet</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'kanban' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('kanban')}
              className="text-xs h-8"
            >
              Kanban
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="text-xs h-8"
            >
              Liste
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="py-16 text-center">
            <div className="w-6 h-6 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin mx-auto" />
          </div>
        ) : viewMode === 'kanban' ? (
          /* Kanban view */
          <div className="flex gap-3 overflow-x-auto pb-4 -mx-2 px-2">
            {STAGES.map(stage => {
              const items = stageData(stage.key);
              const Icon = stage.icon;
              return (
                <div key={stage.key} className="min-w-[260px] w-[260px] shrink-0">
                  <div className="flex items-center gap-2 mb-3 px-1">
                    <div className={`w-2 h-2 rounded-full ${stage.color}`} />
                    <span className="text-xs font-semibold text-slate-700 uppercase tracking-wide">{stage.label}</span>
                    <span className="text-[10px] text-slate-400 ml-auto font-medium">{items.length}</span>
                  </div>
                  <div className="space-y-2 min-h-[100px] bg-slate-50/50 rounded-lg p-2">
                    {items.length === 0 ? (
                      <div className="text-xs text-slate-300 text-center py-8">Ingen</div>
                    ) : (
                      items.map(row => <OwnerCard key={row.id} row={row} />)
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* List view */
          <Card>
            <CardContent className="p-0">
              <div className="grid grid-cols-[1fr,auto,auto,auto] gap-4 px-4 py-2.5 text-[10px] text-slate-400 uppercase tracking-wider font-medium border-b">
                <span>Ejer</span>
                <span>Ejendom</span>
                <span>Status</span>
                <span>Oprettet</span>
              </div>
              {data.map(row => {
                const prof = profiles[row.owner_id];
                const prop = properties[row.owner_id];
                const stage = STAGES.find(s => s.key === row.status) || STAGES[0];
                return (
                  <div key={row.id} className="grid grid-cols-[1fr,auto,auto,auto] gap-4 px-4 py-3 items-center border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                        <User className="w-4 h-4 text-slate-500" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-slate-900 truncate">{prof?.full_name || prof?.email || 'Ukendt'}</div>
                        <div className="text-[11px] text-slate-400 truncate">{prof?.email}</div>
                      </div>
                    </div>
                    <div className="text-xs text-slate-500 w-[140px] truncate">{prop?.title || '—'}</div>
                    <Select value={row.status} onValueChange={(v) => moveToStage(row.id, v)}>
                      <SelectTrigger className="h-7 w-auto border-0 p-0">
                        <Badge className={`text-[10px] ${stage.lightColor} cursor-pointer`}>{stage.label}</Badge>
                      </SelectTrigger>
                      <SelectContent>
                        {STAGES.map(s => (
                          <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="text-[11px] text-slate-400 w-[70px]">
                      {row.created_at ? format(new Date(row.created_at), 'd. MMM', { locale: da }) : ''}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}
