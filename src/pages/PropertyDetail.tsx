import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  MapPin, Users, Bed, Bath, Heart, Share2, ChevronLeft, ChevronRight,
  Wifi, Flame, TreePine, Car, PawPrint, Waves, CalendarDays, Check,
  Star, X
} from 'lucide-react';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Sample property data (would come from API)
const sampleProperty = {
  id: '1',
  title: 'ForestCabin | Søvej 28',
  location: 'Ansager, Syddanmark',
  region: 'Kvie Sø',
  description: `Her kan du nyde livet, naturen og tage en tur til det populære Pandekage Huset ved søen.

Vi er også tæt på Billund, hvor Legoland og Lalandia venter – kun 25 minutter væk med bil!

ForestCabin er noget helt særligt. Med sin egen lille skov får du en unik oplevelse, hvor ro og natur går hånd i hånd.

Dette feriehus ved Kvie Sø er ideelt for dem, der søger afslapning, komfort og ro i smukke naturomgivelser.`,
  images: [
    'https://l.icdbcdn.com/oh/9f4b9fab-b84c-4dd2-8f6b-8a2ceb7ee434.png?w=1200',
    'https://l.icdbcdn.com/oh/648b6185-5c10-4bc9-8113-631bacd6b83e.jpg?w=1200',
  ],
  price: 1400,
  cleaningFee: 750,
  capacity: 6,
  bedrooms: 3,
  bathrooms: 1,
  amenities: ['WiFi', 'Brændeovn', 'Terrasse', 'Grill', 'P-plads', 'Husdyr tilladt'],
  houseRules: 'Ikke-ryger hus. Check-in kl. 15:00, check-out kl. 10:00. Ingen fester.',
  coordinates: { lat: 55.7333, lng: 8.3833 },
  rating: 4.9,
  reviewCount: 47,
};

const amenityIcons: Record<string, any> = {
  'WiFi': Wifi,
  'Brændeovn': Flame,
  'Skov': TreePine,
  'P-plads': Car,
  'Husdyr tilladt': PawPrint,
  'Pool': Waves,
};

export default function PropertyDetail() {
  const { id } = useParams();
  const [property] = useState(sampleProperty);
  const [currentImage, setCurrentImage] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [guests, setGuests] = useState(2);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inquiryForm, setInquiryForm] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  });

  const nights = dateRange.from && dateRange.to
    ? Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24))
    : 0;
  const totalPrice = nights * property.price + property.cleaningFee;
  const serviceFee = Math.round(totalPrice * 0.05);

  const handleInquiry = async () => {
    if (!dateRange.from || !dateRange.to) {
      toast.error('Vælg venligst check-in og check-out datoer');
      return;
    }
    if (!inquiryForm.name || !inquiryForm.email) {
      toast.error('Udfyld venligst navn og email');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('inquiries').insert({
        property_id: id || property.id,
        guest_name: inquiryForm.name,
        guest_email: inquiryForm.email,
        guest_phone: inquiryForm.phone,
        message: inquiryForm.message,
        check_in: format(dateRange.from, 'yyyy-MM-dd'),
        check_out: format(dateRange.to, 'yyyy-MM-dd'),
        guests: guests,
      });

      if (error) throw error;

      toast.success('Din forespørgsel er sendt! Vi vender tilbage hurtigst muligt.');
      setInquiryForm({ name: '', email: '', phone: '', message: '' });
    } catch (error) {
      console.error('Error submitting inquiry:', error);
      toast.error('Der opstod en fejl. Prøv venligst igen.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PublicLayout>
      {/* Image Gallery Header */}
      <section className="relative bg-primary">
        <div className="container mx-auto px-4 py-4">
          <Link to="/rentals" className="inline-flex items-center gap-2 text-primary-foreground/80 hover:text-primary-foreground transition-colors">
            <ChevronLeft className="w-4 h-4" />
            Tilbage til søgning
          </Link>
        </div>
      </section>

      {/* Image Gallery */}
      <section className="relative">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2 h-[50vh] md:h-[60vh]">
          {/* Main Image */}
          <div className="md:col-span-2 md:row-span-2 relative group cursor-pointer" onClick={() => setShowGallery(true)}>
            <img
              src={property.images[0]}
              alt={property.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
          </div>
          
          {/* Secondary Images */}
          {property.images.slice(1, 5).map((img, idx) => (
            <div key={idx} className="hidden md:block relative group cursor-pointer" onClick={() => setShowGallery(true)}>
              <img
                src={img}
                alt={`${property.title} ${idx + 2}`}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
            </div>
          ))}

          {/* View All Photos Button */}
          <button
            onClick={() => setShowGallery(true)}
            className="absolute bottom-4 right-4 bg-card hover:bg-card/90 text-primary px-4 py-2 rounded-lg font-medium shadow-lg transition-colors"
          >
            Se alle billeder
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
                      {property.location}
                    </p>
                  </div>
                  {property.rating && (
                    <div className="flex items-center gap-1 bg-accent/10 px-3 py-1.5 rounded-lg">
                      <Star className="w-4 h-4 text-accent fill-accent" />
                      <span className="font-semibold text-primary">{property.rating}</span>
                      <span className="text-muted-foreground text-sm">({property.reviewCount})</span>
                    </div>
                  )}
                </div>

                {/* Quick Info */}
                <div className="flex flex-wrap gap-6 py-4 border-y border-border">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-accent" />
                    <span>{property.capacity} gæster</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Bed className="w-5 h-5 text-accent" />
                    <span>{property.bedrooms} soveværelser</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Bath className="w-5 h-5 text-accent" />
                    <span>{property.bathrooms} badeværelse</span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <h2 className="font-display text-2xl font-semibold text-primary mb-4">
                  Om dette sted
                </h2>
                <div className="prose prose-primary max-w-none">
                  {property.description.split('\n\n').map((paragraph, idx) => (
                    <p key={idx} className="text-muted-foreground mb-4">{paragraph}</p>
                  ))}
                </div>
              </div>

              {/* Amenities */}
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

              {/* House Rules */}
              <div>
                <h2 className="font-display text-2xl font-semibold text-primary mb-4">
                  Husregler
                </h2>
                <p className="text-muted-foreground">{property.houseRules}</p>
              </div>
            </div>

            {/* Booking Card */}
            <div className="lg:col-span-1">
              <Card className="sticky top-24 shadow-elevated">
                <CardHeader>
                  <CardTitle className="flex items-baseline justify-between">
                    <div>
                      <span className="text-2xl font-bold text-primary">
                        {property.price.toLocaleString('da-DK')} kr.
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
                        <span>{property.price.toLocaleString('da-DK')} kr. × {nights} nætter</span>
                        <span>{(property.price * nights).toLocaleString('da-DK')} kr.</span>
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span>Rengøringsgebyr</span>
                        <span>{property.cleaningFee.toLocaleString('da-DK')} kr.</span>
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

                  {/* Inquiry Form */}
                  <div className="space-y-3 pt-4 border-t">
                    <div>
                      <Label htmlFor="name">Navn *</Label>
                      <Input
                        id="name"
                        value={inquiryForm.name}
                        onChange={(e) => setInquiryForm({ ...inquiryForm, name: e.target.value })}
                        placeholder="Dit navn"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={inquiryForm.email}
                        onChange={(e) => setInquiryForm({ ...inquiryForm, email: e.target.value })}
                        placeholder="din@email.dk"
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Telefon</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={inquiryForm.phone}
                        onChange={(e) => setInquiryForm({ ...inquiryForm, phone: e.target.value })}
                        placeholder="+45 12 34 56 78"
                      />
                    </div>
                    <div>
                      <Label htmlFor="message">Besked</Label>
                      <Textarea
                        id="message"
                        value={inquiryForm.message}
                        onChange={(e) => setInquiryForm({ ...inquiryForm, message: e.target.value })}
                        placeholder="Fortæl os om dit ophold..."
                        rows={3}
                      />
                    </div>
                  </div>

                  <Button 
                    onClick={handleInquiry} 
                    disabled={isSubmitting}
                    className="w-full"
                    variant="gold"
                    size="lg"
                  >
                    {isSubmitting ? 'Sender...' : 'Send forespørgsel'}
                  </Button>

                  <p className="text-xs text-center text-muted-foreground">
                    Du betaler ikke nu. Vi kontakter dig med bekræftelse.
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
            onClick={() => setCurrentImage((prev) => (prev - 1 + property.images.length) % property.images.length)}
            className="absolute left-4 w-12 h-12 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
          >
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>
          <img
            src={property.images[currentImage]}
            alt={property.title}
            className="max-w-full max-h-[90vh] object-contain"
          />
          <button
            onClick={() => setCurrentImage((prev) => (prev + 1) % property.images.length)}
            className="absolute right-4 w-12 h-12 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
          >
            <ChevronRight className="w-6 h-6 text-white" />
          </button>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white">
            {currentImage + 1} / {property.images.length}
          </div>
        </div>
      )}
    </PublicLayout>
  );
}
