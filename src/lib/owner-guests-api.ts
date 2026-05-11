import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type BookingRow = Pick<
  Database['public']['Tables']['bookings']['Row'],
  'guest_name' | 'guest_email' | 'guest_phone' | 'check_in' | 'check_out' | 'status' | 'guests_count' | 'owner_payout' | 'total_amount'
>;

export interface OwnerGuest extends BookingRow {
  stays: number;
  total_amount: number;
}

async function getOwnedPropertyIds(ownerId: string) {
  const { data, error } = await supabase
    .from('properties')
    .select('id')
    .eq('owner_id', ownerId);

  if (error) throw new Error(error.message);
  return (data || []).map((property) => property.id);
}

export async function getOwnerGuests(ownerId: string): Promise<OwnerGuest[]> {
  const propertyIds = await getOwnedPropertyIds(ownerId);
  const bookingFilter = propertyIds.length > 0
    ? `owner_id.eq.${ownerId},property_id.in.(${propertyIds.join(',')})`
    : `owner_id.eq.${ownerId}`;

  const { data, error } = await supabase
    .from('bookings')
    .select('guest_name, guest_email, guest_phone, check_in, check_out, status, guests_count, owner_payout, total_amount')
    .or(bookingFilter)
    .order('check_in', { ascending: false });

  if (error) throw new Error(error.message);

  const uniqueGuests = new Map<string, OwnerGuest>();
  ((data || []) as BookingRow[]).forEach((booking) => {
    const key = booking.guest_email || booking.guest_name || 'unknown';
    const current = uniqueGuests.get(key);
    if (!current) {
      uniqueGuests.set(key, {
        ...booking,
        stays: 1,
        total_amount: Number(booking.total_amount || 0),
      });
      return;
    }

    current.stays += 1;
    current.total_amount += Number(booking.total_amount || 0);
  });

  return Array.from(uniqueGuests.values());
}

