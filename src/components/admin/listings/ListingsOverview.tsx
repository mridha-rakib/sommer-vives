import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Plus, Search, Pencil, Home, MapPin, Users, Clock, Wifi, Globe, AlertCircle, LayoutList, Columns3 } from 'lucide-react';
import { ListingsPipelineBoard } from './ListingsPipelineBoard';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';

interface ListingSummary {
  id: string;
  slug: string;
  name: string;
  address: string | null;
  region: string | null;
  hero_image: string | null;
  images: string[] | null;
  is_active: boolean;
  max_guests: number;
  bedrooms: number | null;
  updated_at: string;
  internal_status: string | null;
  readiness_score: number | null;
  channel_airbnb_ready: boolean | null;
  channel_booking_ready: boolean | null;
  channel_vrbo_ready: boolean | null;
}

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  draft: { label: 'Kladde', className: 'bg-slate-100 text-slate-600 border-slate-200' },
  preparing: { label: 'Under klargøring', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  review: { label: 'Til gennemgang', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  ready: { label: 'Klar', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  live: { label: 'Live', className: 'bg-primary/10 text-primary border-primary/20' },
  paused: { label: 'Pauset', className: 'bg-orange-50 text-orange-600 border-orange-200' },
};

function ReadinessBar({ score }: { score: number }) {
  const color = score >= 80 ? 'bg-emerald-500' : score >= 50 ? 'bg-amber-400' : 'bg-red-400';
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${Math.min(score, 100)}%` }} />
      </div>
      <span className="text-[11px] font-medium text-muted-foreground">{score}%</span>
    </div>
  );
}

function ChannelDots({ airbnb, booking, vrbo }: { airbnb: boolean; booking: boolean; vrbo: boolean }) {
  const Dot = ({ active, label }: { active: boolean; label: string }) => (
    <span title={label} className={`w-2 h-2 rounded-full ${active ? 'bg-emerald-500' : 'bg-muted-foreground/20'}`} />
  );
  return (
    <div className="flex items-center gap-1.5">
      <Dot active={airbnb} label="Airbnb" />
      <Dot active={booking} label="Booking.com" />
      <Dot active={vrbo} label="Vrbo" />
    </div>
  );
}

interface Props {
  onEdit: (id: string) => void;
  onCreate: () => void;
}

export function ListingsOverview({ onEdit, onCreate }: Props) {
  const [listings, setListings] = useState<ListingSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('listings')
        .select('id, slug, name, address, region, hero_image, images, is_active, max_guests, bedrooms, updated_at, internal_status, readiness_score, channel_airbnb_ready, channel_booking_ready, channel_vrbo_ready')
        .order('sort_order');
      setListings((data as any[]) || []);
      setLoading(false);
    };
    load();
  }, []);

  const filtered = search.trim()
    ? listings.filter(l =>
        l.name.toLowerCase().includes(search.toLowerCase()) ||
        (l.region || '').toLowerCase().includes(search.toLowerCase()) ||
        (l.address || '').toLowerCase().includes(search.toLowerCase())
      )
    : listings;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-muted-foreground gap-2">
        <Loader2 className="h-5 w-5 animate-spin" /> Henter listings...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Listings</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{listings.length} sommerhuse registreret</p>
        </div>
        <Button onClick={onCreate} className="gap-2">
          <Plus className="h-4 w-4" /> Opret ny listing
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Søg i listings..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total', value: listings.length, color: 'text-foreground' },
          { label: 'Live', value: listings.filter(l => l.internal_status === 'live' || l.is_active).length, color: 'text-emerald-600' },
          { label: 'Kladde', value: listings.filter(l => l.internal_status === 'draft' || (!l.is_active && !l.internal_status)).length, color: 'text-slate-500' },
          { label: 'Lav readiness', value: listings.filter(l => (l.readiness_score || 0) < 50).length, color: 'text-amber-600' },
        ].map(s => (
          <div key={s.label} className="bg-card border border-border rounded-xl p-4 text-center">
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Listings table */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Home className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p>Ingen listings fundet</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground w-12" />
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Listing</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground hidden md:table-cell">Region</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground hidden lg:table-cell">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground hidden lg:table-cell">Readiness</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground hidden xl:table-cell">Kanaler</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground hidden xl:table-cell">Opdateret</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground" />
                </tr>
              </thead>
              <tbody>
                {filtered.map(listing => {
                  const status = STATUS_MAP[listing.internal_status || 'draft'] || STATUS_MAP.draft;
                  const coverImg = listing.hero_image || listing.images?.[0];
                  return (
                    <tr
                      key={listing.id}
                      className="border-b border-border/50 hover:bg-muted/20 transition-colors cursor-pointer"
                      onClick={() => onEdit(listing.id)}
                    >
                      <td className="px-4 py-3">
                        <div className="w-12 h-9 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                          {coverImg ? (
                            <img src={coverImg} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Home className="h-4 w-4 text-muted-foreground/30" />
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-foreground">{listing.name}</div>
                        {listing.address && (
                          <div className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                            <MapPin className="h-3 w-3" /> {listing.address}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                        {listing.region || '—'}
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <Badge variant="outline" className={`text-[10px] ${status.className}`}>
                          {status.label}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <ReadinessBar score={listing.readiness_score || 0} />
                      </td>
                      <td className="px-4 py-3 hidden xl:table-cell">
                        <ChannelDots
                          airbnb={listing.channel_airbnb_ready || false}
                          booking={listing.channel_booking_ready || false}
                          vrbo={listing.channel_vrbo_ready || false}
                        />
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground hidden xl:table-cell">
                        {format(new Date(listing.updated_at), 'd. MMM', { locale: da })}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
