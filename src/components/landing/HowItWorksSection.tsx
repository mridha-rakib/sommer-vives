import { Home, Camera, Globe, Wallet, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const steps = [
  {
    icon: Home,
    title: 'Opret dit hus',
    description: 'Fortæl os om dit sommerhus. Det tager kun 5 minutter at komme i gang.',
    number: '01',
  },
  {
    icon: Camera,
    title: 'Vi fotograferer',
    description: 'Vores team besøger dit hus og skaber professionelt indhold der sælger.',
    number: '02',
  },
  {
    icon: Globe,
    title: 'Vi markedsfører',
    description: 'Dit hus vises på de største udlejningsportaler og vores egne kanaler.',
    number: '03',
  },
  {
    icon: Wallet,
    title: 'Du tjener',
    description: 'Bookinger ruller ind, og du får udbetalt hurtigt og gennemsigtigt.',
    number: '04',
  },
];

export function HowItWorksSection() {
  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4 md:px-8">
        <div className="text-center mb-16">
          <span className="text-accent font-medium text-sm uppercase tracking-wide">Så nemt er det</span>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-primary mt-2 mb-4">
            Fra oprettelse til indtjening
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Vi har gjort det så enkelt som muligt at udleje dit sommerhus professionelt
          </p>
        </div>

        <div className="grid md:grid-cols-4 gap-8 max-w-6xl mx-auto mb-12">
          {steps.map((step, index) => (
            <div key={index} className="relative text-center group">
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-12 left-[60%] w-[80%] h-px bg-border" />
              )}
              
              <div className="relative z-10">
                <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                  <step.icon className="w-10 h-10 text-accent" />
                </div>
                <span className="text-xs font-bold text-accent/60 uppercase tracking-widest">{step.number}</span>
                <h3 className="font-display text-lg font-semibold text-primary mt-1 mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center">
          <Link to="/auth?mode=signup">
            <Button variant="gold" size="lg" className="gap-2">
              Start din rejse
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
