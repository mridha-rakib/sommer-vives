
CREATE OR REPLACE FUNCTION public.complete_get_started_onboarding(
  p_owner_name text,
  p_owner_email text,
  p_owner_phone text,
  p_owner_address text,
  p_owner_postal text,
  p_owner_city text,
  p_preferred_contact text,
  p_property_address text,
  p_region text,
  p_property_type text,
  p_capacity integer,
  p_bedrooms integer,
  p_bathrooms integer,
  p_facilities text[],
  p_start_time text,
  p_help_level text,
  p_self_manage text[],
  p_has_cleaning text,
  p_property_ready text,
  p_relevant_services text[],
  p_has_keybox text,
  p_has_experience text,
  p_existing_link text,
  p_accept_terms boolean,
  p_accept_privacy boolean,
  p_accept_marketing boolean,
  p_signature_name text,
  p_signature_date text,
  p_lead_source text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner_id uuid := auth.uid();
  v_property_id uuid;
  v_agreement_id uuid;
  v_onboarding_id uuid;
  v_lead_id uuid;
  v_full_address text;
  v_sig_date date;
BEGIN
  IF v_owner_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  v_full_address := trim(both ' ' FROM concat_ws(', ',
    NULLIF(p_owner_address,''),
    NULLIF(trim(concat_ws(' ', NULLIF(p_owner_postal,''), NULLIF(p_owner_city,''))),'')
  ));

  BEGIN
    v_sig_date := p_signature_date::date;
  EXCEPTION WHEN others THEN
    v_sig_date := CURRENT_DATE;
  END;

  -- Update profile
  UPDATE public.profiles
  SET full_name = COALESCE(NULLIF(p_owner_name,''), full_name),
      email = COALESCE(NULLIF(p_owner_email,''), email),
      phone = COALESCE(NULLIF(p_owner_phone,''), phone),
      address = COALESCE(NULLIF(v_full_address,''), address)
  WHERE id = v_owner_id;

  -- Create property
  INSERT INTO public.properties (
    owner_id, title, address, region, capacity, bedrooms, bathrooms,
    amenities, status, setup_status, description
  ) VALUES (
    v_owner_id,
    COALESCE(NULLIF(p_property_type,''), 'Sommerhus') || ' i ' || COALESCE(NULLIF(p_region,''), 'Danmark'),
    COALESCE(NULLIF(p_property_address,''), 'TBD'),
    COALESCE(NULLIF(p_region,''), 'Danmark'),
    GREATEST(COALESCE(p_capacity,4),1),
    GREATEST(COALESCE(p_bedrooms,1),1),
    GREATEST(COALESCE(p_bathrooms,1),1),
    COALESCE(p_facilities, '{}'),
    'draft',
    'new',
    NULL
  ) RETURNING id INTO v_property_id;

  -- Create agreement
  INSERT INTO public.agreements (
    owner_id, property_id, status,
    owner_name, owner_email, owner_phone, owner_address,
    property_title, property_address, property_region,
    signature_name, signature_date, signed_at,
    accept_terms, accept_privacy, accept_marketing
  ) VALUES (
    v_owner_id, v_property_id, 'signed',
    p_owner_name, p_owner_email, p_owner_phone, v_full_address,
    'Sommerhus', p_property_address, p_region,
    p_signature_name, v_sig_date, now(),
    p_accept_terms, p_accept_privacy, p_accept_marketing
  ) RETURNING id INTO v_agreement_id;

  -- Upsert onboarding
  INSERT INTO public.owner_onboarding (
    owner_id, status, lead_source, signup_started_at,
    onboarding_completed_at, agreement_signed_at, current_step, notes
  ) VALUES (
    v_owner_id, 'onboarding', p_lead_source, now(), now(), now(), 'agreement_signed',
    jsonb_build_object(
      'start_time', p_start_time,
      'help_level', p_help_level,
      'self_manage', p_self_manage,
      'has_cleaning', p_has_cleaning,
      'property_ready', p_property_ready,
      'relevant_services', p_relevant_services,
      'has_keybox', p_has_keybox,
      'has_experience', p_has_experience,
      'existing_link', p_existing_link,
      'preferred_contact', p_preferred_contact
    )::text
  )
  ON CONFLICT (owner_id) DO UPDATE SET
    status = EXCLUDED.status,
    lead_source = COALESCE(EXCLUDED.lead_source, public.owner_onboarding.lead_source),
    onboarding_completed_at = EXCLUDED.onboarding_completed_at,
    agreement_signed_at = EXCLUDED.agreement_signed_at,
    current_step = EXCLUDED.current_step,
    notes = EXCLUDED.notes
  RETURNING id INTO v_onboarding_id;

  -- Create lead
  INSERT INTO public.leads (
    name, email, phone, source, status, region, property_type,
    notes, converted_owner_id
  ) VALUES (
    p_owner_name, p_owner_email, p_owner_phone,
    COALESCE(NULLIF(p_lead_source,''), 'website_onboarding'),
    'converted', p_region, p_property_type,
    'Auto-created from Get Started wizard', v_owner_id
  ) RETURNING id INTO v_lead_id;

  RETURN jsonb_build_object(
    'owner_id', v_owner_id,
    'property_id', v_property_id,
    'agreement_id', v_agreement_id,
    'onboarding_id', v_onboarding_id,
    'lead_id', v_lead_id
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.complete_get_started_onboarding(
  text, text, text, text, text, text, text, text, text, text,
  integer, integer, integer, text[], text, text, text[], text, text, text[],
  text, text, text, boolean, boolean, boolean, text, text, text
) TO authenticated;
