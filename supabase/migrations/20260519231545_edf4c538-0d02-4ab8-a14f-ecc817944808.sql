CREATE TABLE IF NOT EXISTS public.automation_executions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  automation_rule_id uuid NOT NULL,
  trigger_event text,
  event_id text,
  payload jsonb,
  status text NOT NULL DEFAULT 'pending',
  scheduled_for timestamp with time zone,
  executed_at timestamp with time zone,
  error text,
  result jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);