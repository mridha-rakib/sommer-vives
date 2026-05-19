import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Lock, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BrandLogo } from '@/components/ui/BrandLogo';
import { DEV_BYPASS_AUTH } from '@/lib/devBypass';
import type { Language } from '@/lib/i18n';
import { isPasswordRecoveryUrl } from '@/lib/passwordRecovery';

const ACCESS_KEY = 'sv-access-granted';
const LANGUAGE_KEY = 'preferred-language';
const CORRECT_CODE = 'emil121a';
const ENABLE_COMING_SOON_GATE = import.meta.env.VITE_ENABLE_COMING_SOON_GATE === 'true';
const PUBLIC_PRODUCTION_HOSTS = new Set(['sommervibes.dk', 'www.sommervibes.dk']);

const gateCopy = {
  da: {
    badge: 'Coming soon',
    titlePrefix: 'Vi er snart',
    titleHighlight: 'live',
    description: 'Sitet er i privat preview. Indtast adgangskoden for at fortsætte.',
    passwordPlaceholder: 'Adgangskode',
    error: 'Forkert kode — prøv igen',
    submit: 'Få adgang',
    contactPrefix: 'Har du ikke en kode? Kontakt os på',
  },
  en: {
    badge: 'Coming soon',
    titlePrefix: 'We are almost',
    titleHighlight: 'live',
    description: 'The site is in private preview. Enter the password to continue.',
    passwordPlaceholder: 'Password',
    error: 'Incorrect code — try again',
    submit: 'Get access',
    contactPrefix: 'Do you not have a code? Contact us at',
  },
};

function getGateLanguage(): 'da' | 'en' {
  const stored = localStorage.getItem(LANGUAGE_KEY) as Language | null;
  return stored === 'en' ? 'en' : 'da';
}

function isPublicProductionHost() {
  return typeof window !== 'undefined' && PUBLIC_PRODUCTION_HOSTS.has(window.location.hostname);
}

export function ComingSoonGate({ children }: { children: React.ReactNode }) {
  const [unlocked, setUnlocked] = useState(false);
  const [checking, setChecking] = useState(true);
  const [code, setCode] = useState('');
  const [error, setError] = useState(false);
  const [language, setLanguage] = useState<'da' | 'en'>(getGateLanguage);
  const copy = gateCopy[language];

  useEffect(() => {
    const granted = localStorage.getItem(ACCESS_KEY);
    if (granted === 'true') setUnlocked(true);
    setChecking(false);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim().toLowerCase() === CORRECT_CODE) {
      localStorage.setItem(ACCESS_KEY, 'true');
      setUnlocked(true);
    } else {
      setError(true);
      setTimeout(() => setError(false), 2000);
    }
  };

  useEffect(() => {
    const handleStorage = () => setLanguage(getGateLanguage());

    window.addEventListener('storage', handleStorage);
    window.addEventListener('preferred-language-change', handleStorage);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('preferred-language-change', handleStorage);
    };
  }, []);

  // Midlertidig bypass — følger samme flag som auth-bypass i src/lib/devBypass.ts
  if (DEV_BYPASS_AUTH || !ENABLE_COMING_SOON_GATE || isPublicProductionHost() || isPasswordRecoveryUrl()) return <>{children}</>;
  if (checking) return null;
  if (unlocked) return <>{children}</>;

  return (
    <div className="fixed inset-0 z-[9999] bg-background flex items-center justify-center p-4 overflow-hidden">
      {/* Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/[0.08] rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-accent/[0.06] rounded-full blur-[100px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-md"
      >
        <div className="relative bg-card border border-border rounded-3xl p-8 md:p-10 text-center shadow-[0_40px_100px_-20px_hsl(var(--foreground)/0.2)]">
          {/* Logo */}
          <div className="flex items-center justify-center mb-8">
            <BrandLogo variant="mark" tone="light" size="md" to="" />
          </div>

          {/* Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-6"
          >
            <Lock className="w-7 h-7 text-primary" />
          </motion.div>

          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-[11px] font-medium text-primary uppercase tracking-wider">{copy.badge}</span>
          </div>

          <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-3 leading-tight">
            {copy.titlePrefix}{' '}
            <span className="text-primary italic font-normal">{copy.titleHighlight}</span>
          </h1>

          <p className="text-foreground/60 text-sm md:text-base leading-relaxed mb-8 max-w-sm mx-auto">
            {copy.description}
          </p>

          <form onSubmit={handleSubmit} className="space-y-3">
            <motion.div
              animate={error ? { x: [0, -8, 8, -8, 8, 0] } : {}}
              transition={{ duration: 0.4 }}
            >
              <Input
                type="password"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder={copy.passwordPlaceholder}
                className={`h-12 text-center text-base rounded-xl ${
                  error ? 'border-destructive ring-2 ring-destructive/20' : ''
                }`}
                autoFocus
              />
            </motion.div>

            {error && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-xs text-destructive"
              >
                {copy.error}
              </motion.p>
            )}

            <Button
              type="submit"
              variant="gold"
              size="lg"
              className="w-full gap-2 group rounded-xl text-base h-12"
            >
              {copy.submit}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </form>

          <p className="text-[11px] text-foreground/40 mt-6">
            {copy.contactPrefix}{' '}
            <a href="mailto:ek@klockmann.dk" className="text-primary hover:underline">
              ek@klockmann.dk
            </a>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
