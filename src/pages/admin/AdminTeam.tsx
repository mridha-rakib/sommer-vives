import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Plus, Users, Mail, Phone, Shield, UserCheck, Copy, Eye, EyeOff } from 'lucide-react';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';

const TEAM_ROLES = [
  { value: 'udlejningsraadgiver', label: 'Udlejningsrådgiver' },
  { value: 'sagsbehandler', label: 'Sagsbehandler' },
  { value: 'udlejningschef', label: 'Udlejningschef' },
  { value: 'administrator', label: 'Administrator' },
];

export default function AdminTeam() {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState<{ email: string; password: string } | null>(null);
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    job_title: 'Udlejningsrådgiver',
    team_role: 'udlejningsraadgiver',
    password: '',
  });

  useEffect(() => {
    loadMembers();
  }, []);

  const loadMembers = async () => {
    const { data } = await supabase.from('team_members').select('*').order('created_at');
    setMembers(data || []);
    setLoading(false);
  };

  const handleInvite = async () => {
    if (!form.full_name || !form.email) {
      toast.error('Navn og email er påkrævet');
      return;
    }
    setInviting(true);
    try {
      const { data, error } = await supabase.functions.invoke('invite-team-member', {
        body: form,
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setCreatedCredentials({ email: form.email, password: data.temp_password });
      toast.success(`${form.full_name} er tilføjet til teamet`);
      setForm({ full_name: '', email: '', phone: '', job_title: 'Udlejningsrådgiver', team_role: 'udlejningsraadgiver', password: '' });
      loadMembers();
    } catch (e: any) {
      toast.error(`Fejl: ${e.message}`);
    } finally {
      setInviting(false);
    }
  };

  const toggleActive = async (member: any) => {
    await supabase.from('team_members').update({ is_active: !member.is_active } as any).eq('id', member.id);
    setMembers(prev => prev.map(m => m.id === member.id ? { ...m, is_active: !m.is_active } : m));
    toast.success(member.is_active ? 'Bruger deaktiveret' : 'Bruger aktiveret');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Kopieret til udklipsholder');
  };

  const roleLabel = (role: string) => TEAM_ROLES.find(r => r.value === role)?.label || role;
  const roleBadgeColor = (role: string) => {
    switch (role) {
      case 'udlejningschef': return 'bg-primary/10 text-primary';
      case 'administrator': return 'bg-red-500/10 text-red-600';
      case 'sagsbehandler': return 'bg-amber-500/10 text-amber-600';
      default: return 'bg-blue-500/10 text-blue-600';
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">Team</h1>
            <p className="text-sm text-muted-foreground">Administrer medarbejdere og adgang</p>
          </div>
          <Button size="sm" className="rounded-xl gap-1.5" onClick={() => { setInviteOpen(true); setCreatedCredentials(null); }}>
            <Plus className="h-3.5 w-3.5" />Tilføj medarbejder
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3">
          <div className="rounded-xl border border-border/40 bg-card/60 p-3 text-center">
            <p className="text-xl font-bold text-foreground">{members.length}</p>
            <p className="text-[10px] text-muted-foreground">Total</p>
          </div>
          <div className="rounded-xl border border-border/40 bg-card/60 p-3 text-center">
            <p className="text-xl font-bold text-emerald-500">{members.filter(m => m.is_active).length}</p>
            <p className="text-[10px] text-muted-foreground">Aktive</p>
          </div>
          <div className="rounded-xl border border-border/40 bg-card/60 p-3 text-center">
            <p className="text-xl font-bold text-blue-500">{members.filter(m => m.team_role === 'udlejningsraadgiver').length}</p>
            <p className="text-[10px] text-muted-foreground">Rådgivere</p>
          </div>
          <div className="rounded-xl border border-border/40 bg-card/60 p-3 text-center">
            <p className="text-xl font-bold text-amber-500">{members.filter(m => m.team_role === 'sagsbehandler').length}</p>
            <p className="text-[10px] text-muted-foreground">Sagsbehandlere</p>
          </div>
        </div>

        {/* Team list */}
        <div className="space-y-3">
          {loading && <p className="text-sm text-muted-foreground text-center py-12">Indlæser team...</p>}
          {members.map(m => (
            <Card key={m.id} className={cn('overflow-hidden transition-all', !m.is_active && 'opacity-50')}>
              <CardContent className="p-4 flex items-center gap-4">
                {/* Avatar */}
                <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-sm font-bold text-primary">
                    {m.full_name?.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                  </span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-foreground">{m.full_name}</p>
                    <Badge className={cn('text-[10px] font-medium', roleBadgeColor(m.team_role))}>
                      {roleLabel(m.team_role)}
                    </Badge>
                    {!m.is_active && <Badge variant="outline" className="text-[10px]">Inaktiv</Badge>}
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="flex items-center gap-1 text-xs text-muted-foreground"><Mail className="h-3 w-3" />{m.email}</span>
                    {m.phone && <span className="flex items-center gap-1 text-xs text-muted-foreground"><Phone className="h-3 w-3" />{m.phone}</span>}
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{m.job_title} · Tilføjet {format(new Date(m.created_at), 'd. MMM yyyy', { locale: da })}</p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <Button size="sm" variant={m.is_active ? 'outline' : 'default'} className="text-xs rounded-lg"
                    onClick={() => toggleActive(m)}>
                    {m.is_active ? 'Deaktiver' : 'Aktiver'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {!loading && members.length === 0 && (
            <div className="text-center py-12 text-sm text-muted-foreground">Ingen teammedlemmer endnu</div>
          )}
        </div>
      </div>

      {/* Invite dialog */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Tilføj medarbejder</DialogTitle>
          </DialogHeader>

          {createdCredentials ? (
            <div className="space-y-4">
              <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4">
                <p className="text-sm font-medium text-emerald-700 mb-2">✅ Medarbejder oprettet!</p>
                <p className="text-xs text-muted-foreground">Del login-oplysningerne med medarbejderen:</p>
              </div>
              <div className="space-y-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Email</Label>
                  <div className="flex gap-2">
                    <Input readOnly value={createdCredentials.email} className="text-sm" />
                    <Button size="icon" variant="outline" onClick={() => copyToClipboard(createdCredentials.email)}>
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Midlertidigt kodeord</Label>
                  <div className="flex gap-2">
                    <Input readOnly type={showPassword ? 'text' : 'password'} value={createdCredentials.password} className="text-sm" />
                    <Button size="icon" variant="outline" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </Button>
                    <Button size="icon" variant="outline" onClick={() => copyToClipboard(createdCredentials.password)}>
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
              <Button className="w-full rounded-xl" onClick={() => { setInviteOpen(false); setCreatedCredentials(null); }}>Luk</Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <Label className="text-xs">Fulde navn *</Label>
                <Input placeholder="Anna Jensen" value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs">Email *</Label>
                <Input type="email" placeholder="anna@sommervibes.dk" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs">Telefon</Label>
                <Input placeholder="+45 12 34 56 78" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Jobtitel</Label>
                  <Input value={form.job_title} onChange={e => setForm({ ...form, job_title: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs">Rolle</Label>
                  <Select value={form.team_role} onValueChange={v => setForm({ ...form, team_role: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {TEAM_ROLES.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label className="text-xs">Kodeord (valgfrit — autogenereres)</Label>
                <Input type="password" placeholder="Lad tom for auto-generering" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
              </div>
              <Button className="w-full rounded-xl" onClick={handleInvite} disabled={inviting}>
                {inviting ? 'Opretter...' : 'Opret medarbejder'}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
