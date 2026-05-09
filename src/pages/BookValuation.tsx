import { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { Phone, Mail, CheckCircle2, ArrowRight, Clock, Shield, Star, Home, MapPin, TrendingUp, Users, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const regions = [
  'Nordsjælland', 'Vestsjælland', 'Sydsjælland & Møn', 'Fyn & Øerne',
  'Østjylland', 'Vestjylland', 'Nordjylland', 'Sønderjylland', 'Bornholm',
];

const benefits = [
  { icon: Shield, label: '100% gratis & uforpligtende' },
  { icon: Home, label: 'Vi kører ud til dig' },
  { icon: Star, label: 'Individuel prisanalyse' },
  { icon: Clock, label: 'Svar inden 24 timer' },
];

const reasons = [
  { icon: TrendingUp, title: 'Konkret vurdering', desc: 'Få et realistisk billede af dit sommerhus\' udlejningspotentiale baseret på lokale markedsdata.' },
  { icon: Eye, title: 'Indblik i indtjening', desc: 'Vi gennemgår forventet omsætning, sæsonmønstre og optimeringsmuligheder for dit hus.' },
  { icon: Users, title: 'Personlig sparring', desc: 'Mød en rådgiver der kender markedet og kan svare på alle dine spørgsmål — ansigt til ansigt.' },
  { icon: Shield, title: 'Helt uforpligtende', desc: 'Der er ingen bindinger, ingen skjulte gebyrer. Du bestemmer selv om du vil gå videre.' },
];

export default function BookValuation() {
  const [date, setDate] = useState<Date | undefined>();
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '', region: '', propertyType: '', message: '' });

  const { ref: heroRef, isInView: heroInView } = useScrollReveal();
  const { ref: formRef, isInView: formInView } = useScrollReveal();
  const { ref: whyRef, isInView: whyInView } = useScrollReveal();
  const { ref: ctaRef, isInView: ctaInView } = useScrollReveal();

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

  const reveal = (inView: boolean, delay = 0) => ({
    initial: { opacity: 0, y: 20 },
    animate: inView ? { opacity: 1, y: 0 } : {},
    transition: { duration: 0.7, delay, ease: 'easeOut' as const },
  });

  if (submitted) {
    return (
      <PublicLayout>
        <section className="min-h-[80vh] flex items-center justify-center bg-background">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6 }} className="text-center max-w-lg mx-auto px-6">
            <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-8 h-8 text-accent" />
            </div>
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-3">Tak for din henvendelse!</h1>
            <p className="text-muted-foreground text-lg mb-8">Vi kontakter dig inden 24 timer for at aftale en tid til dit gratis udlejningstjek.</p>
            <Button variant="gold" size="lg" onClick={() => setSubmitted(false)} className="gap-2">
              Book endnu et udlejningstjek <ArrowRight className="w-4 h-4" />
            </Button>
          </motion.div>
        </section>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      {/* ── Hero ── */}
      <section ref={heroRef} className="relative pt-28 pb-14 md:pt-36 md:pb-20 bg-background overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 30% 40%, hsl(var(--accent)) 0%, transparent 50%)' }} />
        <div className="container mx-auto px-4 md:px-8 relative z-10">
          <motion.div {...reveal(heroInView)} className="max-w-2xl">
            <span className="text-accent/80 font-body text-xs font-semibold tracking-[0.3em] uppercase block mb-3">Gratis & uforpligtende</span>
            <h1 className="font-display text-3xl md:text-5xl lg:text-6xl font-bold text-foreground mb-5 leading-[1.05]">
              Få et gratis
              <span className="block text-accent italic font-normal">udlejningstjek</span>
            </h1>
            <p className="text-muted-foreground text-base md:text-lg max-w-xl leading-relaxed">
              Vi kører ud til dig og vurderer dit sommerhus' udlejningspotentiale — helt gratis og uforpligtende. Få et konkret overblik over forventet indtjening.
            </p>
          </motion.div>

          {/* Trust strip */}
          <motion.div {...reveal(heroInView, 0.2)} className="mt-10 flex flex-wrap gap-x-6 gap-y-3">
            {benefits.map((b, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                  <b.icon className="w-4 h-4 text-accent" />
                </div>
                <span className="text-foreground/80 text-sm font-medium">{b.label}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Form + Calendar ── */}
      <section ref={formRef} className="py-14 md:py-20 bg-background">
        <div className="container mx-auto px-4 md:px-8">
          <div className="max-w-5xl mx-auto">
            <div className="grid lg:grid-cols-5 gap-8">
              {/* Form — 3 cols */}
              <motion.form
                onSubmit={handleSubmit}
                {...reveal(formInView)}
                className="lg:col-span-3 p-6 md:p-8 rounded-2xl bg-card border border-border"
              >
                <h2 className="font-display text-xl md:text-2xl font-bold text-foreground mb-1">Udfyld dine oplysninger</h2>
                <p className="text-muted-foreground text-sm mb-6">Vi kontakter dig inden 24 timer for at aftale en tid.</p>

                <div className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="name" className="text-foreground/90 text-sm font-medium">Fulde navn *</Label>
                      <Input id="name" placeholder="Dit navn" value={form.name} onChange={e => handleChange('name', e.target.value)} className="h-11 bg-background border-border/60 text-foreground placeholder:text-muted-foreground/50 focus:border-accent/40" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="phone" className="text-foreground/90 text-sm font-medium">Telefon *</Label>
                      <Input id="phone" placeholder="+45 12 34 56 78" value={form.phone} onChange={e => handleChange('phone', e.target.value)} className="h-11 bg-background border-border/60 text-foreground placeholder:text-muted-foreground/50 focus:border-accent/40" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-foreground/90 text-sm font-medium">Email *</Label>
                    <Input id="email" type="email" placeholder="din@email.dk" value={form.email} onChange={e => handleChange('email', e.target.value)} className="h-11 bg-background border-border/60 text-foreground placeholder:text-muted-foreground/50 focus:border-accent/40" />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="address" className="text-foreground/90 text-sm font-medium">Sommerhusets adresse *</Label>
                    <Input id="address" placeholder="Strandvej 42, 3100 Hornbæk" value={form.address} onChange={e => handleChange('address', e.target.value)} className="h-11 bg-background border-border/60 text-foreground placeholder:text-muted-foreground/50 focus:border-accent/40" />
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-foreground/90 text-sm font-medium">Område *</Label>
                      <Select value={form.region} onValueChange={v => handleChange('region', v)}>
                        <SelectTrigger className="h-11 bg-background border-border/60 text-foreground">
                          <SelectValue placeholder="Vælg område" />
                        </SelectTrigger>
                        <SelectContent>
                          {regions.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-foreground/90 text-sm font-medium">Boligtype</Label>
                      <Select value={form.propertyType} onValueChange={v => handleChange('propertyType', v)}>
                        <SelectTrigger className="h-11 bg-background border-border/60 text-foreground">
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

                  <div className="space-y-1.5">
                    <Label htmlFor="message" className="text-foreground/90 text-sm font-medium">Besked <span className="text-muted-foreground font-normal">(valgfrit)</span></Label>
                    <Textarea id="message" rows={3} placeholder="Fortæl os om dit hus…" value={form.message} onChange={e => handleChange('message', e.target.value)} className="bg-background border-border/60 text-foreground placeholder:text-muted-foreground/50 focus:border-accent/40" />
                  </div>
                </div>

                <Button type="submit" variant="gold" size="lg" disabled={submitting} className="w-full mt-6 gap-2.5 text-base group h-12">
                  {submitting ? 'Sender...' : 'Book gratis udlejningstjek'}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
                <p className="text-muted-foreground/60 text-xs text-center mt-3">
                  Ved at indsende accepterer du vores <Link to="/privacy" className="underline hover:text-accent transition-colors">privatlivspolitik</Link>.
                </p>
              </motion.form>

              {/* Sidebar — 2 cols */}
              <motion.div {...reveal(formInView, 0.15)} className="lg:col-span-2 space-y-5">
                {/* Calendar card */}
                <div className="rounded-2xl bg-card border border-border p-5 sticky top-28">
                  <div className="flex items-center gap-2.5 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                      <Clock className="w-4 h-4 text-accent" />
                    </div>
                    <div>
                      <h3 className="font-display text-base font-bold text-foreground">Vælg ønsket dato</h3>
                      <p className="text-muted-foreground text-xs">Vi tilpasser os din kalender</p>
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
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-3 p-3 rounded-xl bg-accent/8 border border-accent/15">
                      <p className="text-foreground text-sm font-medium">
                        {format(date, 'EEEE d. MMMM yyyy', { locale: da })}
                      </p>
                      <p className="text-muted-foreground text-xs mt-0.5">Vi bekræfter tidspunkt per telefon</p>
                    </motion.div>
                  )}

                  {/* Contact */}
                  <div className="mt-5 pt-4 border-t border-border/60 space-y-2">
                    <p className="text-muted-foreground text-[11px] font-semibold uppercase tracking-wider mb-2">Kontakt os direkte</p>
                    <a href="tel:+4512345678" className="flex items-center gap-2.5 py-2 px-3 rounded-xl hover:bg-secondary/50 transition-colors group">
                      <Phone className="w-3.5 h-3.5 text-accent" />
                      <span className="text-foreground text-sm group-hover:text-accent transition-colors">+45 12 34 56 78</span>
                    </a>
                    <a href="mailto:hello@sommervibes.dk" className="flex items-center gap-2.5 py-2 px-3 rounded-xl hover:bg-secondary/50 transition-colors group">
                      <Mail className="w-3.5 h-3.5 text-accent" />
                      <span className="text-foreground text-sm group-hover:text-accent transition-colors">hello@sommervibes.dk</span>
                    </a>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Why book ── */}
      <section ref={whyRef} className="py-14 md:py-20 bg-secondary/30">
        <div className="container mx-auto px-4 md:px-8">
          <div className="max-w-5xl mx-auto">
            <motion.div {...reveal(whyInView)} className="mb-10">
              <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-2">Derfor er et udlejningstjek en god idé</h2>
              <p className="text-muted-foreground text-sm max-w-xl">Et gratis udlejningstjek giver dig et solidt beslutningsgrundlag — uden bindinger.</p>
            </motion.div>

            <div className="grid sm:grid-cols-2 gap-5">
              {reasons.map((r, i) => (
                <motion.div key={i} {...reveal(whyInView, 0.1 * i)} className="flex gap-4 p-5 rounded-xl bg-card border border-border/60">
                  <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                    <r.icon className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <h3 className="text-foreground font-semibold text-sm mb-1">{r.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{r.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Coverage (compact) ── */}
      <section className="py-12 md:py-16 bg-background border-t border-border/40">
        <div className="container mx-auto px-4 md:px-8">
          <div className="max-w-5xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
              <div>
                <h2 className="font-display text-xl md:text-2xl font-bold text-foreground">Vi dækker hele Danmark</h2>
                <p className="text-muted-foreground text-sm mt-1">Fra Skagen til Rømø — vi kører ud uanset beliggenhed.</p>
              </div>
              <MapPin className="w-5 h-5 text-accent hidden md:block" />
            </div>
            <div className="flex flex-wrap gap-2.5">
              {regions.map(r => (
                <span key={r} className="px-4 py-2 rounded-full bg-secondary/60 border border-border/40 text-foreground/80 text-sm font-medium">
                  {r}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ (compact) ── */}
      <section className="py-12 md:py-16 bg-background">
        <div className="container mx-auto px-4 md:px-8">
          <div className="max-w-2xl mx-auto">
            <h2 className="font-display text-xl font-bold text-foreground mb-6">Ofte stillede spørgsmål</h2>
            <Accordion type="single" collapsible className="space-y-2">
              <AccordionItem value="1" className="border border-border/50 rounded-xl px-5 bg-card">
                <AccordionTrigger className="text-foreground text-sm font-medium py-4 hover:no-underline">Hvad indebærer et udlejningstjek?</AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-sm pb-4">Vi besøger dit sommerhus, vurderer stand og beliggenhed, og giver dig en konkret vurdering af udlejningspotentiale og forventet indtjening.</AccordionContent>
              </AccordionItem>
              <AccordionItem value="2" className="border border-border/50 rounded-xl px-5 bg-card">
                <AccordionTrigger className="text-foreground text-sm font-medium py-4 hover:no-underline">Er det virkelig helt gratis?</AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-sm pb-4">Ja. Udlejningstjekket er 100% gratis og uforpligtende. Du bestemmer selv om du vil gå videre bagefter.</AccordionContent>
              </AccordionItem>
              <AccordionItem value="3" className="border border-border/50 rounded-xl px-5 bg-card">
                <AccordionTrigger className="text-foreground text-sm font-medium py-4 hover:no-underline">Hvornår kan I komme forbi?</AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-sm pb-4">Vi kontakter dig inden 24 timer og finder en dato der passer dig. Vi er fleksible og kører ud i hele Danmark.</AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section ref={ctaRef} className="py-14 md:py-20 bg-secondary/20 border-t border-border/30">
        <div className="container mx-auto px-4 md:px-8">
          <motion.div {...reveal(ctaInView)} className="max-w-2xl mx-auto text-center">
            <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-3">
              Lad os vurdere dit sommerhus
            </h2>
            <p className="text-muted-foreground text-base mb-8 max-w-lg mx-auto">
              Book et gratis udlejningstjek eller kontakt os direkte — vi er klar til at hjælpe dig i gang.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                variant="gold"
                size="lg"
                className="gap-2 group"
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              >
                Book gratis udlejningstjek
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Link to="/kom-i-gang">
                <Button variant="outline" size="lg" className="border-border/60 text-foreground/80 hover:text-foreground">
                  Udlej dit hus
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </PublicLayout>
  );
}
