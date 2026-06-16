import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type PropertyRow = Database['public']['Tables']['properties']['Row'];
type ListingRow = Database['public']['Tables']['listings']['Row'];
type PropertyPricingRow = Database['public']['Tables']['property_pricing']['Row'];

type OwnerPropertyListingSource = Pick<
  ListingRow,
  | 'id'
  | 'owner_id'
  | 'name'
  | 'slug'
  | 'description'
  | 'long_description'
  | 'about_property'
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
  | 'house_rules'
  | 'internal_status'
  | 'published_at'
  | 'sort_order'
  | 'created_at'
  | 'updated_at'
>;

export type OwnerPropertyListing = Pick<
  ListingRow,
  | 'id'
  | 'name'
  | 'slug'
  | 'region'
  | 'max_guests'
  | 'is_active'
  | 'internal_status'
  | 'sort_order'
>;

export interface OwnerPropertyDetail {
  id: string;
  owner_id: string;
  title: string;
  description: string | null;
  address: string;
  region: string;
  capacity: number;
  bedrooms: number | null;
  bathrooms: number | null;
  amenities: string[] | null;
  images: string[] | null;
  house_rules: string | null;
  price_per_night: number | null;
  price_per_week: number | null;
  cleaning_fee: number | null;
  status: string;
  setup_status: string;
  case_number: string | null;
  created_at: string;
  updated_at: string;
  listing_id: string | null;
  listing_slug: string | null;
}

export interface OwnerPropertyOverview {
  property: OwnerPropertyDetail | null;
  listings: OwnerPropertyListing[];
}

const ownerListingFields = `
  id,
  owner_id,
  name,
  slug,
  description,
  long_description,
  about_property,
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
  house_rules,
  internal_status,
  published_at,
  sort_order,
  created_at,
  updated_at
`;

const hasText = (value?: string | null) => !!value?.trim();

const firstText = (...values: Array<string | null | undefined>) =>
  values.find(hasText)?.trim() || null;

const positiveNumber = (value: number | null | undefined) => {
  if (value == null) return null;
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric > 0 ? numeric : null;
};

const minorUnitsToMajor = (value: number | null | undefined) => {
  const numeric = positiveNumber(value);
  return numeric == null ? null : numeric / 100;
};

const uniqueStrings = (...groups: Array<Array<string | null | undefined> | null | undefined>) => {
  const seen = new Set<string>();
  const values: string[] = [];

  groups.forEach((group) => {
    if (!Array.isArray(group)) return;
    group.forEach((value) => {
      const cleaned = value?.trim();
      if (!cleaned || seen.has(cleaned)) return;
      seen.add(cleaned);
      values.push(cleaned);
    });
  });

  return values;
};

const selectPrimaryListing = (listings: OwnerPropertyListingSource[]) =>
  listings.find((listing) => listing.is_active) || listings[0] || null;

const normalizeListingStatus = (listing: OwnerPropertyListingSource | null, property: PropertyRow | null) => {
  if (!listing) return property?.status || 'draft';
  if (listing.is_active) return 'active';

  const status = listing.internal_status || '';
  if (['active', 'live', 'published', 'ready'].includes(status)) return 'active';
  if (['inactive', 'paused', 'archived'].includes(status)) return 'inactive';

  return property?.status || 'draft';
};

const pickPropertyPrice = (
  priceRows: Pick<PropertyPricingRow, 'start_date' | 'end_date' | 'price_per_night'>[],
  today = new Date(),
) => {
  if (priceRows.length === 0) return null;

  const todayKey = today.toISOString().split('T')[0];
  const active = priceRows.find((row) => row.start_date <= todayKey && row.end_date >= todayKey);
  const upcoming = priceRows.find((row) => row.start_date > todayKey);
  return positiveNumber((active || upcoming || priceRows[0])?.price_per_night);
};

function buildPropertyDetail(
  property: PropertyRow | null,
  listing: OwnerPropertyListingSource | null,
  mediaUrls: string[],
  propertyPrice: number | null,
): OwnerPropertyDetail | null {
  if (!property && !listing) return null;

  const createdAt = property?.created_at || listing?.created_at || new Date().toISOString();
  const listingImages = listing?.hero_image
    ? [listing.hero_image, ...(listing.images || [])]
    : listing?.images || [];
  const images = uniqueStrings(property?.images, mediaUrls, listingImages);
  const amenities = uniqueStrings(property?.amenities, listing?.amenities);

  return {
    id: property?.id || listing!.id,
    owner_id: property?.owner_id || listing!.owner_id,
    title: firstText(listing?.name, property?.title) || 'Property',
    description: firstText(
      listing?.description,
      listing?.long_description,
      listing?.about_property,
      property?.description,
    ),
    address: firstText(property?.address, listing?.address) || '',
    region: firstText(property?.region, listing?.region) || '',
    capacity: listing?.max_guests || property?.capacity || 0,
    bedrooms: listing?.bedrooms ?? property?.bedrooms ?? null,
    bathrooms: listing?.bathrooms ?? property?.bathrooms ?? null,
    amenities: amenities.length > 0 ? amenities : null,
    images: images.length > 0 ? images : null,
    house_rules: firstText(listing?.house_rules, property?.house_rules),
    price_per_night: minorUnitsToMajor(listing?.base_price_per_night)
      ?? positiveNumber(property?.price_per_night)
      ?? propertyPrice,
    price_per_week: positiveNumber(property?.price_per_week),
    cleaning_fee: minorUnitsToMajor(listing?.cleaning_fee)
      ?? positiveNumber(property?.cleaning_fee),
    status: normalizeListingStatus(listing, property),
    setup_status: property?.setup_status || (listing ? 'listing_created' : 'draft'),
    case_number: property?.case_number || null,
    created_at: createdAt,
    updated_at: property?.updated_at || listing?.updated_at || createdAt,
    listing_id: listing?.id || null,
    listing_slug: listing?.slug || null,
  };
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
      .select(ownerListingFields)
      .eq('owner_id', ownerId)
      .order('sort_order'),
  ]);

  if (propertyRes.error) throw new Error(propertyRes.error.message);
  if (listingsRes.error) throw new Error(listingsRes.error.message);

  const property = propertyRes.data || null;
  const listings = (listingsRes.data || []) as OwnerPropertyListingSource[];
  const primaryListing = selectPrimaryListing(listings);
  let mediaUrls: string[] = [];
  let propertyPrice: number | null = null;

  if (property?.id) {
    const [mediaRes, pricingRes] = await Promise.all([
      supabase
        .from('property_media')
        .select('url')
        .eq('property_id', property.id)
        .order('is_hero', { ascending: false })
        .order('sort_order'),
      supabase
        .from('property_pricing')
        .select('start_date, end_date, price_per_night')
        .eq('property_id', property.id)
        .order('start_date', { ascending: true }),
    ]);

    if (mediaRes.error) throw new Error(mediaRes.error.message);
    if (pricingRes.error) throw new Error(pricingRes.error.message);

    mediaUrls = (mediaRes.data || []).map((media) => media.url);
    propertyPrice = pickPropertyPrice(pricingRes.data || []);
  }

  return {
    property: buildPropertyDetail(property, primaryListing, mediaUrls, propertyPrice),
    listings,
  };
}
