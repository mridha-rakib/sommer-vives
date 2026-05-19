import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface PriceLineItem {
  label: string;
  amount: number; // øre
  type: string;
}

export interface BookingSubmitResult {
  bookingId?: string;
  checkoutUrl?: string;
  paymentRequired: boolean;
}

export interface ValidationError {
  code: string;
  message: string;
  field?: string;
}

export interface AppliedRule {
  type: string;
  name: string;
  detail: string;
}

export interface NightBreakdown {
  date: string;
  day_name: string;
  price: number;
  source: string;
  season_name?: string;
  is_weekend: boolean;
  base_price: number;
  multiplier: number;
}

export interface AvailableAddon {
  id: string;
  name: string;
  description: string | null;
  price: number; // øre
  price_type: string;
}

export interface ListingInfo {
  id: string;
  title: string;
  image?: string;
  maxGuests: number;
  checkInTime?: string;
  checkOutTime?: string;
}

export interface BookingState {
  // Listing
  listing: ListingInfo | null;
  // Step 1 - Dates
  checkIn: Date | null;
  checkOut: Date | null;
  nights: number;
  // Step 2 - Guests
  guests: number;
  pets: number;
  // Step 3 - Add-ons
  selectedAddonIds: string[];
  discountCode: string;
  // Step 4 - Details
  name: string;
  email: string;
  phone: string;
  message: string;
  paymentOption: 'full' | 'deposit';
}

const initialState: BookingState = {
  listing: null,
  checkIn: null,
  checkOut: null,
  nights: 0,
  guests: 1,
  pets: 0,
  selectedAddonIds: [],
  discountCode: '',
  name: '',
  email: '',
  phone: '',
  message: '',
  paymentOption: 'full',
};

interface BookingContextValue {
  state: BookingState;
  update: (partial: Partial<BookingState>) => void;
  reset: () => void;
  step: number;
  setStep: (s: number) => void;
  isOpen: boolean;
  open: (listing: ListingInfo, preselectedDates?: { checkIn?: Date; checkOut?: Date; guests?: number }) => void;
  close: () => void;
  // Server-computed pricing (quote engine)
  lineItems: PriceLineItem[];
  totalPrice: number;
  availableAddons: AvailableAddon[];
  pricingLoading: boolean;
  fetchPricing: () => Promise<void>;
  // Quote engine extras
  quoteValid: boolean;
  validationErrors: ValidationError[];
  appliedRules: AppliedRule[];
  nightBreakdown: NightBreakdown[];
  quoteMinNights: number;
  fetchError: string | null;
  // Submit
  submitting: boolean;
  submitError: string | null;
  bookingResult: BookingSubmitResult | null;
  submitBooking: () => Promise<BookingSubmitResult | null>;
}

const BookingContext = createContext<BookingContextValue | null>(null);

type FunctionInvokeOptions = NonNullable<Parameters<typeof supabase.functions.invoke>[1]> & {
  signal?: AbortSignal;
};

interface FunctionErrorContext {
  json?: () => Promise<{ error?: string; message?: string }>;
}

interface FunctionErrorWithContext extends Error {
  context?: FunctionErrorContext;
}

interface CalculatePriceResponse {
  line_items?: PriceLineItem[];
  grand_total: number;
  available_addons?: AvailableAddon[];
  valid?: boolean;
  validation_errors?: ValidationError[];
  applied_rules?: AppliedRule[];
  nights?: NightBreakdown[];
  min_nights?: number;
}

interface CreateBookingResponse {
  booking?: { id?: string };
  checkout_url?: string;
  payment_required?: boolean;
}

export const useBooking = () => {
  const ctx = useContext(BookingContext);
  if (!ctx) throw new Error('useBooking must be inside BookingProvider');
  return ctx;
};

export const BookingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<BookingState>(initialState);
  const [step, setStep] = useState(1);
  const [isOpen, setIsOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [bookingResult, setBookingResult] = useState<BookingSubmitResult | null>(null);

  // Server pricing
  const [lineItems, setLineItems] = useState<PriceLineItem[]>([]);
  const [totalPrice, setTotalPrice] = useState(0);
  const [availableAddons, setAvailableAddons] = useState<AvailableAddon[]>([]);
  const [pricingLoading, setPricingLoading] = useState(false);
  const [quoteValid, setQuoteValid] = useState(true);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [appliedRules, setAppliedRules] = useState<AppliedRule[]>([]);
  const [nightBreakdown, setNightBreakdown] = useState<NightBreakdown[]>([]);
  const [quoteMinNights, setQuoteMinNights] = useState(2);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const pricingAbortRef = useRef<AbortController | null>(null);
  const pricingRequestIdRef = useRef(0);

  const invokeWithRetry = useCallback(async <T,>(
    functionName: string,
    body: Record<string, unknown>,
    options: { timeoutMs?: number; retries?: number } = {},
  ): Promise<T> => {
    const timeoutMs = options.timeoutMs ?? 15000;
    const retries = options.retries ?? 1;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= retries; attempt += 1) {
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), timeoutMs);
      try {
        const { data, error } = await supabase.functions.invoke(functionName, {
          body,
          signal: controller.signal,
        } as FunctionInvokeOptions);
        window.clearTimeout(timeout);
        if (error) {
          const context = (error as FunctionErrorWithContext).context;
          let message = error.message;
          if (context && typeof context.json === 'function') {
            try {
              const payload = await context.json();
              message = payload?.error || payload?.message || message;
            } catch {
              // Keep the original Supabase error message if the response body is not JSON.
            }
          }
          throw new Error(message);
        }
        return data as T;
      } catch (error) {
        window.clearTimeout(timeout);
        lastError = error instanceof Error ? error : new Error(String(error));
        if (attempt === retries) break;
        await new Promise(resolve => window.setTimeout(resolve, 350 * (attempt + 1)));
      }
    }

    throw lastError || new Error('Request failed');
  }, []);

  const update = useCallback((partial: Partial<BookingState>) => {
    setState(prev => ({ ...prev, ...partial }));
  }, []);

  const reset = useCallback(() => {
    setState(initialState);
    setStep(1);
    setSubmitError(null);
    setLineItems([]);
    setTotalPrice(0);
    setAvailableAddons([]);
    setQuoteValid(true);
    setValidationErrors([]);
    setAppliedRules([]);
    setNightBreakdown([]);
    setQuoteMinNights(2);
    setFetchError(null);
    setBookingResult(null);
  }, []);

  const open = useCallback((listing: ListingInfo, preselected?: { checkIn?: Date; checkOut?: Date; guests?: number }) => {
    setState(prev => ({
      ...prev,
      listing,
      guests: preselected?.guests || prev.guests || 1,
      checkIn: preselected?.checkIn || null,
      checkOut: preselected?.checkOut || null,
      nights: 0,
    }));
    setStep(1);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => setIsOpen(false), []);

  const fetchPricing = useCallback(async () => {
    const s = state;
    if (!s.listing || !s.checkIn || !s.checkOut) return;

    pricingAbortRef.current?.abort();
    const controller = new AbortController();
    pricingAbortRef.current = controller;
    const requestId = pricingRequestIdRef.current + 1;
    pricingRequestIdRef.current = requestId;

    setPricingLoading(true);
    setFetchError(null);
    try {
      const data = await invokeWithRetry<CalculatePriceResponse>('calculate-price', {
        listing_id: s.listing.id,
        start_date: s.checkIn.toISOString().split('T')[0],
        end_date: s.checkOut.toISOString().split('T')[0],
        guests: s.guests || 1,
        pets: s.pets || 0,
        selected_addon_ids: s.selectedAddonIds,
        discount_code: s.discountCode || null,
      }, { timeoutMs: 12000, retries: 1 });

      if (controller.signal.aborted || requestId !== pricingRequestIdRef.current) return;

      setLineItems(data.line_items || []);
      setTotalPrice(data.grand_total);
      setAvailableAddons(data.available_addons || []);
      setQuoteValid(data.valid !== false);
      setValidationErrors(data.validation_errors || []);
      setAppliedRules(data.applied_rules || []);
      setNightBreakdown(data.nights || []);
      setQuoteMinNights(data.min_nights || 2);
    } catch (e) {
      if (e instanceof Error && e.name === 'AbortError') return;
      console.error('Pricing fetch failed:', e);
      setFetchError('Kunne ikke kontakte serveren. Tjek din forbindelse.');
    } finally {
      if (requestId === pricingRequestIdRef.current) setPricingLoading(false);
    }
  }, [invokeWithRetry, state]);

  const submitBooking = useCallback(async (): Promise<BookingSubmitResult | null> => {
    if (!state.listing || !state.checkIn || !state.checkOut) return null;
    setSubmitting(true);
    setSubmitError(null);
    setBookingResult(null);

    try {
      const data = await invokeWithRetry<CreateBookingResponse>('create-booking', {
        listing_id: state.listing.id,
        start_date: state.checkIn.toISOString().split('T')[0],
        end_date: state.checkOut.toISOString().split('T')[0],
        guest_name: state.name,
        guest_email: state.email,
        guest_phone: state.phone || null,
        guest_message: state.message || null,
        guests: state.guests,
        pets: state.pets || 0,
        selected_addon_ids: state.selectedAddonIds,
        discount_code: state.discountCode || null,
        payment_option: state.paymentOption,
        deposit_amount: state.paymentOption === 'deposit' ? Math.round(totalPrice * 0.3) : null,
      }, { timeoutMs: 20000, retries: 1 });

      const result: BookingSubmitResult = {
        bookingId: data.booking?.id,
        checkoutUrl: data.checkout_url,
        paymentRequired: data.payment_required !== false && !!data.checkout_url,
      };

      if (data.checkout_url) {
        window.location.href = data.checkout_url;
        return result;
      }

      setBookingResult(result);
      return result;
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Netværksfejl. Tjek din forbindelse og prøv igen.');
      return null;
    } finally {
      setSubmitting(false);
    }
  }, [invokeWithRetry, state, totalPrice]);

  return (
    <BookingContext.Provider value={{
      state, update, reset, step, setStep, isOpen, open, close,
      lineItems, totalPrice, availableAddons, pricingLoading, fetchPricing,
      quoteValid, validationErrors, appliedRules, nightBreakdown,
      quoteMinNights, fetchError,
      submitting, submitError, bookingResult, submitBooking,
    }}>
      {children}
    </BookingContext.Provider>
  );
};
