import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Calculator } from 'lucide-react';

export function CTASection() {
  return (
    <section className="section-padding bg-background">
      <div className="container mx-auto text-center">
        <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6">
          Dit hus fortjener et bedre samarbejde
        </h2>
        <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
          Vi tager os af det praktiske — du beholder overblikket og indtægten.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link to="/kom-i-gang">
            <Button size="xl" variant="gold" className="text-lg px-8 py-6">
              Opret dit sommerhus gratis
              <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
          <Link to="/beregn-lejeindtaegt">
            <Button variant="outline" size="xl" className="border-accent/40 text-accent hover:bg-accent/10">
              <Calculator className="w-5 h-5" />
              Beregn din indtægt
            </Button>
          </Link>
        </div>
        <p className="mt-6 text-sm text-muted-foreground">
          6 måneders binding • Ingen oprettelsesgebyr • Kun 15% kommission
        </p>
      </div>
    </section>
  );
}
