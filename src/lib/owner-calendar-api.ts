import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { getOwnerAssetIds, getOwnerAssets, resolveOwnerAsset } from '@/lib/owner-assets-api';

type ListingBlockRow = Database['public']['Tables']['listing_blocks']['Row'];
type AvailabilityBlockRow = Database['public']['Tables']['availability_blocks']['Row'];
type BookingRow = Database['public']['Tables']['bookings']['Row'];

export type OwnerCalendarBlockType = 'blocked' | 'personal' | 'maintenance';

export interface OwnerCalendarProperty {
  id: string;
  title: string;
  listingId: string | null;
  propertyId: string | null;
  ownerId: string;
}

export interface OwnerCalendarBlock {
  id: string;
  start_date: string;
  end_date: string;
  block_type: OwnerCalendarBlockType;
  notes: string | null;
}

export type OwnerCalendarBooking = Pick<
  BookingRow,
  'id' | 'property_id' | 'check_in' | 'check_out' | 'guest_name' | 'guests_count' | 'status'
>;

export interface CreateOwnerCalendarBlockInput {
  propertyId: string;
  from: Date;
  to: Date;
  blockType: OwnerCalendarBlockType;
  notes?: string | null;
}

const ownerBlockSources = ['manual', 'owner_block', 'owner_personal', 'owner_maintenance'];
const activeBookingStatuses = ['pending', 'confirmed', 'checked_in'] as const;

const toDateKey = (date: Date) => format(date, 'yyyy-MM-dd');

const toListingBlockSource = (blockType: OwnerCalendarBlockType): string => {
  if (blockType === 'personal') return 'owner_personal';
  if (blockType === 'maintenance') return 'owner_maintenance';
  return 'owner_block';
};

export const toUiBlockType = (source: string | null, reason?: string | null): OwnerCalendarBlockType => {
  const value = reason || source;
  if (value === 'personal' || value === 'owner_personal') return 'personal';
  if (value === 'maintenance' || value === 'owner_maintenance') return 'maintenance';
  return 'blocked';
};

const normalizeListingBlock = (block: ListingBlockRow): OwnerCalendarBlock => ({
  id: `listing:${block.id}`,
  start_date: block.start_date,
  end_date: block.end_date,
  block_type: toUiBlockType(block.source, block.reason),
  notes: block.summary || block.reason || null,
});

const normalizeAvailabilityBlock = (block: AvailabilityBlockRow): OwnerCalendarBlock => ({
  id: `property:${block.id}`,
  start_date: block.start_date,
  end_date: block.end_date,
  block_type: toUiBlockType(block.block_type),
  notes: block.notes || null,
});

const blockMergeKey = (block: OwnerCalendarBlock) =>
  [block.start_date, block.end_date, block.block_type, block.notes || ''].join('|');

const mergeBlocks = (blocks: OwnerCalendarBlock[]) => {
  const byKey = new Map<string, OwnerCalendarBlock>();

  blocks.forEach((block) => {
    const key = blockMergeKey(block);
    const existing = byKey.get(key);
    if (existing) {
      existing.id = `${existing.id}|${block.id}`;
      return;
    }
    byKey.set(key, { ...block });
  });

  return Array.from(byKey.values()).sort((a, b) =>
    a.start_date.localeCompare(b.start_date) || a.end_date.localeCompare(b.end_date),
  );
};

const parseBlockReferences = (blockId: string) =>
  blockId.split('|').map((part) => {
    const [source, ...idParts] = part.split(':');
    return { source, id: idParts.join(':') };
  });

export async function getOwnerCalendarProperties(ownerId: string): Promise<OwnerCalendarProperty[]> {
  const assets = await getOwnerAssets(ownerId);
  return assets.map((asset) => ({
    id: asset.id,
    title: asset.title,
    listingId: asset.listingId,
    propertyId: asset.propertyId,
    ownerId: asset.ownerId,
  }));
}

export async function getOwnerCalendarBlocks(propertyId: string): Promise<OwnerCalendarBlock[]> {
  const asset = await resolveOwnerAsset(propertyId);

  const listingBlocksQuery = asset.listingId
    ? supabase
      .from('listing_blocks')
      .select('*')
      .eq('listing_id', asset.listingId)
      .in('source', ownerBlockSources)
      .order('start_date', { ascending: true })
    : Promise.resolve({ data: [], error: null });

  const availabilityBlocksQuery = asset.propertyId
    ? supabase
      .from('availability_blocks')
      .select('*')
      .eq('property_id', asset.propertyId)
      .order('start_date', { ascending: true })
    : Promise.resolve({ data: [], error: null });

  const [listingBlocksResult, availabilityBlocksResult] = await Promise.all([
    listingBlocksQuery,
    availabilityBlocksQuery,
  ]);

  if (listingBlocksResult.error) throw new Error(listingBlocksResult.error.message);
  if (availabilityBlocksResult.error) throw new Error(availabilityBlocksResult.error.message);

  return mergeBlocks([
    ...((listingBlocksResult.data || []) as ListingBlockRow[]).map(normalizeListingBlock),
    ...((availabilityBlocksResult.data || []) as AvailabilityBlockRow[]).map(normalizeAvailabilityBlock),
  ]);
}

export async function getOwnerCalendarBookings(propertyId: string): Promise<OwnerCalendarBooking[]> {
  const asset = await resolveOwnerAsset(propertyId);
  const ownerAssets = await getOwnerAssets(asset.ownerId);
  const assetIds = getOwnerAssetIds(asset);
  const bookingFilter = assetIds.length > 0
    ? `owner_id.eq.${asset.ownerId},property_id.in.(${assetIds.join(',')})`
    : `owner_id.eq.${asset.ownerId}`;

  const { data, error } = await supabase
    .from('bookings')
    .select('id, property_id, check_in, check_out, guest_name, guests_count, status')
    .or(bookingFilter)
    .in('status', activeBookingStatuses)
    .order('check_in', { ascending: true });

  if (error) throw new Error(error.message);

  const bookings = (data || []) as OwnerCalendarBooking[];
  const assetIdSet = new Set(assetIds);
  const relatedBookings = bookings.filter((booking) => assetIdSet.has(booking.property_id));

  if (relatedBookings.length > 0 || ownerAssets.length > 1) return relatedBookings;
  return bookings;
}

export async function createOwnerCalendarBlock(input: CreateOwnerCalendarBlockInput) {
  const asset = await resolveOwnerAsset(input.propertyId);
  const startDate = toDateKey(input.from);
  const endDate = toDateKey(input.to);
  const notes = input.notes?.trim() || null;

  if (asset.listingId) {
    const { error } = await supabase.from('listing_blocks').insert({
      listing_id: asset.listingId,
      owner_id: asset.ownerId,
      start_date: startDate,
      end_date: endDate,
      source: toListingBlockSource(input.blockType),
      reason: input.blockType,
      summary: notes,
    });

    if (error) throw new Error(error.message);
    return;
  }

  if (asset.propertyId) {
    const { error } = await supabase.from('availability_blocks').insert({
      property_id: asset.propertyId,
      start_date: startDate,
      end_date: endDate,
      block_type: input.blockType,
      notes,
    });

    if (error) throw new Error(error.message);
    return;
  }

  throw new Error('Unable to find a calendar target for this property.');
}

export async function deleteOwnerCalendarBlock(blockId: string) {
  const references = parseBlockReferences(blockId);
  const results = await Promise.all(references.map((reference) => {
    if (reference.source === 'listing') {
      return supabase.from('listing_blocks').delete().eq('id', reference.id);
    }
    if (reference.source === 'property') {
      return supabase.from('availability_blocks').delete().eq('id', reference.id);
    }
    return Promise.resolve({ error: null });
  }));

  const failed = results.find((result) => result.error);
  if (failed?.error) throw new Error(failed.error.message);
}
