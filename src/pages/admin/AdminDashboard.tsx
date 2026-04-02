import { useState, useEffect } from 'react';
import { formatDKK } from '@/lib/status-badges';
import {
  Target, MessageSquare, Calendar, ListChecks, FileSignature,
  FolderOpen, ArrowUpRight, Plus, TrendingUp,
  CheckCircle, AlertCircle, UserCheck
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { AdminPageHeader } from '@/components/admin/ui/AdminPageHeader';
import { KPICard } from '@/components/admin/ui/KPICard';
import { StatusChip } from '@/components/admin/ui/StatusChip';
import { EmptyState } from '@/components/admin/ui/EmptyState';
import { ActivityLog } from '@/components/admin/ActivityLog';
import { useAdminStats } from '@/hooks/useAdminStats';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

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
    { label: 'Kalender', href: '/admin/kalender', icon: Calendar },
  ];

  return (
    <AdminLayout>
      <div className="space-y-8">
        <AdminPageHeader
          title="Overblik"
          subtitle="Dit daglige kontrolcenter"
          actions={
            <div className="flex gap-2">
              {quickActions.map(a => (
                <Button key={a.label} variant="outline" size="sm" asChild className="gap-1.5 text-xs rounded-xl border-border/50 hover:bg-muted/30">
                  <Link to={a.href}>
                    <a.icon className="h-3.5 w-3.5" />
                    <span className="hidden md:inline">{a.label}</span>
                  </Link>
                </Button>
              ))}
            </div>
          }
        />

        {/* KPI Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statsLoading ? (
            [...Array(4)].map((_, i) => (
              <div key={i} className="rounded-xl border border-border/60 bg-card/80 p-5">
                <Skeleton className="h-3 w-20 mb-3" />
                <Skeleton className="h-7 w-16" />
              </div>
            ))
          ) : stats && (
            <>
              <KPICard title="Nye leads" value={leads.length} icon={Target} variant="gold" />
              <KPICard title="Ulæste beskeder" value={unreadCount} icon={MessageSquare} variant={unreadCount > 0 ? 'warning' : 'default'} />
              <KPICard title="Aktive sager" value={stats.activeProperties} icon={FolderOpen} variant="success" />
              <KPICard title="Omsætning" value={formatDKK(stats.platformEarnings)} icon={TrendingUp} variant="gold" />
            </>
          )}
        </div>

        {/* Main panels */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Leads */}
          <Card className="border-border/40 bg-card/60 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" /> Nye leads
              </CardTitle>
              <Button variant="ghost" size="sm" asChild className="text-xs text-muted-foreground hover:text-foreground gap-1 h-7 rounded-lg">
                <Link to="/admin/leads">Se alle <ArrowUpRight className="h-3 w-3" /></Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-1">
              {loading ? <Skeleton className="h-24 w-full rounded-lg" /> : leads.length === 0 ? (
                <EmptyState icon={Target} title="Ingen nye leads" className="py-8" />
              ) : leads.map(l => (
                <div key={l.id} className="flex items-center justify-between py-2.5 px-2 rounded-lg hover:bg-muted/20 transition-colors -mx-2">
                  <div>
                    <p className="text-sm font-medium text-foreground">{l.name}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{l.source} · {l.region || 'Ukendt'}</p>
                  </div>
                  <StatusChip label={l.status === 'new' ? 'Ny' : l.status} variant="info" dot />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Tasks today */}
          <Card className="border-border/40 bg-card/60 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <ListChecks className="h-4 w-4 text-primary" /> Opgaver i dag
              </CardTitle>
              <Button variant="ghost" size="sm" asChild className="text-xs text-muted-foreground hover:text-foreground gap-1 h-7 rounded-lg">
                <Link to="/admin/opgaver">Se alle <ArrowUpRight className="h-3 w-3" /></Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-1">
              {loading ? <Skeleton className="h-24 w-full rounded-lg" /> : tasks.length === 0 ? (
                <EmptyState icon={CheckCircle} title="Ingen opgaver i dag" description="God dag – alt er under kontrol" className="py-8" />
              ) : tasks.map(t => (
                <div key={t.id} className="flex items-center justify-between py-2.5 px-2 rounded-lg hover:bg-muted/20 transition-colors -mx-2">
                  <div>
                    <p className="text-sm font-medium text-foreground">{t.task_type}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{(t.property as any)?.title || 'Ukendt'}</p>
                  </div>
                  <StatusChip
                    label={t.status === 'pending' ? 'Afventer' : t.status === 'in_progress' ? 'I gang' : t.status}
                    variant={t.status === 'pending' ? 'muted' : 'warning'}
                    dot
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Recent agreements */}
          <Card className="border-border/40 bg-card/60 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <FileSignature className="h-4 w-4 text-primary" /> Nyligt underskrevne
              </CardTitle>
              <Button variant="ghost" size="sm" asChild className="text-xs text-muted-foreground hover:text-foreground gap-1 h-7 rounded-lg">
                <Link to="/admin/modtagelse">Se alle <ArrowUpRight className="h-3 w-3" /></Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-1">
              {loading ? <Skeleton className="h-24 w-full rounded-lg" /> : agreements.length === 0 ? (
                <EmptyState icon={FileSignature} title="Ingen nye aftaler" className="py-8" />
              ) : agreements.map(a => (
                <div key={a.id} className="flex items-center justify-between py-2.5 px-2 rounded-lg hover:bg-muted/20 transition-colors -mx-2">
                  <div>
                    <p className="text-sm font-medium text-foreground">{a.owner_name || (a.owner as any)?.full_name || 'Ukendt'}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{a.property_title || 'Aftale'}</p>
                  </div>
                  <StatusChip label="Underskrevet" variant="success" dot />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Activity log */}
        <Card className="border-border/40 bg-card/60 backdrop-blur-sm">
          <CardHeader className="pb-3">
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
