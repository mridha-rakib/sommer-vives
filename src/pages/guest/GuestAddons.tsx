import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { GuestLayout } from '@/components/layout/GuestLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingBag, BedDouble, Clock, Baby, Sparkles, Plus, Check } from 'lucide-react';
import { toast } from 'sonner';

const defaultAddons = [
  { id: 'linen', name: 'Sengelinned', desc: 'Komplet sæt pr. seng — håndklæder inkluderet', price: 150, icon: BedDouble, unit: 'pr. sæt' },
  { id: 'early', name: 'Tidlig check-in', desc: 'Check-in allerede fra kl. 12:00', price: 350, icon: Clock, unit: 'engangsbeløb' },
  { id: 'late', name: 'Sen check-out', desc: 'Forlæng til kl. 14:00 på afrejsedagen', price: 350, icon: Clock, unit: 'engangsbeløb' },
  { id: 'crib', name: 'Barneseng', desc: 'Rejseseng med madras klar ved ankomst', price: 200, icon: Baby, unit: 'pr. ophold' },
  { id: 'premium', name: 'Premium-pakke', desc: 'Velkomstkurv, blomster, vin og lokale specialiteter', price: 495, icon: Sparkles, unit: 'engangsbeløb' },
];

export default function GuestAddons() {
  const { user, signOut } = useAuth();
  const [selected, setSelected] = useState<string[]>([]);
  const [dbAddons, setDbAddons] = useState<any[]>([]);

  useEffect(() => {
    loadAddons();
  }, []);

  const loadAddons = async () => {
    const { data } = await supabase.from('add_ons').select('*').eq('is_active', true).order('sort_order');
    if (data && data.length > 0) setDbAddons(data);
  };

  const addons = dbAddons.length > 0 
    ? dbAddons.map(a => ({ id: a.id, name: a.name, desc: a.description || '', price: a.price, icon: ShoppingBag, unit: a.price_type === 'per_night' ? 'pr. nat' : 'engangsbeløb' }))
    : defaultAddons;

  const toggle = (id: string) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const totalPrice = addons.filter(a => selected.includes(a.id)).reduce((s, a) => s + a.price, 0);

  return (
    <GuestLayout guestEmail={user?.email} onLogout={signOut}>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Tilkøb</h1>
          <p className="text-sm text-muted-foreground mt-1">Gør dit ophold endnu bedre med ekstra services</p>
        </div>

        <div className="space-y-2">
          {addons.map(addon => {
            const isSelected = selected.includes(addon.id);
            const Icon = addon.icon;
            return (
              <Card 
                key={addon.id} 
                className={`cursor-pointer transition-all ${isSelected ? 'border-accent bg-accent/5' : 'hover:border-accent/20'}`}
                onClick={() => toggle(addon.id)}
              >
                <CardContent className="p-4 flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${isSelected ? 'bg-accent/20' : 'bg-muted'}`}>
                    <Icon className={`w-5 h-5 ${isSelected ? 'text-accent' : 'text-muted-foreground'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-foreground">{addon.name}</div>
                    <p className="text-xs text-muted-foreground">{addon.desc}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-semibold text-foreground">{addon.price} kr</div>
                    <div className="text-[10px] text-muted-foreground">{addon.unit}</div>
                  </div>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${isSelected ? 'border-accent bg-accent' : 'border-muted-foreground/30'}`}>
                    {isSelected && <Check className="w-3.5 h-3.5 text-background" />}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {selected.length > 0 && (
          <Card className="border-accent/30 bg-accent/5 sticky bottom-4">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-foreground">{selected.length} tilkøb valgt</div>
                <div className="text-xs text-muted-foreground">Total: {totalPrice} kr</div>
              </div>
              <Button variant="gold" onClick={() => toast.success('Tilkøb anmodet — vi bekræfter snarest')}>
                Bekræft tilkøb
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </GuestLayout>
  );
}
