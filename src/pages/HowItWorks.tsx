import { PublicLayout } from '@/components/layout/PublicLayout';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { ClipboardList, Camera, Home, Calendar, Banknote, ArrowRight, Check, Star, Shield, Zap, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import { useScrollReveal } from '@/hooks/useScrollReveal';
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
  { icon: Shield, title: '6 mdr. binding', desc: 'Tryghed for begge parter' },
  { icon: Zap, title: 'Hurtig opstart', desc: '1-2 uger til første booking' },
  { icon: Users, title: 'Dansk support', desc: '100% dansk team' },
];

function StepsSection() {
  const { ref, isInView } = useScrollReveal();
  return (
    <section ref={ref} className="py-24 md:py-32 bg-background">
      <div className="container mx-auto px-4 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <span className="text-accent font-body text-sm font-semibold tracking-[0.3em] uppercase block mb-4">Processen</span>
          <h2 className="font-display text-3xl md:text-5xl font-bold text-primary">5 simple trin</h2>
        </motion.div>
        <div className="max-w-4xl mx-auto">
          {steps.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -30 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.1 * i }}
              className="flex gap-6 md:gap-10 items-start mb-12 last:mb-0 group"
            >
              <div className="flex-shrink-0 relative">
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors duration-300">
                  <step.icon className="w-8 h-8 md:w-10 md:h-10 text-accent" />
                </div>
                <span className="absolute -top-2 -left-2 w-8 h-8 rounded-full bg-primary text-background text-xs font-bold flex items-center justify-center">
                  {step.number}
                </span>
                {i < steps.length - 1 && (
                  <div className="absolute left-1/2 top-full w-0.5 h-12 bg-border -translate-x-1/2" />
                )}
              </div>
              <div className="pt-2">
                <h3 className="font-display text-xl md:text-2xl font-semibold text-primary mb-2 group-hover:text-accent transition-colors duration-300">{step.title}</h3>
                <p className="text-muted-foreground md:text-lg">{step.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="text-center mt-16"
        >
          <Link to="/kom-i-gang">
            <Button variant="gold" size="lg" className="gap-2 group">
              Start din rejse nu <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

function WhySection() {
  const { ref, isInView } = useScrollReveal();
  return (
    <section ref={ref} className="py-24 md:py-32 bg-muted/30">
      <div className="container mx-auto px-4 md:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            <div className="rounded-2xl overflow-hidden shadow-2xl">
              <img src={heroHouse} alt="Sommerhus" className="w-full h-[400px] object-cover" loading="lazy" />
            </div>
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={isInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="absolute -bottom-6 -right-6 bg-accent text-primary px-8 py-4 rounded-xl shadow-lg"
            >
              <span className="font-display font-bold text-2xl">15%</span>
              <span className="block text-sm">kommission</span>
            </motion.div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <span className="text-accent font-body text-sm font-semibold tracking-[0.3em] uppercase block mb-4">Fordele</span>
            <h2 className="font-display text-3xl md:text-4xl font-semibold text-primary mb-6">
              Hvorfor vælge<br /><span className="text-accent italic font-normal">SommerVibes?</span>
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
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 20 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.4, delay: 0.3 + i * 0.08 }}
                  className="flex items-center gap-3"
                >
                  <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
                    <Check className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-muted-foreground">{item}</span>
                </motion.div>
              ))}
            </div>
            <Link to="/team">
              <Button variant="outline" className="gap-2 group">
                Mød teamet bag <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

export default function HowItWorks() {
  return (
    <PublicLayout>
      {/* Hero */}
      <section className="relative pt-32 pb-20 bg-background text-foreground overflow-hidden">
        <div className="container mx-auto px-4 md:px-8 text-center relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <span className="text-accent font-body text-sm font-semibold tracking-[0.3em] uppercase block mb-6">Sådan virker det</span>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-6"
          >
            Fra oprettelse til
            <span className="block text-accent italic font-normal">indtjening på få dage</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10"
          >
            Vi har gjort det så enkelt som muligt at udleje dit sommerhus professionelt.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link to="/kom-i-gang">
              <Button variant="gold" size="lg" className="gap-2 group">
                Kom i gang nu <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link to="/beregn-lejeindtaegt">
              <Button variant="outline" size="lg" className="border-accent/40 text-accent hover:bg-accent/10">
                Se din potentielle indtjening
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Benefits bar */}
      <section className="py-8 bg-muted/50 border-y border-border">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-8 md:gap-16">
            {benefits.map((b, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.8 + i * 0.1 }}
                className="flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                  <b.icon className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <div className="font-medium text-primary text-sm">{b.title}</div>
                  <div className="text-xs text-muted-foreground">{b.desc}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <StepsSection />
      <WhySection />

      {/* CTA */}
      <section className="py-24 bg-background text-foreground">
        <div className="container mx-auto px-4 md:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}>
            <h2 className="font-display text-3xl md:text-5xl font-bold mb-6">Klar til at komme i gang?</h2>
            <p className="text-muted-foreground text-lg mb-10 max-w-2xl mx-auto">
              Det tager kun 5 minutter at oprette dit sommerhus.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/kom-i-gang">
                <Button variant="gold" size="lg" className="gap-2 group">
                  Opret dit sommerhus <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link to="/beregn-lejeindtaegt">
                <Button variant="outline" size="lg" className="border-accent/40 text-accent hover:bg-accent/10">
                  Beregn din indtjening
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </PublicLayout>
  );
}
