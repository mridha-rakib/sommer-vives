import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

export const OWNER_AGREEMENT_VERSION = '1.2';

export type OwnerAgreement = Database['public']['Tables']['agreements']['Row'];
export type OwnerAgreementTemplate = Database['public']['Tables']['agreement_templates']['Row'];
export type OwnerAgreementProfile = Database['public']['Tables']['profiles']['Row'];
export type OwnerAgreementProperty = Pick<
  Database['public']['Tables']['properties']['Row'],
  'id' | 'title' | 'address' | 'region'
>;

export interface OwnerAgreementData {
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  ownerAddress: string;
  propertyTitle: string;
  propertyAddress: string;
  propertyRegion: string;
  propertyId: string | null;
}

export interface OwnerAgreementLoadResult {
  templateHtml: string;
  templateId: string | null;
  existingAgreement: OwnerAgreement | null;
  agreementData: OwnerAgreementData;
}

export interface CreateOwnerAgreementInput {
  ownerId: string;
  agreementData: OwnerAgreementData;
  templateId: string | null;
  signatureName: string;
  signatureDataUrl: string | null;
  renderedHtml: string;
  acceptTerms: boolean;
  acceptPrivacy: boolean;
  acceptMarketing: boolean;
}

const emptyAgreementData: OwnerAgreementData = {
  ownerName: '',
  ownerEmail: '',
  ownerPhone: '',
  ownerAddress: '',
  propertyTitle: '',
  propertyAddress: '',
  propertyRegion: '',
  propertyId: null,
};

export async function getOwnerAgreementData(ownerId: string): Promise<OwnerAgreementLoadResult> {
  const [templatesResult, agreementsResult, profileResult, propertiesResult] = await Promise.all([
    supabase
      .from('agreement_templates')
      .select('*')
      .eq('is_active', true)
      .limit(1),
    supabase
      .from('agreements')
      .select('*')
      .eq('owner_id', ownerId)
      .order('created_at', { ascending: false })
      .limit(1),
    supabase
      .from('profiles')
      .select('*')
      .eq('id', ownerId)
      .maybeSingle(),
    supabase
      .from('properties')
      .select('id, title, address, region')
      .eq('owner_id', ownerId)
      .order('created_at', { ascending: true })
      .limit(1),
  ]);

  if (templatesResult.error) throw new Error(templatesResult.error.message);
  if (agreementsResult.error) throw new Error(agreementsResult.error.message);
  if (profileResult.error) throw new Error(profileResult.error.message);
  if (propertiesResult.error) throw new Error(propertiesResult.error.message);

  const template = templatesResult.data?.[0] || null;
  const agreement = agreementsResult.data?.[0] || null;
  const profile = profileResult.data || null;
  const property = propertiesResult.data?.[0] || null;

  return {
    templateHtml: template?.body_html || '',
    templateId: template?.id || null,
    existingAgreement: agreement?.status === 'signed' ? agreement : null,
    agreementData: {
      ...emptyAgreementData,
      ownerName: profile?.full_name || '',
      ownerEmail: profile?.email || '',
      ownerPhone: profile?.phone || '',
      ownerAddress: profile?.address || '',
      propertyTitle: property?.title || '',
      propertyAddress: property?.address || '',
      propertyRegion: property?.region || '',
      propertyId: property?.id || null,
    },
  };
}

export async function createSignedOwnerAgreement(input: CreateOwnerAgreementInput): Promise<OwnerAgreement> {
  const { error } = await supabase.from('agreements').insert({
    owner_id: input.ownerId,
    property_id: input.agreementData.propertyId,
    template_id: input.templateId,
    version: OWNER_AGREEMENT_VERSION,
    status: 'signed',
    owner_name: input.agreementData.ownerName,
    owner_email: input.agreementData.ownerEmail,
    owner_phone: input.agreementData.ownerPhone,
    owner_address: input.agreementData.ownerAddress,
    property_title: input.agreementData.propertyTitle,
    property_address: input.agreementData.propertyAddress,
    property_region: input.agreementData.propertyRegion,
    commission_percent: 15,
    binding_months: 6,
    notice_days: 30,
    signature_name: input.signatureName,
    signature_date: new Date().toISOString().split('T')[0],
    signed_at: new Date().toISOString(),
    accept_terms: input.acceptTerms,
    accept_privacy: input.acceptPrivacy,
    accept_marketing: input.acceptMarketing,
    generated_body: input.renderedHtml,
    signature_data_url: input.signatureDataUrl,
  });

  if (error) throw new Error(error.message);

  const { data, error: fetchError } = await supabase
    .from('agreements')
    .select('*')
    .eq('owner_id', input.ownerId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (fetchError) throw new Error(fetchError.message);
  return data;
}
