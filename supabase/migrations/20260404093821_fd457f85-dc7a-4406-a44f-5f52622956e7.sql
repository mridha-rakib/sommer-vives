
CREATE TABLE public.team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name text NOT NULL,
  email text NOT NULL,
  phone text,
  job_title text NOT NULL DEFAULT 'Udlejningsrådgiver',
  team_role text NOT NULL DEFAULT 'udlejningsraadgiver',
  is_active boolean NOT NULL DEFAULT true,
  invited_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage all team_members"
  ON public.team_members FOR ALL
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Team can view team_members"
  ON public.team_members FOR SELECT
  USING (has_role(auth.uid(), 'team'));

-- Seed Emil as first team member
INSERT INTO public.team_members (user_id, full_name, email, phone, job_title, team_role)
VALUES (
  '74a122fb-b6fc-48bc-8cee-944801ee2448',
  'Emil Klockmann',
  'ek@klockmann.dk',
  NULL,
  'Udlejningschef',
  'udlejningschef'
);
