import { AdminLayout } from '@/components/layout/AdminLayout';
import { AdminPageHeader } from '@/components/admin/ui/AdminPageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { UserCircle, Building2, FileText, Link2, Bell, Type, ArrowRight, ClipboardList } from 'lucide-react';

const sections = [
  { title: 'Brugerprofil', description: 'Din admin-profil og loginoplysninger', icon: UserCircle, href: '/admin/indstillinger/profil' },
  { title: 'Virksomhed', description: 'Firma-oplysninger, logo og kontaktdata', icon: Building2, href: '/admin/indstillinger/virksomhed' },
  { title: 'Pipeline-opgaver', description: 'Opgaveskabeloner for hvert pipeline-stadie', icon: ClipboardList, href: '/admin/indstillinger/pipeline-opgaver' },
  { title: 'Skabeloner', description: 'E-mail-skabeloner og aftaletekster', icon: FileText, href: '/admin/templates' },
  { title: 'Integrationer', description: 'Channel managers, Stripe og tredjeparter', icon: Link2, href: '/admin/indstillinger/integrationer' },
  { title: 'Notifikationer', description: 'E-mail- og pushnotifikationsindstillinger', icon: Bell, href: '/admin/notifications' },
  { title: 'Standardtekster', description: 'Genbrugelige tekster til aftaler, e-mails osv.', icon: Type, href: '/admin/indstillinger/tekster' },
];

export default function AdminIndstillinger() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <AdminPageHeader title="Indstillinger" subtitle="Administrér bruger, virksomhed, skabeloner og integrationer" />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sections.map(s => (
            <Link key={s.title} to={s.href}>
              <Card className="border-border/40 bg-card/60 hover:bg-card/80 hover:border-border/60 transition-all cursor-pointer group h-full">
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="w-11 h-11 rounded-xl bg-primary/8 border border-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/12 transition-colors">
                      <s.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-foreground">{s.title}</h3>
                      <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">{s.description}</p>
                      <span className="inline-flex items-center gap-1 text-xs text-primary mt-3 font-medium group-hover:gap-1.5 transition-all">
                        Åbn <ArrowRight className="h-3 w-3" />
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
