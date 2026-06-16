CREATE TABLE public.guest_email_verification_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  email text NOT NULL,
  code_hash text NOT NULL,
  expires_at timestamptz NOT NULL,
  attempts integer NOT NULL DEFAULT 0,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.guest_email_verification_codes TO service_role;

ALTER TABLE public.guest_email_verification_codes ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_guest_email_verification_codes_email_created_at
  ON public.guest_email_verification_codes (lower(email), created_at DESC);

CREATE INDEX idx_guest_email_verification_codes_user_active
  ON public.guest_email_verification_codes (user_id, expires_at DESC)
  WHERE used_at IS NULL;