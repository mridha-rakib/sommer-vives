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
import { useTranslation } from '@/lib/i18n';

const LEAD_STATUS_KEYS: Record<string, string> = {
  new: 'admin.lead.status.new', contacted: 'admin.lead.status.contacted',
  meeting_booked: 'admin.lead.status.meeting_booked', qualified: 'admin.lead.status.qualified',
  waiting: 'admin.lead.status.waiting', won: 'admin.lead.status.won', lost: 'admin.lead.status.lost',
};

const TASK_STATUS_KEYS: Record<string, { key: string; variant: 'muted' | 'info' | 'warning' | 'success' | 'danger' }> = {
  not_started: { key: 'admin.task.status.not_started', variant: 'muted' },
  in_progress: { key: 'admin.task.status.in_progress', variant: 'info' },
  waiting: { key: 'admin.task.status.waiting', variant: 'warning' },
  done: { key: 'admin.task.status.done', variant: 'success' },
};

function getPercentTrend(rows: any[], dateField: string, today: Date) {
  const currentStart = new Date(today);
  currentStart.setDate(currentStart.getDate() - 30);
  const previousStart = new Date(today);
  previousStart.setDate(previousStart.getDate() - 60);

  const current = rows.filter(row => {
    const value = row?.[dateField];
    if (!value) return false;
    const date = new Date(value);
    return date >= currentStart && date <= today;
  }).length;
  const previous = rows.filter(row => {
    const value = row?.[dateField];
    if (!value) return false;
    const date = new Date(value);
    return date >= previousStart && date < currentStart;
  }).length;

  if (current === 0 && previous === 0) return undefined;
  const value = previous === 0 ? 100 : Math.round(((current - previous) / previous) * 100);
  return { value, positive: value >= 0 };
}

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
  const { t } = useTranslation();
  const { stats, loading: statsLoading } = useAdminStats();
  const [leads, setLeads] = useState<any[]>([]);
  const [allLeads, setAllLeads] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [allTasks, setAllTasks] = useState<any[]>([]);
  const [agreements, setAgreements] = useState<any[]>([]);
  const [allAgreements, setAllAgreements] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [onboarding, setOnboarding] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  useEffect(() => {
    const load = async () => {
      const [leadsRes, allLeadsRes, tasksRes, allTasksRes, agreementsRes, allAgreementsRes, msgCountRes, msgsRes, docsRes, onbRes] = await Promise.all([
        supabase.from('leads').select('*').in('status', ['new', 'contacted']).order('created_at', { ascending: false }).limit(5),
        supabase.from('leads').select('id, status, created_at'),
        supabase.from('system_tasks' as any).select('*').neq('status', 'done').order('created_at', { ascending: false }).limit(8),
        supabase.from('system_tasks' as any).select('id, status, priority, created_at').neq('status', 'done'),
        supabase.from('agreements').select('*').eq('status', 'signed').order('signed_at', { ascending: false }).limit(5),
        supabase.from('agreements').select('id, status, signed_at, created_at').eq('status', 'signed'),
        supabase.from('chat_messages').select('id', { count: 'exact' }).eq('is_read', false),
        supabase.from('chat_messages').select('id, message, sender_name, sender_type, created_at').order('created_at', { ascending: false }).limit(5),
        supabase.from('documents').select('id, title, document_type, created_at').order('created_at', { ascending: false }).limit(5),
        supabase.from('owner_onboarding').select('id, status, owner_id, current_step, created_at').neq('status', 'completed'),
      ]);
      setLeads(leadsRes.data || []);
      setAllLeads(allLeadsRes.data || []);
      setTasks(tasksRes.data || []);
      setAllTasks(allTasksRes.data || []);
      setAgreements(agreementsRes.data || []);
      setAllAgreements(allAgreementsRes.data || []);
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
  const activeLeadCount = allLeads.filter(l => l.status === 'new' || l.status === 'contacted').length;
  const urgentTaskCount = allTasks.filter(t => t.priority === 'urgent' || t.priority === 'high').length;
  const leadTrend = getPercentTrend(allLeads.filter(l => l.status === 'new' || l.status === 'contacted'), 'created_at', today);
  const taskTrend = getPercentTrend(allTasks, 'created_at', today);
  const agreementTrend = getPercentTrend(allAgreements, 'signed_at', today);
  const onboardingTrend = getPercentTrend(onboarding, 'created_at', today);

  const quickActions = [
    { label: t('admin.quickAction.createLead'), href: '/admin/leads', icon: Target },
    { label: t('admin.quickAction.createCase'), href: '/admin/sager', icon: FolderOpen },
    { label: t('admin.quickAction.createTask'), href: '/admin/opgaver', icon: ListChecks },
    { label: t('admin.quickAction.addMeeting'), href: '/admin/kalender', icon: CalendarPlus },
  ];

  const SkeletonBlock = () => <Skeleton className="h-28 w-full rounded-xl" />;

  return (
    <AdminLayout>
      <div className="space-y-8 max-w-[1400px]">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">{t('admin.dashboard.title')}</h1>
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
              <KPICard title={t('admin.dashboard.kpi.newLeads')} value={activeLeadCount} icon={Target} variant="gold" subtitle={t('admin.common.30days')} trend={leadTrend} />
              <KPICard title={t('admin.dashboard.kpi.activeTasks')} value={allTasks.length} icon={ListChecks} variant={allTasks.length > 0 ? 'warning' : 'default'} subtitle={t('admin.common.30days')} trend={taskTrend} />
              <KPICard title={t('admin.dashboard.kpi.urgent')} value={urgentTaskCount} icon={Calendar} variant={urgentTaskCount > 0 ? 'warning' : 'default'} />
              <KPICard title={t('admin.dashboard.kpi.newMessages')} value={unreadCount} icon={MessageSquare} variant={unreadCount > 0 ? 'warning' : 'default'} />
              <KPICard title={t('admin.dashboard.kpi.newAgreements')} value={allAgreements.length} icon={FileSignature} variant="success" subtitle={t('admin.common.30days')} trend={agreementTrend} />
              <KPICard title={t('admin.dashboard.kpi.inPrep')} value={onboarding.length} icon={FolderOpen} variant="gold" subtitle={t('admin.common.30days')} trend={onboardingTrend} />
            </>
          )}
        </div>

        {/* ───── ZONE 1: I dag ───── */}
        <div>
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-[0.15em] mb-4">{t('admin.dashboard.section.today')}</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Today's tasks */}
            <SectionCard title={t('admin.dashboard.todayTasks')} icon={ListChecks} linkTo="/admin/opgaver">
              {loading ? <SkeletonBlock /> : tasks.length === 0 ? (
                <EmptyState icon={CheckCircle} title={t('admin.dashboard.noTasksToday')} description={t('admin.dashboard.allUnderControl')} className="py-8" />
              ) : (
                <div className="space-y-0.5">
                  {tasks.map(task => {
                    const st = TASK_STATUS_KEYS[task.status] || TASK_STATUS_KEYS.not_started;
                    return (
                      <ListRow
                        key={task.id}
                        title={task.title}
                        subtitle={task.linked_name || task.description?.slice(0, 50) || undefined}
                        chip={<StatusChip label={t(st.key)} variant={st.variant} dot />}
                      />
                    );
                  })}
                </div>
              )}
            </SectionCard>

            {/* Urgent / follow-ups — leads waiting for reply */}
            <SectionCard title={t('admin.dashboard.followUps')} icon={Clock} linkTo="/admin/leads">
              {loading ? <SkeletonBlock /> : leads.length === 0 ? (
                <EmptyState icon={Target} title={t('admin.dashboard.noPendingFollowUps')} className="py-8" />
              ) : (
                <div className="space-y-0.5">
                  {leads.map(l => (
                    <ListRow
                      key={l.id}
                      title={l.name}
                      subtitle={`${l.source} · ${l.region || t('admin.dashboard.unknownArea')}`}
                      chip={<StatusChip label={t(LEAD_STATUS_KEYS[l.status] || l.status)} variant="info" dot />}
                    />
                  ))}
                </div>
              )}
            </SectionCard>
          </div>
        </div>

        {/* ───── ZONE 2: Pipeline ───── */}
        <div>
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-[0.15em] mb-4">{t('admin.dashboard.section.pipeline')}</h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Leads by stage */}
            <SectionCard title={t('admin.dashboard.leadsByStage')} icon={Target} linkTo="/admin/leads">
              {loading ? <SkeletonBlock /> : allLeads.length === 0 ? (
                <EmptyState icon={Target} title={t('admin.dashboard.noLeadsYet')} className="py-8" />
              ) : (
                <div className="space-y-2">
                  {Object.entries(LEAD_STATUS_KEYS).map(([key, tKey]) => {
                    const count = leadsByStatus[key] || 0;
                    if (count === 0) return null;
                    return (
                      <div key={key} className="flex items-center justify-between py-1.5">
                        <span className="text-sm text-foreground">{t(tKey)}</span>
                        <span className="text-sm font-semibold text-foreground tabular-nums">{count}</span>
                      </div>
                    );
                  })}
                  <div className="pt-2 border-t border-border/30 flex items-center justify-between">
                    <span className="text-xs text-muted-foreground font-medium">{t('admin.common.total')}</span>
                    <span className="text-sm font-bold text-foreground tabular-nums">{allLeads.length}</span>
                  </div>
                </div>
              )}
            </SectionCard>

            {/* Active cases */}
            <SectionCard title={t('admin.dashboard.casesInPrep')} icon={FolderOpen} linkTo="/admin/sager">
              {loading ? <SkeletonBlock /> : (stats?.activeProperties || 0) === 0 && onboarding.length === 0 ? (
                <EmptyState icon={FolderOpen} title={t('admin.dashboard.noActiveCases')} className="py-8" />
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between py-1.5">
                    <span className="text-sm text-foreground">{t('admin.dashboard.published')}</span>
                    <span className="text-sm font-semibold text-foreground tabular-nums">{stats?.activeProperties || 0}</span>
                  </div>
                  <div className="flex items-center justify-between py-1.5">
                    <span className="text-sm text-foreground">{t('admin.dashboard.inPrep')}</span>
                    <span className="text-sm font-semibold text-foreground tabular-nums">{onboarding.length}</span>
                  </div>
                  <div className="flex items-center justify-between py-1.5">
                    <span className="text-sm text-foreground">{t('admin.dashboard.totalProperties')}</span>
                    <span className="text-sm font-semibold text-foreground tabular-nums">{stats?.totalProperties || 0}</span>
                  </div>
                </div>
              )}
            </SectionCard>

            {/* Onboarding status */}
            <SectionCard title={t('admin.dashboard.ownerOnboarding')} icon={UserCheck} linkTo="/admin/crm/udlejere">
              {loading ? <SkeletonBlock /> : onboarding.length === 0 ? (
                <EmptyState icon={UserCheck} title={t('admin.dashboard.noActiveOnboarding')} className="py-8" />
              ) : (
                <div className="space-y-0.5">
                  {onboarding.slice(0, 5).map(o => (
                    <ListRow
                      key={o.id}
                      title={o.current_step || t('admin.dashboard.startPhase')}
                      subtitle={`Status: ${o.status}`}
                      chip={<StatusChip label={o.status} variant={o.status === 'active' ? 'success' : 'muted'} dot />}
                    />
                  ))}
                  {onboarding.length > 5 && (
                    <p className="text-[11px] text-muted-foreground pt-2 pl-2">{t('admin.dashboard.moreItems').replace('{count}', String(onboarding.length - 5))}</p>
                  )}
                </div>
              )}
            </SectionCard>
          </div>
        </div>

        {/* ───── ZONE 3: Inbox / Recent ───── */}
        <div>
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-[0.15em] mb-4">{t('admin.dashboard.section.recent')}</h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Recent messages */}
            <SectionCard title={t('admin.dashboard.newMessages')} icon={MessageSquare} linkTo="/admin/beskeder">
              {loading ? <SkeletonBlock /> : messages.length === 0 ? (
                <EmptyState icon={MessageSquare} title={t('admin.dashboard.noNewMessages')} description={t('admin.dashboard.upToDate')} className="py-8" />
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
            <SectionCard title={t('admin.dashboard.newAgreementsAndDocs')} icon={FileSignature} linkTo="/admin/modtagelse">
              {loading ? <SkeletonBlock /> : agreements.length === 0 && documents.length === 0 ? (
                <EmptyState icon={FileText} title={t('admin.dashboard.nothingNew')} className="py-8" />
              ) : (
                <div className="space-y-0.5">
                  {agreements.slice(0, 3).map(a => (
                    <ListRow
                      key={a.id}
                      title={a.owner_name || t('admin.common.unknown')}
                      subtitle={a.property_title || 'Formidlingsaftale'}
                      chip={<StatusChip label={t('admin.dashboard.signed')} variant="success" dot size="sm" />}
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
            <SectionCard title={t('admin.dashboard.activityLog')} icon={Activity} linkTo="/admin/indstillinger">
              <ActivityLog limit={6} />
            </SectionCard>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
