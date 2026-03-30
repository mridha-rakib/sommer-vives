import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { FileText, Plus, Edit, Eye, Check, Variable } from 'lucide-react';
import { extractPlaceholders, placeholderLabel, renderTemplate, buildVariables } from '@/lib/agreement-engine';

export default function AdminTemplates() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<any | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const [form, setForm] = useState({ name: '', version: '1.0', body_html: '', body_text: '', is_active: false });

  useEffect(() => { load(); }, []);

  const load = async () => {
    const { data } = await supabase.from('agreement_templates' as any).select('*').order('created_at', { ascending: false });
    setTemplates((data as any[]) || []);
    setLoading(false);
  };

  const openEdit = (t: any) => {
    setEditing(t);
    setForm({ name: t.name, version: t.version, body_html: t.body_html, body_text: t.body_text, is_active: t.is_active });
  };

  const openNew = () => {
    setEditing('new');
    setForm({ name: '', version: '1.0', body_html: '', body_text: '', is_active: false });
  };

  const save = async () => {
    try {
      if (editing === 'new') {
        const { error } = await supabase.from('agreement_templates' as any).insert(form as any);
        if (error) throw error;
        toast.success('Skabelon oprettet');
      } else {
        const { error } = await supabase.from('agreement_templates' as any).update(form as any).eq('id', editing.id);
        if (error) throw error;
        toast.success('Skabelon opdateret');
      }
      setEditing(null);
      load();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const placeholders = extractPlaceholders(form.body_html);

  const sampleVars = buildVariables({
    ownerName: 'Anders Jensen', ownerAddress: 'Skovvej 12, 8000 Aarhus',
    ownerEmail: 'anders@email.dk', ownerPhone: '+45 12 34 56 78',
    propertyAddress: 'Strandvejen 42, 6800 Varde', propertyRegion: 'Vestjylland',
    commissionPercent: 15, bindingMonths: 6, signatureName: 'Anders Jensen',
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">Aftaleskabeloner</h1>
            <p className="text-sm text-muted-foreground">Administrer formidlingsaftalens skabeloner og variabler</p>
          </div>
          <Button onClick={openNew} className="gap-2"><Plus className="w-4 h-4" /> Ny skabelon</Button>
        </div>

        {/* Template list */}
        <div className="space-y-3">
          {templates.map(t => (
            <Card key={t.id} className="border-border/30">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <div className="font-medium text-foreground text-sm">{t.name}</div>
                    <div className="text-xs text-muted-foreground">v{t.version} · {extractPlaceholders(t.body_html).length} variabler</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {t.is_active && <Badge className="bg-accent/10 text-accent text-[10px]">Aktiv</Badge>}
                  <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8" onClick={() => setPreview(renderTemplate(t.body_html, sampleVars))}>
                    <Eye className="w-3 h-3" /> Preview
                  </Button>
                  <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8" onClick={() => openEdit(t)}>
                    <Edit className="w-3 h-3" /> Rediger
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {templates.length === 0 && !loading && (
            <div className="text-center py-12 text-muted-foreground text-sm">Ingen skabeloner endnu</div>
          )}
        </div>

        {/* Preview dialog */}
        <Dialog open={!!preview} onOpenChange={() => setPreview(null)}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Forhåndsvisning (eksempeldata)</DialogTitle></DialogHeader>
            <div
              className="prose prose-sm max-w-none [&_h1]:text-xl [&_h1]:font-bold [&_h2]:text-base [&_h2]:font-semibold [&_p]:text-sm [&_p]:leading-relaxed"
              dangerouslySetInnerHTML={{ __html: preview || '' }}
            />
          </DialogContent>
        </Dialog>

        {/* Edit dialog */}
        <Dialog open={!!editing} onOpenChange={() => setEditing(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editing === 'new' ? 'Ny skabelon' : 'Rediger skabelon'}</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Navn *</Label>
                    <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="mt-1" />
                  </div>
                  <div>
                    <Label>Version</Label>
                    <Input value={form.version} onChange={e => setForm(p => ({ ...p, version: e.target.value }))} className="mt-1" />
                  </div>
                </div>
                <div>
                  <Label>HTML indhold *</Label>
                  <Textarea rows={20} value={form.body_html}
                    onChange={e => setForm(p => ({ ...p, body_html: e.target.value }))}
                    className="mt-1 font-mono text-xs" placeholder="<h1>Formidlingsaftale</h1>..." />
                </div>
                <div className="flex items-center gap-3">
                  <Switch checked={form.is_active} onCheckedChange={v => setForm(p => ({ ...p, is_active: v }))} />
                  <Label>Aktiv (bruges ved nye aftaler)</Label>
                </div>
              </div>

              {/* Sidebar: detected variables */}
              <div>
                <Card className="border-border/30">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Variable className="w-4 h-4" /> Fundne variabler
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    {placeholders.length === 0 ? (
                      <p className="text-xs text-muted-foreground">Ingen variabler fundet. Brug {'{{variabel_navn}}'} syntaks.</p>
                    ) : (
                      <div className="space-y-1.5">
                        {placeholders.map(k => (
                          <div key={k} className="flex items-center gap-2 text-xs">
                            <Check className="w-3 h-3 text-accent" />
                            <code className="text-primary bg-primary/5 px-1.5 py-0.5 rounded">{`{{${k}}}`}</code>
                            <span className="text-muted-foreground">{placeholderLabel(k)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="mt-4 p-3 rounded-lg bg-muted/30 text-xs text-muted-foreground">
                      <strong>Tilgængelige variabler:</strong><br />
                      {`{{owner_name}}, {{owner_address}}, {{owner_email}}, {{owner_phone}}, {{property_address}}, {{property_region}}, {{commission_rate}}, {{agreement_date}}, {{binding_period}}, {{signature_name}}, {{signature_date}}`}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setEditing(null)}>Annuller</Button>
              <Button onClick={save} disabled={!form.name.trim()}>Gem skabelon</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
