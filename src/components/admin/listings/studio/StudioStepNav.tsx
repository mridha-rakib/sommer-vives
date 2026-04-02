import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';
import { type LucideIcon } from 'lucide-react';

export interface StudioStep {
  id: string;
  label: string;
  icon: LucideIcon;
  description?: string;
}

interface StudioStepNavProps {
  steps: StudioStep[];
  currentStep: string;
  onStepChange: (step: string) => void;
  completedSteps?: string[];
}

export function StudioStepNav({ steps, currentStep, onStepChange, completedSteps = [] }: StudioStepNavProps) {
  const currentIndex = steps.findIndex(s => s.id === currentStep);

  return (
    <div className="space-y-1">
      {steps.map((step, index) => {
        const isActive = step.id === currentStep;
        const isCompleted = completedSteps.includes(step.id);
        const isPast = index < currentIndex;
        const Icon = step.icon;

        return (
          <button
            key={step.id}
            onClick={() => onStepChange(step.id)}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-200 group',
              isActive
                ? 'bg-primary/10 border border-primary/20'
                : 'hover:bg-muted/30 border border-transparent'
            )}
          >
            {/* Step indicator */}
            <div className={cn(
              'flex h-7 w-7 items-center justify-center rounded-lg shrink-0 transition-all text-xs font-bold',
              isActive ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/30' :
              isCompleted ? 'bg-primary/20 text-primary' :
              'bg-muted/50 text-muted-foreground'
            )}>
              {isCompleted ? <Check className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
            </div>

            {/* Label */}
            <div className="flex-1 min-w-0">
              <p className={cn(
                'text-[12px] font-medium truncate transition-colors',
                isActive ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground'
              )}>
                {step.label}
              </p>
            </div>

            {/* Completion badge */}
            {isCompleted && !isActive && (
              <div className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
            )}
          </button>
        );
      })}
    </div>
  );
}
