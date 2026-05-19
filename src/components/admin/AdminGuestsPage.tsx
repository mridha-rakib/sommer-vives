import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Search, User, ArrowLeft, Mail, Phone, Calendar, BookOpen, StickyNote, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatDateDK } from '@/lib/pricing';

interface Guest {
  id: string; name: string; email: string; phone: string | null;
  notes: string | null; case_number: string | null;
  created_at: string; updated_at: string;
}

interface GuestBooking {
  id: string; property_id: string; check_in: string; check_out: string;
  guests_count: number | null; total_amount: number; status: string | null;
  source_channel: string | null; case_number: string | null;
}

const STATUS_LABELS: Record<string, string> = {
  confirmed: 'Bekræftet', pending: 'Afventer', cancelled: 'Annulleret', completed: 'Afsluttet', checked_in: 'Indchecket',
};

const statusVariant = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
  switch (status) {
    case 'confirmed': case 'checked_in': return 'default';
    case 'pending': return 'outline';
    case 'cancelled': return 'destructive';
    default: return 'secondary';
  }
};

export function AdminGuestsPage() {
  const { toast } = useToast();
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);
  const [guestBookings, setGuestBookings] = useState<GuestBooking[]>([]);
  const [profileLoading, setProfileLoading] = useState(false);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesValue, setNotesValue] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);

  const fetchGuests = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('guests').select('*').order('created_at', { ascending: false }).limit(500);
    if (error) toast({ title: 'Fejl ved hentning af gæster', description: error.message, variant: 'destructive' });
    setGuests((data || []) as Guest[]);
    setLoading(false);
  }, [toast]);

  useEffect(() => { fetchGuests(); }, [fetchGuests]);

  const filtered = guests.filter((g) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return g.name.toLowerCase().includes(q) || g.email.toLowerCase().includes(q) || (g.phone && g.phone.includes(q));
  });

  const openProfile = async (guest: Guest) => {
    setSelectedGuest(guest); setNotesValue(guest.notes || ''); setEditingNotes(false); setProfileLoading(true);
    const { data } = await supabase.from('bookings').select('id, property_id, check_in, check_out, guests_count, total_amount, status, source_channel, case_number')
      .eq('guest_id', guest.id).order('check_in', { ascending: false });
    if (!data || data.length === 0) {
      const { data: emailBookings } = await supabase.from('bookings').select('id, property_id, check_in, check_out, guests_count, total_amount, status, source_channel, case_number')
        .eq('guest_email', guest.email).order('check_in', { ascending: false });
      setGuestBookings((emailBookings || []) as GuestBooking[]);
    } else {
      setGuestBookings((data || []) as GuestBooking[]);
    }
    setProfileLoading(false);
  };

  const saveNotes = async () => {
    if (!selectedGuest) return;
    setSavingNotes(true);
    const { error } = await supabase.from('guests').update({ notes: notesValue.trim() || null }).eq('id', selectedGuest.id);
    setSavingNotes(false);
    if (error) { toast({ title: 'Fejl ved gem', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Note gemt' }); setEditingNotes(false);
    setSelectedGuest({ ...selectedGuest, notes: notesValue.trim() || null }); fetchGuests();
  };

  const exportGuestsCSV = () => {
    const headers = ['Navn', 'Email', 'Telefon', 'Sagsnr', 'Note'];
    const rows = filtered.map((g) => [g.name, g.email, g.phone || '', g.case_number || '', g.notes || '']);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(';')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `gaester-${new Date().toISOString().split('T')[0]}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast({ title: `${filtered.length} gæster eksporteret` });
  };

  if (loading) return <div className="flex items-center justify-center py-20 text-muted-foreground gap-2"><Loader2 className="h-5 w-5 animate-spin" /> Henter gæster...</div>;

  if (selectedGuest) {
    return (
      <div className="space-y-4 md:space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedGuest(null)}><ArrowLeft className="h-4 w-4" /></Button>
          <div>
            <h2 className="font-display text-xl md:text-2xl font-semibold text-foreground">{selectedGuest.name}</h2>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              {selectedGuest.case_number && <Badge variant="outline" className="text-[10px]">{selectedGuest.case_number}</Badge>}
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Kontaktoplysninger</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground"><Mail className="h-3.5 w-3.5 shrink-0" /><span className="text-foreground">{selectedGuest.email}</span></div>
            <div className="flex items-center gap-2 text-muted-foreground"><Phone className="h-3.5 w-3.5 shrink-0" /><span className="text-foreground">{selectedGuest.phone || '—'}</span></div>
            <div className="flex items-center gap-2 text-muted-foreground"><User className="h-3.5 w-3.5 shrink-0" /><span className="text-foreground">Oprettet: {formatDateDK(selectedGuest.created_at.split('T')[0], 'medium')}</span></div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5"><StickyNote className="h-3.5 w-3.5" /> Intern note</h3>
            {!editingNotes && <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => { setNotesValue(selectedGuest.notes || ''); setEditingNotes(true); }}>Redigér</Button>}
          </div>
          {editingNotes ? (
            <div className="space-y-2">
              <Textarea value={notesValue} onChange={(e) => setNotesValue(e.target.value)} rows={3} placeholder="Tilføj intern note om gæsten..." />
              <div className="flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => setEditingNotes(false)}>Annuller</Button>
                <Button size="sm" onClick={saveNotes} disabled={savingNotes} className="gap-1.5">{savingNotes && <Loader2 className="h-3.5 w-3.5 animate-spin" />}{savingNotes ? 'Gemmer...' : 'Gem note'}</Button>
              </div>
            </div>
          ) : (<p className="text-sm text-muted-foreground">{selectedGuest.notes || 'Ingen note.'}</p>)}
        </div>

        <div className="bg-card border border-border rounded-xl p-4 space-y-3">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5"><BookOpen className="h-3.5 w-3.5" /> Bookinghistorik</h3>
          {profileLoading ? (<div className="flex items-center gap-2 text-muted-foreground py-4"><Loader2 className="h-4 w-4 animate-spin" /> Henter bookings...</div>
          ) : guestBookings.length === 0 ? (<p className="text-sm text-muted-foreground">Ingen bookings fundet.</p>
          ) : (
            <div className="space-y-2">
              {guestBookings.map((b) => (
                <div key={b.id} className="border border-border rounded-lg p-3">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div>
                      <p className="font-medium text-sm text-foreground">{b.case_number || b.id.slice(0, 8)}</p>
                      <p className="text-xs text-muted-foreground">{formatDateDK(b.check_in, 'medium')} → {formatDateDK(b.check_out, 'medium')} · {b.guests_count || 1} gæster</p>
                    </div>
                    <Badge variant={statusVariant(b.status || 'pending')} className="text-[10px]">{STATUS_LABELS[b.status || 'pending'] || b.status}</Badge>
                  </div>
                  <div className="flex items-center justify-between text-xs mt-1">
                    <Badge variant="outline" className="text-[10px]">{b.source_channel || 'direct'}</Badge>
                    <span className="font-medium text-foreground">{Number(b.total_amount).toLocaleString('da-DK')} kr</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-xl md:text-2xl font-semibold text-foreground">Gæster</h2>
            <p className="text-sm text-muted-foreground mt-1">{guests.length} gæster i databasen</p>
          </div>
          <Button size="sm" variant="outline" className="gap-1.5" onClick={exportGuestsCSV}><Download className="h-3.5 w-3.5" /> <span className="hidden sm:inline">CSV</span></Button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Søg på navn, email eller telefon..." className="pl-10 h-10" />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <User className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">{searchQuery ? 'Ingen gæster matcher din søgning.' : 'Ingen gæster endnu.'}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((guest) => (
            <button key={guest.id} onClick={() => openProfile(guest)} className="w-full bg-card border border-border rounded-xl p-4 text-left hover:border-primary/40 transition-colors">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-sm text-foreground">{guest.name}</p>
                    {guest.case_number && <Badge variant="outline" className="text-[10px]">{guest.case_number}</Badge>}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                    <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {guest.email}</span>
                    {guest.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {guest.phone}</span>}
                  </div>
                </div>
              </div>
              {guest.notes && <p className="text-xs text-muted-foreground mt-2 line-clamp-1 border-t border-border pt-2"><StickyNote className="h-3 w-3 inline mr-1" />{guest.notes}</p>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
