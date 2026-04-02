import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { StatusChip, type StatusVariant } from '@/components/admin/ui/StatusChip';
import { cn } from '@/lib/utils';
import { History, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';
import { Button } from '@/components/ui/button';

const ACTION_LABELS: Record<string, { label: string; variant: StatusVariant }> = {
  beds24_publish_initiated: { label: 'Sendt til Beds24', variant: 'warning' },
  beds24_status_ready: { label: 'Klargjort til Beds24', variant: 'info' },
  beds24_status_synced: { label: 'Synkroniseret', variant: 'success' },
  beds24_status_error: { label: 'Sync fejlede', variant: 'danger' },
  beds24_mapping_updated: { label: 'Mapping opdateret', variant: 'info' },
  beds24_status_changed: { label: 'Status ændret', variant: 'muted' },
};

function resolveAction(action: string) {
  return ACTION_LABELS[action] || { label: action, variant: 'muted' as StatusVariant };
}

interface Props {
  listingId: string;
}

export function Beds24SyncLog({ listingId }: Props) {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('audit_log')
      .select('*')
      .eq('entity_type', 'listing')
      .eq('entity_id', listingId)
      .like('action', 'beds24%')
      .order('created_at', { ascending: false })
      .limit(50);
    setLogs(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchLogs(); }, [listingId]);

  return (
    <div className="rounded-xl border border-border/40 bg-card/60 overflow-hidden">
      <div className="px-5 py-3 border-b border-border/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-muted-foreground" />
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.15em]">Sync Log</p>
          <span className="text-[10px] text-muted-foreground/60 bg-muted/30 px-1.5 py-0.5 rounded-full">{logs.length}</span>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={fetchLogs} disabled={loading}>
          <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
        </Button>
      </div>

      {logs.length === 0 && !loading && (
        <div className="px-5 py-8 text-center">
          <p className="text-xs text-muted-foreground/50">Ingen sync-aktivitet endnu</p>
        </div>
      )}

      {logs.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border/20 text-muted-foreground">
                <th className="text-left px-4 py-2 font-medium">Tidspunkt</th>
                <th className="text-left px-4 py-2 font-medium">Handling</th>
                <th className="text-left px-4 py-2 font-medium">Partner</th>
                <th className="text-left px-4 py-2 font-medium">Status</th>
                <th className="text-left px-4 py-2 font-medium">Bruger</th>
                <th className="text-left px-4 py-2 font-medium">Detaljer</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(log => {
                const resolved = resolveAction(log.action);
                const afterData = log.after_data as Record<string, any> | null;
                const syncStatus = afterData?.sync_status || null;
                const errorMsg = afterData?.sync_error_message || afterData?.error || null;
                const warnings = afterData?.warnings as string[] | undefined;

                return (
                  <tr key={log.id} className="border-b border-border/10 hover:bg-muted/5 transition-colors">
                    <td className="px-4 py-2 text-muted-foreground whitespace-nowrap">
                      {log.created_at
                        ? format(new Date(log.created_at), "d. MMM HH:mm", { locale: da })
                        : '—'}
                    </td>
                    <td className="px-4 py-2 font-medium text-foreground">{resolved.label}</td>
                    <td className="px-4 py-2 text-muted-foreground">Beds24</td>
                    <td className="px-4 py-2">
                      {syncStatus
                        ? <StatusChip label={syncStatus} variant={resolved.variant} size="sm" />
                        : <span className="text-muted-foreground/40">—</span>}
                    </td>
                    <td className="px-4 py-2 text-muted-foreground truncate max-w-[140px]">
                      {log.actor_email || '—'}
                    </td>
                    <td className="px-4 py-2 text-muted-foreground max-w-[180px]">
                      {errorMsg
                        ? <span className="text-red-400 truncate block">{errorMsg}</span>
                        : warnings && warnings.length > 0
                        ? <span className="text-amber-400 truncate block">{warnings.length} advarsler</span>
                        : <span className="text-muted-foreground/40">—</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
