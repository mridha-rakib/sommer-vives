import { useState, useEffect } from 'react';
import { Calendar, User, Home, DollarSign } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Property {
  id: string;
  title: string;
  owner_id: string;
  price_per_night: number | null;
  cleaning_fee: number | null;
}

interface CreateBookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

type SourceChannel = 'direct' | 'airbnb' | 'booking_com' | 'vrbo' | 'other';

export function CreateBookingDialog({ open, onOpenChange, onSuccess }: CreateBookingDialogProps) {
  const [loading, setLoading] = useState(false);
  const [properties, setProperties] = useState<Property[]>([]);
  const [form, setForm] = useState({
    property_id: '',
    guest_name: '',
    guest_email: '',
    guest_phone: '',
    check_in: '',
    check_out: '',
    guests_count: 2,
    source_channel: 'direct' as SourceChannel,
    notes: '',
  });

  useEffect(() => {
    const loadProperties = async () => {
      const { data } = await supabase
        .from('properties')
        .select('id, title, owner_id, price_per_night, cleaning_fee')
        .eq('status', 'published');
      setProperties(data || []);
    };
    if (open) loadProperties();
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.property_id || !form.guest_name || !form.check_in || !form.check_out) {
      toast.error('Udfyld venligst alle påkrævede felter');
      return;
    }

    setLoading(true);
    try {
      const property = properties.find(p => p.id === form.property_id);
      if (!property) throw new Error('Bolig ikke fundet');

      const checkIn = new Date(form.check_in);
      const checkOut = new Date(form.check_out);
      const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
      
      const basePrice = (property.price_per_night || 0) * nights;
      const cleaningFee = property.cleaning_fee || 0;
      const serviceFee = basePrice * 0.05;
      const totalAmount = basePrice + cleaningFee + serviceFee;
      const platformEarnings = basePrice * 0.15;
      const ownerPayout = basePrice * 0.85 + cleaningFee;

      const { error } = await supabase.from('bookings').insert({
        property_id: form.property_id,
        owner_id: property.owner_id,
        guest_name: form.guest_name,
        guest_email: form.guest_email || null,
        guest_phone: form.guest_phone || null,
        check_in: form.check_in,
        check_out: form.check_out,
        guests_count: form.guests_count,
        base_price: basePrice,
        cleaning_fee: cleaningFee,
        service_fee: serviceFee,
        total_amount: totalAmount,
        platform_fee_percent: 15,
        platform_earnings: platformEarnings,
        owner_payout: ownerPayout,
        source_channel: form.source_channel,
        status: 'confirmed',
        notes: form.notes || null,
      });

      if (error) throw error;

      toast.success('Booking oprettet');
      onOpenChange(false);
      onSuccess?.();
      setForm({
        property_id: '',
        guest_name: '',
        guest_email: '',
        guest_phone: '',
        check_in: '',
        check_out: '',
        guests_count: 2,
        source_channel: 'direct',
        notes: '',
      });
    } catch (error) {
      toast.error('Kunne ikke oprette booking');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Ny Booking
          </DialogTitle>
          <DialogDescription>Opret en ny booking manuelt</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Bolig *</Label>
            <Select value={form.property_id} onValueChange={(v) => setForm(f => ({ ...f, property_id: v }))}>
              <SelectTrigger>
                <SelectValue placeholder="Vælg bolig" />
              </SelectTrigger>
              <SelectContent>
                {properties.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Check-in *</Label>
              <Input
                type="date"
                value={form.check_in}
                onChange={(e) => setForm(f => ({ ...f, check_in: e.target.value }))}
              />
            </div>
            <div>
              <Label>Check-out *</Label>
              <Input
                type="date"
                value={form.check_out}
                onChange={(e) => setForm(f => ({ ...f, check_out: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <Label>Gæstens navn *</Label>
            <Input
              value={form.guest_name}
              onChange={(e) => setForm(f => ({ ...f, guest_name: e.target.value }))}
              placeholder="Navn"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={form.guest_email}
                onChange={(e) => setForm(f => ({ ...f, guest_email: e.target.value }))}
                placeholder="email@example.dk"
              />
            </div>
            <div>
              <Label>Telefon</Label>
              <Input
                value={form.guest_phone}
                onChange={(e) => setForm(f => ({ ...f, guest_phone: e.target.value }))}
                placeholder="+45 12345678"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Antal gæster</Label>
              <Input
                type="number"
                min={1}
                value={form.guests_count}
                onChange={(e) => setForm(f => ({ ...f, guests_count: Number(e.target.value) }))}
              />
            </div>
            <div>
              <Label>Kanal</Label>
              <Select value={form.source_channel} onValueChange={(v) => setForm(f => ({ ...f, source_channel: v as SourceChannel }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="direct">Direkte</SelectItem>
                  <SelectItem value="airbnb">Airbnb</SelectItem>
                  <SelectItem value="booking_com">Booking.com</SelectItem>
                  <SelectItem value="vrbo">VRBO</SelectItem>
                  <SelectItem value="other">Anden</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Noter</Label>
            <Textarea
              value={form.notes}
              onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="Eventuelle noter..."
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuller
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Opretter...' : 'Opret booking'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
