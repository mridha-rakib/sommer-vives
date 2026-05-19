-- Complete chat/messaging support: attachments + web push subscriptions.

ALTER TABLE public.chat_messages
  ADD COLUMN IF NOT EXISTS attachment_url text,
  ADD COLUMN IF NOT EXISTS attachment_name text,
  ADD COLUMN IF NOT EXISTS attachment_type text,
  ADD COLUMN IF NOT EXISTS attachment_size integer;

ALTER TABLE public.chat_messages
  ALTER COLUMN message SET DEFAULT '';

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'chat-attachments',
  'chat-attachments',
  true,
  10485760,
  ARRAY[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'application/pdf',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ]
)
ON CONFLICT (id) DO UPDATE
SET public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Public read chat attachments" ON storage.objects;
CREATE POLICY "Public read chat attachments" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'chat-attachments');

DROP POLICY IF EXISTS "Anyone upload chat attachments" ON storage.objects;
CREATE POLICY "Anyone upload chat attachments" ON storage.objects
  FOR INSERT TO public
  WITH CHECK (bucket_id = 'chat-attachments');

DROP POLICY IF EXISTS "Admins manage chat attachments" ON storage.objects;
CREATE POLICY "Admins manage chat attachments" ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'chat-attachments' AND public.has_role(auth.uid(), 'admin'::user_role))
  WITH CHECK (bucket_id = 'chat-attachments' AND public.has_role(auth.uid(), 'admin'::user_role));

CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  endpoint text NOT NULL UNIQUE,
  p256dh text NOT NULL,
  auth text NOT NULL,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  last_used_at timestamptz,
  disabled_at timestamptz
);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own push subscriptions" ON public.push_subscriptions;
CREATE POLICY "Users manage own push subscriptions"
  ON public.push_subscriptions
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins view push subscriptions" ON public.push_subscriptions;
CREATE POLICY "Admins view push subscriptions"
  ON public.push_subscriptions
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::user_role));

DROP TRIGGER IF EXISTS update_push_subscriptions_updated_at ON public.push_subscriptions;
CREATE TRIGGER update_push_subscriptions_updated_at
  BEFORE UPDATE ON public.push_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_active
  ON public.push_subscriptions(user_id)
  WHERE disabled_at IS NULL;
