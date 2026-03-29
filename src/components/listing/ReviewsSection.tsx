import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, ChevronLeft, ChevronRight } from 'lucide-react';

interface Review {
  id: string;
  name: string;
  location?: string;
  text: string;
  rating: number;
  date: string;
}

// Hardcoded sample reviews - will be replaced by DB data
const sampleReviews: Review[] = [
  { id: '1', name: 'Maria Jensen', location: 'København', text: 'Fantastisk sommerhus med en skøn beliggenhed. Vi nød hver eneste dag af vores ferie. Alt var perfekt indrettet og rent.', rating: 5, date: '2025-08' },
  { id: '2', name: 'Thomas Andersen', location: 'Aarhus', text: 'Rigtig godt sommerhus til familieferier. Børnene elskede det, og vi voksne kunne slappe af i de smukke omgivelser.', rating: 5, date: '2025-07' },
  { id: '3', name: 'Sophie Larsen', location: 'Odense', text: 'Professonel service fra SommerVibes. Nemt at booke, alt var klar ved ankomst, og huset var præcis som beskrevet.', rating: 5, date: '2025-06' },
  { id: '4', name: 'Lars Petersen', location: 'Aalborg', text: 'Vores tredje booking via SommerVibes – de skuffer aldrig! Altid høj kvalitet og god kommunikation.', rating: 5, date: '2025-09' },
];

const ReviewCard = ({ review, index }: { review: Review; index: number }) => {
  const dateLabel = new Date(review.date + '-01').toLocaleDateString('da-DK', {
    year: 'numeric',
    month: 'short',
  });

  return (
    <motion.blockquote
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ delay: index * 0.04, duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
      className="relative flex flex-col"
    >
      <span className="font-display text-5xl leading-none text-primary/20 select-none mb-2">"</span>
      <p className="text-sm text-foreground/85 leading-relaxed font-light -mt-6 pl-4">
        {review.text}
      </p>
      <footer className="mt-4 pl-4 flex items-center gap-3">
        <div className="w-6 h-px bg-gradient-to-r from-primary/30 to-transparent shrink-0" />
        <cite className="not-italic text-xs tracking-wide uppercase text-muted-foreground">
          {review.name}
          {review.location && <span className="normal-case tracking-normal"> · {review.location}</span>}
        </cite>
        <span className="text-[10px] text-muted-foreground/60 ml-auto">{dateLabel}</span>
      </footer>
    </motion.blockquote>
  );
};

const FeaturedCarousel = ({ reviews }: { reviews: Review[] }) => {
  const [active, setActive] = useState(0);
  const next = useCallback(() => setActive(i => (i + 1) % reviews.length), [reviews.length]);
  const prev = useCallback(() => setActive(i => (i - 1 + reviews.length) % reviews.length), [reviews.length]);

  useEffect(() => {
    const timer = setInterval(next, 8000);
    return () => clearInterval(timer);
  }, [next]);

  const review = reviews[active];
  const dateLabel = new Date(review.date + '-01').toLocaleDateString('da-DK', { year: 'numeric', month: 'short' });

  return (
    <div className="text-center max-w-3xl mx-auto py-8 relative">
      <button onClick={prev} className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 md:-translate-x-16 w-10 h-10 rounded-full border border-border/30 flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/40 transition-colors" aria-label="Forrige">
        <ChevronLeft className="h-4 w-4" />
      </button>
      <button onClick={next} className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 md:translate-x-16 w-10 h-10 rounded-full border border-border/30 flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/40 transition-colors" aria-label="Næste">
        <ChevronRight className="h-4 w-4" />
      </button>

      <AnimatePresence mode="wait">
        <motion.blockquote
          key={active}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
        >
          <span className="font-display text-6xl leading-none text-primary/25 select-none block mb-1">"</span>
          <p className="font-display text-lg md:text-xl text-foreground/90 leading-relaxed italic -mt-4 px-4">
            {review.text}
          </p>
          <footer className="mt-6 flex items-center justify-center gap-3">
            <div className="w-8 h-px bg-gradient-to-r from-primary/30 to-transparent" />
            <cite className="not-italic text-xs tracking-widest uppercase text-muted-foreground">
              {review.name}{review.location ? ` · ${review.location}` : ''}
            </cite>
            <div className="w-8 h-px bg-gradient-to-l from-primary/30 to-transparent" />
          </footer>
          <span className="text-[10px] text-muted-foreground/50 mt-2 block">{dateLabel}</span>
        </motion.blockquote>
      </AnimatePresence>

      <div className="flex items-center justify-center gap-2 mt-6">
        {reviews.map((_, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            className={`h-1.5 rounded-full transition-all duration-300 ${i === active ? 'bg-primary w-4' : 'bg-muted-foreground/30 w-1.5 hover:bg-muted-foreground/50'}`}
            aria-label={`Anmeldelse ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export const ReviewsSection = ({
  variant = 'featured',
}: {
  variant?: 'full' | 'featured' | 'compact';
}) => {
  const reviews = sampleReviews;

  return (
    <section className="py-8 lg:py-12">
      <div className="container mx-auto px-4 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <span className="text-primary font-display italic text-sm mb-2 block">— Anmeldelser</span>
          <h2 className="font-display text-3xl lg:text-4xl font-semibold text-foreground mb-4">
            Hvad vores gæster siger
          </h2>
          <div className="flex items-center justify-center gap-5 mt-4">
            <div className="flex items-center gap-1.5">
              <Star className="h-4 w-4 text-primary fill-primary" />
              <span className="font-display text-xl font-semibold text-foreground">4.96</span>
              <span className="text-sm text-muted-foreground">/ 5</span>
            </div>
            <span className="w-px h-5 bg-border" />
            <span className="text-sm text-muted-foreground">{reviews.length} anmeldelser</span>
          </div>
        </motion.div>

        {variant === 'featured' ? (
          <FeaturedCarousel reviews={reviews} />
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-12">
            {reviews.map((r, i) => (
              <ReviewCard key={r.id} review={r} index={i} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default ReviewsSection;
