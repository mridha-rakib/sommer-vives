-- Add owner detail fields to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS cpr_number text,
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS country text DEFAULT 'Danmark';

-- Standard document templates
CREATE TABLE public.document_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL DEFAULT 'standard',
  body_html text NOT NULL DEFAULT '',
  body_text text NOT NULL DEFAULT '',
  placeholders jsonb NOT NULL DEFAULT '[]',
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.document_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage all document_templates" ON public.document_templates FOR ALL USING (has_role(auth.uid(), 'admin'::user_role));
CREATE POLICY "Public read active document_templates" ON public.document_templates FOR SELECT USING (is_active = true);

-- Per-sag document instances
CREATE TABLE public.sag_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL,
  template_id uuid REFERENCES public.document_templates(id),
  owner_id uuid NOT NULL,
  title text NOT NULL,
  category text NOT NULL DEFAULT 'standard',
  body_html text NOT NULL DEFAULT '',
  custom_values jsonb NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'draft',
  sent_at timestamptz,
  signed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.sag_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage all sag_documents" ON public.sag_documents FOR ALL USING (has_role(auth.uid(), 'admin'::user_role));
CREATE POLICY "Owners view own sag_documents" ON public.sag_documents FOR SELECT USING (auth.uid() = owner_id);

-- Seed standard templates
INSERT INTO public.document_templates (name, category, body_html, body_text, placeholders, sort_order) VALUES
('Formidlingsaftale', 'aftale', 
 '<h1>Formidlingsaftale</h1><p>Mellem <strong>SommerVibes ApS</strong> og <strong>{{owner_name}}</strong></p><p>Ejendom: {{property_name}}, {{property_address}}</p><h2>§4 — Kommission</h2><p>Kommission: <strong>{{commission_percent}}%</strong> af lejeindtægt ekskl. rengøring.</p><p>Bindingsperiode: {{binding_months}} måneder.</p><p>Opsigelse: {{notice_days}} dages varsel.</p>',
 'Formidlingsaftale mellem SommerVibes ApS og {{owner_name}}. Kommission: {{commission_percent}}%.',
 '["owner_name","owner_email","owner_phone","owner_address","owner_cpr","property_name","property_address","commission_percent","binding_months","notice_days"]',
 1),
('Persondatabilag', 'aftale',
 '<h1>Persondatabilag</h1><p>Dataansvarlig: SommerVibes ApS</p><p>Registreret: {{owner_name}}, CPR: {{owner_cpr}}</p><p>Vi behandler persondata i overensstemmelse med GDPR.</p>',
 'Persondatabilag for {{owner_name}}.',
 '["owner_name","owner_cpr","owner_email"]',
 2),
('Velkommen til SommerVibes', 'standard',
 '<h1>Velkommen til SommerVibes</h1><p>Kære {{owner_name}},</p><p>Vi er glade for at byde dig velkommen som udlejer hos SommerVibes. Her er en kort introduktion til hvordan vi arbejder sammen.</p>',
 'Velkommen til SommerVibes, {{owner_name}}.',
 '["owner_name"]',
 3),
('Skab merudlejning gratis', 'standard',
 '<h1>Skab merudlejning – gratis</h1><p>Kære {{owner_name}},</p><p>Her er vores bedste tips til at maksimere din udlejning og indtjening med SommerVibes.</p>',
 'Tips til merudlejning for {{owner_name}}.',
 '["owner_name"]',
 4);