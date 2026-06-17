import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type ListingRow = Database['public']['Tables']['listings']['Row'];
type ListingInsert = Database['public']['Tables']['listings']['Insert'];
type ListingUpdate = Database['public']['Tables']['listings']['Update'];

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
  | 'property_type'
  | 'house_rules'
  | 'published_at'
  | 'sort_order'
  | 'latitude'
  | 'longitude'
>;

export interface OwnerListingFormValues {
  name: string;
  description: string;
  address: string;
  region: string;
  property_type: string;
  max_guests: number;
  bedrooms: number | null;
  bathrooms: number | null;
  base_price_per_night: number;
  weekend_price_per_night: number | null;
  cleaning_fee: number | null;
  hero_image: string;
  images: string[];
  amenities: string[];
  house_rules: string;
  latitude: number | null;
  longitude: number | null;
}


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
  min_nights,
  property_type,
  house_rules,
  published_at,
  sort_order,
  latitude,
  longitude

`;

const slugify = (value: string) => {
  const normalized = value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/æ/g, 'ae')
    .replace(/ø/g, 'oe')
    .replace(/å/g, 'aa')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return normalized || `home-${Date.now()}`;
};

async function createUniqueSlug(name: string, currentId?: string) {
  const base = slugify(name);
  let candidate = base;
  let suffix = 2;

  while (true) {
    let query = supabase.from('listings').select('id').eq('slug', candidate).limit(1);
    if (currentId) query = query.neq('id', currentId);

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    if (!data || data.length === 0) return candidate;

    candidate = `${base}-${suffix}`;
    suffix += 1;
  }
}

const trimToNull = (value: string) => {
  const cleaned = value.trim();
  return cleaned.length > 0 ? cleaned : null;
};

const toOere = (value: number | null | undefined) => {
  if (value == null || !Number.isFinite(value) || value <= 0) return null;
  return Math.round(value * 100);
};

const cleanList = (values: string[]) =>
  values
    .map((value) => value.trim())
    .filter(Boolean)
    .filter((value, index, all) => all.indexOf(value) === index);

function toPayload(values: OwnerListingFormValues): Omit<ListingUpdate, 'owner_id'> {
  const images = cleanList(values.images);
  const heroImage = trimToNull(values.hero_image) || images[0] || null;

  return {
    name: values.name.trim(),
    description: trimToNull(values.description),
    address: trimToNull(values.address),
    region: trimToNull(values.region),
    property_type: trimToNull(values.property_type),
    max_guests: Math.max(1, Math.round(values.max_guests || 1)),
    bedrooms: values.bedrooms == null ? null : Math.max(0, Math.round(values.bedrooms)),
    bathrooms: values.bathrooms == null ? null : Math.max(0, Math.round(values.bathrooms)),
    base_price_per_night: toOere(values.base_price_per_night) || 0,
    weekend_price_per_night: toOere(values.weekend_price_per_night),
    cleaning_fee: toOere(values.cleaning_fee),
    hero_image: heroImage,
    images,
    amenities: cleanList(values.amenities),
    house_rules: trimToNull(values.house_rules),
    readiness_score: 100,
  };
}

export async function getOwnerListings(ownerId: string): Promise<OwnerListing[]> {
  const { data, error } = await supabase
    .from('listings')
    .select(ownerListingFields)
    .eq('owner_id', ownerId)
    .order('sort_order');

  if (error) throw new Error(error.message);
  return (data || []) as OwnerListing[];
}

export async function createOwnerListing(ownerId: string, values: OwnerListingFormValues): Promise<OwnerListing> {
  const slug = await createUniqueSlug(values.name);
  const payload: ListingInsert = {
    ...toPayload(values),
    owner_id: ownerId,
    slug,
    is_active: false,
    internal_status: 'draft',
    published_at: null,
  } as ListingInsert;

  const { data, error } = await supabase
    .from('listings')
    .insert(payload)
    .select(ownerListingFields)
    .single();

  if (error) throw new Error(error.message);
  return data as OwnerListing;
}

export async function updateOwnerListing(
  ownerId: string,
  listingId: string,
  values: OwnerListingFormValues,
): Promise<OwnerListing> {
  const slug = await createUniqueSlug(values.name, listingId);
  const payload: ListingUpdate = {
    ...toPayload(values),
    slug,
  };

  const { data, error } = await supabase
    .from('listings')
    .update(payload)
    .eq('id', listingId)
    .eq('owner_id', ownerId)
    .select(ownerListingFields)
    .single();

  if (error) throw new Error(error.message);
  return data as OwnerListing;
}

export async function setOwnerListingPublished(
  ownerId: string,
  listingId: string,
  published: boolean,
): Promise<OwnerListing> {
  const { data, error } = await supabase
    .from('listings')
    .update({
      is_active: published,
      internal_status: published ? 'live' : 'draft',
      published_at: published ? new Date().toISOString() : null,
    })
    .eq('id', listingId)
    .eq('owner_id', ownerId)
    .select(ownerListingFields)
    .single();

  if (error) throw new Error(error.message);
  return data as OwnerListing;
}

export async function deleteOwnerListing(ownerId: string, listingId: string): Promise<void> {
  const { error } = await supabase
    .from('listings')
    .delete()
    .eq('id', listingId)
    .eq('owner_id', ownerId);

  if (error) throw new Error(error.message);
}
