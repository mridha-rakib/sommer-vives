import { useState, useEffect } from 'react';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { ListingCard } from '@/components/listing/ListingCard';
import { BrandDivider } from '@/components/listing/BrandDivider';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface ListingData {
  id: string;
  title: string;
  address: string;
  region: string;
  description: string | null;
  capacity: number;
  bedrooms: number | null;
  bathrooms: number | null;
  price_per_night: number | null;
  images: string[] | null;
  amenities: string[] | null;
}

const Listings = () => {
  const [listings, setListings] = useState<ListingData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('properties')
        .select('id, title, address, region, description, capacity, bedrooms, bathrooms, price_per_night, images, amenities')
        .eq('status', 'published')
        .order('created_at', { ascending: false });
      setListings((data as ListingData[]) || []);
      setLoading(false);
    };
    load();
  }, []);

  return (
    <PublicLayout>
      <div className="min-h-screen bg-background">
        {/* Hero */}
        <div className="pt-24 sm:pt-28 pb-4 container mx-auto px-4 lg:px-8 text-center">
          <span className="text-primary font-display italic text-xs mb-1 block">— SommerVibes</span>
          <h1 className="font-display text-2xl md:text-3xl font-semibold text-foreground mb-1">
            Vores Sommerhuse
          </h1>
          <p className="text-muted-foreground text-sm max-w-lg mx-auto">
            Udforsk vores håndplukkede udvalg af eksklusive sommerhuse i hele Danmark
          </p>
        </div>

        {/* Listings Grid */}
        <section className="py-8 sm:py-14">
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
            ) : listings.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-muted-foreground text-lg">Ingen sommerhuse tilgængelige endnu.</p>
                <p className="text-muted-foreground/60 text-sm mt-2">Kom snart tilbage for nye listings!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
                {listings.map((listing, i) => (
                  <motion.div
                    key={listing.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.08, duration: 0.5 }}
                  >
                    <ListingCard
                      id={listing.id}
                      title={listing.title}
                      location={`${listing.address}, ${listing.region}`}
                      image={listing.images?.[0] || '/placeholder.svg'}
                      capacity={listing.capacity}
                      bedrooms={listing.bedrooms || undefined}
                      bathrooms={listing.bathrooms || undefined}
                      pricePerNight={listing.price_per_night || 0}
                      teaser={listing.description?.substring(0, 120) || undefined}
                      tags={listing.amenities?.slice(0, 2) || []}
                    />
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </section>

        <BrandDivider />
      </div>
    </PublicLayout>
  );
};

export default Listings;
