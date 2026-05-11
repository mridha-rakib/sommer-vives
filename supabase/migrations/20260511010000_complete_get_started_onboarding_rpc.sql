-- Complete the "get started for free" onboarding in one backend transaction.
-- The caller must be authenticated; all records are created for auth.uid().
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
  p_signature_date date,
  p_lead_source text DEFAULT 'website_onboarding'
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
  v_owner_address text;
  v_property_title text;
  v_lead_source text;
  v_now timestamptz := now();
  v_notes text;
BEGIN
  IF v_owner_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF nullif(trim(coalesce(p_owner_name, '')), '') IS NULL THEN
    RAISE EXCEPTION 'Owner name is required';
  END IF;

  IF nullif(trim(coalesce(p_owner_email, '')), '') IS NULL THEN
    RAISE EXCEPTION 'Owner email is required';
  END IF;

  IF nullif(trim(coalesce(p_owner_phone, '')), '') IS NULL THEN
    RAISE EXCEPTION 'Owner phone is required';
  END IF;

  IF nullif(trim(coalesce(p_property_address, '')), '') IS NULL THEN
    RAISE EXCEPTION 'Property address is required';
  END IF;

  IF nullif(trim(coalesce(p_region, '')), '') IS NULL THEN
    RAISE EXCEPTION 'Region is required';
  END IF;

  IF nullif(trim(coalesce(p_property_type, '')), '') IS NULL THEN
    RAISE EXCEPTION 'Property type is required';
  END IF;

  IF p_accept_terms IS NOT TRUE OR p_accept_privacy IS NOT TRUE THEN
    RAISE EXCEPTION 'Terms and privacy acceptance are required';
  END IF;

  IF nullif(trim(coalesce(p_signature_name, '')), '') IS NULL THEN
    RAISE EXCEPTION 'Signature name is required';
  END IF;

  v_owner_address := concat_ws(
    ', ',
    nullif(trim(coalesce(p_owner_address, '')), ''),
    nullif(trim(concat_ws(' ', nullif(trim(coalesce(p_owner_postal, '')), ''), nullif(trim(coalesce(p_owner_city, '')), ''))), '')
  );
  v_property_title := trim(p_property_type) || ' i ' || trim(p_region);
  v_lead_source := coalesce(nullif(trim(p_lead_source), ''), 'website_onboarding');

  v_notes := concat_ws(E'\n',
    'Completed get started onboarding',
    'Preferred contact: ' || coalesce(nullif(trim(p_preferred_contact), ''), 'not specified'),
    'Start time: ' || coalesce(nullif(trim(p_start_time), ''), 'not specified'),
    'Help level: ' || coalesce(nullif(trim(p_help_level), ''), 'not specified'),
    'Self-managed tasks: ' || coalesce(array_to_string(p_self_manage, ', '), 'none'),
    'Cleaning solution: ' || coalesce(nullif(trim(p_has_cleaning), ''), 'not specified'),
    'Property ready: ' || coalesce(nullif(trim(p_property_ready), ''), 'not specified'),
    'Relevant services: ' || coalesce(array_to_string(p_relevant_services, ', '), 'none'),
    'Keybox: ' || coalesce(nullif(trim(p_has_keybox), ''), 'not specified'),
    'Rental experience: ' || coalesce(nullif(trim(p_has_experience), ''), 'not specified'),
    CASE WHEN nullif(trim(coalesce(p_existing_link, '')), '') IS NOT NULL THEN 'Existing listing: ' || trim(p_existing_link) ELSE NULL END
  );

  INSERT INTO public.profiles (id, email, full_name, phone, address)
  VALUES (v_owner_id, trim(p_owner_email), trim(p_owner_name), trim(p_owner_phone), nullif(v_owner_address, ''))
  ON CONFLICT (id) DO UPDATE SET
    email = excluded.email,
    full_name = excluded.full_name,
    phone = excluded.phone,
    address = excluded.address,
    updated_at = v_now;

  INSERT INTO public.properties (
    owner_id,
    title,
    address,
    region,
    capacity,
    bedrooms,
    bathrooms,
    amenities,
    status,
    setup_status
  )
  VALUES (
    v_owner_id,
    v_property_title,
    trim(p_property_address),
    trim(p_region),
    greatest(coalesce(p_capacity, 4), 1),
    greatest(coalesce(p_bedrooms, 1), 0),
    greatest(coalesce(p_bathrooms, 1), 0),
    coalesce(p_facilities, ARRAY[]::text[]),
    'draft',
    'new'
  )
  RETURNING id INTO v_property_id;

  INSERT INTO public.agreements (
    owner_id,
    property_id,
    owner_name,
    owner_email,
    owner_phone,
    owner_address,
    property_title,
    property_address,
    property_region,
    commission_percent,
    binding_months,
    notice_days,
    signature_name,
    signature_date,
    signed_at,
    accept_terms,
    accept_privacy,
    accept_marketing,
    status,
    version
  )
  VALUES (
    v_owner_id,
    v_property_id,
    trim(p_owner_name),
    trim(p_owner_email),
    trim(p_owner_phone),
    nullif(v_owner_address, ''),
    v_property_title,
    trim(p_property_address),
    trim(p_region),
    15,
    6,
    30,
    trim(p_signature_name),
    p_signature_date,
    v_now,
    p_accept_terms,
    p_accept_privacy,
    p_accept_marketing,
    'signed',
    '1.2'
  )
  RETURNING id INTO v_agreement_id;

  INSERT INTO public.owner_onboarding (
    owner_id,
    status,
    current_step,
    lead_source,
    signup_started_at,
    agreement_signed_at,
    notes
  )
  VALUES (
    v_owner_id,
    'agreement_signed',
    'property_setup',
    v_lead_source,
    v_now,
    v_now,
    v_notes
  )
  ON CONFLICT (owner_id) DO UPDATE SET
    status = excluded.status,
    current_step = excluded.current_step,
    lead_source = excluded.lead_source,
    signup_started_at = coalesce(owner_onboarding.signup_started_at, excluded.signup_started_at),
    agreement_signed_at = excluded.agreement_signed_at,
    notes = excluded.notes,
    updated_at = v_now
  RETURNING id INTO v_onboarding_id;

  INSERT INTO public.leads (
    name,
    email,
    phone,
    source,
    status,
    region,
    property_type,
    notes,
    next_step,
    converted_owner_id
  )
  VALUES (
    trim(p_owner_name),
    trim(p_owner_email),
    trim(p_owner_phone),
    v_lead_source,
    'new',
    trim(p_region),
    trim(p_property_type),
    v_notes,
    'Review signed onboarding and schedule welcome call',
    v_owner_id
  )
  RETURNING id INTO v_lead_id;

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
  text, text, text, text, text, text, text, text, text, text, integer, integer, integer,
  text[], text, text, text[], text, text, text[], text, text, text, boolean, boolean, boolean,
  text, date, text
) TO authenticated;
