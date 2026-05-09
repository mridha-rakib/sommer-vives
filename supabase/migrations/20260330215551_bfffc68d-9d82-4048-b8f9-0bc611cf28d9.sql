
-- Create leads table for tracking potential homeowners
CREATE TABLE public.leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  source TEXT NOT NULL DEFAULT 'website',
  status TEXT NOT NULL DEFAULT 'new',
  region TEXT,
  property_type TEXT,
  notes TEXT,
  assigned_to TEXT,
  next_step TEXT,
  next_step_date DATE,
  converted_owner_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage all leads" ON public.leads FOR ALL USING (has_role(auth.uid(), 'admin'::user_role));
CREATE POLICY "Team members view leads" ON public.leads FOR SELECT USING (has_role(auth.uid(), 'team'::user_role));

CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON public.leads FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create service_partners table
CREATE TABLE public.service_partners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  partner_type TEXT NOT NULL DEFAULT 'cleaner',
  status TEXT NOT NULL DEFAULT 'active',
  region TEXT,
  notes TEXT,
  assigned_properties UUID[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.service_partners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage all service_partners" ON public.service_partners FOR ALL USING (has_role(auth.uid(), 'admin'::user_role));
CREATE POLICY "Partners view own profile" ON public.service_partners FOR SELECT USING (true);

CREATE TRIGGER update_service_partners_updated_at BEFORE UPDATE ON public.service_partners FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create cms_content table for managing website content
CREATE TABLE public.cms_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  section TEXT NOT NULL,
  content_key TEXT NOT NULL,
  content_value JSONB NOT NULL DEFAULT '{}',
  is_published BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(section, content_key)
);

ALTER TABLE public.cms_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage all cms_content" ON public.cms_content FOR ALL USING (has_role(auth.uid(), 'admin'::user_role));
CREATE POLICY "Public read published cms_content" ON public.cms_content FOR SELECT USING (is_published = true);

CREATE TRIGGER update_cms_content_updated_at BEFORE UPDATE ON public.cms_content FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create automation_rules table
CREATE TABLE public.automation_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  trigger_type TEXT NOT NULL DEFAULT 'event',
  trigger_event TEXT NOT NULL,
  action_type TEXT NOT NULL DEFAULT 'email',
  action_config JSONB NOT NULL DEFAULT '{}',
  delay_minutes INTEGER DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_triggered_at TIMESTAMP WITH TIME ZONE,
  trigger_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.automation_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage all automation_rules" ON public.automation_rules FOR ALL USING (has_role(auth.uid(), 'admin'::user_role));

CREATE TRIGGER update_automation_rules_updated_at BEFORE UPDATE ON public.automation_rules FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
