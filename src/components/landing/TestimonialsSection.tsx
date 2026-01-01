import { Star, Quote } from 'lucide-react';

interface Testimonial {
  name: string;
  location: string;
  quote: string;
  rating: number;
  type: 'owner' | 'guest';
}

const testimonials: Testimonial[] = [
  {
    name: 'Mette & Lars Sørensen',
    location: 'Blåvand',
    quote: 'Vi har aldrig haft så mange bookinger som nu. Emil og Erik har virkelig forstået at markedsføre vores hus på den rigtige måde. Den personlige kontakt er guld værd.',
    rating: 5,
    type: 'owner',
  },
  {
    name: 'Thomas Nielsen',
    location: 'Nordjylland',
    quote: 'Endelig et bureau der lytter og ikke bare ser os som endnu et nummer. Pengene kommer hurtigt, og supporten er fantastisk.',
    rating: 5,
    type: 'owner',
  },
  {
    name: 'Camilla Madsen',
    location: 'Bornholm',
    quote: 'Fra oprettelse til første booking gik der kun 2 uger. Den professionelle fotopakke gjorde virkelig en forskel for vores bookinger.',
    rating: 5,
    type: 'owner',
  },
];

export function TestimonialsSection() {
  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4 md:px-8">
        <div className="text-center mb-16">
          <span className="text-accent font-medium text-sm uppercase tracking-wide">Fra vores ejere</span>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-primary mt-2 mb-4">
            Hvad vores ejere siger
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Over 150+ sommerhusejere har allerede valgt Sommerdrøm som deres partner
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="bg-background rounded-2xl p-8 shadow-soft border border-border/50 relative"
            >
              <Quote className="absolute top-6 right-6 w-8 h-8 text-accent/20" />
              
              <div className="flex gap-1 mb-4">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-accent fill-accent" />
                ))}
              </div>
              
              <p className="text-muted-foreground leading-relaxed mb-6">
                "{testimonial.quote}"
              </p>
              
              <div>
                <p className="font-semibold text-primary">{testimonial.name}</p>
                <p className="text-sm text-muted-foreground">{testimonial.location}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
