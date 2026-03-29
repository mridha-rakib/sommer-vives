import { PublicLayout } from '@/components/layout/PublicLayout';
import { Phone, Mail, ArrowRight, CheckCircle2, Target, Heart, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import teamEmil from '@/assets/team-emil.jpg';
import teamErik from '@/assets/team-erik.webp';
import heroHouse from '@/assets/hero-house.jpg';

const teamMembers = [
  {
    name: 'Emil Weng Klockmann',
    role: 'Salgschef',
    image: teamEmil,
    email: 'emil@sommervibes.dk',
    phone: '+45 12 34 56 78',
    tagline: 'Din personlige udlejningsrådgiver',
  },
  {
    name: 'Erik Bendstrup',
    role: 'Marketingchef',
    image: teamErik,
    email: 'erik@sommervibes.dk',
    phone: '+45 12 34 56 79',
    tagline: 'Din personlige synlighedsrådgiver',
  },
];

function ValuesSection() {
  const { ref, isInView } = useScrollReveal();
  return (
    <section ref={ref} className="py-24 bg-primary text-background">
      <div className="container mx-auto px-4 md:px-8 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <span className="text-accent font-body text-sm font-semibold tracking-[0.3em] uppercase block mb-4">Vores DNA</span>
          <h2 className="font-display text-3xl md:text-5xl font-semibold">Vi gør tingene anderledes</h2>
        </motion.div>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { icon: Target, title: 'Kvalitet over kvantitet', desc: 'Vi vælger samarbejder med omhu og giver 100% til hver ejer.' },
            { icon: Zap, title: 'Digital nytænkning', desc: 'Vi bruger de nyeste værktøjer til at maksimere din synlighed.' },
            { icon: Heart, title: 'Ægte passion', desc: 'Vi elsker sommerhuse og kender branchen indefra.' },
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.15 * i }}
              className="text-center group"
            >
              <div className="w-16 h-16 rounded-2xl bg-accent/20 flex items-center justify-center mx-auto mb-4 group-hover:bg-accent/30 transition-colors">
                <item.icon className="w-8 h-8 text-accent" />
              </div>
              <h3 className="font-display text-lg font-semibold mb-2">{item.title}</h3>
              <p className="text-background/60 text-sm">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function StorySection() {
  const { ref, isInView } = useScrollReveal();
  return (
    <section ref={ref} className="py-24 md:py-32 bg-muted/30">
      <div className="container mx-auto px-4 md:px-8">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center max-w-6xl mx-auto">
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
              <span className="font-display font-bold text-lg">4+ års passion</span>
              <span className="block text-sm opacity-80">for boliger & sommerhuse</span>
            </motion.div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <span className="text-accent font-body text-sm font-semibold tracking-[0.3em] uppercase block mb-4">Vores historie</span>
            <h2 className="font-display text-3xl md:text-4xl font-semibold text-primary mb-6">
              Fra passion til<br /><span className="text-accent italic font-normal">SommerVibes</span>
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-6">
              Det startede med en passion for boliger og et ønske om at gøre tingene anderledes.
              Emil har arbejdet i ejendomsbranchen som uddannet mægler – og ejer selv sommerhuse.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-6">
              <strong className="text-primary">SommerVibes er svaret på det vi selv savnede:</strong> Et
              moderne, digitalt bureau med personlig service og kun 15% kommission.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-8">
              Sammen med Erik, der bringer digital marketing-ekspertise, har vi skabt
              fremtidens sommerhusbreau.
            </p>
            <Link to="/how-it-works">
              <Button variant="outline" className="gap-2 group">
                Se hvordan det virker <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function ExpertiseSection() {
  const { ref, isInView } = useScrollReveal();
  return (
    <section ref={ref} className="py-24 md:py-32 bg-background">
      <div className="container mx-auto px-4 md:px-8 max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <span className="text-accent font-body text-sm font-semibold tracking-[0.3em] uppercase block mb-4">Ekspertise</span>
          <h2 className="font-display text-3xl md:text-4xl font-semibold text-primary">To baggrunde, ét fælles mål</h2>
        </motion.div>
        <div className="grid md:grid-cols-2 gap-8">
          {[
            { img: teamEmil, name: 'Emil Weng Klockmann', role: 'Ejendomsekspertise', items: ['Uddannet ejendomsmægler', 'Erfaren køber- og salgsrådgiver', 'Dyb indsigt i boligmarkedet', 'Selv ejer af sommerhuse'] },
            { img: teamErik, name: 'Erik Bendstrup', role: 'Digital synlighed', items: ['Digital marketing specialist', 'Performance marketing ekspert', 'Multi-kanal strategi', 'Data-drevet optimering'] },
          ].map((person, pi) => (
            <motion.div
              key={pi}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: pi * 0.15 }}
              className="bg-card rounded-2xl p-8 border border-border hover:shadow-elevated transition-shadow duration-500"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-accent">
                  <img src={person.img} alt={person.name} className="w-full h-full object-cover object-top" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-semibold text-primary">{person.role}</h3>
                  <p className="text-sm text-accent">{person.name}</p>
                </div>
              </div>
              <ul className="space-y-3">
                {person.items.map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4 text-accent flex-shrink-0" /><span>{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="text-center mt-12"
        >
          <Link to="/pricing">
            <Button variant="gold" size="lg" className="gap-2 group">
              Se vores priser <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

export default function Team() {
  return (
    <PublicLayout>
      {/* Hero */}
      <section className="pt-32 pb-20 bg-background overflow-hidden">
        <div className="container mx-auto px-4 md:px-8">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <span className="text-accent font-body text-sm font-semibold tracking-[0.3em] uppercase block mb-6">Teamet</span>
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="font-display text-4xl md:text-5xl lg:text-6xl font-semibold text-primary mb-6"
            >
              Et stærkt partnerskab
              <span className="block text-accent italic font-normal">bygget på passion</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-lg text-muted-foreground max-w-2xl mx-auto"
            >
              Vi kombinerer ejendomsekspertise med digital nytænkning. Kvalitet over kvantitet –
              det er vores filosofi.
            </motion.p>
          </div>
          <div className="flex flex-col md:flex-row justify-center items-start gap-16 md:gap-28 max-w-3xl mx-auto">
            {teamMembers.map((m, i) => (
              <motion.div
                key={m.name}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 + i * 0.15 }}
                className="group text-center"
              >
                <div className="relative w-52 h-52 mx-auto mb-6">
                  <div className="w-full h-full rounded-full overflow-hidden bg-muted border-4 border-background shadow-xl group-hover:shadow-2xl transition-shadow duration-500">
                    <img src={m.image} alt={m.name} className="w-full h-full object-cover object-top" />
                  </div>
                </div>
                <h3 className="font-display text-xl font-semibold text-primary mb-1">{m.name}</h3>
                <p className="text-accent font-medium text-sm mb-4">{m.role}</p>
                <div className="space-y-2 mb-4">
                  <a href={`tel:${m.phone.replace(/\s/g, '')}`} className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-accent transition-colors">
                    <Phone className="h-4 w-4" /><span>{m.phone}</span>
                  </a>
                  <a href={`mailto:${m.email}`} className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-accent transition-colors">
                    <Mail className="h-4 w-4" /><span>{m.email}</span>
                  </a>
                </div>
                <p className="text-xs text-accent/80 font-medium uppercase tracking-wide">{m.tagline}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <ValuesSection />
      <StorySection />
      <ExpertiseSection />

      {/* CTA */}
      <section className="py-24 bg-primary text-background">
        <div className="container mx-auto px-4 text-center max-w-3xl">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}>
            <h2 className="font-display text-3xl md:text-5xl font-semibold mb-6">
              Du får en fast personlig rådgiver
            </h2>
            <p className="text-background/70 text-lg mb-12 max-w-2xl mx-auto">
              Du er ikke bare et nummer i rækken. Du får en dedikeret kontaktperson der kender dit hus og dine mål.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/contact">
                <Button variant="gold" size="lg" className="gap-2 group">
                  Kontakt os <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link to="/kom-i-gang">
                <Button variant="outline" size="lg" className="border-accent/40 text-accent hover:bg-accent/10">
                  Kom i gang
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </PublicLayout>
  );
}
