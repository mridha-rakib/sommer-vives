ALTER TABLE public.chat_messages
  ADD COLUMN IF NOT EXISTS attachment_name text,
  ADD COLUMN IF NOT EXISTS attachment_url text,
  ADD COLUMN IF NOT EXISTS attachment_size integer;

CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  endpoint text NOT NULL,
  p256dh text NOT NULL,
  auth text NOT NULL,
  user_agent text,
  disabled_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.discount_rules
  ADD COLUMN IF NOT EXISTS code text,
  ADD COLUMN IF NOT EXISTS min_days_before_checkin integer,
  ADD COLUMN IF NOT EXISTS max_days_before_checkin integer;

ALTER TABLE public.fee_rules
  ADD COLUMN IF NOT EXISTS applies_to_channels text[];