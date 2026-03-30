import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { 
  CheckCircle2, Circle, Camera, FileText, Key, Globe, 
  Wifi, BedDouble, Star, Image, Video
} from 'lucide-react';

interface ReadinessItem {
  label: string;
  done: boolean;
  icon: React.ElementType;
  weight: number;
}

interface ListingReadinessScoreProps {
  property: any;
  listings: any[];
  className?: string;
}

export function ListingReadinessScore({ property, listings, className }: ListingReadinessScoreProps) {
  const listing = listings?.[0];

  const items: ReadinessItem[] = [
    { label: 'Grundoplysninger udfyldt', done: !!(property?.title && property?.address && property?.region), icon: FileText, weight: 15 },
    { label: 'Beskrivelse skrevet', done: !!(property?.description && property.description.length > 50), icon: FileText, weight: 10 },
    { label: 'Kapacitet og værelser angivet', done: !!(property?.capacity > 0 && property?.bedrooms > 0), icon: BedDouble, weight: 10 },
    { label: 'Faciliteter tilføjet', done: !!(property?.amenities && property.amenities.length >= 3), icon: Wifi, weight: 10 },
    { label: 'Husregler formuleret', done: !!(property?.house_rules && property.house_rules.length > 20), icon: Star, weight: 5 },
    { label: 'Billeder uploadet (min. 5)', done: !!(property?.images && property.images.length >= 5), icon: Image, weight: 15 },
    { label: 'Listing oprettet', done: !!listing, icon: Globe, weight: 10 },
    { label: 'Priser sat', done: !!(listing?.base_price_per_night > 0), icon: Star, weight: 10 },
    { label: 'Hovedbillede valgt', done: !!(listing?.hero_image), icon: Camera, weight: 5 },
    { label: 'Nøgleboks-info delt', done: false, icon: Key, weight: 5 },
    { label: 'Videoguide tilføjet', done: false, icon: Video, weight: 5 },
  ];

  const totalWeight = items.reduce((s, i) => s + i.weight, 0);
  const doneWeight = items.filter(i => i.done).reduce((s, i) => s + i.weight, 0);
  const score = Math.round((doneWeight / totalWeight) * 100);

  const getScoreColor = () => {
    if (score >= 80) return 'text-emerald-400';
    if (score >= 50) return 'text-amber-400';
    return 'text-accent';
  };

  const getScoreLabel = () => {
    if (score >= 90) return 'Næsten klar til udlejning';
    if (score >= 70) return 'Godt på vej';
    if (score >= 40) return 'Fint startet';
    return 'Lad os komme i gang';
  };

  return (
    <Card className={cn('border-border/50', className)}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-sm font-semibold text-foreground">Listing Readiness</div>
            <div className="text-xs text-muted-foreground mt-0.5">{getScoreLabel()}</div>
          </div>
          <div className="relative w-16 h-16">
            <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
              <circle cx="32" cy="32" r="28" fill="none" stroke="hsl(var(--muted))" strokeWidth="4" />
              <circle 
                cx="32" cy="32" r="28" fill="none" 
                stroke="currentColor" 
                strokeWidth="4" 
                strokeDasharray={`${(score / 100) * 175.9} 175.9`}
                strokeLinecap="round"
                className={getScoreColor()}
              />
            </svg>
            <div className={cn('absolute inset-0 flex items-center justify-center font-display text-lg font-bold', getScoreColor())}>
              {score}
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          {items.map((item, i) => (
            <div key={i} className={cn(
              'flex items-center gap-2.5 py-1.5 text-sm',
              item.done ? 'opacity-50' : ''
            )}>
              {item.done ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <Circle className="w-4 h-4 text-muted-foreground/30 shrink-0" />
              )}
              <span className={cn(
                'text-xs',
                item.done ? 'text-muted-foreground line-through' : 'text-foreground'
              )}>
                {item.label}
              </span>
              {!item.done && i === items.findIndex(x => !x.done) && (
                <Badge variant="outline" className="ml-auto text-[9px] bg-accent/10 text-accent border-accent/20 px-1.5 py-0">
                  Næste
                </Badge>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
