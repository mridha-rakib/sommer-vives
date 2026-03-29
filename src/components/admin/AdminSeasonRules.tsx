import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Plus, Pencil, Trash2, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatDKK, dayName, type SeasonRule } from '@/lib/pricing';
import { SeasonRuleDialog } from './SeasonRuleDialog';
import { useAuth } from '@/lib/auth';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface ListingOption { id: string; name: string; }

export function AdminSeasonRules() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [listings, setListings] = useState<ListingOption[]>([]);
  const [selectedListingId, setSelectedListingId] = useState('');
  const [rules, setRules] = useState<SeasonRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'draft'>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<SeasonRule | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [lRes, rRes] = await Promise.all([
      supabase.from('listings').select('id, name').eq('is_active', true),
      supabase.from('season_rules').select('*'),
    ]);
    if (lRes.data) {
      setListings(lRes.data);
      if (!selectedListingId && lRes.data.length > 0) setSelectedListingId(lRes.data[0].id);
    }
    if (rRes.data) setRules(rRes.data as SeasonRule[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = rules
    .filter((r) => r.listing_id === selectedListingId)
    .filter((r) => filter === 'all' ? true : r.status === filter)
    .sort((a, b) => (b.priority || 0) - (a.priority || 0));

  const handleToggleStatus = async (rule: SeasonRule) => {
    const newStatus = rule.status === 'active' ? 'draft' : 'active';
    const { error } = await supabase.from('season_rules').update({ status: newStatus }).eq('id', rule.id);
    if (error) toast({ title: 'Fejl', description: error.message, variant: 'destructive' });
    else { toast({ title: `Status ændret til ${newStatus === 'active' ? 'Aktiv' : 'Kladde'}` }); fetchData(); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from('season_rules').delete().eq('id', deleteId);
    if (error) toast({ title: 'Fejl', description: error.message, variant: 'destructive' });
    else { toast({ title: 'Sæsonregel slettet' }); fetchData(); }
    setDeleteId(null);
  };

  const handleDuplicate = async (rule: SeasonRule) => {
    const { id, ...rest } = rule;
    const { error } = await supabase.from('season_rules').insert({
      ...rest, name: `${rest.name} (kopi)`, status: 'draft', owner_id: user?.id,
    });
    if (error) toast({ title: 'Fejl', description: error.message, variant: 'destructive' });
    else { toast({ title: 'Sæsonregel kopieret som kladde' }); fetchData(); }
  };

  const formatDateRange = (r: SeasonRule) => `${r.start_day}/${r.start_month} – ${r.end_day}/${r.end_month}`;

  const formatPrice = (r: SeasonRule) => {
    if (r.price_type === 'percentage' && r.price_percentage !== null) {
      return `${r.price_percentage > 0 ? '+' : ''}${r.price_percentage}%`;
    }
    return formatDKK(r.price_per_night);
  };

  const formatDays = (days: number[] | null) => {
    if (!days || days.length === 0) return 'Alle';
    return days.map((d) => dayName(d).slice(0, 3)).join(', ');
  };

  if (loading) return <div className="flex items-center justify-center py-20 text-muted-foreground gap-2"><Loader2 className="h-5 w-5 animate-spin" /> Henter sæsonregler...</div>;

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col gap-3">
        <div>
          <h2 className="font-display text-xl md:text-2xl font-semibold text-foreground">Sæsonregler</h2>
          <p className="text-sm text-muted-foreground mt-1">Sæsonpriser, minimum nætter og check-in/out regler.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={selectedListingId} onValueChange={setSelectedListingId}>
            <SelectTrigger className="w-[150px] h-9 text-xs"><SelectValue placeholder="Vælg listing" /></SelectTrigger>
            <SelectContent>
              {listings.map((l) => (<SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>))}
            </SelectContent>
          </Select>
          <Select value={filter} onValueChange={(v) => setFilter(v as any)}>
            <SelectTrigger className="w-[110px] h-9 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle</SelectItem>
              <SelectItem value="active">Aktive</SelectItem>
              <SelectItem value="draft">Kladder</SelectItem>
            </SelectContent>
          </Select>
          <Button size="sm" className="gap-1.5 ml-auto" onClick={() => { setEditingRule(null); setDialogOpen(true); }}>
            <Plus className="h-3.5 w-3.5" /> Ny regel
          </Button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <p className="text-muted-foreground">Ingen sæsonregler fundet.</p>
          <Button variant="outline" className="mt-4 gap-1.5" onClick={() => { setEditingRule(null); setDialogOpen(true); }}>
            <Plus className="h-3.5 w-3.5" /> Opret sæsonregel
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((rule) => (
            <div key={rule.id} className={`bg-card border border-border rounded-xl p-4 ${rule.status === 'draft' ? 'opacity-60' : ''}`}>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-medium text-sm text-foreground">{rule.name}</h4>
                    <Badge className="cursor-pointer select-none text-[10px]" variant={rule.status === 'active' ? 'default' : 'secondary'} onClick={() => handleToggleStatus(rule)}>
                      {rule.status === 'active' ? 'Aktiv' : 'Kladde'}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{formatDateRange(rule)} · Prioritet {rule.priority || 0}</p>
                </div>
                <div className="flex items-center gap-0.5 shrink-0">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditingRule(rule); setDialogOpen(true); }}><Pencil className="h-3.5 w-3.5" /></Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDuplicate(rule)}><Copy className="h-3.5 w-3.5" /></Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteId(rule.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div><span className="text-muted-foreground">Pris</span><p className="font-medium text-foreground">{formatPrice(rule)}</p></div>
                <div><span className="text-muted-foreground">Min. nætter</span><p className="font-medium text-foreground">{rule.min_nights} {rule.min_nights === 1 ? 'nat' : 'nætter'}</p></div>
                <div><span className="text-muted-foreground">Check-in</span><p className="font-medium text-foreground">{formatDays(rule.check_in_days)}</p></div>
                <div><span className="text-muted-foreground">Check-out</span><p className="font-medium text-foreground">{formatDays(rule.check_out_days)}</p></div>
              </div>
            </div>
          ))}
        </div>
      )}

      <SeasonRuleDialog open={dialogOpen} onOpenChange={setDialogOpen} listingId={selectedListingId}
        existingRule={editingRule} allRules={rules.filter((r) => r.listing_id === selectedListingId)}
        onSaved={() => { setDialogOpen(false); setEditingRule(null); fetchData(); }} />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Slet sæsonregel?</AlertDialogTitle>
            <AlertDialogDescription>Denne handling kan ikke fortrydes. Sæsonreglen fjernes permanent.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuller</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Slet</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
