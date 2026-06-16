import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate, Link } from 'react-router-dom';
import { BrandLogo } from '@/components/ui/BrandLogo';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/components/ui/input-otp';

type Mode = 'login' | 'signup' | 'verify';
type GuestRegistrationAction = 'request_signup' | 'resend' | 'verify';
type GuestRegistrationResponse = { success?: boolean; error?: string };

async function callGuestRegistration(body: Record<string, unknown> & { action: GuestRegistrationAction }) {
  const { data, error } = await supabase.functions.invoke<GuestRegistrationResponse>('guest-registration', { body });
  if (error) {
    const context = (error as Error & { context?: { json?: () => Promise<GuestRegistrationResponse> } }).context;
    if (context?.json) {
      try {
        const payload = await context.json();
        throw new Error(payload?.error || error.message || 'Verification request failed');
      } catch (payloadError) {
        if (payloadError instanceof Error) throw payloadError;
      }
    }
    throw new Error(data?.error || error.message || 'Verification request failed');
  }
  if (data?.error) throw new Error(data.error);
  return data;
}

export default function GuestAuth() {
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      if (error.message.toLowerCase().includes('email not confirmed')) {
        toast.error('Email not verified yet. Enter the code we sent you.');
        setMode('verify');
      } else {
        toast.error('Incorrect email or password');
      }
    } else {
      navigate('/guest');
    }
    setLoading(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await callGuestRegistration({ action: 'request_signup', email, password, full_name: name });
      toast.success('We sent a 6-digit verification code to your email');
      setCode('');
      setMode('verify');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to create account');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) {
      toast.error('Enter the 6-digit code from your email');
      return;
    }
    setLoading(true);
    try {
      await callGuestRegistration({ action: 'verify', email, code });
      const { error: signInError } = password
        ? await supabase.auth.signInWithPassword({ email, password })
        : { error: new Error('Password required') };
      if (signInError) {
        toast.success('Email verified. Please log in.');
        setMode('login');
      } else {
        toast.success('Email verified');
        navigate('/guest');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Invalid or expired code');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      toast.error('Enter your email first');
      return;
    }
    setResending(true);
    try {
      await callGuestRegistration({ action: 'resend', email });
      toast.success('New code sent');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to resend code');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border">
        <div className="max-w-5xl mx-auto flex items-center justify-between h-14 px-4">
          <BrandLogo variant="full" tone="light" size="sm" />
          <Link to="/auth" className="text-xs text-muted-foreground hover:text-accent transition-colors">
            Owner login →
          </Link>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center">
            <h1 className="font-display text-2xl font-bold text-foreground">
              {mode === 'login' && 'Guest portal'}
              {mode === 'signup' && 'Create guest account'}
              {mode === 'verify' && 'Verify your email'}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {mode === 'login' && 'Log in to see your stay'}
              {mode === 'signup' && 'Create an account to access your stay'}
              {mode === 'verify' && `Enter the 6-digit code we sent to ${email}`}
            </p>
          </div>

          <Card>
            <CardContent className="p-6">
              {mode === 'verify' ? (
                <form onSubmit={handleVerify} className="space-y-4">
                  <div className="flex justify-center">
                    <InputOTP maxLength={6} value={code} onChange={setCode}>
                      <InputOTPGroup>
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                        <InputOTPSlot index={3} />
                        <InputOTPSlot index={4} />
                        <InputOTPSlot index={5} />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                  <Button type="submit" variant="gold" className="w-full" disabled={loading || code.length !== 6}>
                    {loading ? 'Verifying...' : 'Verify email'}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                  <div className="flex items-center justify-between text-xs">
                    <button
                      type="button"
                      onClick={handleResend}
                      disabled={resending}
                      className="text-accent hover:underline disabled:opacity-50"
                    >
                      {resending ? 'Sending...' : 'Resend code'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setMode('login')}
                      className="text-muted-foreground hover:underline"
                    >
                      Back to login
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={mode === 'login' ? handleLogin : handleSignup} className="space-y-4">
                  {mode === 'signup' && (
                    <div>
                      <Label className="text-xs">Full name</Label>
                      <Input value={name} onChange={e => setName(e.target.value)} placeholder="Your name" required />
                    </div>
                  )}
                  <div>
                    <Label className="text-xs">Email</Label>
                    <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@email.com" required />
                  </div>
                  <div>
                    <Label className="text-xs">Password</Label>
                    <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} />
                  </div>
                  <Button type="submit" variant="gold" className="w-full" disabled={loading}>
                    {loading ? 'Please wait...' : mode === 'login' ? 'Log in' : 'Create account'}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </form>
              )}

              {mode !== 'verify' && (
                <div className="mt-4 text-center">
                  <button
                    onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                    className="text-xs text-accent hover:underline"
                  >
                    {mode === 'login' ? "Don't have an account? Create one" : 'Already have an account? Log in'}
                  </button>
                </div>
              )}
            </CardContent>
          </Card>

          <p className="text-[11px] text-center text-muted-foreground/60">
            By logging in you agree to our{' '}
            <Link to="/terms" className="underline">terms</Link> and{' '}
            <Link to="/privacy" className="underline">privacy policy</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
