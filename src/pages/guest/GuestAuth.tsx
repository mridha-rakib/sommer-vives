import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight, Mail, Lock, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate, Link } from 'react-router-dom';
import { BrandLogo } from '@/components/ui/BrandLogo';

export default function GuestAuth() {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast.error('Forkert e-mail eller adgangskode');
    } else {
      navigate('/guest');
    }
    setLoading(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/guest`, data: { full_name: name, account_type: 'guest' } },
    });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Bekræft din e-mail for at logge ind');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-5xl mx-auto flex items-center justify-between h-14 px-4">
          <BrandLogo variant="full" tone="light" size="sm" />

          <Link to="/auth" className="text-xs text-muted-foreground hover:text-accent transition-colors">
            Ejer-login →
          </Link>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center">
            <h1 className="font-display text-2xl font-bold text-foreground">
              {mode === 'login' ? 'Gæsteportal' : 'Opret gæstekonto'}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {mode === 'login' ? 'Log ind for at se dit ophold' : 'Opret en konto for at tilgå dit ophold'}
            </p>
          </div>

          <Card>
            <CardContent className="p-6">
              <form onSubmit={mode === 'login' ? handleLogin : handleSignup} className="space-y-4">
                {mode === 'signup' && (
                  <div>
                    <Label className="text-xs">Fulde navn</Label>
                    <Input value={name} onChange={e => setName(e.target.value)} placeholder="Dit navn" required />
                  </div>
                )}
                <div>
                  <Label className="text-xs">E-mail</Label>
                  <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="din@email.dk" required />
                </div>
                <div>
                  <Label className="text-xs">Adgangskode</Label>
                  <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} />
                </div>
                <Button type="submit" variant="gold" className="w-full" disabled={loading}>
                  {loading ? 'Vent...' : mode === 'login' ? 'Log ind' : 'Opret konto'}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </form>

              <div className="mt-4 text-center">
                <button
                  onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                  className="text-xs text-accent hover:underline"
                >
                  {mode === 'login' ? 'Har du ikke en konto? Opret her' : 'Har du allerede en konto? Log ind'}
                </button>
              </div>
            </CardContent>
          </Card>

          <p className="text-[11px] text-center text-muted-foreground/60">
            Ved at logge ind accepterer du vores{' '}
            <Link to="/terms" className="underline">vilkår</Link> og{' '}
            <Link to="/privacy" className="underline">privatlivspolitik</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
