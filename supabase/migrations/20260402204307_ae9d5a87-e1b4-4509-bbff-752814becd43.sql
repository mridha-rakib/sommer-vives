
ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS draft_content jsonb DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS published_at timestamptz DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS revision_history jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS location_title text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS location_description text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS getting_around text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS video_url text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS video_url_en text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS video_url_de text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS combo_hero_images text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS teaser text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS max_nights integer DEFAULT NULL;
