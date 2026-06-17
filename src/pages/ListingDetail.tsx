import { useParams, Link } from 'react-router-dom';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { ContentCarousel, type ContentSection } from '@/components/listing/ContentCarousel';
import { BrandDivider } from '@/components/listing/BrandDivider';
import { RareFindBadge } from '@/components/listing/RareFindBadge';
import { BestValueBadge } from '@/components/listing/BestValueBadge';
import { ReviewsSection, type Review } from '@/components/listing/ReviewsSection';
import { VideoGuideGrid } from '@/components/listing/VideoGuideGrid';
import { ContactHost } from '@/components/listing/ContactHost';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { absoluteUrl, BRAND_NAME, cleanText, truncateText, usePageSeo } from '@/lib/seo';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Star, Users, Bed, Bath, MapPin, ArrowLeft, ChevronLeft, ChevronRight, ChevronDown,
  Loader2, X, Maximize2, Calendar as CalendarIcon, Minus, Plus,
  Wifi, Flame, ParkingCircle, UtensilsCrossed, Waves, Dog, TreePine,
  Lock, Leaf, Info, Map, LayoutPanelLeft, Check, Shield, Eye,
  Baby, Tv, Sun, Car, Heart, Snowflake, Monitor, BookOpen, Gamepad2,
  Shirt, Home, Plug, ShowerHead, WashingMachine, Coffee,
} from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { format, differenceInDays } from 'date-fns';
import { da, enUS } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { DateRange } from 'react-day-picker';
import { useTranslation } from '@/lib/i18n';
import { useBooking } from '@/components/booking/BookingContext';

// ─── Types ──────────────────────────────────────────────
interface BedroomImage { url: string; label: string; description?: string; }
interface FacilityItem { name: string; description?: string; included: boolean; }
interface FacilityCategory { category: string; items: FacilityItem[]; }
interface ListingSeoData {
  canonical_url: string | null;
  meta_description: string | null;
  meta_title: string | null;
  og_image: string | null;
}

interface ListingData {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  address: string | null;
  region: string | null;
  city: string | null;
  country: string | null;
  max_guests: number;
  bedrooms: number | null;
  bathrooms: number | null;
  base_price_per_night: number;
  currency: string | null;
  cleaning_fee: number | null;
  amenities: string[] | null;
  images: string[] | null;
  hero_image: string | null;
  check_in_time: string | null;
  check_out_time: string | null;
  house_rules: string | null;
  practical_info: string | null;
  extra_sections: { title: string; body: string; image?: string }[] | null;
  bedroom_images: BedroomImage[] | null;
  facilities: FacilityCategory[] | null;
  floor_plan_images: string[] | null;
  image_labels: { url: string; label: string }[] | null;
  location_map_image: string | null;
  location_mood_image: string | null;
  tagline: string | null;
  long_description: string | null;
  about_property: string | null;
  about_area: string | null;
  highlights: string[] | null;
  sqm: number | null;
  property_type: string | null;
  checkin_info: string | null;
  checkout_info: string | null;
  latitude: number | null;
  longitude: number | null;
  seo_title: string | null;
  seo_description: string | null;
  seo_image: string | null;
  reviews_title: string | null;
  reviews_rating: number | null;
  reviews_count: number | null;
  reviews_entries: unknown[] | null;
  updated_at: string | null;
  listing_seo?: ListingSeoData | ListingSeoData[] | null;
}

// ─── Icon Maps ──────────────────────────────────────────
const ITEM_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  'WiFi': Wifi, 'Brændeovn': Flame, 'Parkering': ParkingCircle,
  'Køkken': UtensilsCrossed, 'Pool': Waves, 'Kæledyr': Dog,
  'Skov': TreePine, 'Vaskemaskine': WashingMachine, 'Opvaskemaskine': UtensilsCrossed,
  'TV': Monitor, 'Hårføner': ShowerHead, 'Kaffe': Coffee,
  'Aircondition': Snowflake, 'Terrasse': Sun, 'Have': Leaf,
  'Babystol': Baby, 'Alarm': Shield,
};

const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  'Udsigt': Eye, 'Badeværelse': Bath, 'Soveværelse': Bed,
  'Underholdning': Tv, 'Familie': Baby, 'Opvarmning': Flame,
  'Sikkerhed': Shield, 'Internet': Wifi, 'Køkken': UtensilsCrossed,
  'Udendørs': TreePine, 'Parkering': Car, 'Faciliteter': Home,
};

const getItemIcon = (name: string) => ITEM_ICONS[name] || Check;

const listingCopy = {
  da: {
    notFound: 'Ikke fundet',
    seeAllHomes: 'Se alle sommerhuse',
    backToHomes: 'Alle sommerhuse',
    floorPlan: 'Plantegning',
    floorPlanAlt: 'Plantegning',
    map: 'Kort',
    fallbackHighlights: [
      { title: 'Naturskøn beliggenhed', desc: 'Omgivet af naturens ro — perfekt til afslapning.' },
      { title: 'Nem indtjekning', desc: 'Tjek ind uden vært med smartlås eller nøgleboks.' },
      { title: 'Fred og ro', desc: 'Et roligt og fredfyldt opholdssted for hele familien.' },
    ],
    readMoreBelow: 'Læs mere nedenfor',
    guests: 'Gæster',
    guest: 'gæst',
    guestPlural: 'gæster',
    bedrooms: 'Soveværelser',
    bathrooms: 'Badeværelser',
    area: 'Areal',
    checkInOut: 'Check-in / ud',
    earlyLateInfo: 'Tidlig check-in eller sen check-ud kan tilkøbes under booking.',
    included: 'Inkluderet i dit ophold',
    finalCleaning: 'Slutrengøring',
    includedInPrice: '— inkluderet i prisen',
    from: 'Fra',
    perNight: 'kr. / nat',
    currencyShort: 'kr',
    currency: 'kr.',
    selectDate: 'Vælg dato',
    checkout: 'Check-ud',
    night: 'nat',
    nights: 'nætter',
    cleaning: 'Rengøring',
    serviceFee: 'Servicegebyr',
    total: 'I alt',
    bookNow: 'Book nu',
    selectDates: 'Vælg datoer',
    paymentNote: 'Du betaler først ved bekræftelse',
    aboutThisPlace: 'Om dette sted',
    aboutHome: 'Om boligen',
    aboutArea: 'Om området',
    houseRules: 'Husregler',
    practicalInfo: 'Praktisk info',
    locationTitle: 'Her skal du være',
    areaAlt: 'Området',
    bedroomTitle: 'Her skal du sove',
    facilitiesTitle: 'Det tilbyder denne bolig',
    showAllCategories: (count: number) => `Vis alle ${count} kategorier`,
  },
  en: {
    notFound: 'Not found',
    seeAllHomes: 'See all holiday homes',
    backToHomes: 'All holiday homes',
    floorPlan: 'Floor plan',
    floorPlanAlt: 'Floor plan',
    map: 'Map',
    fallbackHighlights: [
      { title: 'Scenic location', desc: 'Surrounded by peaceful nature — perfect for unwinding.' },
      { title: 'Easy check-in', desc: 'Check in independently with a smart lock or key box.' },
      { title: 'Peace and quiet', desc: 'A calm, relaxing stay for the whole family.' },
    ],
    readMoreBelow: 'Read more below',
    guests: 'Guests',
    guest: 'guest',
    guestPlural: 'guests',
    bedrooms: 'Bedrooms',
    bathrooms: 'Bathrooms',
    area: 'Area',
    checkInOut: 'Check-in / out',
    earlyLateInfo: 'Early check-in or late check-out can be added during booking.',
    included: 'Included in your stay',
    finalCleaning: 'Final cleaning',
    includedInPrice: '— included in the price',
    from: 'From',
    perNight: 'DKK / night',
    currencyShort: 'DKK',
    currency: 'DKK',
    selectDate: 'Select date',
    checkout: 'Check-out',
    night: 'night',
    nights: 'nights',
    cleaning: 'Cleaning',
    serviceFee: 'Service fee',
    total: 'Total',
    bookNow: 'Book now',
    selectDates: 'Select dates',
    paymentNote: 'You only pay when the booking is confirmed',
    aboutThisPlace: 'About this place',
    aboutHome: 'About the home',
    aboutArea: 'About the area',
    houseRules: 'House rules',
    practicalInfo: 'Practical info',
    locationTitle: 'Where you’ll be',
    areaAlt: 'The area',
    bedroomTitle: 'Where you’ll sleep',
    facilitiesTitle: 'What this home offers',
    showAllCategories: (count: number) => `Show all ${count} categories`,
  },
};

const getListingSeo = (listing: ListingData): ListingSeoData | null => {
  if (Array.isArray(listing.listing_seo)) return listing.listing_seo[0] || null;
  return listing.listing_seo || null;
};

const getListingDescription = (listing: ListingData, seo: ListingSeoData | null) => {
  const fallback = `Book ${listing.name} hos ${BRAND_NAME}. Se billeder, faciliteter og pris for dette sommerhus.`;
  return truncateText(cleanText(
    seo?.meta_description ||
    listing.seo_description ||
    listing.tagline ||
    listing.description ||
    listing.long_description ||
    fallback
  ));
};

const buildListingJsonLd = (listing: ListingData, canonicalUrl: string, description: string) => {
  const price = Number((listing.base_price_per_night / 100).toFixed(2));
  const imageUrls = [
    listing.hero_image,
    ...(listing.images || []),
  ]
    .map((image) => absoluteUrl(image))
    .filter(Boolean);

  const details: Array<{ name: string; value: number | string }> = [
    { name: 'Guests', value: listing.max_guests },
  ];
  if (listing.bedrooms) details.push({ name: 'Bedrooms', value: listing.bedrooms });
  if (listing.bathrooms) details.push({ name: 'Bathrooms', value: listing.bathrooms });
  if (listing.sqm) details.push({ name: 'Square meters', value: listing.sqm });

  const additionalProperty = details.map((property) => ({
    '@type': 'PropertyValue',
    ...property,
  }));

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `${canonicalUrl}#product`,
    name: listing.name,
    description,
    url: canonicalUrl,
    image: imageUrls,
    brand: {
      '@type': 'Brand',
      name: BRAND_NAME,
    },
    category: listing.property_type || 'Sommerhus',
    sku: listing.id,
    offers: {
      '@type': 'Offer',
      url: canonicalUrl,
      price,
      priceCurrency: listing.currency || 'DKK',
      availability: 'https://schema.org/InStock',
      itemCondition: 'https://schema.org/NewCondition',
      priceSpecification: {
        '@type': 'UnitPriceSpecification',
        price,
        priceCurrency: listing.currency || 'DKK',
        unitText: 'night',
      },
    },
    additionalProperty,
  };
};

// ─── Component ──────────────────────────────────────────
const ListingDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const { language } = useTranslation();
  const copy = language === 'en' ? listingCopy.en : listingCopy.da;
  const dateLocale = language === 'en' ? enUS : da;
  const dateFormat = language === 'en' ? 'MMM d' : 'dd. MMM';
  const moneyLocale = language === 'en' ? 'en-US' : 'da-DK';
  const [listing, setListing] = useState<ListingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImage, setCurrentImage] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [floorPlanOpen, setFloorPlanOpen] = useState(false);
  const [floorPlanIndex, setFloorPlanIndex] = useState(0);
  const [mapOpen, setMapOpen] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [guests, setGuests] = useState(2);
  const { open: openBooking } = useBooking();

  const handleBookNow = () => {
    if (!listing) return;
    openBooking(
      {
        id: listing.id,
        title: listing.name,
        image: listing.hero_image || listing.images?.[0] || undefined,
        maxGuests: listing.max_guests,
        checkInTime: listing.check_in_time || undefined,
        checkOutTime: listing.check_out_time || undefined,
      },
      {
        checkIn: dateRange?.from,
        checkOut: dateRange?.to,
        guests,
      },
    );
  };

  useEffect(() => {
    if (!slug) return;
    const load = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('listings')
        .select('*, listing_seo(meta_title, meta_description, og_image, canonical_url)')
        .eq('slug', slug)
        .eq('is_active', true)
        .single();
      setListing(data as unknown as ListingData | null);
      setLoading(false);
    };
    load();
  }, [slug]);

  // Keyboard navigation
  useEffect(() => {
    const images = listing?.images || [];
    if (images.length <= 1) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'ArrowRight') { e.preventDefault(); setCurrentImage((p) => (p + 1) % images.length); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); setCurrentImage((p) => (p - 1 + images.length) % images.length); }
      if (e.key === 'Escape') setLightboxOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [listing?.images]);

  const pageSeo = useMemo(() => {
    if (!listing) return null;

    const listingSeo = getListingSeo(listing);
    const canonicalPath = `/listing/${encodeURIComponent(listing.slug)}/`;
    const canonicalUrl = listingSeo?.canonical_url || absoluteUrl(canonicalPath) || canonicalPath;
    const description = getListingDescription(listing, listingSeo);
    const generatedOgImage = `/og/listings/${encodeURIComponent(listing.slug)}.png`;
    const image = listingSeo?.og_image || listing.seo_image || generatedOgImage;
    const title = cleanText(listingSeo?.meta_title || listing.seo_title || `${listing.name} | ${BRAND_NAME}`);

    return {
      title,
      description,
      canonicalUrl,
      image,
      type: 'product' as const,
      jsonLd: buildListingJsonLd(listing, canonicalUrl, description),
    };
  }, [listing]);

  usePageSeo(pageSeo);

  const listingReviews = useMemo<Review[]>(() => {
    if (!listing || !Array.isArray(listing.reviews_entries)) return [];

    return listing.reviews_entries
      .filter((entry): entry is Record<string, unknown> => (
        !!entry
        && typeof entry === 'object'
        && (entry as Record<string, unknown>).active !== false
        && typeof (entry as Record<string, unknown>).text === 'string'
        && ((entry as Record<string, unknown>).text as string).trim().length > 0
      ))
      .map((entry, index) => ({
        id: typeof entry.id === 'string' ? entry.id : `${listing.id}-review-${index}`,
        name: typeof entry.name === 'string' && entry.name.trim() ? entry.name : copy.guest,
        location: typeof entry.location === 'string' ? entry.location : undefined,
        text: String(entry.text),
        rating: Math.min(5, Math.max(1, Number(entry.rating || 5))),
        date: typeof entry.date === 'string' && entry.date.trim() ? entry.date : '',
      }));
  }, [copy.guest, listing]);

  if (loading) {
    return (
      <PublicLayout>
        <div className="min-h-screen bg-background">
          <div className="py-4 container mx-auto px-4 lg:px-8">
            <div className="h-4 w-24 bg-muted animate-pulse rounded mb-4" />
          </div>
          <div className="container mx-auto px-4 lg:px-8 mb-10">
            <div className="rounded-2xl overflow-hidden aspect-[16/9] bg-muted animate-pulse" />
            <div className="flex gap-2 mt-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="w-24 h-16 rounded-lg bg-muted animate-pulse flex-shrink-0" />
              ))}
            </div>
          </div>
          <div className="container mx-auto px-4 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
              <div className="lg:col-span-3 space-y-4">
                <div className="h-8 w-3/4 bg-muted animate-pulse rounded" />
                <div className="h-4 w-full bg-muted animate-pulse rounded" />
                <div className="h-4 w-2/3 bg-muted animate-pulse rounded" />
              </div>
              <div className="lg:col-span-2 space-y-3">
                <div className="h-6 w-1/2 bg-muted animate-pulse rounded" />
                <div className="h-4 w-full bg-muted animate-pulse rounded" />
              </div>
            </div>
          </div>
        </div>
      </PublicLayout>
    );
  }

  if (!listing) {
    return (
      <PublicLayout>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <h1 className="font-display text-4xl text-foreground mb-4">{copy.notFound}</h1>
            <Button asChild><Link to="/listings">{copy.seeAllHomes}</Link></Button>
          </div>
        </div>
      </PublicLayout>
    );
  }

  const images = Array.isArray(listing.images) && listing.images.length ? listing.images : ['/placeholder.svg'];
  const priceFrom = listing.base_price_per_night / 100;
  const cleaningFee = (listing.cleaning_fee || 0) / 100;
  const nights = dateRange?.from && dateRange?.to ? differenceInDays(dateRange.to, dateRange.from) : 0;
  const serviceFee = Math.round(nights * priceFrom * 0.05);
  const total = nights * priceFrom + cleaningFee + serviceFee;
  const bedroomImages: BedroomImage[] = Array.isArray(listing.bedroom_images) ? listing.bedroom_images as BedroomImage[] : [];
  const facilities: FacilityCategory[] = Array.isArray(listing.facilities) ? listing.facilities as FacilityCategory[] : [];
  const contentSections: ContentSection[] = Array.isArray(listing.extra_sections)
    ? listing.extra_sections
        .filter((s) => s.title && s.body)
        .map((s, i) => ({ title: s.title, body: s.body, image: s.image || images[Math.min(i + 1, images.length - 1)] }))
    : [];
  const floorPlanImages = Array.isArray(listing.floor_plan_images) && listing.floor_plan_images.length ? listing.floor_plan_images : [];
  const imageLabels: { url: string; label: string }[] = Array.isArray(listing.image_labels) ? listing.image_labels as { url: string; label: string }[] : [];
  const getImageLabel = (url: string) => imageLabels.find(l => l.url === url)?.label || '';

  const nextImage = () => setCurrentImage((prev) => (prev + 1) % images.length);
  const prevImage = () => setCurrentImage((prev) => (prev - 1 + images.length) % images.length);

  const actionButtons = [
    ...(floorPlanImages.length > 0 ? [{ icon: LayoutPanelLeft, label: copy.floorPlan, onClick: () => setFloorPlanOpen(true) }] : []),
    ...(listing.address ? [{ icon: Map, label: copy.map, onClick: () => setMapOpen(true) }] : []),
  ];

  return (
    <PublicLayout>
      <div className="min-h-screen bg-background">
        {/* Back nav */}
        <div className="pt-20 container mx-auto px-4 lg:px-8 mb-4">
          <Link to="/listings" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" /> {copy.backToHomes}
          </Link>
        </div>

        {/* Image Gallery */}
        <div className="container mx-auto px-4 lg:px-8 mb-10 relative">
          <div className="relative rounded-2xl overflow-hidden aspect-[16/9]">
            <img
              src={images[currentImage]}
              alt={listing.name}
              className="w-full h-full object-cover cursor-pointer"
              onClick={() => setLightboxOpen(true)}
            />
            {getImageLabel(images[currentImage]) && (
              <div className="absolute top-0 left-0 z-10">
                <div className="bg-primary/90 backdrop-blur-sm text-background px-4 py-1.5 rounded-br-xl text-sm font-medium tracking-wide shadow-lg">
                  🏠 {getImageLabel(images[currentImage])}
                </div>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />

            {images.length > 1 && (
              <div className="absolute top-4 left-4 z-10 px-3 py-1.5 rounded-lg bg-black/60 backdrop-blur-sm text-white text-sm font-medium">
                {currentImage + 1} / {images.length}
              </div>
            )}

            <button onClick={() => setLightboxOpen(true)}
              className="absolute top-4 right-4 z-10 p-2.5 rounded-xl bg-background/80 backdrop-blur-sm border border-border/50 text-foreground hover:bg-primary hover:text-background transition-all">
              <Maximize2 className="h-4 w-4" />
            </button>

            {images.length > 1 && (
              <>
                <button onClick={prevImage} className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center hover:bg-background transition-colors">
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button onClick={nextImage} className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center hover:bg-background transition-colors">
                  <ChevronRight className="h-5 w-5" />
                </button>
              </>
            )}

            {/* Action buttons */}
            {actionButtons.length > 0 && (
              <div className="absolute bottom-4 left-4 right-4 flex gap-2 justify-center lg:justify-start">
                {actionButtons.map((item) => (
                  <button key={item.label} onClick={item.onClick}
                    className="flex items-center gap-2 px-4 py-2.5 bg-background/80 backdrop-blur-md text-foreground rounded-xl border border-border/50 hover:bg-primary hover:text-background transition-all text-xs sm:text-sm font-medium whitespace-nowrap">
                    <item.icon className="h-4 w-4 flex-shrink-0" />
                    <span className="hidden sm:inline">{item.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Thumbnails */}
          <ThumbnailStrip images={images} currentImage={currentImage} onSelect={setCurrentImage} onShowAll={() => setLightboxOpen(true)} />
        </div>

        {/* Content */}
        <section className="container mx-auto px-4 lg:px-8 pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-14 mb-0">
            {/* Left – main content */}
            <div className="lg:col-span-3">
              <h1 className="font-display text-2xl md:text-3xl font-semibold text-primary mb-2 leading-tight">
                {listing.name}
              </h1>
              {listing.tagline && (
                <p className="text-primary/70 font-display text-lg italic mb-4">{listing.tagline}</p>
              )}
              {listing.description && (
                <p className="text-muted-foreground leading-relaxed text-[17px] whitespace-pre-line max-w-2xl">
                  {listing.description}
                </p>
              )}

              {/* Highlights from DB or fallback */}
              {(listing.highlights && listing.highlights.length > 0) ? (
                <div className="relative mt-8 space-y-4 border-t border-border/40 pt-6">
                  {listing.highlights.map((h, i) => (
                    <motion.div
                      key={i}
                      className="relative z-10 flex items-center gap-3"
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: i * 0.08 }}
                    >
                      <Star className="h-5 w-5 text-primary/60 shrink-0" />
                      <p className="text-[15px] font-medium text-foreground">{h}</p>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="relative mt-8 space-y-5 border-t border-border/40 pt-6">
                  {[
                    { icon: TreePine, ...copy.fallbackHighlights[0] },
                    { icon: Lock, ...copy.fallbackHighlights[1] },
                    { icon: Leaf, ...copy.fallbackHighlights[2] },
                  ].map((h, i) => (
                    <motion.div key={i} className="relative z-10 flex items-start gap-4"
                      initial={{ opacity: 0, x: -10 }} whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }} transition={{ duration: 0.4, delay: i * 0.08 }}>
                      <h.icon className="h-7 w-7 text-foreground/70 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[15px] font-medium text-foreground">{h.title}</p>
                        <p className="text-sm text-muted-foreground mt-0.5">{h.desc}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Scroll hint */}
              {contentSections.length > 0 && (
                <button
                  onClick={() => document.getElementById('content-sections')?.scrollIntoView({ behavior: 'smooth' })}
                  className="mt-8 flex items-center gap-3 text-primary/60 hover:text-primary transition-colors cursor-pointer group"
                >
                  <div className="h-px w-8 bg-primary/30 group-hover:bg-primary/50 transition-colors" />
                  <span className="text-sm uppercase tracking-[0.2em] font-medium">{copy.readMoreBelow}</span>
                  <ChevronDown className="h-4 w-4 animate-bounce" />
                </button>
              )}
            </div>

            {/* Right – info card + booking */}
            <div className="lg:col-span-2">
              <RareFindBadge />

              <p className="text-xs text-muted-foreground/60 mt-2 mb-4 tracking-wide">
                {listing.name}{listing.address ? ` — ${listing.address}` : ''}
              </p>

              {/* Detail grid */}
              <div className="grid grid-cols-2 gap-x-6 gap-y-3 border-t border-border pt-5 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{copy.guests}</span>
                  <span className="text-foreground font-medium">{listing.max_guests}</span>
                </div>
                {listing.bedrooms && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{copy.bedrooms}</span>
                    <span className="text-foreground font-medium">{listing.bedrooms}</span>
                  </div>
                )}
                {listing.bathrooms && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{copy.bathrooms}</span>
                    <span className="text-foreground font-medium">{listing.bathrooms}</span>
                  </div>
                )}
                {listing.sqm && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{copy.area}</span>
                    <span className="text-foreground font-medium">{listing.sqm} m²</span>
                  </div>
                )}
                {(listing.check_in_time || listing.check_out_time) && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{copy.checkInOut}</span>
                    <span className="text-foreground font-medium">
                      {listing.check_in_time || '–'} / {listing.check_out_time || '–'}
                    </span>
                  </div>
                )}
              </div>

              <div className="mt-3 flex items-start gap-2 text-xs text-muted-foreground/70">
                <Info className="h-3.5 w-3.5 mt-0.5 shrink-0 text-primary/60" />
                <span>{copy.earlyLateInfo}</span>
              </div>

              {/* Included */}
              <div className="mt-5 pt-4 border-t border-border/40">
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground/60 mb-3 font-medium">{copy.included}</p>
                <div className="space-y-2.5 text-xs">
                  <div className="flex items-start gap-2.5">
                    <Check className="h-3.5 w-3.5 mt-0.5 shrink-0 text-primary/70" />
                    <div>
                      <span className="text-foreground font-medium">{copy.finalCleaning}</span>
                      <span className="text-muted-foreground/70 ml-1.5">{copy.includedInPrice}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Booking CTA */}
              <div className="mt-6 pt-5 border-t border-border/40">
                <div className="mb-4">
                  <span className="text-muted-foreground text-sm">{copy.from}</span>
                  <div className="flex items-baseline gap-2">
                    <span className="font-display text-4xl font-semibold text-primary">{priceFrom.toLocaleString(moneyLocale)}</span>
                    <span className="text-muted-foreground">{copy.perNight}</span>
                  </div>
                </div>

                {/* Date selection */}
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <Popover>
                    <PopoverTrigger asChild>
                      <button className="text-left p-3 rounded-xl border border-border hover:border-primary/30 transition-colors">
                        <span className="text-[10px] uppercase tracking-wider text-primary font-medium block">Check-in</span>
                        <span className={cn('text-sm', dateRange?.from ? 'text-foreground' : 'text-muted-foreground')}>
                          {dateRange?.from ? format(dateRange.from, dateFormat, { locale: dateLocale }) : copy.selectDate}
                        </span>
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="range" selected={dateRange} onSelect={setDateRange}
                        disabled={(date) => date < new Date()} numberOfMonths={1} locale={dateLocale} className="pointer-events-auto" />
                    </PopoverContent>
                  </Popover>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button className="text-left p-3 rounded-xl border border-border hover:border-primary/30 transition-colors">
                        <span className="text-[10px] uppercase tracking-wider text-primary font-medium block">{copy.checkout}</span>
                        <span className={cn('text-sm', dateRange?.to ? 'text-foreground' : 'text-muted-foreground')}>
                          {dateRange?.to ? format(dateRange.to, dateFormat, { locale: dateLocale }) : copy.selectDate}
                        </span>
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="range" selected={dateRange} onSelect={setDateRange}
                        disabled={(date) => date < new Date()} numberOfMonths={1} locale={dateLocale} className="pointer-events-auto" />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Guests */}
                <div className="flex items-center justify-between p-3 rounded-xl border border-border mb-4">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-primary font-medium block">{copy.guests}</span>
                    <span className="text-sm text-foreground">{guests} {guests === 1 ? copy.guest : copy.guestPlural}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setGuests(Math.max(1, guests - 1))} className="w-8 h-8 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors">
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="w-6 text-center text-sm font-medium">{guests}</span>
                    <button onClick={() => setGuests(Math.min(listing.max_guests, guests + 1))} className="w-8 h-8 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors">
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                </div>

                {/* Price breakdown */}
                {nights > 0 && (
                  <div className="space-y-3 mb-4 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{priceFrom.toLocaleString(moneyLocale)} {copy.currencyShort} × {nights} {nights === 1 ? copy.night : copy.nights}</span>
                      <span className="text-foreground">{(nights * priceFrom).toLocaleString(moneyLocale)} {copy.currency}</span>
                    </div>
                    {cleaningFee > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{copy.cleaning}</span>
                        <span className="text-foreground">{cleaningFee.toLocaleString(moneyLocale)} {copy.currency}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{copy.serviceFee}</span>
                      <span className="text-foreground">{serviceFee.toLocaleString(moneyLocale)} {copy.currency}</span>
                    </div>
                    <div className="border-t-2 border-primary/30 pt-3 flex justify-between">
                      <span className="font-display text-base font-semibold">{copy.total}</span>
                      <span className="font-display text-lg font-bold text-primary">{total.toLocaleString(moneyLocale)} {copy.currency}</span>
                    </div>
                  </div>
                )}

                <Button size="lg" className="w-full h-12 text-base gap-2" onClick={handleBookNow}>
                  <CalendarIcon className="h-4 w-4" />
                  {nights > 0 ? copy.bookNow : copy.selectDates}
                </Button>
                <p className="text-center text-xs text-muted-foreground mt-3">
                  {copy.paymentNote}
                </p>
              </div>
            </div>
          </div>

          <BrandDivider />

          {/* Long description from admin */}
          {listing.long_description && (
            <div className="mb-10">
              <h3 className="font-display text-2xl md:text-3xl font-semibold text-primary mb-3">{copy.aboutThisPlace}</h3>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-line max-w-3xl">{listing.long_description}</p>
            </div>
          )}

          {/* About property & area side by side */}
          {(listing.about_property || listing.about_area) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
              {listing.about_property && (
                <div>
                  <h3 className="font-display text-xl font-semibold text-primary mb-3">{copy.aboutHome}</h3>
                  <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{listing.about_property}</p>
                </div>
              )}
              {listing.about_area && (
                <div>
                  <h3 className="font-display text-xl font-semibold text-primary mb-3">{copy.aboutArea}</h3>
                  <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{listing.about_area}</p>
                </div>
              )}
            </div>
          )}

          {/* Content Sections */}
          {contentSections.length > 0 && (
            <div id="content-sections" className="mb-10">
              <ContentCarousel sections={contentSections} />
            </div>
          )}

          {/* Bedrooms */}
          {bedroomImages.length > 0 && <BedroomSection bedroomImages={bedroomImages} title={copy.bedroomTitle} />}

          {/* Facilities */}
          {facilities.length > 0 && <FacilitiesSection facilities={facilities} title={copy.facilitiesTitle} showAllCategories={copy.showAllCategories} />}

          {/* Check-in / Check-out info */}
          {(listing.checkin_info || listing.checkout_info) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-10">
              {listing.checkin_info && (
                <div>
                  <h3 className="font-display text-xl font-semibold text-primary mb-3">Check-in</h3>
                  <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{listing.checkin_info}</p>
                </div>
              )}
              {listing.checkout_info && (
                <div>
                  <h3 className="font-display text-xl font-semibold text-primary mb-3">Check-out</h3>
                  <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{listing.checkout_info}</p>
                </div>
              )}
            </div>
          )}

          {/* House rules */}
          {listing.house_rules && (
            <div className="mt-10">
              <h3 className="font-display text-2xl md:text-3xl font-semibold text-primary mb-3">{copy.houseRules}</h3>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{listing.house_rules}</p>
            </div>
          )}

          {/* Practical info */}
          {listing.practical_info && (
            <div className="mt-10">
              <h3 className="font-display text-2xl md:text-3xl font-semibold text-primary mb-3">{copy.practicalInfo}</h3>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{listing.practical_info}</p>
            </div>
          )}
        </section>

        {/* Location Section */}
        {(listing.location_map_image || listing.location_mood_image || listing.address) && (
          <section className="container mx-auto px-4 lg:px-8 pb-8">
            <h2 className="font-display text-2xl md:text-3xl font-semibold text-primary mb-6">{copy.locationTitle}</h2>
            {(listing.location_map_image || listing.location_mood_image) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                {listing.location_map_image && (
                  <div className="rounded-2xl overflow-hidden border border-border">
                    <img src={listing.location_map_image} alt={copy.map} className="w-full h-56 sm:h-64 object-cover" />
                  </div>
                )}
                {listing.location_mood_image && (
                  <div className="rounded-2xl overflow-hidden border border-border">
                    <img src={listing.location_mood_image} alt={copy.areaAlt} className="w-full h-56 sm:h-64 object-cover" />
                  </div>
                )}
              </div>
            )}
            {listing.address && (
              <div className="rounded-2xl overflow-hidden border border-border mb-6">
                <iframe
                  src={`https://www.google.com/maps?q=${encodeURIComponent(listing.address)}&output=embed`}
                  className="w-full aspect-[16/7] border-0"
                  allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            )}
          </section>
        )}

        {/* Sticky Bottom Booking Bar */}
        <StickyBookingBar priceFrom={priceFrom} copy={copy} moneyLocale={moneyLocale} onBook={handleBookNow} />

        <div className="container mx-auto px-4 lg:px-8">
          <BrandDivider />
        </div>

        <ReviewsSection
          variant="featured"
          reviews={listingReviews}
          rating={listing.reviews_rating}
          count={listing.reviews_count}
          title={listing.reviews_title}
        />

        <section className="container mx-auto px-4 lg:px-8">
          <VideoGuideGrid listingId={listing.id} />
        </section>

        {/* Contact Host / Emil */}
        <ContactHost />

        {/* Floor Plan Dialog */}
        {floorPlanImages.length > 0 && (
          <Dialog open={floorPlanOpen} onOpenChange={(open) => { setFloorPlanOpen(open); if (!open) setFloorPlanIndex(0); }}>
            <DialogContent className="max-w-[95vw] max-h-[95vh] sm:max-w-5xl">
              <DialogHeader>
                <DialogTitle className="font-display text-xl flex items-center gap-2">
                  <LayoutPanelLeft className="h-5 w-5 text-primary" /> {copy.floorPlan} — {listing.name}
                  {floorPlanImages.length > 1 && (
                    <span className="text-sm font-normal text-muted-foreground ml-2">{floorPlanIndex + 1} / {floorPlanImages.length}</span>
                  )}
                </DialogTitle>
              </DialogHeader>
              <div className="relative">
                <img src={floorPlanImages[floorPlanIndex]} alt={`${copy.floorPlanAlt} ${floorPlanIndex + 1}`} className="w-full max-h-[80vh] object-contain rounded-lg" />
                {floorPlanImages.length > 1 && (
                  <>
                    <button onClick={() => setFloorPlanIndex((floorPlanIndex - 1 + floorPlanImages.length) % floorPlanImages.length)}
                      className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-background/80 backdrop-blur-sm border border-border hover:bg-background">
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button onClick={() => setFloorPlanIndex((floorPlanIndex + 1) % floorPlanImages.length)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-background/80 backdrop-blur-sm border border-border hover:bg-background">
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </>
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Map Dialog */}
        {listing.address && (
          <Dialog open={mapOpen} onOpenChange={setMapOpen}>
            <DialogContent className="max-w-5xl">
              <DialogHeader>
                <DialogTitle className="font-display text-xl flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" /> {listing.address}
                </DialogTitle>
              </DialogHeader>
              <iframe
                src={`https://www.google.com/maps?q=${encodeURIComponent(listing.address)}&output=embed`}
                className="w-full aspect-video rounded-lg border-0"
                allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade"
              />
            </DialogContent>
          </Dialog>
        )}

        {/* Lightbox */}
        <AnimatePresence>
          {lightboxOpen && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
              onClick={() => setLightboxOpen(false)}
            >
              <button onClick={() => setLightboxOpen(false)} className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors">
                <X className="h-6 w-6" />
              </button>
              <div className="absolute top-5 left-1/2 -translate-x-1/2 text-white/70 text-sm font-medium">
                {currentImage + 1} / {images.length}
              </div>
              <div className="relative" onClick={(e) => e.stopPropagation()}>
                {getImageLabel(images[currentImage]) && (
                  <div className="absolute top-0 left-0 z-10">
                    <div className="bg-primary/90 backdrop-blur-sm text-background px-4 py-1.5 rounded-br-xl text-sm font-medium">
                      🏠 {getImageLabel(images[currentImage])}
                    </div>
                  </div>
                )}
                <motion.img
                  key={currentImage}
                  initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2 }}
                  src={images[currentImage]} alt={listing.name}
                  className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg select-none"
                />
              </div>
              {images.length > 1 && (
                <>
                  <button onClick={(e) => { e.stopPropagation(); prevImage(); }}
                    className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors">
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); nextImage(); }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors">
                    <ChevronRight className="h-6 w-6" />
                  </button>
                </>
              )}
              {images.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 max-w-[90vw] overflow-x-auto pb-1">
                  {images.map((src, i) => (
                    <button key={i} onClick={(e) => { e.stopPropagation(); setCurrentImage(i); }}
                      className={`flex-shrink-0 w-16 h-11 rounded-md overflow-hidden border-2 transition-all ${i === currentImage ? 'border-white' : 'border-transparent opacity-50 hover:opacity-80'}`}>
                      <img src={src} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PublicLayout>
  );
};

// ─── Thumbnail Strip ────────────────────────────────────
function ThumbnailStrip({ images, currentImage, onSelect, onShowAll }: {
  images: string[]; currentImage: number; onSelect: (idx: number) => void; onShowAll: () => void;
}) {
  const MAX_VISIBLE = 8;
  const visibleImages = images.slice(0, MAX_VISIBLE);
  const remaining = images.length - MAX_VISIBLE;

  return (
    <div className="flex gap-2 mt-4 overflow-hidden">
      {visibleImages.map((src, index) => (
        <button key={index} onClick={() => onSelect(index)}
          className={`flex-shrink-0 w-16 h-12 sm:w-20 sm:h-14 lg:w-24 lg:h-16 rounded-lg overflow-hidden border-2 transition-all ${index === currentImage ? 'border-primary' : 'border-transparent opacity-60 hover:opacity-100'}`}>
          <img src={src} alt="" className="w-full h-full object-cover" loading="lazy" />
        </button>
      ))}
      {remaining > 0 && (
        <button onClick={onShowAll}
          className="flex-shrink-0 w-16 h-12 sm:w-20 sm:h-14 lg:w-24 lg:h-16 rounded-lg overflow-hidden border-2 border-primary/50 hover:border-primary bg-muted/80 flex items-center justify-center transition-all hover:bg-muted group">
          <span className="text-sm font-semibold text-primary group-hover:text-primary transition-colors">+{remaining}</span>
        </button>
      )}
    </div>
  );
}

// ─── Bedroom Section ────────────────────────────────────
function BedroomSection({ bedroomImages, title }: { bedroomImages: BedroomImage[]; title: string }) {
  const grouped: Record<string, BedroomImage[]> = {};
  const sorted = [...bedroomImages].sort((a, b) => {
    const numA = parseInt(a.label.replace(/\D/g, '')) || 0;
    const numB = parseInt(b.label.replace(/\D/g, '')) || 0;
    return numA - numB;
  });
  for (const br of sorted) {
    if (!grouped[br.label]) grouped[br.label] = [];
    grouped[br.label].push(br);
  }

  return (
    <div className="mt-10">
      <h3 className="font-display text-2xl md:text-3xl font-semibold text-primary mb-4">{title}</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {Object.entries(grouped).map(([label, imgs]) => (
          <div key={label} className="space-y-2">
            <div className="rounded-xl overflow-hidden aspect-[4/3]">
              <img src={imgs[0].url} alt={label} className="w-full h-full object-cover" loading="lazy" />
            </div>
            <p className="font-medium text-foreground text-sm">{label}</p>
            {imgs[0].description && <p className="text-xs text-muted-foreground">{imgs[0].description}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Facilities Section ─────────────────────────────────
function FacilitiesSection({
  facilities,
  title,
  showAllCategories,
}: {
  facilities: FacilityCategory[];
  title: string;
  showAllCategories: (count: number) => string;
}) {
  const [showAll, setShowAll] = useState(false);
  const displayed = showAll ? facilities : facilities.slice(0, 3);

  return (
    <div className="mt-10">
      <h3 className="font-display text-2xl md:text-3xl font-semibold text-primary mb-4">{title}</h3>
      <div className="space-y-6">
        {displayed.map((cat) => {
          const CatIcon = CATEGORY_ICONS[cat.category] || Home;
          return (
            <div key={cat.category}>
              <div className="flex items-center gap-2 mb-2">
                <CatIcon className="h-4 w-4 text-primary/70" />
                <h4 className="text-sm font-semibold text-foreground uppercase tracking-wider">{cat.category}</h4>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {cat.items.map((item) => {
                  const ItemIcon = getItemIcon(item.name);
                  return (
                    <div key={item.name} className={cn(
                      'flex items-center gap-3 py-2 px-3 rounded-lg text-sm',
                      item.included ? 'text-foreground' : 'text-muted-foreground/50 line-through'
                    )}>
                      <ItemIcon className="h-4 w-4 shrink-0 text-primary/60" />
                      <span>{item.name}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      {facilities.length > 3 && !showAll && (
        <Button variant="outline" onClick={() => setShowAll(true)} className="mt-4">
          {showAllCategories(facilities.length)}
        </Button>
      )}
    </div>
  );
}

// ─── Sticky Booking Bar ─────────────────────────────────
function StickyBookingBar({
  priceFrom,
  copy,
  moneyLocale,
  onBook,
}: {
  priceFrom: number;
  copy: typeof listingCopy.da;
  moneyLocale: string;
  onBook: () => void;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => setVisible(window.scrollY > 600);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-md border-t border-border px-4 py-3"
        >
          <div className="container mx-auto flex items-center justify-between max-w-5xl">
            <div>
              <span className="text-muted-foreground text-xs">{copy.from}</span>
              <div className="flex items-baseline gap-1.5">
                <span className="font-display text-xl font-semibold text-primary">{priceFrom.toLocaleString(moneyLocale)}</span>
                <span className="text-xs text-muted-foreground">{copy.perNight}</span>
              </div>
            </div>
            <Button size="lg" className="px-8" onClick={onBook}>
              <CalendarIcon className="h-4 w-4 mr-2" />
              {copy.bookNow}
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default ListingDetail;
