import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Loader2, Plus, Pencil, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatDKK } from '@/lib/pricing';
import { useAuth } from '@/lib/auth';

interface AddOn {
  id: string; listing_id: string; name: string; description: string | null;
  price: number; price_type: string; is_active: boolean; sort_order: number;
}

interface ListingOption { id: string; name: string; }

const PRICE_TYPES: Record<string, string> = {
  per_guest: 'Pr. gæst', per_stay: 'Pr. ophold', per_night: 'Pr. nat', fixed: 'Fast pris',
};

export function AdminAddOns() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [listings, setListings] = useState<ListingOption[]>([]);
  const [selectedListingId, setSelectedListingId] = useState('');
  const [addOns, setAddOns] = useState<AddOn[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AddOn | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState(0);
  const [priceType, setPriceType] = useState('per_guest');
  const [isActive, setIsActive] = useState(true);
  const [sortOrder, setSortOrder] = useState(0);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [lRes, aRes] = await Promise.all([
      supabase.from('listings').select('id, name').eq('is_active', true),
      supabase.from('add_ons').select('*').order('sort_order'),
    ]);
    if (lRes.data) { setListings(lRes.data); if (!selectedListingId && lRes.data.length > 0) setSelectedListingId(lRes.data[0].id); }
    if (aRes.data) setAddOns(aRes.data as AddOn[]);
    setLoading(false);
  }, [selectedListingId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = addOns.filter((a) => selectedListingId === '__all__' || a.listing_id === selectedListingId).sort((a, b) => a.sort_order - b.sort_order);

  const openNew = () => { setEditing(null); setName(''); setDescription(''); setPrice(0); setPriceType('per_guest'); setIsActive(true); setSortOrder(filtered.length); setDialogOpen(true); };

  const openEdit = (addon: AddOn) => {
    setEditing(addon); setName(addon.name); setDescription(addon.description || '');
    setPrice(addon.price / 100); setPriceType(addon.price_type); setIsActive(addon.is_active);
    setSortOrder(addon.sort_order); setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!name.trim()) { toast({ title: 'Indtast et navn', variant: 'destructive' }); return; }
    setSaving(true);
    const data = {
      listing_id: selectedListingId, owner_id: user?.id,
      name: name.trim(), description: description.trim() || null,
      price: Math.round(price * 100), price_type: priceType, is_active: isActive, sort_order: sortOrder,
    };
    let error;
    if (editing) { ({ error } = await supabase.from('add_ons').update(data).eq('id', editing.id)); }
    else { ({ error } = await supabase.from('add_ons').insert(data)); }
    setSaving(false);
    if (error) { toast({ title: 'Fejl ved gem', description: error.message, variant: 'destructive' }); return; }
    toast({ title: editing ? 'Tilkøb opdateret' : 'Tilkøb oprettet' }); setDialogOpen(false); fetchData();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from('add_ons').delete().eq('id', deleteId);
    if (error) toast({ title: 'Fejl', description: error.message, variant: 'destructive' });
    else { toast({ title: 'Tilkøb slettet' }); fetchData(); }
    setDeleteId(null);
  };

  const handleToggle = async (addon: AddOn) => {
    const { error } = await supabase.from('add_ons').update({ is_active: !addon.is_active }).eq('id', addon.id);
    if (error) toast({ title: 'Fejl', description: error.message, variant: 'destructive' });
    else { toast({ title: addon.is_active ? 'Tilkøb deaktiveret' : 'Tilkøb aktiveret' }); fetchData(); }
  };

  if (loading) return <div className="flex items-center justify-center py-20 text-muted-foreground gap-2"><Loader2 className="h-5 w-5 animate-spin" /> Henter tilkøb...</div>;

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col gap-3">
        <div>
          <h2 className="font-display text-xl md:text-2xl font-semibold text-foreground">Tilkøb</h2>
          <p className="text-sm text-muted-foreground mt-1">Sengepakker, oplevelser og andre tilkøb til gæster.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={selectedListingId} onValueChange={setSelectedListingId}>
            <SelectTrigger className="w-[180px] h-9 text-xs"><SelectValue placeholder="Vælg listing" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Alle listings</SelectItem>
              {listings.map((l) => (<SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>))}
            </SelectContent>
          </Select>
          <Button size="sm" className="gap-1.5 ml-auto" onClick={openNew} disabled={selectedListingId === '__all__'}>
            <Plus className="h-3.5 w-3.5" /> Nyt tilkøb
          </Button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <p className="text-muted-foreground">Ingen tilkøb for denne listing.</p>
          <Button variant="outline" className="mt-4 gap-1.5" onClick={openNew}><Plus className="h-3.5 w-3.5" /> Opret tilkøb</Button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((addon) => (
            <div key={addon.id} className={`bg-card border border-border rounded-xl p-4 ${!addon.is_active ? 'opacity-50' : ''}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-medium text-sm text-foreground">{addon.name}</h4>
                    {selectedListingId === '__all__' && <Badge variant="outline" className="text-[10px]">{listings.find(l => l.id === addon.listing_id)?.name || '?'}</Badge>}
                    <Badge className="cursor-pointer select-none text-[10px]" variant={addon.is_active ? 'default' : 'secondary'} onClick={() => handleToggle(addon)}>{addon.is_active ? 'Aktiv' : 'Inaktiv'}</Badge>
                    <Badge variant="outline" className="text-[10px]">{PRICE_TYPES[addon.price_type] || addon.price_type}</Badge>
                  </div>
                  {addon.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{addon.description}</p>}
                  <p className="text-sm font-medium text-primary mt-1">{formatDKK(addon.price)}</p>
                </div>
                <div className="flex items-center gap-0.5 shrink-0">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(addon)}><Pencil className="h-3.5 w-3.5" /></Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteId(addon.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? 'Redigér tilkøb' : 'Nyt tilkøb'}</DialogTitle><DialogDescription>Tilkøb vises i bookingflowet for gæsten.</DialogDescription></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5"><Label className="text-sm">Navn</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Fx 'Sengepakke'" /></div>
            <div className="space-y-1.5"><Label className="text-sm">Beskrivelse (valgfri)</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="Kort beskrivelse til gæsten..." /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label className="text-sm">Pris (DKK)</Label><Input type="number" min={0} value={price} onChange={(e) => setPrice(+e.target.value)} /></div>
              <div className="space-y-1.5"><Label className="text-sm">Prismodel</Label>
                <Select value={priceType} onValueChange={setPriceType}><SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="per_guest">Pr. gæst</SelectItem><SelectItem value="per_stay">Pr. ophold</SelectItem><SelectItem value="per_night">Pr. nat</SelectItem><SelectItem value="fixed">Fast pris</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label className="text-sm">Sortering</Label><Input type="number" min={0} value={sortOrder} onChange={(e) => setSortOrder(+e.target.value)} /></div>
              <div className="flex items-end gap-2 pb-0.5"><Switch checked={isActive} onCheckedChange={setIsActive} /><Label className="text-sm">{isActive ? 'Aktiv' : 'Inaktiv'}</Label></div>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>Annuller</Button>
            <Button onClick={handleSave} disabled={saving} className="gap-2">{saving && <Loader2 className="h-4 w-4 animate-spin" />}{saving ? 'Gemmer...' : 'Gem'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Slet tilkøb?</AlertDialogTitle><AlertDialogDescription>Denne handling kan ikke fortrydes.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Annuller</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Slet</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
