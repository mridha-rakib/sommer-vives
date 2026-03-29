import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Check, ArrowRight, Star, Shield, Heart, TrendingUp, Users, Camera } from 'lucide-react';

const benefits = [
  { icon: TrendingUp, text: 'Kun 15% kommission' },
  { icon: Users, text: 'Personlig kontaktperson' },
  { icon: Camera, text: 'Gratis professionel foto' },
  { icon: Shield, text: 'Ingen binding' },
];

const stats = [
  { value: '15%', label: 'Laveste kommission' },
  { value: '5 min', label: 'At komme i gang' },
  { value: '100%', label: 'Dansk support' },
];

export function HeroSection() {
  return (
    <section className="relative min-h-[100vh] flex flex-col">
      {/* Video Background */}
      <div className="absolute inset-0 z-0">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover"
          poster=""
        >
          <source src="/videos/hero.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-primary/80 via-primary/60 to-primary/90" />
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex-1 flex items-center">
        <div className="container mx-auto px-4 md:px-8 py-20">
          <div className="max-w-3xl">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-accent/20 backdrop-blur-sm border border-accent/30 rounded-full px-4 py-2 mb-8 animate-fade-in">
              <Star className="w-4 h-4 text-accent" />
              <span className="text-sm font-medium text-accent">Danmarks mest fleksible udlejningsbureau</span>
            </div>

            <h1 className="font-display text-4xl md:text-5xl lg:text-7xl font-bold text-primary-foreground mb-6 animate-fade-in-up leading-tight">
              Udlej dit sommerhus
              <span className="block text-gradient-gold">— uden besvær</span>
            </h1>

            <p className="text-lg md:text-xl text-primary-foreground/85 mb-10 max-w-xl animate-fade-in-up leading-relaxed" style={{ animationDelay: '0.1s' }}>
              Vi håndterer alt fra markedsføring til gæstekontakt. 
              Du læner dig tilbage og tjener penge på dit feriehus.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mb-12 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              <Link to="/kom-i-gang">
                <Button variant="gold" size="xl" className="gap-2 text-base">
                  Kom i gang gratis
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
              <Link to="/beregn-lejeindtaegt">
                <Button variant="outline" size="xl" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 text-base">
                  Se din potentielle indtjening
                </Button>
              </Link>
            </div>

            {/* Benefits Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
              {benefits.map((benefit, i) => (
                <div key={i} className="flex items-center gap-2 text-primary-foreground/80">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
                    <benefit.icon className="w-4 h-4 text-accent" />
                  </div>
                  <span className="text-sm font-medium">{benefit.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="relative z-10 bg-primary/95 backdrop-blur-sm border-t border-accent/20">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-center gap-8 md:gap-16">
            {stats.map((stat, i) => (
              <div key={i} className={`text-center ${i > 0 ? 'border-l border-primary-foreground/15 pl-8 md:pl-16' : ''}`}>
                <div className="font-display text-2xl md:text-3xl font-bold text-accent">{stat.value}</div>
                <div className="text-xs md:text-sm text-primary-foreground/60 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
