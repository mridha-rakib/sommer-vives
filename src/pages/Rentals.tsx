import { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  MapPin, Users, Bed, Bath, Heart, ChevronLeft, ChevronRight, 
  Search, SlidersHorizontal, CalendarDays, TreePine, Waves, 
  Flame, PawPrint, X, Star, ThumbsUp
} from 'lucide-react';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';
import { PropertyMap } from '@/components/rentals/PropertyMap';

// Extended sample properties
const allProperties = [
  {
    id: '1',
    title: 'Historisk fiskerhus med nyt twist i Klitmøller',
    location: 'Thisted, Danmark',
    description: 'Oplev den unikke kombination af gamle og nye møbler. Bygget i 1979 og fuld af charme med egen lille skov.',
    images: [
      'https://l.icdbcdn.com/oh/9f4b9fab-b84c-4dd2-8f6b-8a2ceb7ee434.png?w=800',
      'https://l.icdbcdn.com/oh/648b6185-5c10-4bc9-8113-631bacd6b83e.jpg?w=800',
    ],
    price: 2098,
    originalPrice: 2304,
    capacity: 11,
    bedrooms: 3,
    bathrooms: 1,
    tags: ['Kæledyr er tilladt', '472 m til strand'],
    category: 'beach',
    coordinates: { lat: 57.04, lng: 8.49 },
    discount: 9,
  },
  {
    id: '2',
    title: 'Lys ferielejlighed i et stråtækt hus på diget',
    location: 'Schleswig-Holstein, Tyskland',
    description: 'Med sin egen private naturgrund får du en unik oplevelse, hvor ro og natur går hånd i hånd.',
    images: [
      'https://l.icdbcdn.com/oh/648b6185-5c10-4bc9-8113-631bacd6b83e.jpg?w=800',
      'https://l.icdbcdn.com/oh/9f4b9fab-b84c-4dd2-8f6b-8a2ceb7ee434.png?w=800',
    ],
    price: 1996,
    originalPrice: 2257,
    capacity: 6,
    bedrooms: 3,
    bathrooms: 1,
    tags: ['Kæledyr er tilladt', 'Lejlighed · 150 m²'],
    category: 'nature',
    coordinates: { lat: 54.85, lng: 8.75 },
    discount: 12,
  },
  {
    id: '3',
    title: 'Gult strandhus med udsigt over Løkken',
    location: 'Løkken, Danmark',
    description: 'Nyd den fantastiske udsigt over havet fra dette charmerende strandhus.',
    images: [
      'https://l.icdbcdn.com/oh/9f4b9fab-b84c-4dd2-8f6b-8a2ceb7ee434.png?w=800',
    ],
    price: 1281,
    originalPrice: 1450,
    capacity: 8,
    bedrooms: 4,
    bathrooms: 1,
    tags: ['Kæledyr er tilladt', '125 m til strand'],
    category: 'beach',
    coordinates: { lat: 57.37, lng: 9.71 },
    discount: 12,
  },
  {
    id: '4',
    title: 'ForestCabin | Søvej 28',
    location: 'Ansager, Syddanmark',
    description: 'Her kan du nyde livet, naturen og tage en tur til det populære Pandekage Huset ved søen.',
    images: [
      'https://l.icdbcdn.com/oh/9f4b9fab-b84c-4dd2-8f6b-8a2ceb7ee434.png?w=800',
      'https://l.icdbcdn.com/oh/648b6185-5c10-4bc9-8113-631bacd6b83e.jpg?w=800',
    ],
    price: 1400,
    capacity: 6,
    bedrooms: 3,
    bathrooms: 1,
    tags: ['Skov', 'Brændeovn', 'Terrasse'],
    category: 'forest',
    coordinates: { lat: 55.7333, lng: 8.3833 },
  },
  {
    id: '5',
    title: 'NatureCabin | Søvej 58',
    location: 'Ansager, Syddanmark',
    description: 'Velkommen til NatureCabin ved Kvie Sø. Med sin egen private naturgrund får du en unik oplevelse.',
    images: [
      'https://l.icdbcdn.com/oh/648b6185-5c10-4bc9-8113-631bacd6b83e.jpg?w=800',
    ],
    price: 550,
    capacity: 6,
    bedrooms: 3,
    bathrooms: 1,
    tags: ['Natur', 'Legeplads', 'Fredelig'],
    category: 'nature',
    coordinates: { lat: 55.7350, lng: 8.3900 },
  },
  {
    id: '6',
    title: 'Bæredygtigt loft i Lübeck-bugten',
    location: 'Schleswig-Holstein, Tyskland',
    description: 'Moderne og bæredygtigt sommerhus med fokus på natur og komfort.',
    images: [
      'https://l.icdbcdn.com/oh/9f4b9fab-b84c-4dd2-8f6b-8a2ceb7ee434.png?w=800',
    ],
    price: 1261,
    originalPrice: 1540,
    capacity: 2,
    bedrooms: 1,
    bathrooms: 1,
    tags: ['1,9 km til strand', 'Hus · 36 m²'],
    category: 'beach',
    coordinates: { lat: 54.08, lng: 10.88 },
    discount: 18,
  },
];

const filterOptions = [
  { id: 'pets', label: 'Kæledyr tilladt', icon: PawPrint },
  { id: 'fireplace', label: 'Brændeovn', icon: Flame },
  { id: 'pool', label: 'Pool', icon: Waves },
  { id: 'forest', label: 'Skov', icon: TreePine },
];

export default function Rentals() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [location, setLocation] = useState(searchParams.get('location') || '');
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({
    from: searchParams.get('checkin') ? new Date(searchParams.get('checkin')!) : undefined,
    to: searchParams.get('checkout') ? new Date(searchParams.get('checkout')!) : undefined,
  });
  const [guests, setGuests] = useState(parseInt(searchParams.get('guests') || '2'));
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [hoveredProperty, setHoveredProperty] = useState<string | null>(null);
  const [showMap, setShowMap] = useState(true);
  const [likedProperties, setLikedProperties] = useState<string[]>([]);

  const filteredProperties = allProperties;

  const toggleLike = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setLikedProperties(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const PropertyCard = ({ property }: { property: typeof allProperties[0] }) => {
    const [currentImage, setCurrentImage] = useState(0);

    return (
      <Link 
        to={`/property/${property.id}`}
        className="group block"
        onMouseEnter={() => setHoveredProperty(property.id)}
        onMouseLeave={() => setHoveredProperty(null)}
      >
        <div className={`bg-card rounded-xl overflow-hidden transition-all duration-300 ${
          hoveredProperty === property.id ? 'shadow-elevated ring-1 ring-accent/20' : 'shadow-soft'
        }`}>
          {/* Image */}
          <div className="relative aspect-[4/3] overflow-hidden">
            <img
              src={property.images[currentImage]}
              alt={property.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            
            {/* Image navigation */}
            {property.images.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setCurrentImage(prev => (prev - 1 + property.images.length) % property.images.length);
                  }}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-card/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setCurrentImage(prev => (prev + 1) % property.images.length);
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-card/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {property.images.map((_, idx) => (
                    <div
                      key={idx}
                      className={`w-1.5 h-1.5 rounded-full transition-colors ${
                        idx === currentImage ? 'bg-white' : 'bg-white/50'
                      }`}
                    />
                  ))}
                </div>
              </>
            )}

            {/* Discount badge */}
            {property.discount && (
              <Badge className="absolute top-3 left-3 bg-accent text-primary font-semibold">
                -{property.discount}%
              </Badge>
            )}

            {/* Like button */}
            <button
              onClick={(e) => toggleLike(property.id, e)}
              className="absolute top-3 right-3 w-9 h-9 rounded-full bg-card/80 flex items-center justify-center hover:bg-card transition-colors"
            >
              <Heart
                className={`w-5 h-5 transition-colors ${
                  likedProperties.includes(property.id) 
                    ? 'fill-destructive text-destructive' 
                    : 'text-primary'
                }`}
              />
            </button>
          </div>

          {/* Content */}
          <div className="p-4">
            <h3 className="font-display text-lg font-semibold text-primary mb-1 line-clamp-2 group-hover:text-accent transition-colors">
              {property.title}
            </h3>
            
            <p className="text-sm text-muted-foreground flex items-center gap-1 mb-3">
              <MapPin className="w-3.5 h-3.5" />
              {property.location}
            </p>

            {/* Details */}
            <div className="flex items-center gap-3 text-sm text-muted-foreground mb-3">
              <span className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                {property.capacity} gæster
              </span>
              <span className="flex items-center gap-1">
                <Bed className="w-4 h-4" />
                {property.bedrooms} soveværelser
              </span>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-1.5 mb-3">
              {property.tags.slice(0, 2).map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground flex items-center gap-1"
                >
                  {tag.includes('Kæledyr') && <PawPrint className="w-3 h-3" />}
                  {tag.includes('strand') && <Waves className="w-3 h-3" />}
                  {tag}
                </span>
              ))}
            </div>

            {/* Price */}
            <div className="pt-3 border-t border-border">
              <div className="flex items-baseline gap-2">
                {property.discount && property.originalPrice && (
                  <span className="text-sm text-muted-foreground line-through">
                    {property.originalPrice.toLocaleString('da-DK')} DKK
                  </span>
                )}
                <span className="text-lg font-bold text-primary">
                  {property.price.toLocaleString('da-DK')} DKK/nat
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                inkl. forbrug, rengøring og forsikring
              </p>
            </div>
          </div>
        </div>
      </Link>
    );
  };

  return (
    <PublicLayout>
      {/* Search Header */}
      <section className="sticky top-16 z-40 bg-card border-b shadow-soft">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-2">
            {/* Location */}
            <div className="flex items-center gap-2 px-4 py-2 rounded-full border bg-background hover:border-accent transition-colors cursor-pointer">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Hvor går turen hen?"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="border-0 bg-transparent p-0 h-6 w-32 focus-visible:ring-0"
              />
            </div>

            {/* Dates */}
            <Popover>
              <PopoverTrigger asChild>
                <div className="flex items-center gap-2 px-4 py-2 rounded-full border bg-background hover:border-accent transition-colors cursor-pointer">
                  <CalendarDays className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">
                    {dateRange.from && dateRange.to
                      ? `${format(dateRange.from, 'd. MMM', { locale: da })} - ${format(dateRange.to, 'd. MMM', { locale: da })}`
                      : 'Tilføj datoer'}
                  </span>
                </div>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="range"
                  selected={{ from: dateRange.from, to: dateRange.to }}
                  onSelect={(range) => setDateRange({ from: range?.from, to: range?.to })}
                  numberOfMonths={2}
                  locale={da}
                />
              </PopoverContent>
            </Popover>

            {/* Guests */}
            <Popover>
              <PopoverTrigger asChild>
                <div className="flex items-center gap-2 px-4 py-2 rounded-full border bg-background hover:border-accent transition-colors cursor-pointer">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">{guests} gæster</span>
                </div>
              </PopoverTrigger>
              <PopoverContent className="w-48" align="start">
                <div className="flex items-center justify-between">
                  <span>Gæster</span>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setGuests(Math.max(1, guests - 1))}>-</Button>
                    <span className="w-6 text-center">{guests}</span>
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setGuests(guests + 1)}>+</Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            {/* Filters */}
            <Button
              variant={showFilters ? 'default' : 'outline'}
              className="rounded-full"
              onClick={() => setShowFilters(!showFilters)}
            >
              <SlidersHorizontal className="w-4 h-4 mr-2" />
              Filtre
              {activeFilters.length > 0 && (
                <Badge className="ml-2 bg-accent text-primary">{activeFilters.length}</Badge>
              )}
            </Button>

            {/* Search Button */}
            <Button className="rounded-full bg-primary">
              <Search className="w-4 h-4" />
            </Button>

            <div className="flex-1" />

            {/* Map Toggle */}
            <Button
              variant="outline"
              className="rounded-full"
              onClick={() => setShowMap(!showMap)}
            >
              {showMap ? 'Skjul kort' : 'Vis kort'}
            </Button>
          </div>

          {/* Filter Options */}
          {showFilters && (
            <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t">
              {filterOptions.map(filter => (
                <button
                  key={filter.id}
                  onClick={() => {
                    setActiveFilters(prev =>
                      prev.includes(filter.id)
                        ? prev.filter(f => f !== filter.id)
                        : [...prev, filter.id]
                    );
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-colors ${
                    activeFilters.includes(filter.id)
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background hover:border-accent'
                  }`}
                >
                  <filter.icon className="w-4 h-4" />
                  {filter.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Results Header */}
      <section className="py-6 bg-background">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <h1 className="font-display text-2xl md:text-3xl font-bold text-primary">
              {filteredProperties.length}+ håndplukkede sommerhuse
            </h1>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <ThumbsUp className="w-4 h-4" />
                <span>98% gæstetilfredshed</span>
              </div>
              <div className="flex items-center gap-1 text-accent">
                <span className="font-semibold">Fremragende</span>
                <div className="flex">
                  {[1,2,3,4,5].map(i => (
                    <Star key={i} className="w-3 h-3 fill-accent text-accent" />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="pb-12 bg-background">
        <div className="container mx-auto px-4">
          <div className={`grid gap-6 ${showMap ? 'lg:grid-cols-2' : ''}`}>
            {/* Property Grid */}
            <div className={`grid gap-6 ${showMap ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'}`}>
              {filteredProperties.map(property => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>

            {/* Map */}
            {showMap && (
              <div className="hidden lg:block sticky top-40 h-[calc(100vh-200px)] rounded-xl overflow-hidden border">
                <PropertyMap
                  properties={filteredProperties}
                  hoveredProperty={hoveredProperty}
                  onPropertyHover={setHoveredProperty}
                />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Newsletter CTA - Landfolk style */}
      <section className="py-16 bg-primary">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
            <div>
              <h2 className="font-display text-2xl md:text-3xl font-bold text-primary-foreground mb-2">
                Ugentlig inspiration leveret direkte til din indbakke
              </h2>
              <p className="text-primary-foreground/70">
                inklusive tidlig adgang til nye, unikke sommerhuse
              </p>
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <Input
                placeholder="Din e-mail"
                className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/50"
              />
              <Button variant="gold">Tilmeld</Button>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
