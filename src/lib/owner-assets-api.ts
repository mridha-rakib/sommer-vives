import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type PropertyRow = Database['public']['Tables']['properties']['Row'];
type ListingRow = Database['public']['Tables']['listings']['Row'];

export type OwnerAssetProperty = Pick<
  PropertyRow,
  'id' | 'owner_id' | 'title' | 'address' | 'region' | 'created_at'
>;

export type OwnerAssetListing = Pick<
  ListingRow,
  'id' | 'owner_id' | 'name' | 'address' | 'region' | 'sort_order' | 'created_at'
>;

export interface OwnerAsset {
  id: string;
  title: string;
  ownerId: string;
  propertyId: string | null;
  listingId: string | null;
  address: string | null;
  region: string | null;
  property: OwnerAssetProperty | null;
  listing: OwnerAssetListing | null;
}

const propertyFields = 'id, owner_id, title, address, region, created_at';
const listingFields = 'id, owner_id, name, address, region, sort_order, created_at';

const hasText = (value?: string | null) => !!value?.trim();

const normalizeText = (value?: string | null) =>
  (value || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const firstText = (...values: Array<string | null | undefined>) =>
  values.find(hasText)?.trim() || null;

const byCreatedAt = (a: OwnerAssetProperty, b: OwnerAssetProperty) =>
  a.created_at.localeCompare(b.created_at);

const bySortOrder = (a: OwnerAssetListing, b: OwnerAssetListing) =>
  a.sort_order - b.sort_order || a.created_at.localeCompare(b.created_at);

const selectMatchingProperty = (
  listing: OwnerAssetListing,
  properties: OwnerAssetProperty[],
) => {
  if (properties.length === 0) return null;

  const listingAddress = normalizeText(listing.address);
  if (listingAddress) {
    const addressMatch = properties.find((property) => normalizeText(property.address) === listingAddress);
    if (addressMatch) return addressMatch;
  }

  const listingName = normalizeText(listing.name);
  if (listingName) {
    const titleMatch = properties.find((property) => normalizeText(property.title) === listingName);
    if (titleMatch) return titleMatch;
  }

  const listingRegion = normalizeText(listing.region);
  if (listingRegion) {
    const regionMatches = properties.filter((property) => normalizeText(property.region) === listingRegion);
    if (regionMatches.length === 1) return regionMatches[0];
  }

  return properties.length === 1 ? properties[0] : null;
};

const toOwnerAsset = (
  listing: OwnerAssetListing | null,
  property: OwnerAssetProperty | null,
): OwnerAsset => ({
  id: listing?.id || property!.id,
  title: firstText(listing?.name, property?.title, property?.address, listing?.address) || 'Property',
  ownerId: listing?.owner_id || property!.owner_id,
  propertyId: property?.id || null,
  listingId: listing?.id || null,
  address: firstText(property?.address, listing?.address),
  region: firstText(property?.region, listing?.region),
  property,
  listing,
});

export const getOwnerAssetIds = (asset: Pick<OwnerAsset, 'propertyId' | 'listingId'>) =>
  Array.from(new Set([asset.listingId, asset.propertyId].filter((id): id is string => !!id)));

export async function getOwnerAssets(ownerId: string): Promise<OwnerAsset[]> {
  const [propertiesResult, listingsResult] = await Promise.all([
    supabase
      .from('properties')
      .select(propertyFields)
      .eq('owner_id', ownerId)
      .order('created_at', { ascending: true }),
    supabase
      .from('listings')
      .select(listingFields)
      .eq('owner_id', ownerId)
      .order('sort_order', { ascending: true }),
  ]);

  if (propertiesResult.error) throw new Error(propertiesResult.error.message);
  if (listingsResult.error) throw new Error(listingsResult.error.message);

  const availableProperties = [...((propertiesResult.data || []) as OwnerAssetProperty[])].sort(byCreatedAt);
  const listings = [...((listingsResult.data || []) as OwnerAssetListing[])].sort(bySortOrder);
  const assets: OwnerAsset[] = [];

  listings.forEach((listing) => {
    const property = selectMatchingProperty(listing, availableProperties);
    if (property) {
      const index = availableProperties.findIndex((candidate) => candidate.id === property.id);
      if (index >= 0) availableProperties.splice(index, 1);
    }
    assets.push(toOwnerAsset(listing, property));
  });

  availableProperties.forEach((property) => {
    assets.push(toOwnerAsset(null, property));
  });

  return assets;
}

export async function resolveOwnerAsset(assetId: string): Promise<OwnerAsset> {
  const [listingResult, propertyResult] = await Promise.all([
    supabase
      .from('listings')
      .select(listingFields)
      .eq('id', assetId)
      .maybeSingle(),
    supabase
      .from('properties')
      .select(propertyFields)
      .eq('id', assetId)
      .maybeSingle(),
  ]);

  if (listingResult.error) throw new Error(listingResult.error.message);
  if (propertyResult.error) throw new Error(propertyResult.error.message);

  const listing = listingResult.data as OwnerAssetListing | null;
  const property = propertyResult.data as OwnerAssetProperty | null;
  const ownerId = listing?.owner_id || property?.owner_id;
  if (!ownerId) throw new Error('Unable to find this owner property.');

  const assets = await getOwnerAssets(ownerId);
  const asset = assets.find((candidate) =>
    candidate.id === assetId || candidate.listingId === assetId || candidate.propertyId === assetId,
  );

  return asset || toOwnerAsset(listing, property);
}
