
-- Pipeline task templates table
CREATE TABLE public.pipeline_task_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stage text NOT NULL,
  title text NOT NULL,
  description text,
  priority task_priority NOT NULL DEFAULT 'normal',
  due_days int NOT NULL DEFAULT 7,
  sort_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.pipeline_task_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage pipeline task templates"
  ON public.pipeline_task_templates FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated users can view pipeline task templates"
  ON public.pipeline_task_templates FOR SELECT TO authenticated
  USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_pipeline_task_templates_updated_at
  BEFORE UPDATE ON public.pipeline_task_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to generate tasks from templates when stage changes
CREATE OR REPLACE FUNCTION public.generate_stage_tasks(
  p_listing_id uuid,
  p_listing_name text,
  p_stage text,
  p_assigned_to uuid DEFAULT NULL,
  p_assigned_name text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  tmpl RECORD;
BEGIN
  -- Don't create duplicate tasks for same listing+stage
  IF EXISTS (
    SELECT 1 FROM system_tasks 
    WHERE linked_type = 'listing' 
      AND linked_id = p_listing_id 
      AND category = p_stage
    LIMIT 1
  ) THEN
    RETURN;
  END IF;

  FOR tmpl IN 
    SELECT title, description, priority, due_days, sort_order
    FROM pipeline_task_templates
    WHERE stage = p_stage AND is_active = true
    ORDER BY sort_order
  LOOP
    INSERT INTO system_tasks (
      title, description, linked_type, linked_id, linked_name,
      assigned_to, assigned_name, priority, status, source, due_date, category
    ) VALUES (
      tmpl.title,
      tmpl.description,
      'listing',
      p_listing_id,
      p_listing_name,
      p_assigned_to,
      p_assigned_name,
      tmpl.priority,
      'not_started',
      'system',
      CURRENT_DATE + tmpl.due_days,
      p_stage
    );
  END LOOP;
END;
$$;

-- Add category column to system_tasks if not exists
ALTER TABLE public.system_tasks ADD COLUMN IF NOT EXISTS category text;
