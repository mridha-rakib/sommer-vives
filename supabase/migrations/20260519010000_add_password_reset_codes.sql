CREATE TABLE IF NOT EXISTS public.password_reset_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  code_hash text NOT NULL,
  reset_token_hash text,
  expires_at timestamptz NOT NULL,
  reset_token_expires_at timestamptz,
  verified_at timestamptz,
  used_at timestamptz,
  attempts integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_password_reset_codes_email_created
  ON public.password_reset_codes (lower(email), created_at DESC);

CREATE INDEX IF NOT EXISTS idx_password_reset_codes_user_active
  ON public.password_reset_codes (user_id, created_at DESC)
  WHERE used_at IS NULL;

ALTER TABLE public.password_reset_codes ENABLE ROW LEVEL SECURITY;
