import { useState, useEffect, useMemo } from 'react';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import {
  Search, FolderOpen, MapPin, Home, Users, ChevronRight,
  Eye, XCircle, RotateCcw, Handshake, Rocket, Ban, CheckCircle2, Clock,
  MoreHorizontal, Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { StatusChip } from '@/components/admin/ui/StatusChip';
import { EmptyState } from '@/components/admin/ui/EmptyState';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

type SVariant = 'info' | 'warning' | 'success' | 'muted' | 'danger';

const PIPELINE_STAGES = [
  'udlejningstjek',
  'foer_salg',
  'til_leje',
  'retur',
  'tabt_vil_ikke',
  'tabt_konkurrent',
] as const;

type PipelineStage = typeof PIPELINE_STAGES[number];

const STATUS_MAP: Record<string, { label: string; variant: SVariant }> = {
  udlejningstjek:  { label: 'Udlejningstjek',           variant: 'warning' },
  foer_salg:       { label: 'Før salg',                  variant: 'info' },
  til_leje:        { label: 'Til leje',                  variant: 'success' },
  retur:           { label: 'Retur',                     variant: 'muted' },
  tabt_vil_ikke:   { label: 'Tabt kommission',           variant: 'danger' },
  tabt_konkurrent: { label: 'Tabt konkurrent',           variant: 'danger' },
  draft:           { label: 'Kladde',                    variant: 'muted' },
  preparing:       { label: 'Klargøring',                variant: 'warning' },
  review:          { label: 'Gennemgang',                variant: 'info' },
  ready:           { label: 'Klar',                      variant: 'success' },
  live:            { label: 'Til leje',                  variant: 'success' },
  paused:          { label: 'Pauset',                    variant: 'danger' },
};

const TAB_LABELS: Record<PipelineStage, string> = {
  udlejningstjek: 'Udlejningstjek',
  foer_salg: 'Før salg',
  til_leje: 'Til leje',
  retur: 'Retur',
  tabt_vil_ikke: 'Tabt kommission',
  tabt_konkurrent: 'Tabt konkurrent',
};

function mapLegacyStatus(s: string | null): PipelineStage {
  if (!s) return 'udlejningstjek';
  if (PIPELINE_STAGES.includes(s as PipelineStage)) return s as PipelineStage;
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
        <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(score, 100)}%` }} />
      </div>
      <span className="text-[11px] font-semibold text-muted-foreground tabular-nums">{score}%</span>
    </div>
  );
}

function ChannelDots({ airbnb, booking, vrbo }: { airbnb: boolean; booking: boolean; vrbo: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      <span title="Airbnb" className={cn('w-2 h-2 rounded-full', airbnb ? 'bg-emerald-500' : 'bg-muted-foreground/20')} />
      <span title="Booking.com" className={cn('w-2 h-2 rounded-full', booking ? 'bg-emerald-500' : 'bg-muted-foreground/20')} />
      <span title="Vrbo" className={cn('w-2 h-2 rounded-full', vrbo ? 'bg-emerald-500' : 'bg-muted-foreground/20')} />
    </div>
  );
}

export default function AdminSager() {
  const navigate = useNavigate();
  const [listings, setListings] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeStage, setActiveStage] = useState<PipelineStage>('udlejningstjek');
  const [creating, setCreating] = useState(false);

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

  useEffect(() => { load(); }, []);

  const createSag = async () => {
    setCreating(true);
    const name = prompt('Navn på ny sag (adresse eller ejer):');
    if (!name?.trim()) { setCreating(false); return; }
    const slug = `${name.toLowerCase().replace(/[^a-z0-9æøå]+/g, '-').replace(/-+$/, '')}-${Date.now()}`;
    const { data, error } = await supabase.from('listings').insert({
      name: name.trim(),
      slug,
      owner_id: '00000000-0000-0000-0000-000000000000',
      internal_status: 'udlejningstjek',
      is_active: false,
    }).select('id').single();
    setCreating(false);
    if (error) { toast.error('Kunne ikke oprette sag: ' + error.message); return; }
    toast.success('Sag oprettet');
    load();
    if (data) navigate(`/admin/sager/${data.id}`);
  };

  const normalizedListings = useMemo(() =>
    listings.map(l => ({ ...l, _stage: mapLegacyStatus(l.internal_status) })),
    [listings]
  );

  const stageCounts = useMemo(() => {
    const c: Record<string, number> = {};
    PIPELINE_STAGES.forEach(s => { c[s] = 0; });
    normalizedListings.forEach(l => { c[l._stage] = (c[l._stage] || 0) + 1; });
    return c;
  }, [normalizedListings]);

  const filtered = normalizedListings.filter(l => {
    if (l._stage !== activeStage) return false;
    if (search) {
      const q = search.toLowerCase();
      return l.name.toLowerCase().includes(q) || (l.region || '').toLowerCase().includes(q) || (l.address || '').toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <AdminLayout>
      <div className="space-y-0">
        {/* ── Top tab bar ── */}
        <div className="border-b border-border/40 -mx-6 -mt-6 px-6">
          <nav className="flex items-center overflow-x-auto">
            {PIPELINE_STAGES.map(stage => (
              <button
                key={stage}
                onClick={() => setActiveStage(stage)}
                className={cn(
                  'relative px-5 py-3 text-[11px] font-bold uppercase tracking-widest whitespace-nowrap transition-colors',
                  activeStage === stage
                    ? 'text-foreground'
                    : 'text-muted-foreground/60 hover:text-muted-foreground'
                )}
              >
                {TAB_LABELS[stage]}
                {activeStage === stage && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary" />
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* ── Subheader ── */}
        <div className="flex items-center justify-between pt-5 pb-3">
          <p className="text-sm font-medium text-muted-foreground">
            {filtered.length} sager er {TAB_LABELS[activeStage].toLowerCase()}
          </p>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Søg"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-8 h-8 w-48 rounded-lg bg-muted/20 border-border/40 text-xs"
            />
          </div>
        </div>

        {/* ── Table ── */}
        {loading ? (
          <div className="space-y-1">
            {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16">
            <EmptyState icon={FolderOpen} title="Ingen sager" description={`Ingen sager med status "${TAB_LABELS[activeStage]}"`} />
          </div>
        ) : (
          <div className="rounded-xl border border-border/30 overflow-hidden bg-card/40">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/30">
                  <th className="px-3 py-2 text-left text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-wider w-14">Billede</th>
                  <th className="px-3 py-2 text-left text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-wider">Adresse</th>
                  <th className="px-3 py-2 text-left text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-wider">Type</th>
                  <th className="px-3 py-2 text-left text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-wider">Ejer</th>
                  <th className="px-3 py-2 text-left text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-wider">Region</th>
                  <th className="px-3 py-2 text-left text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-wider">Readiness</th>
                  <th className="px-3 py-2 text-left text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-wider">Kanaler</th>
                  <th className="px-3 py-2 text-left text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-wider">Gæster</th>
                  <th className="px-3 py-2 text-left text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-wider">Opdateret</th>
                  <th className="w-8"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(l => {
                  const cover = l.hero_image || l.images?.[0];
                  const owner = profiles[l.owner_id];
                  return (
                    <tr
                      key={l.id}
                      onClick={() => navigate(`/admin/sager/${l.id}`)}
                      className="border-b border-border/15 hover:bg-muted/10 transition-colors cursor-pointer"
                    >
                      <td className="px-3 py-2">
                        <div className="w-11 h-8 rounded bg-muted/30 overflow-hidden">
                          {cover ? (
                            <img src={cover} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center"><Home className="h-3 w-3 text-muted-foreground/20" /></div>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <p className="text-xs font-medium text-foreground truncate max-w-[220px]">{l.name}</p>
                      </td>
                      <td className="px-3 py-2 text-[11px] text-muted-foreground capitalize">{l.property_type || '—'}</td>
                      <td className="px-3 py-2 text-[11px] text-muted-foreground truncate max-w-[130px]">{owner?.full_name || '—'}</td>
                      <td className="px-3 py-2 text-[11px] text-muted-foreground">{l.region || '—'}</td>
                      <td className="px-3 py-2"><ReadinessBar score={l.readiness_score || 0} /></td>
                      <td className="px-3 py-2"><ChannelDots airbnb={l.channel_airbnb_ready || false} booking={l.channel_booking_ready || false} vrbo={l.channel_vrbo_ready || false} /></td>
                      <td className="px-3 py-2 text-[11px] text-muted-foreground">{l.max_guests}</td>
                      <td className="px-3 py-2 text-[10px] text-muted-foreground/60 whitespace-nowrap">
                        {format(new Date(l.updated_at), 'dd-MM-yyyy', { locale: da })}
                      </td>
                      <td className="px-3 py-2" onClick={e => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg">
                              <MoreHorizontal className="h-3.5 w-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuItem onClick={() => navigate(`/admin/sager/${l.id}`)}>Åbn sag</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-400 focus:text-red-400" onClick={async () => {
                              if (!confirm(`Slet sag "${l.name}"?`)) return;
                              const { error } = await supabase.from('listings').delete().eq('id', l.id);
                              if (error) { toast.error('Kunne ikke slette: ' + error.message); return; }
                              toast.success('Sag slettet');
                              setListings(prev => prev.filter(x => x.id !== l.id));
                            }}>
                              <Trash2 className="h-3 w-3 mr-2" />Slet
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}