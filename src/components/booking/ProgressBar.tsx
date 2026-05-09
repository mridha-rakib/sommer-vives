import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

const STEP_LABELS = ['Datoer', 'Gæster', 'Tilkøb', 'Dine oplysninger', 'Bekræft'];

interface ProgressBarProps {
  currentStep: number;
}

export const ProgressBar = ({ currentStep }: ProgressBarProps) => {
  return (
    <div className="w-full max-w-2xl mx-auto px-4">
      <div className="flex items-center justify-between">
        {STEP_LABELS.map((label, i) => {
          const num = i + 1;
          return (
            <div key={num} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-all duration-300',
                    currentStep > num
                      ? 'bg-primary border-primary text-primary-foreground'
                      : currentStep === num
                        ? 'border-primary text-primary bg-primary/10'
                        : 'border-border text-muted-foreground bg-card'
                  )}
                >
                  {currentStep > num ? <Check className="h-5 w-5" /> : num}
                </div>
                <span
                  className={cn(
                    'text-xs mt-2 font-medium hidden sm:block',
                    currentStep >= num ? 'text-primary' : 'text-muted-foreground'
                  )}
                >
                  {label}
                </span>
              </div>
              {i < STEP_LABELS.length - 1 && (
                <div className="flex-1 mx-2 sm:mx-4">
                  <div className="h-0.5 rounded-full bg-border relative overflow-hidden">
                    <div
                      className="absolute inset-y-0 left-0 bg-primary transition-all duration-500"
                      style={{ width: currentStep > num ? '100%' : '0%' }}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
