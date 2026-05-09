import { Home, MapPin, Pencil, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface ListingSummary {
  id: string;
  name: string;
  region: string | null;
  hero_image: string | null;
  images: string[] | null;
  internal_status: string | null;
  is_active: boolean;
  readiness_score: number | null;
  channel_airbnb_ready: boolean | null;
  channel_booking_ready: boolean | null;
  channel_vrbo_ready: boolean | null;
}

interface Props {
  listings: ListingSummary[];
  onEdit: (id: string) => void;
}

const COLUMNS = [
  { key: 'draft', label: 'Kladde', color: 'border-t-slate-400' },
  { key: 'preparing', label: 'Under klargøring', color: 'border-t-amber-400' },
  { key: 'ready_airbnb', label: 'Klar til Airbnb', color: 'border-t-rose-400' },
  { key: 'ready_booking', label: 'Klar til Booking.com', color: 'border-t-blue-400' },
  { key: 'ready_vrbo', label: 'Klar til Vrbo', color: 'border-t-indigo-400' },
  { key: 'live', label: 'Live', color: 'border-t-emerald-500' },
] as const;

function getColumnKey(l: ListingSummary): string {
  if (l.internal_status === 'live' || (l.is_active && l.channel_airbnb_ready && l.channel_booking_ready && l.channel_vrbo_ready)) return 'live';
  if (l.channel_vrbo_ready) return 'ready_vrbo';
  if (l.channel_booking_ready) return 'ready_booking';
  if (l.channel_airbnb_ready) return 'ready_airbnb';
  if (l.internal_status === 'preparing' || l.internal_status === 'review') return 'preparing';
  return 'draft';
}

function getNextStep(l: ListingSummary): string {
  const score = l.readiness_score || 0;
  if (score < 30) return 'Tilføj billeder og beskrivelse';
  if (score < 60) return 'Udfyld pris og faciliteter';
  if (!l.channel_airbnb_ready) return 'Forbered Airbnb-kanal';
  if (!l.channel_booking_ready) return 'Forbered Booking.com';
  if (!l.channel_vrbo_ready) return 'Forbered Vrbo-kanal';
  if (l.internal_status !== 'live') return 'Sæt listing live';
  return 'Alt klar';
}

function ReadinessBadge({ score }: { score: number }) {
  const color = score >= 80 ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
    : score >= 50 ? 'bg-amber-50 text-amber-700 border-amber-200'
    : 'bg-red-50 text-red-600 border-red-200';
  return (
    <Badge variant="outline" className={`text-[10px] font-medium ${color}`}>
      {score}%
    </Badge>
  );
}

export function ListingsPipelineBoard({ listings, onEdit }: Props) {
  const grouped = COLUMNS.map(col => ({
    ...col,
    items: listings.filter(l => getColumnKey(l) === col.key),
  }));

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 -mx-2 px-2">
      {grouped.map(col => (
        <div key={col.key} className="flex-shrink-0 w-[260px]">
          {/* Column header */}
          <div className={`bg-card border border-border border-t-[3px] ${col.color} rounded-xl`}>
            <div className="px-3 py-2.5 flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground">{col.label}</span>
              <Badge variant="secondary" className="text-[10px] h-5 min-w-[20px] justify-center">
                {col.items.length}
              </Badge>
            </div>

            {/* Cards */}
            <div className="px-2 pb-2 space-y-2 max-h-[calc(100vh-320px)] overflow-y-auto">
              {col.items.length === 0 && (
                <div className="text-center py-8 text-muted-foreground/40 text-xs">
                  Ingen listings
                </div>
              )}
              {col.items.map(listing => {
                const coverImg = listing.hero_image || listing.images?.[0];
                const nextStep = getNextStep(listing);
                return (
                  <button
                    key={listing.id}
                    onClick={() => onEdit(listing.id)}
                    className="w-full bg-background border border-border rounded-lg overflow-hidden text-left hover:border-primary/40 hover:shadow-sm transition-all group"
                  >
                    {/* Cover */}
                    <div className="h-24 bg-muted relative overflow-hidden">
                      {coverImg ? (
                        <img src={coverImg} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Home className="h-6 w-6 text-muted-foreground/20" />
                        </div>
                      )}
                      <div className="absolute top-1.5 right-1.5">
                        <ReadinessBadge score={listing.readiness_score || 0} />
                      </div>
                    </div>

                    {/* Info */}
                    <div className="p-2.5 space-y-1.5">
                      <div className="flex items-start justify-between gap-1">
                        <h4 className="text-xs font-semibold text-foreground leading-tight line-clamp-1">{listing.name}</h4>
                        <Pencil className="h-3 w-3 text-muted-foreground flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity mt-0.5" />
                      </div>

                      {listing.region && (
                        <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-2.5 w-2.5" /> {listing.region}
                        </p>
                      )}

                      {/* Next step */}
                      <div className="flex items-center gap-1 pt-1 border-t border-border/50">
                        <ArrowRight className="h-2.5 w-2.5 text-primary flex-shrink-0" />
                        <span className="text-[10px] text-muted-foreground leading-tight line-clamp-1">
                          {nextStep}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
