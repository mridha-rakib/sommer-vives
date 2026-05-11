-- Optional booking discount codes for discount_rules.
-- Rules without a code remain automatic discount rules.
ALTER TABLE public.discount_rules
  ADD COLUMN IF NOT EXISTS code text,
  ADD COLUMN IF NOT EXISTS starts_at timestamptz,
  ADD COLUMN IF NOT EXISTS ends_at timestamptz;

CREATE UNIQUE INDEX IF NOT EXISTS discount_rules_listing_code_unique
ON public.discount_rules (listing_id, lower(code))
WHERE code IS NOT NULL AND listing_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS discount_rules_owner_global_code_unique
ON public.discount_rules (owner_id, lower(code))
WHERE code IS NOT NULL AND listing_id IS NULL;
