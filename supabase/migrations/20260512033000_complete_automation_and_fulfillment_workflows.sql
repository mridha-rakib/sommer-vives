CREATE TABLE IF NOT EXISTS public.automation_executions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  automation_rule_id uuid NOT NULL REFERENCES public.automation_rules(id) ON DELETE CASCADE,
  trigger_event text NOT NULL,
  event_id text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'skipped')),
  scheduled_for timestamptz NOT NULL DEFAULT now(),
  executed_at timestamptz,
  error text,
  result jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS automation_executions_rule_event_id_unique
  ON public.automation_executions (automation_rule_id, event_id)
  WHERE event_id IS NOT NULL;

ALTER TABLE public.automation_executions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage all automation_executions" ON public.automation_executions;
CREATE POLICY "Admins manage all automation_executions"
  ON public.automation_executions FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::public.user_role));

DROP TRIGGER IF EXISTS update_automation_executions_updated_at ON public.automation_executions;
CREATE TRIGGER update_automation_executions_updated_at
  BEFORE UPDATE ON public.automation_executions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.increment_automation_rule_trigger(p_rule_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.automation_rules
  SET
    trigger_count = trigger_count + 1,
    last_triggered_at = now()
  WHERE id = p_rule_id;
$$;

CREATE TABLE IF NOT EXISTS public.order_fulfillments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  order_item_id uuid NOT NULL REFERENCES public.order_items(id) ON DELETE CASCADE,
  booking_id uuid REFERENCES public.bookings(id) ON DELETE SET NULL,
  package_purchase_id uuid REFERENCES public.package_purchases(id) ON DELETE SET NULL,
  user_type text NOT NULL DEFAULT 'guest',
  item_type text NOT NULL,
  reference_id uuid,
  label text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'in_progress', 'completed', 'cancelled')),
  assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  due_date date,
  completed_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(order_item_id)
);

CREATE INDEX IF NOT EXISTS idx_order_fulfillments_order_id ON public.order_fulfillments(order_id);
CREATE INDEX IF NOT EXISTS idx_order_fulfillments_booking_id ON public.order_fulfillments(booking_id);
CREATE INDEX IF NOT EXISTS idx_order_fulfillments_status ON public.order_fulfillments(status);

ALTER TABLE public.order_fulfillments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage all order_fulfillments" ON public.order_fulfillments;
CREATE POLICY "Admins manage all order_fulfillments"
  ON public.order_fulfillments FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::public.user_role));

DROP POLICY IF EXISTS "Owners view own order_fulfillments" ON public.order_fulfillments;
CREATE POLICY "Owners view own order_fulfillments"
  ON public.order_fulfillments FOR SELECT
  USING (
    order_id IN (
      SELECT id FROM public.orders WHERE user_id = auth.uid() AND user_type = 'owner'
    )
  );

DROP TRIGGER IF EXISTS update_order_fulfillments_updated_at ON public.order_fulfillments;
CREATE TRIGGER update_order_fulfillments_updated_at
  BEFORE UPDATE ON public.order_fulfillments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
