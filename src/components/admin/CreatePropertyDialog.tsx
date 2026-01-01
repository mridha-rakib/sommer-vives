import { useState, useEffect } from 'react';
import { Home } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const REGIONS = [
  'Nordsjælland',
  'Sydsjælland',
  'Vestsjælland',
  'Bornholm',
  'Fyn',
  'Sønderjylland',
  'Vestjylland',
  'Midtjylland',
  'Nordjylland',
  'Limfjorden',
];

interface Owner {
  id: string;
  full_name: string | null;
  email: string;
}

interface CreatePropertyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CreatePropertyDialog({ open, onOpenChange, onSuccess }: CreatePropertyDialogProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [owners, setOwners] = useState<Owner[]>([]);
  const [form, setForm] = useState({
    title: '',
    description: '',
    address: '',
    region: '',
    owner_id: '',
    capacity: 4,
    bedrooms: 2,
    bathrooms: 1,
    price_per_night: 1500,
    cleaning_fee: 750,
  });

  useEffect(() => {
    const loadOwners = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .order('full_name');
      setOwners(data || []);
    };
    if (open) loadOwners();
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.address || !form.region || !form.owner_id) {
      toast.error('Udfyld venligst alle påkrævede felter');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from('properties').insert({
        title: form.title,
        description: form.description || null,
        address: form.address,
        region: form.region,
        owner_id: form.owner_id,
        capacity: form.capacity,
        bedrooms: form.bedrooms,
        bathrooms: form.bathrooms,
        price_per_night: form.price_per_night,
        cleaning_fee: form.cleaning_fee,
        status: 'draft',
        amenities: [],
        images: [],
      });

      if (error) throw error;

      toast.success('Bolig oprettet');
      onOpenChange(false);
      onSuccess?.();
      setForm({
        title: '',
        description: '',
        address: '',
        region: '',
        owner_id: '',
        capacity: 4,
        bedrooms: 2,
        bathrooms: 1,
        price_per_night: 1500,
        cleaning_fee: 750,
      });
    } catch (error) {
      toast.error('Kunne ikke oprette bolig');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Home className="h-5 w-5" />
            Ny Bolig
          </DialogTitle>
          <DialogDescription>Opret en ny bolig i systemet</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Titel *</Label>
            <Input
              value={form.title}
              onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="F.eks. Strandvejens Perle"
            />
          </div>

          <div>
            <Label>Adresse *</Label>
            <Input
              value={form.address}
              onChange={(e) => setForm(f => ({ ...f, address: e.target.value }))}
              placeholder="Strandvejen 42, 3100 Hornbæk"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Region *</Label>
              <Select value={form.region} onValueChange={(v) => setForm(f => ({ ...f, region: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Vælg region" />
                </SelectTrigger>
                <SelectContent>
                  {REGIONS.map(r => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Ejer *</Label>
              <Select value={form.owner_id} onValueChange={(v) => setForm(f => ({ ...f, owner_id: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Vælg ejer" />
                </SelectTrigger>
                <SelectContent>
                  {owners.map(o => (
                    <SelectItem key={o.id} value={o.id}>
                      {o.full_name || o.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Kapacitet</Label>
              <Input
                type="number"
                min={1}
                value={form.capacity}
                onChange={(e) => setForm(f => ({ ...f, capacity: Number(e.target.value) }))}
              />
            </div>
            <div>
              <Label>Soveværelser</Label>
              <Input
                type="number"
                min={0}
                value={form.bedrooms}
                onChange={(e) => setForm(f => ({ ...f, bedrooms: Number(e.target.value) }))}
              />
            </div>
            <div>
              <Label>Badeværelser</Label>
              <Input
                type="number"
                min={0}
                value={form.bathrooms}
                onChange={(e) => setForm(f => ({ ...f, bathrooms: Number(e.target.value) }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Pris/nat (kr)</Label>
              <Input
                type="number"
                min={0}
                value={form.price_per_night}
                onChange={(e) => setForm(f => ({ ...f, price_per_night: Number(e.target.value) }))}
              />
            </div>
            <div>
              <Label>Rengøringsgebyr (kr)</Label>
              <Input
                type="number"
                min={0}
                value={form.cleaning_fee}
                onChange={(e) => setForm(f => ({ ...f, cleaning_fee: Number(e.target.value) }))}
              />
            </div>
          </div>

          <div>
            <Label>Beskrivelse</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Kort beskrivelse af boligen..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuller
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Opretter...' : 'Opret bolig'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
