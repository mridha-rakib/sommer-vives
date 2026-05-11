import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

export type OwnerOperationProperty = Pick<
  Database['public']['Tables']['properties']['Row'],
  'id' | 'title' | 'region'
>;

export type OwnerCleaningJob = Database['public']['Tables']['cleaning_jobs']['Row'];
export type OwnerMaintenanceJob = Database['public']['Tables']['maintenance_jobs']['Row'];
export type OwnerKeyboxInstallation = Database['public']['Tables']['keybox_installations']['Row'];
export type OwnerCheckinGuide = Database['public']['Tables']['checkin_guides']['Row'];
export type OwnerServicePartner = Database['public']['Tables']['service_partners']['Row'];
export type OwnerSupportTicket = Database['public']['Tables']['support_tickets']['Row'];

export interface OwnerOperationsData {
  properties: OwnerOperationProperty[];
  cleaningJobs: OwnerCleaningJob[];
  maintenanceJobs: OwnerMaintenanceJob[];
  keyboxes: OwnerKeyboxInstallation[];
  checkinGuides: OwnerCheckinGuide[];
  servicePartners: OwnerServicePartner[];
  supportTickets: OwnerSupportTicket[];
}

const activeStatuses = new Set(['active', 'open', 'pending', 'in_progress', 'scheduled', 'assigned']);
const closedStatuses = new Set(['completed', 'resolved', 'cancelled', 'canceled', 'archived']);

export const isOpenOperationStatus = (status: string | null | undefined) => (
  !closedStatuses.has((status || '').toLowerCase())
);

export const isActivePartner = (status: string | null | undefined) => (
  activeStatuses.has((status || '').toLowerCase())
);

export const isDamageTicket = (ticket: OwnerSupportTicket) => {
  const haystack = `${ticket.category} ${ticket.subject}`.toLowerCase();
  return haystack.includes('damage') || haystack.includes('skade');
};

const withPropertyIds = async <T>(
  propertyIds: string[],
  query: () => PromiseLike<{ data: T[] | null; error: { message: string } | null }>,
): Promise<T[]> => {
  if (propertyIds.length === 0) return [];
  const { data, error } = await query();
  if (error) throw new Error(error.message);
  return data || [];
};

export async function getOwnerOperations(ownerId: string): Promise<OwnerOperationsData> {
  const { data: properties, error: propertiesError } = await supabase
    .from('properties')
    .select('id, title, region')
    .eq('owner_id', ownerId)
    .order('created_at', { ascending: true });

  if (propertiesError) throw new Error(propertiesError.message);

  const ownerProperties = properties || [];
  const propertyIds = ownerProperties.map((property) => property.id);
  const ownerRegions = new Set(ownerProperties.map((property) => property.region).filter(Boolean));

  const [
    cleaningJobs,
    maintenanceJobs,
    keyboxes,
    checkinGuidesResult,
    supportTicketsResult,
    servicePartnersResult,
  ] = await Promise.all([
    withPropertyIds(propertyIds, () => supabase
      .from('cleaning_jobs')
      .select('*')
      .in('property_id', propertyIds)
      .order('scheduled_date', { ascending: true })),
    withPropertyIds(propertyIds, () => supabase
      .from('maintenance_jobs')
      .select('*')
      .in('property_id', propertyIds)
      .order('created_at', { ascending: false })),
    withPropertyIds(propertyIds, () => supabase
      .from('keybox_installations')
      .select('*')
      .in('property_id', propertyIds)
      .order('created_at', { ascending: false })),
    supabase
      .from('checkin_guides')
      .select('*')
      .eq('owner_id', ownerId)
      .order('updated_at', { ascending: false }),
    propertyIds.length > 0
      ? supabase
        .from('support_tickets')
        .select('*')
        .or(`requester_id.eq.${ownerId},property_id.in.(${propertyIds.join(',')})`)
        .order('created_at', { ascending: false })
      : supabase
        .from('support_tickets')
        .select('*')
        .eq('requester_id', ownerId)
        .order('created_at', { ascending: false }),
    supabase
      .from('service_partners')
      .select('*')
      .order('created_at', { ascending: false }),
  ]);

  if (checkinGuidesResult.error) throw new Error(checkinGuidesResult.error.message);
  if (supportTicketsResult.error) throw new Error(supportTicketsResult.error.message);
  if (servicePartnersResult.error) throw new Error(servicePartnersResult.error.message);

  const servicePartners = (servicePartnersResult.data || []).filter((partner) => {
    if (!isActivePartner(partner.status)) return false;
    const assignedProperties = partner.assigned_properties || [];
    const assignedToOwnerProperty = assignedProperties.some((id) => propertyIds.includes(id));
    const matchesRegion = partner.region ? ownerRegions.has(partner.region) : false;
    return assignedToOwnerProperty || matchesRegion;
  });

  return {
    properties: ownerProperties,
    cleaningJobs,
    maintenanceJobs,
    keyboxes,
    checkinGuides: checkinGuidesResult.data || [],
    supportTickets: supportTicketsResult.data || [],
    servicePartners,
  };
}
