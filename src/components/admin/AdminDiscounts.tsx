import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Loader2, Plus, Trash2, Percent, Tag } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth';

interface DiscountRule {
  id: string; name: string; description: string | null; code: string | null; listing_id: string | null;
  discount_type: string; discount_value: number; min_nights: number;
  max_nights: number | null; is_active: boolean; combinable_with_codes: boolean; sort_order: number;
}

export function AdminDiscounts() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [rules, setRules] = useState<DiscountRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  const fetchRules = async () => {
    const { data } = await supabase.from('discount_rules').select('*').order('sort_order', { ascending: true });
    setRules((data as any) || []);
    setLoading(false);
  };

  useEffect(() => { fetchRules(); }, []);

  const addRule = async () => {
    setSaving('new');
    const { error } = await supabase.from('discount_rules').insert({
      name: 'Ny rabat', code: null, owner_id: user?.id,
      discount_type: 'percentage', discount_value: 10, min_nights: 4,
      is_active: false, combinable_with_codes: false, sort_order: rules.length,
    });
    if (error) toast({ title: 'Fejl: ' + error.message, variant: 'destructive' });
    else { toast({ title: 'Rabat oprettet' }); await fetchRules(); }
    setSaving(null);
  };

  const updateRule = async (id: string, updates: Partial<DiscountRule>) => {
    setSaving(id);
    const { error } = await supabase.from('discount_rules').update(updates as any).eq('id', id);
    if (error) toast({ title: 'Fejl: ' + error.message, variant: 'destructive' });
    else { setRules(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r)); toast({ title: 'Gemt' }); }
    setSaving(null);
  };

  const deleteRule = async (id: string) => {
    if (!confirm('Slet denne rabat?')) return;
    setSaving(id);
    const { error } = await supabase.from('discount_rules').delete().eq('id', id);
    if (error) toast({ title: 'Fejl: ' + error.message, variant: 'destructive' });
    else { toast({ title: 'Slettet' }); setRules(prev => prev.filter(r => r.id !== id)); }
    setSaving(null);
  };

  if (loading) return <div className="flex items-center gap-2 py-8 text-muted-foreground justify-center"><Loader2 className="h-4 w-4 animate-spin" /> Indlæser…</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground">Rabatregler</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Automatiske rabatter der vises i booking-wizarden</p>
        </div>
        <Button size="sm" onClick={addRule} disabled={saving === 'new'} className="gap-1.5">
          {saving === 'new' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />} Tilføj rabat
        </Button>
      </div>

      {rules.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">
          <Tag className="h-8 w-8 mx-auto mb-3 opacity-40" /> Ingen rabatregler endnu
        </div>
      ) : (
        <div className="space-y-3">
          {rules.map((rule) => (
            <div key={rule.id} className="bg-card border border-border rounded-xl p-4 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0"><Percent className="h-4 w-4 text-primary" /></div>
                  <Input value={rule.name} onChange={(e) => setRules(prev => prev.map(r => r.id === rule.id ? { ...r, name: e.target.value } : r))}
                    onBlur={() => updateRule(rule.id, { name: rule.name })} className="font-medium h-8 text-sm" />
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={rule.is_active} onCheckedChange={(checked) => updateRule(rule.id, { is_active: checked })} />
                  <Button variant="ghost" size="sm" onClick={() => deleteRule(rule.id)} className="text-destructive h-8 w-8 p-0">
                    {saving === rule.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <div><label className="text-[11px] text-muted-foreground uppercase tracking-wider">Kode</label>
                  <Input value={rule.code || ''} placeholder="Valgfri"
                    onChange={(e) => setRules(prev => prev.map(r => r.id === rule.id ? { ...r, code: e.target.value.toUpperCase() || null } : r))}
                    onBlur={() => updateRule(rule.id, { code: rule.code?.trim() || null })} className="h-8 text-sm mt-1 uppercase" />
                </div>
                <div><label className="text-[11px] text-muted-foreground uppercase tracking-wider">Rabat (%)</label>
                  <Input type="number" min={0} max={100} value={rule.discount_value}
                    onChange={(e) => setRules(prev => prev.map(r => r.id === rule.id ? { ...r, discount_value: Number(e.target.value) } : r))}
                    onBlur={() => updateRule(rule.id, { discount_value: rule.discount_value })} className="h-8 text-sm mt-1" />
                </div>
                <div><label className="text-[11px] text-muted-foreground uppercase tracking-wider">Min. nætter</label>
                  <Input type="number" min={1} value={rule.min_nights}
                    onChange={(e) => setRules(prev => prev.map(r => r.id === rule.id ? { ...r, min_nights: Number(e.target.value) } : r))}
                    onBlur={() => updateRule(rule.id, { min_nights: rule.min_nights })} className="h-8 text-sm mt-1" />
                </div>
                <div><label className="text-[11px] text-muted-foreground uppercase tracking-wider">Maks. nætter</label>
                  <Input type="number" min={0} value={rule.max_nights || ''} placeholder="∞"
                    onChange={(e) => setRules(prev => prev.map(r => r.id === rule.id ? { ...r, max_nights: e.target.value ? Number(e.target.value) : null } : r))}
                    onBlur={() => updateRule(rule.id, { max_nights: rule.max_nights })} className="h-8 text-sm mt-1" />
                </div>
                <div><label className="text-[11px] text-muted-foreground uppercase tracking-wider">Kombinerbar</label>
                  <div className="mt-2"><Switch checked={rule.combinable_with_codes} onCheckedChange={(checked) => updateRule(rule.id, { combinable_with_codes: checked })} /></div>
                </div>
              </div>
              <div><label className="text-[11px] text-muted-foreground uppercase tracking-wider">Beskrivelse</label>
                <Input value={rule.description || ''} placeholder="Vises i booking-wizarden"
                  onChange={(e) => setRules(prev => prev.map(r => r.id === rule.id ? { ...r, description: e.target.value } : r))}
                  onBlur={() => updateRule(rule.id, { description: rule.description })} className="h-8 text-sm mt-1" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
