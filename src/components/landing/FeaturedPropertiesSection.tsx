import { Link } from 'react-router-dom';
import { useState } from 'react';
import { Heart, MapPin, Users, Bed, ChevronLeft, ChevronRight, ArrowRight, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const featuredProperties = [
  {
    id: '1',
    title: 'Historisk fiskerhus med nyt twist i Klitmøller',
    location: 'Thisted, Danmark',
    image: 'https://l.icdbcdn.com/oh/9f4b9fab-b84c-4dd2-8f6b-8a2ceb7ee434.png?w=800',
    images: [
      'https://l.icdbcdn.com/oh/9f4b9fab-b84c-4dd2-8f6b-8a2ceb7ee434.png?w=800',
      'https://l.icdbcdn.com/oh/648b6185-5c10-4bc9-8113-631bacd6b83e.jpg?w=800',
    ],
    price: 2098,
    capacity: 11,
    bedrooms: 3,
    discount: 9,
    highlight: 'Oplev den unikke kombination af gamle og nye møbler',
    host: 'Martin',
  },
  {
    id: '2',
    title: 'Lys ferielejlighed i et stråtækt hus på diget',
    location: 'Schleswig-Holstein, Tyskland',
    image: 'https://l.icdbcdn.com/oh/648b6185-5c10-4bc9-8113-631bacd6b83e.jpg?w=800',
    images: [
      'https://l.icdbcdn.com/oh/648b6185-5c10-4bc9-8113-631bacd6b83e.jpg?w=800',
    ],
    price: 1996,
    capacity: 6,
    bedrooms: 3,
    discount: 12,
    highlight: 'Nyd roen på det smukke dige',
    host: 'Anna',
  },
  {
    id: '3',
    title: 'Gult strandhus med udsigt over Løkken',
    location: 'Løkken, Danmark',
    image: 'https://l.icdbcdn.com/oh/9f4b9fab-b84c-4dd2-8f6b-8a2ceb7ee434.png?w=800',
    images: [
      'https://l.icdbcdn.com/oh/9f4b9fab-b84c-4dd2-8f6b-8a2ceb7ee434.png?w=800',
    ],
    price: 1281,
    capacity: 8,
    bedrooms: 4,
    discount: 12,
    highlight: 'Våg op til lyden af bølgerne',
    host: 'Lars',
  },
  {
    id: '4',
    title: 'ForestCabin | Søvej 28',
    location: 'Ansager, Syddanmark',
    image: 'https://l.icdbcdn.com/oh/9f4b9fab-b84c-4dd2-8f6b-8a2ceb7ee434.png?w=800',
    images: [
      'https://l.icdbcdn.com/oh/9f4b9fab-b84c-4dd2-8f6b-8a2ceb7ee434.png?w=800',
      'https://l.icdbcdn.com/oh/648b6185-5c10-4bc9-8113-631bacd6b83e.jpg?w=800',
    ],
    price: 1400,
    capacity: 6,
    bedrooms: 3,
    highlight: 'Egen lille skov med total ro',
    host: 'Peter',
  },
];

export function FeaturedPropertiesSection() {
  const [likedProperties, setLikedProperties] = useState<string[]>([]);

  const toggleLike = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setLikedProperties(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const PropertyCard = ({ property }: { property: typeof featuredProperties[0] }) => {
    const [currentImage, setCurrentImage] = useState(0);

    return (
      <Link to={`/property/${property.id}`} className="group block flex-shrink-0 w-72 snap-start">
        <div className="bg-card rounded-xl overflow-hidden shadow-soft hover:shadow-elevated transition-all duration-300">
          {/* Image */}
          <div className="relative aspect-square overflow-hidden">
            <img
              src={property.images[currentImage]}
              alt={property.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            
            {/* Navigation */}
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
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1">
                  {property.images.map((_, idx) => (
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
              <Badge className="absolute top-3 left-3 bg-accent text-primary font-semibold">
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
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-primary/90 to-transparent p-4 pt-12">
                <p className="text-sm text-primary-foreground/90 italic">
                  "{property.highlight}"
                </p>
                <p className="text-xs text-primary-foreground/70 mt-1">
                  Highlight fra værten {property.host}
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

  return (
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <h2 className="font-display text-2xl md:text-3xl font-bold text-primary">
            Håndplukkede anbefalinger til dig
          </h2>
          <Link 
            to="/rentals" 
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
