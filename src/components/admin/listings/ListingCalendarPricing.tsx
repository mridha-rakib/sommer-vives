import { useState, useMemo, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import {
  ChevronLeft, ChevronRight, Plus, X, CalendarIcon, Lock, Users,
  DollarSign, Loader2, AlertTriangle, Info, CheckCircle2
} from 'lucide-react';

interface Props {
  listingId: string;
  ownerId: string;
  basePricePerNight: number;
  weekendPricePerNight: number | null;
  minNights: number | null;
  cleaningFee: number | null;
  checkInTime: string | null;
}

interface SeasonRule {
  id: string;
  name: string;
  start_month: number;
  start_day: number;
  end_month: number;
  end_day: number;
  price_per_night: number;
  min_nights: number | null;
  price_type: string;
  priority: number | null;
  status: string;
  check_in_days: number[] | null;
  check_out_days: number[] | null;
}

interface Block {
  id: string;
  start_date: string;
  end_date: string;
  reason: string | null;
  source: string;
  summary: string | null;
}

interface Booking {
  id: string;
  check_in: string;
  check_out: string;
  guest_name: string | null;
  status: string | null;
}

const MONTHS_DA = ['Januar', 'Februar', 'Marts', 'April', 'Maj', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'December'];
const DAYS_DA = ['Man', 'Tir', 'Ons', 'Tor', 'Fre', 'Lør', 'Søn'];
const DAY_NAMES = ['Søndag', 'Mandag', 'Tirsdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lørdag'];

function dateStr(d: Date) {
  return d.toISOString().split('T')[0];
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function isInRange(d: Date, start: string, end: string) {
  const ds = dateStr(d);
  return ds >= start && ds <= end;
}

export function ListingCalendarPricing({ listingId, ownerId, basePricePerNight, weekendPricePerNight, minNights, cleaningFee, checkInTime }: Props) {
  const { toast } = useToast();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [seasons, setSeasons] = useState<SeasonRule[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  // Block dialog
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [blockStart, setBlockStart] = useState('');
  const [blockEnd, setBlockEnd] = useState('');
  const [blockReason, setBlockReason] = useState('');
  const [blockSaving, setBlockSaving] = useState(false);

  // Season dialog
  const [seasonDialogOpen, setSeasonDialogOpen] = useState(false);
  const [seasonName, setSeasonName] = useState('');
  const [seasonStartMonth, setSeasonStartMonth] = useState(6);
  const [seasonStartDay, setSeasonStartDay] = useState(1);
  const [seasonEndMonth, setSeasonEndMonth] = useState(8);
  const [seasonEndDay, setSeasonEndDay] = useState(31);
  const [seasonPrice, setSeasonPrice] = useState(0);
  const [seasonMinNights, setSeasonMinNights] = useState(3);
  const [seasonCheckInDays, setSeasonCheckInDays] = useState<number[]>([]);
  const [seasonSaving, setSeasonSaving] = useState(false);

  // Selected day
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  useEffect(() => {
    const load = async () => {
      const [seasonsRes, blocksRes, bookingsRes] = await Promise.all([
        supabase.from('season_rules').select('*').eq('listing_id', listingId).order('priority'),
        supabase.from('listing_blocks').select('*').eq('listing_id', listingId).order('start_date'),
        supabase.from('bookings').select('id, check_in, check_out, guest_name, status').eq('property_id', listingId).in('status', ['confirmed', 'pending']),
      ]);
      if (seasonsRes.data) setSeasons(seasonsRes.data as SeasonRule[]);
      if (blocksRes.data) setBlocks(blocksRes.data as Block[]);
      if (bookingsRes.data) setBookings(bookingsRes.data as Booking[]);
      setLoading(false);
    };
    load();
  }, [listingId]);

  // Calendar grid
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDayOfWeek = (firstDay.getDay() + 6) % 7; // Mon=0
    const days: (Date | null)[] = [];
    for (let i = 0; i < startDayOfWeek; i++) days.push(null);
    for (let d = 1; d <= lastDay.getDate(); d++) days.push(new Date(year, month, d));
    return days;
  }, [currentMonth]);

  const getDayStatus = (d: Date): { type: 'available' | 'booked' | 'blocked' | 'past'; booking?: Booking; block?: Block; seasonPrice?: number } => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (d < today) return { type: 'past' };

    const ds = dateStr(d);
    const booking = bookings.find(b => ds >= b.check_in && ds < b.check_out);
    if (booking) return { type: 'booked', booking };

    const block = blocks.find(b => isInRange(d, b.start_date, b.end_date));
    if (block) return { type: 'blocked', block };

    // Check season price
    const m = d.getMonth() + 1;
    const day = d.getDate();
    const matchingSeason = seasons.find(s => {
      if (s.status !== 'active') return false;
      if (s.start_month < s.end_month || (s.start_month === s.end_month && s.start_day <= s.end_day)) {
        return (m > s.start_month || (m === s.start_month && day >= s.start_day)) &&
               (m < s.end_month || (m === s.end_month && day <= s.end_day));
      }
      return (m > s.start_month || (m === s.start_month && day >= s.start_day)) ||
             (m < s.end_month || (m === s.end_month && day <= s.end_day));
    });

    return { type: 'available', seasonPrice: matchingSeason?.price_per_night };
  };

  const handleAddBlock = async () => {
    if (!blockStart || !blockEnd) return;
    setBlockSaving(true);
    const { error } = await supabase.from('listing_blocks').insert({
      listing_id: listingId,
      owner_id: ownerId,
      start_date: blockStart,
      end_date: blockEnd,
      reason: blockReason || null,
      source: 'manual',
    });
    if (error) {
      toast({ title: 'Fejl', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Blokering tilføjet' });
      setBlocks(prev => [...prev, { id: crypto.randomUUID(), start_date: blockStart, end_date: blockEnd, reason: blockReason, source: 'manual', summary: null }]);
      setBlockDialogOpen(false);
      setBlockStart(''); setBlockEnd(''); setBlockReason('');
    }
    setBlockSaving(false);
  };

  const handleDeleteBlock = async (id: string) => {
    await supabase.from('listing_blocks').delete().eq('id', id);
    setBlocks(prev => prev.filter(b => b.id !== id));
    toast({ title: 'Blokering fjernet' });
  };

  const handleAddSeason = async () => {
    if (!seasonName) return;
    setSeasonSaving(true);
    const { data, error } = await supabase.from('season_rules').insert({
      listing_id: listingId,
      owner_id: ownerId,
      name: seasonName,
      start_month: seasonStartMonth,
      start_day: seasonStartDay,
      end_month: seasonEndMonth,
      end_day: seasonEndDay,
      price_per_night: seasonPrice,
      min_nights: seasonMinNights,
      check_in_days: seasonCheckInDays.length > 0 ? seasonCheckInDays : null,
      price_type: 'fixed',
      status: 'active',
      priority: seasons.length,
    }).select().single();
    if (error) {
      toast({ title: 'Fejl', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Sæsonregel tilføjet' });
      if (data) setSeasons(prev => [...prev, data as SeasonRule]);
      setSeasonDialogOpen(false);
      setSeasonName(''); setSeasonPrice(0); setSeasonMinNights(3); setSeasonCheckInDays([]);
    }
    setSeasonSaving(false);
  };

  const handleDeleteSeason = async (id: string) => {
    await supabase.from('season_rules').delete().eq('id', id);
    setSeasons(prev => prev.filter(s => s.id !== id));
    toast({ title: 'Sæsonregel fjernet' });
  };

  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));

  const formatPrice = (v: number) => {
    if (v >= 100) return `${Math.round(v / 100)} kr`;
    return `${v} øre`;
  };

  const isWeekend = (d: Date) => d.getDay() === 0 || d.getDay() === 6;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
        <Loader2 className="h-5 w-5 animate-spin" /> Henter kalender...
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* ── PRICING OVERVIEW ── */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h4 className="font-display text-sm font-semibold text-foreground mb-4">Prisoverblik</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="rounded-lg bg-muted/30 p-3 text-center">
            <p className="text-lg font-bold text-foreground">{formatPrice(basePricePerNight)}</p>
            <p className="text-[10px] text-muted-foreground">Basispris / nat</p>
          </div>
          <div className="rounded-lg bg-muted/30 p-3 text-center">
            <p className="text-lg font-bold text-foreground">{weekendPricePerNight ? formatPrice(weekendPricePerNight) : '+25%'}</p>
            <p className="text-[10px] text-muted-foreground">Weekend / nat</p>
          </div>
          <div className="rounded-lg bg-muted/30 p-3 text-center">
            <p className="text-lg font-bold text-foreground">{cleaningFee ? formatPrice(cleaningFee) : '—'}</p>
            <p className="text-[10px] text-muted-foreground">Rengøring</p>
          </div>
          <div className="rounded-lg bg-muted/30 p-3 text-center">
            <p className="text-lg font-bold text-foreground">{minNights || 2} nætter</p>
            <p className="text-[10px] text-muted-foreground">Minimum ophold</p>
          </div>
        </div>
      </div>

      {/* ── CALENDAR ── */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {/* Month navigation */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={prevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h4 className="font-display text-sm font-semibold text-foreground">
            {MONTHS_DA[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </h4>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-border">
          {DAYS_DA.map(d => (
            <div key={d} className="text-center text-[10px] font-semibold text-muted-foreground py-2">{d}</div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7">
          {calendarDays.map((day, i) => {
            if (!day) return <div key={`empty-${i}`} className="h-16 border-b border-r border-border/30 bg-muted/10" />;

            const status = getDayStatus(day);
            const isToday = isSameDay(day, new Date());
            const isSelected = selectedDate && isSameDay(day, selectedDate);
            const weekend = isWeekend(day);

            let bgClass = 'bg-card hover:bg-muted/30';
            let textClass = 'text-foreground';
            if (status.type === 'past') { bgClass = 'bg-muted/20'; textClass = 'text-muted-foreground/40'; }
            else if (status.type === 'booked') { bgClass = 'bg-primary/5'; }
            else if (status.type === 'blocked') { bgClass = 'bg-destructive/5'; }
            if (isSelected) bgClass = 'bg-primary/10 ring-1 ring-primary/30';

            return (
              <button
                key={dateStr(day)}
                onClick={() => setSelectedDate(isSelected ? null : day)}
                className={`h-16 border-b border-r border-border/30 p-1 text-left transition-colors relative ${bgClass}`}
              >
                <div className="flex items-center gap-1">
                  <span className={`text-[11px] font-medium ${textClass} ${isToday ? 'bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-[10px]' : ''}`}>
                    {day.getDate()}
                  </span>
                  {weekend && status.type === 'available' && <span className="text-[8px] text-muted-foreground">🌅</span>}
                </div>

                {status.type === 'booked' && (
                  <div className="mt-0.5">
                    <div className="text-[8px] bg-primary/15 text-primary rounded px-1 py-0.5 truncate font-medium">
                      {status.booking?.guest_name || 'Booking'}
                    </div>
                  </div>
                )}
                {status.type === 'blocked' && (
                  <div className="mt-0.5 flex items-center gap-0.5">
                    <Lock className="h-2.5 w-2.5 text-destructive/60" />
                    <span className="text-[8px] text-destructive/60">Blokeret</span>
                  </div>
                )}
                {status.type === 'available' && status.seasonPrice && (
                  <div className="mt-0.5">
                    <span className="text-[8px] text-amber-600 font-medium">{formatPrice(status.seasonPrice)}</span>
                  </div>
                )}
                {status.type === 'available' && !status.seasonPrice && weekend && (
                  <div className="mt-0.5">
                    <span className="text-[8px] text-muted-foreground">{weekendPricePerNight ? formatPrice(weekendPricePerNight) : '+25%'}</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="px-5 py-3 border-t border-border flex flex-wrap gap-4 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-card border border-border" /> Ledig</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-primary/15" /> Booket</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-destructive/10" /> Blokeret</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-muted/30" /> Fortid</span>
          <span className="flex items-center gap-1.5">🌅 Weekend</span>
        </div>
      </div>

      {/* ── SELECTED DATE PANEL ── */}
      {selectedDate && (() => {
        const st = getDayStatus(selectedDate);
        return (
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-display text-sm font-semibold text-foreground">
                {DAY_NAMES[selectedDate.getDay()]} {selectedDate.getDate()}. {MONTHS_DA[selectedDate.getMonth()]}
              </h4>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setSelectedDate(null)}>
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <Badge variant="outline" className="text-[10px]">
                {st.type === 'available' ? '✓ Ledig' : st.type === 'booked' ? '📅 Booket' : st.type === 'blocked' ? '🔒 Blokeret' : '⏳ Fortid'}
              </Badge>
              {isWeekend(selectedDate) && <span>🌅 Weekend</span>}
              {st.seasonPrice && <span className="text-amber-600">Sæsonpris: {formatPrice(st.seasonPrice)}</span>}
              {st.booking && <span>Gæst: {st.booking.guest_name}</span>}
              {st.block && <span>Årsag: {st.block.reason || 'Ingen'}</span>}
            </div>
            {st.type === 'available' && (
              <Button variant="outline" size="sm" className="text-xs h-7 gap-1.5" onClick={() => {
                setBlockStart(dateStr(selectedDate));
                setBlockEnd(dateStr(selectedDate));
                setBlockDialogOpen(true);
              }}>
                <Lock className="h-3 w-3" /> Bloker denne dato
              </Button>
            )}
            {st.type === 'blocked' && st.block && (
              <Button variant="outline" size="sm" className="text-xs h-7 gap-1.5 text-destructive" onClick={() => handleDeleteBlock(st.block!.id)}>
                <X className="h-3 w-3" /> Fjern blokering
              </Button>
            )}
          </div>
        );
      })()}

      {/* ── BLOCKS LIST ── */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="font-display text-sm font-semibold text-foreground">Blokeringer</h4>
            <p className="text-[10px] text-muted-foreground">{blocks.length} aktive blokeringer</p>
          </div>
          <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8" onClick={() => setBlockDialogOpen(true)}>
            <Plus className="h-3.5 w-3.5" /> Tilføj blokering
          </Button>
        </div>
        {blocks.length === 0 ? (
          <p className="text-xs text-muted-foreground italic py-4 text-center">Ingen blokeringer</p>
        ) : (
          <div className="space-y-2">
            {blocks.map(b => (
              <div key={b.id} className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg bg-muted/30">
                <div className="flex items-center gap-2 min-w-0">
                  <Lock className="h-3.5 w-3.5 text-destructive/60 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-foreground">{b.start_date} → {b.end_date}</p>
                    {b.reason && <p className="text-[10px] text-muted-foreground truncate">{b.reason}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <Badge variant="outline" className="text-[9px]">{b.source}</Badge>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-destructive/60 hover:text-destructive" onClick={() => handleDeleteBlock(b.id)}>
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── SEASON RULES ── */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="font-display text-sm font-semibold text-foreground">Sæsonpriser</h4>
            <p className="text-[10px] text-muted-foreground">Tilpassede priser for specifikke perioder</p>
          </div>
          <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8" onClick={() => setSeasonDialogOpen(true)}>
            <Plus className="h-3.5 w-3.5" /> Tilføj sæson
          </Button>
        </div>
        {seasons.length === 0 ? (
          <div className="text-center py-6">
            <CalendarIcon className="h-8 w-8 text-muted-foreground/20 mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">Ingen sæsonregler endnu</p>
            <p className="text-[10px] text-muted-foreground mt-1">Basisprisen bruges for alle datoer</p>
          </div>
        ) : (
          <div className="space-y-2">
            {seasons.map(s => (
              <div key={s.id} className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg bg-muted/30">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-medium text-foreground">{s.name}</p>
                    <Badge variant={s.status === 'active' ? 'default' : 'secondary'} className="text-[9px]">{s.status === 'active' ? 'Aktiv' : 'Inaktiv'}</Badge>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {s.start_day}/{s.start_month} — {s.end_day}/{s.end_month} · {formatPrice(s.price_per_night)}/nat
                    {s.min_nights && s.min_nights > 1 ? ` · Min. ${s.min_nights} nætter` : ''}
                    {s.check_in_days?.length ? ` · Check-in: ${s.check_in_days.map(d => DAY_NAMES[d]?.slice(0, 3)).join(', ')}` : ''}
                  </p>
                </div>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-destructive/60 hover:text-destructive" onClick={() => handleDeleteSeason(s.id)}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── ADD BLOCK DIALOG ── */}
      <Dialog open={blockDialogOpen} onOpenChange={setBlockDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-destructive" /> Tilføj blokering
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Fra dato</Label>
                <Input type="date" value={blockStart} onChange={e => setBlockStart(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Til dato</Label>
                <Input type="date" value={blockEnd} onChange={e => setBlockEnd(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Årsag (valgfri)</Label>
              <Input value={blockReason} onChange={e => setBlockReason(e.target.value)} placeholder="Ejer-ophold, vedligeholdelse..." />
            </div>
            <Button className="w-full gap-1.5" onClick={handleAddBlock} disabled={blockSaving || !blockStart || !blockEnd}>
              {blockSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
              Tilføj blokering
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── ADD SEASON DIALOG ── */}
      <Dialog open={seasonDialogOpen} onOpenChange={setSeasonDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-primary" /> Tilføj sæsonregel
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Sæsonnavn</Label>
              <Input value={seasonName} onChange={e => setSeasonName(e.target.value)} placeholder="Højsæson sommer" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Start (dag/måned)</Label>
                <div className="flex gap-1.5">
                  <Input type="number" min={1} max={31} value={seasonStartDay} onChange={e => setSeasonStartDay(parseInt(e.target.value) || 1)} className="w-16" />
                  <Select value={String(seasonStartMonth)} onValueChange={v => setSeasonStartMonth(parseInt(v))}>
                    <SelectTrigger className="flex-1 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {MONTHS_DA.map((m, i) => <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Slut (dag/måned)</Label>
                <div className="flex gap-1.5">
                  <Input type="number" min={1} max={31} value={seasonEndDay} onChange={e => setSeasonEndDay(parseInt(e.target.value) || 1)} className="w-16" />
                  <Select value={String(seasonEndMonth)} onValueChange={v => setSeasonEndMonth(parseInt(v))}>
                    <SelectTrigger className="flex-1 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {MONTHS_DA.map((m, i) => <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Pris pr. nat (øre)</Label>
                <Input type="number" min={0} step={100} value={seasonPrice} onChange={e => setSeasonPrice(parseInt(e.target.value) || 0)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Min. nætter</Label>
                <Input type="number" min={1} value={seasonMinNights} onChange={e => setSeasonMinNights(parseInt(e.target.value) || 1)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Foretrukne check-in dage (valgfri)</Label>
              <div className="flex flex-wrap gap-1.5">
                {DAY_NAMES.map((name, i) => (
                  <button
                    key={i}
                    onClick={() => setSeasonCheckInDays(prev => prev.includes(i) ? prev.filter(d => d !== i) : [...prev, i])}
                    className={`px-2.5 py-1 rounded-md text-[10px] border transition-colors ${
                      seasonCheckInDays.includes(i)
                        ? 'bg-primary/10 border-primary/30 text-primary font-medium'
                        : 'bg-card border-border text-muted-foreground hover:border-primary/20'
                    }`}
                  >
                    {name.slice(0, 3)}
                  </button>
                ))}
              </div>
            </div>
            <Button className="w-full gap-1.5" onClick={handleAddSeason} disabled={seasonSaving || !seasonName}>
              {seasonSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Tilføj sæsonregel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
