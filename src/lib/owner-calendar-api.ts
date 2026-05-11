import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type AvailabilityBlockRow = Database['public']['Tables']['availability_blocks']['Row'];
type PropertyRow = Database['public']['Tables']['properties']['Row'];
type BookingRow = Database['public']['Tables']['bookings']['Row'];

export type OwnerCalendarBlockType = 'blocked' | 'personal' | 'maintenance';
type AvailabilityBlockDbType = 'blocked' | 'booked' | 'maintenance';

export type OwnerCalendarProperty = Pick<PropertyRow, 'id' | 'title'>;

export type OwnerCalendarBlock = Omit<AvailabilityBlockRow, 'block_type'> & {
  block_type: OwnerCalendarBlockType;
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

const toDbBlockType = (blockType: OwnerCalendarBlockType): AvailabilityBlockDbType => {
  if (blockType === 'personal') return 'booked';
  return blockType;
};

export const toUiBlockType = (blockType: string | null): OwnerCalendarBlockType => {
  if (blockType === 'booked') return 'personal';
  if (blockType === 'maintenance') return 'maintenance';
  return 'blocked';
};

const normalizeBlock = (block: AvailabilityBlockRow): OwnerCalendarBlock => ({
  ...block,
  block_type: toUiBlockType(block.block_type),
});

export async function getOwnerCalendarProperties(ownerId: string): Promise<OwnerCalendarProperty[]> {
  const { data, error } = await supabase
    .from('properties')
    .select('id, title')
    .eq('owner_id', ownerId)
    .order('created_at', { ascending: true });

  if (error) throw new Error(error.message);
  return data || [];
}

export async function getOwnerCalendarBlocks(propertyId: string): Promise<OwnerCalendarBlock[]> {
  const { data, error } = await supabase
    .from('availability_blocks')
    .select('*')
    .eq('property_id', propertyId)
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
  const { error } = await supabase.from('availability_blocks').insert({
    property_id: input.propertyId,
    start_date: toDateKey(input.from),
    end_date: toDateKey(input.to),
    block_type: toDbBlockType(input.blockType),
    notes: input.notes?.trim() || null,
  });

  if (error) throw new Error(error.message);
}

export async function deleteOwnerCalendarBlock(blockId: string) {
  const { error } = await supabase
    .from('availability_blocks')
    .delete()
    .eq('id', blockId);

  if (error) throw new Error(error.message);
}
