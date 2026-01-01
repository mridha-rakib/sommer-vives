import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Check, ArrowRight, Star, Shield, Heart, MessageCircle } from 'lucide-react';
import heroImage from '@/assets/hero-house.jpg';
import { SearchBar } from '@/components/search/SearchBar';

const benefits = [
  'Kun 15% i kommission',
  'Udlej på de største portaler',
  'Ingen binding og besvær',
];

const trustBadges = [
  { icon: Star, label: 'Fremragende', sublabel: '4.8 på Trustpilot' },
  { icon: Shield, label: 'Dansk virksomhed' },
  { icon: Check, label: 'Gratis afbestilling' },
  { icon: Heart, label: 'Ingen depositum' },
  { icon: MessageCircle, label: 'Dansk support' },
];

export function HeroSection() {
  return (
    <section className="relative">
      {/* Hero with Search */}
      <div className="relative min-h-[80vh] flex flex-col justify-center">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <img
            src={heroImage}
            alt="Dansk sommerhus ved kysten"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-primary/70 via-primary/50 to-primary/80" />
        </div>

        {/* Content */}
        <div className="relative z-10 container mx-auto px-4 md:px-8 py-20 flex-1 flex flex-col justify-center">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="font-display text-4xl md:text-5xl lg:text-7xl font-bold text-primary-foreground mb-6 animate-fade-in-up">
              Dit sommerhus,<br />vores passion
            </h1>
            
            <p className="text-lg md:text-xl text-primary-foreground/90 mb-10 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
              Fremtidens digitale sommerhusudlejning – uanset størrelse eller stil
            </p>

            {/* Search Bar */}
            <div className="mb-8 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              <SearchBar variant="hero" />
            </div>
          </div>
        </div>

        {/* Trust Badges - Integrated at bottom of hero */}
        <div className="relative z-10 bg-primary/90 backdrop-blur-sm py-4 border-t border-primary-foreground/10">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-center gap-4 md:gap-8 overflow-x-auto">
              {trustBadges.map((badge, index) => (
                <div
                  key={index}
                  className={`flex items-center gap-2 whitespace-nowrap ${
                    index > 0 ? 'border-l border-primary-foreground/20 pl-4 md:pl-8' : ''
                  }`}
                >
                  <badge.icon className="w-4 h-4 text-primary-foreground" />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-primary-foreground">{badge.label}</span>
                    {badge.sublabel && (
                      <span className="text-xs text-primary-foreground/70">{badge.sublabel}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Owner CTA Section */}
      <div className="bg-card py-16">
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

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/kom-i-gang">
                <Button variant="gold" size="lg" className="px-8">
                  Kom i gang nu
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Link to="/beregn-lejeindtaegt">
                <Button variant="outline" size="lg" className="border-accent text-accent hover:bg-accent/10">
                  Se din potentielle indtjening
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
