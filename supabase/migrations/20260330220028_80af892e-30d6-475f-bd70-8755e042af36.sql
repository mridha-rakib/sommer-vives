
-- =============================================
-- ENUMS for all critical status flows
-- =============================================

-- Owner onboarding status enum
DO $$ BEGIN
  CREATE TYPE public.onboarding_status AS ENUM (
    'lead', 'account_created', 'owner_info_complete', 'property_info_complete',
    'agreement_ready', 'agreement_signed', 'activated',
    'setup_in_progress', 'listing_review', 'live'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Agreement status enum
DO $$ BEGIN
  CREATE TYPE public.agreement_status AS ENUM (
    'draft', 'generated', 'sent', 'viewed', 'signed', 'archived'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Property setup status enum
DO $$ BEGIN
  CREATE TYPE public.property_setup_status AS ENUM (
    'new', 'awaiting_visit', 'visit_booked', 'content_pending',
    'media_pending', 'review_pending', 'ready_to_publish', 'live'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Payment status enum
DO $$ BEGIN
  CREATE TYPE public.payment_status_enum AS ENUM (
    'pending', 'paid', 'failed', 'refunded', 'partially_paid'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Guest stay status enum
DO $$ BEGIN
  CREATE TYPE public.guest_stay_status AS ENUM (
    'upcoming', 'arrival_ready', 'in_stay', 'checkout_pending', 'completed'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- =============================================
-- MISSING TABLES
-- =============================================

-- Property media (dedicated media table beyond listings.images)
CREATE TABLE public.property_media (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL,
  media_type TEXT NOT NULL DEFAULT 'photo',  -- photo, video, floor_plan, drone
  url TEXT NOT NULL,
  label TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_hero BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.property_media ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage all property_media" ON public.property_media FOR ALL USING (has_role(auth.uid(), 'admin'::user_role));
CREATE POLICY "Owners manage own property_media" ON public.property_media FOR ALL USING (auth.uid() = owner_id);
CREATE POLICY "Public read property_media" ON public.property_media FOR SELECT USING (true);

-- Listing distribution (where each listing is published)
CREATE TABLE public.listing_distribution (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  channel TEXT NOT NULL,  -- airbnb, booking_com, vrbo, own_site
  external_id TEXT,
  external_url TEXT,
  sync_status TEXT NOT NULL DEFAULT 'pending',  -- pending, synced, error
  last_synced_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(listing_id, channel)
);
ALTER TABLE public.listing_distribution ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage all listing_distribution" ON public.listing_distribution FOR ALL USING (has_role(auth.uid(), 'admin'::user_role));
CREATE POLICY "Owners view own listing_distribution" ON public.listing_distribution FOR SELECT USING (
  listing_id IN (SELECT id FROM public.listings WHERE owner_id = auth.uid())
);
CREATE TRIGGER update_listing_distribution_updated_at BEFORE UPDATE ON public.listing_distribution FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Guest stays (lifecycle tracking per booking)
CREATE TABLE public.guest_stays (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE UNIQUE,
  guest_id UUID REFERENCES public.guests(id),
  status TEXT NOT NULL DEFAULT 'upcoming',  -- upcoming, arrival_ready, in_stay, checkout_pending, completed
  checkin_completed_at TIMESTAMP WITH TIME ZONE,
  checkout_completed_at TIMESTAMP WITH TIME ZONE,
  checkin_notes TEXT,
  checkout_notes TEXT,
  guest_rating INTEGER,
  host_rating INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.guest_stays ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage all guest_stays" ON public.guest_stays FOR ALL USING (has_role(auth.uid(), 'admin'::user_role));
CREATE POLICY "Owners view own guest_stays" ON public.guest_stays FOR SELECT USING (
  booking_id IN (SELECT id FROM public.bookings WHERE owner_id = auth.uid())
);
CREATE POLICY "Anyone can insert guest_stays" ON public.guest_stays FOR INSERT WITH CHECK (true);
CREATE TRIGGER update_guest_stays_updated_at BEFORE UPDATE ON public.guest_stays FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Message threads (structured threading for chat_messages)
CREATE TABLE public.message_threads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  thread_type TEXT NOT NULL DEFAULT 'support',  -- support, booking, owner, system
  subject TEXT,
  booking_id UUID REFERENCES public.bookings(id),
  property_id UUID REFERENCES public.properties(id),
  owner_id UUID,
  guest_id UUID REFERENCES public.guests(id),
  status TEXT NOT NULL DEFAULT 'open',  -- open, resolved, archived
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.message_threads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage all message_threads" ON public.message_threads FOR ALL USING (has_role(auth.uid(), 'admin'::user_role));
CREATE POLICY "Owners view own message_threads" ON public.message_threads FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "Anyone can create message_threads" ON public.message_threads FOR INSERT WITH CHECK (true);
CREATE TRIGGER update_message_threads_updated_at BEFORE UPDATE ON public.message_threads FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add thread_id FK to chat_messages
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS thread_id UUID REFERENCES public.message_threads(id);

-- Add setup_status to properties
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS setup_status TEXT NOT NULL DEFAULT 'new';

-- Add stay_status to bookings for quick lookup
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS stay_status TEXT DEFAULT 'upcoming';
