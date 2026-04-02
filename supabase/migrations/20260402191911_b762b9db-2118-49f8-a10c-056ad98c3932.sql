
CREATE TYPE public.task_priority AS ENUM ('low', 'normal', 'high', 'urgent');
CREATE TYPE public.task_status AS ENUM ('not_started', 'in_progress', 'waiting', 'done');
CREATE TYPE public.task_source AS ENUM ('manual', 'system');
CREATE TYPE public.task_linked_type AS ENUM ('lead', 'owner', 'guest', 'listing', 'document', 'meeting', 'booking');

CREATE TABLE public.system_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  linked_type task_linked_type,
  linked_id UUID,
  linked_name TEXT,
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_name TEXT,
  priority task_priority NOT NULL DEFAULT 'normal',
  status task_status NOT NULL DEFAULT 'not_started',
  source task_source NOT NULL DEFAULT 'manual',
  due_date DATE,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.system_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage all system_tasks" ON public.system_tasks
  FOR ALL TO public USING (has_role(auth.uid(), 'admin'::user_role));

CREATE POLICY "Team view system_tasks" ON public.system_tasks
  FOR SELECT TO public USING (has_role(auth.uid(), 'team'::user_role));

CREATE TRIGGER update_system_tasks_updated_at
  BEFORE UPDATE ON public.system_tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
