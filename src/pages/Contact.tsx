import { PublicLayout } from '@/components/layout/PublicLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Mail, Phone, MapPin, Clock, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Contact() {
  return (
    <PublicLayout>
      <section className="pt-32 pb-16 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">Kontakt os</h1>
          <p className="text-lg text-primary-foreground/80 max-w-xl mx-auto">
            Har du spørgsmål om udlejning? Vi er klar til at hjælpe dig.
          </p>
        </div>
      </section>

      <section className="py-20 bg-background">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="grid md:grid-cols-5 gap-12">
            {/* Form */}
            <div className="md:col-span-3">
              <h2 className="font-display text-2xl font-semibold text-primary mb-6">Send os en besked</h2>
              <form className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Navn</Label>
                    <Input id="name" placeholder="Dit navn" className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="phone">Telefon</Label>
                    <Input id="phone" placeholder="+45 12 34 56 78" className="mt-1" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="din@email.dk" className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="subject">Emne</Label>
                  <Input id="subject" placeholder="Hvad handler det om?" className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="message">Besked</Label>
                  <Textarea id="message" placeholder="Fortæl os mere..." rows={5} className="mt-1" />
                </div>
                <Button variant="gold" className="w-full gap-2">
                  Send besked <ArrowRight className="w-4 h-4" />
                </Button>
              </form>
            </div>

            {/* Info */}
            <div className="md:col-span-2">
              <h2 className="font-display text-2xl font-semibold text-primary mb-6">Kontaktoplysninger</h2>
              <div className="space-y-6 mb-8">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                    <Mail className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <div className="font-medium text-primary">Email</div>
                    <a href="mailto:kontakt@sommervibes.dk" className="text-muted-foreground hover:text-accent transition-colors">
                      kontakt@sommervibes.dk
                    </a>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                    <Phone className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <div className="font-medium text-primary">Telefon</div>
                    <a href="tel:+4512345678" className="text-muted-foreground hover:text-accent transition-colors">
                      +45 12 34 56 78
                    </a>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <div className="font-medium text-primary">Adresse</div>
                    <div className="text-muted-foreground">København, Danmark</div>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                    <Clock className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <div className="font-medium text-primary">Svartid</div>
                    <div className="text-muted-foreground">Inden for 24 timer</div>
                  </div>
                </div>
              </div>

              <div className="bg-muted/30 rounded-xl p-6">
                <h3 className="font-display font-semibold text-primary mb-2">Vil du hellere udleje?</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Opret dit sommerhus og kom i gang med at tjene penge i dag.
                </p>
                <Link to="/kom-i-gang">
                  <Button variant="outline" size="sm" className="gap-2">
                    Kom i gang <ArrowRight className="w-3 h-3" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
