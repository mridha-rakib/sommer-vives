-- Allow public website visitors to create homeowner leads from the rental check form.
-- Admin/team access remains controlled by the existing read/update/delete policies.
CREATE POLICY "Public can create rental check leads"
ON public.leads
FOR INSERT
WITH CHECK (
  source = 'udlejningstjek'
  AND status = 'new'
  AND assigned_to IS NULL
  AND converted_owner_id IS NULL
);
