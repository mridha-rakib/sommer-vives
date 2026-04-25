-- Add recipient_id to allow admin replies to be addressed to a specific user (owner or guest)
ALTER TABLE public.chat_messages
  ADD COLUMN IF NOT EXISTS recipient_id uuid;

CREATE INDEX IF NOT EXISTS idx_chat_messages_recipient_id ON public.chat_messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender_id ON public.chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_thread_type ON public.chat_messages(thread_type);

-- Allow users to read messages addressed TO them (in addition to existing policies)
DROP POLICY IF EXISTS "Users can view messages addressed to them" ON public.chat_messages;
CREATE POLICY "Users can view messages addressed to them"
  ON public.chat_messages
  FOR SELECT
  USING (recipient_id = auth.uid() OR sender_id = auth.uid());

-- Allow authenticated users to insert their own messages
DROP POLICY IF EXISTS "Authenticated users can send their own messages" ON public.chat_messages;
CREATE POLICY "Authenticated users can send their own messages"
  ON public.chat_messages
  FOR INSERT
  WITH CHECK (sender_id = auth.uid());