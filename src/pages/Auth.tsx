import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { BrandLogo } from '@/components/ui/BrandLogo';
import { useTranslation } from '@/lib/i18n';
import { getPasswordRecoveryParams, isPasswordRecoveryUrl } from '@/lib/passwordRecovery';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';

type AuthMode = 'login' | 'signup' | 'reset' | 'verifyReset' | 'updatePassword';

type PasswordResetAction = 'request' | 'verify' | 'complete';
type PasswordResetResponse = { success?: boolean; error?: string; resetToken?: string };

async function callPasswordReset(body: Record<string, unknown> & { action: PasswordResetAction }) {
  const { data, error } = await supabase.functions.invoke<PasswordResetResponse>('password-reset', { body });
  if (error) {
    let message = data?.error || error.message || 'Request failed';
    const context = (error as Error & { context?: { json?: () => Promise<PasswordResetResponse> } }).context;
    if (context?.json) {
      try {
        const payload = await context.json();
        message = payload?.error || message;
      } catch {
        // ignore
      }
    }
    throw new Error(message);
  }
  if (data?.error) throw new Error(data.error);
  return data;
}

const authCopy = {
  da: {
    heroTitle: 'Dit sommerhus. Dine regler.',
    heroSubtitle: 'Få en effektiv udlejningsløsning med bedre service til en lavere pris.',
    signupTitle: 'Opret ejer-konto',
    loginTitle: 'Ejer Login',
    signupSubtitle: 'Kom i gang med at udleje dit sommerhus i dag.',
    loginSubtitle: 'Velkommen tilbage! Log ind til din ejerportal.',
    fullName: 'Fulde navn',
    fullNamePlaceholder: 'Dit navn',
    email: 'Email',
    emailPlaceholder: 'din@email.dk',
    password: 'Adgangskode',
    newPassword: 'Ny adgangskode',
    confirmPassword: 'Bekræft adgangskode',
    forgotPassword: 'Glemt adgangskode?',
    resetTitle: 'Nulstil adgangskode',
    resetSubtitle: 'Indtast din e-mail, så sender vi en 6-cifret kode til at nulstille din adgangskode.',
    sendResetLink: 'Send kode',
    verifyTitle: 'Indtast bekræftelseskode',
    verifySubtitle: 'Indtast den 6-cifrede kode, vi sendte til din e-mail.',
    verifyCode: 'Bekræft kode',
    resendCode: 'Send koden igen',
    backToLogin: 'Tilbage til login',
    updatePasswordTitle: 'Vælg ny adgangskode',
    updatePasswordSubtitle: 'Indtast en ny adgangskode til din ejerkonto.',
    updatePassword: 'Opdater adgangskode',
    showPassword: 'Vis adgangskode',
    hidePassword: 'Skjul adgangskode',
    loading: 'Vent venligst...',
    createAccount: 'Opret konto',
    login: 'Log ind',
    hasAccount: 'Har du allerede en konto?',
    noAccount: 'Har du ikke en konto?',
    signupSuccessTitle: 'Konto oprettet!',
    loginSuccessTitle: 'Velkommen tilbage!',
    successDescription: 'Du er nu logget ind.',
    resetEmailSentTitle: 'Tjek din e-mail',
    resetEmailSentDescription: 'Hvis kontoen findes, har vi sendt en 6-cifret kode til at nulstille adgangskoden.',
    resetLinkExpiredTitle: 'Koden er udløbet',
    resetLinkExpiredDescription: 'Koden er ugyldig eller udløbet. Indtast din e-mail for at få en ny kode.',
    passwordMismatchTitle: 'Adgangskoderne matcher ikke',
    passwordMismatchDescription: 'Indtast den samme adgangskode i begge felter.',
    passwordUpdatedTitle: 'Adgangskoden er opdateret',
    passwordUpdatedDescription: 'Du kan nu fortsætte til din konto.',
    errorTitle: 'Fejl',
    fallbackError: 'Noget gik galt. Prøv igen.',
  },
  en: {
    heroTitle: 'Your holiday home. Your rules.',
    heroSubtitle: 'Get an efficient rental solution with better service at a lower price.',
    signupTitle: 'Create owner account',
    loginTitle: 'Owner Login',
    signupSubtitle: 'Start renting out your holiday home today.',
    loginSubtitle: 'Welcome back! Log in to your owner portal.',
    fullName: 'Full name',
    fullNamePlaceholder: 'Your name',
    email: 'Email',
    emailPlaceholder: 'your@email.com',
    password: 'Password',
    newPassword: 'New password',
    confirmPassword: 'Confirm password',
    forgotPassword: 'Forgot password?',
    resetTitle: 'Reset password',
    resetSubtitle: 'Enter your email and we’ll send you a 6-digit code to reset your password.',
    sendResetLink: 'Send code',
    verifyTitle: 'Enter verification code',
    verifySubtitle: 'Enter the 6-digit code we sent to your email.',
    verifyCode: 'Verify code',
    resendCode: 'Resend code',
    backToLogin: 'Back to login',
    updatePasswordTitle: 'Choose a new password',
    updatePasswordSubtitle: 'Enter a new password for your owner account.',
    updatePassword: 'Update password',
    showPassword: 'Show password',
    hidePassword: 'Hide password',
    loading: 'Please wait...',
    createAccount: 'Create account',
    login: 'Log in',
    hasAccount: 'Already have an account?',
    noAccount: 'Don’t have an account?',
    signupSuccessTitle: 'Account created!',
    loginSuccessTitle: 'Welcome back!',
    successDescription: 'You are now logged in.',
    resetEmailSentTitle: 'Check your email',
    resetEmailSentDescription: 'If an account exists, we sent a 6-digit code to reset your password.',
    resetLinkExpiredTitle: 'Code expired',
    resetLinkExpiredDescription: 'The code is invalid or expired. Enter your email to get a new code.',
    passwordMismatchTitle: 'Passwords do not match',
    passwordMismatchDescription: 'Enter the same password in both fields.',
    passwordUpdatedTitle: 'Password updated',
    passwordUpdatedDescription: 'You can now continue to your account.',
    errorTitle: 'Error',
    fallbackError: 'Something went wrong. Please try again.',
  },
};

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export default function Auth() {
  const { language } = useTranslation();
  const copy = language === 'en' ? authCopy.en : authCopy.da;
  const initialRecovery = getPasswordRecoveryParams();
  const [searchParams] = useSearchParams();
  const requestedMode = searchParams.get('mode');
  const [mode, setMode] = useState<AuthMode>(
    initialRecovery.isExpired
      ? 'reset'
      : isPasswordRecoveryUrl()
      ? 'updatePassword'
      : requestedMode === 'signup'
      ? 'signup'
      : requestedMode === 'updatePassword' || requestedMode === 'reset-password'
        ? 'updatePassword'
        : 'login'
  );
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [code, setCode] = useState('');
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [recoveryReady, setRecoveryReady] = useState(!isPasswordRecoveryUrl() || initialRecovery.isExpired);
  const { signUp, signInWithPassword, user, rolesLoaded, isAdmin, isOwner, isGuest } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (user && rolesLoaded && mode !== 'updatePassword') {
      navigate(isAdmin ? '/admin' : isOwner ? '/owner' : isGuest ? '/guest' : '/auth');
    }
  }, [user, rolesLoaded, isAdmin, isOwner, isGuest, mode, navigate]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setPassword('');
        setConfirmPassword('');
        setMode('updatePassword');
        setRecoveryReady(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const recovery = getPasswordRecoveryParams();
    if (!recovery.isRecovery) return;

    if (recovery.isExpired) {
      setMode('reset');
      setRecoveryReady(true);
      toast({
        title: copy.resetLinkExpiredTitle,
        description: copy.resetLinkExpiredDescription,
        variant: 'destructive',
      });
      return;
    }

    let cancelled = false;
    setMode('updatePassword');
    setPassword('');
    setConfirmPassword('');

    async function establishRecoverySession() {
      const { accessToken, refreshToken, code } = recovery;

      try {
        if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (error) throw error;
        } else if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        }
      } catch (error) {
        if (!cancelled) {
          const message = getErrorMessage(error, copy.fallbackError);
          toast({
            title: copy.errorTitle,
            description: message,
            variant: 'destructive',
          });
        }
      } finally {
        if (!cancelled) setRecoveryReady(true);
      }
    }

    establishRecoverySession();

    return () => {
      cancelled = true;
    };
  }, [copy.errorTitle, copy.fallbackError, copy.resetLinkExpiredDescription, copy.resetLinkExpiredTitle, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === 'signup') {
        const { error } = await signUp(email, password, fullName);
        if (error) throw error;
        toast({
          title: copy.signupSuccessTitle,
          description: copy.successDescription,
        });
      } else {
        const { error } = await signInWithPassword(email, password);
        if (error) throw error;
        toast({
          title: copy.loginSuccessTitle,
          description: copy.successDescription,
        });
      }
    } catch (error) {
      const message = getErrorMessage(error, copy.fallbackError);
      toast({
        title: copy.errorTitle,
        description: message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const redirectTo = `${window.location.origin}/auth?mode=updatePassword`;
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      });
      if (error) throw error;
      toast({
        title: copy.resetEmailSentTitle,
        description: copy.resetEmailSentDescription,
      });
      setMode('login');
    } catch (error) {
      const message = getErrorMessage(error, copy.fallbackError);
      toast({
        title: copy.errorTitle,
        description: message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast({
        title: copy.passwordMismatchTitle,
        description: copy.passwordMismatchDescription,
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast({
        title: copy.passwordUpdatedTitle,
        description: copy.passwordUpdatedDescription,
      });
      setPassword('');
      setConfirmPassword('');
      setMode('login');
    } catch (error) {
      const message = getErrorMessage(error, copy.fallbackError);
      toast({
        title: copy.errorTitle,
        description: message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const formSubmitHandler =
    mode === 'reset'
      ? handleResetRequest
      : mode === 'updatePassword'
        ? handlePasswordUpdate
        : handleSubmit;

  const title =
    mode === 'signup'
      ? copy.signupTitle
      : mode === 'reset'
        ? copy.resetTitle
        : mode === 'updatePassword'
          ? copy.updatePasswordTitle
          : copy.loginTitle;

  const subtitle =
    mode === 'signup'
      ? copy.signupSubtitle
      : mode === 'reset'
        ? copy.resetSubtitle
        : mode === 'updatePassword'
          ? copy.updatePasswordSubtitle
          : copy.loginSubtitle;

  const submitText =
    mode === 'signup'
      ? copy.createAccount
      : mode === 'reset'
        ? copy.sendResetLink
        : mode === 'updatePassword'
          ? copy.updatePassword
          : copy.login;

  return (
    <>
      <Header />
      <div className="min-h-screen bg-background flex pt-16">
      <div className="hidden lg:flex lg:w-1/2 bg-primary items-center justify-center p-12">
        <div className="max-w-md text-center">
          <div className="flex justify-center mb-8">
            <BrandLogo variant="mark" tone="light" size="xl" to="" />
          </div>
          <h1 className="font-display text-4xl font-bold text-background mb-4">
            {copy.heroTitle}
          </h1>
          <p className="text-background/80">
            {copy.heroSubtitle}
          </p>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden flex justify-center">
            <BrandLogo variant="mark" tone="dark" size="md" />
          </div>

          <h2 className="font-display text-3xl font-bold text-primary mb-2">
            {title}
          </h2>
          <p className="text-muted-foreground mb-8">
            {subtitle}
          </p>

          <form onSubmit={formSubmitHandler} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <Label htmlFor="fullName">{copy.fullName}</Label>
                <div className="relative mt-1">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="fullName"
                    type="text"
                    placeholder={copy.fullNamePlaceholder}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            )}

            {mode !== 'updatePassword' && (
              <div>
              <Label htmlFor="email">{copy.email}</Label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder={copy.emailPlaceholder}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="pl-10"
                />
              </div>
              </div>
            )}

            {mode !== 'reset' && (
              <div>
              <div className="flex items-center justify-between">
                <Label htmlFor="password">{mode === 'updatePassword' ? copy.newPassword : copy.password}</Label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => setMode('reset')}
                    className="text-sm text-accent hover:underline font-medium"
                  >
                    {copy.forgotPassword}
                  </button>
                )}
              </div>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  autoComplete={mode === 'updatePassword' ? 'new-password' : 'current-password'}
                  className="pl-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showPassword ? copy.hidePassword : copy.showPassword}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              </div>
            )}

            {mode === 'updatePassword' && (
              <div>
                <Label htmlFor="confirmPassword">{copy.confirmPassword}</Label>
                <div className="relative mt-1">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                    autoComplete="new-password"
                    className="pl-10 pr-10"
                  />
                </div>
              </div>
            )}

            <Button type="submit" variant="gold" className="w-full" disabled={loading || !recoveryReady}>
              {loading || !recoveryReady ? copy.loading : submitText}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {mode === 'signup' && (
              <>
                {copy.hasAccount}{' '}
                <button
                  onClick={() => setMode('login')}
                  className="text-accent hover:underline font-medium"
                >
                  {copy.login}
                </button>
              </>
            )}
            {mode === 'login' && (
              <>
                {copy.noAccount}{' '}
                <button
                  onClick={() => setMode('signup')}
                  className="text-accent hover:underline font-medium"
                >
                  {copy.createAccount}
                </button>
              </>
            )}
            {mode === 'reset' && (
              <button
                onClick={() => setMode('login')}
                className="text-accent hover:underline font-medium"
              >
                {copy.backToLogin}
              </button>
            )}
          </p>
        </div>
      </div>
      </div>
    </>
  );
}
