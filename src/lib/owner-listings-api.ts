import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type ListingRow = Database['public']['Tables']['listings']['Row'];

export type OwnerListing = Pick<
  ListingRow,
  | 'id'
  | 'name'
  | 'slug'
  | 'description'
  | 'address'
  | 'region'
  | 'max_guests'
  | 'bedrooms'
  | 'bathrooms'
  | 'base_price_per_night'
  | 'weekend_price_per_night'
  | 'cleaning_fee'
  | 'is_active'
  | 'hero_image'
  | 'images'
  | 'amenities'
  | 'internal_status'
  | 'readiness_score'
  | 'channel_airbnb_ready'
  | 'channel_booking_ready'
  | 'channel_vrbo_ready'
  | 'check_in_time'
  | 'check_out_time'
  | 'min_nights'
>;

const ownerListingFields = `
  id,
  name,
  slug,
  description,
  address,
  region,
  max_guests,
  bedrooms,
  bathrooms,
  base_price_per_night,
  weekend_price_per_night,
  cleaning_fee,
  is_active,
  hero_image,
  images,
  amenities,
  internal_status,
  readiness_score,
  channel_airbnb_ready,
  channel_booking_ready,
  channel_vrbo_ready,
  check_in_time,
  check_out_time,
  min_nights
`;

export async function getOwnerListings(ownerId: string): Promise<OwnerListing[]> {
  const { data, error } = await supabase
    .from('listings')
    .select(ownerListingFields)
    .eq('owner_id', ownerId)
    .order('sort_order');

  if (error) throw new Error(error.message);
  return (data || []) as OwnerListing[];
}
