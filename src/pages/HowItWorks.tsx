import { PublicLayout } from '@/components/layout/PublicLayout';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { ClipboardList, Camera, Home, Calendar, Banknote, ArrowRight, Check, Star, Shield, Zap, Users } from 'lucide-react';
import heroHouse from '@/assets/hero-house.jpg';

const steps = [
  { number: '01', icon: ClipboardList, title: 'Opret dit sommerhus', description: 'Udfyld vores simple formular med info om dit sommerhus. Det tager kun 5 minutter.' },
  { number: '02', icon: Camera, title: 'Vi fotograferer', description: 'Vi vejleder dig i at tage gode billeder og hjælper med redigering. Du kan også bestille professionel fotografering.' },
  { number: '03', icon: Home, title: 'Vi markedsfører', description: 'Dit sommerhus publiceres på de største portaler og markedsføres via sociale medier og nyhedsbreve.' },
  { number: '04', icon: Calendar, title: 'Vi håndterer alt', description: 'Booking, gæstekommunikation, rengøring og nøgleoverdragelse. Du skal bare læne dig tilbage.' },
  { number: '05', icon: Banknote, title: 'Du tjener penge', description: 'Efter hver udlejning får du udbetalt direkte til din konto. Fuldstændig gennemsigtigt.' },
];

const benefits = [
  { icon: Star, title: 'Personlig rådgiver', desc: 'Din egen kontaktperson' },
  { icon: Shield, title: 'Ingen binding', desc: 'Opsig når som helst' },
  { icon: Zap, title: 'Hurtig opstart', desc: '1-2 uger til første booking' },
  { icon: Users, title: 'Dansk support', desc: '100% dansk team' },
];

export default function HowItWorks() {
  return (
    <PublicLayout>
      {/* Hero */}
      <section className="relative pt-32 pb-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 md:px-8 text-center relative z-10">
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            Fra oprettelse til<br />
            <span className="text-accent">indtjening på få dage</span>
          </h1>
          <p className="text-lg text-primary-foreground/80 max-w-2xl mx-auto mb-10">
            Vi har gjort det så enkelt som muligt at udleje dit sommerhus professionelt.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/kom-i-gang">
              <Button variant="gold" size="lg" className="gap-2">
                Kom i gang nu <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link to="/beregn-lejeindtaegt">
              <Button variant="outline" size="lg" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">
                Se din potentielle indtjening
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Benefits bar */}
      <section className="py-8 bg-muted/50 border-y border-border">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-8 md:gap-16">
            {benefits.map((b, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                  <b.icon className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <div className="font-medium text-primary text-sm">{b.title}</div>
                  <div className="text-xs text-muted-foreground">{b.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Steps */}
      <section className="py-20 md:py-28 bg-background">
        <div className="container mx-auto px-4 md:px-8">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-primary mb-4">5 simple trin</h2>
          </div>
          <div className="max-w-4xl mx-auto">
            {steps.map((step, i) => (
              <div key={i} className="flex gap-6 md:gap-10 items-start mb-12 last:mb-0">
                <div className="flex-shrink-0 relative">
                  <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-accent/10 flex items-center justify-center">
                    <step.icon className="w-8 h-8 md:w-10 md:h-10 text-accent" />
                  </div>
                  <span className="absolute -top-2 -left-2 w-8 h-8 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                    {step.number}
                  </span>
                  {i < steps.length - 1 && (
                    <div className="absolute left-1/2 top-full w-0.5 h-12 bg-border -translate-x-1/2" />
                  )}
                </div>
                <div className="pt-2">
                  <h3 className="font-display text-xl md:text-2xl font-semibold text-primary mb-2">{step.title}</h3>
                  <p className="text-muted-foreground md:text-lg">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-16">
            <Link to="/kom-i-gang">
              <Button variant="gold" size="lg" className="gap-2">
                Start din rejse nu <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Why SommerVibes */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4 md:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center max-w-6xl mx-auto">
            <div className="relative">
              <div className="rounded-2xl overflow-hidden shadow-2xl">
                <img src={heroHouse} alt="Sommerhus" className="w-full h-[400px] object-cover" loading="lazy" />
              </div>
              <div className="absolute -bottom-6 -right-6 bg-accent text-primary px-8 py-4 rounded-xl shadow-lg">
                <span className="font-display font-bold text-2xl">15%</span>
                <span className="block text-sm">kommission</span>
              </div>
            </div>
            <div>
              <h2 className="font-display text-3xl md:text-4xl font-semibold text-primary mb-6">
                Hvorfor vælge<br /><span className="text-accent">SommerVibes?</span>
              </h2>
              <div className="space-y-4 mb-8">
                {[
                  'Kun 15% i kommission – langt under markedet',
                  'Personlig rådgiver der kender dit hus',
                  'Annoncering på alle de store portaler',
                  'Professionel foto inkluderet',
                  'Fuld gennemsigtighed og ingen binding',
                  'Adgang til bundfradrag på 50.200 kr.',
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
                      <Check className="w-4 h-4 text-primary" />
                    </div>
                    <span className="text-muted-foreground">{item}</span>
                  </div>
                ))}
              </div>
              <Link to="/team">
                <Button variant="outline" className="gap-2">
                  Mød teamet bag <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 md:px-8 text-center">
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-6">Klar til at komme i gang?</h2>
          <p className="text-primary-foreground/70 text-lg mb-10 max-w-2xl mx-auto">
            Det tager kun 5 minutter at oprette dit sommerhus.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/kom-i-gang">
              <Button variant="gold" size="lg" className="gap-2">
                Opret dit sommerhus <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link to="/beregn-lejeindtaegt">
              <Button variant="outline" size="lg" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">
                Beregn din indtjening
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
