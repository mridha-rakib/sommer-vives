import { useState, useEffect } from 'react';
import { OwnerLayout } from '@/components/layout/OwnerLayout';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { User, Mail, Phone, Shield, Bell, CreditCard, Building2, Save, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function OwnerAccount() {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [bank, setBank] = useState<any>(null);
  const [notifPrefs, setNotifPrefs] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [bankName, setBankName] = useState('');
  const [regNumber, setRegNumber] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [taxId, setTaxId] = useState('');

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
    setProfile(p);
    setBank(b);
    setNotifPrefs(notifRes.data || {
      email_bookings: true, email_payouts: true, email_messages: true,
      email_marketing: false, sms_bookings: false, sms_urgent: true,
    });

    if (p) { setFullName(p.full_name || ''); setPhone(p.phone || ''); setCompanyName(p.company_name || ''); }
    if (b) { setBankName(b.bank_name || ''); setRegNumber(b.reg_number || ''); setAccountNumber(b.account_number || ''); setAccountHolder(b.account_holder || ''); setTaxId(b.tax_id || ''); }
    setLoading(false);
  };

  const saveProfile = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from('profiles').update({
      full_name: fullName, phone, company_name: companyName || null,
    }).eq('id', user.id);
    setSaving(false);
    if (error) { toast.error('Kunne ikke gemme profil'); return; }
    toast.success('Profil opdateret');
  };

  const saveBank = async () => {
    if (!user) return;
    setSaving(true);
    const data = {
      owner_id: user.id, bank_name: bankName, reg_number: regNumber,
      account_number: accountNumber, account_holder: accountHolder, tax_id: taxId || null,
    };
    if (bank?.id) {
      await supabase.from('owner_bank_settings').update(data).eq('id', bank.id);
    } else {
      await supabase.from('owner_bank_settings').insert(data);
    }
    setSaving(false);
    toast.success('Bankoplysninger gemt');
    loadData();
  };

  const saveNotifications = async () => {
    if (!user) return;
    setSaving(true);
    const data = { user_id: user.id, ...notifPrefs };
    if (notifPrefs?.id) {
      await supabase.from('notification_preferences').update(data).eq('id', notifPrefs.id);
    } else {
      await supabase.from('notification_preferences').insert(data);
    }
    setSaving(false);
    toast.success('Notifikationer opdateret');
    loadData();
  };

  const updateNotif = (key: string, value: boolean) => {
    setNotifPrefs((prev: any) => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <OwnerLayout>
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      </OwnerLayout>
    );
  }

  return (
    <OwnerLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">Min konto</h1>
          <p className="text-muted-foreground text-sm mt-1">Administrer din profil, betaling og notifikationer</p>
        </div>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="bg-muted/50 h-10 p-1 gap-1">
            <TabsTrigger value="profile" className="text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md px-4">Profil</TabsTrigger>
            <TabsTrigger value="bank" className="text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md px-4">Betaling</TabsTrigger>
            <TabsTrigger value="notifications" className="text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md px-4">Notifikationer</TabsTrigger>
            <TabsTrigger value="security" className="text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md px-4">Sikkerhed</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="mt-6 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="w-4 h-4 text-accent" />
                  Personlige oplysninger
                </CardTitle>
                <CardDescription>Disse oplysninger bruges i din formidlingsaftale og korrespondance.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-sm">E-mail</Label>
                    <Input value={user?.email || ''} disabled className="bg-muted/50" />
                    <p className="text-[11px] text-muted-foreground">E-mail kan ikke ændres her</p>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm">Fulde navn</Label>
                    <Input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Dit fulde navn" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm">Telefon</Label>
                    <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+45 12 34 56 78" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm">Virksomhed (valgfrit)</Label>
                    <Input value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="Evt. firmanavn" />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button onClick={saveProfile} disabled={saving} className="gap-2">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Gem profil
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5 flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                  <Building2 className="w-5 h-5 text-accent" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-foreground">Kontotype</div>
                  <div className="text-xs text-muted-foreground">SommerVibes Partner — Ejer</div>
                </div>
                <Badge className="bg-accent/15 text-accent border-accent/20">Aktiv</Badge>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bank" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-accent" />
                  Betalingsoplysninger
                </CardTitle>
                <CardDescription>Dine bankoplysninger bruges til at sende dig udbetalinger. Alle data opbevares krypteret.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-sm">Kontoindehaver</Label>
                    <Input value={accountHolder} onChange={e => setAccountHolder(e.target.value)} placeholder="Kontoindehaverens navn" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm">Bank</Label>
                    <Input value={bankName} onChange={e => setBankName(e.target.value)} placeholder="Fx Nordea, Danske Bank" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm">Reg.nr</Label>
                    <Input value={regNumber} onChange={e => setRegNumber(e.target.value)} placeholder="1234" maxLength={4} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm">Kontonummer</Label>
                    <Input value={accountNumber} onChange={e => setAccountNumber(e.target.value)} placeholder="12345678" maxLength={10} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm">CVR / CPR (valgfrit)</Label>
                    <Input value={taxId} onChange={e => setTaxId(e.target.value)} placeholder="Til skatteindberetning" />
                  </div>
                </div>

                {bank && (
                  <div className="flex items-center gap-2 text-xs text-emerald-500">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Bankoplysninger er registreret
                  </div>
                )}

                <div className="flex justify-end">
                  <Button onClick={saveBank} disabled={saving} className="gap-2">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Gem bankoplysninger
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Bell className="w-4 h-4 text-accent" />
                  Notifikationsindstillinger
                </CardTitle>
                <CardDescription>Vælg hvilke notifikationer du vil modtage.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div>
                  <h4 className="text-sm font-medium text-foreground mb-3">E-mail</h4>
                  <div className="space-y-3">
                    {[
                      { key: 'email_bookings', label: 'Bookinger', desc: 'Ny booking, ændringer, aflysninger' },
                      { key: 'email_payouts', label: 'Udbetalinger', desc: 'Udbetalingsbekræftelser og kvitteringer' },
                      { key: 'email_messages', label: 'Beskeder', desc: 'Nye beskeder fra SommerVibes eller gæster' },
                      { key: 'email_marketing', label: 'Nyhedsbrev', desc: 'Tips, nyheder og sæsonopdateringer' },
                    ].map(item => (
                      <div key={item.key} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                        <div>
                          <div className="text-sm font-medium text-foreground">{item.label}</div>
                          <div className="text-[11px] text-muted-foreground">{item.desc}</div>
                        </div>
                        <Switch checked={notifPrefs?.[item.key] ?? false} onCheckedChange={v => updateNotif(item.key, v)} />
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="text-sm font-medium text-foreground mb-3">SMS</h4>
                  <div className="space-y-3">
                    {[
                      { key: 'sms_bookings', label: 'Bookingnotifikationer', desc: 'SMS ved nye bookinger' },
                      { key: 'sms_urgent', label: 'Hastenotifikationer', desc: 'Kun ved akutte situationer' },
                    ].map(item => (
                      <div key={item.key} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                        <div>
                          <div className="text-sm font-medium text-foreground">{item.label}</div>
                          <div className="text-[11px] text-muted-foreground">{item.desc}</div>
                        </div>
                        <Switch checked={notifPrefs?.[item.key] ?? false} onCheckedChange={v => updateNotif(item.key, v)} />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={saveNotifications} disabled={saving} className="gap-2">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Gem indstillinger
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="mt-6 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Shield className="w-4 h-4 text-accent" />
                  Sikkerhed
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
                  <div>
                    <div className="text-sm font-medium text-foreground">Adgangskode</div>
                    <div className="text-xs text-muted-foreground">Skift din adgangskode</div>
                  </div>
                  <Button variant="outline" size="sm">Skift kode</Button>
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
                  <div>
                    <div className="text-sm font-medium text-foreground">Log ud</div>
                    <div className="text-xs text-muted-foreground">Log ud af din konto på denne enhed</div>
                  </div>
                  <Button variant="outline" size="sm" onClick={signOut}>Log ud</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </OwnerLayout>
  );
}
