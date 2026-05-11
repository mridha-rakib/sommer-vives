import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type BookingRow = Database['public']['Tables']['bookings']['Row'];
type PayoutRow = Database['public']['Tables']['payouts']['Row'];
type ProfileRow = Database['public']['Tables']['profiles']['Row'];
type PropertyRow = Database['public']['Tables']['properties']['Row'];

export type OwnerDashboardBookingSummary = Pick<
  BookingRow,
  'id' | 'check_in' | 'check_out' | 'guest_name' | 'status' | 'total_amount' | 'owner_payout' | 'created_at'
>;

export interface OwnerDashboardStats {
  totalBookings: number;
  upcomingBookings: number;
  totalEarnings: number;
  pendingPayouts: number;
}

export interface OwnerDashboardData {
  property: PropertyRow | null;
  profile: Pick<ProfileRow, 'full_name'> | null;
  stats: OwnerDashboardStats;
  nextArrival: OwnerDashboardBookingSummary | null;
  recentBookings: OwnerDashboardBookingSummary[];
}

const dateKey = (date: Date) => date.toISOString().split('T')[0];

const sumPayouts = (payouts: Pick<PayoutRow, 'amount' | 'status'>[], statuses: string[]) => {
  const statusSet = new Set(statuses);
  return payouts
    .filter((payout) => statusSet.has(payout.status || ''))
    .reduce((sum, payout) => sum + Number(payout.amount), 0);
};

export async function getOwnerDashboard(ownerId: string, today = new Date()): Promise<OwnerDashboardData> {
  const todayKey = dateKey(today);

  const [propertiesRes, profileRes, payoutsRes] = await Promise.all([
    supabase
      .from('properties')
      .select('*')
      .eq('owner_id', ownerId)
      .order('created_at', { ascending: true }),
    supabase
      .from('profiles')
      .select('full_name')
      .eq('id', ownerId)
      .maybeSingle(),
    supabase
      .from('payouts')
      .select('amount, status')
      .eq('owner_id', ownerId),
  ]);

  if (propertiesRes.error) throw new Error(propertiesRes.error.message);
  if (profileRes.error) throw new Error(profileRes.error.message);
  if (payoutsRes.error) throw new Error(payoutsRes.error.message);

  const properties = propertiesRes.data || [];
  const propertyIds = properties.map((property) => property.id);
  const bookingFilter = propertyIds.length > 0
    ? `owner_id.eq.${ownerId},property_id.in.(${propertyIds.join(',')})`
    : `owner_id.eq.${ownerId}`;

  const { data: bookingsData, error: bookingsError } = await supabase
    .from('bookings')
    .select('id, check_in, check_out, guest_name, status, total_amount, owner_payout, created_at')
    .or(bookingFilter)
    .order('check_in', { ascending: true });

  if (bookingsError) throw new Error(bookingsError.message);

  const bookings = (bookingsData || []) as OwnerDashboardBookingSummary[];
  const payouts = payoutsRes.data || [];
  const upcoming = bookings.filter((booking) => (
    booking.check_in >= todayKey && booking.status !== 'cancelled'
  ));

  return {
    property: properties[0] || null,
    profile: profileRes.data || null,
    stats: {
      totalBookings: bookings.filter((booking) => booking.status !== 'cancelled').length,
      upcomingBookings: upcoming.length,
      totalEarnings: sumPayouts(payouts, ['completed', 'paid']),
      pendingPayouts: sumPayouts(payouts, ['pending', 'processing']),
    },
    nextArrival: upcoming[0] || null,
    recentBookings: upcoming.slice(0, 4),
  };
}
