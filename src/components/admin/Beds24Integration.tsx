import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { StatusChip, type StatusVariant } from '@/components/admin/ui/StatusChip';
import { toast } from 'sonner';
import {
  Plug, RefreshCw, Send, Eye, Settings, AlertCircle, CheckCircle2,
  Clock, XCircle, Link2, ExternalLink
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';

type Beds24Status = 'not_connected' | 'ready' | 'sent' | 'synced' | 'error';

const STATUS_CFG: Record<Beds24Status, { label: string; variant: StatusVariant; icon: React.ElementType; description: string }> = {
  not_connected: { label: 'Ikke tilkoblet',    variant: 'muted',   icon: XCircle,      description: 'Denne listing er ikke forbundet til Beds24 endnu' },
  ready:         { label: 'Klar til Beds24',    variant: 'info',    icon: CheckCircle2, description: 'Alle data er klar — kan sendes til Beds24' },
  sent:          { label: 'Sendt til Beds24',   variant: 'warning', icon: Clock,        description: 'Data er afsendt — venter på bekræftelse fra Beds24' },
  synced:        { label: 'Synkroniseret',      variant: 'success', icon: CheckCircle2, description: 'Listing er live og synkroniseret med Beds24' },
  error:         { label: 'Fejl',               variant: 'danger',  icon: AlertCircle,  description: 'Der opstod en fejl under synkronisering' },
};

function mapSyncStatus(s: string | null): Beds24Status {
  if (!s) return 'not_connected';
  if (s === 'ready') return 'ready';
  if (s === 'pending') return 'sent';
  if (s === 'synced') return 'synced';
  if (s === 'error') return 'error';
  return 'not_connected';
}

interface Props {
  listing: any;
  onUpdate: (data: any) => void;
}

export function Beds24Integration({ listing, onUpdate }: Props) {
  const currentStatus = mapSyncStatus(listing.sync_status);
  const cfg = STATUS_CFG[currentStatus];

  const [externalPropertyId, setExternalPropertyId] = useState(listing.external_property_id || '');
  const [externalListingId, setExternalListingId] = useState(listing.external_listing_id || '');
  const [syncNotes, setSyncNotes] = useState(listing.sync_error_message || '');
  const [saving, setSaving] = useState(false);

  const saveMapping = async () => {
    setSaving(true);
    const { error } = await supabase.from('listings').update({
      external_property_id: externalPropertyId || null,
      external_listing_id: externalListingId || null,
      channel_manager_partner: 'beds24',
    }).eq('id', listing.id);
    if (error) {
      toast.error('Kunne ikke gemme');
    } else {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('audit_log').insert({ action: 'beds24_mapping_updated', entity_type: 'listing', entity_id: listing.id, actor_user_id: user?.id || null, actor_email: user?.email || null, after_data: { external_property_id: externalPropertyId, external_listing_id: externalListingId } });
      toast.success('Mapping gemt');
      onUpdate({ external_property_id: externalPropertyId, external_listing_id: externalListingId, channel_manager_partner: 'beds24' });
    }
    setSaving(false);
  };

  const setStatus = async (status: string) => {
    const { error } = await supabase.from('listings').update({
      sync_status: status,
      last_sync_at: status === 'synced' ? new Date().toISOString() : listing.last_sync_at,
      sync_error_message: status === 'error' ? syncNotes : null,
    }).eq('id', listing.id);
    if (error) {
      toast.error('Kunne ikke opdatere status');
    } else {
      toast.success(`Status ændret til "${STATUS_CFG[mapSyncStatus(status)]?.label}"`);
      onUpdate({
        sync_status: status,
        last_sync_at: status === 'synced' ? new Date().toISOString() : listing.last_sync_at,
        sync_error_message: status === 'error' ? syncNotes : null,
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* ── Beds24 Header Card ── */}
      <div className="rounded-xl border border-border/40 bg-card/60 overflow-hidden">
        <div className="px-5 py-4 border-b border-border/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <Plug className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Beds24</h3>
              <p className="text-[11px] text-muted-foreground">Channel Manager & PMS</p>
            </div>
          </div>
          <StatusChip label={cfg.label} variant={cfg.variant} dot size="md" />
        </div>

        {/* Status description */}
        <div className="px-5 py-3 bg-muted/10 border-b border-border/20">
          <div className="flex items-center gap-2">
            <cfg.icon className={cn('h-3.5 w-3.5', cfg.variant === 'danger' ? 'text-red-400' : cfg.variant === 'success' ? 'text-emerald-400' : 'text-muted-foreground')} />
            <p className="text-[11px] text-muted-foreground">{cfg.description}</p>
          </div>
        </div>

        {/* Fields */}
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Partner</Label>
              <Input value="Beds24" disabled className="h-8 text-xs bg-muted/20 border-border/30 rounded-lg" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Integration status</Label>
              <Input value={cfg.label} disabled className="h-8 text-xs bg-muted/20 border-border/30 rounded-lg" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Beds24 Property ID</Label>
              <Input
                value={externalPropertyId}
                onChange={e => setExternalPropertyId(e.target.value)}
                placeholder="F.eks. 12345"
                className="h-8 text-xs bg-muted/10 border-border/30 rounded-lg"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Beds24 Room ID</Label>
              <Input
                value={externalListingId}
                onChange={e => setExternalListingId(e.target.value)}
                placeholder="F.eks. 67890"
                className="h-8 text-xs bg-muted/10 border-border/30 rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Sidst synkroniseret</Label>
              <Input
                value={listing.last_sync_at ? format(new Date(listing.last_sync_at), "d. MMM yyyy 'kl.' HH:mm", { locale: da }) : 'Aldrig'}
                disabled
                className="h-8 text-xs bg-muted/20 border-border/30 rounded-lg"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Fejlbesked</Label>
              <Input
                value={listing.sync_error_message || '—'}
                disabled
                className="h-8 text-xs bg-muted/20 border-border/30 rounded-lg"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Sync noter</Label>
            <Textarea
              value={syncNotes}
              onChange={e => setSyncNotes(e.target.value)}
              placeholder="Interne noter om synkronisering..."
              rows={2}
              className="text-xs bg-muted/10 border-border/30 rounded-lg resize-none"
            />
          </div>

          <Button size="sm" variant="outline" onClick={saveMapping} disabled={saving} className="rounded-xl text-xs gap-1.5">
            <Link2 className="h-3.5 w-3.5" />{saving ? 'Gemmer...' : 'Gem mapping'}
          </Button>
        </div>
      </div>

      {/* ── Actions Card ── */}
      <div className="rounded-xl border border-border/40 bg-card/60 overflow-hidden">
        <div className="px-5 py-3 border-b border-border/30">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.15em]">Handlinger</p>
        </div>
        <div className="p-5 grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            className="justify-start gap-2 rounded-xl border-border/40 text-xs h-9"
            onClick={() => setStatus('ready')}
            disabled={currentStatus === 'ready' || currentStatus === 'synced'}
          >
            <CheckCircle2 className="h-3.5 w-3.5 text-blue-400" />
            Klargør til Beds24
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="justify-start gap-2 rounded-xl border-border/40 text-xs h-9"
            onClick={() => setStatus('pending')}
            disabled={currentStatus !== 'ready'}
          >
            <Send className="h-3.5 w-3.5 text-amber-400" />
            Send til Beds24
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="justify-start gap-2 rounded-xl border-border/40 text-xs h-9"
            onClick={() => setStatus('synced')}
            disabled={currentStatus !== 'sent' && currentStatus !== 'error'}
          >
            <RefreshCw className="h-3.5 w-3.5 text-emerald-400" />
            Markér synkroniseret
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="justify-start gap-2 rounded-xl border-border/40 text-xs h-9"
            onClick={saveMapping}
            disabled={saving}
          >
            <Settings className="h-3.5 w-3.5" />
            Opdater mapping
          </Button>
        </div>
      </div>

      {/* ── Status change ── */}
      <div className="rounded-xl border border-border/40 bg-card/60 overflow-hidden">
        <div className="px-5 py-3 border-b border-border/30">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.15em]">Skift status manuelt</p>
        </div>
        <div className="p-5 flex flex-wrap gap-2">
          {(Object.entries(STATUS_CFG) as [Beds24Status, typeof STATUS_CFG[Beds24Status]][]).map(([key, s]) => (
            <Button
              key={key}
              variant={currentStatus === key ? 'default' : 'outline'}
              size="sm"
              className="rounded-xl text-xs h-8 gap-1.5"
              onClick={() => setStatus(key === 'not_connected' ? 'not_connected' : key === 'sent' ? 'pending' : key)}
            >
              <s.icon className="h-3 w-3" />
              {s.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}