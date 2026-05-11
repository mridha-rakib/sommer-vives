import { useState, useEffect } from 'react';
import { OwnerLayout } from '@/components/layout/OwnerLayout';
import { useAuth } from '@/lib/auth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { User, CreditCard, Bell, Shield, Save, Loader2, CheckCircle2, Crown, LogOut } from 'lucide-react';
import { toast } from 'sonner';
import {
  getOwnerAccount,
  saveOwnerBankSettings,
  saveOwnerNotificationPreferences,
  saveOwnerProfile,
  type OwnerBankSettings,
} from '@/lib/owner-account-api';
import { useTranslation } from '@/lib/i18n';

export default function OwnerAccount() {
  const { user, signOut } = useAuth();
  const { t } = useTranslation();
  const [bank, setBank] = useState<OwnerBankSettings | null>(null);
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
    try {
      const { profile, bank: bankSettings, notifications } = await getOwnerAccount(user.id);
      setBank(bankSettings);
      if (profile) { setFullName(profile.full_name || ''); setPhone(profile.phone || ''); setCompanyName(profile.company_name || ''); }
      if (bankSettings) { setBankName(bankSettings.bank_name || ''); setRegNumber(bankSettings.reg_number || ''); setAccountNumber(bankSettings.account_number || ''); setAccountHolder(bankSettings.account_holder || ''); setTaxId(bankSettings.tax_id || ''); }
      if (notifications) setNotifPrefs(notifications);
    } catch (err: any) {
      toast.error(err.message || t('owner.account.toast.loadError'));
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await saveOwnerProfile(user.id, { fullName, phone, companyName });
      toast.success(t('owner.account.toast.profileSaved'));
    } catch (err: any) {
      toast.error(err.message || t('owner.account.toast.saveError'));
    } finally {
      setSaving(false);
    }
  };

  const saveBank = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await saveOwnerBankSettings({
        bankId: bank?.id,
        ownerId: user.id,
        bankName,
        regNumber,
        accountNumber,
        accountHolder,
        taxId,
      });
      toast.success(t('owner.account.toast.bankSaved'));
      loadData();
    } catch (err: any) {
      toast.error(err.message || t('owner.account.toast.saveError'));
    } finally {
      setSaving(false);
    }
  };

  const saveNotifs = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await saveOwnerNotificationPreferences({ user_id: user.id, ...notifPrefs });
      toast.success(t('owner.account.toast.notificationsSaved'));
    } catch (err: any) {
      toast.error(err.message || t('owner.account.toast.saveError'));
    } finally {
      setSaving(false);
    }
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
            <h1 className="font-display text-2xl font-bold text-foreground">{fullName || t('owner.account.title')}</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <Crown className="w-3 h-3 text-[hsl(var(--gold-light))]" />
              <span className="text-xs text-[hsl(var(--gold-light))]">{t('owner.memberBadge')}</span>
            </div>
          </div>
        </div>

        {/* Tab toggle */}
        <div className="flex gap-1.5 p-1 bg-muted/40 rounded-xl w-fit">
          {[
            { key: 'profile' as const, label: t('owner.account.tab.profile'), icon: User },
            { key: 'bank' as const, label: t('owner.account.tab.payment'), icon: CreditCard },
            { key: 'notifications' as const, label: t('owner.account.tab.notifications'), icon: Bell },
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
                  <Label className="text-xs text-muted-foreground">{t('owner.account.email')}</Label>
                  <Input value={user?.email || ''} disabled className="bg-muted/30 rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">{t('owner.account.fullName')}</Label>
                  <Input value={fullName} onChange={e => setFullName(e.target.value)} className="rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">{t('owner.account.phone')}</Label>
                  <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder={t('owner.account.phonePlaceholder')} className="rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">{t('owner.account.company')}</Label>
                  <Input value={companyName} onChange={e => setCompanyName(e.target.value)} className="rounded-xl" />
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={saveProfile} disabled={saving} className="gap-2 rounded-xl">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {t('owner.account.saveProfile')}
                </Button>
              </div>

              <Separator className="my-2" />

              <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30">
                <div>
                  <div className="text-sm font-medium text-foreground">{t('owner.logout')}</div>
                  <div className="text-xs text-muted-foreground">{t('owner.account.logoutHelp')}</div>
                </div>
                <Button variant="outline" size="sm" onClick={signOut} className="gap-2 rounded-xl">
                  <LogOut className="w-3.5 h-3.5" /> {t('owner.logout')}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Bank */}
        {tab === 'bank' && (
          <Card>
            <CardContent className="p-5 space-y-4">
              <p className="text-xs text-muted-foreground">{t('owner.account.bankHelp')}</p>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">{t('owner.account.accountHolder')}</Label>
                  <Input value={accountHolder} onChange={e => setAccountHolder(e.target.value)} className="rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">{t('owner.account.bank')}</Label>
                  <Input value={bankName} onChange={e => setBankName(e.target.value)} placeholder={t('owner.account.bankPlaceholder')} className="rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">{t('owner.account.regNumber')}</Label>
                  <Input value={regNumber} onChange={e => setRegNumber(e.target.value)} placeholder="1234" maxLength={4} className="rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">{t('owner.account.accountNumber')}</Label>
                  <Input value={accountNumber} onChange={e => setAccountNumber(e.target.value)} placeholder="12345678" maxLength={10} className="rounded-xl" />
                </div>
              </div>
              {bank && (
                <div className="flex items-center gap-2 text-xs text-emerald-500">
                  <CheckCircle2 className="w-3.5 h-3.5" /> {t('owner.account.bankRegistered')}
                </div>
              )}
              <div className="flex justify-end">
                <Button onClick={saveBank} disabled={saving} className="gap-2 rounded-xl">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {t('owner.account.saveBank')}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Notifications */}
        {tab === 'notifications' && (
          <Card>
            <CardContent className="p-5 space-y-4">
              <p className="text-xs text-muted-foreground">{t('owner.account.notificationsHelp')}</p>
              <div className="space-y-2">
                {[
                  { key: 'email_bookings', label: t('owner.account.notif.bookings'), desc: t('owner.account.notif.bookingsDesc') },
                  { key: 'email_payouts', label: t('owner.account.notif.payouts'), desc: t('owner.account.notif.payoutsDesc') },
                  { key: 'email_messages', label: t('owner.account.notif.messages'), desc: t('owner.account.notif.messagesDesc') },
                  { key: 'email_marketing', label: t('owner.account.notif.marketing'), desc: t('owner.account.notif.marketingDesc') },
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
                  {t('owner.account.saveSettings')}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </OwnerLayout>
  );
}
