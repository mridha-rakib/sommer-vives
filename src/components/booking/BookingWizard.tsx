import { useBooking } from './BookingContext';
import { ProgressBar } from './ProgressBar';
import { BookingSummary } from './BookingSummary';
import { StepDates } from './StepDates';
import { StepGuests } from './StepGuests';
import { StepAddons } from './StepAddons';
import { StepDetails } from './StepDetails';
import { StepConfirm } from './StepConfirm';
import { Button } from '@/components/ui/button';
import { X, ChevronLeft, ChevronRight, AlertCircle, RefreshCw } from 'lucide-react';
import { useEffect, Component } from 'react';
import type { ReactNode, ErrorInfo } from 'react';
import { useTranslation } from '@/lib/i18n';

class StepErrorBoundaryInner extends Component<
  { children: ReactNode; onRetry: () => void; tryAgainLabel: string; errorLabel: string },
  { hasError: boolean; message: string }
> {
  constructor(props: { children: ReactNode; onRetry: () => void; tryAgainLabel: string; errorLabel: string }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, message: error?.message || '' };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[BookingStep]', error, info.componentStack);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
          <AlertCircle className="h-10 w-10 text-destructive" />
          <p className="text-foreground font-medium">{this.props.errorLabel}</p>
          <p className="text-sm text-muted-foreground max-w-xs">{this.state.message}</p>
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => { this.setState({ hasError: false, message: '' }); this.props.onRetry(); }}
          >
            <RefreshCw className="h-4 w-4" />
            {this.props.tryAgainLabel}
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}

const stepComponents = [StepDates, StepGuests, StepAddons, StepDetails, StepConfirm];

export const BookingWizard = () => {
  const { isOpen, close, step, setStep, state, reset, quoteValid, fetchError, clientSecret, bookingResult } = useBooking();
  const { t } = useTranslation();

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
  const stepKey = step;

  return (
    <div className="fixed inset-0 z-[100] bg-background flex flex-col animate-fade-in" translate="no">
      {/* Top bar */}
      <div className="border-b border-border bg-card px-4 py-4 shrink-0">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <button
            onClick={() => { reset(); close(); }}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
            <span className="text-sm font-medium">{t('booking.close')}</span>
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
              <StepErrorBoundaryInner
                key={stepKey}
                onRetry={() => setStep(step)}
                tryAgainLabel={t('booking.tryAgain')}
                errorLabel={t('booking.stepError')}
              >
                <StepComponent />
              </StepErrorBoundaryInner>
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

      {(step < 5 || (step === 5 && !clientSecret && !bookingResult)) && (
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
              {t('booking.back')}
            </Button>
            {step < 5 && (
              <Button
                size="lg"
                onClick={() => setStep(step + 1)}
                disabled={!canNext()}
                className="gap-2 h-12 px-8"
              >
                {t('booking.next')}
                <ChevronRight className="h-5 w-5" />
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
