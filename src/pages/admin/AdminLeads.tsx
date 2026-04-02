import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';
import {
  Search, Plus, Target, Phone, Mail,
  MoreHorizontal, ArrowRight
} from 'lucide-react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { AdminPageHeader } from '@/components/admin/ui/AdminPageHeader';
import { StatusChip } from '@/components/admin/ui/StatusChip';
import { EmptyState } from '@/components/admin/ui/EmptyState';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

type StatusVariant = 'info' | 'warning' | 'success' | 'muted' | 'danger';
const STATUS_MAP: Record<string, { label: string; variant: StatusVariant }> = {
  new: { label: 'Modtaget', variant: 'info' },
  contacted: { label: 'Kontaktet', variant: 'warning' },
  meeting_booked: { label: 'Møde booket', variant: 'warning' },
  qualified: { label: 'Kvalificeret', variant: 'success' },
  waiting: { label: 'Afventer svar', variant: 'muted' },
  won: { label: 'Vundet', variant: 'success' },
  converted: { label: 'Konverteret', variant: 'success' },
  lost: { label: 'Tabt', variant: 'danger' },
};

const SOURCE_MAP: Record<string, string> = {
  website: 'Hjemmeside', beregn_lejeindtaegt: 'Beregn lejeindtægt', vil_udleje: 'Vil udleje',
  udlejningstjek: 'Udlejningstjek', contact: 'Kontaktformular', referral: 'Anbefaling',
  social: 'SoMe', phone: 'Telefon', partner: 'Partner', other: 'Anden',
};

export default function AdminLeads() {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '', source: 'website', region: '', property_type: '', notes: '', assigned_to: '', next_step: '', status: 'new' });

  const load = async () => {
    setLoading(true);
    let q = supabase.from('leads').select('*').order('created_at', { ascending: false });
    if (statusFilter !== 'all') q = q.eq('status', statusFilter);
    if (search) q = q.or(`name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
    const { data } = await q;
    setLeads(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [statusFilter]);
  useEffect(() => { const t = setTimeout(load, 300); return () => clearTimeout(t); }, [search]);

  const openNew = () => {
    setEditing(null);
    setForm({ name: '', email: '', phone: '', source: 'website', region: '', property_type: '', notes: '', assigned_to: '', next_step: '', status: 'new' });
    setDialogOpen(true);
  };

  const openEdit = (lead: any) => {
    setEditing(lead);
    setForm({ name: lead.name, email: lead.email || '', phone: lead.phone || '', source: lead.source, region: lead.region || '', property_type: lead.property_type || '', notes: lead.notes || '', assigned_to: lead.assigned_to || '', next_step: lead.next_step || '', status: lead.status });
    setDialogOpen(true);
  };

  const save = async () => {
    if (!form.name.trim()) { toast.error('Navn er påkrævet'); return; }
    if (editing) {
      const { error } = await supabase.from('leads').update(form).eq('id', editing.id);
      if (error) { toast.error('Fejl ved opdatering'); return; }
      toast.success('Lead opdateret');
    } else {
      const { error } = await supabase.from('leads').insert(form);
      if (error) { toast.error('Fejl ved oprettelse'); return; }
      toast.success('Lead oprettet');
    }
    setDialogOpen(false);
    load();
  };

  const updateStatus = async (id: string, status: string) => {
    await supabase.from('leads').update({ status }).eq('id', id);
    toast.success(`Status ændret til ${STATUS_MAP[status]?.label}`);
    load();
  };

  const statusTabs = [
    { key: 'all', label: 'Alle' },
    ...Object.entries(STATUS_MAP).map(([k, v]) => ({ key: k, label: v.label })),
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <AdminPageHeader
          title="Leads"
          subtitle={`${leads.length} potentielle ejere`}
          actions={
            <Button onClick={openNew} size="sm" className="gap-1.5 rounded-xl">
              <Plus className="h-3.5 w-3.5" />Nyt lead
            </Button>
          }
        />

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Søg på navn, email, telefon..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 rounded-xl bg-card/60 border-border/40" />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {statusTabs.map(t => (
              <button
                key={t.key}
                onClick={() => setStatusFilter(t.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  statusFilter === t.key
                    ? 'bg-primary/10 text-primary border border-primary/20'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/30 border border-transparent'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <Card className="border-border/40 bg-card/60 backdrop-blur-sm overflow-hidden">
          <CardContent className="p-0">
            {loading ? (
              <div className="p-6 space-y-3">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}</div>
            ) : leads.length === 0 ? (
              <EmptyState icon={Target} title="Ingen leads fundet" description="Tilpas dine filtre eller opret et nyt lead" />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/40">
                      <th className="px-5 py-3.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Navn</th>
                      <th className="px-5 py-3.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Kontakt</th>
                      <th className="px-5 py-3.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Kilde</th>
                      <th className="px-5 py-3.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                      <th className="px-5 py-3.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Næste skridt</th>
                      <th className="px-5 py-3.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Dato</th>
                      <th className="px-5 py-3.5 w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {leads.map(l => {
                      const st = STATUS_MAP[l.status];
                      return (
                        <tr key={l.id} className="border-b border-border/20 hover:bg-muted/15 transition-colors cursor-pointer" onClick={() => openEdit(l)}>
                          <td className="px-5 py-3.5">
                            <p className="font-medium text-foreground">{l.name}</p>
                            <p className="text-[11px] text-muted-foreground">{l.region || '—'}</p>
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="space-y-0.5">
                              {l.email && <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground"><Mail className="w-3 h-3" />{l.email}</div>}
                              {l.phone && <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground"><Phone className="w-3 h-3" />{l.phone}</div>}
                            </div>
                          </td>
                          <td className="px-5 py-3.5">
                            <span className="text-xs text-muted-foreground">{SOURCE_MAP[l.source] || l.source}</span>
                          </td>
                          <td className="px-5 py-3.5">
                            <StatusChip label={st?.label || l.status} variant={st?.variant || 'muted'} dot />
                          </td>
                          <td className="px-5 py-3.5 text-xs text-muted-foreground max-w-[140px] truncate">{l.next_step || '—'}</td>
                          <td className="px-5 py-3.5 text-xs text-muted-foreground">{format(new Date(l.created_at), 'd. MMM', { locale: da })}</td>
                          <td className="px-5 py-3.5" onClick={e => e.stopPropagation()}>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg"><MoreHorizontal className="h-4 w-4" /></Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-44">
                                <DropdownMenuItem onClick={() => openEdit(l)}>Rediger</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                {Object.entries(STATUS_MAP).map(([k, v]) => (
                                  <DropdownMenuItem key={k} onClick={() => updateStatus(l.id, k)} disabled={l.status === k}>
                                    <ArrowRight className="h-3 w-3 mr-2" />{v.label}
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
      </div>

      {/* Lead Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? 'Rediger lead' : 'Nyt lead'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Navn *</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="mt-1" /></div>
              <div><Label>Telefon</Label><Input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} className="mt-1" /></div>
            </div>
            <div><Label>Email</Label><Input value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} className="mt-1" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Kilde</Label>
                <Select value={form.source} onValueChange={v => setForm(p => ({ ...p, source: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(SOURCE_MAP).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Region</Label><Input value={form.region} onChange={e => setForm(p => ({ ...p, region: e.target.value }))} className="mt-1" placeholder="Fx Nordsjælland" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={v => setForm(p => ({ ...p, status: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(STATUS_MAP).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Ansvarlig</Label><Input value={form.assigned_to} onChange={e => setForm(p => ({ ...p, assigned_to: e.target.value }))} className="mt-1" /></div>
            </div>
            <div><Label>Næste skridt</Label><Input value={form.next_step} onChange={e => setForm(p => ({ ...p, next_step: e.target.value }))} className="mt-1" /></div>
            <div><Label>Noter</Label><Textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} className="mt-1" rows={3} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuller</Button>
            <Button onClick={save}>{editing ? 'Opdater' : 'Opret'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
