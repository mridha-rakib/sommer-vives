import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { OwnerLayout } from '@/components/layout/OwnerLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { User, CreditCard, Bell, Shield, Globe } from 'lucide-react';

export default function OwnerSettings() {
  const { user } = useAuth();
  const [profile, setProfile] = useState({ full_name: '', phone: '', email: '', company_name: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) loadProfile();
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    if (data) setProfile({ full_name: data.full_name || '', phone: data.phone || '', email: data.email || '', company_name: data.company_name || '' });
    setLoading(false);
  };

  const saveProfile = async () => {
    if (!user) return;
    setSaving(true);
    await supabase.from('profiles').update({
      full_name: profile.full_name,
      phone: profile.phone,
      company_name: profile.company_name,
    }).eq('id', user.id);
    toast.success('Indstillinger gemt');
    setSaving(false);
  };

  const sections = [
    { icon: CreditCard, label: 'Bankoplysninger', desc: 'Tilføj kontonummer for udbetalinger' },
    { icon: Bell, label: 'Notifikationer', desc: 'Vælg hvilke beskeder du vil modtage' },
    { icon: Shield, label: 'Sikkerhed', desc: 'Skift adgangskode og to-faktor' },
    { icon: Globe, label: 'Sprog', desc: 'Skift sprog for ejerportalen' },
  ];

  return (
    <OwnerLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Indstillinger</h1>
          <p className="text-sm text-muted-foreground mt-1">Administrer din konto og præferencer</p>
        </div>

        {/* Personal info */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <User className="w-4 h-4 text-accent" />
              Personlige oplysninger
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs">Fulde navn</Label>
                <Input value={profile.full_name} onChange={e => setProfile(p => ({ ...p, full_name: e.target.value }))} />
              </div>
              <div>
                <Label className="text-xs">Telefon</Label>
                <Input value={profile.phone} onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))} />
              </div>
              <div>
                <Label className="text-xs">E-mail</Label>
                <Input value={profile.email} disabled className="opacity-60" />
              </div>
              <div>
                <Label className="text-xs">Virksomhed (valgfrit)</Label>
                <Input value={profile.company_name} onChange={e => setProfile(p => ({ ...p, company_name: e.target.value }))} />
              </div>
            </div>
            <Button variant="gold" onClick={saveProfile} disabled={saving} className="text-sm">
              {saving ? 'Gemmer...' : 'Gem ændringer'}
            </Button>
          </CardContent>
        </Card>

        {/* Other sections */}
        <div className="grid md:grid-cols-2 gap-3">
          {sections.map(sec => (
            <Card key={sec.label} className="hover:border-accent/20 transition-colors cursor-pointer">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <sec.icon className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-foreground">{sec.label}</div>
                  <div className="text-xs text-muted-foreground">{sec.desc}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </OwnerLayout>
  );
}
