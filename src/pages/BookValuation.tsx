import { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { SocialProofSection } from '@/components/landing/SocialProofSection';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { MapPin, CalendarDays, Phone, Mail, CheckCircle2, ArrowRight, Clock, Shield, Star, Home } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';

const regions = [
  { name: 'Nordsjælland', desc: 'Gilleleje, Tisvildeleje, Hornbæk' },
  { name: 'Vestsjælland', desc: 'Odsherred, Rørvig, Nykøbing Sj.' },
  { name: 'Sydsjælland & Møn', desc: 'Vordingborg, Præstø, Stege' },
  { name: 'Fyn & Øerne', desc: 'Kerteminde, Svendborg, Langeland' },
  { name: 'Østjylland', desc: 'Djursland, Ebeltoft, Grenaa' },
  { name: 'Vestjylland', desc: 'Ringkøbing, Hvide Sande, Søndervig' },
  { name: 'Nordjylland', desc: 'Blokhus, Løkken, Skagen' },
  { name: 'Sønderjylland', desc: 'Als, Aabenraa, Rømø' },
  { name: 'Bornholm', desc: 'Dueodde, Gudhjem, Allinge' },
];

const benefits = [
  { icon: Shield, title: '100% gratis & uforpligtende', desc: 'Ingen skjulte gebyrer eller bindinger' },
  { icon: Home, title: 'Vi kører ud til dig', desc: 'Professionelt udlejningstjek på stedet' },
  { icon: Star, title: 'Individuel prisanalyse', desc: 'Baseret på lokale markedsdata' },
  { icon: Clock, title: 'Svar inden 24 timer', desc: 'Vi kontakter dig hurtigt' },
];

const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.1 } } };
const fadeUp = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6 } } };

export default function BookValuation() {
  const [date, setDate] = useState<Date | undefined>();
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '', region: '', propertyType: '', message: '' });

  const { ref: heroRef, isInView: heroInView } = useScrollReveal();
  const { ref: formRef, isInView: formInView } = useScrollReveal();
  const { ref: mapRef, isInView: mapInView } = useScrollReveal();

  const handleChange = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.phone || !form.address || !form.region) {
      toast.error('Udfyld venligst alle påkrævede felter');
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.from('inquiries').insert({
        guest_name: form.name,
        guest_email: form.email,
        guest_phone: form.phone,
        property_id: '00000000-0000-0000-0000-000000000000',
        check_in: date ? format(date, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
        check_out: date ? format(date, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
        message: `Udlejningstjek - ${form.region} - ${form.address}\nBoligtype: ${form.propertyType}\n${form.message}`,
        status: 'new',
      });
      if (error) throw error;
      setSubmitted(true);
      toast.success('Din anmodning er modtaget! Vi kontakter dig inden 24 timer.');
    } catch {
      toast.error('Noget gik galt. Prøv igen eller ring til os.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <PublicLayout>
        <section className="min-h-[80vh] flex items-center justify-center bg-background">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-lg mx-auto px-6"
          >
            <div className="w-20 h-20 rounded-full bg-accent/15 flex items-center justify-center mx-auto mb-8">
              <CheckCircle2 className="w-10 h-10 text-accent" />
            </div>
            <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">Tak for din henvendelse!</h1>
            <p className="text-muted-foreground text-lg mb-8">Vi kontakter dig inden 24 timer for at aftale en tid til dit gratis udlejningstjek.</p>
            <Button variant="gold" size="xl" onClick={() => setSubmitted(false)} className="gap-2">
              Book endnu et udlejningstjek <ArrowRight className="w-4 h-4" />
            </Button>
          </motion.div>
        </section>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      {/* Hero */}
      <section ref={heroRef} className="relative pt-32 pb-20 md:pt-40 md:pb-28 bg-primary overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, hsl(var(--accent) / 0.3) 0%, transparent 50%), radial-gradient(circle at 80% 20%, hsl(var(--accent) / 0.15) 0%, transparent 40%)' }} />
        </div>
        <div className="container mx-auto px-4 md:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={heroInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="max-w-3xl"
          >
            <span className="text-accent font-body text-sm font-semibold tracking-[0.3em] uppercase block mb-4">Gratis & uforpligtende</span>
            <h1 className="font-display text-4xl md:text-6xl lg:text-7xl font-bold text-background mb-6 leading-[0.95]">
              Book et gratis
              <span className="block text-accent italic font-normal">udlejningstjek</span>
            </h1>
            <p className="text-background/70 text-lg md:text-xl max-w-2xl leading-relaxed">
              Vi kører ud til dig og tjekker dit sommerhus' udlejningspotentiale — helt gratis. 
              Få et konkret overblik over forventet indtjening og kom i gang med at tjene penge.
            </p>
          </motion.div>

          {/* Benefit pills */}
          <motion.div
            variants={stagger}
            initial="hidden"
            animate={heroInView ? 'visible' : 'hidden'}
            className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4"
          >
            {benefits.map((b, i) => (
              <motion.div key={i} variants={fadeUp} className="flex items-start gap-3 p-4 rounded-2xl bg-background/5 hover:bg-background/10 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-accent/15 flex items-center justify-center flex-shrink-0">
                  <b.icon className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <p className="text-background font-semibold text-sm">{b.title}</p>
                  <p className="text-background/50 text-xs">{b.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <SocialProofSection />

      {/* Form + Calendar */}
      <section ref={formRef} className="py-20 md:py-32 bg-background">
        <div className="container mx-auto px-4 md:px-8">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={formInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6 }}
              className="text-center mb-16"
            >
              <span className="text-accent font-body text-sm font-semibold tracking-[0.3em] uppercase block mb-3">Trin 1</span>
              <h2 className="font-display text-3xl md:text-5xl font-bold text-foreground">Udfyld dine oplysninger</h2>
            </motion.div>

            <div className="grid lg:grid-cols-5 gap-10">
              {/* Form — 3 cols */}
              <motion.form
                onSubmit={handleSubmit}
                initial={{ opacity: 0, x: -30 }}
                animate={formInView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.7 }}
                className="lg:col-span-3 space-y-6"
              >
                <div className="grid sm:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-foreground font-semibold">Fulde navn *</Label>
                    <Input id="name" placeholder="Dit navn" value={form.name} onChange={e => handleChange('name', e.target.value)} className="h-12 bg-card border-border" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-foreground font-semibold">Telefon *</Label>
                    <Input id="phone" placeholder="+45 12 34 56 78" value={form.phone} onChange={e => handleChange('phone', e.target.value)} className="h-12 bg-card border-border" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-foreground font-semibold">Email *</Label>
                  <Input id="email" type="email" placeholder="din@email.dk" value={form.email} onChange={e => handleChange('email', e.target.value)} className="h-12 bg-card border-border" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address" className="text-foreground font-semibold">Sommerhusets adresse *</Label>
                  <Input id="address" placeholder="Strandvej 42, 3100 Hornbæk" value={form.address} onChange={e => handleChange('address', e.target.value)} className="h-12 bg-card border-border" />
                </div>
                <div className="grid sm:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label className="text-foreground font-semibold">Område *</Label>
                    <Select value={form.region} onValueChange={v => handleChange('region', v)}>
                      <SelectTrigger className="h-12 bg-card border-border">
                        <SelectValue placeholder="Vælg område" />
                      </SelectTrigger>
                      <SelectContent>
                        {regions.map(r => (
                          <SelectItem key={r.name} value={r.name}>{r.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-foreground font-semibold">Boligtype</Label>
                    <Select value={form.propertyType} onValueChange={v => handleChange('propertyType', v)}>
                      <SelectTrigger className="h-12 bg-card border-border">
                        <SelectValue placeholder="Vælg type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sommerhus">Sommerhus</SelectItem>
                        <SelectItem value="feriebolig">Feriebolig</SelectItem>
                        <SelectItem value="lejlighed">Ferielejlighed</SelectItem>
                        <SelectItem value="luksus">Luksusvilla</SelectItem>
                        <SelectItem value="bondehus">Bondehus / Gård</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message" className="text-foreground font-semibold">Besked (valgfrit)</Label>
                  <Textarea id="message" rows={4} placeholder="Fortæl os om dit hus — størrelse, stand, evt. ønsker..." value={form.message} onChange={e => handleChange('message', e.target.value)} className="bg-card border-border" />
                </div>

                <Button type="submit" variant="gold" size="xl" disabled={submitting} className="w-full gap-3 text-base group">
                  {submitting ? 'Sender...' : 'Book gratis udlejningstjek'}
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>

                <p className="text-muted-foreground text-xs text-center">
                  Ved at indsende accepterer du vores privatlivspolitik. Vi deler aldrig dine data.
                </p>
              </motion.form>

              {/* Calendar — 2 cols */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={formInView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.7, delay: 0.2 }}
                className="lg:col-span-2"
              >
                <div className="bg-card rounded-2xl border border-border p-6 sticky top-28">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-accent/15 flex items-center justify-center">
                      <CalendarDays className="w-5 h-5 text-accent" />
                    </div>
                    <div>
                      <h3 className="font-display text-lg font-bold text-foreground">Vælg ønsket dato</h3>
                      <p className="text-muted-foreground text-sm">Vi er fleksible og tilpasser os dig</p>
                    </div>
                  </div>

                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    locale={da}
                    disabled={(d) => d < new Date()}
                    className="pointer-events-auto rounded-xl"
                  />

                  {date && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-4 p-4 rounded-xl bg-accent/10 border border-accent/20"
                    >
                      <p className="text-foreground font-semibold text-sm">
                        Valgt dato: {format(date, 'EEEE d. MMMM yyyy', { locale: da })}
                      </p>
                      <p className="text-muted-foreground text-xs mt-1">Vi kontakter dig for at bekræfte tidspunkt</p>
                    </motion.div>
                  )}

                  {/* Quick contact */}
                  <div className="mt-6 pt-6 border-t border-border space-y-3">
                    <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">Eller kontakt os direkte</p>
                    <a href="tel:+4512345678" className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted transition-colors group">
                      <Phone className="w-4 h-4 text-accent" />
                      <span className="text-foreground text-sm font-medium group-hover:text-accent transition-colors">+45 12 34 56 78</span>
                    </a>
                    <a href="mailto:hello@sommervibes.dk" className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted transition-colors group">
                      <Mail className="w-4 h-4 text-accent" />
                      <span className="text-foreground text-sm font-medium group-hover:text-accent transition-colors">hello@sommervibes.dk</span>
                    </a>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Coverage Map */}
      <section ref={mapRef} className="py-20 md:py-32 bg-primary">
        <div className="container mx-auto px-4 md:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={mapInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <span className="text-accent font-body text-sm font-semibold tracking-[0.3em] uppercase block mb-3">Dækningsområder</span>
            <h2 className="font-display text-3xl md:text-5xl font-bold text-background mb-4">Vi dækker hele Danmark</h2>
            <p className="text-background/60 text-lg max-w-2xl mx-auto">
              Fra Skagen i nord til Rømø i syd — vi kører ud til dit sommerhus uanset beliggenhed.
            </p>
          </motion.div>

          <motion.div
            variants={stagger}
            initial="hidden"
            animate={mapInView ? 'visible' : 'hidden'}
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto"
          >
            {regions.map((region, i) => (
              <motion.div
                key={region.name}
                variants={fadeUp}
                whileHover={{ scale: 1.03, y: -4 }}
                className="flex items-start gap-4 p-5 rounded-2xl bg-background/5 hover:bg-background/10 border border-background/10 transition-colors cursor-default group"
              >
                <div className="w-10 h-10 rounded-xl bg-accent/15 flex items-center justify-center flex-shrink-0 group-hover:bg-accent/25 transition-colors">
                  <MapPin className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <h3 className="text-background font-display font-bold text-lg">{region.name}</h3>
                  <p className="text-background/50 text-sm">{region.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={mapInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="text-center mt-16"
          >
            <p className="text-background/60 text-lg mb-6">Kan du ikke finde dit område? Kontakt os alligevel — vi finder en løsning.</p>
            <Button variant="gold" size="xl" className="gap-3 group" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              Book dit udlejningstjek nu
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </motion.div>
        </div>
      </section>
    </PublicLayout>
  );
}
