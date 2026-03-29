import { Star, Quote } from 'lucide-react';

const testimonials = [
  {
    name: 'Mette & Lars Sørensen',
    location: 'Blåvand',
    quote: 'Vi har aldrig haft så mange bookinger som nu. Den personlige kontakt og lave kommission er guld værd. SommerVibes forstår virkelig sommerhusudlejning.',
    rating: 5,
  },
  {
    name: 'Thomas Nielsen',
    location: 'Nordjylland',
    quote: 'Endelig et bureau der lytter og ikke bare ser os som endnu et nummer. Pengene kommer hurtigt, og supporten er fantastisk.',
    rating: 5,
  },
  {
    name: 'Camilla Madsen',
    location: 'Bornholm',
    quote: 'Fra oprettelse til første booking gik der kun 2 uger. Den professionelle fotopakke gjorde virkelig en forskel for vores bookinger.',
    rating: 5,
  },
];

export function TestimonialsSection() {
  return (
    <section className="py-20 md:py-28 bg-muted/30">
      <div className="container mx-auto px-4 md:px-8">
        <div className="text-center mb-16">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-primary mb-4">
            Hvad vores ejere siger
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {testimonials.map((t, i) => (
            <div
              key={i}
              className="bg-background rounded-2xl p-8 border border-border relative"
            >
              <Quote className="absolute top-6 right-6 w-8 h-8 text-accent/20" />
              <div className="flex gap-1 mb-4">
                {Array.from({ length: t.rating }).map((_, j) => (
                  <Star key={j} className="w-4 h-4 text-accent fill-accent" />
                ))}
              </div>
              <p className="text-muted-foreground leading-relaxed mb-6">"{t.quote}"</p>
              <div>
                <p className="font-semibold text-primary">{t.name}</p>
                <p className="text-sm text-muted-foreground">{t.location}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
