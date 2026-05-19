-- Assign portal roles from signup metadata instead of defaulting every new
-- account to owner. Public metadata may choose only guest/owner; admin roles
-- must still be managed by admins through user_roles.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  requested_role public.user_role := 'owner'::public.user_role;
BEGIN
  IF lower(coalesce(new.raw_user_meta_data ->> 'account_type', '')) = 'guest' THEN
    requested_role := 'guest'::public.user_role;
  END IF;

  INSERT INTO public.profiles (id, email, full_name)
  VALUES (new.id, new.email, new.raw_user_meta_data ->> 'full_name')
  ON CONFLICT (id) DO UPDATE SET
    email = excluded.email,
    full_name = coalesce(excluded.full_name, public.profiles.full_name),
    updated_at = now();

  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, requested_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN new;
END;
$$;

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'guest'::public.user_role
FROM auth.users
WHERE lower(coalesce(raw_user_meta_data ->> 'account_type', '')) = 'guest'
ON CONFLICT (user_id, role) DO NOTHING;

DELETE FROM public.user_roles ur
USING auth.users au
WHERE ur.user_id = au.id
  AND ur.role = 'owner'::public.user_role
  AND lower(coalesce(au.raw_user_meta_data ->> 'account_type', '')) = 'guest'
  AND EXISTS (
    SELECT 1
    FROM public.user_roles guest_role
    WHERE guest_role.user_id = au.id
      AND guest_role.role = 'guest'::public.user_role
  );
