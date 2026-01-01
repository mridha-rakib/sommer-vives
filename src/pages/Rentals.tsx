import { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { 
  MapPin, Users, Bed, Bath, Heart, ChevronLeft, ChevronRight, 
  Search, SlidersHorizontal, CalendarDays, TreePine, Waves, 
  Flame, PawPrint, Star, ThumbsUp, Map, Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';
import { PropertyMap } from '@/components/rentals/PropertyMap';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const filterOptions = [
  { id: 'pets', label: 'Kæledyr tilladt', icon: PawPrint, amenity: 'Husdyr tilladt' },
  { id: 'fireplace', label: 'Brændeovn', icon: Flame, amenity: 'Brændeovn' },
  { id: 'pool', label: 'Pool', icon: Waves, amenity: 'Pool' },
  { id: 'forest', label: 'Skov', icon: TreePine, amenity: 'Skovudsigt' },
];

interface Property {
  id: string;
  title: string;
  address: string;
  region: string;
  description: string | null;
  images: string[] | null;
  price_per_night: number | null;
  price_per_week: number | null;
  capacity: number;
  bedrooms: number | null;
  bathrooms: number | null;
  amenities: string[] | null;
}

function PropertyCard({ 
  property, 
  isLiked, 
  onToggleLike, 
  isHovered,
  onHover 
}: { 
  property: Property;
  isLiked: boolean;
  onToggleLike: (id: string, e: React.MouseEvent) => void;
  isHovered: boolean;
  onHover: (id: string | null) => void;
}) {
  const [currentImage, setCurrentImage] = useState(0);
  const images = property.images && property.images.length > 0 
    ? property.images 
    : ['https://l.icdbcdn.com/oh/9f4b9fab-b84c-4dd2-8f6b-8a2ceb7ee434.png?w=800'];

  const price = property.price_per_night || Math.round((property.price_per_week || 7000) / 7);

  return (
    <Link 
      to={`/property/${property.id}`}
      className="group block"
      onMouseEnter={() => onHover(property.id)}
      onMouseLeave={() => onHover(null)}
    >
      <div className={`bg-card rounded-xl overflow-hidden transition-all duration-300 ${
        isHovered ? 'shadow-elevated ring-1 ring-accent/20' : 'shadow-soft'
      }`}>
        {/* Image */}
        <div className="relative aspect-[4/3] overflow-hidden">
          <img
            src={images[currentImage]}
            alt={property.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          
          {/* Image navigation */}
          {images.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setCurrentImage(prev => (prev - 1 + images.length) % images.length);
                }}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-card/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setCurrentImage(prev => (prev + 1) % images.length);
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-card/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                {images.map((_, idx) => (
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

          {/* Like button */}
          <button
            onClick={(e) => onToggleLike(property.id, e)}
            className="absolute top-3 right-3 w-9 h-9 rounded-full bg-card/80 flex items-center justify-center hover:bg-card transition-colors"
          >
            <Heart
              className={`w-5 h-5 transition-colors ${
                isLiked 
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
            {property.region}, Danmark
          </p>

          {/* Details */}
          <div className="flex items-center gap-3 text-sm text-muted-foreground mb-3">
            <span className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              {property.capacity}
            </span>
            <span className="flex items-center gap-1">
              <Bed className="w-4 h-4" />
              {property.bedrooms || 2}
            </span>
            <span className="flex items-center gap-1">
              <Bath className="w-4 h-4" />
              {property.bathrooms || 1}
            </span>
          </div>

          {/* Tags */}
          {property.amenities && property.amenities.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {property.amenities.slice(0, 2).map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground flex items-center gap-1"
                >
                  {tag.toLowerCase().includes('husdyr') && <PawPrint className="w-3 h-3" />}
                  {tag.toLowerCase().includes('pool') && <Waves className="w-3 h-3" />}
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Price */}
          <div className="pt-3 border-t border-border">
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-bold text-primary">
                {price.toLocaleString('da-DK')} kr.
              </span>
              <span className="text-sm text-muted-foreground">/ nat</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function Rentals() {
  const [searchParams] = useSearchParams();
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

  // Fetch published properties from database
  const { data: properties = [], isLoading } = useQuery({
    queryKey: ['published-properties'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('status', 'published')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Property[];
    },
  });

  // Filter properties based on active filters
  const filteredProperties = properties.filter(property => {
    if (activeFilters.length === 0) return true;
    
    return activeFilters.every(filterId => {
      const filter = filterOptions.find(f => f.id === filterId);
      if (!filter || !property.amenities) return false;
      return property.amenities.some(a => 
        a.toLowerCase().includes(filter.amenity.toLowerCase())
      );
    });
  });

  // Filter by location
  const locationFiltered = location 
    ? filteredProperties.filter(p => 
        p.region.toLowerCase().includes(location.toLowerCase()) ||
        p.address.toLowerCase().includes(location.toLowerCase()) ||
        p.title.toLowerCase().includes(location.toLowerCase())
      )
    : filteredProperties;

  // Filter by guests
  const guestsFiltered = locationFiltered.filter(p => p.capacity >= guests);

  const toggleLike = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setLikedProperties(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  // Create coordinates for map
  const propertiesWithCoords = guestsFiltered.map(p => ({
    ...p,
    coordinates: { lat: 55.5 + Math.random() * 2, lng: 8.5 + Math.random() * 2 },
    price: p.price_per_night || Math.round((p.price_per_week || 7000) / 7),
    location: `${p.region}, Danmark`,
  }));

  return (
    <PublicLayout>
      {/* Search Header */}
      <section className="sticky top-16 z-40 bg-card border-b border-border shadow-soft">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Location */}
            <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-background hover:border-accent transition-colors">
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
                <Button variant="outline" className="rounded-full gap-2">
                  <CalendarDays className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">
                    {dateRange.from && dateRange.to
                      ? `${format(dateRange.from, 'd. MMM', { locale: da })} - ${format(dateRange.to, 'd. MMM', { locale: da })}`
                      : 'Tilføj datoer'}
                  </span>
                </Button>
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
                <Button variant="outline" className="rounded-full gap-2">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">{guests} gæster</span>
                </Button>
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
              className="rounded-full gap-2"
              onClick={() => setShowFilters(!showFilters)}
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filtre
              {activeFilters.length > 0 && (
                <Badge className="ml-1 bg-accent text-primary">{activeFilters.length}</Badge>
              )}
            </Button>

            {/* Search Button */}
            <Button className="rounded-full" size="icon">
              <Search className="w-4 h-4" />
            </Button>

            <div className="flex-1" />

            {/* Map Toggle */}
            <Button
              variant="outline"
              className="rounded-full gap-2"
              onClick={() => setShowMap(!showMap)}
            >
              <Map className="w-4 h-4" />
              {showMap ? 'Skjul kort' : 'Vis kort'}
            </Button>
          </div>

          {/* Filter Options */}
          {showFilters && (
            <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-border">
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
                      : 'bg-background border-border hover:border-accent'
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
          <div className="flex items-center justify-between flex-wrap gap-4">
            <h1 className="font-display text-2xl md:text-3xl font-bold text-primary">
              {isLoading ? 'Indlæser...' : `${guestsFiltered.length} håndplukkede sommerhuse`}
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
          {isLoading ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="w-8 h-8 animate-spin text-accent" />
            </div>
          ) : guestsFiltered.length === 0 ? (
            <div className="text-center py-24">
              <div className="text-6xl mb-4">🏠</div>
              <h2 className="font-display text-2xl font-semibold text-primary mb-2">
                Ingen sommerhuse fundet
              </h2>
              <p className="text-muted-foreground mb-6">
                Prøv at justere dine filtre eller søgekriterier
              </p>
              <Button variant="outline" onClick={() => {
                setActiveFilters([]);
                setLocation('');
                setGuests(2);
              }}>
                Nulstil filtre
              </Button>
            </div>
          ) : (
            <div className={`grid gap-6 ${showMap ? 'lg:grid-cols-[1fr_400px]' : ''}`}>
              {/* Property Grid */}
              <div className={`grid gap-6 ${showMap ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'}`}>
                {guestsFiltered.map(property => (
                  <PropertyCard
                    key={property.id}
                    property={property}
                    isLiked={likedProperties.includes(property.id)}
                    onToggleLike={toggleLike}
                    isHovered={hoveredProperty === property.id}
                    onHover={setHoveredProperty}
                  />
                ))}
              </div>

              {/* Map */}
              {showMap && propertiesWithCoords.length > 0 && (
                <div className="hidden lg:block sticky top-36 h-[calc(100vh-10rem)] rounded-xl overflow-hidden">
                  <PropertyMap
                    properties={propertiesWithCoords}
                    hoveredProperty={hoveredProperty}
                    onPropertyHover={setHoveredProperty}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </PublicLayout>
  );
}
