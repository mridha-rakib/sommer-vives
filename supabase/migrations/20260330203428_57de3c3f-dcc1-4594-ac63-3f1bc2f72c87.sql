
-- Agreements table for mediation contracts
CREATE TABLE public.agreements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  property_id uuid REFERENCES public.properties(id) ON DELETE SET NULL,
  version text NOT NULL DEFAULT '1.0',
  status text NOT NULL DEFAULT 'draft',
  
  -- Owner data snapshot
  owner_name text,
  owner_email text,
  owner_phone text,
  owner_address text,
  
  -- Property data snapshot
  property_title text,
  property_address text,
  property_region text,
  
  -- Terms
  commission_percent numeric NOT NULL DEFAULT 15,
  binding_months integer NOT NULL DEFAULT 6,
  notice_days integer NOT NULL DEFAULT 30,
  
  -- Signature
  signature_name text,
  signature_date date,
  signed_at timestamptz,
  ip_address text,
  
  -- Consent
  accept_terms boolean DEFAULT false,
  accept_privacy boolean DEFAULT false,
  accept_marketing boolean DEFAULT false,
  
  -- Document
  pdf_url text,
  
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.agreements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can view own agreements" ON public.agreements
  FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Owners can create own agreements" ON public.agreements
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update own agreements" ON public.agreements
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Admins manage all agreements" ON public.agreements
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_agreements_updated_at
  BEFORE UPDATE ON public.agreements
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
