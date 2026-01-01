import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Home, Mail, Lock, User } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Auth() {
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState<'login' | 'signup'>(
    searchParams.get('mode') === 'signup' ? 'signup' : 'login'
  );
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp, signInWithPassword, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      navigate('/owner');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === 'signup') {
        const { error } = await signUp(email, password, fullName);
        if (error) throw error;
        toast({
          title: 'Konto oprettet!',
          description: 'Du er nu logget ind.',
        });
      } else {
        const { error } = await signInWithPassword(email, password);
        if (error) throw error;
        toast({
          title: 'Velkommen tilbage!',
          description: 'Du er nu logget ind.',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Fejl',
        description: error.message || 'Noget gik galt. Prøv igen.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      <div className="hidden lg:flex lg:w-1/2 bg-primary items-center justify-center p-12">
        <div className="max-w-md text-center">
          <Home className="w-16 h-16 text-accent mx-auto mb-6" />
          <h1 className="font-display text-4xl font-bold text-primary-foreground mb-4">
            Dit sommerhus. Dine regler.
          </h1>
          <p className="text-primary-foreground/80">
            Få en effektiv udlejningsløsning med bedre service til en lavere pris.
          </p>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <Link to="/" className="flex items-center gap-2 mb-8 lg:hidden">
            <Home className="h-6 w-6 text-accent" />
            <span className="font-display text-xl font-semibold text-primary">
              Sommerhus<span className="text-accent">Bureau</span>
            </span>
          </Link>

          <h2 className="font-display text-3xl font-bold text-primary mb-2">
            {mode === 'signup' ? 'Opret ejer-konto' : 'Ejer Login'}
          </h2>
          <p className="text-muted-foreground mb-8">
            {mode === 'signup'
              ? 'Kom i gang med at udleje dit sommerhus i dag.'
              : 'Velkommen tilbage! Log ind til din ejerportal.'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <Label htmlFor="fullName">Fulde navn</Label>
                <div className="relative mt-1">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Dit navn"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="email">Email</Label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="din@email.dk"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="password">Adgangskode</Label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="pl-10"
                />
              </div>
            </div>

            <Button type="submit" variant="gold" className="w-full" disabled={loading}>
              {loading ? 'Vent venligst...' : mode === 'signup' ? 'Opret konto' : 'Log ind'}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {mode === 'signup' ? (
              <>
                Har du allerede en konto?{' '}
                <button
                  onClick={() => setMode('login')}
                  className="text-accent hover:underline font-medium"
                >
                  Log ind
                </button>
              </>
            ) : (
              <>
                Har du ikke en konto?{' '}
                <button
                  onClick={() => setMode('signup')}
                  className="text-accent hover:underline font-medium"
                >
                  Opret konto
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
