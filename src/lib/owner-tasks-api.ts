import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];
type PropertyRow = Database['public']['Tables']['properties']['Row'];
type OnboardingRow = Database['public']['Tables']['owner_onboarding']['Row'];
type AgreementRow = Database['public']['Tables']['agreements']['Row'];
type ListingRow = Database['public']['Tables']['listings']['Row'];
type BankRow = Database['public']['Tables']['owner_bank_settings']['Row'];
type CheckinGuideRow = Database['public']['Tables']['checkin_guides']['Row'];

export interface OwnerTaskSignals {
  profile: ProfileRow | null;
  property: PropertyRow | null;
  onboarding: OnboardingRow | null;
  agreement: AgreementRow | null;
  listing: ListingRow | null;
  listings: ListingRow[];
  bank: BankRow | null;
  checkinGuide: CheckinGuideRow | null;
  calendarBlockCount: number;
}

export interface OwnerTaskCompletion {
  profile: boolean;
  property: boolean;
  agreement: boolean;
  bank: boolean;
  photos: boolean;
  description: boolean;
  calendar: boolean;
  keybox: boolean;
  wifi: boolean;
  publish: boolean;
}

const hasText = (value?: string | null) => !!value?.trim();

export async function getOwnerTaskSignals(ownerId: string): Promise<OwnerTaskSignals> {
  const [profileRes, propertyRes, onboardingRes, agreementRes, listingsRes, bankRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', ownerId).maybeSingle(),
    supabase.from('properties').select('*').eq('owner_id', ownerId).order('created_at', { ascending: true }).limit(1).maybeSingle(),
    supabase.from('owner_onboarding').select('*').eq('owner_id', ownerId).order('created_at', { ascending: false }).limit(1).maybeSingle(),
    supabase.from('agreements').select('*').eq('owner_id', ownerId).order('created_at', { ascending: false }).limit(1).maybeSingle(),
    supabase.from('listings').select('*').eq('owner_id', ownerId).order('sort_order'),
    supabase.from('owner_bank_settings').select('*').eq('owner_id', ownerId).maybeSingle(),
  ]);

  if (profileRes.error) throw new Error(profileRes.error.message);
  if (propertyRes.error) throw new Error(propertyRes.error.message);
  if (onboardingRes.error) throw new Error(onboardingRes.error.message);
  if (agreementRes.error) throw new Error(agreementRes.error.message);
  if (listingsRes.error) throw new Error(listingsRes.error.message);
  if (bankRes.error) throw new Error(bankRes.error.message);

  const property = propertyRes.data;
  const listings = listingsRes.data || [];
  const listing = listings[0] || null;
  const propertyId = property?.id || null;
  const listingId = listing?.id || null;

  const [propertyBlocksRes, listingBlocksRes, bookingCalendarRes, guideRes] = await Promise.all([
    propertyId
      ? supabase
        .from('availability_blocks')
        .select('id', { count: 'exact', head: true })
        .eq('property_id', propertyId)
      : Promise.resolve({ count: 0, error: null }),
    listingId
      ? supabase
        .from('listing_blocks')
        .select('id', { count: 'exact', head: true })
        .eq('listing_id', listingId)
      : Promise.resolve({ count: 0, error: null }),
    propertyId
      ? supabase
        .from('bookings')
        .select('id', { count: 'exact', head: true })
        .eq('property_id', propertyId)
        .neq('status', 'cancelled')
      : Promise.resolve({ count: 0, error: null }),
    listingId
      ? supabase
        .from('checkin_guides')
        .select('*')
        .eq('listing_id', listingId)
        .limit(1)
        .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);

  if (propertyBlocksRes.error) throw new Error(propertyBlocksRes.error.message);
  if (listingBlocksRes.error) throw new Error(listingBlocksRes.error.message);
  if (bookingCalendarRes.error) throw new Error(bookingCalendarRes.error.message);
  if (guideRes.error) throw new Error(guideRes.error.message);

  return {
    profile: profileRes.data,
    property,
    onboarding: onboardingRes.data,
    agreement: agreementRes.data,
    listing,
    listings,
    bank: bankRes.data,
    checkinGuide: guideRes.data,
    calendarBlockCount: (propertyBlocksRes.count || 0) + (listingBlocksRes.count || 0) + (bookingCalendarRes.count || 0),
  };
}

export function getOwnerTaskCompletion(signals: OwnerTaskSignals): OwnerTaskCompletion {
  const property = signals.property;
  const listing = signals.listing;
  const profile = signals.profile;
  const bank = signals.bank;
  const guide = signals.checkinGuide;

  const propertyImages = property?.images || [];
  const listingImages = listing?.images || [];
  const photoCount = Math.max(propertyImages.length, listingImages.length);
  const listingDescription = listing?.description || listing?.about_property || '';

  return {
    profile: !!(hasText(profile?.full_name) && hasText(profile?.phone)),
    property: !!(hasText(property?.title) && hasText(property?.address) && property?.capacity),
    agreement: signals.agreement?.status === 'signed' || !!signals.onboarding?.agreement_signed_at,
    bank: !!(hasText(bank?.account_holder) && hasText(bank?.reg_number) && hasText(bank?.account_number)),
    photos: photoCount >= 5,
    description: hasText(listingDescription) && listingDescription.length > 100,
    calendar: signals.calendarBlockCount > 0,
    keybox: !!signals.onboarding?.keybox_installed_at || hasText(guide?.keybox_instructions) || hasText(listing?.access_code),
    wifi: hasText(guide?.wifi_name) && hasText(guide?.wifi_password),
    publish: !!listing?.is_active || !!signals.onboarding?.listing_published_at,
  };
}

export function getOwnerPhotoCount(signals: OwnerTaskSignals) {
  return Math.max(signals.property?.images?.length || 0, signals.listing?.images?.length || 0);
}
