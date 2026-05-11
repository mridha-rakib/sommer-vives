-- Complete listing-management gaps: uploaded videos, sync conflict storage,
-- and durable Beds24 publish metadata.

ALTER TABLE public.listing_videos
  ADD COLUMN IF NOT EXISTS video_url text,
  ADD COLUMN IF NOT EXISTS video_type text NOT NULL DEFAULT 'youtube',
  ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

CREATE OR REPLACE TRIGGER update_listing_videos_updated_at
  BEFORE UPDATE ON public.listing_videos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_listing_videos_active_order
  ON public.listing_videos(listing_id, is_active, sort_order);

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'listing-videos',
  'listing-videos',
  true,
  524288000,
  ARRAY['video/mp4', 'video/webm', 'video/quicktime', 'video/x-m4v']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Public read listing videos" ON storage.objects;
CREATE POLICY "Public read listing videos" ON storage.objects
  FOR SELECT USING (bucket_id = 'listing-videos');

DROP POLICY IF EXISTS "Authenticated upload listing videos" ON storage.objects;
CREATE POLICY "Authenticated upload listing videos" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'listing-videos' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated update listing videos" ON storage.objects;
CREATE POLICY "Authenticated update listing videos" ON storage.objects
  FOR UPDATE USING (bucket_id = 'listing-videos' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated delete listing videos" ON storage.objects;
CREATE POLICY "Authenticated delete listing videos" ON storage.objects
  FOR DELETE USING (bucket_id = 'listing-videos' AND auth.role() = 'authenticated');

ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS beds24_last_publish_payload jsonb,
  ADD COLUMN IF NOT EXISTS beds24_last_response jsonb,
  ADD COLUMN IF NOT EXISTS beds24_last_channels text[] DEFAULT '{}'::text[];
