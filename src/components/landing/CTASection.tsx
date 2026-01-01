import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

export function CTASection() {
  return (
    <section className="section-padding bg-primary">
      <div className="container mx-auto text-center">
        <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-primary-foreground mb-6">
          Klar til at komme i gang?
        </h2>
        <p className="text-lg md:text-xl text-primary-foreground/80 mb-10 max-w-2xl mx-auto">
          Opret dit sommerhus i dag og begynd at tjene penge på din feriebolig – uden besvær.
        </p>
        <Link to="/auth?mode=signup">
          <Button variant="hero" size="xl">
            Opret dit sommerhus gratis
            <ArrowRight className="w-5 h-5" />
          </Button>
        </Link>
        <p className="mt-6 text-sm text-primary-foreground/60">
          Ingen binding • Ingen oprettelsesgebyr • Kun 15% kommission
        </p>
      </div>
    </section>
  );
}
