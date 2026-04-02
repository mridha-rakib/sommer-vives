import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import {
  Search, FolderOpen, MapPin, Home, Users, ChevronRight,
  LayoutGrid, List, CheckCircle2, Clock, Radio
} from 'lucide-react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { AdminPageHeader } from '@/components/admin/ui/AdminPageHeader';
import { KPICard } from '@/components/admin/ui/KPICard';
import { StatusChip } from '@/components/admin/ui/StatusChip';
import { EmptyState } from '@/components/admin/ui/EmptyState';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

type SVariant = 'info' | 'warning' | 'success' | 'muted' | 'danger';

const STATUS_MAP: Record<string, { label: string; variant: SVariant }> = {
  draft: { label: 'Kladde', variant: 'muted' },
  preparing: { label: 'Klargøring', variant: 'warning' },
  review: { label: 'Til gennemgang', variant: 'info' },
  ready: { label: 'Klar', variant: 'success' },
  live: { label: 'Live', variant: 'success' },
  paused: { label: 'Pauset', variant: 'danger' },
};

function ReadinessBar({ score }: { score: number }) {
  const color = score >= 80 ? 'bg-emerald-500' : score >= 50 ? 'bg-amber-400' : 'bg-red-400';
  return (
    <div className="flex items-center gap-2">
      <div className="w-20 h-1.5 bg-muted/40 rounded-full overflow-hidden">
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
  const [statusFilter, setStatusFilter] = useState('all');
  const [view, setView] = useState<'cards' | 'list'>('cards');

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

  const filtered = listings.filter(l => {
    if (statusFilter !== 'all' && (l.internal_status || 'draft') !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!l.name.toLowerCase().includes(q) && !(l.region || '').toLowerCase().includes(q) && !(l.address || '').toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const liveCount = listings.filter(l => l.internal_status === 'live' || l.is_active).length;
  const prepCount = listings.filter(l => ['preparing', 'review', 'draft'].includes(l.internal_status || 'draft')).length;
  const lowReadiness = listings.filter(l => (l.readiness_score || 0) < 50).length;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <AdminPageHeader title="Sager" subtitle={`${listings.length} ejendomme i systemet`} />

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard title="Sager i alt" value={listings.length} icon={FolderOpen} variant="gold" />
          <KPICard title="Live" value={liveCount} icon={CheckCircle2} variant="success" />
          <KPICard title="Under klargøring" value={prepCount} icon={Clock} variant="warning" />
          <KPICard title="Lav readiness" value={lowReadiness} icon={Radio} variant="danger" subtitle="Under 50%" />
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Søg på navn, region, adresse..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 rounded-xl bg-card/60 border-border/40" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-44 rounded-xl bg-card/60 border-border/40 text-xs">
              <SelectValue placeholder="Alle status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle status</SelectItem>
              {Object.entries(STATUS_MAP).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <div className="flex items-center rounded-xl border border-border/40 overflow-hidden">
            <button onClick={() => setView('cards')} className={cn('px-3 py-1.5 text-xs font-medium flex items-center gap-1.5 transition-all', view === 'cards' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground')}>
              <LayoutGrid className="h-3.5 w-3.5" />Kort
            </button>
            <button onClick={() => setView('list')} className={cn('px-3 py-1.5 text-xs font-medium flex items-center gap-1.5 transition-all border-l border-border/40', view === 'list' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground')}>
              <List className="h-3.5 w-3.5" />Liste
            </button>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-56 rounded-2xl" />)}
          </div>
        ) : filtered.length === 0 ? (
          <Card className="border-border/40 bg-card/60"><CardContent className="p-0"><EmptyState icon={FolderOpen} title="Ingen sager fundet" description="Tilpas filtre eller opret en ny sag" /></CardContent></Card>
        ) : view === 'cards' ? (
          /* ═══════ CARD VIEW ═══════ */
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map(l => {
              const st = STATUS_MAP[l.internal_status || 'draft'] || STATUS_MAP.draft;
              const cover = l.hero_image || l.images?.[0];
              const owner = profiles[l.owner_id];
              return (
                <Card
                  key={l.id}
                  onClick={() => navigate(`/admin/sager/${l.id}`)}
                  className="border-border/40 bg-card/60 hover:bg-card/80 hover:border-border/60 hover:shadow-lg transition-all cursor-pointer overflow-hidden group"
                >
                  {/* Cover image */}
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
        ) : (
          /* ═══════ LIST VIEW ═══════ */
          <Card className="border-border/40 bg-card/60 overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/40">
                      {['', 'Sag', 'Ejer', 'Region', 'Status', 'Readiness', 'Kanaler', 'Opdateret', ''].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(l => {
                      const st = STATUS_MAP[l.internal_status || 'draft'] || STATUS_MAP.draft;
                      const cover = l.hero_image || l.images?.[0];
                      const owner = profiles[l.owner_id];
                      return (
                        <tr key={l.id} onClick={() => navigate(`/admin/sager/${l.id}`)} className="border-b border-border/20 hover:bg-muted/15 transition-colors cursor-pointer">
                          <td className="px-4 py-3">
                            <div className="w-12 h-9 rounded-lg bg-muted/30 overflow-hidden shrink-0">
                              {cover ? <img src={cover} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Home className="h-4 w-4 text-muted-foreground/20" /></div>}
                            </div>
                          </td>
                          <td className="px-4 py-3"><p className="font-medium text-foreground">{l.name}</p></td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">{owner?.full_name || '—'}</td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">{l.region || '—'}</td>
                          <td className="px-4 py-3"><StatusChip label={st.label} variant={st.variant} dot /></td>
                          <td className="px-4 py-3"><ReadinessBar score={l.readiness_score || 0} /></td>
                          <td className="px-4 py-3"><ChannelDots airbnb={l.channel_airbnb_ready || false} booking={l.channel_booking_ready || false} vrbo={l.channel_vrbo_ready || false} /></td>
                          <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{format(new Date(l.updated_at), 'd. MMM', { locale: da })}</td>
                          <td className="px-4 py-3"><ChevronRight className="h-4 w-4 text-muted-foreground/30" /></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}
