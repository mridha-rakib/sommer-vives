import { OwnerLayout } from '@/components/layout/OwnerLayout';
import { useAuth } from '@/lib/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, Mail, Phone, Building2 } from 'lucide-react';

export default function OwnerAccount() {
  const { user } = useAuth();

  return (
    <OwnerLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">Min konto</h1>
          <p className="text-muted-foreground text-sm mt-1">Administrer din profil og kontoindstillinger</p>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <User className="w-4 h-4 text-accent" />
                Profiloplysninger
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <span className="text-foreground">{user?.email || '—'}</span>
              </div>
              <Button variant="outline" size="sm" className="mt-2">Rediger profil</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="w-4 h-4 text-accent" />
                Kontotype
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Ejer — SommerVibes partner</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </OwnerLayout>
  );
}
