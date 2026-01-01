
-- Create booking status enum
CREATE TYPE public.booking_status AS ENUM ('pending', 'confirmed', 'checked_in', 'completed', 'cancelled');

-- Create source channel enum
CREATE TYPE public.source_channel AS ENUM ('direct', 'airbnb', 'booking_com', 'vrbo', 'other');

-- Create commission type enum
CREATE TYPE public.commission_type AS ENUM ('platform', 'sales_meeting');

-- Function to generate case numbers
CREATE OR REPLACE FUNCTION public.generate_case_number(prefix text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_year text;
  next_seq int;
  case_table text;
BEGIN
  current_year := to_char(now(), 'YYYY');
  
  -- Get sequence based on prefix
  EXECUTE format(
    'SELECT COALESCE(MAX(CAST(SUBSTRING(case_number FROM ''[0-9]+$'') AS INT)), 0) + 1 
     FROM %I 
     WHERE case_number LIKE $1',
    CASE prefix
      WHEN 'HOU' THEN 'properties'
      WHEN 'BKG' THEN 'bookings'
      WHEN 'GST' THEN 'guests'
      WHEN 'OWN' THEN 'profiles'
      ELSE 'bookings'
    END
  ) INTO next_seq USING prefix || '-' || current_year || '-%';
  
  RETURN prefix || '-' || current_year || '-' || LPAD(next_seq::text, 6, '0');
END;
$$;

-- Add case_number to properties
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS case_number text UNIQUE;

-- Add case_number to profiles (for owners)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS case_number text UNIQUE;

-- Create guests table
CREATE TABLE public.guests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_number text UNIQUE,
  email text NOT NULL,
  name text NOT NULL,
  phone text,
  password_hash text,
  gdpr_consent boolean DEFAULT false,
  gdpr_consent_date timestamp with time zone,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create bookings table
CREATE TABLE public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_number text UNIQUE,
  property_id uuid REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
  owner_id uuid REFERENCES public.profiles(id) NOT NULL,
  guest_id uuid REFERENCES public.guests(id),
  source_channel source_channel DEFAULT 'direct',
  status booking_status DEFAULT 'pending',
  check_in date NOT NULL,
  check_out date NOT NULL,
  nights integer GENERATED ALWAYS AS (check_out - check_in) STORED,
  guests_count integer DEFAULT 1,
  base_price numeric(10,2) NOT NULL,
  cleaning_fee numeric(10,2) DEFAULT 0,
  service_fee numeric(10,2) DEFAULT 0,
  total_amount numeric(10,2) NOT NULL,
  currency text DEFAULT 'DKK',
  platform_fee_percent numeric(5,2) DEFAULT 15,
  platform_earnings numeric(10,2),
  owner_payout numeric(10,2),
  guest_name text,
  guest_email text,
  guest_phone text,
  notes text,
  internal_notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create audit_log table
CREATE TABLE public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id uuid,
  actor_email text,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  entity_case_number text,
  before_data jsonb,
  after_data jsonb,
  ip_address text,
  created_at timestamp with time zone DEFAULT now()
);

-- Create chat_messages table
CREATE TABLE public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_type text NOT NULL, -- 'guest_platform', 'owner_platform'
  booking_id uuid REFERENCES public.bookings(id) ON DELETE CASCADE,
  sender_type text NOT NULL, -- 'admin', 'owner', 'guest'
  sender_id uuid,
  sender_name text,
  message text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

-- Create damage_pool table
CREATE TABLE public.damage_pool (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES public.bookings(id) ON DELETE CASCADE NOT NULL,
  amount numeric(10,2) NOT NULL,
  percentage numeric(5,2) DEFAULT 3,
  description text,
  created_at timestamp with time zone DEFAULT now()
);

-- Create commission_splits table
CREATE TABLE public.commission_splits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
  commission_type commission_type NOT NULL,
  ek_percentage numeric(5,2) NOT NULL,
  erik_percentage numeric(5,2) NOT NULL,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(property_id)
);

-- Enable RLS on all new tables
ALTER TABLE public.guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.damage_pool ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commission_splits ENABLE ROW LEVEL SECURITY;

-- Guests policies
CREATE POLICY "Admins can manage all guests" ON public.guests FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Guests can view own profile" ON public.guests FOR SELECT USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- Bookings policies
CREATE POLICY "Admins can manage all bookings" ON public.bookings FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Owners can view own bookings" ON public.bookings FOR SELECT USING (owner_id = auth.uid());
CREATE POLICY "Anyone can create bookings" ON public.bookings FOR INSERT WITH CHECK (true);

-- Audit log policies
CREATE POLICY "Admins can view all audit logs" ON public.audit_log FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can create audit logs" ON public.audit_log FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));

-- Chat messages policies
CREATE POLICY "Admins can manage all messages" ON public.chat_messages FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Owners can view own booking messages" ON public.chat_messages FOR SELECT 
  USING (booking_id IN (SELECT id FROM public.bookings WHERE owner_id = auth.uid()));

-- Damage pool policies
CREATE POLICY "Admins can manage damage pool" ON public.damage_pool FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Owners can view own damage pool" ON public.damage_pool FOR SELECT 
  USING (booking_id IN (SELECT id FROM public.bookings WHERE owner_id = auth.uid()));

-- Commission splits policies
CREATE POLICY "Admins can manage commission splits" ON public.commission_splits FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Owners can view own commission splits" ON public.commission_splits FOR SELECT 
  USING (property_id IN (SELECT id FROM public.properties WHERE owner_id = auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_guests_updated_at BEFORE UPDATE ON public.guests 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON public.bookings 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_commission_splits_updated_at BEFORE UPDATE ON public.commission_splits 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to auto-generate case numbers
CREATE OR REPLACE FUNCTION public.set_booking_case_number()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.case_number IS NULL THEN
    NEW.case_number := generate_case_number('BKG');
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_guest_case_number()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.case_number IS NULL THEN
    NEW.case_number := generate_case_number('GST');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_booking_case_number_trigger
  BEFORE INSERT ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.set_booking_case_number();

CREATE TRIGGER set_guest_case_number_trigger
  BEFORE INSERT ON public.guests
  FOR EACH ROW EXECUTE FUNCTION public.set_guest_case_number();

-- Enable realtime for bookings and chat
ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
