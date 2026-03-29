import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Calculator } from 'lucide-react';

export function CTASection() {
  return (
    <section className="section-padding bg-primary">
      <div className="container mx-auto text-center">
        <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-primary-foreground mb-6">
          Klar til at udleje dit sommerhus?
        </h2>
        <p className="text-lg md:text-xl text-primary-foreground/80 mb-10 max-w-2xl mx-auto">
          Kom i gang i dag og lad os tage os af resten – fra markedsføring til gæstekontakt.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link to="/kom-i-gang">
            <Button variant="hero" size="xl">
              Opret dit sommerhus gratis
              <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
          <Link to="/beregn-lejeindtaegt">
            <Button variant="outline" size="xl" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">
              <Calculator className="w-5 h-5" />
              Beregn din indtægt
            </Button>
          </Link>
        </div>
        <p className="mt-6 text-sm text-primary-foreground/60">
          Ingen binding • Ingen oprettelsesgebyr • Kun 15% kommission
        </p>
      </div>
    </section>
  );
}
