import { useState } from 'react';
import { Home, Plus, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const PROPERTY_TYPES = [
  { value: 'summerhouse', label: 'Sommerhus' },
  { value: 'villa', label: 'Villa' },
  { value: 'apartment', label: 'Lejlighed' },
  { value: 'cabin', label: 'Hytte' },
  { value: 'farmhouse', label: 'Bondegård' },
];

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: (id: string) => void;
}

export function CreateListingDialog({ open, onClose, onCreated }: Props) {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [region, setRegion] = useState('');
  const [city, setCity] = useState('');
  const [propertyType, setPropertyType] = useState('summerhouse');
  const [maxGuests, setMaxGuests] = useState(4);
  const [bedrooms, setBedrooms] = useState(2);
  const [bathrooms, setBathrooms] = useState(1);
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setName(''); setAddress(''); setRegion(''); setCity('');
    setPropertyType('summerhouse'); setMaxGuests(4); setBedrooms(2); setBathrooms(1);
  };

  const handleCreate = async () => {
    if (!name.trim()) { toast.error('Titel er påkrævet'); return; }
    setSaving(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast.error('Du skal være logget ind'); setSaving(false); return; }

    const slug = name.trim().toLowerCase()
      .replace(/[æ]/g, 'ae').replace(/[ø]/g, 'oe').replace(/[å]/g, 'aa')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
      + '-' + Date.now().toString(36);

    const { data, error } = await supabase.from('listings').insert({
      name: name.trim(),
      slug,
      owner_id: user.id,
      address: address.trim() || null,
      region: region.trim() || null,
      city: city.trim() || null,
      property_type: propertyType,
      max_guests: maxGuests,
      bedrooms,
      bathrooms,
      base_price_per_night: 0,
      is_active: false,
      internal_status: 'draft',
      currency: 'DKK',
    }).select('id').single();

    setSaving(false);
    if (error) {
      toast.error('Kunne ikke oprette listing: ' + error.message);
      return;
    }

    toast.success('Listing oprettet!');
    reset();
    onClose();
    if (data) onCreated(data.id);
  };

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Home className="h-4 w-4 text-primary" /> Opret ny listing
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label className="text-xs">Titel *</Label>
            <Input value={name} onChange={e => setName(e.target.value)} className="mt-1 rounded-xl"
              placeholder="F.eks. Søvej 28, 6823 Ansager - Sagsnr.: SV01" />
            <p className="text-[10px] text-muted-foreground mt-1">Det navn gæsten ser</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Boligtype</Label>
              <Select value={propertyType} onValueChange={setPropertyType}>
                <SelectTrigger className="mt-1 rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PROPERTY_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Region</Label>
              <Input value={region} onChange={e => setRegion(e.target.value)} className="mt-1 rounded-xl" placeholder="Nordsjælland" />
            </div>
          </div>

          <div>
            <Label className="text-xs">Adresse</Label>
            <Input value={address} onChange={e => setAddress(e.target.value)} className="mt-1 rounded-xl" placeholder="Skovvej 12, 4573 Højby" />
          </div>

          <div>
            <Label className="text-xs">By</Label>
            <Input value={city} onChange={e => setCity(e.target.value)} className="mt-1 rounded-xl" placeholder="Hornbæk" />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-xs">Max gæster</Label>
              <Input type="number" min={1} value={maxGuests} onChange={e => setMaxGuests(parseInt(e.target.value) || 1)} className="mt-1 rounded-xl" />
            </div>
            <div>
              <Label className="text-xs">Soveværelser</Label>
              <Input type="number" min={0} value={bedrooms} onChange={e => setBedrooms(parseInt(e.target.value) || 0)} className="mt-1 rounded-xl" />
            </div>
            <div>
              <Label className="text-xs">Badeværelser</Label>
              <Input type="number" min={0} value={bathrooms} onChange={e => setBathrooms(parseInt(e.target.value) || 0)} className="mt-1 rounded-xl" />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="rounded-xl">Annuller</Button>
          <Button onClick={handleCreate} disabled={saving} className="rounded-xl gap-1.5">
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
            {saving ? 'Opretter...' : 'Opret listing'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
