
-- Agreement templates table for template-driven document generation
CREATE TABLE public.agreement_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  version text NOT NULL DEFAULT '1.0',
  body_html text NOT NULL DEFAULT '',
  body_text text NOT NULL DEFAULT '',
  is_active boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.agreement_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage all templates"
  ON public.agreement_templates FOR ALL
  USING (has_role(auth.uid(), 'admin'::user_role));

CREATE POLICY "Public read active templates"
  ON public.agreement_templates FOR SELECT
  USING (is_active = true);

-- Add status tracking columns to agreements
ALTER TABLE public.agreements
  ADD COLUMN IF NOT EXISTS template_id uuid REFERENCES public.agreement_templates(id),
  ADD COLUMN IF NOT EXISTS generated_body text,
  ADD COLUMN IF NOT EXISTS signature_data_url text,
  ADD COLUMN IF NOT EXISTS viewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS sent_at timestamptz;

-- Update trigger
CREATE TRIGGER update_agreement_templates_updated_at
  BEFORE UPDATE ON public.agreement_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
