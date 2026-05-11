import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

export type OwnerPropertyDetail = Database['public']['Tables']['properties']['Row'];

export type OwnerPropertyListing = Pick<
  Database['public']['Tables']['listings']['Row'],
  'id' | 'name' | 'region' | 'max_guests' | 'is_active'
>;

export interface OwnerPropertyOverview {
  property: OwnerPropertyDetail | null;
  listings: OwnerPropertyListing[];
}

export async function getOwnerPropertyOverview(ownerId: string): Promise<OwnerPropertyOverview> {
  const [propertyRes, listingsRes] = await Promise.all([
    supabase
      .from('properties')
      .select('*')
      .eq('owner_id', ownerId)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('listings')
      .select('id, name, region, max_guests, is_active')
      .eq('owner_id', ownerId)
      .order('sort_order'),
  ]);

  if (propertyRes.error) throw new Error(propertyRes.error.message);
  if (listingsRes.error) throw new Error(listingsRes.error.message);

  return {
    property: propertyRes.data || null,
    listings: listingsRes.data || [],
  };
}
