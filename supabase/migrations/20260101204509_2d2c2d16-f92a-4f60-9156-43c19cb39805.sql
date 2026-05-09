
-- Platform settings table (admin-controlled)
CREATE TABLE public.platform_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value jsonb NOT NULL,
  description text,
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage settings"
  ON public.platform_settings FOR ALL
  USING (has_role(auth.uid(), 'admin'::user_role));

CREATE POLICY "Anyone can read settings"
  ON public.platform_settings FOR SELECT
  USING (true);

-- Insert default settings
INSERT INTO public.platform_settings (key, value, description) VALUES
  ('commission_rate', '20', 'Commission percentage taken from bookings'),
  ('guest_service_fee', '5', 'Service fee percentage charged to guests'),
  ('marketing_processing_days', '{"min": 1, "max": 4}', 'Business days to process marketing'),
  ('tax_free_amount', '42300', 'Annual tax-free rental income in DKK');

-- Service packages table
CREATE TABLE public.service_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  price numeric NOT NULL,
  features jsonb DEFAULT '[]'::jsonb,
  category text NOT NULL, -- 'marketing', 'photo', 'premium'
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.service_packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active packages"
  ON public.service_packages FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage packages"
  ON public.service_packages FOR ALL
  USING (has_role(auth.uid(), 'admin'::user_role));

-- Insert default packages
INSERT INTO public.service_packages (name, description, price, features, category, sort_order) VALUES
  ('Basis Markedsføring', 'Synlighed på alle danske portaler', 0, '["Annoncering på alle portaler", "Professionel annoncetekst", "Søgeoptimering"]', 'marketing', 1),
  ('Premium Markedsføring', 'Ekstra synlighed og fremhævet placering', 1499, '["Alt fra Basis", "Fremhævet i søgeresultater", "Social media kampagne", "Nyhedsbrev feature"]', 'marketing', 2),
  ('Elite Markedsføring', 'Maksimal eksponering', 2999, '["Alt fra Premium", "Google Ads kampagne", "Prioriteret support", "Månedlig performance rapport"]', 'marketing', 3),
  ('Professionelle Fotos', 'Professionel fotograf til dit sommerhus', 2499, '["Op til 30 professionelle fotos", "HDR teknik", "Redigering inkluderet", "Levering inden 5 dage"]', 'photo', 1),
  ('Drone Optagelser', 'Luftfotos og video af din ejendom', 1999, '["4K dronefotos", "Aerial video clip", "Professionel pilot", "Levering inden 5 dage"]', 'photo', 2),
  ('Foto + Drone Pakke', 'Komplet visuel pakke', 3999, '["Alt fra begge pakker", "Virtual tour", "15% rabat"]', 'photo', 3);

-- Package purchases table
CREATE TABLE public.package_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id uuid REFERENCES public.properties(id) ON DELETE SET NULL,
  package_id uuid NOT NULL REFERENCES public.service_packages(id),
  status text DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'cancelled'
  payment_status text DEFAULT 'pending', -- 'pending', 'paid', 'refunded'
  amount numeric NOT NULL,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  completed_at timestamp with time zone
);

ALTER TABLE public.package_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can view own purchases"
  ON public.package_purchases FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "Owners can create purchases"
  ON public.package_purchases FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Admins can manage all purchases"
  ON public.package_purchases FOR ALL
  USING (has_role(auth.uid(), 'admin'::user_role));

-- Seasonal/daily pricing table
CREATE TABLE public.property_pricing (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  start_date date NOT NULL,
  end_date date NOT NULL,
  price_per_night numeric NOT NULL,
  min_nights integer DEFAULT 1,
  notes text,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.property_pricing ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view pricing"
  ON public.property_pricing FOR SELECT
  USING (true);

CREATE POLICY "Owners can manage own property pricing"
  ON public.property_pricing FOR ALL
  USING (
    property_id IN (
      SELECT id FROM public.properties WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all pricing"
  ON public.property_pricing FOR ALL
  USING (has_role(auth.uid(), 'admin'::user_role));

-- Add RLS policy for published properties to be viewable by everyone
CREATE POLICY "Anyone can view published properties"
  ON public.properties FOR SELECT
  USING (status = 'published');
