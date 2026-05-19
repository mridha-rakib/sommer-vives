import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Users, ArrowRight } from 'lucide-react';

interface PipelineStage {
  key: string;
  label: string;
  count: number;
  color: string;
}

interface OnboardingPipelineProps {
  onboardingCases: Array<{ status?: string | null }>;
  className?: string;
}

export function OnboardingPipeline({ onboardingCases, className }: OnboardingPipelineProps) {
  const stages: PipelineStage[] = [
    { key: 'lead', label: 'Lead', count: 0, color: 'bg-slate-400' },
    { key: 'account_created', label: 'Oprettet', count: 0, color: 'bg-blue-400' },
    { key: 'owner_info_complete', label: 'Info', count: 0, color: 'bg-indigo-400' },
    { key: 'agreement_ready', label: 'Aftale klar', count: 0, color: 'bg-violet-400' },
    { key: 'agreement_signed', label: 'Signeret', count: 0, color: 'bg-purple-400' },
    { key: 'setup_in_progress', label: 'Setup', count: 0, color: 'bg-amber-400' },
    { key: 'listing_review', label: 'Review', count: 0, color: 'bg-orange-400' },
    { key: 'live', label: 'Live', count: 0, color: 'bg-emerald-400' },
  ];

  onboardingCases.forEach(c => {
    const stage = stages.find(s => s.key === c.status);
    if (stage) stage.count++;
  });

  const totalCases = onboardingCases.length;
  const maxCount = Math.max(...stages.map(s => s.count), 1);

  return (
    <Card className={cn('border-border/50', className)}>
      <CardContent className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-4 h-4 text-accent" />
          <span className="text-sm font-semibold text-foreground">Onboarding Pipeline</span>
          <Badge variant="outline" className="ml-auto text-[10px]">
            {totalCases} ejere
          </Badge>
        </div>

        {/* Visual pipeline */}
        <div className="flex items-end gap-1 h-20 mb-3">
          {stages.map((stage, i) => (
            <div key={stage.key} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-[9px] font-bold text-foreground">{stage.count}</span>
              <div
                className={cn('w-full rounded-t-sm transition-all', stage.color)}
                style={{ height: `${Math.max((stage.count / maxCount) * 100, 4)}%`, minHeight: 3 }}
              />
            </div>
          ))}
        </div>

        {/* Labels */}
        <div className="flex gap-1">
          {stages.map((stage) => (
            <div key={stage.key} className="flex-1 text-center">
              <span className="text-[8px] text-muted-foreground leading-tight block">{stage.label}</span>
            </div>
          ))}
        </div>

        {/* Conversion funnel */}
        {totalCases > 0 && (
          <div className="mt-4 flex items-center justify-center gap-2 text-[10px] text-muted-foreground">
            <span>Lead → Live konvertering:</span>
            <span className="font-semibold text-accent">
              {stages.find(s => s.key === 'live')!.count > 0
                ? Math.round((stages.find(s => s.key === 'live')!.count / totalCases) * 100)
                : 0}%
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
