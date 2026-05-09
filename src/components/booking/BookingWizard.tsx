import { useBooking } from './BookingContext';
import { ProgressBar } from './ProgressBar';
import { BookingSummary } from './BookingSummary';
import { StepDates } from './StepDates';
import { StepGuests } from './StepGuests';
import { StepAddons } from './StepAddons';
import { StepDetails } from './StepDetails';
import { StepConfirm } from './StepConfirm';
import { Button } from '@/components/ui/button';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect } from 'react';

const stepComponents = [StepDates, StepGuests, StepAddons, StepDetails, StepConfirm];

export const BookingWizard = () => {
  const { isOpen, close, step, setStep, state, reset, quoteValid, fetchError } = useBooking();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  const canNext = (): boolean => {
    switch (step) {
      case 1: return !!state.checkIn && !!state.checkOut && state.nights > 0 && quoteValid && !fetchError;
      case 2: return state.guests > 0;
      case 3: return true;
      case 4: return state.name.trim().length > 0 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(state.email);
      default: return false;
    }
  };

  const StepComponent = stepComponents[step - 1];

  return (
    <div className="fixed inset-0 z-[100] bg-background flex flex-col animate-fade-in">
      {/* Top bar */}
      <div className="border-b border-border bg-card px-4 py-4 shrink-0">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <button
            onClick={() => { reset(); close(); }}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
            <span className="text-sm font-medium">Luk</span>
          </button>
          <ProgressBar currentStep={step} />
          <div className="w-16" />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto px-4 py-8 lg:py-12">
          <div className="lg:grid lg:grid-cols-[1fr_340px] lg:gap-12">
            <div className="min-w-0">
              <StepComponent />
            </div>
            <div className="hidden lg:block">
              <BookingSummary />
            </div>
          </div>
          <div className="lg:hidden mt-8">
            <BookingSummary collapsible />
          </div>
        </div>
      </div>

      {/* Bottom navigation */}
      {step < 5 && (
        <div className="border-t border-border bg-card px-4 py-4 shrink-0">
          <div className="flex items-center justify-between max-w-6xl mx-auto">
            <Button
              variant="outline"
              size="lg"
              onClick={() => setStep(step - 1)}
              disabled={step === 1}
              className="gap-2 h-12 px-6"
            >
              <ChevronLeft className="h-5 w-5" />
              Tilbage
            </Button>
            <Button
              size="lg"
              onClick={() => setStep(step + 1)}
              disabled={!canNext()}
              className="gap-2 h-12 px-8"
            >
              Næste
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
