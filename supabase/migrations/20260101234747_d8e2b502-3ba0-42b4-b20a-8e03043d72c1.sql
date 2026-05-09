-- Fix guests RLS policy that references auth.users (not accessible from the public API)
-- This was causing "permission denied for table users" when reading guests and when joining guests from bookings.

ALTER TABLE public.guests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Guests can view own profile" ON public.guests;

-- Allow a logged-in guest to view their guest row if the email matches their own profile email.
-- (Admins are already allowed via the existing admin policy.)
CREATE POLICY "Guests can view own profile"
ON public.guests
FOR SELECT
USING (
  email = (
    SELECT p.email
    FROM public.profiles p
    WHERE p.id = auth.uid()
    LIMIT 1
  )
);
