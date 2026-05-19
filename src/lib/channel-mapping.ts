// ── Channel Mapping & Validation Engine ──
// Maps SommerVibes master listing data → channel-specific fields

// ── Amenity Mapping ──
export interface AmenityMapping {
  internal: string;
  airbnb: string | null;
  booking: string | null;
  vrbo: string | null;
}

export const AMENITY_MAP: AmenityMapping[] = [
  // Essentials
  { internal: 'WiFi', airbnb: 'Wifi', booking: 'WiFi', vrbo: 'Internet/Wifi' },
  { internal: 'Parkering', airbnb: 'Free parking on premises', booking: 'Parking', vrbo: 'Parking' },
  { internal: 'Gratis parkering', airbnb: 'Free parking on premises', booking: 'Free parking', vrbo: 'Free parking' },
  { internal: 'Vaskemaskine', airbnb: 'Washer', booking: 'Washing machine', vrbo: 'Washer' },
  { internal: 'Tørretumbler', airbnb: 'Dryer', booking: 'Tumble dryer', vrbo: 'Dryer' },
  { internal: 'Opvaskemaskine', airbnb: 'Dishwasher', booking: 'Dishwasher', vrbo: 'Dishwasher' },
  // Kitchen
  { internal: 'Køkken', airbnb: 'Kitchen', booking: 'Kitchen', vrbo: 'Kitchen' },
  { internal: 'Køleskab', airbnb: 'Refrigerator', booking: 'Refrigerator', vrbo: 'Refrigerator' },
  { internal: 'Ovn', airbnb: 'Oven', booking: 'Oven', vrbo: 'Oven' },
  { internal: 'Mikroovn', airbnb: 'Microwave', booking: 'Microwave', vrbo: 'Microwave' },
  { internal: 'Kaffemaskine', airbnb: 'Coffee maker', booking: 'Coffee machine', vrbo: 'Coffee maker' },
  { internal: 'Brødrister', airbnb: 'Toaster', booking: 'Toaster', vrbo: 'Toaster' },
  // Comfort
  { internal: 'Aircondition', airbnb: 'Air conditioning', booking: 'Air conditioning', vrbo: 'Air conditioning' },
  { internal: 'Varme', airbnb: 'Heating', booking: 'Heating', vrbo: 'Heating' },
  { internal: 'Gulvvarme', airbnb: 'Heating', booking: 'Underfloor heating', vrbo: 'Heating' },
  { internal: 'Pejs', airbnb: 'Indoor fireplace', booking: 'Fireplace', vrbo: 'Fireplace' },
  { internal: 'Brændeovn', airbnb: 'Indoor fireplace', booking: 'Fireplace', vrbo: 'Fireplace' },
  // Entertainment
  { internal: 'TV', airbnb: 'TV', booking: 'Flat-screen TV', vrbo: 'TV' },
  { internal: 'Smart TV', airbnb: 'TV with streaming', booking: 'Flat-screen TV', vrbo: 'Smart TV' },
  { internal: 'Streaming', airbnb: 'TV with streaming', booking: 'Streaming service', vrbo: 'Smart TV' },
  { internal: 'Bluetooth-højttaler', airbnb: 'Bluetooth sound system', booking: 'Bluetooth speaker', vrbo: 'Sound system' },
  // Outdoor
  { internal: 'Terrasse', airbnb: 'Patio or balcony', booking: 'Terrace', vrbo: 'Deck/Patio' },
  { internal: 'Balkon', airbnb: 'Patio or balcony', booking: 'Balcony', vrbo: 'Balcony' },
  { internal: 'Have', airbnb: 'Garden', booking: 'Garden', vrbo: 'Yard' },
  { internal: 'Grill', airbnb: 'BBQ grill', booking: 'Barbecue', vrbo: 'BBQ grill' },
  { internal: 'Udendørs møbler', airbnb: 'Outdoor furniture', booking: 'Outdoor furniture', vrbo: 'Outdoor furniture' },
  { internal: 'Pool', airbnb: 'Pool', booking: 'Swimming pool', vrbo: 'Pool' },
  { internal: 'Spa / Jacuzzi', airbnb: 'Hot tub', booking: 'Hot tub/Jacuzzi', vrbo: 'Hot tub' },
  { internal: 'Sauna', airbnb: 'Sauna', booking: 'Sauna', vrbo: 'Sauna' },
  // Safety
  { internal: 'Røgalarm', airbnb: 'Smoke alarm', booking: 'Smoke alarms', vrbo: 'Smoke detector' },
  { internal: 'CO-alarm', airbnb: 'Carbon monoxide alarm', booking: 'Carbon monoxide detector', vrbo: 'Carbon monoxide detector' },
  { internal: 'Førstehjælp', airbnb: 'First aid kit', booking: 'First aid kit', vrbo: 'First aid kit' },
  { internal: 'Brandslukning', airbnb: 'Fire extinguisher', booking: 'Fire extinguisher', vrbo: 'Fire extinguisher' },
  // Family
  { internal: 'Børnevenlig', airbnb: 'Children welcome', booking: 'Child-friendly', vrbo: 'Children welcome' },
  { internal: 'Højstol', airbnb: 'High chair', booking: 'Highchair', vrbo: 'High chair' },
  { internal: 'Tremmeseng', airbnb: 'Crib', booking: 'Cot', vrbo: 'Crib' },
  // Accessibility
  { internal: 'Handicapvenlig', airbnb: 'Step-free access', booking: 'Wheelchair accessible', vrbo: 'Wheelchair accessible' },
  // Pets
  { internal: 'Husdyr tilladt', airbnb: 'Pets allowed', booking: 'Pets allowed', vrbo: 'Pets allowed' },
  // Misc
  { internal: 'Sengetøj', airbnb: 'Bed linens', booking: 'Bed linen', vrbo: 'Linens provided' },
  { internal: 'Håndklæder', airbnb: 'Towels', booking: 'Towels', vrbo: 'Towels provided' },
  { internal: 'Hårføner', airbnb: 'Hair dryer', booking: 'Hairdryer', vrbo: 'Hair dryer' },
  { internal: 'Strygejern', airbnb: 'Iron', booking: 'Iron', vrbo: 'Iron' },
];

// ── Field mapping: SommerVibes → Channel ──
export type ChannelKey = 'airbnb' | 'booking' | 'vrbo';

interface BedroomCard {
  title?: string | null;
  bed_types?: string | null;
  bed_count?: number | string | null;
}

export interface ChannelListing {
  name?: string | null;
  tagline?: string | null;
  description?: string | null;
  long_description?: string | null;
  about_property?: string | null;
  about_area?: string | null;
  house_rules?: string | null;
  highlights?: string | string[] | null;
  check_in_time?: string | null;
  check_out_time?: string | null;
  checkin_info?: string | null;
  access_arrival?: string | null;
  access_smart_lock?: string | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  max_guests?: number | null;
  sqm?: number | null;
  bedroom_cards?: BedroomCard[] | null;
  deposit?: number | string | null;
  currency?: string | null;
  hero_image?: string | null;
  images?: string[] | null;
  amenities?: string[] | null;
  address?: string | null;
  base_price_per_night?: number | null;
  [key: string]: unknown;
}

export interface ChannelFieldMapping {
  channelField: string;
  label: string;
  type: 'text' | 'textarea' | 'tags';
  required: boolean;
  maxLength?: number;
  minLength?: number;
  rows?: number;
  hint?: string;
  masterSource: string;
  platformSpecific?: boolean;
  getMasterValue: (listing: ChannelListing) => string | string[] | null;
}

export function getChannelFields(channel: ChannelKey): ChannelFieldMapping[] {
  const shared = {
    title: (listing: ChannelListing) => listing.tagline || listing.name || null,
    description: (listing: ChannelListing) =>
      [listing.long_description, listing.about_property, listing.about_area].filter(Boolean).join('\n\n') || listing.description || null,
    houseRules: (listing: ChannelListing) => listing.house_rules || null,
    highlights: (listing: ChannelListing) => listing.highlights || null,
    checkin: (listing: ChannelListing) => {
      const parts: string[] = [];
      if (listing.check_in_time) parts.push(`Check-in: fra kl. ${listing.check_in_time}`);
      if (listing.check_out_time) parts.push(`Check-out: senest kl. ${listing.check_out_time}`);
      if (listing.checkin_info) parts.push(listing.checkin_info);
      if (listing.access_arrival) parts.push(listing.access_arrival);
      if (listing.access_smart_lock) parts.push(`Smart lock: ${listing.access_smart_lock}`);
      return parts.length ? parts.join('\n') : null;
    },
    roomSetup: (listing: ChannelListing) => {
      const parts: string[] = [];
      if (listing.bedrooms) parts.push(`${listing.bedrooms} soveværelse(r)`);
      if (listing.bathrooms) parts.push(`${listing.bathrooms} badeværelse(r)`);
      if (listing.max_guests) parts.push(`Max ${listing.max_guests} gæster`);
      if (listing.sqm) parts.push(`${listing.sqm} m²`);
      const cards = listing.bedroom_cards || [];
      cards.forEach((c) => {
        if (c.title) parts.push(`${c.title}: ${c.bed_types || `${c.bed_count} seng(e)`}`);
      });
      return parts.length ? parts.join('\n') : null;
    },
  };

  const fields: Record<ChannelKey, ChannelFieldMapping[]> = {
    airbnb: [
      { channelField: 'channel_airbnb_title', label: 'Airbnb-titel', type: 'text', required: true, maxLength: 50, hint: 'Max 50 tegn – kort og clickbait', masterSource: 'Navn / Tagline', getMasterValue: shared.title },
      { channelField: 'channel_airbnb_description', label: 'Airbnb-beskrivelse', type: 'textarea', required: true, rows: 6, minLength: 100, hint: 'Min. 100 tegn – detaljeret beskrivelse', masterSource: 'Beskrivelse + Om boligen + Område', getMasterValue: shared.description },
      { channelField: 'channel_airbnb_highlights', label: 'Highlights', type: 'tags', required: true, hint: 'Top-oplevelser (komma-separeret)', masterSource: 'Highlights', getMasterValue: shared.highlights },
      { channelField: 'channel_airbnb_house_rules', label: 'Husregler', type: 'textarea', required: true, rows: 3, masterSource: 'Husregler', getMasterValue: shared.houseRules },
      { channelField: 'channel_airbnb_checkin_notes', label: 'Check-in noter', type: 'textarea', required: true, rows: 3, hint: 'Ankomstinfo, smart lock, parkering', masterSource: 'Ankomst & adgang', getMasterValue: shared.checkin },
    ],
    booking: [
      { channelField: 'channel_booking_title', label: 'Booking.com-titel', type: 'text', required: true, hint: 'Officielt ejendomsnavn', masterSource: 'Navn', getMasterValue: (l) => l.name || null },
      { channelField: 'channel_booking_description', label: 'Beskrivelse', type: 'textarea', required: true, rows: 6, minLength: 100, masterSource: 'Beskrivelse + Om boligen', getMasterValue: (l) => [l.long_description, l.about_property].filter(Boolean).join('\n\n') || l.description || null },
      { channelField: 'channel_booking_room_setup', label: 'Værelseopsætning', type: 'textarea', required: true, rows: 4, platformSpecific: true, hint: 'Booking.com kræver detaljeret rum-info', masterSource: 'Soveværelser + kapacitet', getMasterValue: shared.roomSetup },
      { channelField: 'channel_booking_policies', label: 'Politikker', type: 'textarea', required: true, rows: 3, platformSpecific: true, hint: 'Afbestilling, depositum, etc.', masterSource: 'Husregler + depositum', getMasterValue: (l) => { const p: string[] = []; if (l.deposit) p.push(`Depositum: ${l.deposit} ${l.currency || 'DKK'}`); if (l.house_rules) p.push(l.house_rules); return p.length ? p.join('\n') : null; } },
      { channelField: 'channel_booking_checkin_checkout', label: 'Check-in / Check-out', type: 'textarea', required: true, rows: 3, masterSource: 'Check-in/out tider + adgang', getMasterValue: shared.checkin },
    ],
    vrbo: [
      { channelField: 'channel_vrbo_title', label: 'Vrbo-titel', type: 'text', required: true, hint: 'Vrbo prioriterer beskrivende titler', masterSource: 'Navn / Tagline', getMasterValue: shared.title },
      { channelField: 'channel_vrbo_description', label: 'Vrbo-beskrivelse', type: 'textarea', required: true, rows: 6, minLength: 100, masterSource: 'Beskrivelse + Område', getMasterValue: (l) => [l.long_description, l.about_area].filter(Boolean).join('\n\n') || l.description || null },
      { channelField: 'channel_vrbo_highlights', label: 'Highlights', type: 'tags', required: true, hint: 'Top-features (komma-separeret)', masterSource: 'Highlights', getMasterValue: shared.highlights },
      { channelField: 'channel_vrbo_rules', label: 'Vrbo-regler', type: 'textarea', required: true, rows: 3, masterSource: 'Husregler', getMasterValue: shared.houseRules },
    ],
  };
  return fields[channel];
}

// ── Validation ──
export interface ValidationResult {
  field: string;
  label: string;
  status: 'ok' | 'warning' | 'error';
  message: string;
  tab: string;
}

export function validateChannel(listing: ChannelListing, channel: ChannelKey): ValidationResult[] {
  const results: ValidationResult[] = [];
  const fields = getChannelFields(channel);
  const tab = channel === 'booking' ? 'bookingcom' : channel;

  // Field-level validation
  fields.forEach(f => {
    const val = listing[f.channelField];
    const hasValue = Array.isArray(val) ? val.length > 0 : !!val?.toString().trim();

    if (!hasValue && f.required) {
      results.push({ field: f.channelField, label: f.label, status: 'error', message: `${f.label} mangler`, tab });
    } else if (hasValue) {
      if (f.maxLength && typeof val === 'string' && val.length > f.maxLength) {
        results.push({ field: f.channelField, label: f.label, status: 'warning', message: `${f.label} er for lang (${val.length}/${f.maxLength})`, tab });
      }
      if (f.minLength && typeof val === 'string' && val.length < f.minLength) {
        results.push({ field: f.channelField, label: f.label, status: 'warning', message: `${f.label} er for kort (${val.length}/${f.minLength} tegn)`, tab });
      }
    }
  });

  // Shared validations
  if (!listing.hero_image) results.push({ field: 'hero_image', label: 'Hero-billede', status: 'error', message: 'Intet hero-billede valgt', tab: 'media' });
  if ((listing.images?.length || 0) < 5) results.push({ field: 'images', label: 'Galleri', status: 'warning', message: `Kun ${listing.images?.length || 0} billeder – min. 5 anbefalet`, tab: 'media' });
  if ((listing.amenities?.length || 0) < 3) results.push({ field: 'amenities', label: 'Faciliteter', status: 'warning', message: 'Færre end 3 faciliteter mapped', tab: 'amenities' });
  if (!listing.address) results.push({ field: 'address', label: 'Adresse', status: 'error', message: 'Adresse mangler', tab: 'setup' });
  if (!(listing.base_price_per_night > 0)) results.push({ field: 'base_price_per_night', label: 'Basispris', status: 'error', message: 'Ingen basispris sat', tab: 'hero' });
  if (!listing.check_in_time) results.push({ field: 'check_in_time', label: 'Check-in tid', status: 'warning', message: 'Check-in tid mangler', tab: 'access' });

  return results;
}

// ── Amenity mapping helpers ──
export function mapAmenitiesToChannel(internalAmenities: string[], channel: ChannelKey): { mapped: string[]; unmapped: string[] } {
  const mapped: string[] = [];
  const unmapped: string[] = [];

  internalAmenities.forEach(a => {
    const match = AMENITY_MAP.find(m => m.internal.toLowerCase() === a.toLowerCase());
    if (match && match[channel]) {
      const channelName = match[channel]!;
      if (!mapped.includes(channelName)) mapped.push(channelName);
    } else {
      unmapped.push(a);
    }
  });

  return { mapped, unmapped };
}

// ── Media ordering helpers ──
export function getChannelImageOrder(
  images: string[],
  heroImage: string | null,
  imageLabels: Record<string, string> | null,
  channel: ChannelKey
): string[] {
  const ordered: string[] = [];
  
  // Hero always first
  if (heroImage && images.includes(heroImage)) {
    ordered.push(heroImage);
  }

  // Priority categories per channel
  const priorityCategories: Record<ChannelKey, string[]> = {
    airbnb: ['living', 'bedroom', 'kitchen', 'bathroom', 'outdoor', 'view'],
    booking: ['bedroom', 'bathroom', 'living', 'kitchen', 'outdoor', 'dining'],
    vrbo: ['outdoor', 'living', 'bedroom', 'kitchen', 'pool', 'view'],
  };

  const cats = priorityCategories[channel];
  const labels = imageLabels || {};

  // Add by priority category
  cats.forEach(cat => {
    images.forEach(img => {
      if (!ordered.includes(img) && labels[img] === cat) {
        ordered.push(img);
      }
    });
  });

  // Add remaining
  images.forEach(img => {
    if (!ordered.includes(img)) ordered.push(img);
  });

  return ordered;
}

// ── Channel readiness score ──
export function calcChannelScore(listing: ChannelListing, channel: ChannelKey): {
  score: number;
  errors: ValidationResult[];
  warnings: ValidationResult[];
  passed: string[];
} {
  const validations = validateChannel(listing, channel);
  const errors = validations.filter(v => v.status === 'error');
  const warnings = validations.filter(v => v.status === 'warning');

  const fields = getChannelFields(channel);
  const totalChecks = fields.length + 4; // +4 for shared checks
  const failedChecks = errors.length;
  const score = Math.max(0, Math.round(((totalChecks - failedChecks) / totalChecks) * 100));

  const passed = fields
    .filter(f => {
      const val = listing[f.channelField];
      return Array.isArray(val) ? val.length > 0 : !!val?.toString().trim();
    })
    .map(f => f.label);

  return { score, errors, warnings, passed };
}
