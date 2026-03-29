import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Loader2, AlertTriangle } from 'lucide-react';
import { type SeasonRule, dayName } from '@/lib/pricing';
import { useAuth } from '@/lib/auth';

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  listingId: string;
  existingRule: SeasonRule | null;
  allRules: SeasonRule[];
  onSaved: () => void;
}

const DAYS = [0, 1, 2, 3, 4, 5, 6];

function isDateInRange(month: number, day: number, startMonth: number, startDay: number, endMonth: number, endDay: number): boolean {
  const val = month * 100 + day;
  const s = startMonth * 100 + startDay;
  const e = endMonth * 100 + endDay;
  if (s <= e) return val >= s && val <= e;
  return val >= s || val <= e;
}

export function SeasonRuleDialog({ open, onOpenChange, listingId, existingRule, allRules, onSaved }: Props) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [startMonth, setStartMonth] = useState(1);
  const [startDay, setStartDay] = useState(1);
  const [endMonth, setEndMonth] = useState(12);
  const [endDay, setEndDay] = useState(31);
  const [priceType, setPriceType] = useState<'fixed' | 'percentage'>('fixed');
  const [pricePerNight, setPricePerNight] = useState(0);
  const [pricePercentage, setPricePercentage] = useState(0);
  const [minNights, setMinNights] = useState(2);
  const [priority, setPriority] = useState(0);
  const [status, setStatus] = useState<'active' | 'draft'>('draft');
  const [checkInDays, setCheckInDays] = useState<number[]>([]);
  const [checkOutDays, setCheckOutDays] = useState<number[]>([]);
  const [useCheckInDays, setUseCheckInDays] = useState(false);
  const [useCheckOutDays, setUseCheckOutDays] = useState(false);
  const [saving, setSaving] = useState(false);
  const [overlaps, setOverlaps] = useState<string[]>([]);

  useEffect(() => {
    if (open) {
      if (existingRule) {
        setName(existingRule.name);
        setStartMonth(existingRule.start_month);
        setStartDay(existingRule.start_day);
        setEndMonth(existingRule.end_month);
        setEndDay(existingRule.end_day);
        setPriceType(existingRule.price_type || 'fixed');
        setPricePerNight(existingRule.price_per_night / 100);
        setPricePercentage(existingRule.price_percentage ?? 0);
        setMinNights(existingRule.min_nights || 1);
        setPriority(existingRule.priority || 0);
        setStatus(existingRule.status as any);
        setCheckInDays(existingRule.check_in_days || []);
        setCheckOutDays(existingRule.check_out_days || []);
        setUseCheckInDays(!!(existingRule.check_in_days && existingRule.check_in_days.length > 0));
        setUseCheckOutDays(!!(existingRule.check_out_days && existingRule.check_out_days.length > 0));
      } else {
        setName(''); setStartMonth(1); setStartDay(1);
        setEndMonth(12); setEndDay(31); setPriceType('fixed');
        setPricePerNight(0); setPricePercentage(0);
        setMinNights(2); setPriority(0); setStatus('draft');
        setCheckInDays([]); setCheckOutDays([]);
        setUseCheckInDays(false); setUseCheckOutDays(false);
      }
      setOverlaps([]);
    }
  }, [open, existingRule]);

  const checkOverlaps = () => {
    const others = allRules.filter((r) => r.status === 'active' && r.id !== existingRule?.id);
    const warnings: string[] = [];
    for (const r of others) {
      for (let m = startMonth; m <= (endMonth < startMonth ? 12 : endMonth); m++) {
        const d = m === startMonth ? startDay : 1;
        if (isDateInRange(m, d, r.start_month, r.start_day, r.end_month, r.end_day)) {
          warnings.push(`Overlapper med "${r.name}" (${r.start_day}/${r.start_month} – ${r.end_day}/${r.end_month}, prio ${r.priority || 0})`);
          break;
        }
      }
    }
    return warnings;
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast({ title: 'Indtast et navn', variant: 'destructive' });
      return;
    }
    if (status === 'active' && overlaps.length === 0) {
      const warns = checkOverlaps();
      if (warns.length > 0) { setOverlaps(warns); return; }
    }

    setSaving(true);
    const data = {
      listing_id: listingId,
      owner_id: user?.id,
      name: name.trim(),
      start_month: startMonth, start_day: startDay,
      end_month: endMonth, end_day: endDay,
      price_type: priceType,
      price_per_night: Math.round(pricePerNight * 100),
      price_percentage: priceType === 'percentage' ? pricePercentage : null,
      min_nights: minNights, priority, status,
      check_in_days: useCheckInDays && checkInDays.length > 0 ? checkInDays : null,
      check_out_days: useCheckOutDays && checkOutDays.length > 0 ? checkOutDays : null,
    };

    let error;
    if (existingRule) {
      ({ error } = await supabase.from('season_rules').update(data).eq('id', existingRule.id));
    } else {
      ({ error } = await supabase.from('season_rules').insert(data));
    }
    setSaving(false);

    if (error) {
      toast({ title: 'Fejl ved gem', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: existingRule ? 'Sæsonregel opdateret' : 'Sæsonregel oprettet' });
    onSaved();
  };

  const toggleDay = (day: number, list: number[], setList: (d: number[]) => void) => {
    setList(list.includes(day) ? list.filter((d) => d !== day) : [...list, day]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{existingRule ? 'Redigér sæsonregel' : 'Ny sæsonregel'}</DialogTitle>
          <DialogDescription>Sæsonregler styrer pris, min. nætter og check-in/out restriktioner.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Navn</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Fx 'Sommersæson'" />
          </div>

          <div className="grid grid-cols-4 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">Start md.</Label>
              <Input type="number" min={1} max={12} value={startMonth} onChange={(e) => setStartMonth(+e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Start dag</Label>
              <Input type="number" min={1} max={31} value={startDay} onChange={(e) => setStartDay(+e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Slut md.</Label>
              <Input type="number" min={1} max={12} value={endMonth} onChange={(e) => setEndMonth(+e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Slut dag</Label>
              <Input type="number" min={1} max={31} value={endDay} onChange={(e) => setEndDay(+e.target.value)} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Pristype</Label>
            <Select value={priceType} onValueChange={(v) => setPriceType(v as any)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="fixed">Fast pris (DKK/nat)</SelectItem>
                <SelectItem value="percentage">Procentændring fra basispris</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {priceType === 'fixed' ? (
            <div className="space-y-1.5">
              <Label>Pris pr. nat (DKK)</Label>
              <Input type="number" min={0} value={pricePerNight} onChange={(e) => setPricePerNight(+e.target.value)} />
            </div>
          ) : (
            <div className="space-y-1.5">
              <Label>Procentændring (%)</Label>
              <Input type="number" value={pricePercentage} onChange={(e) => setPricePercentage(+e.target.value)} placeholder="Fx 20 for +20%" />
              <p className="text-xs text-muted-foreground">Positiv = dyrere, negativ = billigere</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Minimum nætter</Label>
              <Input type="number" min={1} value={minNights} onChange={(e) => setMinNights(+e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Prioritet</Label>
              <Input type="number" min={0} value={priority} onChange={(e) => setPriority(+e.target.value)} />
              <p className="text-xs text-muted-foreground">Højere = vinder ved overlap</p>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as any)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft (ikke live)</SelectItem>
                <SelectItem value="active">Aktiv (live)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Checkbox checked={useCheckInDays} onCheckedChange={(c) => setUseCheckInDays(!!c)} />
              <Label className="text-sm">Begræns check-in dage</Label>
            </div>
            {useCheckInDays && (
              <div className="flex flex-wrap gap-2 ml-6">
                {DAYS.map((d) => (
                  <Button key={d} size="sm" variant={checkInDays.includes(d) ? 'default' : 'outline'}
                    className="h-7 text-xs px-2" onClick={() => toggleDay(d, checkInDays, setCheckInDays)}>
                    {dayName(d).slice(0, 3)}
                  </Button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Checkbox checked={useCheckOutDays} onCheckedChange={(c) => setUseCheckOutDays(!!c)} />
              <Label className="text-sm">Begræns check-out dage</Label>
            </div>
            {useCheckOutDays && (
              <div className="flex flex-wrap gap-2 ml-6">
                {DAYS.map((d) => (
                  <Button key={d} size="sm" variant={checkOutDays.includes(d) ? 'default' : 'outline'}
                    className="h-7 text-xs px-2" onClick={() => toggleDay(d, checkOutDays, setCheckOutDays)}>
                    {dayName(d).slice(0, 3)}
                  </Button>
                ))}
              </div>
            )}
          </div>

          {overlaps.length > 0 && (
            <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-destructive">
                <AlertTriangle className="h-4 w-4" /> Overlap med eksisterende aktive regler
              </div>
              <ul className="space-y-1">
                {overlaps.map((o, i) => (<li key={i} className="text-xs text-destructive/80">• {o}</li>))}
              </ul>
              <p className="text-xs text-muted-foreground">Klik "Gem alligevel" for at gemme. Reglen med højest prioritet bruges.</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Annuller</Button>
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {overlaps.length > 0 ? 'Gem alligevel' : 'Gem'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
