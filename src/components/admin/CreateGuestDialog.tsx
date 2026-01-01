import { useState } from 'react';
import { User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
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
import { Checkbox } from '@/components/ui/checkbox';

interface CreateGuestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CreateGuestDialog({ open, onOpenChange, onSuccess }: CreateGuestDialogProps) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    gdpr_consent: false,
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email) {
      toast.error('Navn og email er påkrævet');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from('guests').insert({
        name: form.name,
        email: form.email,
        phone: form.phone || null,
        gdpr_consent: form.gdpr_consent,
        gdpr_consent_date: form.gdpr_consent ? new Date().toISOString() : null,
        notes: form.notes || null,
      });

      if (error) throw error;

      toast.success('Gæst oprettet');
      onOpenChange(false);
      onSuccess?.();
      setForm({
        name: '',
        email: '',
        phone: '',
        gdpr_consent: false,
        notes: '',
      });
    } catch (error) {
      toast.error('Kunne ikke oprette gæst');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Ny Gæst
          </DialogTitle>
          <DialogDescription>Opret en ny gæsteprofil</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Navn *</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Fulde navn"
            />
          </div>

          <div>
            <Label>Email *</Label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
              placeholder="email@example.dk"
            />
          </div>

          <div>
            <Label>Telefon</Label>
            <Input
              value={form.phone}
              onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))}
              placeholder="+45 12345678"
            />
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="gdpr"
              checked={form.gdpr_consent}
              onCheckedChange={(checked) => setForm(f => ({ ...f, gdpr_consent: checked === true }))}
            />
            <Label htmlFor="gdpr" className="text-sm cursor-pointer">
              GDPR samtykke givet
            </Label>
          </div>

          <div>
            <Label>Noter</Label>
            <Textarea
              value={form.notes}
              onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="Eventuelle noter om gæsten..."
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuller
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Opretter...' : 'Opret gæst'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
