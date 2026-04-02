
-- Listing actors (owner contacts, handyman, cleaner, partner etc.)
CREATE TABLE public.listing_actors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'secondary',
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  relation TEXT,
  notes TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.listing_actors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage all listing_actors" ON public.listing_actors FOR ALL TO public USING (has_role(auth.uid(), 'admin'::user_role));
CREATE POLICY "Owners manage own listing_actors" ON public.listing_actors FOR ALL TO public USING (
  listing_id IN (SELECT id FROM public.listings WHERE owner_id = auth.uid())
);

-- Listing staff assignments (medarbejder-roller)
CREATE TABLE public.listing_staff (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  staff_role TEXT NOT NULL,
  staff_name TEXT NOT NULL,
  staff_email TEXT,
  staff_phone TEXT,
  staff_user_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(listing_id, staff_role)
);

ALTER TABLE public.listing_staff ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage all listing_staff" ON public.listing_staff FOR ALL TO public USING (has_role(auth.uid(), 'admin'::user_role));
CREATE POLICY "Owners view own listing_staff" ON public.listing_staff FOR SELECT TO public USING (
  listing_id IN (SELECT id FROM public.listings WHERE owner_id = auth.uid())
);
