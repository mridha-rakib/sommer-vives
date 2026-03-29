import { useParams, Link } from 'react-router-dom';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { ContentCarousel, type ContentSection } from '@/components/listing/ContentCarousel';
import { BrandDivider } from '@/components/listing/BrandDivider';
import { RareFindBadge } from '@/components/listing/RareFindBadge';
import { ReviewsSection } from '@/components/listing/ReviewsSection';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Star, Users, Bed, Bath, MapPin, ArrowLeft, ChevronLeft, ChevronRight,
  Loader2, X, Maximize2, Calendar as CalendarIcon, Minus, Plus,
  Wifi, Flame, ParkingCircle, UtensilsCrossed, Waves, Dog,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { format, differenceInDays } from 'date-fns';
import { da } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { DateRange } from 'react-day-picker';

const amenityIcons: Record<string, React.ElementType> = {
  WiFi: Wifi, Brændeovn: Flame, Parkering: ParkingCircle,
  Køkken: UtensilsCrossed, Pool: Waves, Kæledyr: Dog,
};

interface ListingData {
  id: string;
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
  amenities: string[] | null;
  images: string[] | null;
  house_rules: string | null;
}

const ListingDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [listing, setListing] = useState<ListingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImage, setCurrentImage] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [guests, setGuests] = useState(2);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('properties')
        .select('*')
        .eq('id', id)
        .single();
      setListing(data as ListingData | null);
      setLoading(false);
    };
    load();
  }, [id]);

  if (loading) {
    return (
      <PublicLayout>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </PublicLayout>
    );
  }

  if (!listing) {
    return (
      <PublicLayout>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <h1 className="font-display text-4xl text-foreground mb-4">Ikke fundet</h1>
            <Button asChild><Link to="/listings">Se alle sommerhuse</Link></Button>
          </div>
        </div>
      </PublicLayout>
    );
  }

  const images = listing.images?.length ? listing.images : ['/placeholder.svg'];
  const nights = dateRange?.from && dateRange?.to ? differenceInDays(dateRange.to, dateRange.from) : 0;
  const nightlyRate = listing.price_per_night || 0;
  const cleaningFee = listing.cleaning_fee || 0;
  const serviceFee = Math.round(nights * nightlyRate * 0.05);
  const total = nights * nightlyRate + cleaningFee + serviceFee;

  const nextImage = () => setCurrentImage((prev) => (prev + 1) % images.length);
  const prevImage = () => setCurrentImage((prev) => (prev - 1 + images.length) % images.length);

  return (
    <PublicLayout>
      <div className="min-h-screen bg-background">
        {/* Back nav */}
        <div className="pt-20 container mx-auto px-4 lg:px-8 mb-4">
          <Link to="/listings" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" /> Alle sommerhuse
          </Link>
        </div>

        {/* Image Gallery */}
        <div className="container mx-auto px-4 lg:px-8 mb-10">
          <div className="relative rounded-2xl overflow-hidden aspect-[16/9]">
            <img
              src={images[currentImage]}
              alt={listing.title}
              className="w-full h-full object-cover cursor-pointer"
              onClick={() => setLightboxOpen(true)}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
            
            <button
              onClick={() => setLightboxOpen(true)}
              className="absolute top-4 right-4 z-10 p-2.5 rounded-xl bg-background/80 backdrop-blur-sm border border-border/50 text-foreground hover:bg-primary hover:text-primary-foreground transition-all"
            >
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
          </div>

          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="flex gap-2 mt-3 overflow-x-auto scrollbar-hide pb-1">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentImage(i)}
                  className={cn(
                    'w-20 h-14 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all',
                    i === currentImage ? 'border-primary' : 'border-transparent opacity-60 hover:opacity-100'
                  )}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 lg:gap-12">
            {/* Left: Details */}
            <div>
              <RareFindBadge />

              <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-3">
                {listing.title}
              </h1>

              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6">
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4 text-primary" />
                  {listing.address}, {listing.region}
                </div>
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-primary fill-primary" />
                  4.96 <span className="text-muted-foreground/60">(24)</span>
                </div>
              </div>

              <div className="flex items-center gap-6 mb-8 text-sm">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  <span>{listing.capacity} gæster</span>
                </div>
                {listing.bedrooms && (
                  <div className="flex items-center gap-2">
                    <Bed className="h-4 w-4 text-primary" />
                    <span>{listing.bedrooms} soveværelser</span>
                  </div>
                )}
                {listing.bathrooms && (
                  <div className="flex items-center gap-2">
                    <Bath className="h-4 w-4 text-primary" />
                    <span>{listing.bathrooms} badeværelser</span>
                  </div>
                )}
              </div>

              <BrandDivider />

              {/* Description */}
              {listing.description && (
                <div className="mb-10">
                  <h2 className="font-display text-xl font-semibold text-foreground mb-4">Om dette sommerhus</h2>
                  <div className="text-muted-foreground leading-relaxed whitespace-pre-line">
                    {listing.description}
                  </div>
                </div>
              )}

              {/* Amenities */}
              {listing.amenities && listing.amenities.length > 0 && (
                <div className="mb-10">
                  <h2 className="font-display text-xl font-semibold text-foreground mb-4">Faciliteter</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {listing.amenities.map((amenity) => {
                      const Icon = amenityIcons[amenity] || MapPin;
                      return (
                        <div key={amenity} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card">
                          <Icon className="h-5 w-5 text-primary" />
                          <span className="text-sm text-foreground">{amenity}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* House Rules */}
              {listing.house_rules && (
                <div className="mb-10">
                  <h2 className="font-display text-xl font-semibold text-foreground mb-4">Husregler</h2>
                  <div className="text-muted-foreground text-sm leading-relaxed whitespace-pre-line">
                    {listing.house_rules}
                  </div>
                </div>
              )}

              <ReviewsSection variant="featured" />
            </div>

            {/* Right: Booking Card */}
            <div>
              <div className="bg-card border border-border rounded-2xl p-6 sticky top-24">
                <div className="mb-4">
                  <span className="font-display text-2xl font-bold text-primary">
                    {nightlyRate.toLocaleString('da-DK')} kr.
                  </span>
                  <span className="text-muted-foreground text-sm"> / nat</span>
                </div>

                {/* Date selection */}
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <Popover>
                    <PopoverTrigger asChild>
                      <button className="text-left p-3 rounded-xl border border-border hover:border-primary/30 transition-colors">
                        <span className="text-[10px] uppercase tracking-wider text-primary font-medium block">Check-in</span>
                        <span className={cn('text-sm', dateRange?.from ? 'text-foreground' : 'text-muted-foreground')}>
                          {dateRange?.from ? format(dateRange.from, 'dd. MMM', { locale: da }) : 'Vælg dato'}
                        </span>
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="range"
                        selected={dateRange}
                        onSelect={setDateRange}
                        disabled={(date) => date < new Date()}
                        numberOfMonths={1}
                        locale={da}
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>

                  <Popover>
                    <PopoverTrigger asChild>
                      <button className="text-left p-3 rounded-xl border border-border hover:border-primary/30 transition-colors">
                        <span className="text-[10px] uppercase tracking-wider text-primary font-medium block">Check-ud</span>
                        <span className={cn('text-sm', dateRange?.to ? 'text-foreground' : 'text-muted-foreground')}>
                          {dateRange?.to ? format(dateRange.to, 'dd. MMM', { locale: da }) : 'Vælg dato'}
                        </span>
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="range"
                        selected={dateRange}
                        onSelect={setDateRange}
                        disabled={(date) => date < new Date()}
                        numberOfMonths={1}
                        locale={da}
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Guests */}
                <div className="flex items-center justify-between p-3 rounded-xl border border-border mb-6">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-primary font-medium block">Gæster</span>
                    <span className="text-sm text-foreground">{guests} gæster</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setGuests(Math.max(1, guests - 1))} className="w-8 h-8 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors">
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="w-6 text-center text-sm font-medium">{guests}</span>
                    <button onClick={() => setGuests(Math.min(listing.capacity, guests + 1))} className="w-8 h-8 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors">
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                </div>

                {/* Price breakdown */}
                {nights > 0 && (
                  <div className="space-y-3 mb-6 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{nightlyRate.toLocaleString('da-DK')} kr × {nights} nætter</span>
                      <span className="text-foreground">{(nights * nightlyRate).toLocaleString('da-DK')} kr.</span>
                    </div>
                    {cleaningFee > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Rengøring</span>
                        <span className="text-foreground">{cleaningFee.toLocaleString('da-DK')} kr.</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Servicegebyr</span>
                      <span className="text-foreground">{serviceFee.toLocaleString('da-DK')} kr.</span>
                    </div>
                    <div className="border-t-2 border-primary/30 pt-3 flex justify-between">
                      <span className="font-display text-base font-semibold">I alt</span>
                      <span className="font-display text-lg font-bold text-primary">{total.toLocaleString('da-DK')} kr.</span>
                    </div>
                  </div>
                )}

                <Button size="lg" className="w-full h-12 text-base gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  {nights > 0 ? 'Book nu' : 'Vælg datoer'}
                </Button>

                <p className="text-center text-xs text-muted-foreground mt-3">
                  Du betaler først ved bekræftelse
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Lightbox */}
        <AnimatePresence>
          {lightboxOpen && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
              onClick={() => setLightboxOpen(false)}
            >
              <button onClick={() => setLightboxOpen(false)} className="absolute top-4 right-4 text-white/70 hover:text-white z-50">
                <X className="h-6 w-6" />
              </button>
              <div className="relative max-w-5xl w-full px-4" onClick={(e) => e.stopPropagation()}>
                <img src={images[currentImage]} alt="" className="w-full max-h-[80vh] object-contain rounded-lg" />
                {images.length > 1 && (
                  <>
                    <button onClick={prevImage} className="absolute left-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                      <ChevronLeft className="h-6 w-6 text-white" />
                    </button>
                    <button onClick={nextImage} className="absolute right-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                      <ChevronRight className="h-6 w-6 text-white" />
                    </button>
                  </>
                )}
                <div className="text-center text-white/50 text-sm mt-4">
                  {currentImage + 1} / {images.length}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PublicLayout>
  );
};

export default ListingDetail;
