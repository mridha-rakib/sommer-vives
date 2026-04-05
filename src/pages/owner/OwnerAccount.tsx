import { useState, useEffect } from 'react';
import { OwnerLayout } from '@/components/layout/OwnerLayout';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { User, CreditCard, Bell, Shield, Save, Loader2, CheckCircle2, Crown, LogOut } from 'lucide-react';
import { toast } from 'sonner';

export default function OwnerAccount() {
  const { user, signOut } = useAuth();
  const [bank, setBank] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<'profile' | 'bank' | 'notifications'>('profile');

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [bankName, setBankName] = useState('');
  const [regNumber, setRegNumber] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [taxId, setTaxId] = useState('');
  const [notifPrefs, setNotifPrefs] = useState<any>({
    email_bookings: true, email_payouts: true, email_messages: true, email_marketing: false,
  });

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    const [profRes, bankRes, notifRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('owner_bank_settings').select('*').eq('owner_id', user.id).maybeSingle(),
      supabase.from('notification_preferences').select('*').eq('user_id', user.id).maybeSingle(),
    ]);
    const p = profRes.data;
    const b = bankRes.data;
    setBank(b);
    if (p) { setFullName(p.full_name || ''); setPhone(p.phone || ''); setCompanyName(p.company_name || ''); }
    if (b) { setBankName(b.bank_name || ''); setRegNumber(b.reg_number || ''); setAccountNumber(b.account_number || ''); setAccountHolder(b.account_holder || ''); setTaxId(b.tax_id || ''); }
    if (notifRes.data) setNotifPrefs(notifRes.data);
    setLoading(false);
  };

  const saveProfile = async () => {
    if (!user) return;
    setSaving(true);
    await supabase.from('profiles').update({ full_name: fullName, phone, company_name: companyName || null }).eq('id', user.id);
    toast.success('Profil opdateret');
    setSaving(false);
  };

  const saveBank = async () => {
    if (!user) return;
    setSaving(true);
    const data = { owner_id: user.id, bank_name: bankName, reg_number: regNumber, account_number: accountNumber, account_holder: accountHolder, tax_id: taxId || null };
    if (bank?.id) await supabase.from('owner_bank_settings').update(data).eq('id', bank.id);
    else await supabase.from('owner_bank_settings').insert(data);
    toast.success('Bankoplysninger gemt');
    setSaving(false);
    loadData();
  };

  const saveNotifs = async () => {
    if (!user) return;
    setSaving(true);
    const data = { user_id: user.id, ...notifPrefs };
    if (notifPrefs?.id) await supabase.from('notification_preferences').update(data).eq('id', notifPrefs.id);
    else await supabase.from('notification_preferences').insert(data);
    toast.success('Notifikationer opdateret');
    setSaving(false);
  };

  if (loading) {
    return (
      <OwnerLayout>
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-[hsl(var(--gold))] border-t-transparent rounded-full animate-spin" />
        </div>
      </OwnerLayout>
    );
  }

  return (
    <OwnerLayout>
      <div className="space-y-6 max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[hsl(var(--gold)/0.12)] border border-[hsl(var(--gold)/0.2)] flex items-center justify-center">
            <span className="text-xl font-bold text-[hsl(var(--gold-light))]">{fullName?.[0]?.toUpperCase() || 'U'}</span>
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">{fullName || 'Min konto'}</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <Crown className="w-3 h-3 text-[hsl(var(--gold-light))]" />
              <span className="text-xs text-[hsl(var(--gold-light))]">Premium Medlem</span>
            </div>
          </div>
        </div>

        {/* Tab toggle */}
        <div className="flex gap-1.5 p-1 bg-muted/40 rounded-xl w-fit">
          {[
            { key: 'profile' as const, label: 'Profil', icon: User },
            { key: 'bank' as const, label: 'Betaling', icon: CreditCard },
            { key: 'notifications' as const, label: 'Notifikationer', icon: Bell },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
                tab === t.key ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <t.icon className="w-3 h-3" />
              {t.label}
            </button>
          ))}
        </div>

        {/* Profile */}
        {tab === 'profile' && (
          <Card>
            <CardContent className="p-5 space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">E-mail</Label>
                  <Input value={user?.email || ''} disabled className="bg-muted/30 rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Fulde navn</Label>
                  <Input value={fullName} onChange={e => setFullName(e.target.value)} className="rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Telefon</Label>
                  <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+45 12 34 56 78" className="rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Virksomhed (valgfrit)</Label>
                  <Input value={companyName} onChange={e => setCompanyName(e.target.value)} className="rounded-xl" />
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={saveProfile} disabled={saving} className="gap-2 rounded-xl">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Gem profil
                </Button>
              </div>

              <Separator className="my-2" />

              <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30">
                <div>
                  <div className="text-sm font-medium text-foreground">Log ud</div>
                  <div className="text-xs text-muted-foreground">Log ud af denne enhed</div>
                </div>
                <Button variant="outline" size="sm" onClick={signOut} className="gap-2 rounded-xl">
                  <LogOut className="w-3.5 h-3.5" /> Log ud
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Bank */}
        {tab === 'bank' && (
          <Card>
            <CardContent className="p-5 space-y-4">
              <p className="text-xs text-muted-foreground">Dine bankoplysninger bruges til udbetalinger. Data opbevares krypteret.</p>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Kontoindehaver</Label>
                  <Input value={accountHolder} onChange={e => setAccountHolder(e.target.value)} className="rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Bank</Label>
                  <Input value={bankName} onChange={e => setBankName(e.target.value)} placeholder="Fx Nordea" className="rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Reg.nr</Label>
                  <Input value={regNumber} onChange={e => setRegNumber(e.target.value)} placeholder="1234" maxLength={4} className="rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Kontonummer</Label>
                  <Input value={accountNumber} onChange={e => setAccountNumber(e.target.value)} placeholder="12345678" maxLength={10} className="rounded-xl" />
                </div>
              </div>
              {bank && (
                <div className="flex items-center gap-2 text-xs text-emerald-500">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Bankoplysninger er registreret
                </div>
              )}
              <div className="flex justify-end">
                <Button onClick={saveBank} disabled={saving} className="gap-2 rounded-xl">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Gem bankoplysninger
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Notifications */}
        {tab === 'notifications' && (
          <Card>
            <CardContent className="p-5 space-y-4">
              <p className="text-xs text-muted-foreground">Vælg hvilke notifikationer du vil modtage.</p>
              <div className="space-y-2">
                {[
                  { key: 'email_bookings', label: 'Bookinger', desc: 'Nye bookinger og ændringer' },
                  { key: 'email_payouts', label: 'Udbetalinger', desc: 'Bekræftelser og kvitteringer' },
                  { key: 'email_messages', label: 'Beskeder', desc: 'Nye beskeder fra dit team' },
                  { key: 'email_marketing', label: 'Nyhedsbrev', desc: 'Tips og sæsonopdateringer' },
                ].map(item => (
                  <div key={item.key} className="flex items-center justify-between p-3.5 rounded-xl bg-muted/30">
                    <div>
                      <div className="text-sm font-medium text-foreground">{item.label}</div>
                      <div className="text-[11px] text-muted-foreground">{item.desc}</div>
                    </div>
                    <Switch checked={notifPrefs?.[item.key] ?? false} onCheckedChange={v => setNotifPrefs((p: any) => ({ ...p, [item.key]: v }))} />
                  </div>
                ))}
              </div>
              <div className="flex justify-end">
                <Button onClick={saveNotifs} disabled={saving} className="gap-2 rounded-xl">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Gem indstillinger
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </OwnerLayout>
  );
}
