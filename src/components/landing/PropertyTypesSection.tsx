import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';

const propertyTypes = [
  {
    title: 'Klassisk sommerhus',
    earnings: '40.000–150.000 DKK',
    description:
      'Hvis dit sommerhus har plads til 4-10 gæster, er tæt på smuk natur, og du har indrettet det personligt, kan du forvente en flot ekstra indtjening.',
    image: 'https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8?w=800&h=600&fit=crop',
  },
  {
    title: 'Premium sommerhus',
    earnings: '70.000–250.000 DKK',
    description:
      'Hvis du har opgraderet dit sommerhus med features som vildmarksbad eller det er designet af en arkitekt, så er du rigtig godt på vej.',
    image: 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=800&h=600&fit=crop',
  },
  {
    title: 'Ekstraordinært sommerhus',
    earnings: '100.000–360.000 DKK',
    description:
      'En betagende havudsigt kan gøre hele forskellen. Hvis dit sommerhus har en helt ekstraordinær feature, er det et match made in heaven.',
    image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=600&fit=crop',
  },
];

export function PropertyTypesSection() {
  return (
    <section className="py-20 md:py-28 bg-background">
      <div className="container mx-auto px-4 md:px-8">
        <div className="grid lg:grid-cols-[1fr_2fr] gap-12 items-start max-w-7xl mx-auto">
          {/* Left - Text */}
          <div className="lg:sticky lg:top-32">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-primary mb-6">
              Hvad kan du tjene på forskellige typer sommerhuse?
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Alle SommerVibes-sommerhuse er unikke. Ikke to er ens – nogle er rene og
              enkle klassikere, nogle er opgraderet med nye features, og nogle har noget
              helt ekstraordinært.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-8">
              Find din type sommerhus og se vores vurdering af, hvad du kan tjene.
            </p>
            <Link to="/beregn-lejeindtaegt">
              <Button variant="link" className="text-primary gap-2 p-0 text-base font-medium">
                Se mere
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>

          {/* Right - Carousel */}
          <div>
            <Carousel opts={{ align: 'start', loop: true }} className="w-full">
              <CarouselContent className="-ml-4">
                {propertyTypes.map((type, i) => (
                  <CarouselItem key={i} className="pl-4 md:basis-1/2">
                    <div className="group">
                      <div className="rounded-xl overflow-hidden mb-4 aspect-[4/3]">
                        <img
                          src={type.image}
                          alt={type.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                        />
                      </div>
                      <h3 className="font-display text-xl font-bold text-primary mb-1">
                        {type.title}
                      </h3>
                      <div className="font-display text-lg text-accent font-semibold mb-3">
                        {type.earnings}
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {type.description}
                      </p>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <div className="flex gap-2 mt-6">
                <CarouselPrevious className="static translate-y-0 border-border" />
                <CarouselNext className="static translate-y-0 border-border" />
              </div>
            </Carousel>
          </div>
        </div>
      </div>
    </section>
  );
}
