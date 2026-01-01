import { PublicLayout } from '@/components/layout/PublicLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Mail, Phone, MapPin } from 'lucide-react';

export default function Contact() {
  return (
    <PublicLayout>
      <section className="section-padding bg-primary">
        <div className="container mx-auto text-center">
          <h1 className="font-display text-4xl md:text-5xl font-bold text-primary-foreground mb-4">
            Kontakt os
          </h1>
          <p className="text-lg text-primary-foreground/80">
            Har du spørgsmål? Vi er klar til at hjælpe dig.
          </p>
        </div>
      </section>

      <section className="section-padding bg-background">
        <div className="container mx-auto max-w-4xl">
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <h2 className="font-display text-2xl font-semibold text-primary mb-6">Send os en besked</h2>
              <form className="space-y-4">
                <div>
                  <Label htmlFor="name">Navn</Label>
                  <Input id="name" placeholder="Dit navn" className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="din@email.dk" className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="message">Besked</Label>
                  <Textarea id="message" placeholder="Din besked..." rows={5} className="mt-1" />
                </div>
                <Button variant="gold" className="w-full">Send besked</Button>
              </form>
            </div>

            <div>
              <h2 className="font-display text-2xl font-semibold text-primary mb-6">Kontaktoplysninger</h2>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <Mail className="w-6 h-6 text-accent mt-1" />
                  <div>
                    <div className="font-medium text-primary">Email</div>
                    <div className="text-muted-foreground">kontakt@sommerhusbureau.dk</div>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <Phone className="w-6 h-6 text-accent mt-1" />
                  <div>
                    <div className="font-medium text-primary">Telefon</div>
                    <div className="text-muted-foreground">+45 12 34 56 78</div>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <MapPin className="w-6 h-6 text-accent mt-1" />
                  <div>
                    <div className="font-medium text-primary">Adresse</div>
                    <div className="text-muted-foreground">København, Danmark</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
