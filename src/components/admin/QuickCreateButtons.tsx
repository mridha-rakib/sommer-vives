import { useState } from 'react';
import { Target, FolderOpen, ListChecks, CalendarPlus, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

// ── Lead Dialog ──
const SOURCE_MAP: Record<string, string> = {
  beregn_lejeindtaegt: 'Beregn lejeindtægt', udlejningstjek: 'Book udlejningstjek',
  vil_udleje: 'Vil udleje', contact: 'Kontaktformular', website: 'Hjemmeside',
  referral: 'Anbefaling', social: 'SoMe', phone: 'Telefon', partner: 'Partner', other: 'Andet',
};

function QuickLeadDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', source: 'contact', region: '', notes: '' });
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  const save = async () => {
    if (!form.name.trim()) { toast.error('Navn er påkrævet'); return; }
    setSaving(true);
    const payload: Record<string, any> = { name: form.name.trim(), status: 'new', source: form.source };
    if (form.email.trim()) payload.email = form.email.trim();
    if (form.phone.trim()) payload.phone = form.phone.trim();
    if (form.region.trim()) payload.region = form.region.trim();
    if (form.notes.trim()) payload.notes = form.notes.trim();
    const { error } = await supabase.from('leads').insert(payload as any);
    if (error) { toast.error('Kunne ikke oprette lead: ' + error.message); setSaving(false); return; }
    toast.success('Lead oprettet');
    setForm({ name: '', email: '', phone: '', source: 'contact', region: '', notes: '' });
    setSaving(false); onClose();
    navigate('/admin/leads');
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><Target className="h-4 w-4 text-primary" /> Opret lead</DialogTitle></DialogHeader>
        <div className="space-y-3 py-1">
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs">Navn *</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="mt-1 rounded-xl" placeholder="Fuldt navn" /></div>
            <div><Label className="text-xs">Telefon</Label><Input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} className="mt-1 rounded-xl" /></div>
          </div>
          <div><Label className="text-xs">Email</Label><Input value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} className="mt-1 rounded-xl" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs">Kilde</Label>
              <Select value={form.source} onValueChange={v => setForm(p => ({ ...p, source: v }))}>
                <SelectTrigger className="mt-1 rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(SOURCE_MAP).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs">Region</Label><Input value={form.region} onChange={e => setForm(p => ({ ...p, region: e.target.value }))} className="mt-1 rounded-xl" placeholder="Fx Nordsjælland" /></div>
          </div>
          <div><Label className="text-xs">Noter</Label><Textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} className="mt-1 rounded-xl" rows={2} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="rounded-xl">Annuller</Button>
          <Button onClick={save} disabled={saving} className="rounded-xl gap-1.5"><Plus className="h-3.5 w-3.5" />{saving ? 'Opretter...' : 'Opret lead'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Sag Dialog ──
function QuickSagDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [form, setForm] = useState({ title: '', address: '', owner_name: '', region: '', notes: '' });
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  const save = async () => {
    if (!form.title.trim()) { toast.error('Titel er påkrævet'); return; }
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from('properties').insert({
      title: form.title.trim(), address: form.address.trim() || 'Ikke angivet',
      owner_id: user?.id || '', status: 'draft', region: form.region.trim() || 'Ikke angivet',
    });
    if (error) { toast.error('Kunne ikke oprette sag: ' + error.message); setSaving(false); return; }
    toast.success('Sag oprettet');
    setForm({ title: '', address: '', owner_name: '', region: '', notes: '' });
    setSaving(false); onClose();
    navigate('/admin/sager');
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><FolderOpen className="h-4 w-4 text-primary" /> Opret sag</DialogTitle></DialogHeader>
        <div className="space-y-3 py-1">
          <div><Label className="text-xs">Sagsnavn / Ejendomstitel *</Label><Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} className="mt-1 rounded-xl" placeholder="Fx Sommerhus Nordsjælland" /></div>
          <div><Label className="text-xs">Adresse</Label><Input value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} className="mt-1 rounded-xl" placeholder="Vej, postnummer, by" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs">Ejer</Label><Input value={form.owner_name} onChange={e => setForm(p => ({ ...p, owner_name: e.target.value }))} className="mt-1 rounded-xl" placeholder="Ejernavn" /></div>
            <div><Label className="text-xs">Region</Label><Input value={form.region} onChange={e => setForm(p => ({ ...p, region: e.target.value }))} className="mt-1 rounded-xl" placeholder="Fx Nordsjælland" /></div>
          </div>
          <div><Label className="text-xs">Noter</Label><Textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} className="mt-1 rounded-xl" rows={2} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="rounded-xl">Annuller</Button>
          <Button onClick={save} disabled={saving} className="rounded-xl gap-1.5"><Plus className="h-3.5 w-3.5" />{saving ? 'Opretter...' : 'Opret sag'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Opgave Dialog ──
const PRIORITIES = ['low', 'normal', 'high', 'urgent'] as const;
const PRIORITY_LABELS: Record<string, string> = { low: 'Lav', normal: 'Normal', high: 'Høj', urgent: 'Akut' };
const LINKED_TYPES = [
  { value: 'lead', label: 'Lead' }, { value: 'owner', label: 'Ejer' }, { value: 'guest', label: 'Gæst' },
  { value: 'listing', label: 'Sag / Listing' }, { value: 'document', label: 'Dokument' },
  { value: 'meeting', label: 'Møde' }, { value: 'booking', label: 'Booking' },
];

function QuickOpgaveDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('normal');
  const [linkedType, setLinkedType] = useState('');
  const [linkedName, setLinkedName] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  const save = async () => {
    if (!title.trim()) { toast.error('Titel er påkrævet'); return; }
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    const validLinkedType = linkedType && linkedType !== '_none' ? linkedType : null;
    const { error } = await supabase.from('system_tasks' as any).insert({
      title: title.trim(), description: description.trim() || null, priority,
      linked_type: validLinkedType, linked_name: validLinkedType ? (linkedName.trim() || null) : null,
      due_date: dueDate || null, assigned_to: user?.id || null,
      created_by: user?.id || null, source: 'manual',
    });
    if (error) { toast.error('Kunne ikke oprette opgave'); setSaving(false); return; }
    toast.success('Opgave oprettet');
    setTitle(''); setDescription(''); setPriority('normal'); setLinkedType(''); setLinkedName(''); setDueDate('');
    setSaving(false); onClose();
    navigate('/admin/opgaver');
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><ListChecks className="h-4 w-4 text-primary" /> Opret opgave</DialogTitle></DialogHeader>
        <div className="space-y-3 py-1">
          <div><Label className="text-xs">Titel *</Label><Input value={title} onChange={e => setTitle(e.target.value)} className="mt-1 rounded-xl" placeholder="Hvad skal gøres?" /></div>
          <div><Label className="text-xs">Beskrivelse</Label><Textarea value={description} onChange={e => setDescription(e.target.value)} className="mt-1 rounded-xl" rows={2} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs">Prioritet</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger className="mt-1 rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>{PRIORITIES.map(p => <SelectItem key={p} value={p}>{PRIORITY_LABELS[p]}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs">Forfaldsdato</Label><Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="mt-1 rounded-xl" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs">Tilknyt type</Label>
              <Select value={linkedType} onValueChange={setLinkedType}>
                <SelectTrigger className="mt-1 rounded-xl"><SelectValue placeholder="Ingen" /></SelectTrigger>
                <SelectContent><SelectItem value="_none">Ingen</SelectItem>{LINKED_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs">Tilknyt navn</Label><Input value={linkedName} onChange={e => setLinkedName(e.target.value)} className="mt-1 rounded-xl" placeholder="F.eks. lead-navn" /></div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="rounded-xl">Annuller</Button>
          <Button onClick={save} disabled={saving} className="rounded-xl gap-1.5"><Plus className="h-3.5 w-3.5" />{saving ? 'Opretter...' : 'Opret opgave'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Møde Dialog ──
function QuickMoedeDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [attendee, setAttendee] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  const save = async () => {
    if (!title.trim()) { toast.error('Titel er påkrævet'); return; }
    if (!date) { toast.error('Dato er påkrævet'); return; }
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    const dueDate = date + (time ? `T${time}` : 'T09:00');
    const { error } = await supabase.from('system_tasks' as any).insert({
      title: `📅 ${title.trim()}`, description: [attendee && `Deltager: ${attendee}`, notes].filter(Boolean).join('\n') || null,
      priority: 'normal', linked_type: 'meeting', due_date: dueDate,
      assigned_to: user?.id || null, created_by: user?.id || null, source: 'manual',
    });
    if (error) { toast.error('Kunne ikke oprette møde'); setSaving(false); return; }
    toast.success('Møde tilføjet');
    setTitle(''); setDate(''); setTime(''); setAttendee(''); setNotes('');
    setSaving(false); onClose();
    navigate('/admin/kalender');
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><CalendarPlus className="h-4 w-4 text-primary" /> Tilføj møde</DialogTitle></DialogHeader>
        <div className="space-y-3 py-1">
          <div><Label className="text-xs">Mødetitel *</Label><Input value={title} onChange={e => setTitle(e.target.value)} className="mt-1 rounded-xl" placeholder="Fx Fremvisning sommerhus" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs">Dato *</Label><Input type="date" value={date} onChange={e => setDate(e.target.value)} className="mt-1 rounded-xl" /></div>
            <div><Label className="text-xs">Tidspunkt</Label><Input type="time" value={time} onChange={e => setTime(e.target.value)} className="mt-1 rounded-xl" /></div>
          </div>
          <div><Label className="text-xs">Deltager / Kontaktperson</Label><Input value={attendee} onChange={e => setAttendee(e.target.value)} className="mt-1 rounded-xl" placeholder="Navn" /></div>
          <div><Label className="text-xs">Noter</Label><Textarea value={notes} onChange={e => setNotes(e.target.value)} className="mt-1 rounded-xl" rows={2} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="rounded-xl">Annuller</Button>
          <Button onClick={save} disabled={saving} className="rounded-xl gap-1.5"><Plus className="h-3.5 w-3.5" />{saving ? 'Opretter...' : 'Tilføj møde'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Export ──
const ACTIONS = [
  { key: 'lead', label: 'Opret lead', icon: Target },
  { key: 'sag', label: 'Opret sag', icon: FolderOpen },
  { key: 'opgave', label: 'Opret opgave', icon: ListChecks },
  { key: 'moede', label: 'Tilføj møde', icon: CalendarPlus },
] as const;

type ActionKey = typeof ACTIONS[number]['key'];

export function QuickCreateButtons() {
  const [activeDialog, setActiveDialog] = useState<ActionKey | null>(null);

  return (
    <>
      <div className="hidden md:flex items-center gap-1 bg-muted/20 border border-border/30 rounded-xl p-0.5">
        {ACTIONS.map(a => (
          <Button key={a.key} variant="ghost" size="sm"
            className="h-8 text-[11px] text-muted-foreground hover:text-foreground rounded-lg px-2.5 gap-1.5 font-medium"
            onClick={() => setActiveDialog(a.key)}>
            <a.icon className="h-3.5 w-3.5" /> {a.label}
          </Button>
        ))}
      </div>

      <QuickLeadDialog open={activeDialog === 'lead'} onClose={() => setActiveDialog(null)} />
      <QuickSagDialog open={activeDialog === 'sag'} onClose={() => setActiveDialog(null)} />
      <QuickOpgaveDialog open={activeDialog === 'opgave'} onClose={() => setActiveDialog(null)} />
      <QuickMoedeDialog open={activeDialog === 'moede'} onClose={() => setActiveDialog(null)} />
    </>
  );
}
