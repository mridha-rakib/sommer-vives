import { PublicLayout } from '@/components/layout/PublicLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Gift, Users, Home, CheckCircle, ArrowRight } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

const steps = [
  {
    icon: Users,
    title: 'Inviter en sommerhusejer',
    description: 'Del dit unikke henvisningslink med venner, familie eller bekendte, der ejer et sommerhus.',
  },
  {
    icon: Home,
    title: 'De opretter sig og går live',
    description: 'Din henviste ejer opretter en profil, tilføjer deres sommerhus og går live på vores platform.',
  },
  {
    icon: Gift,
    title: 'I får begge 500 kr.',
    description: 'Når ejeren har sin første booking på mindst 5.000 kr., får I begge 500 kr. udbetalt.',
  },
];

const benefits = [
  'Ingen grænse for hvor mange du kan henvise',
  'Udbetaling sker automatisk efter kvalificeret booking',
  'Din ven får også 500 kr. – det er win-win',
  'Trackbar henvisning via dit personlige link',
];

export default function ReferAHost() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSubmitting(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast.success('Tak! Vi sender dig dit personlige henvisningslink.');
    setEmail('');
    setIsSubmitting(false);
  };

  return (
    <PublicLayout>
      {/* Hero Section */}
      <section className="pt-32 pb-16 md:pb-24 bg-gradient-to-b from-accent/10 to-background relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-20 left-10 w-72 h-72 bg-accent rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary rounded-full blur-3xl" />
        </div>
        
        <div className="container mx-auto px-4 md:px-8 relative">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-accent/20 text-accent px-4 py-2 rounded-full mb-6">
              <Gift className="h-5 w-5" />
              <span className="font-medium">Member Get Member</span>
            </div>
            
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-semibold text-primary mb-6">
              Tjen <span className="text-accent">500 kr.</span> for hver sommerhusejer du henviser
            </h1>
            
            <p className="text-xl text-muted-foreground leading-relaxed mb-10 max-w-2xl mx-auto">
              Kender du nogen med et sommerhus? Hjælp dem med at komme i gang hos Sommerdrøm – 
              og få 500 kr. når de får deres første booking.
            </p>

            {/* Email signup form */}
            <form onSubmit={handleSubmit} className="max-w-md mx-auto">
              <div className="flex gap-3">
                <Input
                  type="email"
                  placeholder="Din e-mail"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 h-12"
                  required
                />
                <Button 
                  type="submit" 
                  variant="gold" 
                  size="lg"
                  disabled={isSubmitting}
                  className="h-12 px-6"
                >
                  {isSubmitting ? 'Sender...' : 'Få mit link'}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container mx-auto px-4 md:px-8">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl md:text-4xl font-semibold text-primary mb-4">
              Sådan fungerer det
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Tre enkle trin til at tjene penge ved at hjælpe andre med sommerhusudlejning
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {steps.map((step, index) => (
              <div 
                key={step.title}
                className="relative text-center p-8 rounded-2xl bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 bg-accent text-primary rounded-full flex items-center justify-center font-bold text-sm">
                  {index + 1}
                </div>
                
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <step.icon className="h-8 w-8 text-accent" />
                </div>
                
                <h3 className="font-display text-xl font-semibold text-primary mb-3">
                  {step.title}
                </h3>
                
                <p className="text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 md:py-24 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 md:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="font-display text-3xl md:text-4xl font-semibold mb-6">
                  Hvorfor henvise til <span className="text-accent">Sommerdrøm</span>?
                </h2>
                <p className="text-primary-foreground/70 text-lg mb-8">
                  Vi tror på, at de bedste anbefalinger kommer fra tilfredse kunder. 
                  Derfor belønner vi dig, når du hjælper os med at vokse.
                </p>
                
                <ul className="space-y-4">
                  {benefits.map((benefit) => (
                    <li key={benefit} className="flex items-start gap-3">
                      <CheckCircle className="h-6 w-6 text-accent flex-shrink-0 mt-0.5" />
                      <span className="text-primary-foreground/90">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-primary-foreground/10 rounded-3xl p-8 md:p-12 text-center">
                <div className="text-6xl md:text-7xl font-display font-bold text-accent mb-4">
                  500 kr.
                </div>
                <p className="text-primary-foreground/70 text-lg mb-6">
                  For hver kvalificeret henvisning
                </p>
                <p className="text-sm text-primary-foreground/50">
                  Ingen øvre grænse – jo flere du henviser, jo mere tjener du
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Terms */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container mx-auto px-4 md:px-8">
          <div className="max-w-3xl mx-auto">
            <h2 className="font-display text-2xl md:text-3xl font-semibold text-primary mb-8 text-center">
              Betingelser for henvisningsprogrammet
            </h2>
            
            <div className="bg-background rounded-2xl p-8 shadow-sm">
              <ul className="space-y-4 text-muted-foreground">
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 bg-accent rounded-full mt-2 flex-shrink-0" />
                  <span>Den henviste ejer skal oprette sig via dit personlige link</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 bg-accent rounded-full mt-2 flex-shrink-0" />
                  <span>Sommerhuset skal godkendes og gå live på platformen</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 bg-accent rounded-full mt-2 flex-shrink-0" />
                  <span>Den første gennemførte booking skal være på minimum 5.000 kr.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 bg-accent rounded-full mt-2 flex-shrink-0" />
                  <span>Udbetaling sker inden for 14 dage efter bookingen er gennemført</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 bg-accent rounded-full mt-2 flex-shrink-0" />
                  <span>Du kan ikke henvise dig selv eller eksisterende Sommerdrøm-ejere</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container mx-auto px-4 md:px-8 text-center">
          <h2 className="font-display text-3xl md:text-4xl font-semibold text-primary mb-6">
            Klar til at tjene penge?
          </h2>
          <p className="text-muted-foreground text-lg mb-8 max-w-2xl mx-auto">
            Tilmeld dig i dag og få dit personlige henvisningslink. 
            Del det med alle, du kender – der er ingen grænse for, hvor meget du kan tjene.
          </p>
          
          <form onSubmit={handleSubmit} className="max-w-md mx-auto">
            <div className="flex gap-3">
              <Input
                type="email"
                placeholder="Din e-mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 h-12"
                required
              />
              <Button 
                type="submit" 
                variant="gold" 
                size="lg"
                disabled={isSubmitting}
                className="h-12 px-6"
              >
                {isSubmitting ? 'Sender...' : 'Start nu'}
              </Button>
            </div>
          </form>
        </div>
      </section>
    </PublicLayout>
  );
}
