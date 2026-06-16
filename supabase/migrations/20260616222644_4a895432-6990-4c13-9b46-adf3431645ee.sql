
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_account_type text;
  v_role public.user_role;
BEGIN
  v_account_type := lower(coalesce(new.raw_user_meta_data ->> 'account_type', 'owner'));

  IF v_account_type = 'guest' THEN
    v_role := 'guest';
  ELSIF v_account_type = 'admin' THEN
    v_role := 'admin';
  ELSE
    v_role := 'owner';
  END IF;

  INSERT INTO public.profiles (id, email, full_name)
  VALUES (new.id, new.email, new.raw_user_meta_data ->> 'full_name')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, v_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN new;
END;
$function$;

-- Clean up any existing guest accounts that were wrongly granted owner role
DELETE FROM public.user_roles ur
USING auth.users u
WHERE ur.user_id = u.id
  AND ur.role = 'owner'
  AND lower(coalesce(u.raw_user_meta_data ->> 'account_type','')) = 'guest'
  AND EXISTS (
    SELECT 1 FROM public.user_roles ur2
    WHERE ur2.user_id = ur.user_id AND ur2.role = 'guest'
  );

-- For guests that don't yet have the guest role, add it
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'guest'::public.user_role
FROM auth.users u
WHERE lower(coalesce(u.raw_user_meta_data ->> 'account_type','')) = 'guest'
ON CONFLICT (user_id, role) DO NOTHING;

-- Then remove the owner role from those guests
DELETE FROM public.user_roles ur
USING auth.users u
WHERE ur.user_id = u.id
  AND ur.role = 'owner'
  AND lower(coalesce(u.raw_user_meta_data ->> 'account_type','')) = 'guest';
