import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

export function ContactExpertsSection() {
  return (
    <section className="py-20 md:py-28 bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 md:px-8 text-center max-w-3xl">
        <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
          Kom i kontakt med vores eksperter
        </h2>
        <p className="text-lg text-primary-foreground/80 leading-relaxed mb-10">
          Kontakt vores værtseksperter for at lære mere om fordelene ved at leje ud
          gennem SommerVibes, eller få vejledning i at sætte den rigtige pris,
          rengøring og meget mere.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link to="/kom-i-gang">
            <Button variant="hero" size="xl" className="gap-2">
              Ansøg nu
              <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
          <a href="tel:+4512345678">
            <Button
              variant="outline"
              size="xl"
              className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"
            >
              Ring til os: +45 12 34 56 78
            </Button>
          </a>
        </div>
      </div>
    </section>
  );
}
