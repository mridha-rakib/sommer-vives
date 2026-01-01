import { PublicLayout } from '@/components/layout/PublicLayout';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { ClipboardList, Home, Calendar, Banknote, ArrowRight } from 'lucide-react';

const steps = [
  { icon: ClipboardList, title: '1. Opret dit sommerhus', description: 'Udfyld en simpel formular med information om dit sommerhus, upload billeder og sæt dine priser.' },
  { icon: Home, title: '2. Vi annoncerer', description: 'Vi opretter professionelle annoncer på de største udlejningsportaler for maksimal synlighed.' },
  { icon: Calendar, title: '3. Vi håndterer bookinger', description: 'Vi tager os af al kommunikation med lejere, booking og koordinering af rengøring.' },
  { icon: Banknote, title: '4. Du modtager udbetaling', description: 'Efter hver lejeperiode modtager du din andel direkte på din konto.' },
];

export default function HowItWorks() {
  return (
    <PublicLayout>
      <section className="section-padding bg-primary">
        <div className="container mx-auto text-center">
          <h1 className="font-display text-4xl md:text-5xl font-bold text-primary-foreground mb-4">
            Sådan virker det
          </h1>
          <p className="text-lg text-primary-foreground/80 max-w-2xl mx-auto">
            Fra oprettelse til udbetaling – vi gør det nemt at udleje dit sommerhus.
          </p>
        </div>
      </section>

      <section className="section-padding bg-background">
        <div className="container mx-auto max-w-4xl">
          <div className="space-y-12">
            {steps.map((step, index) => (
              <div key={index} className="flex gap-6 items-start">
                <div className="flex-shrink-0 w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center">
                  <step.icon className="w-8 h-8 text-accent" />
                </div>
                <div>
                  <h3 className="font-display text-2xl font-semibold text-primary mb-2">{step.title}</h3>
                  <p className="text-muted-foreground text-lg">{step.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-16 text-center">
            <Link to="/auth?mode=signup">
              <Button variant="hero" size="xl">
                Kom i gang nu <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
