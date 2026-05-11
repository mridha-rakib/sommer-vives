import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

export type OwnerFinanceBooking = Pick<
  Database['public']['Tables']['bookings']['Row'],
  'id' | 'guest_name' | 'check_in' | 'check_out' | 'status' | 'owner_payout' | 'total_amount'
>;

export type OwnerPayout = Database['public']['Tables']['payouts']['Row'];

export interface OwnerFinanceData {
  bookings: OwnerFinanceBooking[];
  payouts: OwnerPayout[];
}

async function getOwnedPropertyIds(ownerId: string) {
  const { data, error } = await supabase
    .from('properties')
    .select('id')
    .eq('owner_id', ownerId);

  if (error) throw new Error(error.message);
  return (data || []).map((property) => property.id);
}

export async function getOwnerFinance(ownerId: string): Promise<OwnerFinanceData> {
  const propertyIds = await getOwnedPropertyIds(ownerId);
  const bookingFilter = propertyIds.length > 0
    ? `owner_id.eq.${ownerId},property_id.in.(${propertyIds.join(',')})`
    : `owner_id.eq.${ownerId}`;

  const [bookingsRes, payoutsRes] = await Promise.all([
    supabase
      .from('bookings')
      .select('id, guest_name, check_in, check_out, status, owner_payout, total_amount')
      .or(bookingFilter)
      .neq('status', 'cancelled')
      .order('check_in', { ascending: false }),
    supabase
      .from('payouts')
      .select('*')
      .eq('owner_id', ownerId)
      .order('created_at', { ascending: false }),
  ]);

  if (bookingsRes.error) throw new Error(bookingsRes.error.message);
  if (payoutsRes.error) throw new Error(payoutsRes.error.message);

  return {
    bookings: bookingsRes.data || [],
    payouts: payoutsRes.data || [],
  };
}
