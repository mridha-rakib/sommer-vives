import { useState, useEffect } from 'react';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { ListingCard } from '@/components/listing/ListingCard';
import { BrandDivider } from '@/components/listing/BrandDivider';
import { ContactHost } from '@/components/listing/ContactHost';
import { ListingsMap } from '@/components/listing/ListingsMap';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';
import { LayoutGrid, Map as MapIcon, MapPin } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { useBooking } from '@/components/booking/BookingContext';


interface ListingData {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  tagline: string | null;
  address: string | null;
  region: string | null;
  max_guests: number;
  bedrooms: number | null;
  bathrooms: number | null;
  base_price_per_night: number;
  hero_image: string | null;
  images: string[] | null;
  amenities: string[] | null;
  property_type: string | null;
}

const REGIONS = [
  { value: 'Alle', labelKey: 'listings.region.all' },
  { value: 'Nordsjælland', labelKey: 'listings.region.northZealand' },
  { value: 'Vestjylland', labelKey: 'listings.region.westJutland' },
  { value: 'Limfjorden', labelKey: 'listings.region.limfjord' },
  { value: 'Sydsjælland', labelKey: 'listings.region.southZealand' },
  { value: 'Fyn', labelKey: 'listings.region.funen' },
  { value: 'Bornholm', labelKey: 'listings.region.bornholm' },
];

const Listings = () => {
  const [listings, setListings] = useState<ListingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeRegion, setActiveRegion] = useState('Alle');
  const { t } = useTranslation();
  const { open: openBooking } = useBooking();

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('listings')
        .select('id, slug, name, description, tagline, address, region, max_guests, bedrooms, bathrooms, base_price_per_night, hero_image, images, amenities, property_type')
        .eq('is_active', true)
        .order('sort_order');
      setListings((data as unknown as ListingData[]) || []);
      setLoading(false);
    };
    load();
  }, []);

  const filtered = activeRegion === 'Alle'
    ? listings
    : listings.filter(l => l.region === activeRegion);

  return (
    <PublicLayout>
      <div className="min-h-screen bg-background">
        {/* Hero */}
        <div className="pt-24 sm:pt-28 pb-4 container mx-auto px-4 lg:px-8 text-center">
          <span className="text-primary font-display italic text-xs mb-1 block">— SommerVibes</span>
          <h1 className="font-display text-2xl md:text-3xl font-semibold text-foreground mb-1">
            {t('listings.title')}
          </h1>
          <p className="text-muted-foreground text-sm max-w-lg mx-auto">
            {t('listings.subtitle')}
          </p>
        </div>

        {/* Region Filter */}
        <div className="container mx-auto px-4 lg:px-8 mb-6">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 justify-center flex-wrap">
            {REGIONS.map((region) => (
              <button
                key={region.value}
                onClick={() => setActiveRegion(region.value)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all border ${
                  activeRegion === region.value
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-card text-muted-foreground border-border hover:border-primary/30 hover:text-foreground'
                }`}
              >
                {region.value !== 'Alle' && <MapPin className="h-3 w-3 inline mr-1.5" />}
                {t(region.labelKey)}
              </button>
            ))}
          </div>
        </div>

        {/* Listings Grid */}
        <section className="py-4 sm:py-8">
          <div className="container mx-auto px-4 lg:px-8">
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="rounded-2xl overflow-hidden border border-border/30">
                    <div className="aspect-[4/3] bg-muted animate-pulse" />
                    <div className="p-4 sm:p-6 space-y-3">
                      <div className="h-5 w-2/3 bg-muted animate-pulse rounded" />
                      <div className="h-4 w-1/3 bg-muted animate-pulse rounded" />
                      <div className="h-4 w-1/2 bg-muted animate-pulse rounded" />
                      <div className="h-px bg-muted animate-pulse" />
                      <div className="flex gap-2">
                        <div className="h-9 flex-1 bg-muted animate-pulse rounded-lg" />
                        <div className="h-9 flex-1 bg-muted animate-pulse rounded-lg" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-muted-foreground text-lg">
                  {activeRegion !== 'Alle'
                    ? t('listings.emptyRegion').replace('{region}', t(REGIONS.find(region => region.value === activeRegion)?.labelKey || 'listings.region.all'))
                    : t('listings.empty')}
                </p>
                <p className="text-muted-foreground/60 text-sm mt-2">{t('listings.emptySoon')}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
                {filtered.map((listing, i) => (
                  <motion.div
                    key={listing.id}
                    className="h-full"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.08, duration: 0.5 }}
                  >
                    <ListingCard
                      id={listing.slug}
                      title={listing.name}
                      location={[listing.address, listing.region].filter(Boolean).join(', ')}
                      image={listing.hero_image || listing.images?.[0] || '/placeholder.svg'}
                      capacity={listing.max_guests}
                      bedrooms={listing.bedrooms || undefined}
                      bathrooms={listing.bathrooms || undefined}
                      pricePerNight={listing.base_price_per_night / 100}
                      teaser={listing.tagline || listing.description?.substring(0, 120) || undefined}
                      tags={listing.amenities?.slice(0, 2) || []}
                      onBook={() => openBooking({
                        id: listing.id,
                        title: listing.name,
                        image: listing.hero_image || listing.images?.[0] || undefined,
                        maxGuests: listing.max_guests,
                      })}
                    />
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </section>

        <ContactHost />
        <BrandDivider />
      </div>
    </PublicLayout>
  );
};

export default Listings;
