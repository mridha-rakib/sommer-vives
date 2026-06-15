-- Safe read receipts for support chat clients.
-- Public website visitors use a generated UUID as their participant id, while
-- authenticated owners/guests use auth.uid(). This function only marks admin
-- replies addressed to that participant as read.

CREATE OR REPLACE FUNCTION public.mark_support_thread_read(p_participant_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated_count integer := 0;
BEGIN
  IF p_participant_id IS NULL THEN
    RETURN 0;
  END IF;

  UPDATE public.chat_messages
  SET is_read = true
  WHERE thread_type = 'support'
    AND sender_type = 'admin'
    AND recipient_id = p_participant_id
    AND COALESCE(is_read, false) = false;

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.mark_support_thread_read(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.mark_support_thread_read(uuid) TO authenticated;
