import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';
import { Plus, Search, Phone, Mail, MapPin, MoreHorizontal, Sparkles, Camera, Wrench, Key, Users } from 'lucide-react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

const TYPES: Record<string, { label: string; icon: any; cls: string }> = {
  cleaner: { label: 'Rengøring', icon: Sparkles, cls: 'bg-blue-100 text-blue-700' },
  photographer: { label: 'Fotograf', icon: Camera, cls: 'bg-violet-100 text-violet-700' },
  maintenance: { label: 'Vedligeholdelse', icon: Wrench, cls: 'bg-amber-100 text-amber-700' },
  keybox: { label: 'Nøgleboks', icon: Key, cls: 'bg-emerald-100 text-emerald-700' },
  other: { label: 'Anden', icon: Users, cls: 'bg-slate-100 text-slate-600' },
};

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  active: { label: 'Aktiv', cls: 'bg-emerald-100 text-emerald-700' },
  inactive: { label: 'Inaktiv', cls: 'bg-slate-100 text-slate-500' },
  paused: { label: 'Pauseret', cls: 'bg-amber-100 text-amber-700' },
};

export default function AdminServicePartners() {
  const [partners, setPartners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '', partner_type: 'cleaner', status: 'active', region: '', notes: '' });

  const load = async () => {
    setLoading(true);
    let q = supabase.from('service_partners').select('*').order('created_at', { ascending: false });
    if (typeFilter !== 'all') q = q.eq('partner_type', typeFilter);
    if (search) q = q.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
    const { data } = await q;
    setPartners(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [typeFilter]);
  useEffect(() => { const t = setTimeout(load, 300); return () => clearTimeout(t); }, [search]);

  const openNew = () => {
    setEditing(null);
    setForm({ name: '', email: '', phone: '', partner_type: 'cleaner', status: 'active', region: '', notes: '' });
    setDialogOpen(true);
  };

  const openEdit = (p: any) => {
    setEditing(p);
    setForm({ name: p.name, email: p.email || '', phone: p.phone || '', partner_type: p.partner_type, status: p.status, region: p.region || '', notes: p.notes || '' });
    setDialogOpen(true);
  };

  const save = async () => {
    if (!form.name.trim()) { toast.error('Navn er påkrævet'); return; }
    if (editing) {
      const { error } = await supabase.from('service_partners').update(form).eq('id', editing.id);
      if (error) { toast.error('Fejl'); return; }
      toast.success('Partner opdateret');
    } else {
      const { error } = await supabase.from('service_partners').insert(form);
      if (error) { toast.error('Fejl'); return; }
      toast.success('Partner oprettet');
    }
    setDialogOpen(false);
    load();
  };

  const typeCounts = Object.keys(TYPES).reduce((acc, k) => {
    acc[k] = partners.filter(p => p.partner_type === k).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Servicepartnere</h1>
            <p className="text-muted-foreground">{partners.length} partnere registreret</p>
          </div>
          <Button onClick={openNew}><Plus className="h-4 w-4 mr-2" />Ny partner</Button>
        </div>

        {/* Type summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {Object.entries(TYPES).map(([k, v]) => {
            const Icon = v.icon;
            return (
              <Card key={k} className={`cursor-pointer transition-all ${typeFilter === k ? 'ring-2 ring-primary' : ''}`} onClick={() => setTypeFilter(typeFilter === k ? 'all' : k)}>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${v.cls}`}><Icon className="w-4 h-4" /></div>
                  <div>
                    <div className="text-lg font-bold">{typeCounts[k] || 0}</div>
                    <div className="text-[11px] text-muted-foreground">{v.label}</div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Search */}
        <Card>
          <CardContent className="p-4">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Søg på navn, email..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-4 space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-border text-left">
                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Navn</th>
                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Kontakt</th>
                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Type</th>
                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Region</th>
                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Status</th>
                    <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Oprettet</th>
                    <th className="px-4 py-3 w-10"></th>
                  </tr></thead>
                  <tbody>
                    {partners.map(p => {
                      const t = TYPES[p.partner_type] || TYPES.other;
                      const Icon = t.icon;
                      return (
                        <tr key={p.id} className="border-b border-border/50 hover:bg-muted/30">
                          <td className="px-4 py-3 font-medium text-foreground">{p.name}</td>
                          <td className="px-4 py-3">
                            <div className="space-y-0.5">
                              {p.email && <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Mail className="w-3 h-3" />{p.email}</div>}
                              {p.phone && <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Phone className="w-3 h-3" />{p.phone}</div>}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <Badge className={`text-[10px] ${t.cls}`}><Icon className="w-3 h-3 mr-1" />{t.label}</Badge>
                          </td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">{p.region || '—'}</td>
                          <td className="px-4 py-3">
                            <Badge className={`text-[10px] ${STATUS_MAP[p.status]?.cls || ''}`}>{STATUS_MAP[p.status]?.label || p.status}</Badge>
                          </td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">{format(new Date(p.created_at), 'd. MMM yyyy', { locale: da })}</td>
                          <td className="px-4 py-3">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => openEdit(p)}>Rediger</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      );
                    })}
                    {partners.length === 0 && !loading && (
                      <tr><td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">Ingen servicepartnere</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? 'Rediger partner' : 'Ny servicepartner'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Navn *</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="mt-1" /></div>
              <div><Label>Telefon</Label><Input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} className="mt-1" /></div>
            </div>
            <div><Label>Email</Label><Input value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} className="mt-1" /></div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Type</Label>
                <Select value={form.partner_type} onValueChange={v => setForm(p => ({ ...p, partner_type: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(TYPES).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={v => setForm(p => ({ ...p, status: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(STATUS_MAP).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Region</Label><Input value={form.region} onChange={e => setForm(p => ({ ...p, region: e.target.value }))} className="mt-1" /></div>
            </div>
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
