import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { StatusChip, type StatusVariant } from '@/components/admin/ui/StatusChip';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  X, CheckCircle2, AlertCircle, MinusCircle, Send, Globe,
  ArrowRight, Loader2, ChevronRight
} from 'lucide-react';

interface ChannelInfo {
  id: string;
  name: string;
  logo: string;
  readyField: string;
  titleField: string;
  descField: string;
}

const CHANNELS: ChannelInfo[] = [
  { id: 'airbnb', name: 'Airbnb', logo: '🏠', readyField: 'channel_airbnb_ready', titleField: 'channel_airbnb_title', descField: 'channel_airbnb_description' },
  { id: 'booking', name: 'Booking.com', logo: '🅱️', readyField: 'channel_booking_ready', titleField: 'channel_booking_title', descField: 'channel_booking_description' },
  { id: 'vrbo', name: 'Vrbo', logo: '🌴', readyField: 'channel_vrbo_ready', titleField: 'channel_vrbo_title', descField: 'channel_vrbo_description' },
];

const FLOW_STEPS = [
  { step: 1, label: 'Validering', description: 'SommerVibes tjekker at alle data er korrekte og komplette' },
  { step: 2, label: 'Mapping', description: 'Data mappes til Beds24-formatet for hver valgt kanal' },
  { step: 3, label: 'Distribution', description: 'Beds24 publicerer til de valgte kanaler' },
  { step: 4, label: 'Sporbarhed', description: 'Status og sync-log opdateres automatisk i admin' },
];

function checkChannel(listing: any, ch: ChannelInfo) {
  const missing: string[] = [];
  if (!listing[ch.readyField]) missing.push('Kanal ikke markeret som klar');
  if (!listing[ch.titleField]) missing.push('Kanaltitel mangler');
  if (!listing[ch.descField]) missing.push('Kanalbeskrivelse mangler');
  if (!listing.description) missing.push('Generel beskrivelse mangler');
  if ((listing.images?.length || 0) < 5) missing.push('Min. 5 billeder påkrævet');
  if (!listing.base_price_per_night) missing.push('Basispris mangler');
  if (!listing.max_guests) missing.push('Max gæster mangler');
  return missing;
}

interface Props {
  listing: any;
  open: boolean;
  onClose: () => void;
  onPublished: (updated: any) => void;
}

export function PublishFlowModal({ listing, open, onClose, onPublished }: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [publishing, setPublishing] = useState(false);

  if (!open) return null;

  const toggle = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelected(next);
  };

  const selectAll = () => {
    setSelected(new Set(CHANNELS.map(c => c.id)));
  };

  const globalMissing: string[] = [];
  if (!listing.description) globalMissing.push('Kort beskrivelse');
  if ((listing.images?.length || 0) < 5) globalMissing.push('Min. 5 billeder');
  if (!listing.base_price_per_night) globalMissing.push('Basispris');
  if (!listing.max_guests) globalMissing.push('Max gæster');

  const hasBlockers = globalMissing.length > 0;
  const selectedChannels = CHANNELS.filter(c => selected.has(c.id));
  const allChannelsMissing = selectedChannels.some(c => checkChannel(listing, c).length > 0);

  const handlePublish = async () => {
    setPublishing(true);
    const now = new Date().toISOString();

    const { error } = await supabase.from('listings').update({
      sync_status: 'pending',
      last_sync_at: now,
      sync_error_message: null,
    }).eq('id', listing.id);

    if (error) {
      toast.error('Kunne ikke starte publicering');
      setPublishing(false);
      return;
    }

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
        channels: Array.from(selected),
        image_count: listing.images?.length || 0,
      },
    });

    onPublished({ sync_status: 'pending', last_sync_at: now, sync_error_message: null });
    toast.success('Publicering startet', {
      description: `${selected.size} kanal${selected.size > 1 ? 'er' : ''} via Beds24`,
    });
    setPublishing(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-2xl mx-4 rounded-2xl border border-border/40 bg-card shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-border/30 flex items-center justify-between sticky top-0 bg-card z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <Globe className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground">Publicér listing</h2>
              <p className="text-[11px] text-muted-foreground">{listing.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted/30 transition-colors">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Flow explanation */}
          <div className="rounded-xl border border-border/30 bg-muted/10 p-4">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">Sådan fungerer det</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {FLOW_STEPS.map((s, i) => (
                <div key={s.step} className="relative">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center">{s.step}</span>
                    <span className="text-[11px] font-semibold text-foreground">{s.label}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-tight pl-7">{s.description}</p>
                  {i < FLOW_STEPS.length - 1 && (
                    <ChevronRight className="hidden sm:block absolute top-1 -right-2.5 h-3 w-3 text-muted-foreground/30" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Global readiness */}
          {hasBlockers && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-3.5 w-3.5 text-red-400" />
                <p className="text-[11px] font-semibold text-red-400 uppercase tracking-wide">Blokerende mangler</p>
              </div>
              {globalMissing.map((m, i) => (
                <div key={i} className="flex items-center gap-2 ml-5">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                  <span className="text-xs text-muted-foreground">{m}</span>
                </div>
              ))}
            </div>
          )}

          {/* Channel selection */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Vælg kanaler</p>
              <button onClick={selectAll} className="text-[11px] text-primary hover:underline">Vælg alle</button>
            </div>
            <div className="space-y-2">
              {CHANNELS.map(ch => {
                const missing = checkChannel(listing, ch);
                const ready = missing.length === 0;
                const isSelected = selected.has(ch.id);

                return (
                  <button
                    key={ch.id}
                    onClick={() => toggle(ch.id)}
                    className={cn(
                      'w-full rounded-xl border p-4 text-left transition-all',
                      isSelected
                        ? 'border-primary/30 bg-primary/5 ring-1 ring-primary/20'
                        : 'border-border/30 bg-card hover:border-border/50'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{ch.logo}</span>
                        <div>
                          <p className="text-xs font-semibold text-foreground">{ch.name}</p>
                          <p className="text-[11px] text-muted-foreground">
                            {ready ? 'Alle data klar til distribution' : `${missing.length} mangler`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusChip
                          label={ready ? 'Klar' : 'Mangler data'}
                          variant={ready ? 'success' : 'warning'}
                          dot
                          size="sm"
                        />
                        <div className={cn(
                          'w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all',
                          isSelected ? 'border-primary bg-primary' : 'border-border/40'
                        )}>
                          {isSelected && <CheckCircle2 className="h-3 w-3 text-primary-foreground" />}
                        </div>
                      </div>
                    </div>

                    {/* Missing items for this channel */}
                    {isSelected && missing.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-border/20 space-y-1">
                        {missing.map((m, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <MinusCircle className="h-3 w-3 text-amber-400 shrink-0" />
                            <span className="text-[11px] text-muted-foreground">{m}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* What happens */}
                    {isSelected && ready && (
                      <div className="mt-3 pt-3 border-t border-border/20">
                        <div className="flex items-center gap-2">
                          <ArrowRight className="h-3 w-3 text-emerald-400 shrink-0" />
                          <span className="text-[11px] text-muted-foreground">
                            Listing publiceres på {ch.name} via Beds24 med titel, beskrivelse, billeder og priser
                          </span>
                        </div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* All via Beds24 info */}
          <div className="rounded-xl border border-border/30 bg-muted/10 p-3 flex items-center gap-3">
            <span className="text-[11px] text-muted-foreground">
              💡 Alle kanaler distribueres via <span className="font-semibold text-foreground">Beds24</span> — priser, tilgængelighed og bookinger synkroniseres automatisk
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border/30 flex items-center justify-between sticky bottom-0 bg-card">
          <div className="text-xs text-muted-foreground">
            {selected.size > 0
              ? `${selected.size} kanal${selected.size > 1 ? 'er' : ''} valgt`
              : 'Ingen kanaler valgt'}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="rounded-xl text-xs" onClick={onClose}>Annuller</Button>
            <Button
              size="sm"
              className="rounded-xl text-xs gap-1.5"
              onClick={handlePublish}
              disabled={publishing || selected.size === 0 || hasBlockers}
            >
              {publishing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              {publishing ? 'Publicerer...' : 'Publicér listing'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
