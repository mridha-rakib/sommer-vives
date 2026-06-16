CREATE TABLE public.password_reset_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  email text NOT NULL,
  code_hash text NOT NULL,
  attempts integer NOT NULL DEFAULT 0,
  expires_at timestamptz NOT NULL,
  verified_at timestamptz,
  reset_token_hash text,
  reset_token_expires_at timestamptz,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_prc_user ON public.password_reset_codes(user_id);
CREATE INDEX idx_prc_lookup ON public.password_reset_codes(user_id, used_at, expires_at DESC);
GRANT ALL ON public.password_reset_codes TO service_role;
ALTER TABLE public.password_reset_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service role manages reset codes" ON public.password_reset_codes FOR ALL TO service_role USING (true) WITH CHECK (true);