import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bell, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';

export default function AdminNotifications() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  const load = async () => {
    const { data } = await supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(100);
    setNotifications(data || []);
    setLoading(false);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-slate-900">Notifikationer</h1>
            <p className="text-sm text-slate-500">System- og brugernotifikationer</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Card><CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-slate-900">{notifications.length}</div>
            <div className="text-xs text-slate-500">Total</div>
          </CardContent></Card>
          <Card><CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{notifications.filter(n => !n.is_read).length}</div>
            <div className="text-xs text-slate-500">Ulæste</div>
          </CardContent></Card>
          <Card><CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-emerald-600">{notifications.filter(n => n.is_read).length}</div>
            <div className="text-xs text-slate-500">Læste</div>
          </CardContent></Card>
        </div>

        <Card>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-slate-200 text-left">
                <th className="px-4 py-3 text-xs font-semibold text-slate-500">Titel</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500">Kanal</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500">Kategori</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500">Læst</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500">Sendt</th>
              </tr></thead>
              <tbody>
                {notifications.map(n => (
                  <tr key={n.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">{n.title}</div>
                      {n.body && <div className="text-[11px] text-slate-400 truncate max-w-xs">{n.body}</div>}
                    </td>
                    <td className="px-4 py-3"><Badge variant="outline" className="text-[10px]">{n.channel}</Badge></td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{n.category}</td>
                    <td className="px-4 py-3">{n.is_read ? <Badge className="text-[10px] bg-emerald-100 text-emerald-700">Ja</Badge> : <Badge className="text-[10px] bg-slate-100 text-slate-500">Nej</Badge>}</td>
                    <td className="px-4 py-3 text-xs text-slate-400">{format(new Date(n.created_at), 'd. MMM HH:mm', { locale: da })}</td>
                  </tr>
                ))}
                {notifications.length === 0 && !loading && (
                  <tr><td colSpan={5} className="px-4 py-12 text-center text-slate-400">Ingen notifikationer</td></tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
