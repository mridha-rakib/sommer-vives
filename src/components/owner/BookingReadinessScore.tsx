import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  CheckCircle2, Circle, Calendar, CreditCard, Image, FileText,
  Key, Wifi, Shield, Star
} from 'lucide-react';

interface BookingReadinessScoreProps {
  property: any;
  listings: any[];
  agreement: any;
  onboarding: any;
  className?: string;
}

export function BookingReadinessScore({ property, listings, agreement, onboarding, className }: BookingReadinessScoreProps) {
  const listing = listings?.[0];

  const checks = [
    { label: 'Aftale underskrevet', done: agreement?.status === 'signed', icon: Shield, weight: 20 },
    { label: 'Listing oprettet og aktiv', done: !!listing?.is_active, icon: Star, weight: 15 },
    { label: 'Priser konfigureret', done: !!(listing?.base_price_per_night > 0), icon: CreditCard, weight: 15 },
    { label: 'Billeder uploadet (min. 5)', done: !!(property?.images?.length >= 5), icon: Image, weight: 15 },
    { label: 'Kalender åbnet', done: property?.status === 'published', icon: Calendar, weight: 10 },
    { label: 'Nøgleboks installeret', done: !!onboarding?.keybox_installed_at, icon: Key, weight: 10 },
    { label: 'WiFi-info delt', done: false, icon: Wifi, weight: 5 },
    { label: 'Husregler formuleret', done: !!(property?.house_rules?.length > 20), icon: FileText, weight: 5 },
    { label: 'Boligbeskrivelse skrevet', done: !!(property?.description?.length > 50), icon: FileText, weight: 5 },
  ];

  const totalWeight = checks.reduce((s, c) => s + c.weight, 0);
  const doneWeight = checks.filter(c => c.done).reduce((s, c) => s + c.weight, 0);
  const score = Math.round((doneWeight / totalWeight) * 100);

  const isReady = score >= 80;
  const blockers = checks.filter(c => !c.done && c.weight >= 10);

  return (
    <Card className={cn('border-border/50', className)}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-sm font-semibold text-foreground">Booking-klar?</div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {isReady ? 'Din bolig kan modtage gæster' : `${blockers.length} blokerende punkt${blockers.length !== 1 ? 'er' : ''}`}
            </div>
          </div>
          <div className="relative w-14 h-14">
            <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
              <circle cx="28" cy="28" r="24" fill="none" stroke="hsl(var(--muted))" strokeWidth="4" />
              <circle
                cx="28" cy="28" r="24" fill="none"
                stroke="currentColor"
                strokeWidth="4"
                strokeDasharray={`${(score / 100) * 150.8} 150.8`}
                strokeLinecap="round"
                className={score >= 80 ? 'text-emerald-400' : score >= 50 ? 'text-amber-400' : 'text-accent'}
              />
            </svg>
            <div className={cn(
              'absolute inset-0 flex items-center justify-center font-display text-base font-bold',
              score >= 80 ? 'text-emerald-400' : score >= 50 ? 'text-amber-400' : 'text-accent'
            )}>
              {score}
            </div>
          </div>
        </div>

        {/* Status badge */}
        <div className="mb-3">
          {isReady ? (
            <Badge className="bg-emerald-400/15 text-emerald-400 border-emerald-400/20 text-[10px]">
              ✓ Klar til bookinger
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-amber-400/10 text-amber-400 border-amber-400/20 text-[10px]">
              Mangler {checks.filter(c => !c.done).length} trin
            </Badge>
          )}
        </div>

        {/* Blocking items only */}
        <div className="space-y-1">
          {checks.filter(c => !c.done).slice(0, 4).map((check, i) => (
            <div key={i} className="flex items-center gap-2 py-1">
              <Circle className="w-3.5 h-3.5 text-muted-foreground/30 shrink-0" />
              <span className="text-xs text-foreground">{check.label}</span>
              {check.weight >= 15 && (
                <Badge variant="outline" className="ml-auto text-[8px] px-1 py-0 bg-accent/10 text-accent border-accent/20">
                  Vigtigt
                </Badge>
              )}
            </div>
          ))}
          {checks.filter(c => c.done).length > 0 && (
            <div className="flex items-center gap-2 py-1 opacity-40">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="text-xs text-muted-foreground">
                {checks.filter(c => c.done).length} trin gennemført
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
