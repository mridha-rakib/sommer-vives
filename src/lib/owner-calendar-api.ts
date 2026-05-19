import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type ListingBlockRow = Database['public']['Tables']['listing_blocks']['Row'];
type ListingRow = Database['public']['Tables']['listings']['Row'];
type BookingRow = Database['public']['Tables']['bookings']['Row'];

export type OwnerCalendarBlockType = 'blocked' | 'personal' | 'maintenance';

export type OwnerCalendarProperty = Pick<ListingRow, 'id'> & {
  title: string;
};

export type OwnerCalendarBlock = Pick<ListingBlockRow, 'id' | 'start_date' | 'end_date'> & {
  block_type: OwnerCalendarBlockType;
  notes: string | null;
};

export type OwnerCalendarBooking = Pick<
  BookingRow,
  'id' | 'property_id' | 'check_in' | 'check_out' | 'guest_name' | 'guests_count' | 'status'
>;

export interface CreateOwnerCalendarBlockInput {
  propertyId: string;
  from: Date;
  to: Date;
  blockType: OwnerCalendarBlockType;
  notes?: string;
}

const toDateKey = (date: Date) => format(date, 'yyyy-MM-dd');

const toListingBlockSource = (blockType: OwnerCalendarBlockType): string => {
  if (blockType === 'personal') return 'owner_personal';
  if (blockType === 'maintenance') return 'owner_maintenance';
  return 'owner_block';
};

export const toUiBlockType = (source: string | null, reason: string | null): OwnerCalendarBlockType => {
  const value = reason || source;
  if (value === 'personal' || value === 'owner_personal') return 'personal';
  if (value === 'maintenance' || value === 'owner_maintenance') return 'maintenance';
  return 'blocked';
};

const normalizeBlock = (block: ListingBlockRow): OwnerCalendarBlock => ({
  id: block.id,
  start_date: block.start_date,
  end_date: block.end_date,
  block_type: toUiBlockType(block.source, block.reason),
  notes: block.summary || block.reason || null,
});

export async function getOwnerCalendarProperties(ownerId: string): Promise<OwnerCalendarProperty[]> {
  const { data, error } = await supabase
    .from('listings')
    .select('id, name')
    .eq('owner_id', ownerId)
    .order('sort_order', { ascending: true });

  if (error) throw new Error(error.message);
  return (data || []).map(listing => ({
    id: listing.id,
    title: listing.name,
  }));
}

export async function getOwnerCalendarBlocks(propertyId: string): Promise<OwnerCalendarBlock[]> {
  const { data, error } = await supabase
    .from('listing_blocks')
    .select('*')
    .eq('listing_id', propertyId)
    .in('source', ['manual', 'owner_block', 'owner_personal', 'owner_maintenance'])
    .order('start_date', { ascending: true });

  if (error) throw new Error(error.message);
  return (data || []).map(normalizeBlock);
}

export async function getOwnerCalendarBookings(propertyId: string): Promise<OwnerCalendarBooking[]> {
  const { data, error } = await supabase
    .from('bookings')
    .select('id, property_id, check_in, check_out, guest_name, guests_count, status')
    .eq('property_id', propertyId)
    .in('status', ['pending', 'confirmed', 'checked_in'])
    .order('check_in', { ascending: true });

  if (error) throw new Error(error.message);
  return data || [];
}

export async function createOwnerCalendarBlock(input: CreateOwnerCalendarBlockInput) {
  const { data: listing, error: listingError } = await supabase
    .from('listings')
    .select('owner_id')
    .eq('id', input.propertyId)
    .single();

  if (listingError) throw new Error(listingError.message);

  const { error } = await supabase.from('listing_blocks').insert({
    listing_id: input.propertyId,
    owner_id: listing.owner_id,
    start_date: toDateKey(input.from),
    end_date: toDateKey(input.to),
    source: toListingBlockSource(input.blockType),
    reason: input.blockType,
    summary: input.notes?.trim() || null,
  });

  if (error) throw new Error(error.message);
}

export async function deleteOwnerCalendarBlock(blockId: string) {
  const { error } = await supabase
    .from('listing_blocks')
    .delete()
    .eq('id', blockId);

  if (error) throw new Error(error.message);
}
