import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';
import { 
  Search, Plus, Target, Phone, Mail, MapPin, 
  MoreHorizontal, ArrowRight, CheckCircle2, Clock, XCircle
} from 'lucide-react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  new: { label: 'Ny', cls: 'bg-blue-100 text-blue-700' },
  contacted: { label: 'Kontaktet', cls: 'bg-amber-100 text-amber-700' },
  meeting_booked: { label: 'Møde booket', cls: 'bg-violet-100 text-violet-700' },
  qualified: { label: 'Kvalificeret', cls: 'bg-emerald-100 text-emerald-700' },
  converted: { label: 'Konverteret', cls: 'bg-green-100 text-green-700' },
  lost: { label: 'Tabt', cls: 'bg-slate-100 text-slate-500' },
};

const SOURCE_MAP: Record<string, string> = {
  website: 'Hjemmeside',
  referral: 'Anbefaling',
  social: 'SoMe',
  phone: 'Telefon',
  partner: 'Partner',
  other: 'Anden',
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

  const counts = Object.keys(STATUS_MAP).reduce((acc, k) => {
    acc[k] = leads.filter(l => l.status === k).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Leads</h1>
            <p className="text-muted-foreground">{leads.length} potentielle ejere</p>
          </div>
          <Button onClick={openNew}><Plus className="h-4 w-4 mr-2" />Nyt lead</Button>
        </div>

        {/* Status pills */}
        <div className="flex flex-wrap gap-2">
          <Button variant={statusFilter === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setStatusFilter('all')} className="text-xs h-8">
            Alle ({leads.length})
          </Button>
          {Object.entries(STATUS_MAP).map(([k, v]) => (
            <Button key={k} variant={statusFilter === k ? 'default' : 'outline'} size="sm" onClick={() => setStatusFilter(k)} className="text-xs h-8">
              {v.label} ({counts[k] || 0})
            </Button>
          ))}
        </div>

        {/* Search */}
        <Card>
          <CardContent className="p-4">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Søg på navn, email, telefon..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-4 space-y-3">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left">
                      <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Navn</th>
                      <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Kontakt</th>
                      <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Kilde</th>
                      <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Region</th>
                      <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Status</th>
                      <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Næste skridt</th>
                      <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Ansvarlig</th>
                      <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Oprettet</th>
                      <th className="px-4 py-3 w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {leads.map(l => (
                      <tr key={l.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 font-medium text-foreground">{l.name}</td>
                        <td className="px-4 py-3">
                          <div className="space-y-0.5">
                            {l.email && <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Mail className="w-3 h-3" />{l.email}</div>}
                            {l.phone && <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Phone className="w-3 h-3" />{l.phone}</div>}
                          </div>
                        </td>
                        <td className="px-4 py-3"><Badge variant="outline" className="text-[10px]">{SOURCE_MAP[l.source] || l.source}</Badge></td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">{l.region || '—'}</td>
                        <td className="px-4 py-3">
                          <Badge className={`text-[10px] ${STATUS_MAP[l.status]?.cls || 'bg-muted text-muted-foreground'}`}>
                            {STATUS_MAP[l.status]?.label || l.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground max-w-[120px] truncate">{l.next_step || '—'}</td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">{l.assigned_to || '—'}</td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">{format(new Date(l.created_at), 'd. MMM', { locale: da })}</td>
                        <td className="px-4 py-3">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
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
                    ))}
                    {leads.length === 0 && !loading && (
                      <tr><td colSpan={9} className="px-4 py-12 text-center text-muted-foreground">Ingen leads fundet</td></tr>
                    )}
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
          <DialogHeader>
            <DialogTitle>{editing ? 'Rediger lead' : 'Nyt lead'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Navn *</Label>
                <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="mt-1" />
              </div>
              <div>
                <Label>Telefon</Label>
                <Input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} className="mt-1" />
              </div>
            </div>
            <div>
              <Label>Email</Label>
              <Input value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} className="mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Kilde</Label>
                <Select value={form.source} onValueChange={v => setForm(p => ({ ...p, source: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(SOURCE_MAP).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Region</Label>
                <Input value={form.region} onChange={e => setForm(p => ({ ...p, region: e.target.value }))} className="mt-1" placeholder="Fx Nordsjælland" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={v => setForm(p => ({ ...p, status: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(STATUS_MAP).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Ansvarlig</Label>
                <Input value={form.assigned_to} onChange={e => setForm(p => ({ ...p, assigned_to: e.target.value }))} className="mt-1" placeholder="Navn" />
              </div>
            </div>
            <div>
              <Label>Næste skridt</Label>
              <Input value={form.next_step} onChange={e => setForm(p => ({ ...p, next_step: e.target.value }))} className="mt-1" placeholder="Fx Ring op mandag" />
            </div>
            <div>
              <Label>Noter</Label>
              <Textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} className="mt-1" rows={3} />
            </div>
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
