
-- 1. Extend user_role enum with new roles
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'super_admin';
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'team';
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'service_partner';
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'photographer';
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'cleaner';
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'guest';

-- 2. Owner onboarding tracking
CREATE TABLE public.owner_onboarding (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'lead',
  lead_source text,
  lead_created_at timestamptz DEFAULT now(),
  signup_started_at timestamptz,
  onboarding_completed_at timestamptz,
  agreement_generated_at timestamptz,
  agreement_signed_at timestamptz,
  profile_activated_at timestamptz,
  property_visit_scheduled_at timestamptz,
  keybox_installed_at timestamptz,
  listing_approved_at timestamptz,
  listing_published_at timestamptz,
  current_step text DEFAULT 'signup',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.owner_onboarding ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage all onboarding" ON public.owner_onboarding FOR ALL USING (has_role(auth.uid(), 'admin'::user_role));
CREATE POLICY "Owners view own onboarding" ON public.owner_onboarding FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "Owners update own onboarding" ON public.owner_onboarding FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Owners insert own onboarding" ON public.owner_onboarding FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE TRIGGER update_owner_onboarding_updated_at BEFORE UPDATE ON public.owner_onboarding FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 3. Support tickets
CREATE TABLE public.support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id uuid,
  requester_email text,
  requester_type text NOT NULL DEFAULT 'guest',
  booking_id uuid,
  property_id uuid,
  category text NOT NULL DEFAULT 'general',
  priority text NOT NULL DEFAULT 'normal',
  subject text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'open',
  assigned_to uuid,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage all tickets" ON public.support_tickets FOR ALL USING (has_role(auth.uid(), 'admin'::user_role));
CREATE POLICY "Users view own tickets" ON public.support_tickets FOR SELECT USING (auth.uid() = requester_id);
CREATE POLICY "Anyone can create tickets" ON public.support_tickets FOR INSERT WITH CHECK (true);

CREATE TRIGGER update_support_tickets_updated_at BEFORE UPDATE ON public.support_tickets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 4. Cleaning jobs
CREATE TABLE public.cleaning_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL,
  booking_id uuid,
  assigned_to uuid,
  scheduled_date date NOT NULL,
  job_type text NOT NULL DEFAULT 'post_checkout',
  status text NOT NULL DEFAULT 'pending',
  checklist jsonb DEFAULT '[]'::jsonb,
  photos jsonb DEFAULT '[]'::jsonb,
  notes text,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.cleaning_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage all cleaning_jobs" ON public.cleaning_jobs FOR ALL USING (has_role(auth.uid(), 'admin'::user_role));
CREATE POLICY "Assigned user views own jobs" ON public.cleaning_jobs FOR SELECT USING (auth.uid() = assigned_to);
CREATE POLICY "Owners view own property cleaning" ON public.cleaning_jobs FOR SELECT USING (property_id IN (SELECT id FROM properties WHERE owner_id = auth.uid()));

CREATE TRIGGER update_cleaning_jobs_updated_at BEFORE UPDATE ON public.cleaning_jobs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 5. Maintenance jobs
CREATE TABLE public.maintenance_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL,
  reported_by uuid,
  assigned_to uuid,
  category text NOT NULL DEFAULT 'general',
  priority text NOT NULL DEFAULT 'normal',
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'reported',
  photos jsonb DEFAULT '[]'::jsonb,
  cost_estimate numeric,
  actual_cost numeric,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.maintenance_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage all maintenance" ON public.maintenance_jobs FOR ALL USING (has_role(auth.uid(), 'admin'::user_role));
CREATE POLICY "Assigned user views own jobs" ON public.maintenance_jobs FOR SELECT USING (auth.uid() = assigned_to);
CREATE POLICY "Owners view own property maintenance" ON public.maintenance_jobs FOR SELECT USING (property_id IN (SELECT id FROM properties WHERE owner_id = auth.uid()));
CREATE POLICY "Anyone can report maintenance" ON public.maintenance_jobs FOR INSERT WITH CHECK (true);

CREATE TRIGGER update_maintenance_jobs_updated_at BEFORE UPDATE ON public.maintenance_jobs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 6. Keybox installations
CREATE TABLE public.keybox_installations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL,
  installed_by uuid,
  installation_date date,
  keybox_model text,
  keybox_location text,
  access_code text,
  photo_url text,
  status text NOT NULL DEFAULT 'pending',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.keybox_installations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage all keyboxes" ON public.keybox_installations FOR ALL USING (has_role(auth.uid(), 'admin'::user_role));
CREATE POLICY "Owners view own keybox" ON public.keybox_installations FOR SELECT USING (property_id IN (SELECT id FROM properties WHERE owner_id = auth.uid()));

CREATE TRIGGER update_keybox_installations_updated_at BEFORE UPDATE ON public.keybox_installations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 7. Notifications
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  channel text NOT NULL DEFAULT 'in_app',
  category text NOT NULL DEFAULT 'system',
  title text NOT NULL,
  body text,
  link text,
  is_read boolean NOT NULL DEFAULT false,
  read_at timestamptz,
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage all notifications" ON public.notifications FOR ALL USING (has_role(auth.uid(), 'admin'::user_role));
CREATE POLICY "Users view own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

-- 8. Check-in guides (per listing)
CREATE TABLE public.checkin_guides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL,
  owner_id uuid NOT NULL,
  arrival_instructions text,
  keybox_instructions text,
  access_code_note text,
  parking_info text,
  wifi_name text,
  wifi_password text,
  emergency_contact text,
  departure_checklist jsonb DEFAULT '[]'::jsonb,
  extra_info jsonb DEFAULT '[]'::jsonb,
  video_urls jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.checkin_guides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage all guides" ON public.checkin_guides FOR ALL USING (has_role(auth.uid(), 'admin'::user_role));
CREATE POLICY "Owners manage own guides" ON public.checkin_guides FOR ALL USING (auth.uid() = owner_id);
CREATE POLICY "Guests read guides for their booking" ON public.checkin_guides FOR SELECT USING (
  listing_id IN (
    SELECT property_id FROM bookings 
    WHERE guest_email = (SELECT email FROM profiles WHERE id = auth.uid() LIMIT 1)
    AND status IN ('confirmed', 'checked_in')
  )
);

CREATE TRIGGER update_checkin_guides_updated_at BEFORE UPDATE ON public.checkin_guides FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 9. Documents (owner-facing file archive)
CREATE TABLE public.documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  property_id uuid,
  booking_id uuid,
  document_type text NOT NULL DEFAULT 'other',
  title text NOT NULL,
  file_url text,
  file_size integer,
  mime_type text,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage all documents" ON public.documents FOR ALL USING (has_role(auth.uid(), 'admin'::user_role));
CREATE POLICY "Owners view own documents" ON public.documents FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "Owners insert own documents" ON public.documents FOR INSERT WITH CHECK (auth.uid() = owner_id);

-- 10. Owner bank/payment settings
CREATE TABLE public.owner_bank_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL UNIQUE,
  bank_name text,
  account_holder text,
  iban text,
  reg_number text,
  account_number text,
  swift_bic text,
  payout_frequency text DEFAULT 'monthly',
  preferred_currency text DEFAULT 'DKK',
  tax_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.owner_bank_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage all bank settings" ON public.owner_bank_settings FOR ALL USING (has_role(auth.uid(), 'admin'::user_role));
CREATE POLICY "Owners manage own bank settings" ON public.owner_bank_settings FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "Owners update own bank settings" ON public.owner_bank_settings FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Owners insert own bank settings" ON public.owner_bank_settings FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE TRIGGER update_owner_bank_settings_updated_at BEFORE UPDATE ON public.owner_bank_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 11. Notification preferences
CREATE TABLE public.notification_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  email_bookings boolean DEFAULT true,
  email_payouts boolean DEFAULT true,
  email_messages boolean DEFAULT true,
  email_marketing boolean DEFAULT false,
  sms_bookings boolean DEFAULT false,
  sms_urgent boolean DEFAULT true,
  push_enabled boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own preferences" ON public.notification_preferences FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Admins view all preferences" ON public.notification_preferences FOR SELECT USING (has_role(auth.uid(), 'admin'::user_role));

CREATE TRIGGER update_notification_preferences_updated_at BEFORE UPDATE ON public.notification_preferences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
