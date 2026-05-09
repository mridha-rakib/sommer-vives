import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { GuestLayout } from '@/components/layout/GuestLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Loader2, ShoppingBag, Crown, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

const defaultAddons = [
  { id: 'early', name: 'Tidlig check-in', desc: 'Ankom allerede fra kl. 12:00 — start ferien 3 timer tidligere', price: 350, unit: 'engangsbeløb', emoji: '🕐', popular: true },
  { id: 'late', name: 'Sen check-out', desc: 'Forlæng til kl. 14:00 — ingen stress på afrejsedagen', price: 350, unit: 'engangsbeløb', emoji: '☀️', popular: true },
  { id: 'linen', name: 'Sengelinned & håndklæder', desc: 'Komplet sæt klar ved ankomst — spar besværet', price: 150, unit: 'pr. sæt', emoji: '🛏️' },
  { id: 'crib', name: 'Barneseng', desc: 'Rejseseng med madras, klar og gjort i soveværelset', price: 200, unit: 'pr. ophold', emoji: '👶' },
  { id: 'premium', name: 'Velkomstpakke', desc: 'Lokal vin, blomster og håndplukkede specialiteter', price: 495, unit: 'engangsbeløb', emoji: '🎁' },
];

export default function GuestAddons() {
  const { user, signOut } = useAuth();
  const [selected, setSelected] = useState<string[]>([]);
  const [dbAddons, setDbAddons] = useState<any[]>([]);
  const [paying, setPaying] = useState(false);
  const [bookingId, setBookingId] = useState<string | null>(null);

  useEffect(() => {
    loadAddons();
    loadBooking();
  }, [user]);

  const loadAddons = async () => {
    const { data } = await supabase.from('add_ons').select('*').eq('is_active', true).order('sort_order');
    if (data && data.length > 0) setDbAddons(data);
  };

  const loadBooking = async () => {
    if (!user?.email) return;
    const { data } = await supabase
      .from('bookings').select('id').eq('guest_email', user.email)
      .in('status', ['confirmed', 'pending']).order('check_in', { ascending: true }).limit(1);
    if (data?.[0]) setBookingId(data[0].id);
  };

  const addons = dbAddons.length > 0
    ? dbAddons.map(a => ({
        id: a.id, name: a.name, desc: a.description || '', price: a.price / 100,
        unit: a.price_type === 'per_night' ? 'pr. nat' : a.price_type === 'per_guest' ? 'pr. gæst' : 'engangsbeløb',
        emoji: '✨',
      }))
    : defaultAddons;

  const toggle = (id: string) => setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const selectedAddons = addons.filter(a => selected.includes(a.id));
  const totalPrice = selectedAddons.reduce((s, a) => s + a.price, 0);

  const handleCheckout = async () => {
    if (selectedAddons.length === 0) return;
    setPaying(true);
    try {
      const items = selectedAddons.map(a => ({ name: a.name, description: a.desc, price: a.price, quantity: 1, itemType: 'addon', referenceId: a.id }));
      const { data, error } = await supabase.functions.invoke('create-addon-checkout', {
        body: { items, bookingId, userType: 'guest', successUrl: `${window.location.origin}/guest/addons?payment=success`, cancelUrl: `${window.location.origin}/guest/addons?payment=cancelled` },
      });
      if (error || !data?.url) throw new Error(error?.message || 'Kunne ikke oprette betaling');
      window.location.href = data.url;
    } catch {
      toast.error('Der opstod en fejl. Prøv venligst igen.');
      setPaying(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ps = params.get('payment');
    if (ps === 'success') { toast.success('Betaling gennemført! Vi klargør dit tilkøb.'); window.history.replaceState({}, '', '/guest/addons'); }
    else if (ps === 'cancelled') { toast.error('Betaling annulleret.'); window.history.replaceState({}, '', '/guest/addons'); }
  }, []);

  const popularAddons = addons.filter((a: any) => a.popular);
  const otherAddons = addons.filter((a: any) => !a.popular);

  return (
    <GuestLayout guestEmail={user?.email} onLogout={signOut}>
      <div className="space-y-6">
        {/* Header — warm, not salesy */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-[hsl(var(--gold))]/10 flex items-center justify-center">
              <Crown className="w-5 h-5 text-[hsl(var(--gold))]" />
            </div>
            <div>
              <h1 className="font-display text-xl font-bold text-foreground">Gør opholdet komplet</h1>
              <p className="text-xs text-muted-foreground">Håndplukket til dit ophold — tilføj det du har lyst til</p>
            </div>
          </div>
        </motion.div>

        {/* Popular / Recommended */}
        {popularAddons.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-2">
            <span className="text-[10px] font-semibold tracking-[0.15em] uppercase text-[hsl(var(--gold))]/70 px-1">Mest populære</span>
            {popularAddons.map((addon: any) => (
              <AddonCard key={addon.id} addon={addon} isSelected={selected.includes(addon.id)} onToggle={() => toggle(addon.id)} recommended />
            ))}
          </motion.div>
        )}

        {/* Other add-ons */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="space-y-2">
          {popularAddons.length > 0 && (
            <span className="text-[10px] font-semibold tracking-[0.15em] uppercase text-muted-foreground/60 px-1">Flere muligheder</span>
          )}
          {(popularAddons.length > 0 ? otherAddons : addons).map((addon: any) => (
            <AddonCard key={addon.id} addon={addon} isSelected={selected.includes(addon.id)} onToggle={() => toggle(addon.id)} />
          ))}
        </motion.div>

        {/* Sticky checkout bar */}
        {selected.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="sticky bottom-20 md:bottom-4 z-30"
          >
            <Card className="border-[hsl(var(--gold))]/20 bg-card/95 backdrop-blur-xl shadow-2xl rounded-2xl">
              <CardContent className="p-4 flex items-center justify-between gap-4">
                <div>
                  <div className="text-sm font-semibold text-foreground">{selected.length} tilkøb valgt</div>
                  <div className="text-xs text-muted-foreground">
                    Total: <span className="font-semibold text-[hsl(var(--gold))]">{totalPrice} kr</span>
                  </div>
                </div>
                <Button variant="gold" onClick={handleCheckout} disabled={paying} className="gap-2 rounded-xl">
                  {paying && <Loader2 className="h-4 w-4 animate-spin" />}
                  {paying ? 'Åbner...' : 'Fortsæt til betaling'}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Reassurance */}
        <div className="text-center pb-4">
          <p className="text-[11px] text-muted-foreground/50 leading-relaxed">
            Alle tilkøb klargøres inden din ankomst · Ingen skjulte gebyrer
          </p>
        </div>
      </div>
    </GuestLayout>
  );
}

function AddonCard({ addon, isSelected, onToggle, recommended }: { addon: any; isSelected: boolean; onToggle: () => void; recommended?: boolean }) {
  return (
    <Card
      className={`cursor-pointer transition-all duration-300 rounded-2xl ${
        isSelected
          ? 'border-[hsl(var(--gold))]/30 bg-[hsl(var(--gold))]/[0.04] shadow-sm'
          : 'border-border/30 hover:border-border/50 bg-card/60'
      }`}
      onClick={onToggle}
    >
      <CardContent className="p-4 flex items-center gap-4">
        <div className="text-2xl shrink-0 w-10 text-center">{addon.emoji}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground">{addon.name}</span>
            {recommended && (
              <Badge className="bg-[hsl(var(--gold))]/10 text-[hsl(var(--gold))] border-[hsl(var(--gold))]/20 text-[9px] px-1.5 py-0">Anbefalet</Badge>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{addon.desc}</p>
        </div>
        <div className="text-right shrink-0 mr-1">
          <div className="text-sm font-bold text-foreground">{addon.price} kr</div>
          <div className="text-[9px] text-muted-foreground">{addon.unit}</div>
        </div>
        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-200 ${
          isSelected ? 'border-[hsl(var(--gold))] bg-[hsl(var(--gold))]' : 'border-border/50'
        }`}>
          {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
        </div>
      </CardContent>
    </Card>
  );
}
