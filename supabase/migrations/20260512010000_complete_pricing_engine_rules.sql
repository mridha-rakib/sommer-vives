-- Complete pricing engine rule coverage:
-- - fee rules can be scoped to one or more booking channels
-- - discount rules can target booking lead time, including last-minute stays

ALTER TABLE public.fee_rules
  ADD COLUMN IF NOT EXISTS applies_to_channels text[] DEFAULT NULL;

ALTER TABLE public.discount_rules
  ADD COLUMN IF NOT EXISTS min_days_before_checkin integer,
  ADD COLUMN IF NOT EXISTS max_days_before_checkin integer;

CREATE INDEX IF NOT EXISTS idx_fee_rules_channels
ON public.fee_rules USING gin (applies_to_channels);

CREATE INDEX IF NOT EXISTS idx_discount_rules_lead_time
ON public.discount_rules (min_days_before_checkin, max_days_before_checkin);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'discount_rules_lead_time_valid'
      AND conrelid = 'public.discount_rules'::regclass
  ) THEN
    ALTER TABLE public.discount_rules
      ADD CONSTRAINT discount_rules_lead_time_valid
      CHECK (
        (min_days_before_checkin IS NULL OR min_days_before_checkin >= 0)
        AND (max_days_before_checkin IS NULL OR max_days_before_checkin >= 0)
        AND (
          min_days_before_checkin IS NULL
          OR max_days_before_checkin IS NULL
          OR min_days_before_checkin <= max_days_before_checkin
        )
      );
  END IF;
END $$;
