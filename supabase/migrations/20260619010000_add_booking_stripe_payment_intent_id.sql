-- Add dedicated stripe_payment_intent_id column to bookings so PaymentIntent-based
-- payments (embedded Stripe Elements) are tracked separately from checkout sessions.
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS stripe_payment_intent_id text;

CREATE INDEX IF NOT EXISTS idx_bookings_stripe_payment_intent_id
  ON public.bookings (stripe_payment_intent_id)
  WHERE stripe_payment_intent_id IS NOT NULL;
