import { supabase } from '@/integrations/supabase/client';

export interface CreateOwnerOnboardingPropertyInput {
  ownerId: string;
  title: string;
  address: string;
  region: string;
  capacity: number;
  bedrooms: number;
  bathrooms: number;
  description: string;
  amenities: string[];
  houseRules: string;
  cleaningPreference: 'self' | 'platform';
  addons: {
    proPhotos: boolean;
    proVideo: boolean;
    paymentMethod: 'now' | 'bookings' | null;
  };
}

export interface CreateOwnerOnboardingPropertyResult {
  property_id: string;
  onboarding_id: string | null;
}

export async function createOwnerOnboardingProperty(
  input: CreateOwnerOnboardingPropertyInput,
): Promise<CreateOwnerOnboardingPropertyResult> {
  const { data: property, error: propertyError } = await supabase
    .from('properties')
    .insert({
      owner_id: input.ownerId,
      title: input.title,
      address: input.address,
      region: input.region,
      capacity: input.capacity,
      bedrooms: input.bedrooms,
      bathrooms: input.bathrooms,
      description: input.description,
      amenities: input.amenities,
      house_rules: input.houseRules,
      status: 'draft',
      setup_status: 'new',
    })
    .select('id')
    .single();

  if (propertyError) throw new Error(propertyError.message);

  const onboardingNotes = JSON.stringify({
    source: 'owner_portal_onboarding',
    property_id: property.id,
    cleaning_preference: input.cleaningPreference,
    addons: input.addons,
  });

  const { data: onboarding, error: onboardingError } = await supabase
    .from('owner_onboarding')
    .upsert({
      owner_id: input.ownerId,
      status: 'property_created',
      current_step: 'property_setup',
      lead_source: 'owner_portal_onboarding',
      onboarding_completed_at: new Date().toISOString(),
      notes: onboardingNotes,
    }, { onConflict: 'owner_id' })
    .select('id')
    .maybeSingle();

  if (onboardingError) throw new Error(onboardingError.message);

  return {
    property_id: property.id,
    onboarding_id: onboarding?.id || null,
  };
}
