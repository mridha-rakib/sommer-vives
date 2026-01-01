// Admin Types

export interface Booking {
  id: string;
  case_number: string;
  property_id: string;
  owner_id: string;
  guest_id: string | null;
  source_channel: 'direct' | 'airbnb' | 'booking_com' | 'vrbo' | 'other';
  status: 'pending' | 'confirmed' | 'checked_in' | 'completed' | 'cancelled';
  check_in: string;
  check_out: string;
  nights: number;
  guests_count: number;
  base_price: number;
  cleaning_fee: number;
  service_fee: number;
  total_amount: number;
  currency: string;
  platform_fee_percent: number;
  platform_earnings: number | null;
  owner_payout: number | null;
  guest_name: string | null;
  guest_email: string | null;
  guest_phone: string | null;
  notes: string | null;
  internal_notes: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  property?: Property;
  owner?: Profile;
  guest?: Guest;
}

export interface Guest {
  id: string;
  case_number: string;
  email: string;
  name: string;
  phone: string | null;
  gdpr_consent: boolean;
  gdpr_consent_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Property {
  id: string;
  case_number: string | null;
  title: string;
  description: string | null;
  address: string;
  region: string;
  capacity: number;
  bedrooms: number | null;
  bathrooms: number | null;
  price_per_night: number | null;
  price_per_week: number | null;
  cleaning_fee: number | null;
  images: string[];
  amenities: string[];
  house_rules: string | null;
  status: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
  owner?: Profile;
}

export interface Profile {
  id: string;
  case_number: string | null;
  email: string;
  full_name: string | null;
  phone: string | null;
  company_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  actor_user_id: string | null;
  actor_email: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  entity_case_number: string | null;
  before_data: unknown;
  after_data: unknown;
  ip_address: string | null;
  created_at: string;
}

export interface CommissionSplit {
  id: string;
  property_id: string;
  commission_type: 'platform' | 'sales_meeting';
  ek_percentage: number;
  erik_percentage: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
  property?: Property;
}

export interface DamagePool {
  id: string;
  booking_id: string;
  amount: number;
  percentage: number;
  description: string | null;
  created_at: string;
  booking?: Booking;
}

export interface AdminStats {
  totalProperties: number;
  activeProperties: number;
  inactiveProperties: number;
  totalBookings: number;
  upcomingBookings: number;
  pastBookings: number;
  cancelledBookings: number;
  totalGuests: number;
  totalOwners: number;
  totalRevenue: number;
  platformEarnings: number;
  damagePoolTotal: number;
  occupancyRate: number;
}
