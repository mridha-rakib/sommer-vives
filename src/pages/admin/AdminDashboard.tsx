import { useState, useEffect } from 'react';
import { formatDKK } from '@/lib/status-badges';
import {
  Target, MessageSquare, Calendar, ListChecks, FileSignature,
  FolderOpen, ArrowUpRight, Plus, TrendingUp, Users,
  Clock, CheckCircle, Building2, AlertCircle, UserCheck, DollarSign
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { StatCard } from '@/components/admin/StatCard';
import { ActivityLog } from '@/components/admin/ActivityLog';
import { useAdminStats } from '@/hooks/useAdminStats';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

export default function AdminDashboard() {
  const { stats, loading: statsLoading } = useAdminStats();
  const [leads, setLeads] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [agreements, setAgreements] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const today = new Date().toISOString().split('T')[0];
      const [leadsRes, tasksRes, agreementsRes, msgRes] = await Promise.all([
        supabase.from('leads').select('*').order('created_at', { ascending: false }).limit(5),
        supabase.from('tasks').select('*, property:properties(title)').eq('scheduled_date', today).limit(8),
        supabase.from('agreements').select('*, owner:profiles(full_name, email)').eq('status', 'signed').order('signed_at', { ascending: false }).limit(5),
        supabase.from('chat_messages').select('id', { count: 'exact' }).eq('is_read', false),
      ]);
      setLeads(leadsRes.data || []);
      setTasks(tasksRes.data || []);
      setAgreements(agreementsRes.data || []);
      setUnreadCount(msgRes.count || 0);
      setLoading(false);
    };
    load();
  }, []);

  const quickActions = [
    { label: 'Nyt lead', href: '/admin/leads', icon: Target },
    { label: 'Ny opgave', href: '/admin/opgaver', icon: ListChecks },
    { label: 'Ny besked', href: '/admin/beskeder', icon: MessageSquare },
    { label: 'Se kalender', href: '/admin/kalender', icon: Calendar },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Overblik</h1>
            <p className="text-sm text-muted-foreground">Dit daglige kontrolcenter</p>
          </div>
          <div className="flex gap-2">
            {quickActions.map(a => (
              <Button key={a.label} variant="outline" size="sm" asChild className="gap-1.5 text-xs">
                <Link to={a.href}>
                  <a.icon className="h-3.5 w-3.5" />
                  <span className="hidden md:inline">{a.label}</span>
                </Link>
              </Button>
            ))}
          </div>
        </div>

        {/* KPI strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {statsLoading ? (
            [...Array(6)].map((_, i) => <Card key={i} className="p-4"><Skeleton className="h-4 w-20 mb-2" /><Skeleton className="h-8 w-16" /></Card>)
          ) : stats && (
            <>
              <StatCard title="Nye leads" value={leads.length} icon={Target} variant="info" />
              <StatCard title="Ulæste beskeder" value={unreadCount} icon={MessageSquare} variant={unreadCount > 0 ? 'warning' : 'default'} />
              <StatCard title="Opgaver i dag" value={tasks.length} icon={ListChecks} variant="default" />
              <StatCard title="Aktive sager" value={stats.activeProperties} icon={FolderOpen} variant="success" />
              <StatCard title="Ejere" value={stats.totalOwners} icon={UserCheck} variant="default" />
              <StatCard title="Platform-omsætning" value={formatDKK(stats.platformEarnings)} icon={TrendingUp} variant="success" />
            </>
          )}
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Leads */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" /> Nye leads
              </CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/admin/leads" className="text-xs">Se alle <ArrowUpRight className="h-3 w-3 ml-1" /></Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-2">
              {loading ? <Skeleton className="h-20 w-full" /> : leads.length === 0 ? (
                <p className="text-xs text-muted-foreground py-4 text-center">Ingen nye leads</p>
              ) : leads.map(l => (
                <div key={l.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div>
                    <p className="text-sm font-medium text-foreground">{l.name}</p>
                    <p className="text-xs text-muted-foreground">{l.source} · {l.region || 'Ukendt'}</p>
                  </div>
                  <Badge variant="secondary" className="text-[10px]">{l.status}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Tasks today */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <ListChecks className="h-4 w-4 text-primary" /> Opgaver i dag
              </CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/admin/opgaver" className="text-xs">Se alle <ArrowUpRight className="h-3 w-3 ml-1" /></Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-2">
              {loading ? <Skeleton className="h-20 w-full" /> : tasks.length === 0 ? (
                <p className="text-xs text-muted-foreground py-4 text-center">Ingen opgaver i dag</p>
              ) : tasks.map(t => (
                <div key={t.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div>
                    <p className="text-sm font-medium text-foreground">{t.task_type}</p>
                    <p className="text-xs text-muted-foreground">{(t.property as any)?.title || 'Ukendt'}</p>
                  </div>
                  <Badge variant={t.status === 'pending' ? 'secondary' : 'default'} className="text-[10px]">{t.status}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Recent agreements */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <FileSignature className="h-4 w-4 text-primary" /> Nyligt underskrevne
              </CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/admin/modtagelse" className="text-xs">Se alle <ArrowUpRight className="h-3 w-3 ml-1" /></Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-2">
              {loading ? <Skeleton className="h-20 w-full" /> : agreements.length === 0 ? (
                <p className="text-xs text-muted-foreground py-4 text-center">Ingen nye aftaler</p>
              ) : agreements.map(a => (
                <div key={a.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div>
                    <p className="text-sm font-medium text-foreground">{a.owner_name || (a.owner as any)?.full_name || 'Ukendt'}</p>
                    <p className="text-xs text-muted-foreground">{a.property_title || 'Aftale'}</p>
                  </div>
                  <Badge className="text-[10px] bg-emerald-100 text-emerald-700 border-0">Underskrevet</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Activity log */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold">Seneste aktivitet</CardTitle>
          </CardHeader>
          <CardContent>
            <ActivityLog limit={10} />
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
