
ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS channel_manager_partner text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS external_listing_id text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS external_property_id text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS last_sync_at timestamptz DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS sync_status text DEFAULT 'not_connected',
  ADD COLUMN IF NOT EXISTS sync_error_message text DEFAULT NULL;
