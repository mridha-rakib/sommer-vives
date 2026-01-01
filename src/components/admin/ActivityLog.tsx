import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';
import { Activity, User, Home, Calendar, DollarSign, Settings } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { AuditLog } from '@/types/admin';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ActivityLogProps {
  limit?: number;
}

const entityIcons: Record<string, typeof Activity> = {
  booking: Calendar,
  property: Home,
  guest: User,
  owner: User,
  payout: DollarSign,
  settings: Settings,
};

const actionLabels: Record<string, string> = {
  create: 'oprettede',
  update: 'opdaterede',
  delete: 'slettede',
  status_change: 'ændrede status på',
  approve: 'godkendte',
  reject: 'afviste',
};

export function ActivityLog({ limit = 10 }: ActivityLogProps) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadLogs = async () => {
      const { data } = await supabase
        .from('audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);
      
      setLogs(data || []);
      setLoading(false);
    };

    loadLogs();
  }, [limit]);

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-3 animate-pulse">
            <div className="w-8 h-8 rounded-full bg-muted"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-muted rounded w-3/4"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>Ingen aktivitet endnu</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[400px]">
      <div className="space-y-1">
        {logs.map((log) => {
          const Icon = entityIcons[log.entity_type] || Activity;
          return (
            <div
              key={log.id}
              className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="p-2 rounded-full bg-muted">
                <Icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm">
                  <span className="font-medium">{log.actor_email || 'System'}</span>
                  {' '}
                  <span className="text-muted-foreground">
                    {actionLabels[log.action] || log.action}
                  </span>
                  {' '}
                  <span className="font-medium">{log.entity_type}</span>
                  {log.entity_case_number && (
                    <span className="text-muted-foreground"> ({log.entity_case_number})</span>
                  )}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
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
