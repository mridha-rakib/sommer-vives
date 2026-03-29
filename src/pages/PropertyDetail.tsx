import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  MapPin, Users, Bed, Bath, Heart, Share2, ChevronLeft, ChevronRight,
  Wifi, Flame, TreePine, Car, PawPrint, Waves, Check,
  Star, X, Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { BookingProvider, useBooking } from '@/components/booking/BookingContext';
import { BookingWizard } from '@/components/booking/BookingWizard';

const amenityIcons: Record<string, any> = {
  'WiFi': Wifi,
  'Brændeovn': Flame,
  'Skov': TreePine,
  'Skovudsigt': TreePine,
  'P-plads': Car,
  'Parkering': Car,
  'Husdyr tilladt': PawPrint,
  'Pool': Waves,
};

export default function PropertyDetail() {
  const { id } = useParams();
  const [currentImage, setCurrentImage] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [showBookingWizard, setShowBookingWizard] = useState(false);
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [guests, setGuests] = useState(2);
  // Fetch property from database
  const { data: property, isLoading, error } = useQuery({
    queryKey: ['property', id],
    queryFn: async () => {
      if (!id) throw new Error('No property ID');
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <PublicLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
        </div>
      </PublicLayout>
    );
  }

  if (error || !property) {
    return (
      <PublicLayout>
        <div className="container mx-auto px-4 py-24 text-center">
          <h1 className="font-display text-2xl font-bold text-primary mb-4">
            Sommerhus ikke fundet
          </h1>
          <p className="text-muted-foreground mb-6">
            Det sommerhus du leder efter findes ikke eller er ikke længere tilgængeligt.
          </p>
          <Link to="/rentals">
            <Button>Se alle sommerhuse</Button>
          </Link>
        </div>
      </PublicLayout>
    );
  }

  const images = property.images && property.images.length > 0 
    ? property.images 
    : ['https://l.icdbcdn.com/oh/9f4b9fab-b84c-4dd2-8f6b-8a2ceb7ee434.png?w=1200'];

  const pricePerNight = property.price_per_night || Math.round((property.price_per_week || 7000) / 7);
  const cleaningFee = property.cleaning_fee || 750;

  const nights = dateRange.from && dateRange.to
    ? Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24))
    : 0;
  const totalPrice = nights * pricePerNight + cleaningFee;
  const serviceFee = Math.round(totalPrice * 0.05);

  const handleOpenBookingWizard = () => {
    if (!dateRange.from || !dateRange.to) {
      toast.error('Vælg venligst check-in og check-out datoer');
      return;
    }
    setShowBookingWizard(true);
  };

  return (
    <PublicLayout>
      {/* Navigation */}
      <section className="bg-primary">
        <div className="container mx-auto px-4 py-4">
          <Link to="/rentals" className="inline-flex items-center gap-2 text-primary-foreground/80 hover:text-primary-foreground transition-colors">
            <ChevronLeft className="w-4 h-4" />
            Tilbage til sommerhuse
          </Link>
        </div>
      </section>

      {/* Image Gallery */}
      <section className="relative">
        <div className="grid grid-cols-4 grid-rows-2 gap-2 h-[50vh] md:h-[60vh]">
          {/* Main Image */}
          <div className="col-span-4 md:col-span-2 md:row-span-2 relative group cursor-pointer" onClick={() => setShowGallery(true)}>
            <img
              src={images[0]}
              alt={property.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
          </div>
          
          {/* Secondary Images - Show up to 4 additional images */}
          {images.slice(1, 5).map((img, idx) => (
            <div key={idx} className="hidden md:block relative group cursor-pointer" onClick={() => { setCurrentImage(idx + 1); setShowGallery(true); }}>
              <img
                src={img}
                alt={`${property.title} ${idx + 2}`}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
              {idx === 3 && images.length > 5 && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <span className="text-white font-medium">+{images.length - 5} billeder</span>
                </div>
              )}
            </div>
          ))}

          {/* Fill empty slots if less than 4 secondary images */}
          {images.length < 5 && Array.from({ length: Math.min(4, 5 - images.length) }).map((_, idx) => (
            <div key={`empty-${idx}`} className="hidden md:block bg-muted" />
          ))}

          {/* View All Photos Button */}
          <button
            onClick={() => setShowGallery(true)}
            className="absolute bottom-4 right-4 bg-card hover:bg-card/90 text-primary px-4 py-2 rounded-lg font-medium shadow-lg transition-colors"
          >
            Se alle {images.length} billeder
          </button>

          {/* Actions */}
          <div className="absolute top-4 right-4 flex gap-2">
            <button
              onClick={() => setIsLiked(!isLiked)}
              className="w-10 h-10 rounded-full bg-card/90 flex items-center justify-center hover:bg-card transition-colors"
            >
              <Heart className={`w-5 h-5 ${isLiked ? 'fill-destructive text-destructive' : 'text-primary'}`} />
            </button>
            <button className="w-10 h-10 rounded-full bg-card/90 flex items-center justify-center hover:bg-card transition-colors">
              <Share2 className="w-5 h-5 text-primary" />
            </button>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-12 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Header */}
              <div>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h1 className="font-display text-3xl md:text-4xl font-bold text-primary mb-2">
                      {property.title}
                    </h1>
                    <p className="text-muted-foreground flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      {property.region}, Danmark
                    </p>
                  </div>
                  <div className="flex items-center gap-1 bg-accent/10 px-3 py-1.5 rounded-lg">
                    <Star className="w-4 h-4 text-accent fill-accent" />
                    <span className="font-semibold text-primary">4.9</span>
                    <span className="text-muted-foreground text-sm">(47)</span>
                  </div>
                </div>

                {/* Quick Info */}
                <div className="flex flex-wrap gap-6 py-4 border-y border-border">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-accent" />
                    <span>{property.capacity} gæster</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Bed className="w-5 h-5 text-accent" />
                    <span>{property.bedrooms || 2} soveværelser</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Bath className="w-5 h-5 text-accent" />
                    <span>{property.bathrooms || 1} badeværelse</span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <h2 className="font-display text-2xl font-semibold text-primary mb-4">
                  Om dette sted
                </h2>
                <div className="prose prose-primary max-w-none">
                  {(property.description || 'Et dejligt sommerhus med udsigt til naturen.').split('\n\n').map((paragraph, idx) => (
                    <p key={idx} className="text-muted-foreground mb-4">{paragraph}</p>
                  ))}
                </div>
              </div>

              {/* Amenities */}
              {property.amenities && property.amenities.length > 0 && (
                <div>
                  <h2 className="font-display text-2xl font-semibold text-primary mb-4">
                    Faciliteter
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {property.amenities.map((amenity) => {
                      const Icon = amenityIcons[amenity] || Check;
                      return (
                        <div key={amenity} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                          <Icon className="w-5 h-5 text-accent" />
                          <span className="text-primary">{amenity}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* House Rules */}
              {property.house_rules && (
                <div>
                  <h2 className="font-display text-2xl font-semibold text-primary mb-4">
                    Husregler
                  </h2>
                  <p className="text-muted-foreground">{property.house_rules}</p>
                </div>
              )}
            </div>

            {/* Booking Card */}
            <div className="lg:col-span-1">
              <Card className="sticky top-24 shadow-elevated">
                <CardHeader>
                  <CardTitle className="flex items-baseline justify-between">
                    <div>
                      <span className="text-2xl font-bold text-primary">
                        {pricePerNight.toLocaleString('da-DK')} kr.
                      </span>
                      <span className="text-muted-foreground font-normal"> / nat</span>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Date Selection */}
                  <div className="grid grid-cols-2 gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="h-auto flex-col items-start p-3 border rounded-lg hover:border-accent transition-colors">
                          <span className="text-xs font-medium text-muted-foreground mb-1">CHECK-IN</span>
                          <span className="font-medium">
                            {dateRange.from ? format(dateRange.from, 'd. MMM', { locale: da }) : 'Tilføj dato'}
                          </span>
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="range"
                          selected={{ from: dateRange.from, to: dateRange.to }}
                          onSelect={(range) => setDateRange({ from: range?.from, to: range?.to })}
                          locale={da}
                        />
                      </PopoverContent>
                    </Popover>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="h-auto flex-col items-start p-3 border rounded-lg hover:border-accent transition-colors">
                          <span className="text-xs font-medium text-muted-foreground mb-1">CHECK-UD</span>
                          <span className="font-medium">
                            {dateRange.to ? format(dateRange.to, 'd. MMM', { locale: da }) : 'Tilføj dato'}
                          </span>
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="range"
                          selected={{ from: dateRange.from, to: dateRange.to }}
                          onSelect={(range) => setDateRange({ from: range?.from, to: range?.to })}
                          locale={da}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Guests */}
                  <div className="border rounded-lg p-3">
                    <div className="text-xs font-medium text-muted-foreground mb-1">GÆSTER</div>
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{guests} gæster</span>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setGuests(Math.max(1, guests - 1))}
                        >
                          -
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setGuests(Math.min(property.capacity, guests + 1))}
                        >
                          +
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Price Breakdown */}
                  {nights > 0 && (
                    <div className="space-y-2 pt-4 border-t">
                      <div className="flex justify-between text-muted-foreground">
                        <span>{pricePerNight.toLocaleString('da-DK')} kr. × {nights} nætter</span>
                        <span>{(pricePerNight * nights).toLocaleString('da-DK')} kr.</span>
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span>Rengøringsgebyr</span>
                        <span>{cleaningFee.toLocaleString('da-DK')} kr.</span>
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span>Servicegebyr (5%)</span>
                        <span>{serviceFee.toLocaleString('da-DK')} kr.</span>
                      </div>
                      <div className="flex justify-between font-semibold text-primary pt-2 border-t">
                        <span>I alt</span>
                        <span>{(totalPrice + serviceFee).toLocaleString('da-DK')} kr.</span>
                      </div>
                    </div>
                  )}

                  <Button 
                    onClick={handleOpenBookingWizard}
                    className="w-full"
                    variant="gold"
                    size="lg"
                  >
                    Book nu
                  </Button>

                  <p className="text-xs text-center text-muted-foreground">
                    Vælg datoer og se samlet pris inkl. gebyrer og tilkøb.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Full Gallery Modal */}
      {showGallery && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center">
          <button
            onClick={() => setShowGallery(false)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>
          <button
            onClick={() => setCurrentImage((prev) => (prev - 1 + images.length) % images.length)}
            className="absolute left-4 w-12 h-12 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
          >
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>
          <img
            src={images[currentImage]}
            alt={property.title}
            className="max-w-full max-h-[90vh] object-contain"
          />
          <button
            onClick={() => setCurrentImage((prev) => (prev + 1) % images.length)}
            className="absolute right-4 w-12 h-12 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
          >
            <ChevronRight className="w-6 h-6 text-white" />
          </button>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white">
            {currentImage + 1} / {images.length}
          </div>
        </div>
      )}

      {/* Booking Wizard */}
      <BookingWizard
        isOpen={showBookingWizard}
        onClose={() => setShowBookingWizard(false)}
        property={property}
        dateRange={dateRange}
        guests={guests}
      />
    </PublicLayout>
  );
}
