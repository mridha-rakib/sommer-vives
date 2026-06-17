
INSERT INTO public.properties (id, owner_id, title, address, region, capacity, bedrooms, bathrooms, status, setup_status)
SELECT l.id, l.owner_id,
       COALESCE(NULLIF(l.name, ''), 'Listing'),
       COALESCE(NULLIF(l.address, ''), 'TBD'),
       COALESCE(NULLIF(l.region, ''), 'Danmark'),
       GREATEST(COALESCE(l.max_guests, 4), 1),
       GREATEST(COALESCE(l.bedrooms, 1), 1),
       GREATEST(COALESCE(l.bathrooms, 1), 1),
       CASE WHEN l.is_active THEN 'published' ELSE 'draft' END,
       'new'
FROM public.listings l
WHERE NOT EXISTS (SELECT 1 FROM public.properties p WHERE p.id = l.id)
  AND EXISTS (SELECT 1 FROM auth.users u WHERE u.id = l.owner_id);

CREATE OR REPLACE FUNCTION public.sync_listing_to_property()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.owner_id IS NULL OR NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = NEW.owner_id) THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.properties (id, owner_id, title, address, region, capacity, bedrooms, bathrooms, status, setup_status)
  VALUES (
    NEW.id, NEW.owner_id,
    COALESCE(NULLIF(NEW.name, ''), 'Listing'),
    COALESCE(NULLIF(NEW.address, ''), 'TBD'),
    COALESCE(NULLIF(NEW.region, ''), 'Danmark'),
    GREATEST(COALESCE(NEW.max_guests, 4), 1),
    GREATEST(COALESCE(NEW.bedrooms, 1), 1),
    GREATEST(COALESCE(NEW.bathrooms, 1), 1),
    CASE WHEN NEW.is_active THEN 'published' ELSE 'draft' END,
    'new'
  )
  ON CONFLICT (id) DO UPDATE
    SET owner_id = EXCLUDED.owner_id,
        title    = EXCLUDED.title,
        address  = EXCLUDED.address,
        region   = EXCLUDED.region,
        capacity = EXCLUDED.capacity,
        bedrooms = EXCLUDED.bedrooms,
        bathrooms= EXCLUDED.bathrooms,
        status   = EXCLUDED.status,
        updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_listing_to_property ON public.listings;
CREATE TRIGGER trg_sync_listing_to_property
AFTER INSERT OR UPDATE ON public.listings
FOR EACH ROW EXECUTE FUNCTION public.sync_listing_to_property();
