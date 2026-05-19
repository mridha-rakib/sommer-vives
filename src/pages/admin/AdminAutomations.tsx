import { useMemo, useState } from 'react';
import { Plus, Zap, Mail, Bell, Clock, Play, Edit, Trash2, Save, Loader2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
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

type AutomationRule = Tables<'automation_rules'>;
type AutomationExecution = Tables<'automation_executions'>;

type AutomationForm = {
  name: string;
  trigger_event: string;
  action_type: string;
  delay_minutes: number;
  is_active: boolean;
  subject: string;
  body: string;
};

type AutomationRunResponse = {
  success?: boolean;
  queued?: number;
  scheduledQueued?: number;
  processedCount?: number;
  processed?: Array<{ status?: string }>;
  error?: string;
};

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

const ACTIONS: Record<string, { label: string; icon: LucideIcon }> = {
  email: { label: 'Send email', icon: Mail },
  notification: { label: 'Send notifikation', icon: Bell },
  task: { label: 'Opret opgave', icon: Zap },
};

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  pending: { label: 'Planlagt', className: 'border-blue-200 bg-blue-50 text-blue-700' },
  running: { label: 'Kører', className: 'border-amber-200 bg-amber-50 text-amber-700' },
  completed: { label: 'Færdig', className: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
  skipped: { label: 'Sprunget over', className: 'border-slate-200 bg-slate-50 text-slate-700' },
  failed: { label: 'Fejlet', className: 'border-red-200 bg-red-50 text-red-700' },
};

function formatDateTime(value: string | null) {
  return value ? format(new Date(value), "d. MMM HH:mm", { locale: da }) : '—';
}

export default function AdminAutomations() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AutomationRule | null>(null);
  const [form, setForm] = useState<AutomationForm>({
    name: '', trigger_event: 'booking_created', action_type: 'email',
    delay_minutes: 0, is_active: true, subject: '', body: '',
  });

  const { data: rules = [], isLoading } = useQuery<AutomationRule[]>({
    queryKey: ['automation-rules'],
    queryFn: async () => {
      const { data, error } = await supabase.from('automation_rules').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: executions = [], isLoading: executionsLoading } = useQuery<AutomationExecution[]>({
    queryKey: ['automation-executions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('automation_executions')
        .select('id, automation_rule_id, trigger_event, event_id, payload, status, scheduled_for, executed_at, error, result, created_at, updated_at')
        .order('created_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      return data || [];
    },
  });

  const { data: pendingExecutionCount = 0 } = useQuery<number>({
    queryKey: ['automation-executions', 'pending-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('automation_executions')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending');
      if (error) throw error;
      return count || 0;
    },
  });

  const ruleNamesById = useMemo(() => new Map(rules.map(rule => [rule.id, rule.name])), [rules]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.name,
        trigger_event: form.trigger_event,
        action_type: form.action_type,
        delay_minutes: Math.max(0, Number(form.delay_minutes) || 0),
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
      const { error } = await supabase.from('automation_rules').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation-rules'] });
      queryClient.invalidateQueries({ queryKey: ['automation-executions'] });
      toast.success('Regel slettet');
    },
    onError: () => toast.error('Kunne ikke slette reglen'),
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from('automation_rules').update({ is_active: active }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['automation-rules'] }),
    onError: () => toast.error('Kunne ikke ændre status'),
  });

  const runMutation = useMutation<AutomationRunResponse, Error>({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke<AutomationRunResponse>('execute-automations', {
        body: { limit: 50, runScheduledTriggers: true },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data || {};
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['automation-rules'] });
      queryClient.invalidateQueries({ queryKey: ['automation-executions'] });
      const processed = data.processedCount ?? data.processed?.length ?? 0;
      const queued = (data.queued || 0) + (data.scheduledQueued || 0);
      toast.success(`Automationskørsel færdig: ${processed} behandlet, ${queued} planlagt`);
    },
    onError: (error) => toast.error(error.message || 'Kunne ikke køre automations'),
  });

  const openNew = () => {
    setEditing(null);
    setForm({ name: '', trigger_event: 'booking_created', action_type: 'email', delay_minutes: 0, is_active: true, subject: '', body: '' });
    setDialogOpen(true);
  };

  const openEdit = (rule: AutomationRule) => {
    setEditing(rule);
    const cfg = typeof rule.action_config === 'object' && !Array.isArray(rule.action_config) && rule.action_config
      ? rule.action_config as Record<string, string>
      : {};
    setForm({
      name: rule.name, trigger_event: rule.trigger_event, action_type: rule.action_type,
      delay_minutes: rule.delay_minutes || 0, is_active: rule.is_active,
      subject: typeof cfg.subject === 'string' ? cfg.subject : '',
      body: typeof cfg.body === 'string' ? cfg.body : '',
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
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => runMutation.mutate()} disabled={runMutation.isPending}>
              {runMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Play className="h-4 w-4 mr-2" />}
              Kør forfaldne
            </Button>
            <Button onClick={openNew}><Plus className="h-4 w-4 mr-2" />Ny regel</Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
          <Card><CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-amber-600">{pendingExecutionCount}</div>
            <div className="text-xs text-muted-foreground">Planlagte kørsler</div>
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

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Seneste kørsler</CardTitle>
            <CardDescription>Status for planlagte og udførte automationsjobs</CardDescription>
          </CardHeader>
          <CardContent>
            {executionsLoading ? (
              <div className="space-y-3">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
            ) : executions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="w-8 h-8 mx-auto mb-3 opacity-30" />
                <p>Ingen automationskørsler endnu</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {executions.map(execution => {
                  const status = STATUS_LABELS[execution.status] || STATUS_LABELS.pending;
                  const ruleName = ruleNamesById.get(execution.automation_rule_id) || TRIGGERS[execution.trigger_event] || execution.trigger_event;
                  return (
                    <div key={execution.id} className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-medium text-foreground truncate">{ruleName}</p>
                          <Badge variant="outline" className="text-[9px]">{TRIGGERS[execution.trigger_event] || execution.trigger_event}</Badge>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Planlagt {formatDateTime(execution.scheduled_for)} · Kørt {formatDateTime(execution.executed_at)}
                        </p>
                        {execution.error && <p className="mt-1 text-xs text-destructive break-words">{execution.error}</p>}
                      </div>
                      <Badge variant="outline" className={`shrink-0 text-[9px] ${status.className}`}>{status.label}</Badge>
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
            <div><Label>{form.action_type === 'email' ? 'Email-emne' : 'Titel'}</Label><Input value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))} className="mt-1" /></div>
            <div><Label>{form.action_type === 'email' ? 'Email-indhold' : 'Indhold'}</Label><Textarea value={form.body} onChange={e => setForm(p => ({ ...p, body: e.target.value }))} className="mt-1" rows={4} /></div>
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
