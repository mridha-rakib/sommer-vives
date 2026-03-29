
-- Add missing columns to bookings for Stripe checkout flow
ALTER TABLE public.bookings 
  ADD COLUMN IF NOT EXISTS stripe_session_id text,
  ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS amount_paid numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS amount_remaining numeric DEFAULT 0;

-- Add missing columns to availability_holds for hold management
ALTER TABLE public.availability_holds 
  ADD COLUMN IF NOT EXISTS released boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS hold_token text,
  ADD COLUMN IF NOT EXISTS booking_id uuid REFERENCES public.bookings(id) ON DELETE SET NULL;

-- Add missing columns to payments for Stripe tracking
ALTER TABLE public.payments 
  ADD COLUMN IF NOT EXISTS stripe_payment_intent_id text,
  ADD COLUMN IF NOT EXISTS paid_at timestamptz,
  ADD COLUMN IF NOT EXISTS note text;

-- Add missing columns to listing_blocks for sync compatibility
ALTER TABLE public.listing_blocks 
  ADD COLUMN IF NOT EXISTS summary text;
