/**
 * Core pricing logic for SommerVibes listings.
 * All prices in øre (minor units). Divide by 100 for DKK display.
 */

export interface Listing {
  id: string;
  slug?: string;
  name: string;
  base_price_per_night: number;
  cleaning_fee: number;
  check_in_time: string;
  check_out_time: string;
  max_guests: number;
  currency: string;
}

export interface SeasonRule {
  id: string;
  listing_id: string;
  name: string;
  start_month: number;
  start_day: number;
  end_month: number;
  end_day: number;
  price_per_night: number;
  price_type: 'fixed' | 'percentage';
  price_percentage: number | null;
  min_nights: number;
  priority: number;
  status: string;
  check_in_days: number[] | null;
  check_out_days: number[] | null;
}

export interface DailyOverride {
  id: string;
  listing_id: string;
  date: string;
  price: number;
  price_type: 'fixed' | 'percentage';
  price_percentage: number | null;
  note: string | null;
}

export interface PriceBreakdown {
  listing: Listing;
  date: string;
  basePrice: number;
  activeSeasonRule: SeasonRule | null;
  activeDailyOverride: DailyOverride | null;
  isWeekend: boolean;
  weekendMultiplier: number;
  priceBeforeMultiplier: number;
  finalPrice: number;
  minNights: number;
  checkInTime: string;
  checkOutTime: string;
  checkInDays: number[] | null;
  checkOutDays: number[] | null;
  priceSource: 'override' | 'season' | 'base';
}

const WEEKEND_MULTIPLIER = 1.25;

function isDateInSeason(date: Date, rule: SeasonRule): boolean {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const dateVal = month * 100 + day;
  const startVal = rule.start_month * 100 + rule.start_day;
  const endVal = rule.end_month * 100 + rule.end_day;

  if (startVal <= endVal) {
    return dateVal >= startVal && dateVal <= endVal;
  } else {
    return dateVal >= startVal || dateVal <= endVal;
  }
}

function applyPercentage(basePrice: number, percentage: number): number {
  return Math.round(basePrice * (1 + percentage / 100));
}

export function calculatePriceBreakdown(
  date: Date,
  listing: Listing,
  seasonRules: SeasonRule[],
  dailyOverrides: DailyOverride[]
): PriceBreakdown {
  const dateStr = date.toISOString().split('T')[0];
  const dayOfWeek = date.getDay();
  const isWeekend = dayOfWeek === 5 || dayOfWeek === 6;

  const activeDailyOverride = dailyOverrides.find(
    (o) => o.listing_id === listing.id && o.date === dateStr
  ) || null;

  const matchingSeasons = seasonRules
    .filter(
      (r) =>
        r.listing_id === listing.id &&
        r.status === 'active' &&
        isDateInSeason(date, r)
    )
    .sort((a, b) => (b.priority || 0) - (a.priority || 0));

  const activeSeasonRule = matchingSeasons[0] || null;

  let priceBeforeMultiplier: number;
  let priceSource: 'override' | 'season' | 'base';

  let seasonPrice: number;
  if (activeSeasonRule) {
    if (activeSeasonRule.price_type === 'percentage' && activeSeasonRule.price_percentage !== null) {
      seasonPrice = applyPercentage(listing.base_price_per_night, activeSeasonRule.price_percentage);
    } else {
      seasonPrice = activeSeasonRule.price_per_night;
    }
  } else {
    seasonPrice = listing.base_price_per_night;
  }

  if (activeDailyOverride) {
    if (activeDailyOverride.price_type === 'percentage' && activeDailyOverride.price_percentage !== null) {
      priceBeforeMultiplier = applyPercentage(seasonPrice, activeDailyOverride.price_percentage);
    } else {
      priceBeforeMultiplier = activeDailyOverride.price;
    }
    priceSource = 'override';
  } else if (activeSeasonRule) {
    priceBeforeMultiplier = seasonPrice;
    priceSource = 'season';
  } else {
    priceBeforeMultiplier = listing.base_price_per_night;
    priceSource = 'base';
  }

  const weekendMultiplier = isWeekend ? WEEKEND_MULTIPLIER : 1;
  const finalPrice = Math.round(priceBeforeMultiplier * weekendMultiplier);

  const minNights = activeSeasonRule?.min_nights || 2;
  const checkInDays = activeSeasonRule?.check_in_days || null;
  const checkOutDays = activeSeasonRule?.check_out_days || null;

  return {
    listing,
    date: dateStr,
    basePrice: listing.base_price_per_night,
    activeSeasonRule,
    activeDailyOverride,
    isWeekend,
    weekendMultiplier,
    priceBeforeMultiplier,
    finalPrice,
    minNights,
    checkInTime: listing.check_in_time,
    checkOutTime: listing.check_out_time,
    checkInDays,
    checkOutDays,
    priceSource,
  };
}

export function formatDKK(oere: number): string {
  return `${(oere / 100).toLocaleString('da-DK')} kr`;
}

export function formatDateDK(dateStr: string, style: 'short' | 'long' | 'medium' = 'short'): string {
  const d = new Date(dateStr + 'T00:00:00');
  if (style === 'long') {
    return d.toLocaleDateString('da-DK', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  }
  if (style === 'medium') {
    return d.toLocaleDateString('da-DK', { day: 'numeric', month: 'short', year: 'numeric' });
  }
  return d.toLocaleDateString('da-DK', { day: 'numeric', month: 'numeric', year: '2-digit' });
}

const DA_DAYS = ['Søndag', 'Mandag', 'Tirsdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lørdag'];
export function dayName(dayIndex: number): string {
  return DA_DAYS[dayIndex] || '';
}
