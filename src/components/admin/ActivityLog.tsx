import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';
import { Activity, User, Home, Calendar, DollarSign, Settings } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { AuditLog } from '@/types/admin';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useTranslation } from '@/lib/i18n';

interface ActivityLogProps { limit?: number; }

const entityIcons: Record<string, typeof Activity> = {
  booking: Calendar, property: Home, guest: User, owner: User, payout: DollarSign, settings: Settings,
};

const ACTION_KEYS: Record<string, string> = {
  create: 'admin.activity.create', update: 'admin.activity.update', delete: 'admin.activity.delete',
  status_change: 'admin.activity.statusChange', approve: 'admin.activity.approve', reject: 'admin.activity.reject',
};

export function ActivityLog({ limit = 10 }: ActivityLogProps) {
  const { t } = useTranslation();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('audit_log').select('*').order('created_at', { ascending: false }).limit(limit)
      .then(({ data }) => { setLogs(data || []); setLoading(false); });
  }, [limit]);

  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-3 animate-pulse">
            <div className="w-9 h-9 rounded-xl bg-muted/40" />
            <div className="flex-1 space-y-2">
              <div className="h-3.5 bg-muted/40 rounded-lg w-3/4" />
              <div className="h-3 bg-muted/30 rounded-lg w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="flex flex-col items-center py-12 text-center">
        <div className="w-12 h-12 rounded-2xl bg-muted/40 flex items-center justify-center mb-3">
          <Activity className="h-5 w-5 text-muted-foreground/50" />
        </div>
        <p className="text-sm font-medium text-muted-foreground">{t('admin.activity.noActivity')}</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[400px]">
      <div className="space-y-0.5">
        {logs.map(log => {
          const Icon = entityIcons[log.entity_type] || Activity;
          return (
            <div key={log.id} className="flex items-start gap-3 p-3 rounded-xl hover:bg-muted/15 transition-colors">
              <div className="w-9 h-9 rounded-xl bg-muted/30 flex items-center justify-center shrink-0 mt-0.5">
                <Icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm">
                  <span className="font-medium text-foreground">{log.actor_email || 'System'}</span>
                  {' '}
                  <span className="text-muted-foreground">{ACTION_KEYS[log.action] ? t(ACTION_KEYS[log.action]) : log.action}</span>
                  {' '}
                  <span className="font-medium text-foreground">{log.entity_type}</span>
                  {log.entity_case_number && (
                    <span className="text-muted-foreground"> ({log.entity_case_number})</span>
                  )}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {format(new Date(log.created_at), "d. MMM 'kl.' HH:mm", { locale: da })}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}
