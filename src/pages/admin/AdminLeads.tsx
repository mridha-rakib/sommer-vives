import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { ProfilePopover } from '@/components/admin/ProfilePopover';
import { da } from 'date-fns/locale';
import {
  Search, Plus, Target, Phone, Mail, MapPin, CalendarDays,
  MoreHorizontal, ArrowRight, LayoutGrid, List, X,
  PhoneCall, Send, ListChecks, CalendarPlus, UserCheck, Ban,
  ChevronRight
} from 'lucide-react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { AdminPageHeader } from '@/components/admin/ui/AdminPageHeader';
import { StatusChip } from '@/components/admin/ui/StatusChip';
import { EmptyState } from '@/components/admin/ui/EmptyState';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';

type SVariant = 'info' | 'warning' | 'success' | 'muted' | 'danger';

const PIPELINE_STATUSES = ['new', 'contacted', 'waiting', 'won', 'lost'] as const;

const STATUS_META: Record<string, { variant: SVariant; color: string }> = {
  new:       { variant: 'info',    color: 'border-t-blue-500/60' },
  contacted: { variant: 'warning', color: 'border-t-amber-500/60' },
  waiting:   { variant: 'muted',   color: 'border-t-slate-400/40' },
  won:       { variant: 'success', color: 'border-t-emerald-500/60' },
  lost:      { variant: 'danger',  color: 'border-t-red-500/40' },
};

const SOURCE_KEYS = [
  'beregn_lejeindtaegt', 'udlejningstjek', 'vil_udleje', 'pricing_get_started',
  'website_onboarding', 'contact', 'website', 'referral', 'social', 'phone', 'partner', 'other',
];

const defaultForm = { name: '', email: '', phone: '', source: 'contact', region: '', property_type: '', notes: '', assigned_to: '', next_step: '', status: 'new' };

export default function AdminLeads() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [view, setView] = useState<'board' | 'list'>('board');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [drawerLead, setDrawerLead] = useState<any | null>(null);
  const [dragStatus, setDragStatus] = useState<string | null>(null);

  const statusLabel = (s: string) => t(`admin.leads.status.${s}`);
  const sourceLabel = (s: string) => t(`admin.leads.source.${s}`);

  const load = useCallback(async () => {
    setLoading(true);
    let q = supabase.from('leads').select('*').order('created_at', { ascending: false });
    if (search) q = q.or(`name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%,region.ilike.%${search}%`);
    if (sourceFilter !== 'all') q = q.eq('source', sourceFilter);
    const { data } = await q;
    setLeads(data || []);
    setLoading(false);
  }, [search, sourceFilter]);

  useEffect(() => { load(); }, [sourceFilter]);
  useEffect(() => { const tm = setTimeout(load, 300); return () => clearTimeout(tm); }, [search]);

  const openNew = () => { setEditing(null); setForm(defaultForm); setDialogOpen(true); };
  const openEdit = (lead: any) => {
    setEditing(lead);
    setForm({ name: lead.name, email: lead.email || '', phone: lead.phone || '', source: lead.source, region: lead.region || '', property_type: lead.property_type || '', notes: lead.notes || '', assigned_to: lead.assigned_to || '', next_step: lead.next_step || '', status: lead.status });
    setDialogOpen(true);
  };

  const save = async () => {
    if (!form.name.trim()) { toast.error(t('admin.leads.toast.nameRequired')); return; }
    if (editing) {
      const { error } = await supabase.from('leads').update(form).eq('id', editing.id);
      if (error) { toast.error(error.message); return; }
      toast.success(t('admin.leads.toast.updated'));
    } else {
      const { error } = await supabase.from('leads').insert(form);
      if (error) { toast.error(error.message); return; }
      toast.success(t('admin.leads.toast.created'));
    }
    setDialogOpen(false);
    load();
  };

  const updateStatus = async (id: string, status: string) => {
    await supabase.from('leads').update({ status }).eq('id', id);
    toast.success(`${t('admin.leads.toast.statusChanged')} ${statusLabel(status)}`);
    if (drawerLead?.id === id) setDrawerLead((prev: any) => prev ? { ...prev, status } : null);
    load();
  };

  const convertToOwner = async (lead: any) => {
    if (!lead.email) { toast.error(t('admin.leads.convert.missingEmail')); return; }

    const toastId = toast.loading(`${t('admin.leads.convert.converting')} ${lead.name} ${t('admin.leads.convert.toCase')}…`);

    try {
      const { data: property, error: propErr } = await supabase.from('properties').insert({
        title: `${lead.name} — ${t('admin.leads.convert.newProperty')}`,
        address: lead.region || t('admin.leads.convert.notSpecified'),
        region: lead.region || t('admin.leads.convert.notSpecified'),
        owner_id: '00000000-0000-0000-0000-000000000000',
        status: 'draft',
        setup_status: 'new',
      }).select('id, case_number').single();

      if (propErr) throw propErr;

      const slug = `${lead.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '')}-${Date.now()}`;
      const { error: listErr } = await supabase.from('listings').insert({
        name: `${lead.name} — ${t('admin.leads.convert.newProperty')}`,
        slug,
        owner_id: '00000000-0000-0000-0000-000000000000',
        internal_status: 'udlejningstjek',
        is_active: false,
        address: lead.region || null,
        region: lead.region || null,
        property_type: lead.property_type || null,
        internal_notes: `Lead: ${lead.name}\nEmail: ${lead.email}\nPhone: ${lead.phone || '—'}\nSource: ${lead.source}\n\n${lead.notes || ''}`,
      });

      if (listErr) throw listErr;

      await supabase.from('leads').update({
        status: 'won',
        notes: [
          lead.notes,
          `\n--- ${t('admin.leads.convert.convertedOn')} ${new Date().toLocaleDateString()} ---`,
          `${t('admin.leads.convert.caseCreated')}: ${property.case_number || property.id}`,
        ].filter(Boolean).join('\n'),
      }).eq('id', lead.id);

      toast.success(`${lead.name} ${t('admin.leads.convert.converted')}`, { id: toastId });
      setDrawerLead(null);
      load();
    } catch (err: any) {
      console.error('Convert error:', err);
      toast.error(`${t('admin.leads.convert.error')}: ${err.message}`, { id: toastId });
    }
  };

  const onDragStart = (e: React.DragEvent, leadId: string) => {
    e.dataTransfer.setData('leadId', leadId);
    e.dataTransfer.effectAllowed = 'move';
  };
  const onDragOver = (e: React.DragEvent, status: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragStatus(status);
  };
  const onDrop = async (e: React.DragEvent, status: string) => {
    e.preventDefault();
    setDragStatus(null);
    const leadId = e.dataTransfer.getData('leadId');
    if (leadId) await updateStatus(leadId, status);
  };

  const activePipelineLeads = leads.filter(l => PIPELINE_STATUSES.includes(l.status as any));
  const leadsForColumn = (status: string) => activePipelineLeads.filter(l => l.status === status);

  const LeadPipelineCard = ({ lead }: { lead: any }) => {
    const st = STATUS_META[lead.status];
    return (
      <div
        draggable
        onDragStart={(e) => onDragStart(e, lead.id)}
        onClick={() => setDrawerLead(lead)}
        className={cn(
          'rounded-xl border border-border/40 bg-card/80 backdrop-blur-sm p-3.5 cursor-pointer',
          'hover:border-border/60 hover:shadow-md transition-all group border-t-2',
          st?.color || ''
        )}
      >
        <div className="flex items-start justify-between mb-2">
          <ProfilePopover type="lead" id={lead.id} data={lead} onOpenDetail={() => setDrawerLead(lead)}>
            <h4 className="text-sm font-semibold text-foreground truncate flex-1 hover:text-primary transition-colors cursor-pointer" onClick={e => e.stopPropagation()}>{lead.name}</h4>
          </ProfilePopover>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6 rounded-md opacity-0 group-hover:opacity-100 transition-opacity shrink-0 -mr-1" onClick={e => e.stopPropagation()}>
                <MoreHorizontal className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openEdit(lead); }}>{t('admin.leads.action.edit')}</DropdownMenuItem>
              <DropdownMenuSeparator />
              {PIPELINE_STATUSES.filter(s => s !== lead.status).map(s => (
                <DropdownMenuItem key={s} onClick={(e) => { e.stopPropagation(); updateStatus(lead.id, s); }}>
                  <ArrowRight className="h-3 w-3 mr-2" />{statusLabel(s)}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-400 focus:text-red-400" onClick={async (e) => {
                e.stopPropagation();
                if (!confirm(`${t('admin.leads.confirm.delete')} "${lead.name}"?`)) return;
                await supabase.from('leads').delete().eq('id', lead.id);
                toast.success(t('admin.leads.toast.deleted'));
                load();
              }}>
                <X className="h-3 w-3 mr-2" />{t('admin.leads.action.delete')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {lead.region && (
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mb-1.5">
            <MapPin className="h-3 w-3 shrink-0" />{lead.region}
          </div>
        )}
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mb-1.5">
          <Target className="h-3 w-3 shrink-0" />{sourceLabel(lead.source)}
        </div>
        {lead.phone && (
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mb-1.5">
            <Phone className="h-3 w-3 shrink-0" />{lead.phone}
          </div>
        )}
        {lead.next_step && (
          <div className="flex items-center gap-1.5 text-[11px] text-primary font-medium mt-2 pt-2 border-t border-border/30">
            <ChevronRight className="h-3 w-3 shrink-0" />{lead.next_step}
          </div>
        )}
        <div className="text-[10px] text-muted-foreground/60 mt-2">
          {format(new Date(lead.created_at), 'd. MMM yyyy', { locale: da })}
        </div>
      </div>
    );
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <AdminPageHeader
          title={t('admin.leads.title')}
          subtitle={`${leads.length} ${t('admin.leads.subtitle')}`}
          actions={
            <div className="flex items-center gap-2">
              <div className="flex items-center rounded-xl border border-border/40 overflow-hidden">
                <button onClick={() => setView('board')} className={cn('px-3 py-1.5 text-xs font-medium flex items-center gap-1.5 transition-all', view === 'board' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground')}>
                  <LayoutGrid className="h-3.5 w-3.5" />{t('admin.leads.view.pipeline')}
                </button>
                <button onClick={() => setView('list')} className={cn('px-3 py-1.5 text-xs font-medium flex items-center gap-1.5 transition-all border-l border-border/40', view === 'list' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground')}>
                  <List className="h-3.5 w-3.5" />{t('admin.leads.view.list')}
                </button>
              </div>
              <Button onClick={openNew} size="sm" className="gap-1.5 rounded-xl">
                <Plus className="h-3.5 w-3.5" />{t('admin.leads.new')}
              </Button>
            </div>
          }
        />

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder={t('admin.leads.search.placeholder')} value={search} onChange={e => setSearch(e.target.value)} className="pl-9 rounded-xl bg-card/60 border-border/40" />
          </div>
          <Select value={sourceFilter} onValueChange={setSourceFilter}>
            <SelectTrigger className="w-48 rounded-xl bg-card/60 border-border/40 text-xs">
              <SelectValue placeholder={t('admin.leads.filter.allSources')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('admin.leads.filter.allSources')}</SelectItem>
              {SOURCE_KEYS.map(k => <SelectItem key={k} value={k}>{sourceLabel(k)}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="grid grid-cols-5 gap-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="h-6 w-24 rounded-lg" />
                {[...Array(3)].map((_, j) => <Skeleton key={j} className="h-32 w-full rounded-xl" />)}
              </div>
            ))}
          </div>
        ) : view === 'board' ? (
          <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4 items-start">
            {PIPELINE_STATUSES.map(status => {
              const st = STATUS_META[status];
              const columnLeads = leadsForColumn(status);
              return (
                <div
                  key={status}
                  onDragOver={(e) => onDragOver(e, status)}
                  onDragLeave={() => setDragStatus(null)}
                  onDrop={(e) => onDrop(e, status)}
                  className={cn(
                    'rounded-2xl border border-border/30 bg-muted/10 transition-all min-h-[200px]',
                    dragStatus === status && 'border-primary/40 bg-primary/5 shadow-lg shadow-primary/5'
                  )}
                >
                  <div className="px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <StatusChip label={statusLabel(status)} variant={st.variant} dot size="md" />
                    </div>
                    <span className="text-xs font-bold text-muted-foreground tabular-nums bg-muted/40 px-2 py-0.5 rounded-md">
                      {columnLeads.length}
                    </span>
                  </div>

                  <div className="px-2 pb-3 space-y-2">
                    {columnLeads.length === 0 ? (
                      <div className="py-8 text-center">
                        <p className="text-[11px] text-muted-foreground/50">{t('admin.leads.column.empty')}</p>
                      </div>
                    ) : columnLeads.map(lead => (
                      <LeadPipelineCard key={lead.id} lead={lead} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <Card className="border-border/40 bg-card/60 backdrop-blur-sm overflow-hidden">
            <CardContent className="p-0">
              {leads.length === 0 ? (
                <EmptyState icon={Target} title={t('admin.leads.empty.title')} description={t('admin.leads.empty.subtitle')} />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border/40">
                        {[t('admin.leads.table.name'), t('admin.leads.table.contact'), t('admin.leads.table.source'), t('admin.leads.table.region'), t('admin.leads.table.status'), t('admin.leads.table.nextStep'), t('admin.leads.table.date'), ''].map((h, i) => (
                          <th key={i} className="px-4 py-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {leads.map(l => {
                        const st = STATUS_META[l.status];
                        return (
                          <tr key={l.id} className="border-b border-border/20 hover:bg-muted/15 transition-colors cursor-pointer" onClick={() => setDrawerLead(l)}>
                            <td className="px-4 py-3">
                              <ProfilePopover type="lead" id={l.id} data={l} onOpenDetail={() => setDrawerLead(l)}>
                                <p className="font-medium text-foreground hover:text-primary transition-colors cursor-pointer inline" onClick={e => e.stopPropagation()}>{l.name}</p>
                              </ProfilePopover>
                            </td>
                            <td className="px-4 py-3">
                              <div className="space-y-0.5">
                                {l.email && <div className="flex items-center gap-1 text-[11px] text-muted-foreground"><Mail className="w-3 h-3" />{l.email}</div>}
                                {l.phone && <div className="flex items-center gap-1 text-[11px] text-muted-foreground"><Phone className="w-3 h-3" />{l.phone}</div>}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-xs text-muted-foreground">{sourceLabel(l.source)}</td>
                            <td className="px-4 py-3 text-xs text-muted-foreground">{l.region || '—'}</td>
                            <td className="px-4 py-3"><StatusChip label={statusLabel(l.status)} variant={st?.variant || 'muted'} dot /></td>
                            <td className="px-4 py-3 text-xs text-muted-foreground max-w-[120px] truncate">{l.next_step || '—'}</td>
                            <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{format(new Date(l.created_at), 'd. MMM', { locale: da })}</td>
                            <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg"><MoreHorizontal className="h-4 w-4" /></Button>
                                </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="w-44">
                                    <DropdownMenuItem onClick={() => openEdit(l)}>{t('admin.leads.action.edit')}</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setDrawerLead(l)}>{t('admin.leads.action.details')}</DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    {PIPELINE_STATUSES.filter(s => s !== l.status).map(s => (
                                      <DropdownMenuItem key={s} onClick={() => updateStatus(l.id, s)}>
                                        <ArrowRight className="h-3 w-3 mr-2" />{statusLabel(s)}
                                      </DropdownMenuItem>
                                    ))}
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem className="text-red-400 focus:text-red-400" onClick={async () => {
                                      if (!confirm(`${t('admin.leads.confirm.delete')} "${l.name}"?`)) return;
                                      await supabase.from('leads').delete().eq('id', l.id);
                                      toast.success(t('admin.leads.toast.deleted'));
                                      load();
                                    }}>
                                      <X className="h-3 w-3 mr-2" />{t('admin.leads.action.delete')}
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                              </DropdownMenu>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      <Sheet open={!!drawerLead} onOpenChange={(open) => { if (!open) setDrawerLead(null); }}>
        <SheetContent className="w-full sm:max-w-lg p-0 border-l border-border/40 bg-background">
          {drawerLead && (() => {
            const st = STATUS_META[drawerLead.status];
            return (
              <div className="flex flex-col h-full">
                <div className="px-6 pt-6 pb-4 border-b border-border/30">
                  <SheetHeader className="mb-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <SheetTitle className="text-lg font-bold text-foreground">{drawerLead.name}</SheetTitle>
                        <div className="flex items-center gap-2 mt-1.5">
                          <StatusChip label={statusLabel(drawerLead.status)} variant={st?.variant || 'muted'} dot size="md" />
                          <span className="text-[11px] text-muted-foreground">·</span>
                          <span className="text-[11px] text-muted-foreground">{sourceLabel(drawerLead.source)}</span>
                        </div>
                      </div>
                    </div>
                  </SheetHeader>
                </div>

                <ScrollArea className="flex-1">
                  <div className="px-6 py-5 space-y-6">
                    <div>
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.15em] mb-3">{t('admin.leads.section.actions')}</p>
                      <div className="grid grid-cols-3 gap-2">
                        {drawerLead.phone && (
                          <a href={`tel:${drawerLead.phone}`} className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-border/40 bg-card/60 hover:bg-muted/30 transition-all cursor-pointer text-center">
                            <PhoneCall className="h-4 w-4 text-primary" />
                            <span className="text-[11px] font-medium text-foreground">{t('admin.leads.action.call')}</span>
                          </a>
                        )}
                        {drawerLead.email && (
                          <a href={`mailto:${drawerLead.email}`} className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-border/40 bg-card/60 hover:bg-muted/30 transition-all cursor-pointer text-center">
                            <Send className="h-4 w-4 text-primary" />
                            <span className="text-[11px] font-medium text-foreground">{t('admin.leads.action.sendMail')}</span>
                          </a>
                        )}
                        <button className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-border/40 bg-card/60 hover:bg-muted/30 transition-all cursor-pointer text-center">
                          <ListChecks className="h-4 w-4 text-primary" />
                          <span className="text-[11px] font-medium text-foreground">{t('admin.leads.action.task')}</span>
                        </button>
                        <button className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-border/40 bg-card/60 hover:bg-muted/30 transition-all cursor-pointer text-center">
                          <CalendarPlus className="h-4 w-4 text-primary" />
                          <span className="text-[11px] font-medium text-foreground">{t('admin.leads.action.bookMeeting')}</span>
                        </button>
                        {drawerLead.status !== 'won' && (
                          <button onClick={() => convertToOwner(drawerLead)} className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10 transition-all cursor-pointer text-center">
                            <UserCheck className="h-4 w-4 text-emerald-400" />
                            <span className="text-[11px] font-medium text-emerald-400">{t('admin.leads.action.convert')}</span>
                          </button>
                        )}
                        {drawerLead.status !== 'lost' && (
                          <button onClick={() => updateStatus(drawerLead.id, 'lost')} className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 transition-all cursor-pointer text-center">
                            <Ban className="h-4 w-4 text-red-400" />
                            <span className="text-[11px] font-medium text-red-400">{t('admin.leads.action.markLost')}</span>
                          </button>
                        )}
                      </div>
                    </div>

                    <Separator className="bg-border/30" />

                    <div>
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.15em] mb-3">{t('admin.leads.section.contact')}</p>
                      <div className="space-y-2.5">
                        {drawerLead.email && (
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-muted/30 flex items-center justify-center shrink-0"><Mail className="h-3.5 w-3.5 text-muted-foreground" /></div>
                            <div><p className="text-xs text-muted-foreground">{t('admin.leads.field.email')}</p><p className="text-sm font-medium text-foreground">{drawerLead.email}</p></div>
                          </div>
                        )}
                        {drawerLead.phone && (
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-muted/30 flex items-center justify-center shrink-0"><Phone className="h-3.5 w-3.5 text-muted-foreground" /></div>
                            <div><p className="text-xs text-muted-foreground">{t('admin.leads.field.phone')}</p><p className="text-sm font-medium text-foreground">{drawerLead.phone}</p></div>
                          </div>
                        )}
                        {drawerLead.region && (
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-muted/30 flex items-center justify-center shrink-0"><MapPin className="h-3.5 w-3.5 text-muted-foreground" /></div>
                            <div><p className="text-xs text-muted-foreground">{t('admin.leads.field.region')}</p><p className="text-sm font-medium text-foreground">{drawerLead.region}</p></div>
                          </div>
                        )}
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-muted/30 flex items-center justify-center shrink-0"><Target className="h-3.5 w-3.5 text-muted-foreground" /></div>
                          <div><p className="text-xs text-muted-foreground">{t('admin.leads.field.source')}</p><p className="text-sm font-medium text-foreground">{sourceLabel(drawerLead.source)}</p></div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-muted/30 flex items-center justify-center shrink-0"><CalendarDays className="h-3.5 w-3.5 text-muted-foreground" /></div>
                          <div><p className="text-xs text-muted-foreground">{t('admin.leads.field.created')}</p><p className="text-sm font-medium text-foreground">{format(new Date(drawerLead.created_at), 'd MMM yyyy, HH:mm')}</p></div>
                        </div>
                      </div>
                    </div>

                    <Separator className="bg-border/30" />

                    <div>
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.15em] mb-3">{t('admin.leads.section.nextStep')}</p>
                      {drawerLead.next_step ? (
                        <div className="rounded-xl border border-primary/20 bg-primary/5 p-3.5">
                          <div className="flex items-center gap-2">
                            <ChevronRight className="h-4 w-4 text-primary shrink-0" />
                            <p className="text-sm font-medium text-foreground">{drawerLead.next_step}</p>
                          </div>
                          {drawerLead.next_step_date && (
                            <p className="text-[11px] text-muted-foreground mt-1.5 ml-6">
                              {format(new Date(drawerLead.next_step_date), 'd MMMM yyyy')}
                            </p>
                          )}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground/60 italic">{t('admin.leads.empty.noNextStep')}</p>
                      )}
                    </div>

                    <Separator className="bg-border/30" />

                    <div>
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.15em] mb-3">{t('admin.leads.section.notes')}</p>
                      {drawerLead.notes ? (
                        <div className="rounded-xl bg-muted/15 border border-border/30 p-3.5">
                          <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{drawerLead.notes}</p>
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground/60 italic">{t('admin.leads.empty.noNotes')}</p>
                      )}
                    </div>

                    <Separator className="bg-border/30" />

                    <div>
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.15em] mb-3">{t('admin.leads.section.moveStatus')}</p>
                      <div className="flex flex-wrap gap-2">
                        {PIPELINE_STATUSES.map(s => {
                          const isCurrent = drawerLead.status === s;
                          return (
                            <button
                              key={s}
                              disabled={isCurrent}
                              onClick={() => updateStatus(drawerLead.id, s)}
                              className={cn(
                                'px-3 py-1.5 rounded-lg text-xs font-medium transition-all border',
                                isCurrent
                                  ? 'bg-primary/10 text-primary border-primary/20 cursor-default'
                                  : 'text-muted-foreground border-border/30 hover:bg-muted/20 hover:text-foreground'
                              )}
                            >
                              {statusLabel(s)}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="pt-2">
                      <div className="flex items-center gap-4 text-[11px] text-muted-foreground/50">
                        {drawerLead.assigned_to && <span>{t('admin.leads.meta.assigned')}: {drawerLead.assigned_to}</span>}
                        {drawerLead.property_type && <span>{t('admin.leads.meta.type')}: {drawerLead.property_type}</span>}
                      </div>
                    </div>
                  </div>
                </ScrollArea>

                <div className="px-6 py-4 border-t border-border/30 space-y-2">
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="rounded-xl flex-1" onClick={() => { setDrawerLead(null); openEdit(drawerLead); }}>
                      {t('admin.leads.action.edit')}
                    </Button>
                    <Button size="sm" className="rounded-xl flex-1" onClick={() => setDrawerLead(null)}>
                      {t('admin.leads.footer.close')}
                    </Button>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-xl w-full text-red-400 border-red-500/20 hover:bg-red-500/5 gap-1.5"
                    onClick={async () => {
                      if (!confirm(`${t('admin.leads.confirm.delete')} "${drawerLead.name}"?`)) return;
                      const { error } = await supabase.from('leads').delete().eq('id', drawerLead.id);
                      if (error) { toast.error(t('admin.leads.toast.deleteFailed')); return; }
                      toast.success(t('admin.leads.toast.deleted'));
                      setDrawerLead(null);
                      load();
                    }}
                  >
                    <X className="h-3.5 w-3.5" />{t('admin.leads.footer.deleteLead')}
                  </Button>
                </div>
              </div>
            );
          })()}
        </SheetContent>
      </Sheet>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? t('admin.leads.edit') : t('admin.leads.new')}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div><Label className="text-xs">{t('admin.leads.form.name')}</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="mt-1 rounded-xl" /></div>
              <div><Label className="text-xs">{t('admin.leads.form.phone')}</Label><Input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} className="mt-1 rounded-xl" /></div>
            </div>
            <div><Label className="text-xs">{t('admin.leads.form.email')}</Label><Input value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} className="mt-1 rounded-xl" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs">{t('admin.leads.form.source')}</Label>
                <Select value={form.source} onValueChange={v => setForm(p => ({ ...p, source: v }))}>
                  <SelectTrigger className="mt-1 rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>{SOURCE_KEYS.map(k => <SelectItem key={k} value={k}>{sourceLabel(k)}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label className="text-xs">{t('admin.leads.form.region')}</Label><Input value={form.region} onChange={e => setForm(p => ({ ...p, region: e.target.value }))} className="mt-1 rounded-xl" placeholder={t('admin.leads.form.regionPlaceholder')} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs">{t('admin.leads.form.status')}</Label>
                <Select value={form.status} onValueChange={v => setForm(p => ({ ...p, status: v }))}>
                  <SelectTrigger className="mt-1 rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>{PIPELINE_STATUSES.map(k => <SelectItem key={k} value={k}>{statusLabel(k)}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label className="text-xs">{t('admin.leads.form.assigned')}</Label><Input value={form.assigned_to} onChange={e => setForm(p => ({ ...p, assigned_to: e.target.value }))} className="mt-1 rounded-xl" /></div>
            </div>
            <div><Label className="text-xs">{t('admin.leads.form.nextStep')}</Label><Input value={form.next_step} onChange={e => setForm(p => ({ ...p, next_step: e.target.value }))} className="mt-1 rounded-xl" /></div>
            <div><Label className="text-xs">{t('admin.leads.form.notes')}</Label><Textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} className="mt-1 rounded-xl" rows={3} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="rounded-xl">{t('admin.leads.form.cancel')}</Button>
            <Button onClick={save} className="rounded-xl">{editing ? t('admin.leads.form.update') : t('admin.leads.form.create')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
