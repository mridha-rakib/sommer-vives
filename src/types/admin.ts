// =============================================
// SommerVibes — Full Data Model Types
// =============================================

// --- Enums ---

export type UserRole = 'admin' | 'owner' | 'guest' | 'team';

export type OnboardingStatus =
  | 'lead' | 'account_created' | 'owner_info_complete' | 'property_info_complete'
  | 'agreement_ready' | 'agreement_signed' | 'activated'
  | 'setup_in_progress' | 'listing_review' | 'live';

export type AgreementStatus = 'draft' | 'generated' | 'sent' | 'viewed' | 'signed' | 'archived';

export type PropertySetupStatus =
  | 'new' | 'awaiting_visit' | 'visit_booked' | 'content_pending'
  | 'media_pending' | 'review_pending' | 'ready_to_publish' | 'live';

export type BookingStatus = 'inquiry' | 'pending' | 'confirmed' | 'checked_in' | 'checked_out' | 'completed' | 'cancelled';

export type PaymentStatusEnum = 'pending' | 'paid' | 'failed' | 'refunded' | 'partially_paid';

export type GuestStayStatus = 'upcoming' | 'arrival_ready' | 'in_stay' | 'checkout_pending' | 'completed';

export type SourceChannel = 'direct' | 'airbnb' | 'booking_com' | 'vrbo' | 'other';

export type CommissionType = 'platform' | 'sales_meeting';

// --- Core Entities ---

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

export interface Guest {
  id: string;
  case_number: string | null;
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
  setup_status: PropertySetupStatus;
  owner_id: string;
  created_at: string;
  updated_at: string;
  owner?: Profile;
}

export interface PropertyMedia {
  id: string;
  property_id: string;
  owner_id: string;
  media_type: 'photo' | 'video' | 'floor_plan' | 'drone';
  url: string;
  label: string | null;
  sort_order: number;
  is_hero: boolean;
  created_at: string;
}

// --- Listing & Distribution ---

export interface Listing {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  description: string | null;
  base_price_per_night: number;
  cleaning_fee: number | null;
  max_guests: number;
  bedrooms: number | null;
  bathrooms: number | null;
  region: string | null;
  address: string | null;
  amenities: string[] | null;
  images: string[] | null;
  hero_image: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface ListingDistribution {
  id: string;
  listing_id: string;
  channel: string;
  external_id: string | null;
  external_url: string | null;
  sync_status: 'pending' | 'synced' | 'error';
  last_synced_at: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// --- Booking & Stay ---

export interface Booking {
  id: string;
  case_number: string;
  property_id: string;
  owner_id: string;
  guest_id: string | null;
  source_channel: SourceChannel;
  status: BookingStatus;
  stay_status: GuestStayStatus | null;
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
  payment_status: PaymentStatusEnum;
  guest_name: string | null;
  guest_email: string | null;
  guest_phone: string | null;
  notes: string | null;
  internal_notes: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  property?: Property;
  owner?: Profile;
  guest?: Guest;
}

export interface GuestStay {
  id: string;
  booking_id: string;
  guest_id: string | null;
  status: GuestStayStatus;
  checkin_completed_at: string | null;
  checkout_completed_at: string | null;
  checkin_notes: string | null;
  checkout_notes: string | null;
  guest_rating: number | null;
  host_rating: number | null;
  created_at: string;
  updated_at: string;
  booking?: Booking;
}

// --- Agreements ---

export interface AgreementTemplate {
  id: string;
  name: string;
  version: string;
  body_html: string;
  body_text: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Agreement {
  id: string;
  owner_id: string;
  property_id: string | null;
  template_id: string | null;
  status: AgreementStatus;
  version: string;
  commission_percent: number;
  binding_months: number;
  notice_days: number;
  owner_name: string | null;
  owner_email: string | null;
  owner_phone: string | null;
  owner_address: string | null;
  property_title: string | null;
  property_address: string | null;
  property_region: string | null;
  generated_body: string | null;
  signature_name: string | null;
  signature_data_url: string | null;
  signature_date: string | null;
  signed_at: string | null;
  sent_at: string | null;
  viewed_at: string | null;
  ip_address: string | null;
  pdf_url: string | null;
  accept_terms: boolean;
  accept_privacy: boolean;
  accept_marketing: boolean;
  created_at: string;
  updated_at: string;
}

// --- Payments & Orders ---

export interface Order {
  id: string;
  booking_id: string | null;
  user_id: string | null;
  guest_id: string | null;
  property_id: string | null;
  user_type: string;
  status: string;
  payment_status: PaymentStatusEnum;
  subtotal: number;
  tax: number;
  total: number;
  currency: string;
  stripe_session_id: string | null;
  stripe_payment_intent_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  item_type: string;
  label: string;
  description: string | null;
  reference_id: string | null;
  quantity: number;
  unit_price: number;
  total: number;
  created_at: string;
}

export interface Payment {
  id: string;
  booking_id: string;
  owner_id: string;
  amount: number;
  currency: string;
  status: PaymentStatusEnum;
  payment_method: string | null;
  stripe_payment_id: string | null;
  stripe_payment_intent_id: string | null;
  stripe_checkout_session_id: string | null;
  note: string | null;
  paid_at: string | null;
  created_at: string;
}

export interface Payout {
  id: string;
  owner_id: string;
  property_id: string | null;
  amount: number;
  currency: string | null;
  status: string | null;
  description: string | null;
  payout_date: string | null;
  stripe_payout_id: string | null;
  created_at: string;
}

export interface Invoice {
  id: string;
  order_id: string;
  invoice_number: string;
  status: string;
  subtotal: number;
  tax: number;
  total: number;
  currency: string;
  recipient_name: string | null;
  recipient_email: string | null;
  pdf_url: string | null;
  issued_at: string;
  due_at: string | null;
  paid_at: string | null;
  created_at: string;
}

// --- Communication ---

export interface MessageThread {
  id: string;
  thread_type: 'support' | 'booking' | 'owner' | 'system';
  subject: string | null;
  booking_id: string | null;
  property_id: string | null;
  owner_id: string | null;
  guest_id: string | null;
  status: 'open' | 'resolved' | 'archived';
  last_message_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  thread_id: string | null;
  booking_id: string | null;
  sender_id: string | null;
  sender_name: string | null;
  sender_type: string;
  thread_type: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  body: string | null;
  category: string;
  channel: string;
  link: string | null;
  is_read: boolean;
  read_at: string | null;
  sent_at: string | null;
  created_at: string;
}

// --- Operations ---

export interface SupportTicket {
  id: string;
  requester_id: string | null;
  requester_email: string | null;
  requester_type: 'guest' | 'owner' | 'admin';
  booking_id: string | null;
  property_id: string | null;
  assigned_to: string | null;
  category: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  subject: string;
  description: string | null;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CleaningJob {
  id: string;
  property_id: string;
  booking_id: string | null;
  assigned_to: string | null;
  job_type: string;
  scheduled_date: string;
  status: string;
  checklist: unknown;
  photos: unknown;
  notes: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface MaintenanceJob {
  id: string;
  property_id: string;
  reported_by: string | null;
  assigned_to: string | null;
  category: string;
  priority: string;
  title: string;
  description: string | null;
  status: string;
  photos: unknown;
  cost_estimate: number | null;
  actual_cost: number | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface KeyboxInstallation {
  id: string;
  property_id: string;
  keybox_model: string | null;
  keybox_location: string | null;
  access_code: string | null;
  photo_url: string | null;
  status: string;
  installed_by: string | null;
  installation_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  property_id: string;
  task_type: string;
  status: string;
  scheduled_date: string;
  assigned_to: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Document {
  id: string;
  owner_id: string;
  property_id: string | null;
  booking_id: string | null;
  document_type: string;
  title: string;
  file_url: string | null;
  mime_type: string | null;
  file_size: number | null;
  status: string;
  created_at: string;
}

// --- Onboarding & Leads ---

export interface OnboardingCase {
  id: string;
  owner_id: string;
  status: OnboardingStatus;
  current_step: string | null;
  lead_source: string | null;
  lead_created_at: string | null;
  signup_started_at: string | null;
  profile_activated_at: string | null;
  agreement_generated_at: string | null;
  agreement_signed_at: string | null;
  property_visit_scheduled_at: string | null;
  keybox_installed_at: string | null;
  listing_approved_at: string | null;
  listing_published_at: string | null;
  onboarding_completed_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Lead {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  source: string;
  status: string;
  region: string | null;
  property_type: string | null;
  notes: string | null;
  assigned_to: string | null;
  next_step: string | null;
  next_step_date: string | null;
  converted_owner_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface ServicePartner {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  partner_type: string;
  status: string;
  region: string | null;
  notes: string | null;
  assigned_properties: string[];
  created_at: string;
  updated_at: string;
}

// --- Platform ---

export interface AutomationRule {
  id: string;
  name: string;
  trigger_type: string;
  trigger_event: string;
  action_type: string;
  action_config: unknown;
  delay_minutes: number | null;
  is_active: boolean;
  last_triggered_at: string | null;
  trigger_count: number;
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
  commission_type: CommissionType;
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

// --- Dashboard Stats ---

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
