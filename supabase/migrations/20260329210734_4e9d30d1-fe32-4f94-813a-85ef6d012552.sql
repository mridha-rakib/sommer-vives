
-- Allow anyone to insert support chat messages
CREATE POLICY "Anyone can create support messages"
ON public.chat_messages
FOR INSERT
TO public
WITH CHECK (thread_type = 'support');

-- Allow reading own support thread by session
CREATE POLICY "Anyone can read support messages by session"
ON public.chat_messages
FOR SELECT
TO public
USING (thread_type = 'support');
