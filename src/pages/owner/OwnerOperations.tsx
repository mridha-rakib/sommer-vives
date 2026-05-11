import { OwnerLayout } from '@/components/layout/OwnerLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Key, Wrench, ClipboardCheck, Phone, ShieldCheck } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth';
import { useTranslation } from '@/lib/i18n';
import {
  getOwnerOperations,
  isDamageTicket,
  isOpenOperationStatus,
  type OwnerMaintenanceJob,
} from '@/lib/owner-operations-api';

export default function OwnerOperations() {
  const { user } = useAuth();
  const { t, language } = useTranslation();

  const { data, isLoading } = useQuery({
    queryKey: ['owner-operations', user?.id],
    queryFn: () => getOwnerOperations(user!.id),
    enabled: !!user?.id,
  });

  const locale = language === 'da' ? 'da-DK' : language === 'de' ? 'de-DE' : language === 'nl' ? 'nl-NL' : 'en-US';
  const propertyCount = data?.properties.length || 0;
  const openCleaningJobs = data?.cleaningJobs.filter((job) => isOpenOperationStatus(job.status)) || [];
  const activeMaintenanceJobs = data?.maintenanceJobs.filter((job) => isOpenOperationStatus(job.status)) || [];
  const installedKeyboxes = data?.keyboxes.filter((keybox) => keybox.status === 'installed') || [];
  const openKeyboxes = data?.keyboxes.filter((keybox) => isOpenOperationStatus(keybox.status)) || [];
  const checklistReady = !!data?.checkinGuides.some((guide) => (
    guide.arrival_instructions || guide.departure_checklist || guide.keybox_instructions
  )) || !!data?.cleaningJobs.some((job) => job.checklist);
  const assignedPartners = data?.servicePartners || [];
  const activeDamageTickets = data?.supportTickets.filter((ticket) => (
    isOpenOperationStatus(ticket.status) && isDamageTicket(ticket)
  )) || [];

  const countStatus = (key: string, count: number) => t(key).replace('{count}', String(count));
  const loadingStatus = isLoading ? t('owner.operations.status.loading') : null;

  const services = [
    {
      icon: Sparkles,
      label: t('owner.operations.cleaning.label'),
      status: loadingStatus || (openCleaningJobs.length > 0 ? countStatus('owner.operations.status.scheduledCount', openCleaningJobs.length) : propertyCount > 0 ? t('owner.operations.status.active') : t('owner.operations.status.notSet')),
      desc: t('owner.operations.cleaning.desc'),
      active: openCleaningJobs.length > 0 || propertyCount > 0,
    },
    {
      icon: Key,
      label: t('owner.operations.keybox.label'),
      status: loadingStatus || (installedKeyboxes.length > 0 ? t('owner.operations.status.installed') : openKeyboxes.length > 0 ? t('owner.operations.status.planned') : t('owner.operations.status.notSet')),
      desc: t('owner.operations.keybox.desc'),
      active: installedKeyboxes.length > 0,
    },
    {
      icon: ClipboardCheck,
      label: t('owner.operations.checklist.label'),
      status: loadingStatus || (checklistReady ? t('owner.operations.status.ready') : t('owner.operations.status.missing')),
      desc: t('owner.operations.checklist.desc'),
      active: checklistReady,
    },
    {
      icon: Wrench,
      label: t('owner.operations.maintenance.label'),
      status: loadingStatus || (activeMaintenanceJobs.length > 0 ? countStatus('owner.operations.status.activeCount', activeMaintenanceJobs.length) : t('owner.operations.status.noActive')),
      desc: t('owner.operations.maintenance.desc'),
      active: activeMaintenanceJobs.length > 0,
    },
    {
      icon: Phone,
      label: t('owner.operations.partner.label'),
      status: loadingStatus || (assignedPartners.length > 0 ? t('owner.operations.status.assigned') : t('owner.operations.status.notSet')),
      desc: t('owner.operations.partner.desc'),
      active: assignedPartners.length > 0,
    },
    {
      icon: ShieldCheck,
      label: t('owner.operations.insurance.label'),
      status: loadingStatus || (activeDamageTickets.length > 0 ? countStatus('owner.operations.status.activeCases', activeDamageTickets.length) : propertyCount > 0 ? t('owner.operations.status.covered') : t('owner.operations.status.notSet')),
      desc: t('owner.operations.insurance.desc'),
      active: propertyCount > 0,
    },
  ];

  const formatDate = (date: string) => new Date(date).toLocaleDateString(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const maintenanceStatusLabel = (job: OwnerMaintenanceJob) => {
    const key = `owner.operations.jobStatus.${job.status}`;
    const label = t(key);
    return label === key ? job.status : label;
  };

  return (
    <OwnerLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">{t('owner.operations.title')}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t('owner.operations.subtitle')}</p>
        </div>

        <div className="grid md:grid-cols-2 gap-3">
          {services.map(svc => (
            <Card key={svc.label} className="hover:border-accent/20 transition-colors">
              <CardContent className="p-5 flex items-start gap-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${svc.active ? 'bg-accent/10' : 'bg-muted'}`}>
                  <svc.icon className={`w-5 h-5 ${svc.active ? 'text-accent' : 'text-muted-foreground'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-semibold text-foreground">{svc.label}</span>
                    <Badge variant="outline" className={`text-[10px] ${svc.active ? 'bg-emerald-400/15 text-emerald-400 border-emerald-400/20' : ''}`}>
                      {svc.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{svc.desc}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Maintenance requests */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{t('owner.operations.maintenanceTasks')}</CardTitle>
          </CardHeader>
          <CardContent>
            {activeMaintenanceJobs.length === 0 ? (
              <div className="text-center py-10">
                <Wrench className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">{isLoading ? t('owner.operations.loading') : t('owner.operations.emptyMaintenance')}</p>
                <p className="text-xs text-muted-foreground/60 mt-1">{t('owner.operations.emptyMaintenanceHelp')}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {activeMaintenanceJobs.map((job) => (
                  <div key={job.id} className="flex items-start justify-between gap-4 rounded-lg bg-muted/30 p-3">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-foreground">{job.title}</div>
                      {job.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{job.description}</p>
                      )}
                      <p className="text-xs text-muted-foreground/60 mt-1">{formatDate(job.created_at)}</p>
                    </div>
                    <Badge variant="outline" className="text-[10px] shrink-0">
                      {maintenanceStatusLabel(job)}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </OwnerLayout>
  );
}
