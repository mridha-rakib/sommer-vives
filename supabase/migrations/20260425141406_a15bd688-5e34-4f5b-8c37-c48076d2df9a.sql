
-- Drop the FK so thread_id can be a free-form deterministic uuid
ALTER TABLE public.chat_messages
  DROP CONSTRAINT IF EXISTS chat_messages_thread_id_fkey;

-- Deterministic thread_id function
CREATE OR REPLACE FUNCTION public.compute_chat_thread_id(
  p_thread_type text,
  p_sender_type text,
  p_sender_id uuid,
  p_recipient_id uuid,
  p_booking_id uuid,
  p_sender_name text
) RETURNS uuid
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  participant uuid;
  key_text text;
  hash_text text;
BEGIN
  IF p_sender_type = 'admin' THEN
    participant := p_recipient_id;
  ELSE
    participant := p_sender_id;
  END IF;

  IF participant IS NOT NULL THEN
    key_text := COALESCE(p_thread_type, 'support') || ':user:' || participant::text;
    IF p_booking_id IS NOT NULL THEN
      key_text := key_text || ':booking:' || p_booking_id::text;
    END IF;
  ELSIF p_booking_id IS NOT NULL THEN
    key_text := COALESCE(p_thread_type, 'support') || ':booking:' || p_booking_id::text;
  ELSE
    key_text := COALESCE(p_thread_type, 'support') || ':anon:' || COALESCE(p_sender_name, 'unknown');
  END IF;

  hash_text := md5(key_text);
  RETURN (
    substr(hash_text, 1, 8) || '-' ||
    substr(hash_text, 9, 4) || '-' ||
    substr(hash_text, 13, 4) || '-' ||
    substr(hash_text, 17, 4) || '-' ||
    substr(hash_text, 21, 12)
  )::uuid;
END;
$$;

-- BEFORE INSERT trigger to fill thread_id automatically
CREATE OR REPLACE FUNCTION public.set_chat_message_thread_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Always recompute when null OR when caller passed an inconsistent id
  IF NEW.thread_id IS NULL THEN
    NEW.thread_id := public.compute_chat_thread_id(
      NEW.thread_type, NEW.sender_type, NEW.sender_id,
      NEW.recipient_id, NEW.booking_id, NEW.sender_name
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_chat_message_thread_id ON public.chat_messages;
CREATE TRIGGER trg_set_chat_message_thread_id
BEFORE INSERT ON public.chat_messages
FOR EACH ROW
EXECUTE FUNCTION public.set_chat_message_thread_id();

-- Backfill existing rows (overwrite to make all consistent)
UPDATE public.chat_messages
SET thread_id = public.compute_chat_thread_id(
  thread_type, sender_type, sender_id, recipient_id, booking_id, sender_name
);

-- Index for fast grouping & ordering
CREATE INDEX IF NOT EXISTS idx_chat_messages_thread_id ON public.chat_messages(thread_id, created_at);
