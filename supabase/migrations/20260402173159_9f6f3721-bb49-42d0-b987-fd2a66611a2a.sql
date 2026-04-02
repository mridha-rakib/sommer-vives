
ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS channel_airbnb_highlights text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS channel_airbnb_image_order text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS channel_airbnb_house_rules text,
  ADD COLUMN IF NOT EXISTS channel_airbnb_checkin_notes text,
  ADD COLUMN IF NOT EXISTS channel_booking_room_setup text,
  ADD COLUMN IF NOT EXISTS channel_booking_facilities_mapping jsonb DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS channel_booking_policies text,
  ADD COLUMN IF NOT EXISTS channel_booking_checkin_checkout text,
  ADD COLUMN IF NOT EXISTS channel_vrbo_highlights text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS channel_vrbo_rules text,
  ADD COLUMN IF NOT EXISTS channel_vrbo_photo_order text[] DEFAULT '{}';
