-- Function to count distinct unread support threads for admin badge.
-- Uses SECURITY DEFINER so it can scan chat_messages without RLS recursion,
-- but only callable by admins.
CREATE OR REPLACE FUNCTION public.count_unread_admin_threads()
RETURNS integer
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  cnt integer;
BEGIN
  -- Only admins may use this aggregate
  IF NOT public.has_role(auth.uid(), 'admin'::user_role) THEN
    RETURN 0;
  END IF;

  SELECT COUNT(DISTINCT thread_id)
    INTO cnt
  FROM public.chat_messages
  WHERE is_read = false
    AND sender_type <> 'admin'
    AND thread_id IS NOT NULL;

  RETURN COALESCE(cnt, 0);
END;
$$;

-- Allow authenticated users to invoke (function gates access internally).
GRANT EXECUTE ON FUNCTION public.count_unread_admin_threads() TO authenticated;

-- Helpful index for the unread-thread aggregate
CREATE INDEX IF NOT EXISTS idx_chat_messages_unread_threads
  ON public.chat_messages (thread_id)
  WHERE is_read = false AND sender_type <> 'admin';