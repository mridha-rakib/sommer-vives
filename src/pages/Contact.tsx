import { PublicLayout } from '@/components/layout/PublicLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Mail, Phone, MapPin, Clock, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useScrollReveal } from '@/hooks/useScrollReveal';

function ContactContent() {
  const { ref, isInView } = useScrollReveal();

  return (
    <section ref={ref} className="py-24 md:py-32 bg-background">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="grid md:grid-cols-5 gap-12">
          {/* Form */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7 }}
            className="md:col-span-3"
          >
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
              <Button variant="gold" className="w-full gap-2 group">
                Send besked <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </form>
          </motion.div>

          {/* Info */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="md:col-span-2"
          >
            <h2 className="font-display text-2xl font-semibold text-primary mb-6">Kontaktoplysninger</h2>
            <div className="space-y-6 mb-8">
              {[
                { icon: Mail, title: 'Email', detail: 'kontakt@sommervibes.dk', href: 'mailto:kontakt@sommervibes.dk' },
                { icon: Phone, title: 'Telefon', detail: '+45 12 34 56 78', href: 'tel:+4512345678' },
                { icon: MapPin, title: 'Adresse', detail: 'København, Danmark' },
                { icon: Clock, title: 'Åbningstider', detail: 'Tlf. man–tor 10–16 (fre lukket) · Chat hverdage 10–22, weekend 10–16 · Kontor i Vejen efter aftale' },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 15 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.4, delay: 0.3 + i * 0.1 }}
                  className="flex items-start gap-4 group"
                >
                  <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0 group-hover:bg-accent/20 transition-colors">
                    <item.icon className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <div className="font-medium text-primary">{item.title}</div>
                    {item.href ? (
                      <a href={item.href} className="text-muted-foreground hover:text-accent transition-colors">{item.detail}</a>
                    ) : (
                      <div className="text-muted-foreground">{item.detail}</div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.7 }}
              className="bg-card border border-border rounded-xl p-6 text-foreground"
            >
              <h3 className="font-display font-semibold mb-2">Vil du hellere udleje?</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Opret dit sommerhus og kom i gang med at tjene penge i dag.
              </p>
              <Link to="/kom-i-gang">
                <Button variant="gold" size="sm" className="gap-2 group">
                  Kom i gang <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

export default function Contact() {
  return (
    <PublicLayout>
      <section className="pt-32 pb-16 bg-background text-foreground overflow-hidden">
        <div className="container mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <span className="text-accent font-body text-sm font-semibold tracking-[0.3em] uppercase block mb-6">Kontakt</span>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="font-display text-4xl md:text-5xl font-bold mb-4"
          >
            Vi er klar til
            <span className="block text-accent italic font-normal">at hjælpe dig</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-lg text-muted-foreground max-w-xl mx-auto"
          >
            Har du spørgsmål om udlejning? Vi er klar til at hjælpe dig.
          </motion.p>
        </div>
      </section>
      <ContactContent />
    </PublicLayout>
  );
}
