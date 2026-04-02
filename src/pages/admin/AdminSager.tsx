import { useState, useEffect, useMemo } from 'react';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import {
  Search, FolderOpen, MapPin, Home, Users, ChevronRight,
  LayoutGrid, List, CheckCircle2, Clock, Radio, Columns3,
  Eye, XCircle, RotateCcw, Handshake, Rocket, Ban, Plus
} from 'lucide-react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { AdminPageHeader } from '@/components/admin/ui/AdminPageHeader';
import { StatusChip } from '@/components/admin/ui/StatusChip';
import { EmptyState } from '@/components/admin/ui/EmptyState';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

type SVariant = 'info' | 'warning' | 'success' | 'muted' | 'danger';

/* ── Pipeline stages ── */
const PIPELINE_STAGES = [
  'udlejningstjek',
  'foer_salg',
  'til_leje',
  'retur',
  'tabt_vil_ikke',
  'tabt_konkurrent',
] as const;

type PipelineStage = typeof PIPELINE_STAGES[number];

const STATUS_MAP: Record<string, { label: string; shortLabel: string; variant: SVariant; icon: React.ElementType }> = {
  udlejningstjek:  { label: 'Udlejningstjek',           shortLabel: 'Udlejningstjek',     variant: 'warning', icon: Eye },
  foer_salg:       { label: 'Før salg',                  shortLabel: 'Før salg',            variant: 'info',    icon: Handshake },
  til_leje:        { label: 'Til leje',                  shortLabel: 'Til leje',            variant: 'success', icon: Rocket },
  retur:           { label: 'Retur',                     shortLabel: 'Retur',               variant: 'muted',   icon: RotateCcw },
  tabt_vil_ikke:   { label: 'Tabt – Vil ikke udleje',   shortLabel: 'Tabt kommission',     variant: 'danger',  icon: Ban },
  tabt_konkurrent: { label: 'Tabt – Til konkurrent',    shortLabel: 'Tabt konkurrent',     variant: 'danger',  icon: XCircle },
  // Legacy fallbacks
  draft:           { label: 'Kladde',                    shortLabel: 'Kladde',              variant: 'muted',   icon: FolderOpen },
  preparing:       { label: 'Klargøring',                shortLabel: 'Klargøring',          variant: 'warning', icon: Clock },
  review:          { label: 'Til gennemgang',            shortLabel: 'Gennemgang',          variant: 'info',    icon: Eye },
  ready:           { label: 'Klar',                      shortLabel: 'Klar',                variant: 'success', icon: CheckCircle2 },
  live:            { label: 'Til leje',                  shortLabel: 'Til leje',            variant: 'success', icon: Rocket },
  paused:          { label: 'Pauset',                    shortLabel: 'Pauset',              variant: 'danger',  icon: Ban },
};

function mapLegacyStatus(s: string | null): string {
  if (!s) return 'udlejningstjek';
  if (PIPELINE_STAGES.includes(s as PipelineStage)) return s;
  if (s === 'draft' || s === 'preparing' || s === 'review') return 'foer_salg';
  if (s === 'ready' || s === 'live') return 'til_leje';
  if (s === 'paused') return 'retur';
  return 'udlejningstjek';
}

function ReadinessBar({ score }: { score: number }) {
  const color = score >= 80 ? 'bg-emerald-500' : score >= 50 ? 'bg-amber-400' : 'bg-red-400';
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 bg-muted/40 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${Math.min(score, 100)}%` }} />
      </div>
      <span className="text-[11px] font-semibold text-muted-foreground tabular-nums">{score}%</span>
    </div>
  );
}

function ChannelDots({ airbnb, booking, vrbo }: { airbnb: boolean; booking: boolean; vrbo: boolean }) {
  const Dot = ({ active, label }: { active: boolean; label: string }) => (
    <span title={label} className={cn('w-2 h-2 rounded-full', active ? 'bg-emerald-500' : 'bg-muted-foreground/20')} />
  );
  return (
    <div className="flex items-center gap-1.5">
      <Dot active={airbnb} label="Airbnb" />
      <Dot active={booking} label="Booking.com" />
      <Dot active={vrbo} label="Vrbo" />
    </div>
  );
}

export default function AdminSager() {
  const navigate = useNavigate();
  const [listings, setListings] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeStage, setActiveStage] = useState<PipelineStage | 'all'>('all');
  const [view, setView] = useState<'list' | 'cards'>('list');

  useEffect(() => {
    const load = async () => {
      const [{ data: ls }, { data: profs }] = await Promise.all([
        supabase.from('listings').select('id, slug, name, address, region, hero_image, images, is_active, max_guests, bedrooms, bathrooms, updated_at, internal_status, readiness_score, channel_airbnb_ready, channel_booking_ready, channel_vrbo_ready, owner_id, property_type, sync_status').order('sort_order'),
        supabase.from('profiles').select('id, full_name, email'),
      ]);
      setListings((ls as any[]) || []);
      const map: Record<string, any> = {};
      (profs || []).forEach(p => { map[p.id] = p; });
      setProfiles(map);
      setLoading(false);
    };
    load();
  }, []);

  const normalizedListings = useMemo(() =>
    listings.map(l => ({ ...l, _stage: mapLegacyStatus(l.internal_status) })),
    [listings]
  );

  const stageCounts = useMemo(() => {
    const c: Record<string, number> = { all: normalizedListings.length };
    PIPELINE_STAGES.forEach(s => { c[s] = 0; });
    normalizedListings.forEach(l => { c[l._stage] = (c[l._stage] || 0) + 1; });
    return c;
  }, [normalizedListings]);

  const filtered = normalizedListings.filter(l => {
    if (activeStage !== 'all' && l._stage !== activeStage) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!l.name.toLowerCase().includes(q) && !(l.region || '').toLowerCase().includes(q) && !(l.address || '').toLowerCase().includes(q)) return false;
    }
    return true;
  });

  return (
    <AdminLayout>
      <div className="space-y-0">
        {/* ── Stage tabs (top bar) ── */}
        <div className="border-b border-border/40 bg-card/30 -mx-6 -mt-6 px-6 mb-6">
          <div className="flex items-center overflow-x-auto">
            <button
              onClick={() => setActiveStage('all')}
              className={cn(
                'px-4 py-3.5 text-xs font-semibold uppercase tracking-wide border-b-2 transition-all whitespace-nowrap',
                activeStage === 'all'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              Alle sager
              <span className="ml-1.5 text-[10px] font-bold opacity-60">{stageCounts.all}</span>
            </button>
            {PIPELINE_STAGES.map(stage => {
              const cfg = STATUS_MAP[stage];
              return (
                <button
                  key={stage}
                  onClick={() => setActiveStage(stage)}
                  className={cn(
                    'px-4 py-3.5 text-xs font-semibold uppercase tracking-wide border-b-2 transition-all whitespace-nowrap',
                    activeStage === stage
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  )}
                >
                  {cfg.shortLabel}
                  <span className="ml-1.5 text-[10px] font-bold opacity-60">{stageCounts[stage] || 0}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Subheader ── */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <p className="text-sm text-muted-foreground font-medium">
            {filtered.length} sager {activeStage !== 'all' ? `er "${STATUS_MAP[activeStage]?.label}"` : 'i alt'}
          </p>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Søg..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 h-8 w-56 rounded-lg bg-card/60 border-border/40 text-xs"
              />
            </div>
            <div className="flex items-center rounded-lg border border-border/40 overflow-hidden">
              <button onClick={() => setView('list')} className={cn('px-2.5 py-1.5 text-xs flex items-center gap-1 transition-all', view === 'list' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground')}>
                <List className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => setView('cards')} className={cn('px-2.5 py-1.5 text-xs flex items-center gap-1 transition-all border-l border-border/40', view === 'cards' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground')}>
                <LayoutGrid className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* ── Content ── */}
        {loading ? (
          <div className="space-y-2">
            {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}
          </div>
        ) : filtered.length === 0 ? (
          <Card className="border-border/40 bg-card/60">
            <CardContent className="p-0">
              <EmptyState icon={FolderOpen} title="Ingen sager" description="Ingen sager matcher dine filtre" />
            </CardContent>
          </Card>
        ) : view === 'list' ? (
          /* ═══════ TABLE VIEW ═══════ */
          <Card className="border-border/40 bg-card/60 overflow-hidden rounded-xl">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/40 bg-muted/10">
                      <th className="px-3 py-2.5 text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider w-14">Billede</th>
                      <th className="px-3 py-2.5 text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Adresse</th>
                      <th className="px-3 py-2.5 text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Type</th>
                      <th className="px-3 py-2.5 text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                      <th className="px-3 py-2.5 text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Ejer</th>
                      <th className="px-3 py-2.5 text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Region</th>
                      <th className="px-3 py-2.5 text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Readiness</th>
                      <th className="px-3 py-2.5 text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Kanaler</th>
                      <th className="px-3 py-2.5 text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Kapacitet</th>
                      <th className="px-3 py-2.5 text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Opdateret</th>
                      <th className="px-3 py-2.5 w-8"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(l => {
                      const st = STATUS_MAP[l._stage] || STATUS_MAP.udlejningstjek;
                      const cover = l.hero_image || l.images?.[0];
                      const owner = profiles[l.owner_id];
                      return (
                        <tr
                          key={l.id}
                          onClick={() => navigate(`/admin/sager/${l.id}`)}
                          className="border-b border-border/20 hover:bg-muted/15 transition-colors cursor-pointer"
                        >
                          <td className="px-3 py-2">
                            <div className="w-12 h-9 rounded-md bg-muted/30 overflow-hidden shrink-0">
                              {cover ? (
                                <img src={cover} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Home className="h-3.5 w-3.5 text-muted-foreground/20" />
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-2">
                            <p className="text-xs font-medium text-foreground truncate max-w-[240px]">{l.name}</p>
                            {l.address && <p className="text-[10px] text-muted-foreground truncate max-w-[240px]">{l.address}</p>}
                          </td>
                          <td className="px-3 py-2 text-xs text-muted-foreground capitalize">{l.property_type || 'Villa'}</td>
                          <td className="px-3 py-2">
                            <StatusChip label={st.shortLabel} variant={st.variant} dot size="sm" />
                          </td>
                          <td className="px-3 py-2 text-xs text-muted-foreground truncate max-w-[140px]">{owner?.full_name || '—'}</td>
                          <td className="px-3 py-2 text-xs text-muted-foreground">{l.region || '—'}</td>
                          <td className="px-3 py-2"><ReadinessBar score={l.readiness_score || 0} /></td>
                          <td className="px-3 py-2"><ChannelDots airbnb={l.channel_airbnb_ready || false} booking={l.channel_booking_ready || false} vrbo={l.channel_vrbo_ready || false} /></td>
                          <td className="px-3 py-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1"><Users className="h-3 w-3" />{l.max_guests}</span>
                          </td>
                          <td className="px-3 py-2 text-[11px] text-muted-foreground whitespace-nowrap">
                            {format(new Date(l.updated_at), 'd. MMM yyyy', { locale: da })}
                          </td>
                          <td className="px-3 py-2">
                            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/30" />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        ) : (
          /* ═══════ CARD VIEW ═══════ */
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map(l => {
              const st = STATUS_MAP[l._stage] || STATUS_MAP.udlejningstjek;
              const cover = l.hero_image || l.images?.[0];
              const owner = profiles[l.owner_id];
              return (
                <Card
                  key={l.id}
                  onClick={() => navigate(`/admin/sager/${l.id}`)}
                  className="border-border/40 bg-card/60 hover:bg-card/80 hover:border-border/60 hover:shadow-lg transition-all cursor-pointer overflow-hidden group"
                >
                  <div className="h-36 bg-muted/30 overflow-hidden relative">
                    {cover ? (
                      <img src={cover} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"><Home className="h-8 w-8 text-muted-foreground/20" /></div>
                    )}
                    <div className="absolute top-3 left-3">
                      <StatusChip label={st.label} variant={st.variant} dot />
                    </div>
                    <div className="absolute top-3 right-3">
                      <ChannelDots airbnb={l.channel_airbnb_ready || false} booking={l.channel_booking_ready || false} vrbo={l.channel_vrbo_ready || false} />
                    </div>
                  </div>
                  <CardContent className="p-4 space-y-3">
                    <div>
                      <h3 className="text-sm font-semibold text-foreground truncate">{l.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        {l.region && <span className="text-[11px] text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" />{l.region}</span>}
                        <span className="text-[11px] text-muted-foreground flex items-center gap-1"><Users className="h-3 w-3" />{l.max_guests} gæster</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <ReadinessBar score={l.readiness_score || 0} />
                      <span className="text-[10px] text-muted-foreground/50">{format(new Date(l.updated_at), 'd. MMM', { locale: da })}</span>
                    </div>
                    {owner && (
                      <div className="flex items-center gap-2 pt-2 border-t border-border/20">
                        <div className="w-5 h-5 rounded-md bg-primary/10 flex items-center justify-center text-[9px] font-bold text-primary shrink-0">
                          {(owner.full_name || owner.email)[0].toUpperCase()}
                        </div>
                        <span className="text-[11px] text-muted-foreground truncate">{owner.full_name || owner.email}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}