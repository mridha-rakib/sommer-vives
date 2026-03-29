import { Link } from 'react-router-dom';
import { ArrowRight, MapPin } from 'lucide-react';

const destinations = [
  {
    name: 'Danmark',
    image: 'https://l.icdbcdn.com/oh/9f4b9fab-b84c-4dd2-8f6b-8a2ceb7ee434.png?w=600',
    count: '2000+',
  },
  {
    name: 'Jylland',
    image: 'https://l.icdbcdn.com/oh/648b6185-5c10-4bc9-8113-631bacd6b83e.jpg?w=600',
    count: '850+',
  },
  {
    name: 'Sjælland',
    image: 'https://l.icdbcdn.com/oh/9f4b9fab-b84c-4dd2-8f6b-8a2ceb7ee434.png?w=600',
    count: '450+',
  },
  {
    name: 'Fyn',
    image: 'https://l.icdbcdn.com/oh/648b6185-5c10-4bc9-8113-631bacd6b83e.jpg?w=600',
    count: '200+',
  },
  {
    name: 'Bornholm',
    image: 'https://l.icdbcdn.com/oh/9f4b9fab-b84c-4dd2-8f6b-8a2ceb7ee434.png?w=600',
    count: '120+',
  },
];

export function DestinationsSection() {
  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <h2 className="font-display text-2xl md:text-3xl font-bold text-primary">
            Populære destinationer
          </h2>
          <Link 
            to="/listings" 
            className="flex items-center gap-2 text-accent hover:underline font-medium"
          >
            Se alle
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 snap-x snap-mandatory">
          {destinations.map((destination) => (
            <Link
              key={destination.name}
              to={`/listings?location=${destination.name}`}
              className="group flex-shrink-0 w-40 snap-start"
            >
              <div className="relative aspect-square rounded-2xl overflow-hidden mb-2">
                <img
                  src={destination.image}
                  alt={destination.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-primary/60 to-transparent" />
                <div className="absolute bottom-3 left-3 right-3">
                  <span className="font-display text-lg font-semibold text-background">
                    {destination.name}
                  </span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                {destination.count} sommerhuse
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
