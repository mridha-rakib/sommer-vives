import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { ProfilePopover } from '@/components/admin/ProfilePopover';
import { da } from 'date-fns/locale';
import {
  Search, Plus, Target, Phone, Mail, MapPin, CalendarDays,
  MoreHorizontal, ArrowRight, LayoutGrid, List, X,
  PhoneCall, Send, ListChecks, CalendarPlus, UserCheck, Ban,
  Clock, MessageSquare, FileText, ChevronRight
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

// ─── Constants ───
type SVariant = 'info' | 'warning' | 'success' | 'muted' | 'danger';

const PIPELINE_STATUSES = ['new', 'contacted', 'waiting', 'won', 'lost'] as const;

const STATUS_MAP: Record<string, { label: string; variant: SVariant; color: string }> = {
  new:       { label: 'Modtaget',          variant: 'info',    color: 'border-t-blue-500/60' },
  contacted: { label: 'Under behandling',  variant: 'warning', color: 'border-t-amber-500/60' },
  waiting:   { label: 'Afventer svar',     variant: 'muted',   color: 'border-t-slate-400/40' },
  won:       { label: 'Vundet',            variant: 'success', color: 'border-t-emerald-500/60' },
  lost:      { label: 'Tabt',             variant: 'danger',  color: 'border-t-red-500/40' },
};

const SOURCE_MAP: Record<string, string> = {
  beregn_lejeindtaegt: 'Beregn lejeindtægt',
  udlejningstjek: 'Book udlejningstjek',
  vil_udleje: 'Vil udleje',
  contact: 'Kontaktformular',
  website: 'Hjemmeside',
  referral: 'Anbefaling',
  social: 'SoMe',
  phone: 'Telefon',
  partner: 'Partner',
  other: 'Andet',
};

const defaultForm = { name: '', email: '', phone: '', source: 'contact', region: '', property_type: '', notes: '', assigned_to: '', next_step: '', status: 'new' };

// ─── Component ───
export default function AdminLeads() {
  const navigate = useNavigate();
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

  // ─── Data loading ───
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
  useEffect(() => { const t = setTimeout(load, 300); return () => clearTimeout(t); }, [search]);

  // ─── CRUD ───
  const openNew = () => { setEditing(null); setForm(defaultForm); setDialogOpen(true); };
  const openEdit = (lead: any) => {
    setEditing(lead);
    setForm({ name: lead.name, email: lead.email || '', phone: lead.phone || '', source: lead.source, region: lead.region || '', property_type: lead.property_type || '', notes: lead.notes || '', assigned_to: lead.assigned_to || '', next_step: lead.next_step || '', status: lead.status });
    setDialogOpen(true);
  };

  const save = async () => {
    if (!form.name.trim()) { toast.error('Navn er påkrævet'); return; }
    if (editing) {
      await supabase.from('leads').update(form).eq('id', editing.id);
      toast.success('Lead opdateret');
    } else {
      await supabase.from('leads').insert(form);
      toast.success('Lead oprettet');
    }
    setDialogOpen(false);
    load();
  };

  const updateStatus = async (id: string, status: string) => {
    await supabase.from('leads').update({ status }).eq('id', id);
    toast.success(`Status ændret til ${STATUS_MAP[status]?.label || status}`);
    if (drawerLead?.id === id) setDrawerLead((prev: any) => prev ? { ...prev, status } : null);
    load();
  };

  const convertToOwner = async (lead: any) => {
    if (!lead.email) { toast.error('Lead mangler email — kan ikke oprette ejer'); return; }

    const toastId = toast.loading(`Konverterer ${lead.name} til ejer…`);

    try {
      // 1. Create owner profile via auth signup (generates profile via trigger)
      // We insert directly into profiles since handle_new_user trigger only fires on auth signup
      // Instead, create a property first and link later when owner signs up
      // For now: create a property stub linked to no auth user, and store lead info

      // Create property (sag)
      const { data: property, error: propErr } = await supabase.from('properties').insert({
        title: `${lead.name} — Ny ejendom`,
        address: lead.region || 'Ikke angivet',
        region: lead.region || 'Ikke angivet',
        owner_id: '00000000-0000-0000-0000-000000000000', // placeholder until owner signs up
        status: 'draft',
        setup_status: 'new',
      }).select('id, case_number').single();

      if (propErr) throw propErr;

      // Update lead as won + link converted info
      const { error: leadErr } = await supabase.from('leads').update({
        status: 'won',
        notes: [
          lead.notes,
          `\n--- Konverteret ${new Date().toLocaleDateString('da-DK')} ---`,
          `Sag oprettet: ${property.case_number || property.id}`,
        ].filter(Boolean).join('\n'),
      }).eq('id', lead.id);

      if (leadErr) throw leadErr;

      toast.success(`${lead.name} konverteret — sag ${property.case_number || 'oprettet'}`, { id: toastId });
      setDrawerLead(null);
      load();
    } catch (err: any) {
      console.error('Convert error:', err);
      toast.error(`Fejl ved konvertering: ${err.message}`, { id: toastId });
    }
  };

  // ─── Drag & drop helpers ───
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

  // ─── Derived ───
  const activePipelineLeads = leads.filter(l => PIPELINE_STATUSES.includes(l.status as any));
  const leadsForColumn = (status: string) => activePipelineLeads.filter(l => l.status === status);

  // ─── Render helpers ───
  const LeadPipelineCard = ({ lead }: { lead: any }) => {
    const st = STATUS_MAP[lead.status];
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
          <h4 className="text-sm font-semibold text-foreground truncate flex-1">{lead.name}</h4>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6 rounded-md opacity-0 group-hover:opacity-100 transition-opacity shrink-0 -mr-1" onClick={e => e.stopPropagation()}>
                <MoreHorizontal className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openEdit(lead); }}>Rediger</DropdownMenuItem>
              <DropdownMenuSeparator />
              {PIPELINE_STATUSES.filter(s => s !== lead.status).map(s => (
                <DropdownMenuItem key={s} onClick={(e) => { e.stopPropagation(); updateStatus(lead.id, s); }}>
                  <ArrowRight className="h-3 w-3 mr-2" />{STATUS_MAP[s].label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {lead.region && (
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mb-1.5">
            <MapPin className="h-3 w-3 shrink-0" />{lead.region}
          </div>
        )}
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mb-1.5">
          <Target className="h-3 w-3 shrink-0" />{SOURCE_MAP[lead.source] || lead.source}
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
        {/* Header */}
        <AdminPageHeader
          title="Leads"
          subtitle={`${leads.length} potentielle ejere i pipeline`}
          actions={
            <div className="flex items-center gap-2">
              <div className="flex items-center rounded-xl border border-border/40 overflow-hidden">
                <button onClick={() => setView('board')} className={cn('px-3 py-1.5 text-xs font-medium flex items-center gap-1.5 transition-all', view === 'board' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground')}>
                  <LayoutGrid className="h-3.5 w-3.5" />Pipeline
                </button>
                <button onClick={() => setView('list')} className={cn('px-3 py-1.5 text-xs font-medium flex items-center gap-1.5 transition-all border-l border-border/40', view === 'list' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground')}>
                  <List className="h-3.5 w-3.5" />Liste
                </button>
              </div>
              <Button onClick={openNew} size="sm" className="gap-1.5 rounded-xl">
                <Plus className="h-3.5 w-3.5" />Nyt lead
              </Button>
            </div>
          }
        />

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Søg på navn, email, telefon, region..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 rounded-xl bg-card/60 border-border/40" />
          </div>
          <Select value={sourceFilter} onValueChange={setSourceFilter}>
            <SelectTrigger className="w-48 rounded-xl bg-card/60 border-border/40 text-xs">
              <SelectValue placeholder="Alle kilder" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle kilder</SelectItem>
              {Object.entries(SOURCE_MAP).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Loading */}
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
          /* ═══════ BOARD VIEW ═══════ */
          <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4 items-start">
            {PIPELINE_STATUSES.map(status => {
              const st = STATUS_MAP[status];
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
                  {/* Column header */}
                  <div className="px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <StatusChip label={st.label} variant={st.variant} dot size="md" />
                    </div>
                    <span className="text-xs font-bold text-muted-foreground tabular-nums bg-muted/40 px-2 py-0.5 rounded-md">
                      {columnLeads.length}
                    </span>
                  </div>

                  {/* Cards */}
                  <div className="px-2 pb-3 space-y-2">
                    {columnLeads.length === 0 ? (
                      <div className="py-8 text-center">
                        <p className="text-[11px] text-muted-foreground/50">Ingen leads</p>
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
          /* ═══════ LIST VIEW ═══════ */
          <Card className="border-border/40 bg-card/60 backdrop-blur-sm overflow-hidden">
            <CardContent className="p-0">
              {leads.length === 0 ? (
                <EmptyState icon={Target} title="Ingen leads fundet" description="Tilpas dine filtre eller opret et nyt lead" />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border/40">
                        {['Navn', 'Kontakt', 'Kilde', 'Region', 'Status', 'Næste skridt', 'Dato', ''].map(h => (
                          <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {leads.map(l => {
                        const st = STATUS_MAP[l.status];
                        return (
                          <tr key={l.id} className="border-b border-border/20 hover:bg-muted/15 transition-colors cursor-pointer" onClick={() => setDrawerLead(l)}>
                            <td className="px-4 py-3">
                              <p className="font-medium text-foreground">{l.name}</p>
                            </td>
                            <td className="px-4 py-3">
                              <div className="space-y-0.5">
                                {l.email && <div className="flex items-center gap-1 text-[11px] text-muted-foreground"><Mail className="w-3 h-3" />{l.email}</div>}
                                {l.phone && <div className="flex items-center gap-1 text-[11px] text-muted-foreground"><Phone className="w-3 h-3" />{l.phone}</div>}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-xs text-muted-foreground">{SOURCE_MAP[l.source] || l.source}</td>
                            <td className="px-4 py-3 text-xs text-muted-foreground">{l.region || '—'}</td>
                            <td className="px-4 py-3"><StatusChip label={st?.label || l.status} variant={st?.variant || 'muted'} dot /></td>
                            <td className="px-4 py-3 text-xs text-muted-foreground max-w-[120px] truncate">{l.next_step || '—'}</td>
                            <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{format(new Date(l.created_at), 'd. MMM', { locale: da })}</td>
                            <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg"><MoreHorizontal className="h-4 w-4" /></Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-44">
                                  <DropdownMenuItem onClick={() => openEdit(l)}>Rediger</DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => setDrawerLead(l)}>Detaljer</DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  {PIPELINE_STATUSES.filter(s => s !== l.status).map(s => (
                                    <DropdownMenuItem key={s} onClick={() => updateStatus(l.id, s)}>
                                      <ArrowRight className="h-3 w-3 mr-2" />{STATUS_MAP[s].label}
                                    </DropdownMenuItem>
                                  ))}
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

      {/* ═══════ DETAIL DRAWER ═══════ */}
      <Sheet open={!!drawerLead} onOpenChange={(open) => { if (!open) setDrawerLead(null); }}>
        <SheetContent className="w-full sm:max-w-lg p-0 border-l border-border/40 bg-background">
          {drawerLead && (() => {
            const st = STATUS_MAP[drawerLead.status];
            return (
              <div className="flex flex-col h-full">
                {/* Drawer header */}
                <div className="px-6 pt-6 pb-4 border-b border-border/30">
                  <SheetHeader className="mb-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <SheetTitle className="text-lg font-bold text-foreground">{drawerLead.name}</SheetTitle>
                        <div className="flex items-center gap-2 mt-1.5">
                          <StatusChip label={st?.label || drawerLead.status} variant={st?.variant || 'muted'} dot size="md" />
                          <span className="text-[11px] text-muted-foreground">·</span>
                          <span className="text-[11px] text-muted-foreground">{SOURCE_MAP[drawerLead.source] || drawerLead.source}</span>
                        </div>
                      </div>
                    </div>
                  </SheetHeader>
                </div>

                <ScrollArea className="flex-1">
                  <div className="px-6 py-5 space-y-6">
                    {/* Quick actions */}
                    <div>
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.15em] mb-3">Handlinger</p>
                      <div className="grid grid-cols-3 gap-2">
                        {drawerLead.phone && (
                          <a href={`tel:${drawerLead.phone}`} className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-border/40 bg-card/60 hover:bg-muted/30 transition-all cursor-pointer text-center">
                            <PhoneCall className="h-4 w-4 text-primary" />
                            <span className="text-[11px] font-medium text-foreground">Ring op</span>
                          </a>
                        )}
                        {drawerLead.email && (
                          <a href={`mailto:${drawerLead.email}`} className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-border/40 bg-card/60 hover:bg-muted/30 transition-all cursor-pointer text-center">
                            <Send className="h-4 w-4 text-primary" />
                            <span className="text-[11px] font-medium text-foreground">Send mail</span>
                          </a>
                        )}
                        <button className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-border/40 bg-card/60 hover:bg-muted/30 transition-all cursor-pointer text-center">
                          <ListChecks className="h-4 w-4 text-primary" />
                          <span className="text-[11px] font-medium text-foreground">Opgave</span>
                        </button>
                        <button className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-border/40 bg-card/60 hover:bg-muted/30 transition-all cursor-pointer text-center">
                          <CalendarPlus className="h-4 w-4 text-primary" />
                          <span className="text-[11px] font-medium text-foreground">Book møde</span>
                        </button>
                        {drawerLead.status !== 'won' && (
                          <button onClick={() => convertToOwner(drawerLead)} className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10 transition-all cursor-pointer text-center">
                            <UserCheck className="h-4 w-4 text-emerald-400" />
                            <span className="text-[11px] font-medium text-emerald-400">Konverter</span>
                          </button>
                        )}
                        {drawerLead.status !== 'lost' && (
                          <button onClick={() => updateStatus(drawerLead.id, 'lost')} className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 transition-all cursor-pointer text-center">
                            <Ban className="h-4 w-4 text-red-400" />
                            <span className="text-[11px] font-medium text-red-400">Tabt</span>
                          </button>
                        )}
                      </div>
                    </div>

                    <Separator className="bg-border/30" />

                    {/* Contact info */}
                    <div>
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.15em] mb-3">Kontaktoplysninger</p>
                      <div className="space-y-2.5">
                        {drawerLead.email && (
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-muted/30 flex items-center justify-center shrink-0"><Mail className="h-3.5 w-3.5 text-muted-foreground" /></div>
                            <div><p className="text-xs text-muted-foreground">Email</p><p className="text-sm font-medium text-foreground">{drawerLead.email}</p></div>
                          </div>
                        )}
                        {drawerLead.phone && (
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-muted/30 flex items-center justify-center shrink-0"><Phone className="h-3.5 w-3.5 text-muted-foreground" /></div>
                            <div><p className="text-xs text-muted-foreground">Telefon</p><p className="text-sm font-medium text-foreground">{drawerLead.phone}</p></div>
                          </div>
                        )}
                        {drawerLead.region && (
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-muted/30 flex items-center justify-center shrink-0"><MapPin className="h-3.5 w-3.5 text-muted-foreground" /></div>
                            <div><p className="text-xs text-muted-foreground">Region</p><p className="text-sm font-medium text-foreground">{drawerLead.region}</p></div>
                          </div>
                        )}
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-muted/30 flex items-center justify-center shrink-0"><Target className="h-3.5 w-3.5 text-muted-foreground" /></div>
                          <div><p className="text-xs text-muted-foreground">Kilde</p><p className="text-sm font-medium text-foreground">{SOURCE_MAP[drawerLead.source] || drawerLead.source}</p></div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-muted/30 flex items-center justify-center shrink-0"><CalendarDays className="h-3.5 w-3.5 text-muted-foreground" /></div>
                          <div><p className="text-xs text-muted-foreground">Oprettet</p><p className="text-sm font-medium text-foreground">{format(new Date(drawerLead.created_at), "d. MMMM yyyy 'kl.' HH:mm", { locale: da })}</p></div>
                        </div>
                      </div>
                    </div>

                    <Separator className="bg-border/30" />

                    {/* Next step */}
                    <div>
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.15em] mb-3">Næste skridt</p>
                      {drawerLead.next_step ? (
                        <div className="rounded-xl border border-primary/20 bg-primary/5 p-3.5">
                          <div className="flex items-center gap-2">
                            <ChevronRight className="h-4 w-4 text-primary shrink-0" />
                            <p className="text-sm font-medium text-foreground">{drawerLead.next_step}</p>
                          </div>
                          {drawerLead.next_step_date && (
                            <p className="text-[11px] text-muted-foreground mt-1.5 ml-6">
                              {format(new Date(drawerLead.next_step_date), 'd. MMMM yyyy', { locale: da })}
                            </p>
                          )}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground/60 italic">Intet næste skridt defineret</p>
                      )}
                    </div>

                    <Separator className="bg-border/30" />

                    {/* Notes */}
                    <div>
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.15em] mb-3">Noter</p>
                      {drawerLead.notes ? (
                        <div className="rounded-xl bg-muted/15 border border-border/30 p-3.5">
                          <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{drawerLead.notes}</p>
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground/60 italic">Ingen noter endnu</p>
                      )}
                    </div>

                    <Separator className="bg-border/30" />

                    {/* Status pipeline */}
                    <div>
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.15em] mb-3">Flyt status</p>
                      <div className="flex flex-wrap gap-2">
                        {PIPELINE_STATUSES.map(s => {
                          const sInfo = STATUS_MAP[s];
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
                              {sInfo.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Meta */}
                    <div className="pt-2">
                      <div className="flex items-center gap-4 text-[11px] text-muted-foreground/50">
                        {drawerLead.assigned_to && <span>Ansvarlig: {drawerLead.assigned_to}</span>}
                        {drawerLead.property_type && <span>Type: {drawerLead.property_type}</span>}
                      </div>
                    </div>
                  </div>
                </ScrollArea>

                {/* Drawer footer */}
                <div className="px-6 py-4 border-t border-border/30 flex items-center gap-2">
                  <Button variant="outline" size="sm" className="rounded-xl flex-1" onClick={() => { setDrawerLead(null); openEdit(drawerLead); }}>
                    Rediger
                  </Button>
                  <Button size="sm" className="rounded-xl flex-1" onClick={() => setDrawerLead(null)}>
                    Luk
                  </Button>
                </div>
              </div>
            );
          })()}
        </SheetContent>
      </Sheet>

      {/* ═══════ CREATE / EDIT DIALOG ═══════ */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? 'Rediger lead' : 'Nyt lead'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div><Label className="text-xs">Navn *</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="mt-1 rounded-xl" /></div>
              <div><Label className="text-xs">Telefon</Label><Input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} className="mt-1 rounded-xl" /></div>
            </div>
            <div><Label className="text-xs">Email</Label><Input value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} className="mt-1 rounded-xl" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs">Kilde</Label>
                <Select value={form.source} onValueChange={v => setForm(p => ({ ...p, source: v }))}>
                  <SelectTrigger className="mt-1 rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(SOURCE_MAP).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label className="text-xs">Region</Label><Input value={form.region} onChange={e => setForm(p => ({ ...p, region: e.target.value }))} className="mt-1 rounded-xl" placeholder="Fx Nordsjælland" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs">Status</Label>
                <Select value={form.status} onValueChange={v => setForm(p => ({ ...p, status: v }))}>
                  <SelectTrigger className="mt-1 rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(STATUS_MAP).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label className="text-xs">Ansvarlig</Label><Input value={form.assigned_to} onChange={e => setForm(p => ({ ...p, assigned_to: e.target.value }))} className="mt-1 rounded-xl" /></div>
            </div>
            <div><Label className="text-xs">Næste skridt</Label><Input value={form.next_step} onChange={e => setForm(p => ({ ...p, next_step: e.target.value }))} className="mt-1 rounded-xl" /></div>
            <div><Label className="text-xs">Noter</Label><Textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} className="mt-1 rounded-xl" rows={3} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="rounded-xl">Annuller</Button>
            <Button onClick={save} className="rounded-xl">{editing ? 'Opdater' : 'Opret'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
