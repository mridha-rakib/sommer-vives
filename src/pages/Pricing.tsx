import { PublicLayout } from '@/components/layout/PublicLayout';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Check, ArrowRight } from 'lucide-react';

const features = [
  'Annoncering på de største portaler',
  'Professionel rengøring inkluderet',
  'Fuld lejerdialog og support',
  'Ingen binding eller oprettelsesgebyr',
  'Lokale servicepartnere',
  'Personlig ejerportal',
];

export default function Pricing() {
  return (
    <PublicLayout>
      <section className="section-padding bg-primary">
        <div className="container mx-auto text-center">
          <h1 className="font-display text-4xl md:text-5xl font-bold text-primary-foreground mb-4">
            Enkel og gennemsigtig prissætning
          </h1>
          <p className="text-lg text-primary-foreground/80 max-w-2xl mx-auto">
            Ingen skjulte gebyrer. Kun 20% kommission af gennemførte lejeaftaler.
          </p>
        </div>
      </section>

      <section className="section-padding bg-background">
        <div className="container mx-auto max-w-lg">
          <div className="bg-card border-2 border-accent rounded-2xl p-8 md:p-12 text-center shadow-elevated">
            <div className="text-accent text-sm font-semibold uppercase tracking-wider mb-2">
              Vores kommission
            </div>
            <div className="font-display text-6xl md:text-7xl font-bold text-primary mb-2">
              20<span className="text-4xl">%</span>
            </div>
            <p className="text-muted-foreground mb-8">af gennemførte lejeaftaler</p>

            <ul className="space-y-3 text-left mb-8">
              {features.map((feature, index) => (
                <li key={index} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center">
                    <Check className="w-3 h-3 text-accent" />
                  </div>
                  <span className="text-primary">{feature}</span>
                </li>
              ))}
            </ul>

            <Link to="/auth?mode=signup">
              <Button variant="hero" size="xl" className="w-full">
                Opret dit sommerhus <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
