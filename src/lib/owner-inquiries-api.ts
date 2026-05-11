import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

export type OwnerInquiry = Database['public']['Tables']['inquiries']['Row'];
export type OwnerInquiryProperty = Pick<Database['public']['Tables']['properties']['Row'], 'id' | 'title'>;

export interface OwnerInquiriesData {
  inquiries: OwnerInquiry[];
  propertiesById: Record<string, OwnerInquiryProperty>;
}

export async function getOwnerInquiries(ownerId: string): Promise<OwnerInquiriesData> {
  const { data: properties, error: propertiesError } = await supabase
    .from('properties')
    .select('id, title')
    .eq('owner_id', ownerId)
    .order('created_at', { ascending: true });

  if (propertiesError) throw new Error(propertiesError.message);

  const ownerProperties = properties || [];
  const propertiesById = ownerProperties.reduce<Record<string, OwnerInquiryProperty>>((acc, property) => {
    acc[property.id] = property;
    return acc;
  }, {});

  const propertyIds = ownerProperties.map((property) => property.id);
  if (propertyIds.length === 0) {
    return { inquiries: [], propertiesById };
  }

  const { data: inquiries, error: inquiriesError } = await supabase
    .from('inquiries')
    .select('*')
    .in('property_id', propertyIds)
    .order('created_at', { ascending: false });

  if (inquiriesError) throw new Error(inquiriesError.message);

  return {
    inquiries: inquiries || [],
    propertiesById,
  };
}
