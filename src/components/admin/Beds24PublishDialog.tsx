import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { StatusChip } from '@/components/admin/ui/StatusChip';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  Send, X, CheckCircle2, AlertTriangle, Image, DollarSign,
  FileText, Users, ArrowRight, Loader2
} from 'lucide-react';

interface Props {
  listing: any;
  open: boolean;
  onClose: () => void;
  onConfirmed: (updatedFields: any) => void;
}

function check(val: any): boolean {
  if (val === null || val === undefined || val === '' || val === 0) return false;
  if (Array.isArray(val) && val.length === 0) return false;
  return true;
}

export function Beds24PublishDialog({ listing, open, onClose, onConfirmed }: Props) {
  const [sending, setSending] = useState(false);

  if (!open) return null;

  const imgCount = listing.images?.length || 0;
  const amenCount = listing.amenities?.length || 0;
  const hasPrice = check(listing.base_price_per_night);
  const hasDesc = check(listing.description);
  const hasGuests = check(listing.max_guests);

  const warnings: string[] = [];
  if (!hasDesc) warnings.push('Kort beskrivelse mangler');
  if (imgCount < 5) warnings.push(`Kun ${imgCount} billeder (min. 5)`);
  if (!hasPrice) warnings.push('Basispris ikke sat');
  if (!hasGuests) warnings.push('Max gæster ikke sat');
  if (amenCount < 5) warnings.push(`Kun ${amenCount} faciliteter (min. 5)`);
  if (!listing.bedrooms) warnings.push('Soveværelser mangler');
  if (!listing.bathrooms) warnings.push('Badeværelser mangler');

  const hasBlockers = !hasDesc || !hasPrice || !hasGuests || imgCount < 1;

  const handleConfirm = async () => {
    setSending(true);
    const now = new Date().toISOString();

    // Update listing sync status
    const { error: updateError } = await supabase.from('listings').update({
      sync_status: 'pending',
      last_sync_at: now,
      sync_error_message: null,
    }).eq('id', listing.id);

    if (updateError) {
      toast.error('Kunne ikke opdatere sync-status');
      setSending(false);
      return;
    }

    // Create audit log entry as sync log
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('audit_log').insert({
      action: 'beds24_publish_initiated',
      entity_type: 'listing',
      entity_id: listing.id,
      actor_user_id: user?.id || null,
      actor_email: user?.email || null,
      after_data: {
        sync_status: 'pending',
        sent_at: now,
        image_count: imgCount,
        amenity_count: amenCount,
        base_price: listing.base_price_per_night,
        max_guests: listing.max_guests,
        warnings,
      },
    });

    onConfirmed({
      sync_status: 'pending',
      last_sync_at: now,
      sync_error_message: null,
    });

    toast.success('Listing sendt til Beds24', {
      description: 'Status ændret til "Sendt til Beds24". Sync bekræftes manuelt.',
    });

    setSending(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-lg mx-4 rounded-2xl border border-border/40 bg-card shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-border/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <Send className="h-4 w-4 text-amber-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground">Send til Beds24</h2>
              <p className="text-[11px] text-muted-foreground">Bekræft publicering til channel manager</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted/30 transition-colors">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* Summary */}
        <div className="px-6 py-4 space-y-3">
          {/* Property name */}
          <div className="rounded-xl border border-border/30 bg-muted/10 p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Ejendom</span>
              <span className="text-xs font-semibold text-foreground">{listing.name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground flex items-center gap-1.5"><FileText className="h-3 w-3" />Titel</span>
              <span className="text-xs text-foreground truncate max-w-[220px]">{listing.name || '—'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground flex items-center gap-1.5"><FileText className="h-3 w-3" />Beskrivelse</span>
              <span className="text-xs text-foreground">{hasDesc ? `${listing.description.length} tegn` : <span className="text-red-400">Mangler</span>}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground flex items-center gap-1.5"><Image className="h-3 w-3" />Billeder</span>
              <span className={cn('text-xs', imgCount >= 5 ? 'text-foreground' : 'text-amber-400')}>{imgCount} billeder</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground flex items-center gap-1.5"><DollarSign className="h-3 w-3" />Basispris</span>
              <span className="text-xs text-foreground">{hasPrice ? `${(listing.base_price_per_night / 100).toLocaleString('da-DK')} kr/nat` : <span className="text-red-400">Mangler</span>}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground flex items-center gap-1.5"><Users className="h-3 w-3" />Max gæster</span>
              <span className="text-xs text-foreground">{hasGuests ? listing.max_guests : <span className="text-red-400">Mangler</span>}</span>
            </div>
          </div>

          {/* Warnings */}
          {warnings.length > 0 && (
            <div className={cn('rounded-xl border p-4 space-y-2', hasBlockers ? 'border-red-500/20 bg-red-500/5' : 'border-amber-500/20 bg-amber-500/5')}>
              <div className="flex items-center gap-2">
                <AlertTriangle className={cn('h-3.5 w-3.5', hasBlockers ? 'text-red-400' : 'text-amber-400')} />
                <p className={cn('text-[11px] font-semibold uppercase tracking-wide', hasBlockers ? 'text-red-400' : 'text-amber-400')}>
                  {hasBlockers ? 'Blokerende mangler' : 'Advarsler'}
                </p>
              </div>
              {warnings.map((w, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className={cn('w-1.5 h-1.5 rounded-full', hasBlockers ? 'bg-red-400' : 'bg-amber-400')} />
                  <span className="text-xs text-muted-foreground">{w}</span>
                </div>
              ))}
            </div>
          )}

          {/* Readiness badge */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Klargøringsresultat</span>
            <StatusChip
              label={hasBlockers ? 'Ikke klar' : warnings.length > 0 ? 'Klar med advarsler' : 'Fuldt klar'}
              variant={hasBlockers ? 'danger' : warnings.length > 0 ? 'warning' : 'success'}
              dot
              size="md"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 py-4 border-t border-border/30 flex items-center gap-2 justify-end">
          <Button variant="outline" size="sm" className="rounded-xl text-xs" onClick={onClose}>
            Annuller
          </Button>
          <Button
            size="sm"
            className="rounded-xl text-xs gap-1.5"
            onClick={handleConfirm}
            disabled={sending || hasBlockers}
          >
            {sending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
            {sending ? 'Sender...' : 'Bekræft send'}
          </Button>
        </div>
      </div>
    </div>
  );
}
