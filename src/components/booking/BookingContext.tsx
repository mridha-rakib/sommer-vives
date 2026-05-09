import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

export interface PriceLineItem {
  label: string;
  amount: number; // øre
  type: string;
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
  // Step 4 - Details
  name: string;
  email: string;
  phone: string;
  message: string;
}

const initialState: BookingState = {
  listing: null,
  checkIn: null,
  checkOut: null,
  nights: 0,
  guests: 1,
  pets: 0,
  selectedAddonIds: [],
  name: '',
  email: '',
  phone: '',
  message: '',
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
  submitBooking: () => Promise<boolean>;
}

const BookingContext = createContext<BookingContextValue | null>(null);

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

    setPricingLoading(true);
    setFetchError(null);
    try {
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/calculate-price`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            listing_id: s.listing.id,
            start_date: s.checkIn.toISOString().split('T')[0],
            end_date: s.checkOut.toISOString().split('T')[0],
            guests: s.guests || 1,
            pets: s.pets || 0,
            selected_addon_ids: s.selectedAddonIds,
          }),
          signal: controller.signal,
        }
      );

      if (controller.signal.aborted) return;
      const data = await res.json();
      if (!res.ok) {
        setFetchError(data.error || 'Prisberegning fejlede. Prøv igen.');
        return;
      }

      setLineItems(data.line_items || []);
      setTotalPrice(data.grand_total);
      setAvailableAddons(data.available_addons || []);
      setQuoteValid(data.valid !== false);
      setValidationErrors(data.validation_errors || []);
      setAppliedRules(data.applied_rules || []);
      setNightBreakdown(data.nights || []);
      setQuoteMinNights(data.min_nights || 2);
    } catch (e: any) {
      if (e.name === 'AbortError') return;
      console.error('Pricing fetch failed:', e);
      setFetchError('Kunne ikke kontakte serveren. Tjek din forbindelse.');
    } finally {
      setPricingLoading(false);
    }
  }, [state]);

  const submitBooking = useCallback(async (): Promise<boolean> => {
    if (!state.listing || !state.checkIn || !state.checkOut) return false;
    setSubmitting(true);
    setSubmitError(null);

    try {
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/create-booking`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            listing_id: state.listing.id,
            start_date: state.checkIn.toISOString().split('T')[0],
            end_date: state.checkOut.toISOString().split('T')[0],
            guest_name: state.name,
            guest_email: state.email,
            guest_phone: state.phone || null,
            guest_message: state.message || null,
            guests: state.guests,
            selected_addon_ids: state.selectedAddonIds,
          }),
        }
      );

      const data = await res.json();
      if (!res.ok) {
        setSubmitError(data.error || 'Der opstod en fejl. Prøv igen.');
        return false;
      }

      if (data.checkout_url) {
        window.location.href = data.checkout_url;
        return true;
      }

      return true;
    } catch {
      setSubmitError('Netværksfejl. Tjek din forbindelse og prøv igen.');
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [state]);

  return (
    <BookingContext.Provider value={{
      state, update, reset, step, setStep, isOpen, open, close,
      lineItems, totalPrice, availableAddons, pricingLoading, fetchPricing,
      quoteValid, validationErrors, appliedRules, nightBreakdown,
      quoteMinNights, fetchError,
      submitting, submitError, submitBooking,
    }}>
      {children}
    </BookingContext.Provider>
  );
};
