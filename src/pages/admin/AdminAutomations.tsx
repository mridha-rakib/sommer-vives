import { useState } from 'react';
import { Plus, Zap, Mail, Bell, Clock, Play, Pause, Edit, Trash2, Save } from 'lucide-react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

const TRIGGERS: Record<string, string> = {
  booking_created: 'Ny booking oprettet',
  booking_confirmed: 'Booking bekræftet',
  checkin_tomorrow: 'Check-in i morgen',
  checkout_tomorrow: 'Check-out i morgen',
  owner_signup: 'Ny ejer tilmeldt',
  agreement_signed: 'Aftale signeret',
  payment_received: 'Betaling modtaget',
  support_ticket_created: 'Support-sag oprettet',
  lead_created: 'Nyt lead oprettet',
  payout_completed: 'Udbetaling gennemført',
};

const ACTIONS: Record<string, { label: string; icon: any }> = {
  email: { label: 'Send email', icon: Mail },
  notification: { label: 'Send notifikation', icon: Bell },
  task: { label: 'Opret opgave', icon: Zap },
};

export default function AdminAutomations() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState({
    name: '', trigger_event: 'booking_created', action_type: 'email',
    delay_minutes: 0, is_active: true, subject: '', body: '',
  });

  const { data: rules = [], isLoading } = useQuery({
    queryKey: ['automation-rules'],
    queryFn: async () => {
      const { data } = await supabase.from('automation_rules').select('*').order('created_at', { ascending: false });
      return data || [];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.name,
        trigger_event: form.trigger_event,
        action_type: form.action_type,
        delay_minutes: form.delay_minutes,
        is_active: form.is_active,
        action_config: { subject: form.subject, body: form.body },
      };
      if (editing) {
        const { error } = await supabase.from('automation_rules').update(payload).eq('id', editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('automation_rules').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation-rules'] });
      toast.success(editing ? 'Regel opdateret' : 'Regel oprettet');
      setDialogOpen(false);
    },
    onError: () => toast.error('Kunne ikke gemme'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from('automation_rules').delete().eq('id', id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation-rules'] });
      toast.success('Regel slettet');
    },
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      await supabase.from('automation_rules').update({ is_active: active }).eq('id', id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['automation-rules'] }),
  });

  const openNew = () => {
    setEditing(null);
    setForm({ name: '', trigger_event: 'booking_created', action_type: 'email', delay_minutes: 0, is_active: true, subject: '', body: '' });
    setDialogOpen(true);
  };

  const openEdit = (rule: any) => {
    setEditing(rule);
    const cfg = rule.action_config || {};
    setForm({
      name: rule.name, trigger_event: rule.trigger_event, action_type: rule.action_type,
      delay_minutes: rule.delay_minutes || 0, is_active: rule.is_active,
      subject: cfg.subject || '', body: cfg.body || '',
    });
    setDialogOpen(true);
  };

  const activeCount = rules.filter(r => r.is_active).length;
  const totalTriggers = rules.reduce((s, r) => s + (r.trigger_count || 0), 0);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Automations</h1>
            <p className="text-muted-foreground">Automatiserede workflows og kommunikationsflows</p>
          </div>
          <Button onClick={openNew}><Plus className="h-4 w-4 mr-2" />Ny regel</Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card><CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">{rules.length}</div>
            <div className="text-xs text-muted-foreground">Regler i alt</div>
          </CardContent></Card>
          <Card><CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-emerald-600">{activeCount}</div>
            <div className="text-xs text-muted-foreground">Aktive</div>
          </CardContent></Card>
          <Card><CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{totalTriggers}</div>
            <div className="text-xs text-muted-foreground">Udløst i alt</div>
          </CardContent></Card>
        </div>

        {/* Rules list */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Automationsregler</CardTitle>
            <CardDescription>Konfigurer triggers, handlinger og forsinkelser</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}</div>
            ) : rules.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Zap className="w-8 h-8 mx-auto mb-3 opacity-30" />
                <p>Ingen automationsregler endnu</p>
                <Button variant="outline" size="sm" className="mt-3" onClick={openNew}>Opret din første</Button>
              </div>
            ) : (
              <div className="space-y-3">
                {rules.map(rule => {
                  const action = ACTIONS[rule.action_type] || ACTIONS.email;
                  const ActionIcon = action.icon;
                  return (
                    <div key={rule.id} className={`flex items-center justify-between p-4 rounded-lg border transition-all ${rule.is_active ? 'bg-card' : 'bg-muted/50 opacity-60'}`}>
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <Switch checked={rule.is_active} onCheckedChange={active => toggleActive.mutate({ id: rule.id, active })} />
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Zap className="w-4 h-4 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium text-sm">{rule.name}</div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <Badge variant="outline" className="text-[9px]">{TRIGGERS[rule.trigger_event] || rule.trigger_event}</Badge>
                              <span className="text-[10px] text-muted-foreground">→</span>
                              {rule.delay_minutes > 0 && (
                                <>
                                  <Badge variant="outline" className="text-[9px]"><Clock className="w-2.5 h-2.5 mr-0.5" />{rule.delay_minutes}m</Badge>
                                  <span className="text-[10px] text-muted-foreground">→</span>
                                </>
                              )}
                              <Badge variant="outline" className="text-[9px]"><ActionIcon className="w-2.5 h-2.5 mr-0.5" />{action.label}</Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 ml-4">
                        <span className="text-xs text-muted-foreground">{rule.trigger_count || 0}× udløst</span>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(rule)}><Edit className="w-3.5 h-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteMutation.mutate(rule.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? 'Rediger regel' : 'Ny automationsregel'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div><Label>Navn</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="mt-1" placeholder="Fx Velkomstmail til ny ejer" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Trigger</Label>
                <Select value={form.trigger_event} onValueChange={v => setForm(p => ({ ...p, trigger_event: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(TRIGGERS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Handling</Label>
                <Select value={form.action_type} onValueChange={v => setForm(p => ({ ...p, action_type: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(ACTIONS).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Forsinkelse (minutter)</Label>
              <Input type="number" value={form.delay_minutes} onChange={e => setForm(p => ({ ...p, delay_minutes: parseInt(e.target.value) || 0 }))} className="mt-1 w-32" />
              <p className="text-xs text-muted-foreground mt-1">0 = straks</p>
            </div>
            {form.action_type === 'email' && (
              <>
                <div><Label>Email-emne</Label><Input value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))} className="mt-1" /></div>
                <div><Label>Email-indhold</Label><Textarea value={form.body} onChange={e => setForm(p => ({ ...p, body: e.target.value }))} className="mt-1" rows={4} /></div>
              </>
            )}
            <div className="flex items-center gap-2">
              <Switch checked={form.is_active} onCheckedChange={v => setForm(p => ({ ...p, is_active: v }))} />
              <Label>Aktiv</Label>
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
