-- Admin-only calendar events: meetings, visits, tasks, reminders,
-- rental checks, lead follow-ups. Check-in/Check-out come from bookings.

CREATE TABLE IF NOT EXISTS public.admin_calendar_events (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type   TEXT        NOT NULL CHECK (event_type IN (
                 'meeting', 'visit', 'task', 'reminder',
                 'udlejningstjek', 'lead_followup'
               )),
  title        TEXT        NOT NULL,
  event_date   DATE        NOT NULL,
  event_time   TIME,
  contact_name TEXT,
  notes        TEXT,
  created_by   UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_calendar_events_date
  ON public.admin_calendar_events (event_date);

CREATE INDEX IF NOT EXISTS idx_admin_calendar_events_type
  ON public.admin_calendar_events (event_type);

ALTER TABLE public.admin_calendar_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_calendar_events_admin_all"
  ON public.admin_calendar_events
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::user_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::user_role));

CREATE OR REPLACE FUNCTION public.set_updated_at_admin_calendar_events()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_admin_calendar_events_updated_at
  ON public.admin_calendar_events;

CREATE TRIGGER trg_admin_calendar_events_updated_at
  BEFORE UPDATE ON public.admin_calendar_events
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_admin_calendar_events();
