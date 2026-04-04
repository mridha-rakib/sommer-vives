import { useState, useEffect, useMemo } from 'react';
import { Plus, Pencil, Trash2, GripVertical, ClipboardList } from 'lucide-react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { AdminPageHeader } from '@/components/admin/ui/AdminPageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface TaskTemplate {
  id: string;
  stage: string;
  title: string;
  description: string | null;
  priority: string;
  due_days: number;
  sort_order: number;
  is_active: boolean;
}

const STAGES = [
  { key: 'udlejningstjek', label: 'Udlejningstjek', color: 'bg-amber-500' },
  { key: 'foer_salg', label: 'Før Salg', color: 'bg-blue-500' },
  { key: 'til_leje', label: 'Til leje', color: 'bg-emerald-500' },
  { key: 'retur', label: 'Retur', color: 'bg-slate-500' },
  { key: 'tabt_vil_ikke', label: 'Tabt kommission', color: 'bg-red-500' },
  { key: 'tabt_konkurrent', label: 'Tabt konkurrent', color: 'bg-red-400' },
] as const;

const PRIORITY_LABELS: Record<string, { label: string; color: string }> = {
  urgent: { label: 'Akut', color: 'bg-red-100 text-red-700 border-red-200' },
  high: { label: 'Høj', color: 'bg-orange-100 text-orange-700 border-orange-200' },
  normal: { label: 'Normal', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  low: { label: 'Lav', color: 'bg-slate-100 text-slate-600 border-slate-200' },
};

const emptyForm = { title: '', description: '', priority: 'normal', due_days: 7, is_active: true };

export default function AdminPipelineTemplates() {
  const [templates, setTemplates] = useState<TaskTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeStage, setActiveStage] = useState('udlejningstjek');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const { data } = await supabase
      .from('pipeline_task_templates')
      .select('*')
      .order('sort_order');
    setTemplates((data as any[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const stageTemplates = useMemo(
    () => templates.filter(t => t.stage === activeStage),
    [templates, activeStage]
  );

  const stageCounts = useMemo(() => {
    const c: Record<string, number> = {};
    STAGES.forEach(s => { c[s.key] = templates.filter(t => t.stage === s.key).length; });
    return c;
  }, [templates]);

  const openCreate = () => {
    setEditId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (t: TaskTemplate) => {
    setEditId(t.id);
    setForm({ title: t.title, description: t.description || '', priority: t.priority, due_days: t.due_days, is_active: t.is_active });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error('Titel er påkrævet'); return; }
    setSaving(true);
    if (editId) {
      const { error } = await supabase.from('pipeline_task_templates').update({
        title: form.title.trim(),
        description: form.description.trim() || null,
        priority: form.priority as any,
        due_days: form.due_days,
        is_active: form.is_active,
      }).eq('id', editId);
      if (error) { toast.error(error.message); setSaving(false); return; }
      toast.success('Opgaveskabelon opdateret');
    } else {
      const maxSort = stageTemplates.reduce((m, t) => Math.max(m, t.sort_order), 0);
      const { error } = await supabase.from('pipeline_task_templates').insert([{
        stage: activeStage,
        title: form.title.trim(),
        description: form.description.trim() || null,
        priority: form.priority as any,
        due_days: form.due_days,
        sort_order: maxSort + 1,
        is_active: form.is_active,
      }]);
      if (error) { toast.error(error.message); setSaving(false); return; }
      toast.success('Opgaveskabelon oprettet');
    }
    setSaving(false);
    setDialogOpen(false);
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Slet denne opgaveskabelon?')) return;
    const { error } = await supabase.from('pipeline_task_templates').delete().eq('id', id);
    if (error) { toast.error(error.message); return; }
    toast.success('Slettet');
    setTemplates(prev => prev.filter(t => t.id !== id));
  };

  const toggleActive = async (t: TaskTemplate) => {
    await supabase.from('pipeline_task_templates').update({ is_active: !t.is_active }).eq('id', t.id);
    setTemplates(prev => prev.map(x => x.id === t.id ? { ...x, is_active: !x.is_active } : x));
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <AdminPageHeader
          title="Pipeline-opgaveskabeloner"
          subtitle="Definér hvilke opgaver der automatisk oprettes når en sag flyttes til et nyt stadie"
        />

        {/* Stage tabs */}
        <Tabs value={activeStage} onValueChange={setActiveStage}>
          <TabsList className="bg-muted/30 border border-border/40 h-auto flex-wrap gap-1 p-1">
            {STAGES.map(s => (
              <TabsTrigger key={s.key} value={s.key} className="text-xs gap-1.5 data-[state=active]:bg-background">
                <span className={cn('w-2 h-2 rounded-full', s.color)} />
                {s.label}
                <Badge variant="secondary" className="text-[10px] h-4 min-w-[16px] px-1">
                  {stageCounts[s.key] || 0}
                </Badge>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* Templates list */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {stageTemplates.length} opgaveskabelon{stageTemplates.length !== 1 ? 'er' : ''} i{' '}
              <strong>{STAGES.find(s => s.key === activeStage)?.label}</strong>
            </p>
            <Button size="sm" className="gap-1.5 text-xs h-8" onClick={openCreate}>
              <Plus className="h-3.5 w-3.5" /> Tilføj opgave
            </Button>
          </div>

          {loading ? (
            <div className="py-12 text-center text-muted-foreground text-sm">Indlæser...</div>
          ) : stageTemplates.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <ClipboardList className="h-10 w-10 text-muted-foreground/30 mx-auto" />
              <p className="text-sm text-muted-foreground">Ingen opgaveskabeloner for dette stadie endnu</p>
              <Button size="sm" variant="outline" onClick={openCreate} className="gap-1.5">
                <Plus className="h-3.5 w-3.5" /> Tilføj første opgave
              </Button>
            </div>
          ) : (
            <div className="rounded-xl border border-border/30 overflow-hidden bg-card/40 divide-y divide-border/20">
              {stageTemplates.map((t, idx) => {
                const pri = PRIORITY_LABELS[t.priority] || PRIORITY_LABELS.normal;
                return (
                  <div
                    key={t.id}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 hover:bg-muted/10 transition-colors',
                      !t.is_active && 'opacity-50'
                    )}
                  >
                    <GripVertical className="h-3.5 w-3.5 text-muted-foreground/30 flex-shrink-0" />
                    <span className="text-[11px] text-muted-foreground/50 w-5 text-right font-mono">{idx + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">{t.title}</p>
                      {t.description && (
                        <p className="text-[11px] text-muted-foreground truncate mt-0.5">{t.description}</p>
                      )}
                    </div>
                    <Badge variant="outline" className={cn('text-[10px] shrink-0', pri.color)}>
                      {pri.label}
                    </Badge>
                    <span className="text-[11px] text-muted-foreground whitespace-nowrap shrink-0">
                      {t.due_days} dage
                    </span>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(t)}>
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toggleActive(t)}>
                        <Switch checked={t.is_active} className="scale-75" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400 hover:text-red-500" onClick={() => handleDelete(t.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editId ? 'Redigér opgaveskabelon' : 'Ny opgaveskabelon'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs">Titel *</Label>
              <Input
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="F.eks. Bestil professionelle fotos"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Beskrivelse</Label>
              <Textarea
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Yderligere detaljer..."
                rows={3}
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Prioritet</Label>
                <Select value={form.priority} onValueChange={v => setForm(f => ({ ...f, priority: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="urgent">🔴 Akut</SelectItem>
                    <SelectItem value="high">🟠 Høj</SelectItem>
                    <SelectItem value="normal">🔵 Normal</SelectItem>
                    <SelectItem value="low">⚪ Lav</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Deadline (dage)</Label>
                <Input
                  type="number"
                  min={1}
                  value={form.due_days}
                  onChange={e => setForm(f => ({ ...f, due_days: parseInt(e.target.value) || 7 }))}
                  className="mt-1"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.is_active} onCheckedChange={v => setForm(f => ({ ...f, is_active: v }))} />
              <Label className="text-xs">Aktiv</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Annullér</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Gemmer...' : editId ? 'Gem ændringer' : 'Opret'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
