-- Complete payment operations: refunds, Connect onboarding, and payout execution.

ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS refunded_amount numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS stripe_refund_id text,
  ADD COLUMN IF NOT EXISTS refunded_at timestamp with time zone;

ALTER TABLE public.owner_bank_settings
  ADD COLUMN IF NOT EXISTS stripe_connect_account_id text,
  ADD COLUMN IF NOT EXISTS stripe_connect_status text DEFAULT 'not_connected',
  ADD COLUMN IF NOT EXISTS stripe_connect_onboarding_url text,
  ADD COLUMN IF NOT EXISTS stripe_connect_charges_enabled boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS stripe_connect_payouts_enabled boolean DEFAULT false;

ALTER TABLE public.payouts
  ADD COLUMN IF NOT EXISTS stripe_transfer_id text,
  ADD COLUMN IF NOT EXISTS executed_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS failure_reason text;

CREATE INDEX IF NOT EXISTS idx_payments_stripe_refund_id
  ON public.payments(stripe_refund_id)
  WHERE stripe_refund_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_owner_bank_settings_stripe_connect_account_id
  ON public.owner_bank_settings(stripe_connect_account_id)
  WHERE stripe_connect_account_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_payouts_stripe_transfer_id
  ON public.payouts(stripe_transfer_id)
  WHERE stripe_transfer_id IS NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'bookings'
      AND policyname = 'Guests view own bookings by profile email'
  ) THEN
    CREATE POLICY "Guests view own bookings by profile email"
      ON public.bookings
      FOR SELECT
      USING (
        guest_email = (
          SELECT profiles.email
          FROM public.profiles
          WHERE profiles.id = auth.uid()
          LIMIT 1
        )
      );
  END IF;
END $$;
