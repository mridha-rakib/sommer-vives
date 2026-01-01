import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Check, ArrowRight } from 'lucide-react';
import heroImage from '@/assets/hero-house.jpg';
import { SearchBar } from '@/components/search/SearchBar';
import { TrustBadges } from '@/components/ui/TrustBadges';

const benefits = [
  'Kun 15% i kommission',
  'Udlej på de største portaler',
  'Ingen binding og besvær',
];

export function HeroSection() {
  return (
    <section className="relative">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img
          src={heroImage}
          alt="Dansk sommerhus ved kysten"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-primary/80 via-primary/60 to-primary/90" />
      </div>

      {/* Main Content */}
      <div className="relative z-10 min-h-[85vh] flex flex-col justify-center">
        <div className="container mx-auto px-4 md:px-8 py-20">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="font-display text-4xl md:text-5xl lg:text-7xl font-bold text-primary-foreground mb-6 animate-fade-in-up">
              Håndplukkede sommerhuse
            </h1>
            
            <p className="text-lg md:text-xl text-primary-foreground/90 mb-10 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
              Oplev charmen ved Danmarks mest unikke feriesteder
            </p>

            {/* Search Bar - Landfolk style */}
            <div className="mb-12 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              <SearchBar variant="hero" />
            </div>
          </div>
        </div>

        {/* Trust Badges - Landfolk style */}
        <TrustBadges variant="dark" className="bg-primary/80 backdrop-blur-sm" />
      </div>

      {/* Owner CTA Section */}
      <div className="relative z-10 bg-card py-16">
        <div className="container mx-auto px-4 md:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="font-display text-2xl md:text-3xl font-bold text-primary mb-4">
              Ejer du et sommerhus?
            </h2>
            <p className="text-muted-foreground mb-6">
              Bliv en del af vores netværk og udlej dit sommerhus med kun 15% i kommission.
            </p>
            
            <ul className="flex flex-wrap justify-center gap-4 mb-8">
              {benefits.map((benefit, index) => (
                <li key={index} className="flex items-center gap-2">
                  <div className="flex-shrink-0 w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center">
                    <Check className="w-3 h-3 text-accent" />
                  </div>
                  <span className="text-primary font-medium text-sm">{benefit}</span>
                </li>
              ))}
            </ul>

            <Link to="/auth?mode=signup">
              <Button variant="gold" size="lg" className="px-8">
                Opret dit sommerhus
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
