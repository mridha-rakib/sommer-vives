import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Lock, Mail, Shield } from "lucide-react";

export default function AdminAuth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const { user, isAdmin, signInWithPassword, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) return;

    if (isAdmin) {
      navigate("/admin", { replace: true });
      return;
    }

    toast({
      title: "Ingen admin-adgang",
      description: "Du er logget ind som ejer. Admin kræver særskilt adgang.",
      variant: "destructive",
    });

    // Ensure we don't leave a non-admin signed in when they try staff login.
    // (Keeps staff portal clean.)
    signOut();
  }, [user, isAdmin, navigate, toast, signOut]);

  const subtitle = useMemo(
    () => "Kun for staff. Log ind for at administrere platformen.",
    []
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await signInWithPassword(email, password);
      if (error) throw error;
      // redirect handled by effect
    } catch (error: any) {
      toast({
        title: "Fejl",
        description: error.message || "Noget gik galt. Prøv igen.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />
      <main className="min-h-screen bg-background pt-16">
        <section className="min-h-[calc(100vh-4rem)] flex">
          <aside className="hidden lg:flex lg:w-1/2 bg-slate-900 items-center justify-center p-12">
            <div className="max-w-md text-center">
              <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-6">
                <Shield className="w-8 h-8 text-accent" />
              </div>
              <h1 className="font-display text-4xl font-bold text-white mb-4">Admin Portal</h1>
              <p className="text-white/70">{subtitle}</p>
            </div>
          </aside>

          <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
            <div className="w-full max-w-md">
              <header className="mb-8">
                <h1 className="font-display text-3xl font-bold text-primary mb-2">Admin login</h1>
                <p className="text-muted-foreground">{subtitle}</p>
              </header>

              <form onSubmit={handleSubmit} className="space-y-4" aria-label="Admin login">
                <div>
                  <Label htmlFor="admin-email">Email</Label>
                  <div className="relative mt-1">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="admin-email"
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
                  <Label htmlFor="admin-password">Adgangskode</Label>
                  <div className="relative mt-1">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="admin-password"
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
                  {loading ? "Vent venligst..." : "Log ind"}
                </Button>
              </form>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
