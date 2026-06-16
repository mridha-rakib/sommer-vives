import type { User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export interface CompleteGetStartedInput {
  email: string;
  password: string;
  ownerName: string;
  ownerPhone: string;
  ownerAddress: string;
  ownerPostal: string;
  ownerCity: string;
  preferredContact: string;
  propertyAddress: string;
  region: string;
  propertyType: string;
  capacity: number;
  bedrooms: number;
  bathrooms: number;
  facilities: string[];
  startTime: string;
  helpLevel: string;
  selfManage: string[];
  hasCleaning: string;
  propertyReady: string;
  relevantServices: string[];
  hasKeybox: string;
  hasExperience: string;
  existingLink: string;
  acceptTerms: boolean;
  acceptPrivacy: boolean;
  acceptMarketing: boolean;
  signatureName: string;
  signatureDate: string;
  leadSource: string;
}

export interface CompleteGetStartedResult {
  owner_id: string;
  property_id: string;
  agreement_id: string;
  onboarding_id: string;
  lead_id: string;
}

const cleanSource = (source: string) => {
  const value = source.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_').replace(/_+/g, '_');
  return value || 'website_onboarding';
};

const isCompleteGetStartedResult = (value: unknown): value is CompleteGetStartedResult => {
  if (!value || typeof value !== 'object') return false;
  const result = value as Partial<Record<keyof CompleteGetStartedResult, unknown>>;
  return (
    typeof result.owner_id === 'string' &&
    typeof result.property_id === 'string' &&
    typeof result.agreement_id === 'string' &&
    typeof result.onboarding_id === 'string' &&
    typeof result.lead_id === 'string'
  );
};

export async function completeGetStartedOnboarding(
  input: CompleteGetStartedInput,
  currentUser: SupabaseUser | null,
): Promise<CompleteGetStartedResult> {
  let user = currentUser;

  if (!user) {
    const { data, error } = await supabase.auth.signUp({
      email: input.email,
      password: input.password,
      options: {
        emailRedirectTo: `${window.location.origin}/owner`,
        data: { full_name: input.ownerName },
      },
    });

    if (error) throw new Error(error.message);
    user = data.user;

    const { data: sessionData } = await supabase.auth.getSession();
    if (!data.session && !sessionData.session) {
      throw new Error('Confirm your email, then sign in to finish your onboarding.');
    }
  }

  const ownerEmail = (input.email || user?.email || '').trim();
  if (!user?.id || !ownerEmail) {
    throw new Error('Unable to identify the owner account.');
  }

  const { data, error } = await supabase.rpc('complete_get_started_onboarding', {
    p_owner_name: input.ownerName,
    p_owner_email: ownerEmail,
    p_owner_phone: input.ownerPhone,
    p_owner_address: input.ownerAddress,
    p_owner_postal: input.ownerPostal,
    p_owner_city: input.ownerCity,
    p_preferred_contact: input.preferredContact,
    p_property_address: input.propertyAddress,
    p_region: input.region,
    p_property_type: input.propertyType,
    p_capacity: input.capacity,
    p_bedrooms: input.bedrooms,
    p_bathrooms: input.bathrooms,
    p_facilities: input.facilities,
    p_start_time: input.startTime,
    p_help_level: input.helpLevel,
    p_self_manage: input.selfManage,
    p_has_cleaning: input.hasCleaning,
    p_property_ready: input.propertyReady,
    p_relevant_services: input.relevantServices,
    p_has_keybox: input.hasKeybox,
    p_has_experience: input.hasExperience,
    p_existing_link: input.existingLink,
    p_accept_terms: input.acceptTerms,
    p_accept_privacy: input.acceptPrivacy,
    p_accept_marketing: input.acceptMarketing,
    p_signature_name: input.signatureName,
    p_signature_date: input.signatureDate,
    p_lead_source: cleanSource(input.leadSource),
  });

  if (error) throw new Error(error.message);
  if (!isCompleteGetStartedResult(data)) {
    throw new Error('Onboarding completed, but the response was incomplete.');
  }

  return data;
}
