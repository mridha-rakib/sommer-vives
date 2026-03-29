
-- ============================================================
-- SommerVibes Listing System — Multi-tenant tables
-- ============================================================

-- 1. Listings (main property/listing data, extends existing properties table concept)
CREATE TABLE public.listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  address TEXT,
  region TEXT,
  max_guests INTEGER NOT NULL DEFAULT 4,
  bedrooms INTEGER DEFAULT 1,
  bathrooms INTEGER DEFAULT 1,
  base_price_per_night INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'DKK',
  cleaning_fee INTEGER DEFAULT 0,
  check_in_time TEXT DEFAULT '15:00',
  check_out_time TEXT DEFAULT '10:00',
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  amenities TEXT[] DEFAULT '{}',
  house_rules TEXT,
  practical_info TEXT,
  images TEXT[] DEFAULT '{}',
  hero_image TEXT,
  bedroom_images JSONB NOT NULL DEFAULT '[]'::jsonb,
  facilities JSONB NOT NULL DEFAULT '[]'::jsonb,
  extra_sections JSONB NOT NULL DEFAULT '[]'::jsonb,
  floor_plan_images TEXT[] DEFAULT '{}',
  image_labels JSONB DEFAULT '[]'::jsonb,
  location_map_image TEXT,
  location_mood_image TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER listings_updated_at BEFORE UPDATE ON public.listings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Season rules
CREATE TABLE public.season_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID REFERENCES public.listings(id) ON DELETE CASCADE NOT NULL,
  owner_id UUID NOT NULL,
  name TEXT NOT NULL,
  start_month INTEGER NOT NULL CHECK (start_month BETWEEN 1 AND 12),
  start_day INTEGER NOT NULL CHECK (start_day BETWEEN 1 AND 31),
  end_month INTEGER NOT NULL CHECK (end_month BETWEEN 1 AND 12),
  end_day INTEGER NOT NULL CHECK (end_day BETWEEN 1 AND 31),
  price_per_night INTEGER NOT NULL,
  price_type TEXT NOT NULL DEFAULT 'fixed',
  price_percentage NUMERIC DEFAULT NULL,
  min_nights INTEGER DEFAULT 1,
  priority INTEGER DEFAULT 0,
  check_in_days INTEGER[] DEFAULT NULL,
  check_out_days INTEGER[] DEFAULT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.season_rules ENABLE ROW LEVEL SECURITY;

-- 3. Daily price overrides
CREATE TABLE public.daily_price_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID REFERENCES public.listings(id) ON DELETE CASCADE NOT NULL,
  owner_id UUID NOT NULL,
  date DATE NOT NULL,
  price INTEGER NOT NULL,
  price_type TEXT NOT NULL DEFAULT 'fixed',
  price_percentage NUMERIC DEFAULT NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(listing_id, date)
);
ALTER TABLE public.daily_price_overrides ENABLE ROW LEVEL SECURITY;

-- 4. Fee rules
CREATE TABLE public.fee_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID REFERENCES public.listings(id) ON DELETE CASCADE NOT NULL,
  owner_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  fee_type TEXT NOT NULL DEFAULT 'fixed',
  amount INTEGER NOT NULL DEFAULT 0,
  is_mandatory BOOLEAN NOT NULL DEFAULT true,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  condition_min_nights INTEGER DEFAULT NULL,
  condition_max_nights INTEGER DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.fee_rules ENABLE ROW LEVEL SECURITY;

-- 5. Add-ons
CREATE TABLE public.add_ons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID REFERENCES public.listings(id) ON DELETE CASCADE NOT NULL,
  owner_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  price INTEGER NOT NULL DEFAULT 0,
  price_type TEXT NOT NULL DEFAULT 'fixed',
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.add_ons ENABLE ROW LEVEL SECURITY;

-- 6. Discount rules
CREATE TABLE public.discount_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID REFERENCES public.listings(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  discount_type TEXT NOT NULL DEFAULT 'percentage',
  discount_value NUMERIC NOT NULL DEFAULT 0,
  min_nights INTEGER NOT NULL DEFAULT 1,
  max_nights INTEGER,
  is_active BOOLEAN NOT NULL DEFAULT true,
  combinable_with_codes BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.discount_rules ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_discount_rules_updated_at BEFORE UPDATE ON public.discount_rules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 7. Listing blocks (availability blocks for listings table)
CREATE TABLE public.listing_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID REFERENCES public.listings(id) ON DELETE CASCADE NOT NULL,
  owner_id UUID NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT,
  source TEXT NOT NULL DEFAULT 'manual',
  external_uid TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.listing_blocks ENABLE ROW LEVEL SECURITY;

-- 8. Booking line items
CREATE TABLE public.booking_line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE NOT NULL,
  label TEXT NOT NULL,
  item_type TEXT NOT NULL DEFAULT 'night',
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price INTEGER NOT NULL DEFAULT 0,
  total INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.booking_line_items ENABLE ROW LEVEL SECURITY;

-- 9. Availability holds (temp holds during checkout)
CREATE TABLE public.availability_holds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID REFERENCES public.listings(id) ON DELETE CASCADE NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  session_id TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.availability_holds ENABLE ROW LEVEL SECURITY;

-- 10. Payments log
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE NOT NULL,
  owner_id UUID NOT NULL,
  amount INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'DKK',
  stripe_payment_id TEXT,
  stripe_checkout_session_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  payment_method TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- 11. Listing SEO
CREATE TABLE public.listing_seo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID REFERENCES public.listings(id) ON DELETE CASCADE NOT NULL UNIQUE,
  owner_id UUID NOT NULL,
  meta_title TEXT,
  meta_description TEXT,
  og_image TEXT,
  canonical_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.listing_seo ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_listing_seo_updated_at BEFORE UPDATE ON public.listing_seo
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 12. Listing videos (YouTube guides)
CREATE TABLE public.listing_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  youtube_id TEXT,
  thumbnail_url TEXT,
  emoji TEXT DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.listing_videos ENABLE ROW LEVEL SECURITY;

-- 13. Listing relationships (kombi-bookings)
CREATE TABLE public.listing_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_a_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  listing_b_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL DEFAULT 'combo',
  combo_discount_percent NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(listing_a_id, listing_b_id)
);
ALTER TABLE public.listing_relationships ENABLE ROW LEVEL SECURITY;

-- 14. Sync settings (iCal)
CREATE TABLE public.sync_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID REFERENCES public.listings(id) ON DELETE CASCADE NOT NULL,
  owner_id UUID NOT NULL,
  provider TEXT NOT NULL,
  feed_url TEXT,
  direction TEXT NOT NULL DEFAULT 'inbound',
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_synced_at TIMESTAMPTZ,
  sync_interval_minutes INTEGER DEFAULT 60,
  config JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.sync_settings ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER sync_settings_updated_at BEFORE UPDATE ON public.sync_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 15. Email templates per listing
CREATE TABLE public.email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID REFERENCES public.listings(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL,
  email_type TEXT NOT NULL DEFAULT 'booking_confirmation',
  subject TEXT NOT NULL DEFAULT '',
  heading TEXT NOT NULL DEFAULT '',
  body_text TEXT NOT NULL DEFAULT '',
  cta_label TEXT DEFAULT NULL,
  cta_url TEXT DEFAULT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(listing_id, email_type)
);
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_email_templates_updated_at BEFORE UPDATE ON public.email_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_listings_owner ON public.listings(owner_id);
CREATE INDEX idx_listings_slug ON public.listings(slug);
CREATE INDEX idx_season_rules_listing ON public.season_rules(listing_id);
CREATE INDEX idx_daily_overrides_listing_date ON public.daily_price_overrides(listing_id, date);
CREATE INDEX idx_fee_rules_listing ON public.fee_rules(listing_id);
CREATE INDEX idx_add_ons_listing ON public.add_ons(listing_id);
CREATE INDEX idx_discount_rules_listing ON public.discount_rules(listing_id);
CREATE INDEX idx_listing_blocks_dates ON public.listing_blocks(listing_id, start_date, end_date);
CREATE INDEX idx_booking_line_items_booking ON public.booking_line_items(booking_id);
CREATE INDEX idx_availability_holds_listing ON public.availability_holds(listing_id, start_date, end_date);
CREATE INDEX idx_payments_booking ON public.payments(booking_id);
CREATE INDEX idx_listing_videos_listing ON public.listing_videos(listing_id);
CREATE INDEX idx_sync_settings_listing ON public.sync_settings(listing_id);

-- ============================================================
-- RLS POLICIES — Multi-tenant
-- ============================================================

-- Listings: public read active, owners manage own, admins manage all
CREATE POLICY "Public read active listings" ON public.listings
  FOR SELECT USING (is_active = true);
CREATE POLICY "Owners manage own listings" ON public.listings
  FOR ALL USING (auth.uid() = owner_id);
CREATE POLICY "Admins manage all listings" ON public.listings
  FOR ALL USING (has_role(auth.uid(), 'admin'::user_role));

-- Season rules: public read, owners manage own, admins all
CREATE POLICY "Public read season_rules" ON public.season_rules FOR SELECT USING (true);
CREATE POLICY "Owners manage own season_rules" ON public.season_rules
  FOR ALL USING (auth.uid() = owner_id);
CREATE POLICY "Admins manage all season_rules" ON public.season_rules
  FOR ALL USING (has_role(auth.uid(), 'admin'::user_role));

-- Daily price overrides
CREATE POLICY "Public read daily_price_overrides" ON public.daily_price_overrides FOR SELECT USING (true);
CREATE POLICY "Owners manage own daily_price_overrides" ON public.daily_price_overrides
  FOR ALL USING (auth.uid() = owner_id);
CREATE POLICY "Admins manage all daily_price_overrides" ON public.daily_price_overrides
  FOR ALL USING (has_role(auth.uid(), 'admin'::user_role));

-- Fee rules
CREATE POLICY "Public read fee_rules" ON public.fee_rules FOR SELECT USING (true);
CREATE POLICY "Owners manage own fee_rules" ON public.fee_rules
  FOR ALL USING (auth.uid() = owner_id);
CREATE POLICY "Admins manage all fee_rules" ON public.fee_rules
  FOR ALL USING (has_role(auth.uid(), 'admin'::user_role));

-- Add-ons
CREATE POLICY "Public read active add_ons" ON public.add_ons FOR SELECT USING (is_active = true);
CREATE POLICY "Owners manage own add_ons" ON public.add_ons
  FOR ALL USING (auth.uid() = owner_id);
CREATE POLICY "Admins manage all add_ons" ON public.add_ons
  FOR ALL USING (has_role(auth.uid(), 'admin'::user_role));

-- Discount rules
CREATE POLICY "Public read active discount_rules" ON public.discount_rules
  FOR SELECT USING (is_active = true);
CREATE POLICY "Owners manage own discount_rules" ON public.discount_rules
  FOR ALL USING (auth.uid() = owner_id);
CREATE POLICY "Admins manage all discount_rules" ON public.discount_rules
  FOR ALL USING (has_role(auth.uid(), 'admin'::user_role));

-- Listing blocks: public read (availability), owners manage own, admins all
CREATE POLICY "Public read listing_blocks" ON public.listing_blocks FOR SELECT USING (true);
CREATE POLICY "Owners manage own listing_blocks" ON public.listing_blocks
  FOR ALL USING (auth.uid() = owner_id);
CREATE POLICY "Admins manage all listing_blocks" ON public.listing_blocks
  FOR ALL USING (has_role(auth.uid(), 'admin'::user_role));

-- Booking line items: owners via booking, admins all
CREATE POLICY "Owners view own booking_line_items" ON public.booking_line_items
  FOR SELECT USING (booking_id IN (SELECT id FROM public.bookings WHERE owner_id = auth.uid()));
CREATE POLICY "Admins manage all booking_line_items" ON public.booking_line_items
  FOR ALL USING (has_role(auth.uid(), 'admin'::user_role));

-- Availability holds: public read, anyone insert (checkout flow)
CREATE POLICY "Public read availability_holds" ON public.availability_holds FOR SELECT USING (true);
CREATE POLICY "Anyone can create holds" ON public.availability_holds FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins manage all holds" ON public.availability_holds
  FOR ALL USING (has_role(auth.uid(), 'admin'::user_role));

-- Payments
CREATE POLICY "Owners view own payments" ON public.payments
  FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "Admins manage all payments" ON public.payments
  FOR ALL USING (has_role(auth.uid(), 'admin'::user_role));
CREATE POLICY "Anyone can create payments" ON public.payments
  FOR INSERT WITH CHECK (true);

-- Listing SEO
CREATE POLICY "Public read listing_seo" ON public.listing_seo FOR SELECT USING (true);
CREATE POLICY "Owners manage own listing_seo" ON public.listing_seo
  FOR ALL USING (auth.uid() = owner_id);
CREATE POLICY "Admins manage all listing_seo" ON public.listing_seo
  FOR ALL USING (has_role(auth.uid(), 'admin'::user_role));

-- Listing videos: public read, owners manage own
CREATE POLICY "Public read listing_videos" ON public.listing_videos FOR SELECT USING (true);
CREATE POLICY "Owners manage own listing_videos" ON public.listing_videos
  FOR ALL USING (auth.uid() = owner_id);
CREATE POLICY "Admins manage all listing_videos" ON public.listing_videos
  FOR ALL USING (has_role(auth.uid(), 'admin'::user_role));

-- Listing relationships: public read, admins manage
CREATE POLICY "Public read listing_relationships" ON public.listing_relationships FOR SELECT USING (true);
CREATE POLICY "Admins manage listing_relationships" ON public.listing_relationships
  FOR ALL USING (has_role(auth.uid(), 'admin'::user_role));

-- Sync settings: owners manage own
CREATE POLICY "Owners manage own sync_settings" ON public.sync_settings
  FOR ALL USING (auth.uid() = owner_id);
CREATE POLICY "Admins manage all sync_settings" ON public.sync_settings
  FOR ALL USING (has_role(auth.uid(), 'admin'::user_role));

-- Email templates
CREATE POLICY "Owners manage own email_templates" ON public.email_templates
  FOR ALL USING (auth.uid() = owner_id);
CREATE POLICY "Admins manage all email_templates" ON public.email_templates
  FOR ALL USING (has_role(auth.uid(), 'admin'::user_role));

-- Storage bucket for listing images
INSERT INTO storage.buckets (id, name, public)
VALUES ('listing-images', 'listing-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read listing images" ON storage.objects
  FOR SELECT USING (bucket_id = 'listing-images');
CREATE POLICY "Authenticated upload listing images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'listing-images' AND auth.role() = 'authenticated');
CREATE POLICY "Authenticated update listing images" ON storage.objects
  FOR UPDATE USING (bucket_id = 'listing-images' AND auth.role() = 'authenticated');
CREATE POLICY "Authenticated delete listing images" ON storage.objects
  FOR DELETE USING (bucket_id = 'listing-images' AND auth.role() = 'authenticated');
