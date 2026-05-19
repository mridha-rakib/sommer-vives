-- Tie owner payout rows to bookings so Stripe payment confirmation can create
-- exactly one pending payout per fully paid booking.

ALTER TABLE public.payouts
  ADD COLUMN IF NOT EXISTS booking_id uuid REFERENCES public.bookings(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS payouts_booking_id_unique
ON public.payouts (booking_id)
WHERE booking_id IS NOT NULL;

COMMENT ON COLUMN public.payouts.amount IS 'Amount in minor currency units, e.g. øre for DKK.';
