import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Settings, UserCircle, Building2, FileText, Link2, Bell, Type } from 'lucide-react';

const sections = [
  { title: 'Brugerprofil', description: 'Din admin-profil og loginoplysninger', icon: UserCircle, href: '/admin/indstillinger/profil' },
  { title: 'Virksomhed', description: 'Firma-oplysninger, logo og kontaktdata', icon: Building2, href: '/admin/indstillinger/virksomhed' },
  { title: 'Skabeloner', description: 'E-mail-skabeloner og aftaletekster', icon: FileText, href: '/admin/templates' },
  { title: 'Integrationer', description: 'Channel managers, Stripe og tredjeparter', icon: Link2, href: '/admin/indstillinger/integrationer' },
  { title: 'Notifikationer', description: 'E-mail- og pushnotifikationsindstillinger', icon: Bell, href: '/admin/notifications' },
  { title: 'Standardtekster', description: 'Genbrugelige tekster til aftaler, e-mails osv.', icon: Type, href: '/admin/indstillinger/tekster' },
];

export default function AdminIndstillinger() {
  return (
    <AdminLayout>
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Indstillinger</h1>
          <p className="text-sm text-muted-foreground">Administrér bruger, virksomhed, skabeloner og integrationer</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sections.map(s => (
            <Card key={s.title} className="hover:bg-muted/20 transition-colors cursor-pointer group">
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/15 transition-colors">
                    <s.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-foreground">{s.title}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{s.description}</p>
                    <Button variant="link" size="sm" className="h-auto p-0 mt-2 text-xs text-primary" asChild>
                      <Link to={s.href}>Åbn →</Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
