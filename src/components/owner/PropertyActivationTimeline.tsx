import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { 
  UserPlus, FileSignature, Building2, KeyRound, Camera, Globe, 
  CheckCircle2, Rocket
} from 'lucide-react';

interface TimelineStep {
  key: string;
  label: string;
  icon: React.ElementType;
  timestamp?: string | null;
}

interface PropertyActivationTimelineProps {
  onboarding: any;
  className?: string;
}

const STEPS: TimelineStep[] = [
  { key: 'lead_created_at', label: 'Interesse registreret', icon: UserPlus },
  { key: 'signup_started_at', label: 'Profil oprettet', icon: UserPlus },
  { key: 'onboarding_completed_at', label: 'Onboarding afsluttet', icon: Building2 },
  { key: 'agreement_signed_at', label: 'Aftale underskrevet', icon: FileSignature },
  { key: 'property_visit_scheduled_at', label: 'Besøg aftalt', icon: Building2 },
  { key: 'keybox_installed_at', label: 'Nøgleboks installeret', icon: KeyRound },
  { key: 'listing_approved_at', label: 'Listing godkendt', icon: Camera },
  { key: 'listing_published_at', label: 'Listing publiceret', icon: Globe },
];

export function PropertyActivationTimeline({ onboarding, className }: PropertyActivationTimelineProps) {
  if (!onboarding) return null;

  const completedIndex = STEPS.findIndex(s => !onboarding[s.key]);
  const currentStep = completedIndex === -1 ? STEPS.length : completedIndex;

  const formatDate = (ts: string | null) => {
    if (!ts) return null;
    return new Date(ts).toLocaleDateString('da-DK', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <Card className={cn('border-border/50', className)}>
      <CardContent className="p-5">
        <div className="flex items-center gap-2 mb-5">
          <Rocket className="w-4 h-4 text-accent" />
          <span className="text-sm font-semibold text-foreground">Aktiveringsforløb</span>
          <span className="ml-auto text-xs text-muted-foreground">
            {currentStep}/{STEPS.length} trin
          </span>
        </div>

        <div className="relative">
          {STEPS.map((step, i) => {
            const isDone = !!onboarding[step.key];
            const isCurrent = i === currentStep;
            const isFuture = i > currentStep;

            return (
              <div key={step.key} className="flex items-start gap-3 relative">
                {/* Connector line */}
                {i < STEPS.length - 1 && (
                  <div className={cn(
                    'absolute left-[15px] top-[30px] w-0.5 h-[calc(100%-8px)]',
                    isDone ? 'bg-emerald-400/40' : 'bg-border'
                  )} />
                )}

                {/* Node */}
                <div className={cn(
                  'w-[30px] h-[30px] rounded-full flex items-center justify-center shrink-0 z-10 transition-all',
                  isDone ? 'bg-emerald-400/20' : isCurrent ? 'bg-accent/20 ring-2 ring-accent/30' : 'bg-muted'
                )}>
                  {isDone ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <step.icon className={cn(
                      'w-3.5 h-3.5',
                      isCurrent ? 'text-accent' : 'text-muted-foreground/40'
                    )} />
                  )}
                </div>

                {/* Content */}
                <div className={cn('pb-5 min-w-0', isFuture && 'opacity-40')}>
                  <div className={cn(
                    'text-sm font-medium',
                    isDone ? 'text-foreground' : isCurrent ? 'text-accent' : 'text-muted-foreground'
                  )}>
                    {step.label}
                  </div>
                  {isDone && onboarding[step.key] && (
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      {formatDate(onboarding[step.key])}
                    </div>
                  )}
                  {isCurrent && (
                    <div className="text-[11px] text-accent mt-0.5 font-medium">
                      I gang nu
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
