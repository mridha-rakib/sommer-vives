import { useState } from 'react';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, Users, Bed, Bath, TreePine, Waves, Sparkles, Heart } from 'lucide-react';
import { PropertyMap } from '@/components/rentals/PropertyMap';

// Sample featured properties based on ForestCabin data
const featuredProperties = [
  {
    id: '1',
    title: 'ForestCabin | Søvej 28',
    location: 'Ansager, Syddanmark',
    description: 'Her kan du nyde livet, naturen og tage en tur til det populære Pandekage Huset ved søen. Bygget i 1979 og fuld af charme med egen lille skov.',
    image: 'https://l.icdbcdn.com/oh/9f4b9fab-b84c-4dd2-8f6b-8a2ceb7ee434.png?w=800',
    price: 1400,
    capacity: 6,
    bedrooms: 3,
    bathrooms: 1,
    tags: ['Skov', 'Brændeovn', 'Terrasse'],
    category: 'forest',
    coordinates: { lat: 55.7333, lng: 8.3833 },
  },
  {
    id: '2',
    title: 'NatureCabin | Søvej 58',
    location: 'Ansager, Syddanmark',
    description: 'Velkommen til NatureCabin ved Kvie Sø. Med sin egen private naturgrund får du en unik oplevelse, hvor ro og natur går hånd i hånd.',
    image: 'https://l.icdbcdn.com/oh/648b6185-5c10-4bc9-8113-631bacd6b83e.jpg?w=800',
    price: 550,
    capacity: 6,
    bedrooms: 3,
    bathrooms: 1,
    tags: ['Natur', 'Legeplads', 'Fredelig'],
    category: 'nature',
    coordinates: { lat: 55.7350, lng: 8.3900 },
  },
];

const categories = [
  { id: 'all', label: 'Alle', icon: Sparkles },
  { id: 'forest', label: 'Skovhuse', icon: TreePine },
  { id: 'nature', label: 'Naturperler', icon: Heart },
  { id: 'spa', label: 'Spa & Pool', icon: Waves },
];

export default function Rentals() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [hoveredProperty, setHoveredProperty] = useState<string | null>(null);

  const filteredProperties = activeCategory === 'all'
    ? featuredProperties
    : featuredProperties.filter(p => p.category === activeCategory);

  return (
    <PublicLayout>
      {/* Hero Section */}
      <section className="bg-primary py-16 md:py-24">
        <div className="container mx-auto px-4 text-center">
          <Badge variant="outline" className="mb-4 border-accent/50 text-accent">
            Unikke oplevelser
          </Badge>
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-primary-foreground mb-6">
            Find dit perfekte
            <span className="text-accent"> fristed</span>
          </h1>
          <p className="text-lg md:text-xl text-primary-foreground/80 max-w-2xl mx-auto">
            Oplev charmen ved Danmarks mest unikke sommerhuse. 
            Fra skovens ro til spa-luksus – vi kuraterer kun det bedste.
          </p>
        </div>
      </section>

      {/* Value Proposition */}
      <section className="py-12 bg-background border-b">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <TreePine className="w-10 h-10 text-accent mx-auto mb-3" />
              <h3 className="font-semibold text-primary mb-1">Naturskønne beliggenheder</h3>
              <p className="text-sm text-muted-foreground">
                Alle vores huse ligger i unikke naturomgivelser
              </p>
            </div>
            <div>
              <Sparkles className="w-10 h-10 text-accent mx-auto mb-3" />
              <h3 className="font-semibold text-primary mb-1">Håndplukkede perler</h3>
              <p className="text-sm text-muted-foreground">
                Vi udvælger kun sommerhuse med særlig charme
              </p>
            </div>
            <div>
              <Heart className="w-10 h-10 text-accent mx-auto mb-3" />
              <h3 className="font-semibold text-primary mb-1">Autentiske oplevelser</h3>
              <p className="text-sm text-muted-foreground">
                Mærk hyggen og den danske feriefølelse
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Category Filter */}
      <section className="py-8 bg-background sticky top-16 z-40 border-b">
        <div className="container mx-auto px-4">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {categories.map(category => (
              <Button
                key={category.id}
                variant={activeCategory === category.id ? 'default' : 'outline'}
                onClick={() => setActiveCategory(category.id)}
                className="flex items-center gap-2 whitespace-nowrap"
              >
                <category.icon className="w-4 h-4" />
                {category.label}
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* Map and Listings */}
      <section className="py-12 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Property Cards */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-2xl font-bold text-primary">
                  {filteredProperties.length} unikke sommerhuse
                </h2>
              </div>

              {filteredProperties.map(property => (
                <Card
                  key={property.id}
                  className={`overflow-hidden transition-all duration-300 hover:shadow-elevated cursor-pointer ${
                    hoveredProperty === property.id ? 'ring-2 ring-accent' : ''
                  }`}
                  onMouseEnter={() => setHoveredProperty(property.id)}
                  onMouseLeave={() => setHoveredProperty(null)}
                >
                  <div className="flex flex-col md:flex-row">
                    <div className="md:w-2/5 relative">
                      <img
                        src={property.image}
                        alt={property.title}
                        className="w-full h-48 md:h-full object-cover"
                      />
                      <div className="absolute top-3 left-3 flex gap-2">
                        {property.tags.slice(0, 2).map(tag => (
                          <Badge key={tag} variant="secondary" className="bg-background/90">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <CardContent className="md:w-3/5 p-5">
                      <h3 className="font-display text-xl font-semibold text-primary mb-1">
                        {property.title}
                      </h3>
                      <p className="text-sm text-muted-foreground flex items-center gap-1 mb-3">
                        <MapPin className="w-3 h-3" />
                        {property.location}
                      </p>
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                        {property.description}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {property.capacity}
                        </span>
                        <span className="flex items-center gap-1">
                          <Bed className="w-4 h-4" />
                          {property.bedrooms}
                        </span>
                        <span className="flex items-center gap-1">
                          <Bath className="w-4 h-4" />
                          {property.bathrooms}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-2xl font-bold text-primary">
                            {property.price.toLocaleString('da-DK')} kr.
                          </span>
                          <span className="text-muted-foreground text-sm"> / nat</span>
                        </div>
                        <Button variant="gold">Se detaljer</Button>
                      </div>
                    </CardContent>
                  </div>
                </Card>
              ))}
            </div>

            {/* Map */}
            <div className="lg:sticky lg:top-32 h-[500px] lg:h-[calc(100vh-200px)] rounded-xl overflow-hidden border">
              <PropertyMap
                properties={filteredProperties}
                hoveredProperty={hoveredProperty}
                onPropertyHover={setHoveredProperty}
              />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
            Ejer du et unikt sommerhus?
          </h2>
          <p className="text-primary-foreground/80 mb-8 max-w-xl mx-auto">
            Vi leder altid efter sommerhuse med særlig charme. 
            Kun 15% i kommission – lavere end alle andre bureauer.
          </p>
          <Button variant="hero" size="xl" asChild>
            <a href="/auth?mode=signup">Opret dit sommerhus</a>
          </Button>
        </div>
      </section>
    </PublicLayout>
  );
}
