import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, User, Phone, Mail, Edit2, UserCheck, Loader2 } from 'lucide-react';

interface Actor {
  id: string;
  listing_id: string;
  role: string;
  name: string;
  email: string | null;
  phone: string | null;
  relation: string | null;
  notes: string | null;
  sort_order: number;
}

interface OwnerProfile {
  id: string;
  full_name: string | null;
  email: string;
  phone: string | null;
  company_name: string | null;
  address: string | null;
}

const ROLE_OPTIONS = [
  { value: 'owner_partner', label: 'Ejers samlever/partner' },
  { value: 'handyman', label: 'Handyman' },
  { value: 'cleaner', label: 'Rengøring' },
  { value: 'keyholder', label: 'Nøgleholder' },
  { value: 'neighbor', label: 'Nabo/kontaktperson' },
  { value: 'caretaker', label: 'Vicevært' },
  { value: 'other', label: 'Andet' },
];

export function ListingActorsTab({ listingId, ownerId }: { listingId: string; ownerId: string }) {
  const { toast } = useToast();
  const [actors, setActors] = useState<Actor[]>([]);
  const [owner, setOwner] = useState<OwnerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingActor, setEditingActor] = useState<Actor | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({ role: 'other', name: '', email: '', phone: '', relation: '', notes: '' });

  useEffect(() => {
    loadData();
  }, [listingId, ownerId]);

  const loadData = async () => {
    setLoading(true);
    const [{ data: ownerData }, { data: actorsData }] = await Promise.all([
      supabase.from('profiles').select('id, full_name, email, phone, company_name, address').eq('id', ownerId).single(),
      supabase.from('listing_actors').select('*').eq('listing_id', listingId).order('sort_order'),
    ]);
    if (ownerData) setOwner(ownerData);
    if (actorsData) setActors(actorsData as Actor[]);
    setLoading(false);
  };

  const openCreate = () => {
    setEditingActor(null);
    setForm({ role: 'other', name: '', email: '', phone: '', relation: '', notes: '' });
    setDialogOpen(true);
  };

  const openEdit = (a: Actor) => {
    setEditingActor(a);
    setForm({ role: a.role, name: a.name, email: a.email || '', phone: a.phone || '', relation: a.relation || '', notes: a.notes || '' });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    if (editingActor) {
      await supabase.from('listing_actors').update({
        role: form.role, name: form.name, email: form.email || null, phone: form.phone || null,
        relation: form.relation || null, notes: form.notes || null,
      }).eq('id', editingActor.id);
      toast({ title: 'Aktør opdateret' });
    } else {
      await supabase.from('listing_actors').insert({
        listing_id: listingId, role: form.role, name: form.name, email: form.email || null,
        phone: form.phone || null, relation: form.relation || null, notes: form.notes || null,
        sort_order: actors.length,
      });
      toast({ title: 'Aktør tilføjet' });
    }
    setSaving(false);
    setDialogOpen(false);
    loadData();
  };

  const handleDelete = async (id: string) => {
    await supabase.from('listing_actors').delete().eq('id', id);
    toast({ title: 'Aktør slettet' });
    loadData();
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-6">
      {/* Owner section */}
      <div className="rounded-xl border border-border bg-card p-5 md:p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <UserCheck className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-display text-base font-semibold text-foreground">Ejer</h3>
            <p className="text-xs text-muted-foreground">Primær kontaktperson og ejer af ejendommen</p>
          </div>
          <Badge className="ml-auto" variant="secondary">Primær</Badge>
        </div>

        {owner && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-muted/20 rounded-xl p-4">
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Navn</p>
              <p className="text-sm font-medium">{owner.full_name || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Firma</p>
              <p className="text-sm font-medium">{owner.company_name || '—'}</p>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Email</p>
                <p className="text-sm font-medium">{owner.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Telefon</p>
                <p className="text-sm font-medium">{owner.phone || '—'}</p>
              </div>
            </div>
            {owner.address && (
              <div className="md:col-span-2">
                <p className="text-xs text-muted-foreground mb-0.5">Adresse</p>
                <p className="text-sm font-medium">{owner.address}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Secondary actors */}
      <div className="rounded-xl border border-border bg-card p-5 md:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-display text-base font-semibold text-foreground">Sekundære aktører</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Handyman, rengøring, nøgleholder, ejers samlever m.fl.</p>
          </div>
          <Button size="sm" onClick={openCreate} className="rounded-xl gap-1.5">
            <Plus className="w-3.5 h-3.5" />
            Tilføj aktør
          </Button>
        </div>

        {actors.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            <User className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p>Ingen sekundære aktører tilføjet endnu</p>
          </div>
        ) : (
          <div className="space-y-3">
            {actors.map(actor => (
              <div key={actor.id} className="flex items-center gap-4 rounded-xl bg-muted/20 p-4 group">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-background border border-border/50 shrink-0">
                  <User className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{actor.name}</span>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 capitalize">
                      {ROLE_OPTIONS.find(r => r.value === actor.role)?.label || actor.role}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                    {actor.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{actor.email}</span>}
                    {actor.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{actor.phone}</span>}
                    {actor.relation && <span>· {actor.relation}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg" onClick={() => openEdit(actor)}>
                    <Edit2 className="w-3.5 h-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg text-destructive" onClick={() => handleDelete(actor.id)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>{editingActor ? 'Rediger aktør' : 'Tilføj aktør'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Rolle</Label>
              <Select value={form.role} onValueChange={v => setForm(p => ({ ...p, role: v }))}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Navn *</Label>
              <Input className="rounded-xl" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input className="rounded-xl" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Telefon</Label>
                <Input className="rounded-xl" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Relation</Label>
              <Input className="rounded-xl" placeholder="Fx. ejers samlever, fast rengøring..." value={form.relation} onChange={e => setForm(p => ({ ...p, relation: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Noter</Label>
              <Textarea className="rounded-xl" rows={2} value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="rounded-xl">Annuller</Button>
            <Button onClick={handleSave} disabled={!form.name.trim() || saving} className="rounded-xl">
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
              {editingActor ? 'Gem ændringer' : 'Tilføj'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
