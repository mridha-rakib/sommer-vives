import { useState, useEffect, useCallback, useMemo } from 'react';
import { format } from 'date-fns';
import { ProfilePopover } from '@/components/admin/ProfilePopover';
import { da } from 'date-fns/locale';
import {
  Search, Mail, Phone, User, ChevronRight, Download, Plus,
  StickyNote, Send, PhoneCall, CalendarDays, Shield, Star,
  TrendingUp, UserCheck, Clock, X
} from 'lucide-react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { AdminPageHeader } from '@/components/admin/ui/AdminPageHeader';
import { KPICard } from '@/components/admin/ui/KPICard';
import { StatusChip } from '@/components/admin/ui/StatusChip';
import { EmptyState } from '@/components/admin/ui/EmptyState';
import { CreateGuestDialog } from '@/components/admin/CreateGuestDialog';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const STATUS_LABELS: Record<string, { label: string; variant: 'success' | 'warning' | 'muted' | 'info' | 'danger' }> = {
  confirmed: { label: 'Bekræftet', variant: 'success' },
  checked_in: { label: 'Indchecket', variant: 'info' },
  pending: { label: 'Afventer', variant: 'warning' },
  cancelled: { label: 'Annulleret', variant: 'danger' },
  completed: { label: 'Afsluttet', variant: 'muted' },
};

type FilterTab = 'all' | 'with_bookings' | 'gdpr_missing' | 'recent';

export default function AdminCrmGaester() {
  const [guests, setGuests] = useState<any[]>([]);
  const [bookingCounts, setBookingCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterTab, setFilterTab] = useState<FilterTab>('all');
  const [drawerGuest, setDrawerGuest] = useState<any | null>(null);
  const [tab, setTab] = useState('info');
  const [guestBookings, setGuestBookings] = useState<any[]>([]);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesValue, setNotesValue] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [createOpen, setCreateOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('guests').select('*').order('created_at', { ascending: false }).limit(500);
    setGuests(data || []);

    // Load booking counts per guest
    const { data: bookings } = await supabase.from('bookings').select('guest_id, guest_email');
    const counts: Record<string, number> = {};
    (bookings || []).forEach(b => {
      if (b.guest_id) counts[b.guest_id] = (counts[b.guest_id] || 0) + 1;
    });
    setBookingCounts(counts);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, []);

  const openDrawer = async (guest: any) => {
    setDrawerGuest(guest);
    setTab('info');
    setNotesValue(guest.notes || '');
    setEditingNotes(false);
    const { data } = await supabase.from('bookings')
      .select('*')
      .or(`guest_id.eq.${guest.id},guest_email.eq.${guest.email}`)
      .order('check_in', { ascending: false });
    setGuestBookings(data || []);
  };

  const saveNotes = async () => {
    if (!drawerGuest) return;
    await supabase.from('guests').update({ notes: notesValue.trim() || null }).eq('id', drawerGuest.id);
    setEditingNotes(false);
    setDrawerGuest({ ...drawerGuest, notes: notesValue.trim() || null });
    toast.success('Note gemt');
    load();
  };

  const exportCSV = () => {
    const rows = filtered.map(g => [g.name, g.email, g.phone || '', g.case_number || '', g.notes || '']);
    const csv = [['Navn', 'Email', 'Telefon', 'Sagsnr', 'Note'], ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(';')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `gaester-${new Date().toISOString().split('T')[0]}.csv`; a.click();
    toast.success(`${filtered.length} gæster eksporteret`);
  };

  const deleteSelected = async () => {
    if (selectedIds.size === 0) return;
    const confirmed = window.confirm(`Slet ${selectedIds.size} gæst(er)?`);
    if (!confirmed) return;
    for (const id of selectedIds) {
      await supabase.from('guests').delete().eq('id', id);
    }
    toast.success(`${selectedIds.size} gæst(er) slettet`);
    setSelectedIds(new Set());
    load();
  };

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const filtered = useMemo(() => {
    return guests.filter(g => {
      // Search filter
      if (search) {
        const q = search.toLowerCase();
        if (!g.name.toLowerCase().includes(q) && !g.email.toLowerCase().includes(q) && !(g.phone || '').includes(q) && !(g.case_number || '').toLowerCase().includes(q)) return false;
      }
      // Tab filter
      if (filterTab === 'with_bookings') return (bookingCounts[g.id] || 0) > 0;
      if (filterTab === 'gdpr_missing') return !g.gdpr_consent;
      if (filterTab === 'recent') return new Date(g.created_at) >= thirtyDaysAgo;
      return true;
    });
  }, [guests, search, filterTab, bookingCounts]);

  const fmt = (v: number) => new Intl.NumberFormat('da-DK', { style: 'currency', currency: 'DKK', maximumFractionDigits: 0 }).format(v);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map(g => g.id)));
    }
  };

  const gdprMissing = guests.filter(g => !g.gdpr_consent).length;
  const withBookings = guests.filter(g => (bookingCounts[g.id] || 0) > 0).length;
  const recentCount = guests.filter(g => new Date(g.created_at) >= thirtyDaysAgo).length;

  const filterTabs: { key: FilterTab; label: string; count: number }[] = [
    { key: 'all', label: 'Alle', count: guests.length },
    { key: 'with_bookings', label: 'Med bookinger', count: withBookings },
    { key: 'recent', label: 'Seneste 30 dage', count: recentCount },
    { key: 'gdpr_missing', label: 'GDPR mangler', count: gdprMissing },
  ];

  const drawerTabs = [
    { key: 'info', label: 'Profil' },
    { key: 'bookings', label: 'Bookinger' },
    { key: 'notes', label: 'Noter' },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <AdminPageHeader
          title="Gæstedatabase"
          subtitle={`${guests.length} gæster registreret`}
          actions={
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="gap-1.5 rounded-xl" onClick={exportCSV}>
                <Download className="h-3.5 w-3.5" />CSV
              </Button>
              <Button size="sm" className="gap-1.5 rounded-xl" onClick={() => setCreateOpen(true)}>
                <Plus className="h-3.5 w-3.5" />Ny gæst
              </Button>
            </div>
          }
        />

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard title="Total gæster" value={guests.length} icon={User} variant="gold" />
          <KPICard title="Med bookinger" value={withBookings} icon={UserCheck} variant="success" />
          <KPICard title="Nye (30 dage)" value={recentCount} icon={TrendingUp} variant="default" />
          <KPICard title="GDPR mangler" value={gdprMissing} icon={Shield} variant={gdprMissing > 0 ? 'warning' : 'success'} />
        </div>

        {/* Filter tabs + search */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex gap-1 p-1 rounded-xl bg-muted/30 border border-border/30">
            {filterTabs.map(ft => (
              <button
                key={ft.key}
                onClick={() => { setFilterTab(ft.key); setSelectedIds(new Set()); }}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap',
                  filterTab === ft.key
                    ? 'bg-card text-foreground shadow-sm border border-border/40'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {ft.label}
                <span className={cn('ml-1.5 text-[10px]', filterTab === ft.key ? 'text-muted-foreground' : 'text-muted-foreground/60')}>
                  {ft.count}
                </span>
              </button>
            ))}
          </div>
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Søg på navn, email, telefon, sagsnr..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 rounded-xl bg-card/60 border-border/40" />
          </div>
        </div>

        {/* Bulk actions bar */}
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-primary/5 border border-primary/15">
            <span className="text-xs font-medium text-foreground">{selectedIds.size} valgt</span>
            <div className="flex-1" />
            <Button variant="ghost" size="sm" className="text-xs h-7 rounded-lg" onClick={() => setSelectedIds(new Set())}>
              <X className="h-3 w-3 mr-1" />Fjern markering
            </Button>
            <Button variant="destructive" size="sm" className="text-xs h-7 rounded-lg" onClick={deleteSelected}>
              Slet valgte
            </Button>
          </div>
        )}

        {/* Guest list */}
        {loading ? (
          <div className="space-y-2">{[...Array(8)].map((_, i) => <Skeleton key={i} className="h-[72px] rounded-xl" />)}</div>
        ) : filtered.length === 0 ? (
          <Card className="border-border/40 bg-card/60">
            <CardContent className="p-0">
              <EmptyState icon={User} title="Ingen gæster fundet" description={search ? 'Tilpas din søgning' : 'Opret din første gæst'} />
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-1.5">
            {/* Select all header */}
            <div className="flex items-center gap-3 px-5 py-2">
              <Checkbox
                checked={selectedIds.size === filtered.length && filtered.length > 0}
                onCheckedChange={toggleAll}
                className="data-[state=checked]:bg-primary"
              />
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
                {selectedIds.size > 0 ? `${selectedIds.size} af ${filtered.length} valgt` : `${filtered.length} gæster`}
              </span>
            </div>

            {filtered.map(g => {
              const bCount = bookingCounts[g.id] || 0;
              return (
                <Card
                  key={g.id}
                  className={cn(
                    'border-border/40 bg-card/60 hover:bg-card/80 hover:border-border/60 transition-all cursor-pointer',
                    selectedIds.has(g.id) && 'border-primary/30 bg-primary/[0.03]'
                  )}
                >
                  <CardContent className="py-3.5 px-5 flex items-center gap-4">
                    <Checkbox
                      checked={selectedIds.has(g.id)}
                      onCheckedChange={() => toggleSelect(g.id)}
                      onClick={e => e.stopPropagation()}
                      className="data-[state=checked]:bg-primary shrink-0"
                    />
                    <div
                      className="flex items-center gap-4 flex-1 min-w-0"
                      onClick={() => openDrawer(g)}
                    >
                      <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-sm font-bold text-accent shrink-0">
                        {g.name[0].toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <ProfilePopover type="guest" id={g.id} data={g} onOpenDetail={() => openDrawer(g)}>
                            <p className="text-sm font-semibold text-foreground truncate hover:text-primary transition-colors cursor-pointer" onClick={e => e.stopPropagation()}>
                              {g.name}
                            </p>
                          </ProfilePopover>
                          {g.case_number && <span className="text-[10px] text-muted-foreground/60 font-mono">{g.case_number}</span>}
                          {!g.gdpr_consent && (
                            <Badge variant="outline" className="text-[9px] py-0 px-1.5 border-amber-500/30 text-amber-500 bg-amber-500/5">
                              GDPR
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="text-[11px] text-muted-foreground flex items-center gap-1 truncate"><Mail className="h-3 w-3 shrink-0" />{g.email}</span>
                          {g.phone && <span className="text-[11px] text-muted-foreground flex items-center gap-1"><Phone className="h-3 w-3 shrink-0" />{g.phone}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        {bCount > 0 && (
                          <span className="text-[10px] text-muted-foreground bg-muted/30 px-2 py-0.5 rounded-full">
                            {bCount} {bCount === 1 ? 'booking' : 'bookinger'}
                          </span>
                        )}
                        {g.notes && <StickyNote className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />}
                        <ChevronRight className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Create guest dialog */}
      <CreateGuestDialog open={createOpen} onOpenChange={setCreateOpen} onSuccess={load} />

      {/* ═══════ DETAIL DRAWER ═══════ */}
      <Sheet open={!!drawerGuest} onOpenChange={open => { if (!open) setDrawerGuest(null); }}>
        <SheetContent className="w-full sm:max-w-lg p-0 border-l border-border/40 bg-background">
          {drawerGuest && (
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="px-6 pt-6 pb-4 border-b border-border/30">
                <SheetHeader className="mb-0">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center text-lg font-bold text-accent shrink-0">
                      {drawerGuest.name[0].toUpperCase()}
                    </div>
                    <div>
                      <SheetTitle className="text-lg font-bold text-foreground">{drawerGuest.name}</SheetTitle>
                      <div className="flex items-center gap-2 mt-0.5">
                        {drawerGuest.case_number && <span className="text-[11px] text-muted-foreground font-mono">{drawerGuest.case_number}</span>}
                        {drawerGuest.gdpr_consent ? (
                          <Badge variant="outline" className="text-[9px] py-0 px-1.5 border-emerald-500/30 text-emerald-500 bg-emerald-500/5">
                            <Shield className="h-2.5 w-2.5 mr-0.5" />GDPR OK
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[9px] py-0 px-1.5 border-amber-500/30 text-amber-500 bg-amber-500/5">
                            GDPR mangler
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </SheetHeader>

                <div className="flex gap-2 mt-4">
                  {drawerGuest.phone && (
                    <a href={`tel:${drawerGuest.phone}`} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border/40 bg-card/60 hover:bg-muted/30 text-xs font-medium transition-all">
                      <PhoneCall className="h-3.5 w-3.5 text-primary" />Ring
                    </a>
                  )}
                  <a href={`mailto:${drawerGuest.email}`} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border/40 bg-card/60 hover:bg-muted/30 text-xs font-medium transition-all">
                    <Send className="h-3.5 w-3.5 text-primary" />Email
                  </a>
                </div>

                <div className="flex gap-1 mt-4">
                  {drawerTabs.map(t => (
                    <button key={t.key} onClick={() => setTab(t.key)} className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-all', tab === t.key ? 'bg-primary/10 text-primary border border-primary/20' : 'text-muted-foreground hover:text-foreground border border-transparent')}>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <ScrollArea className="flex-1">
                <div className="px-6 py-5 space-y-5">
                  {tab === 'info' && (
                    <>
                      <div>
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.15em] mb-3">Kontaktoplysninger</p>
                        <div className="space-y-2.5">
                          <InfoRow icon={Mail} label="Email" value={drawerGuest.email} />
                          <InfoRow icon={Phone} label="Telefon" value={drawerGuest.phone || '—'} />
                          <InfoRow icon={CalendarDays} label="Oprettet" value={format(new Date(drawerGuest.created_at), "d. MMMM yyyy", { locale: da })} />
                        </div>
                      </div>
                      <Separator className="bg-border/30" />
                      <div>
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.15em] mb-3">Overblik</p>
                        <div className="grid grid-cols-2 gap-3">
                          <MiniStat label="Bookinger" value={guestBookings.length} />
                          <MiniStat label="Samlet beløb" value={fmt(guestBookings.reduce((s, b) => s + Number(b.total_amount || 0), 0))} />
                        </div>
                      </div>
                    </>
                  )}

                  {tab === 'bookings' && (
                    guestBookings.length === 0 ? (
                      <p className="text-xs text-muted-foreground/60 italic py-8 text-center">Ingen bookinger fundet</p>
                    ) : guestBookings.map(b => {
                      const st = STATUS_LABELS[b.status || 'pending'];
                      return (
                        <Card key={b.id} className="border-border/40 bg-card/60">
                          <CardContent className="py-3 px-4">
                            <div className="flex items-center justify-between mb-1">
                              <p className="text-sm font-medium text-foreground">{b.case_number || b.id.slice(0, 8)}</p>
                              <StatusChip label={st?.label || b.status} variant={st?.variant || 'muted'} dot />
                            </div>
                            <p className="text-[11px] text-muted-foreground">
                              {format(new Date(b.check_in), 'd. MMM', { locale: da })} → {format(new Date(b.check_out), 'd. MMM yyyy', { locale: da })} · {b.guests_count || 1} gæster
                            </p>
                            <div className="flex justify-between items-center mt-2">
                              <span className="text-[10px] text-muted-foreground">{b.source_channel || 'direct'}</span>
                              <span className="text-sm font-medium text-foreground">{fmt(Number(b.total_amount))}</span>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })
                  )}

                  {tab === 'notes' && (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.15em]">Intern note</p>
                        {!editingNotes && (
                          <button onClick={() => { setNotesValue(drawerGuest.notes || ''); setEditingNotes(true); }} className="text-xs text-primary font-medium hover:underline">Redigér</button>
                        )}
                      </div>
                      {editingNotes ? (
                        <div className="space-y-3">
                          <Textarea value={notesValue} onChange={e => setNotesValue(e.target.value)} rows={4} placeholder="Tilføj intern note..." className="rounded-xl" />
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" size="sm" className="rounded-xl" onClick={() => setEditingNotes(false)}>Annuller</Button>
                            <Button size="sm" className="rounded-xl" onClick={saveNotes}>Gem</Button>
                          </div>
                        </div>
                      ) : (
                        <div className="rounded-xl bg-muted/15 border border-border/30 p-3.5">
                          <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{drawerGuest.notes || 'Ingen noter endnu.'}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </AdminLayout>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg bg-muted/30 flex items-center justify-center shrink-0"><Icon className="h-3.5 w-3.5 text-muted-foreground" /></div>
      <div><p className="text-xs text-muted-foreground">{label}</p><p className="text-sm font-medium text-foreground">{value}</p></div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-border/40 bg-muted/10 p-3 text-center">
      <p className="text-lg font-bold text-foreground">{value}</p>
      <p className="text-[10px] text-muted-foreground uppercase tracking-wide mt-0.5">{label}</p>
    </div>
  );
}
