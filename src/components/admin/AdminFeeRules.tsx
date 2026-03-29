import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Loader2, Plus, Pencil, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatDKK } from '@/lib/pricing';
import { useAuth } from '@/lib/auth';

interface FeeRule {
  id: string; listing_id: string; name: string; description: string | null;
  amount: number; fee_type: string; is_mandatory: boolean; is_active: boolean;
  sort_order: number; condition_min_nights: number | null; condition_max_nights: number | null;
}

interface ListingOption { id: string; name: string; }

const FEE_TYPES: Record<string, string> = {
  fixed: 'Fast beløb', per_night: 'Pr. nat', per_guest: 'Pr. gæst', per_pet: 'Pr. kæledyr',
};

export function AdminFeeRules() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [listings, setListings] = useState<ListingOption[]>([]);
  const [selectedListingId, setSelectedListingId] = useState('');
  const [fees, setFees] = useState<FeeRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<FeeRule | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState(0);
  const [feeType, setFeeType] = useState('fixed');
  const [isMandatory, setIsMandatory] = useState(true);
  const [isActive, setIsActive] = useState(true);
  const [sortOrder, setSortOrder] = useState(0);
  const [useCondition, setUseCondition] = useState(false);
  const [condMinNights, setCondMinNights] = useState<number | ''>('');
  const [condMaxNights, setCondMaxNights] = useState<number | ''>('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [lRes, fRes] = await Promise.all([
      supabase.from('listings').select('id, name').eq('is_active', true),
      supabase.from('fee_rules').select('*').order('sort_order'),
    ]);
    if (lRes.data) { setListings(lRes.data); if (!selectedListingId && lRes.data.length > 0) setSelectedListingId(lRes.data[0].id); }
    if (fRes.data) setFees(fRes.data as FeeRule[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = fees.filter((f) => selectedListingId === '__all__' || f.listing_id === selectedListingId).sort((a, b) => a.sort_order - b.sort_order);

  const openNew = () => {
    setEditing(null); setName(''); setDescription(''); setAmount(0);
    setFeeType('fixed'); setIsMandatory(true); setIsActive(true);
    setSortOrder(filtered.length); setUseCondition(false);
    setCondMinNights(''); setCondMaxNights(''); setDialogOpen(true);
  };

  const openEdit = (fee: FeeRule) => {
    setEditing(fee); setName(fee.name); setDescription(fee.description || '');
    setAmount(fee.amount / 100); setFeeType(fee.fee_type); setIsMandatory(fee.is_mandatory);
    setIsActive(fee.is_active); setSortOrder(fee.sort_order);
    const hasCond = fee.condition_min_nights !== null || fee.condition_max_nights !== null;
    setUseCondition(hasCond); setCondMinNights(fee.condition_min_nights ?? '');
    setCondMaxNights(fee.condition_max_nights ?? ''); setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!name.trim()) { toast({ title: 'Indtast et navn', variant: 'destructive' }); return; }
    setSaving(true);
    const data = {
      listing_id: selectedListingId, owner_id: user?.id,
      name: name.trim(), description: description.trim() || null,
      amount: Math.round(amount * 100), fee_type: feeType,
      is_mandatory: isMandatory, is_active: isActive, sort_order: sortOrder,
      condition_min_nights: useCondition && condMinNights !== '' ? +condMinNights : null,
      condition_max_nights: useCondition && condMaxNights !== '' ? +condMaxNights : null,
    };
    let error;
    if (editing) { ({ error } = await supabase.from('fee_rules').update(data).eq('id', editing.id)); }
    else { ({ error } = await supabase.from('fee_rules').insert(data)); }
    setSaving(false);
    if (error) { toast({ title: 'Fejl ved gem', description: error.message, variant: 'destructive' }); return; }
    toast({ title: editing ? 'Gebyr opdateret' : 'Gebyr oprettet' }); setDialogOpen(false); fetchData();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from('fee_rules').delete().eq('id', deleteId);
    if (error) toast({ title: 'Fejl', description: error.message, variant: 'destructive' });
    else { toast({ title: 'Gebyr slettet' }); fetchData(); }
    setDeleteId(null);
  };

  const handleToggle = async (fee: FeeRule) => {
    const { error } = await supabase.from('fee_rules').update({ is_active: !fee.is_active }).eq('id', fee.id);
    if (!error) { toast({ title: fee.is_active ? 'Gebyr deaktiveret' : 'Gebyr aktiveret' }); fetchData(); }
  };

  const formatCondition = (fee: FeeRule) => {
    if (fee.condition_min_nights === null && fee.condition_max_nights === null) return 'Altid';
    const parts: string[] = [];
    if (fee.condition_min_nights !== null) parts.push(`≥ ${fee.condition_min_nights} nætter`);
    if (fee.condition_max_nights !== null) parts.push(`≤ ${fee.condition_max_nights} nætter`);
    return parts.join(' og ');
  };

  if (loading) return <div className="flex items-center justify-center py-20 text-muted-foreground gap-2"><Loader2 className="h-5 w-5 animate-spin" /> Henter gebyrer...</div>;

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col gap-3">
        <div>
          <h2 className="font-display text-xl md:text-2xl font-semibold text-foreground">Gebyrer</h2>
          <p className="text-sm text-muted-foreground mt-1">Obligatoriske gebyrer som rengøring, kæledyr m.m.</p>
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
            <Plus className="h-3.5 w-3.5" /> Nyt gebyr
          </Button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <p className="text-muted-foreground">Ingen gebyrer for denne listing.</p>
          <Button variant="outline" className="mt-4 gap-1.5" onClick={openNew}><Plus className="h-3.5 w-3.5" /> Opret gebyr</Button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((fee) => (
            <div key={fee.id} className={`bg-card border border-border rounded-xl p-4 ${!fee.is_active ? 'opacity-50' : ''}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-medium text-sm text-foreground">{fee.name}</h4>
                    {selectedListingId === '__all__' && <Badge variant="outline" className="text-[10px]">{listings.find(l => l.id === fee.listing_id)?.name || '?'}</Badge>}
                    <Badge className="cursor-pointer select-none text-[10px]" variant={fee.is_active ? 'default' : 'secondary'} onClick={() => handleToggle(fee)}>{fee.is_active ? 'Aktiv' : 'Inaktiv'}</Badge>
                    {fee.is_mandatory && <Badge variant="outline" className="text-[10px]">Obligatorisk</Badge>}
                  </div>
                  {fee.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{fee.description}</p>}
                </div>
                <div className="flex items-center gap-0.5 shrink-0">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(fee)}><Pencil className="h-3.5 w-3.5" /></Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteId(fee.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs mt-3">
                <div><span className="text-muted-foreground">Beløb</span><p className="font-medium text-primary">{formatDKK(fee.amount)}</p></div>
                <div><span className="text-muted-foreground">Type</span><p className="font-medium text-foreground">{FEE_TYPES[fee.fee_type] || fee.fee_type}</p></div>
                <div><span className="text-muted-foreground">Betingelse</span><p className="font-medium text-foreground">{formatCondition(fee)}</p></div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Redigér gebyr' : 'Nyt gebyr'}</DialogTitle>
            <DialogDescription>Gebyrer tilføjes automatisk til booking-totalen.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5"><Label className="text-sm">Navn</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Fx 'Rengøring'" /></div>
            <div className="space-y-1.5"><Label className="text-sm">Beskrivelse (valgfri)</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label className="text-sm">Beløb (DKK)</Label><Input type="number" min={0} value={amount} onChange={(e) => setAmount(+e.target.value)} /></div>
              <div className="space-y-1.5"><Label className="text-sm">Type</Label>
                <Select value={feeType} onValueChange={setFeeType}><SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="fixed">Fast beløb</SelectItem><SelectItem value="per_night">Pr. nat</SelectItem><SelectItem value="per_guest">Pr. gæst</SelectItem><SelectItem value="per_pet">Pr. kæledyr</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2"><Switch checked={isMandatory} onCheckedChange={setIsMandatory} /><Label className="text-sm">Obligatorisk</Label></div>
              <div className="flex items-center gap-2"><Switch checked={isActive} onCheckedChange={setIsActive} /><Label className="text-sm">{isActive ? 'Aktiv' : 'Inaktiv'}</Label></div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2"><Checkbox checked={useCondition} onCheckedChange={(c) => setUseCondition(!!c)} /><Label className="text-sm">Betingelse: antal nætter</Label></div>
              {useCondition && (
                <div className="grid grid-cols-2 gap-3 ml-6">
                  <div className="space-y-1"><Label className="text-xs">Min. nætter</Label><Input type="number" min={1} value={condMinNights} onChange={(e) => setCondMinNights(e.target.value ? +e.target.value : '')} placeholder="—" /></div>
                  <div className="space-y-1"><Label className="text-xs">Max. nætter</Label><Input type="number" min={1} value={condMaxNights} onChange={(e) => setCondMaxNights(e.target.value ? +e.target.value : '')} placeholder="—" /></div>
                </div>
              )}
            </div>
            <div className="space-y-1.5"><Label className="text-sm">Sortering</Label><Input type="number" min={0} value={sortOrder} onChange={(e) => setSortOrder(+e.target.value)} /></div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>Annuller</Button>
            <Button onClick={handleSave} disabled={saving} className="gap-2">{saving && <Loader2 className="h-4 w-4 animate-spin" />}{saving ? 'Gemmer...' : 'Gem'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Slet gebyr?</AlertDialogTitle><AlertDialogDescription>Denne handling kan ikke fortrydes.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Annuller</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Slet</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
