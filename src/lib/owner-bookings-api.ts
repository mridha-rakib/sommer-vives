import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { getOwnerAssetIds, getOwnerAssets, type OwnerAsset } from '@/lib/owner-assets-api';

export type OwnerBookingFilter = 'upcoming' | 'past' | 'all';
export type OwnerBookingSource = 'booking' | 'inquiry';

type BookingRow = Database['public']['Tables']['bookings']['Row'];
type InquiryRow = Database['public']['Tables']['inquiries']['Row'];

export interface OwnerBookingProperty {
  id: string;
  title: string;
  address: string | null;
  region: string | null;
}

export interface OwnerBooking {
  id: string;
  source: OwnerBookingSource;
  case_number: string | null;
  property_id: string;
  owner_id: string | null;
  check_in: string;
  check_out: string;
  nights: number | null;
  guests_count: number | null;
  guest_name: string | null;
  guest_email: string | null;
  guest_phone: string | null;
  status: string | null;
  stay_status: string | null;
  source_channel: string | null;
  total_amount: number | null;
  owner_payout: number | null;
  payment_status: string | null;
  created_at: string | null;
  property?: OwnerBookingProperty | null;
};

const ownerBookingFields = `
  id,
  case_number,
  property_id,
  owner_id,
  check_in,
  check_out,
  nights,
  guests_count,
  guest_name,
  guest_email,
  guest_phone,
  status,
  stay_status,
  source_channel,
  total_amount,
  owner_payout,
  payment_status,
  created_at
`;

const dateKey = (date: Date) => date.toISOString().split('T')[0];

const toBookingProperty = (asset: OwnerAsset): OwnerBookingProperty => ({
  id: asset.propertyId || asset.listingId || asset.id,
  title: asset.title,
  address: asset.address,
  region: asset.region,
});

const buildPropertyMap = (assets: OwnerAsset[]) => {
  const propertyById = new Map<string, OwnerBookingProperty>();

  assets.forEach((asset) => {
    const property = toBookingProperty(asset);
    getOwnerAssetIds(asset).forEach((id) => propertyById.set(id, property));
    propertyById.set(asset.id, property);
  });

  return propertyById;
};

const normalizeBooking = (
  booking: BookingRow,
  property: OwnerBookingProperty | undefined,
): OwnerBooking => ({
  id: booking.id,
  source: 'booking',
  case_number: booking.case_number,
  property_id: booking.property_id,
  owner_id: booking.owner_id,
  check_in: booking.check_in,
  check_out: booking.check_out,
  nights: booking.nights,
  guests_count: booking.guests_count,
  guest_name: booking.guest_name,
  guest_email: booking.guest_email,
  guest_phone: booking.guest_phone,
  status: booking.status,
  stay_status: booking.stay_status,
  source_channel: booking.source_channel,
  total_amount: booking.total_amount,
  owner_payout: booking.owner_payout,
  payment_status: booking.payment_status,
  created_at: booking.created_at,
  property: property || null,
});

const normalizeInquiry = (
  inquiry: InquiryRow,
  property: OwnerBookingProperty | undefined,
): OwnerBooking => ({
  id: `inquiry-${inquiry.id}`,
  source: 'inquiry',
  case_number: null,
  property_id: inquiry.property_id,
  owner_id: null,
  check_in: inquiry.check_in,
  check_out: inquiry.check_out,
  nights: null,
  guests_count: inquiry.guests,
  guest_name: inquiry.guest_name,
  guest_email: inquiry.guest_email,
  guest_phone: inquiry.guest_phone,
  status: inquiry.status === 'confirmed' ? 'confirmed' : 'pending',
  stay_status: null,
  source_channel: 'direct',
  total_amount: null,
  owner_payout: null,
  payment_status: null,
  created_at: inquiry.created_at,
  property: property || null,
});

export async function getOwnerBookings(ownerId: string): Promise<OwnerBooking[]> {
  const assets = await getOwnerAssets(ownerId);
  const assetIds = Array.from(new Set(assets.flatMap(getOwnerAssetIds)));
  const propertyById = buildPropertyMap(assets);
  const fallbackProperty = assets.length === 1 ? toBookingProperty(assets[0]) : undefined;
  const bookingFilter = assetIds.length > 0
    ? `owner_id.eq.${ownerId},property_id.in.(${assetIds.join(',')})`
    : `owner_id.eq.${ownerId}`;

  const bookingsQuery = supabase
    .from('bookings')
    .select(ownerBookingFields)
    .or(bookingFilter)
    .order('check_in', { ascending: true });

  const inquiriesQuery = assetIds.length > 0
    ? supabase
      .from('inquiries')
      .select('id, property_id, check_in, check_out, guests, guest_name, guest_email, guest_phone, status, created_at, message, updated_at')
      .in('property_id', assetIds)
      .in('status', ['new', 'confirmed'])
      .order('check_in', { ascending: true })
    : Promise.resolve({ data: [], error: null });

  const [bookingsResult, inquiriesResult] = await Promise.all([bookingsQuery, inquiriesQuery]);

  if (bookingsResult.error) throw new Error(bookingsResult.error.message);
  if (inquiriesResult.error) throw new Error(inquiriesResult.error.message);

  const normalizedBookings = ((bookingsResult.data || []) as BookingRow[])
    .map((booking) => normalizeBooking(booking, propertyById.get(booking.property_id) || fallbackProperty));
  const normalizedInquiries = ((inquiriesResult.data || []) as InquiryRow[])
    .map((inquiry) => normalizeInquiry(inquiry, propertyById.get(inquiry.property_id) || fallbackProperty));

  const bookingKeys = new Set(
    normalizedBookings.map((booking) => `${booking.property_id}:${booking.check_in}:${booking.check_out}:${booking.guest_email || booking.guest_name || ''}`),
  );
  const inquiryOnly = normalizedInquiries.filter((inquiry) => {
    const key = `${inquiry.property_id}:${inquiry.check_in}:${inquiry.check_out}:${inquiry.guest_email || inquiry.guest_name || ''}`;
    return !bookingKeys.has(key);
  });

  return [...normalizedBookings, ...inquiryOnly]
    .sort((a, b) => a.check_in.localeCompare(b.check_in));
}

export function filterOwnerBookings(
  bookings: OwnerBooking[],
  filter: OwnerBookingFilter,
  today = new Date(),
) {
  const todayKey = dateKey(today);

  return bookings.filter((booking) => {
    const isCancelled = booking.status === 'cancelled';
    const isPast = booking.check_out < todayKey || booking.status === 'completed';
    const isUpcoming = !isCancelled && !isPast;

    if (filter === 'upcoming') return isUpcoming;
    if (filter === 'past') return isPast || isCancelled;
    return true;
  });
}

export function countUpcomingOwnerBookings(bookings: OwnerBooking[], today = new Date()) {
  return filterOwnerBookings(bookings, 'upcoming', today).length;
}
