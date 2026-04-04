
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
      CURRENT_DATE,
      p_stage
    );
  END LOOP;
END;
$$;
