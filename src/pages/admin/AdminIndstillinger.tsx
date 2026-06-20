import { AdminLayout } from '@/components/layout/AdminLayout';
import { AdminPageHeader } from '@/components/admin/ui/AdminPageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { UserCircle, Building2, FileText, Link2, Bell, Type, ArrowRight, ClipboardList } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

export default function AdminIndstillinger() {
  const { t } = useTranslation();

  const sections = [
    { titleKey: 'admin.settings.section.profile.title', descKey: 'admin.settings.section.profile.desc', icon: UserCircle, href: '/admin/indstillinger/profil' },
    { titleKey: 'admin.settings.section.company.title', descKey: 'admin.settings.section.company.desc', icon: Building2, href: '/admin/indstillinger/virksomhed' },
    { titleKey: 'admin.settings.section.pipeline.title', descKey: 'admin.settings.section.pipeline.desc', icon: ClipboardList, href: '/admin/indstillinger/pipeline-opgaver' },
    { titleKey: 'admin.settings.section.templates.title', descKey: 'admin.settings.section.templates.desc', icon: FileText, href: '/admin/templates' },
    { titleKey: 'admin.settings.section.integrations.title', descKey: 'admin.settings.section.integrations.desc', icon: Link2, href: '/admin/indstillinger/integrationer' },
    { titleKey: 'admin.settings.section.notifications.title', descKey: 'admin.settings.section.notifications.desc', icon: Bell, href: '/admin/notifications' },
    { titleKey: 'admin.settings.section.texts.title', descKey: 'admin.settings.section.texts.desc', icon: Type, href: '/admin/indstillinger/tekster' },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <AdminPageHeader title={t('admin.settings.title')} subtitle={t('admin.settings.subtitle')} />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sections.map(s => (
            <Link key={s.titleKey} to={s.href}>
              <Card className="border-border/40 bg-card/60 hover:bg-card/80 hover:border-border/60 transition-all cursor-pointer group h-full">
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="w-11 h-11 rounded-xl bg-primary/8 border border-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/12 transition-colors">
                      <s.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-foreground">{t(s.titleKey)}</h3>
                      <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">{t(s.descKey)}</p>
                      <span className="inline-flex items-center gap-1 text-xs text-primary mt-3 font-medium group-hover:gap-1.5 transition-all">
                        {t('admin.settings.open')} <ArrowRight className="h-3 w-3" />
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
