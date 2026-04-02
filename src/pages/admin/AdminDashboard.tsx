import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';
import { formatDKK } from '@/lib/status-badges';
import {
  Target, MessageSquare, Calendar, ListChecks, FileSignature,
  FolderOpen, ArrowUpRight, Plus, TrendingUp, CalendarPlus,
  CheckCircle, Clock, UserCheck, FileText, Activity
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
import { ScrollArea } from '@/components/ui/scroll-area';

const LEAD_STATUS_LABELS: Record<string, string> = {
  new: 'Modtaget', contacted: 'Kontaktet', meeting_booked: 'Møde booket',
  qualified: 'Kvalificeret', waiting: 'Afventer svar', won: 'Vundet', lost: 'Tabt',
};

const TASK_STATUS: Record<string, { label: string; variant: 'muted' | 'info' | 'warning' | 'success' | 'danger' }> = {
  not_started: { label: 'Ikke startet', variant: 'muted' },
  in_progress: { label: 'I gang', variant: 'info' },
  waiting: { label: 'Afventer', variant: 'warning' },
  done: { label: 'Færdig', variant: 'success' },
};

function SectionCard({ title, icon: Icon, linkTo, linkLabel, children, className }: {
  title: string; icon: React.ElementType; linkTo: string; linkLabel?: string;
  children: React.ReactNode; className?: string;
}) {
  return (
    <Card className={`border-border/40 bg-card/60 backdrop-blur-sm ${className || ''}`}>
      <CardHeader className="flex flex-row items-center justify-between pb-3 pt-5 px-5">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Icon className="h-4 w-4 text-primary" /> {title}
        </CardTitle>
        <Button variant="ghost" size="sm" asChild className="text-[11px] text-muted-foreground hover:text-foreground gap-1 h-7 rounded-lg px-2">
          <Link to={linkTo}>{linkLabel || 'Se alle'} <ArrowUpRight className="h-3 w-3" /></Link>
        </Button>
      </CardHeader>
      <CardContent className="px-5 pb-5">{children}</CardContent>
    </Card>
  );
}

function ListRow({ title, subtitle, chip, onClick }: {
  title: string; subtitle?: string; chip?: React.ReactNode; onClick?: () => void;
}) {
  return (
    <div
      className="flex items-center justify-between py-2.5 px-2.5 rounded-xl hover:bg-muted/20 transition-colors -mx-2 cursor-pointer"
      onClick={onClick}
    >
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground truncate">{title}</p>
        {subtitle && <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{subtitle}</p>}
      </div>
      {chip}
    </div>
  );
}

export default function AdminDashboard() {
  const { stats, loading: statsLoading } = useAdminStats();
  const [leads, setLeads] = useState<any[]>([]);
  const [allLeads, setAllLeads] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [agreements, setAgreements] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [onboarding, setOnboarding] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  useEffect(() => {
    const load = async () => {
      const [leadsRes, allLeadsRes, tasksRes, agreementsRes, msgCountRes, msgsRes, docsRes, onbRes] = await Promise.all([
        supabase.from('leads').select('*').in('status', ['new', 'contacted']).order('created_at', { ascending: false }).limit(5),
        supabase.from('leads').select('id, status'),
        supabase.from('system_tasks' as any).select('*').neq('status', 'done').order('created_at', { ascending: false }).limit(8),
        supabase.from('agreements').select('*').eq('status', 'signed').order('signed_at', { ascending: false }).limit(5),
        supabase.from('chat_messages').select('id', { count: 'exact' }).eq('is_read', false),
        supabase.from('chat_messages').select('id, message, sender_name, sender_type, created_at').order('created_at', { ascending: false }).limit(5),
        supabase.from('documents').select('id, title, document_type, created_at').order('created_at', { ascending: false }).limit(5),
        supabase.from('owner_onboarding').select('id, status, owner_id, current_step').neq('status', 'completed').limit(20),
      ]);
      setLeads(leadsRes.data || []);
      setAllLeads(allLeadsRes.data || []);
      setTasks(tasksRes.data || []);
      setAgreements(agreementsRes.data || []);
      setUnreadCount(msgCountRes.count || 0);
      setMessages(msgsRes.data || []);
      setDocuments(docsRes.data || []);
      setOnboarding(onbRes.data || []);
      setLoading(false);
    };
    load();
  }, []);

  // Pipeline counts
  const leadsByStatus = allLeads.reduce<Record<string, number>>((acc, l) => {
    acc[l.status] = (acc[l.status] || 0) + 1;
    return acc;
  }, {});

  const quickActions = [
    { label: 'Opret lead', href: '/admin/leads', icon: Target },
    { label: 'Opret sag', href: '/admin/sager', icon: FolderOpen },
    { label: 'Opret opgave', href: '/admin/opgaver', icon: ListChecks },
    { label: 'Tilføj møde', href: '/admin/kalender', icon: CalendarPlus },
  ];

  const SkeletonBlock = () => <Skeleton className="h-28 w-full rounded-xl" />;

  return (
    <AdminLayout>
      <div className="space-y-8 max-w-[1400px]">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Overblik</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {format(today, "EEEE 'd.' d. MMMM yyyy", { locale: da })}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {quickActions.map(a => (
              <Button key={a.label} variant="outline" size="sm" asChild className="gap-1.5 text-xs rounded-xl border-border/50 hover:bg-primary/5 hover:border-primary/30 transition-all">
                <Link to={a.href}>
                  <a.icon className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{a.label}</span>
                </Link>
              </Button>
            ))}
          </div>
        </div>

        {/* KPI Grid — 6 cards in 2 rows on mobile, 3+3 on md, single row on xl */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
          {statsLoading || loading ? (
            [...Array(6)].map((_, i) => (
              <div key={i} className="rounded-xl border border-border/60 bg-card/80 p-5">
                <Skeleton className="h-3 w-16 mb-3" />
                <Skeleton className="h-7 w-10" />
              </div>
            ))
          ) : (
            <>
              <KPICard title="Nye leads" value={leads.length} icon={Target} variant="gold" subtitle="Aktive" />
              <KPICard title="Møder i dag" value={tasks.filter(t => t.task_type?.toLowerCase().includes('møde') || t.task_type?.toLowerCase().includes('besøg')).length} icon={Calendar} />
              <KPICard title="Opgaver i dag" value={tasks.length} icon={ListChecks} variant={tasks.length > 0 ? 'warning' : 'default'} />
              <KPICard title="Nye beskeder" value={unreadCount} icon={MessageSquare} variant={unreadCount > 0 ? 'warning' : 'default'} />
              <KPICard title="Nye aftaler" value={agreements.length} icon={FileSignature} variant="success" subtitle="Underskrevne" />
              <KPICard title="Under klargøring" value={onboarding.length} icon={FolderOpen} variant="gold" />
            </>
          )}
        </div>

        {/* ───── ZONE 1: I dag ───── */}
        <div>
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-[0.15em] mb-4">I dag</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Today's tasks */}
            <SectionCard title="Opgaver i dag" icon={ListChecks} linkTo="/admin/opgaver">
              {loading ? <SkeletonBlock /> : tasks.length === 0 ? (
                <EmptyState icon={CheckCircle} title="Ingen opgaver i dag" description="Alt er under kontrol" className="py-8" />
              ) : (
                <div className="space-y-0.5">
                  {tasks.map(t => {
                    const st = TASK_STATUS[t.status] || TASK_STATUS.pending;
                    return (
                      <ListRow
                        key={t.id}
                        title={t.task_type}
                        subtitle={(t.property as any)?.title}
                        chip={<StatusChip label={st.label} variant={st.variant} dot />}
                      />
                    );
                  })}
                </div>
              )}
            </SectionCard>

            {/* Urgent / follow-ups — leads waiting for reply */}
            <SectionCard title="Opfølgninger" icon={Clock} linkTo="/admin/leads">
              {loading ? <SkeletonBlock /> : leads.length === 0 ? (
                <EmptyState icon={Target} title="Ingen ventende opfølgninger" className="py-8" />
              ) : (
                <div className="space-y-0.5">
                  {leads.map(l => (
                    <ListRow
                      key={l.id}
                      title={l.name}
                      subtitle={`${l.source} · ${l.region || 'Ukendt område'}`}
                      chip={<StatusChip label={LEAD_STATUS_LABELS[l.status] || l.status} variant="info" dot />}
                    />
                  ))}
                </div>
              )}
            </SectionCard>
          </div>
        </div>

        {/* ───── ZONE 2: Pipeline ───── */}
        <div>
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-[0.15em] mb-4">Pipeline</h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Leads by stage */}
            <SectionCard title="Leads pr. stadie" icon={Target} linkTo="/admin/leads">
              {loading ? <SkeletonBlock /> : allLeads.length === 0 ? (
                <EmptyState icon={Target} title="Ingen leads endnu" className="py-8" />
              ) : (
                <div className="space-y-2">
                  {Object.entries(LEAD_STATUS_LABELS).map(([key, label]) => {
                    const count = leadsByStatus[key] || 0;
                    if (count === 0) return null;
                    return (
                      <div key={key} className="flex items-center justify-between py-1.5">
                        <span className="text-sm text-foreground">{label}</span>
                        <span className="text-sm font-semibold text-foreground tabular-nums">{count}</span>
                      </div>
                    );
                  })}
                  <div className="pt-2 border-t border-border/30 flex items-center justify-between">
                    <span className="text-xs text-muted-foreground font-medium">Total</span>
                    <span className="text-sm font-bold text-foreground tabular-nums">{allLeads.length}</span>
                  </div>
                </div>
              )}
            </SectionCard>

            {/* Active cases */}
            <SectionCard title="Sager under klargøring" icon={FolderOpen} linkTo="/admin/sager">
              {loading ? <SkeletonBlock /> : (stats?.activeProperties || 0) === 0 && onboarding.length === 0 ? (
                <EmptyState icon={FolderOpen} title="Ingen aktive sager" className="py-8" />
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between py-1.5">
                    <span className="text-sm text-foreground">Publicerede</span>
                    <span className="text-sm font-semibold text-foreground tabular-nums">{stats?.activeProperties || 0}</span>
                  </div>
                  <div className="flex items-center justify-between py-1.5">
                    <span className="text-sm text-foreground">Under klargøring</span>
                    <span className="text-sm font-semibold text-foreground tabular-nums">{onboarding.length}</span>
                  </div>
                  <div className="flex items-center justify-between py-1.5">
                    <span className="text-sm text-foreground">Total ejendomme</span>
                    <span className="text-sm font-semibold text-foreground tabular-nums">{stats?.totalProperties || 0}</span>
                  </div>
                </div>
              )}
            </SectionCard>

            {/* Onboarding status */}
            <SectionCard title="Ejer-onboarding" icon={UserCheck} linkTo="/admin/crm/udlejere">
              {loading ? <SkeletonBlock /> : onboarding.length === 0 ? (
                <EmptyState icon={UserCheck} title="Ingen aktiv onboarding" className="py-8" />
              ) : (
                <div className="space-y-0.5">
                  {onboarding.slice(0, 5).map(o => (
                    <ListRow
                      key={o.id}
                      title={o.current_step || 'Startfase'}
                      subtitle={`Status: ${o.status}`}
                      chip={<StatusChip label={o.status} variant={o.status === 'active' ? 'success' : 'muted'} dot />}
                    />
                  ))}
                  {onboarding.length > 5 && (
                    <p className="text-[11px] text-muted-foreground pt-2 pl-2">+{onboarding.length - 5} mere</p>
                  )}
                </div>
              )}
            </SectionCard>
          </div>
        </div>

        {/* ───── ZONE 3: Inbox / Recent ───── */}
        <div>
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-[0.15em] mb-4">Seneste</h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Recent messages */}
            <SectionCard title="Nye beskeder" icon={MessageSquare} linkTo="/admin/beskeder">
              {loading ? <SkeletonBlock /> : messages.length === 0 ? (
                <EmptyState icon={MessageSquare} title="Ingen nye beskeder" description="Du er helt ajour" className="py-8" />
              ) : (
                <div className="space-y-0.5">
                  {messages.map(m => (
                    <ListRow
                      key={m.id}
                      title={m.sender_name || m.sender_type}
                      subtitle={m.message?.substring(0, 60) + (m.message?.length > 60 ? '...' : '')}
                      chip={
                        <span className="text-[10px] text-muted-foreground shrink-0">
                          {format(new Date(m.created_at), 'HH:mm', { locale: da })}
                        </span>
                      }
                    />
                  ))}
                </div>
              )}
            </SectionCard>

            {/* Signed agreements + latest documents */}
            <SectionCard title="Nye aftaler & dokumenter" icon={FileSignature} linkTo="/admin/modtagelse">
              {loading ? <SkeletonBlock /> : agreements.length === 0 && documents.length === 0 ? (
                <EmptyState icon={FileText} title="Intet nyt" className="py-8" />
              ) : (
                <div className="space-y-0.5">
                  {agreements.slice(0, 3).map(a => (
                    <ListRow
                      key={a.id}
                      title={a.owner_name || 'Ukendt ejer'}
                      subtitle={a.property_title || 'Formidlingsaftale'}
                      chip={<StatusChip label="Underskrevet" variant="success" dot size="sm" />}
                    />
                  ))}
                  {documents.slice(0, 2).map(d => (
                    <ListRow
                      key={d.id}
                      title={d.title}
                      subtitle={d.document_type}
                      chip={
                        <span className="text-[10px] text-muted-foreground">
                          {format(new Date(d.created_at), 'd. MMM', { locale: da })}
                        </span>
                      }
                    />
                  ))}
                </div>
              )}
            </SectionCard>

            {/* Activity timeline */}
            <SectionCard title="Aktivitetslog" icon={Activity} linkTo="/admin/indstillinger">
              <ActivityLog limit={6} />
            </SectionCard>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
