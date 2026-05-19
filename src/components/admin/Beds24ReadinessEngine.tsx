import { useState } from 'react';
import { CheckCircle2, AlertCircle, Camera, FileText, DollarSign, Users, Bed, Bath, Tag, Clock, ArrowRight, Sparkles } from 'lucide-react';
import { StatusChip, type StatusVariant } from '@/components/admin/ui/StatusChip';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CheckItem {
  id: string;
  category: string;
  label: string;
  description: string;
  passed: boolean;
  weight: number;
  icon: React.ElementType;
  tab?: string;
}

interface Beds24ReadinessListing {
  name?: string | null;
  description?: string | null;
  long_description?: string | null;
  images?: string[] | null;
  hero_image?: string | null;
  base_price_per_night?: number | null;
  cleaning_fee?: number | null;
  max_guests?: number | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  amenities?: string[] | null;
  check_in_time?: string | null;
  check_out_time?: string | null;
  checkin_info?: string | null;
  checkout_info?: string | null;
}

function runChecks(listing: Beds24ReadinessListing): CheckItem[] {
  const items: CheckItem[] = [];

  // Descriptions
  items.push({ id: 'name', category: 'Indhold', label: 'Navn', description: listing.name ? `"${listing.name}"` : 'Internt navn mangler', passed: !!listing.name, weight: 10, icon: FileText, tab: 'listing' });
  items.push({ id: 'desc', category: 'Indhold', label: 'Kort beskrivelse', description: listing.description ? `${listing.description.length} tegn` : 'Påkrævet af Beds24', passed: !!listing.description, weight: 10, icon: FileText, tab: 'listing' });
  items.push({ id: 'longdesc', category: 'Indhold', label: 'Lang beskrivelse', description: listing.long_description ? `${listing.long_description.length} tegn` : 'Anbefalet til bedre synlighed', passed: !!listing.long_description, weight: 5, icon: FileText, tab: 'listing' });

  // Images
  const imgCount = listing.images?.length || 0;
  items.push({ id: 'images_min', category: 'Billeder', label: 'Minimum 5 billeder', description: `${imgCount} billeder uploadet`, passed: imgCount >= 5, weight: 15, icon: Camera, tab: 'listing' });
  items.push({ id: 'images_rec', category: 'Billeder', label: '15+ billeder (anbefalet)', description: `${imgCount}/15 billeder`, passed: imgCount >= 15, weight: 5, icon: Camera, tab: 'listing' });
  items.push({ id: 'hero', category: 'Billeder', label: 'Hero-billede', description: listing.hero_image ? 'Sat' : 'Hovedbillede mangler', passed: !!listing.hero_image, weight: 5, icon: Camera, tab: 'listing' });

  // Pricing
  items.push({ id: 'baseprice', category: 'Priser', label: 'Basispris pr. nat', description: listing.base_price_per_night ? `${(listing.base_price_per_night / 100).toLocaleString('da-DK')} kr` : 'Sæt en pris', passed: !!listing.base_price_per_night && listing.base_price_per_night > 0, weight: 15, icon: DollarSign, tab: 'listing' });
  items.push({ id: 'cleaning', category: 'Priser', label: 'Rengøringspris', description: listing.cleaning_fee ? `${(listing.cleaning_fee / 100).toLocaleString('da-DK')} kr` : 'Anbefalet at sætte', passed: !!listing.cleaning_fee && listing.cleaning_fee > 0, weight: 3, icon: DollarSign, tab: 'listing' });

  // Capacity / occupancy
  items.push({ id: 'maxguests', category: 'Kapacitet', label: 'Max gæster', description: listing.max_guests ? `${listing.max_guests} gæster` : 'Påkrævet', passed: !!listing.max_guests && listing.max_guests > 0, weight: 10, icon: Users, tab: 'listing' });
  items.push({ id: 'bedrooms', category: 'Kapacitet', label: 'Soveværelser', description: listing.bedrooms != null ? `${listing.bedrooms}` : 'Mangler', passed: listing.bedrooms != null && listing.bedrooms > 0, weight: 5, icon: Bed, tab: 'listing' });
  items.push({ id: 'bathrooms', category: 'Kapacitet', label: 'Badeværelser', description: listing.bathrooms != null ? `${listing.bathrooms}` : 'Mangler', passed: listing.bathrooms != null && listing.bathrooms > 0, weight: 5, icon: Bath, tab: 'listing' });

  // Amenities
  const amenCount = listing.amenities?.length || 0;
  items.push({ id: 'amenities', category: 'Faciliteter', label: 'Faciliteter (min. 5)', description: `${amenCount} valgt`, passed: amenCount >= 5, weight: 7, icon: Tag, tab: 'listing' });

  // Check-in / check-out
  items.push({ id: 'checkin', category: 'Praktisk', label: 'Check-in tidspunkt', description: listing.check_in_time || listing.checkin_info ? (listing.check_in_time || 'Info tilgængelig') : 'Mangler', passed: !!(listing.check_in_time || listing.checkin_info), weight: 3, icon: Clock, tab: 'listing' });
  items.push({ id: 'checkout', category: 'Praktisk', label: 'Check-out tidspunkt', description: listing.check_out_time || listing.checkout_info ? (listing.check_out_time || 'Info tilgængelig') : 'Mangler', passed: !!(listing.check_out_time || listing.checkout_info), weight: 2, icon: Clock, tab: 'listing' });

  return items;
}

function calcScore(items: CheckItem[]): number {
  const totalWeight = items.reduce((s, i) => s + i.weight, 0);
  const earned = items.filter(i => i.passed).reduce((s, i) => s + i.weight, 0);
  return totalWeight > 0 ? Math.round((earned / totalWeight) * 100) : 0;
}

interface Props {
  listing: Beds24ReadinessListing;
  onNavigateTab?: (tab: string) => void;
  onStatusReady?: () => void;
}

export function Beds24ReadinessEngine({ listing, onNavigateTab, onStatusReady }: Props) {
  const [expanded, setExpanded] = useState(false);
  const items = runChecks(listing);
  const score = calcScore(items);
  const passed = items.filter(i => i.passed).length;
  const failed = items.filter(i => !i.passed);
  const isReady = failed.filter(i => i.weight >= 10).length === 0; // no critical items missing

  const categories = [...new Set(items.map(i => i.category))];

  const summaryVariant: StatusVariant = score >= 90 ? 'success' : score >= 60 ? 'warning' : 'danger';
  const summaryLabel = score >= 90 ? 'Klar til Beds24' : score >= 60 ? 'Næsten klar' : 'Mangler data';

  const nextAction = failed.sort((a, b) => b.weight - a.weight)[0];

  return (
    <div className="rounded-xl border border-border/40 bg-card/60 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3 border-b border-border/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.15em]">Beds24 Klargøring</p>
        </div>
        <StatusChip label={summaryLabel} variant={summaryVariant} dot size="md" />
      </div>

      {/* Score bar */}
      <div className="px-5 py-4 border-b border-border/20">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-muted-foreground">{passed}/{items.length} tjek bestået</span>
          <span className={cn('text-sm font-bold', score >= 90 ? 'text-emerald-400' : score >= 60 ? 'text-amber-400' : 'text-red-400')}>{score}%</span>
        </div>
        <div className="w-full h-2 bg-muted/30 rounded-full overflow-hidden">
          <div
            className={cn('h-full rounded-full transition-all duration-500', score >= 90 ? 'bg-emerald-500' : score >= 60 ? 'bg-amber-500' : 'bg-red-500')}
            style={{ width: `${score}%` }}
          />
        </div>
      </div>

      {/* Next best action */}
      {nextAction && (
        <div className="px-5 py-3 border-b border-border/20 bg-primary/5">
          <p className="text-[10px] font-semibold text-primary uppercase tracking-wide mb-1">Næste bedste handling</p>
          <button
            onClick={() => nextAction.tab && onNavigateTab?.(nextAction.tab)}
            className="flex items-center gap-2 text-xs text-foreground hover:text-primary transition-colors group"
          >
            <nextAction.icon className="h-3.5 w-3.5 text-primary" />
            <span className="font-medium">{nextAction.label}</span>
            <span className="text-muted-foreground">— {nextAction.description}</span>
            <ArrowRight className="h-3 w-3 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        </div>
      )}

      {/* Toggle details */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-5 py-2.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors text-left font-medium"
      >
        {expanded ? '▾ Skjul detaljer' : `▸ Vis alle ${items.length} tjek (${failed.length} mangler)`}
      </button>

      {/* Detailed checklist */}
      {expanded && (
        <div className="border-t border-border/20">
          {categories.map(cat => {
            const catItems = items.filter(i => i.category === cat);
            return (
              <div key={cat}>
                <div className="px-5 py-2 bg-muted/10 border-b border-border/10">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{cat}</p>
                </div>
                {catItems.map(item => (
                  <div
                    key={item.id}
                    className={cn(
                      'flex items-center gap-3 px-5 py-2 border-b border-border/10 last:border-b-0',
                      !item.passed && item.weight >= 10 && 'bg-red-500/[0.03]'
                    )}
                  >
                    {item.passed
                      ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                      : <AlertCircle className={cn('h-3.5 w-3.5 shrink-0', item.weight >= 10 ? 'text-red-400' : 'text-amber-400')} />
                    }
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-medium text-foreground">{item.label}</span>
                      {item.weight >= 10 && !item.passed && <span className="text-red-400 text-[10px] ml-1">*påkrævet</span>}
                    </div>
                    <span className="text-[11px] text-muted-foreground truncate max-w-[160px]">{item.description}</span>
                    {!item.passed && item.tab && (
                      <button
                        onClick={() => onNavigateTab?.(item.tab!)}
                        className="text-[10px] text-primary hover:underline shrink-0 ml-1"
                      >
                        Ret →
                      </button>
                    )}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}

      {/* Mark ready button */}
      {isReady && onStatusReady && (
        <div className="px-5 py-3 border-t border-border/20 bg-emerald-500/5">
          <Button size="sm" className="rounded-xl text-xs gap-1.5 w-full" onClick={onStatusReady}>
            <CheckCircle2 className="h-3.5 w-3.5" />
            Markér som klar til Beds24
          </Button>
        </div>
      )}
    </div>
  );
}
