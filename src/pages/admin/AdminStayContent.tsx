import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Wifi, Key, Car } from 'lucide-react';

export default function AdminStayContent() {
  const [guides, setGuides] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  const load = async () => {
    const { data } = await supabase.from('checkin_guides').select('*').order('created_at', { ascending: false });
    setGuides(data || []);
    setLoading(false);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">Stay-indhold</h1>
          <p className="text-sm text-slate-500">Check-in guides og opholdsinformation pr. listing</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card><CardContent className="p-4 text-center">
            <BookOpen className="w-5 h-5 text-slate-400 mx-auto mb-1" />
            <div className="text-2xl font-bold text-slate-900">{guides.length}</div>
            <div className="text-xs text-slate-500">Guides oprettet</div>
          </CardContent></Card>
          <Card><CardContent className="p-4 text-center">
            <Wifi className="w-5 h-5 text-slate-400 mx-auto mb-1" />
            <div className="text-2xl font-bold text-slate-900">{guides.filter(g => g.wifi_name).length}</div>
            <div className="text-xs text-slate-500">Med WiFi-info</div>
          </CardContent></Card>
          <Card><CardContent className="p-4 text-center">
            <Key className="w-5 h-5 text-slate-400 mx-auto mb-1" />
            <div className="text-2xl font-bold text-slate-900">{guides.filter(g => g.keybox_instructions).length}</div>
            <div className="text-xs text-slate-500">Med nøgleboks-info</div>
          </CardContent></Card>
          <Card><CardContent className="p-4 text-center">
            <Car className="w-5 h-5 text-slate-400 mx-auto mb-1" />
            <div className="text-2xl font-bold text-slate-900">{guides.filter(g => g.parking_info).length}</div>
            <div className="text-xs text-slate-500">Med parkerings-info</div>
          </CardContent></Card>
        </div>

        <Card>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-slate-200 text-left">
                <th className="px-4 py-3 text-xs font-semibold text-slate-500">Listing ID</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500">WiFi</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500">Nøgleboks</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500">Parkering</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500">Nødkontakt</th>
              </tr></thead>
              <tbody>
                {guides.map(g => (
                  <tr key={g.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono text-xs text-slate-600">{g.listing_id?.slice(0, 8)}</td>
                    <td className="px-4 py-3">{g.wifi_name ? <Badge className="text-[10px] bg-emerald-100 text-emerald-700">✓</Badge> : <Badge className="text-[10px] bg-slate-100 text-slate-400">—</Badge>}</td>
                    <td className="px-4 py-3">{g.keybox_instructions ? <Badge className="text-[10px] bg-emerald-100 text-emerald-700">✓</Badge> : <Badge className="text-[10px] bg-slate-100 text-slate-400">—</Badge>}</td>
                    <td className="px-4 py-3">{g.parking_info ? <Badge className="text-[10px] bg-emerald-100 text-emerald-700">✓</Badge> : <Badge className="text-[10px] bg-slate-100 text-slate-400">—</Badge>}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{g.emergency_contact || '—'}</td>
                  </tr>
                ))}
                {guides.length === 0 && !loading && (
                  <tr><td colSpan={5} className="px-4 py-12 text-center text-slate-400">Ingen stay-guides oprettet endnu</td></tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
