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
import { useTranslation } from '@/lib/i18n';
import { createAdminCalendarEvent } from '@/lib/admin-calendar-api';

// ── Lead Dialog ──
const SOURCE_KEYS: Record<string, string> = {
  beregn_lejeindtaegt: 'admin.source.beregn_lejeindtaegt',
  udlejningstjek: 'admin.source.udlejningstjek',
  vil_udleje: 'admin.source.vil_udleje',
  contact: 'admin.source.contact',
  website: 'admin.source.website',
  referral: 'admin.source.referral',
  social: 'admin.source.social',
  phone: 'admin.source.phone',
  partner: 'admin.source.partner',
  other: 'admin.source.other',
};

function QuickLeadDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  const [form, setForm] = useState({ name: '', email: '', phone: '', source: 'contact', region: '', notes: '' });
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  const save = async () => {
    if (!form.name.trim()) { toast.error(t('admin.quickCreate.lead.nameRequired')); return; }
    setSaving(true);
    const payload: Record<string, any> = { name: form.name.trim(), status: 'new', source: form.source };
    if (form.email.trim()) payload.email = form.email.trim();
    if (form.phone.trim()) payload.phone = form.phone.trim();
    if (form.region.trim()) payload.region = form.region.trim();
    if (form.notes.trim()) payload.notes = form.notes.trim();
    const { error } = await supabase.from('leads').insert(payload as any);
    if (error) { toast.error(t('admin.quickCreate.lead.createError') + ': ' + error.message); setSaving(false); return; }
    toast.success(t('admin.quickCreate.lead.createSuccess'));
    setForm({ name: '', email: '', phone: '', source: 'contact', region: '', notes: '' });
    setSaving(false); onClose();
    navigate('/admin/leads');
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><Target className="h-4 w-4 text-primary" /> {t('admin.quickCreate.lead.title')}</DialogTitle></DialogHeader>
        <div className="space-y-3 py-1">
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs">{t('admin.quickCreate.lead.nameLabel')}</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="mt-1 rounded-xl" placeholder={t('admin.quickCreate.lead.namePlaceholder')} /></div>
            <div><Label className="text-xs">{t('admin.quickCreate.lead.phoneLabel')}</Label><Input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} className="mt-1 rounded-xl" /></div>
          </div>
          <div><Label className="text-xs">{t('admin.common.email')}</Label><Input value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} className="mt-1 rounded-xl" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs">{t('admin.quickCreate.lead.sourceLabel')}</Label>
              <Select value={form.source} onValueChange={v => setForm(p => ({ ...p, source: v }))}>
                <SelectTrigger className="mt-1 rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(SOURCE_KEYS).map(([k, tk]) => <SelectItem key={k} value={k}>{t(tk)}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs">{t('admin.quickCreate.lead.regionLabel')}</Label><Input value={form.region} onChange={e => setForm(p => ({ ...p, region: e.target.value }))} className="mt-1 rounded-xl" placeholder={t('admin.quickCreate.lead.regionPlaceholder')} /></div>
          </div>
          <div><Label className="text-xs">{t('admin.quickCreate.lead.notesLabel')}</Label><Textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} className="mt-1 rounded-xl" rows={2} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="rounded-xl">{t('admin.common.cancel')}</Button>
          <Button onClick={save} disabled={saving} className="rounded-xl gap-1.5"><Plus className="h-3.5 w-3.5" />{saving ? t('admin.common.creating') : t('admin.quickCreate.lead.btn')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Sag Dialog ──
function QuickSagDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  const [form, setForm] = useState({ title: '', address: '', owner_name: '', region: '', notes: '' });
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  const save = async () => {
    if (!form.title.trim()) { toast.error(t('admin.quickCreate.case.titleRequired')); return; }
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from('properties').insert({
      title: form.title.trim(), address: form.address.trim() || 'Ikke angivet',
      owner_id: user?.id || '', status: 'draft', region: form.region.trim() || 'Ikke angivet',
    });
    if (error) { toast.error(t('admin.quickCreate.case.createError') + ': ' + error.message); setSaving(false); return; }
    toast.success(t('admin.quickCreate.case.createSuccess'));
    setForm({ title: '', address: '', owner_name: '', region: '', notes: '' });
    setSaving(false); onClose();
    navigate('/admin/sager');
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><FolderOpen className="h-4 w-4 text-primary" /> {t('admin.quickCreate.case.title')}</DialogTitle></DialogHeader>
        <div className="space-y-3 py-1">
          <div><Label className="text-xs">{t('admin.quickCreate.case.nameLabel')}</Label><Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} className="mt-1 rounded-xl" placeholder={t('admin.quickCreate.case.namePlaceholder')} /></div>
          <div><Label className="text-xs">{t('admin.quickCreate.case.addressLabel')}</Label><Input value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} className="mt-1 rounded-xl" placeholder={t('admin.quickCreate.case.addressPlaceholder')} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs">{t('admin.quickCreate.case.ownerLabel')}</Label><Input value={form.owner_name} onChange={e => setForm(p => ({ ...p, owner_name: e.target.value }))} className="mt-1 rounded-xl" placeholder={t('admin.quickCreate.case.ownerPlaceholder')} /></div>
            <div><Label className="text-xs">{t('admin.common.region')}</Label><Input value={form.region} onChange={e => setForm(p => ({ ...p, region: e.target.value }))} className="mt-1 rounded-xl" placeholder={t('admin.quickCreate.case.regionPlaceholder')} /></div>
          </div>
          <div><Label className="text-xs">{t('admin.common.notes')}</Label><Textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} className="mt-1 rounded-xl" rows={2} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="rounded-xl">{t('admin.common.cancel')}</Button>
          <Button onClick={save} disabled={saving} className="rounded-xl gap-1.5"><Plus className="h-3.5 w-3.5" />{saving ? t('admin.common.creating') : t('admin.quickCreate.case.btn')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Opgave Dialog ──
const PRIORITIES = ['low', 'normal', 'high', 'urgent'] as const;
const PRIORITY_KEYS: Record<string, string> = {
  low: 'admin.priority.low', normal: 'admin.priority.normal',
  high: 'admin.priority.high', urgent: 'admin.priority.urgent',
};
const LINKED_TYPE_KEYS = [
  { value: 'lead', key: 'admin.linkedType.lead' },
  { value: 'owner', key: 'admin.linkedType.owner' },
  { value: 'guest', key: 'admin.linkedType.guest' },
  { value: 'listing', key: 'admin.linkedType.listing' },
  { value: 'document', key: 'admin.linkedType.document' },
  { value: 'meeting', key: 'admin.linkedType.meeting' },
  { value: 'booking', key: 'admin.linkedType.booking' },
];

function QuickOpgaveDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('normal');
  const [linkedType, setLinkedType] = useState('');
  const [linkedName, setLinkedName] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  const save = async () => {
    if (!title.trim()) { toast.error(t('admin.quickCreate.task.titleRequired')); return; }
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    const validLinkedType = linkedType && linkedType !== '_none' ? linkedType : null;
    const { error } = await supabase.from('system_tasks' as any).insert({
      title: title.trim(), description: description.trim() || null, priority,
      linked_type: validLinkedType, linked_name: validLinkedType ? (linkedName.trim() || null) : null,
      due_date: dueDate || null, assigned_to: user?.id || null,
      created_by: user?.id || null, source: 'manual',
    });
    if (error) { toast.error(t('admin.quickCreate.task.createError')); setSaving(false); return; }
    toast.success(t('admin.quickCreate.task.createSuccess'));
    setTitle(''); setDescription(''); setPriority('normal'); setLinkedType(''); setLinkedName(''); setDueDate('');
    setSaving(false); onClose();
    navigate('/admin/opgaver');
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><ListChecks className="h-4 w-4 text-primary" /> {t('admin.quickCreate.task.title')}</DialogTitle></DialogHeader>
        <div className="space-y-3 py-1">
          <div><Label className="text-xs">{t('admin.quickCreate.task.titleLabel')}</Label><Input value={title} onChange={e => setTitle(e.target.value)} className="mt-1 rounded-xl" placeholder={t('admin.quickCreate.task.titlePlaceholder')} /></div>
          <div><Label className="text-xs">{t('admin.common.description')}</Label><Textarea value={description} onChange={e => setDescription(e.target.value)} className="mt-1 rounded-xl" rows={2} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs">{t('admin.quickCreate.task.priorityLabel')}</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger className="mt-1 rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>{PRIORITIES.map(p => <SelectItem key={p} value={p}>{t(PRIORITY_KEYS[p])}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs">{t('admin.quickCreate.task.dueDateLabel')}</Label><Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="mt-1 rounded-xl" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs">{t('admin.quickCreate.task.linkedTypeLabel')}</Label>
              <Select value={linkedType} onValueChange={setLinkedType}>
                <SelectTrigger className="mt-1 rounded-xl"><SelectValue placeholder={t('admin.quickCreate.task.none')} /></SelectTrigger>
                <SelectContent><SelectItem value="_none">{t('admin.quickCreate.task.none')}</SelectItem>{LINKED_TYPE_KEYS.map(lt => <SelectItem key={lt.value} value={lt.value}>{t(lt.key)}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs">{t('admin.quickCreate.task.linkedNameLabel')}</Label><Input value={linkedName} onChange={e => setLinkedName(e.target.value)} className="mt-1 rounded-xl" placeholder={t('admin.quickCreate.task.linkedNamePlaceholder')} /></div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="rounded-xl">{t('admin.common.cancel')}</Button>
          <Button onClick={save} disabled={saving} className="rounded-xl gap-1.5"><Plus className="h-3.5 w-3.5" />{saving ? t('admin.common.creating') : t('admin.quickCreate.task.btn')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Møde Dialog ──
function QuickMoedeDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [attendee, setAttendee] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  const save = async () => {
    if (!title.trim()) { toast.error(t('admin.quickCreate.meeting.titleRequired')); return; }
    if (!date) { toast.error(t('admin.quickCreate.meeting.dateRequired')); return; }
    setSaving(true);
    try {
      await createAdminCalendarEvent({
        event_type: 'meeting',
        title: title.trim(),
        event_date: date,
        event_time: time || undefined,
        contact_name: attendee || undefined,
        notes: notes || undefined,
      });
      toast.success(t('admin.quickCreate.meeting.createSuccess'));
      setTitle(''); setDate(''); setTime(''); setAttendee(''); setNotes('');
      onClose();
      navigate('/admin/kalender');
    } catch {
      toast.error(t('admin.quickCreate.meeting.createError'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><CalendarPlus className="h-4 w-4 text-primary" /> {t('admin.quickCreate.meeting.title')}</DialogTitle></DialogHeader>
        <div className="space-y-3 py-1">
          <div><Label className="text-xs">{t('admin.quickCreate.meeting.titleLabel')}</Label><Input value={title} onChange={e => setTitle(e.target.value)} className="mt-1 rounded-xl" placeholder={t('admin.quickCreate.meeting.titlePlaceholder')} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs">{t('admin.quickCreate.meeting.dateLabel')}</Label><Input type="date" value={date} onChange={e => setDate(e.target.value)} className="mt-1 rounded-xl" /></div>
            <div><Label className="text-xs">{t('admin.quickCreate.meeting.timeLabel')}</Label><Input type="time" value={time} onChange={e => setTime(e.target.value)} className="mt-1 rounded-xl" /></div>
          </div>
          <div><Label className="text-xs">{t('admin.quickCreate.meeting.attendeeLabel')}</Label><Input value={attendee} onChange={e => setAttendee(e.target.value)} className="mt-1 rounded-xl" placeholder={t('admin.quickCreate.meeting.attendeePlaceholder')} /></div>
          <div><Label className="text-xs">{t('admin.common.notes')}</Label><Textarea value={notes} onChange={e => setNotes(e.target.value)} className="mt-1 rounded-xl" rows={2} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="rounded-xl">{t('admin.common.cancel')}</Button>
          <Button onClick={save} disabled={saving} className="rounded-xl gap-1.5"><Plus className="h-3.5 w-3.5" />{saving ? t('admin.common.creating') : t('admin.quickCreate.meeting.btn')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Export ──
const ACTION_KEYS = [
  { key: 'lead', labelKey: 'admin.quickAction.createLead', icon: Target },
  { key: 'sag', labelKey: 'admin.quickAction.createCase', icon: FolderOpen },
  { key: 'opgave', labelKey: 'admin.quickAction.createTask', icon: ListChecks },
  { key: 'moede', labelKey: 'admin.quickAction.addMeeting', icon: CalendarPlus },
] as const;

type ActionKey = typeof ACTION_KEYS[number]['key'];

export function QuickCreateButtons() {
  const { t } = useTranslation();
  const [activeDialog, setActiveDialog] = useState<ActionKey | null>(null);

  return (
    <>
      <div className="hidden md:flex items-center gap-1 bg-muted/20 border border-border/30 rounded-xl p-0.5">
        {ACTION_KEYS.map(a => (
          <Button key={a.key} variant="ghost" size="sm"
            className="h-8 text-[11px] text-muted-foreground hover:text-foreground rounded-lg px-2.5 gap-1.5 font-medium"
            onClick={() => setActiveDialog(a.key)}>
            <a.icon className="h-3.5 w-3.5" /> {t(a.labelKey)}
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
