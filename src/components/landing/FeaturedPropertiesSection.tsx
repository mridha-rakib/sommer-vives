import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Heart, MapPin, Users, Bed, ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';

interface FeaturedProperty {
  id: string;
  slug: string;
  title: string;
  location: string;
  images: string[];
  price: number;
  capacity: number;
  bedrooms: number | null;
  discount?: number | null;
  highlight?: string | null;
}

export function FeaturedPropertiesSection() {
  const [likedProperties, setLikedProperties] = useState<string[]>([]);
  const [featuredProperties, setFeaturedProperties] = useState<FeaturedProperty[]>([]);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('listings')
        .select('id, slug, name, address, region, hero_image, images, base_price_per_night, max_guests, bedrooms, tagline, teaser')
        .eq('is_active', true)
        .order('sort_order')
        .limit(8);

      setFeaturedProperties((data || []).map((listing) => ({
        id: listing.id,
        slug: listing.slug,
        title: listing.name,
        location: [listing.address, listing.region].filter(Boolean).join(', '),
        images: [listing.hero_image, ...((listing.images || []) as string[])].filter(Boolean) as string[],
        price: Math.round((listing.base_price_per_night || 0) / 100),
        capacity: listing.max_guests,
        bedrooms: listing.bedrooms,
        highlight: listing.tagline || listing.teaser,
      })));
    };

    load();
  }, []);

  const toggleLike = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setLikedProperties(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const PropertyCard = ({ property }: { property: FeaturedProperty }) => {
    const [currentImage, setCurrentImage] = useState(0);
    const images = property.images.length > 0 ? property.images : ['/placeholder.svg'];

    return (
      <Link to={`/listing/${property.slug}`} className="group block flex-shrink-0 w-72 snap-start">
        <div className="bg-card rounded-xl overflow-hidden shadow-soft hover:shadow-elevated transition-all duration-300">
          {/* Image */}
          <div className="relative aspect-square overflow-hidden">
            <img
              src={images[currentImage]}
              alt={property.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            
            {/* Navigation */}
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
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1">
                  {images.map((_, idx) => (
                    <div
                      key={idx}
                      className={`w-1.5 h-1.5 rounded-full ${idx === currentImage ? 'bg-white' : 'bg-white/50'}`}
                    />
                  ))}
                </div>
              </>
            )}

            {/* Discount */}
            {property.discount && (
              <Badge className="absolute top-3 left-3 bg-accent text-background font-semibold">
                -{property.discount}%
              </Badge>
            )}

            {/* Like */}
            <button
              onClick={(e) => toggleLike(property.id, e)}
              className="absolute top-3 right-3 w-9 h-9 rounded-full bg-card/80 flex items-center justify-center hover:bg-card transition-colors"
            >
              <Heart className={`w-5 h-5 ${likedProperties.includes(property.id) ? 'fill-destructive text-destructive' : 'text-primary'}`} />
            </button>

            {/* Highlight */}
            {property.highlight && (
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-background/90 to-transparent p-4 pt-12">
                <p className="text-sm text-foreground/90 italic">
                  "{property.highlight}"
                </p>
                <p className="text-xs text-foreground/70 mt-1">
                  Highlight fra værten
                </p>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-4">
            <h3 className="font-display text-base font-semibold text-primary mb-1 line-clamp-2 group-hover:text-accent transition-colors">
              {property.title}
            </h3>
            <p className="text-sm text-muted-foreground flex items-center gap-1 mb-2">
              <MapPin className="w-3 h-3" />
              {property.location}
            </p>
            <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                {property.capacity} gæster
              </span>
              <span className="flex items-center gap-1">
                <Bed className="w-3 h-3" />
                {property.bedrooms} soveværelser
              </span>
            </div>
            <div className="pt-3 border-t border-border">
              <span className="font-bold text-primary">{property.price.toLocaleString('da-DK')} DKK</span>
              <span className="text-muted-foreground text-sm"> /nat</span>
            </div>
          </div>
        </div>
      </Link>
    );
  };

  if (featuredProperties.length === 0) return null;

  return (
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <h2 className="font-display text-2xl md:text-3xl font-bold text-primary">
            Håndplukkede anbefalinger til dig
          </h2>
          <Link 
            to="/listings" 
            className="flex items-center gap-2 text-accent hover:underline font-medium"
          >
            Udforsk alle sommerhuse
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="flex gap-6 overflow-x-auto pb-4 -mx-4 px-4 snap-x snap-mandatory">
          {featuredProperties.map(property => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
      </div>
    </section>
  );
}
