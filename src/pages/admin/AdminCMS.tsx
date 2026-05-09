import { useState } from 'react';
import { Plus, Save, Edit, Trash2, Globe, FileText, HelpCircle, Star, Scale, DollarSign, Eye, EyeOff } from 'lucide-react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

const SECTIONS = [
  { key: 'hero', label: 'Forsiden / Hero', icon: Globe },
  { key: 'services', label: 'Servicekort', icon: Star },
  { key: 'faq', label: 'FAQ', icon: HelpCircle },
  { key: 'testimonials', label: 'Anmeldelser', icon: Star },
  { key: 'legal', label: 'Juridisk', icon: Scale },
  { key: 'pricing', label: 'Prisblokke', icon: DollarSign },
];

export default function AdminCMS() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState({ section: 'hero', content_key: '', title: '', body: '', is_published: true, sort_order: 0 });

  const { data: content = [], isLoading } = useQuery({
    queryKey: ['cms-content'],
    queryFn: async () => {
      const { data } = await supabase.from('cms_content').select('*').order('section').order('sort_order');
      return data || [];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        section: form.section,
        content_key: form.content_key || form.title.toLowerCase().replace(/\s+/g, '_'),
        content_value: { title: form.title, body: form.body },
        is_published: form.is_published,
        sort_order: form.sort_order,
      };
      if (editing) {
        const { error } = await supabase.from('cms_content').update(payload).eq('id', editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('cms_content').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cms-content'] });
      toast.success(editing ? 'Indhold opdateret' : 'Indhold oprettet');
      setDialogOpen(false);
    },
    onError: () => toast.error('Kunne ikke gemme'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('cms_content').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cms-content'] });
      toast.success('Indhold slettet');
    },
  });

  const togglePublish = useMutation({
    mutationFn: async ({ id, published }: { id: string; published: boolean }) => {
      const { error } = await supabase.from('cms_content').update({ is_published: published }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cms-content'] }),
  });

  const openNew = (section: string) => {
    setEditing(null);
    setForm({ section, content_key: '', title: '', body: '', is_published: true, sort_order: content.filter(c => c.section === section).length });
    setDialogOpen(true);
  };

  const openEdit = (item: any) => {
    setEditing(item);
    const val = item.content_value || {};
    setForm({ section: item.section, content_key: item.content_key, title: val.title || '', body: val.body || '', is_published: item.is_published, sort_order: item.sort_order });
    setDialogOpen(true);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">CMS / Webindhold</h1>
          <p className="text-muted-foreground">Administrer indhold på den offentlige hjemmeside</p>
        </div>

        <Tabs defaultValue="hero">
          <TabsList className="flex-wrap">
            {SECTIONS.map(s => (
              <TabsTrigger key={s.key} value={s.key} className="text-xs">
                <s.icon className="w-3.5 h-3.5 mr-1.5" />{s.label}
                <Badge variant="secondary" className="ml-1.5 text-[9px] px-1.5">{content.filter(c => c.section === s.key).length}</Badge>
              </TabsTrigger>
            ))}
          </TabsList>

          {SECTIONS.map(section => (
            <TabsContent key={section.key} value={section.key}>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{section.label}</CardTitle>
                    <CardDescription>Administrer {section.label.toLowerCase()}-indhold</CardDescription>
                  </div>
                  <Button size="sm" onClick={() => openNew(section.key)}><Plus className="h-4 w-4 mr-1" />Tilføj</Button>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
                  ) : (
                    <div className="space-y-3">
                      {content.filter(c => c.section === section.key).map(item => (
                        <div key={item.id} className={`flex items-center justify-between p-4 rounded-lg border ${item.is_published ? 'bg-card' : 'bg-muted/50 opacity-60'}`}>
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <Switch
                              checked={item.is_published}
                              onCheckedChange={checked => togglePublish.mutate({ id: item.id, published: checked })}
                            />
                            <div className="min-w-0">
                              <div className="font-medium text-sm truncate">{(item.content_value as any)?.title || item.content_key}</div>
                              <div className="text-xs text-muted-foreground truncate max-w-md">{(item.content_value as any)?.body?.slice(0, 80)}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            <Badge variant="outline" className="text-[9px]">{item.is_published ? 'Live' : 'Skjult'}</Badge>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(item)}><Edit className="w-3.5 h-3.5" /></Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteMutation.mutate(item.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                          </div>
                        </div>
                      ))}
                      {content.filter(c => c.section === section.key).length === 0 && (
                        <div className="text-center py-8 text-muted-foreground text-sm">Intet indhold endnu. Klik "Tilføj" for at starte.</div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? 'Rediger indhold' : 'Nyt indhold'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Sektion</Label>
                <Select value={form.section} onValueChange={v => setForm(p => ({ ...p, section: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{SECTIONS.map(s => <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Sortering</Label>
                <Input type="number" value={form.sort_order} onChange={e => setForm(p => ({ ...p, sort_order: parseInt(e.target.value) || 0 }))} className="mt-1" />
              </div>
            </div>
            <div><Label>Titel</Label><Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} className="mt-1" /></div>
            <div><Label>Indhold</Label><Textarea value={form.body} onChange={e => setForm(p => ({ ...p, body: e.target.value }))} className="mt-1" rows={5} /></div>
            <div className="flex items-center gap-2">
              <Switch checked={form.is_published} onCheckedChange={v => setForm(p => ({ ...p, is_published: v }))} />
              <Label>Publiceret</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuller</Button>
            <Button onClick={() => saveMutation.mutate()}><Save className="h-4 w-4 mr-1" />{editing ? 'Opdater' : 'Opret'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
