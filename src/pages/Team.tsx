import { PublicLayout } from '@/components/layout/PublicLayout';
import { Play, Phone, Mail, Star, Shield, Zap, ArrowRight, CheckCircle2, Target, Heart } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import teamEmil from '@/assets/team-emil.jpg';
import teamErik from '@/assets/team-erik.webp';
import heroHouse from '@/assets/hero-house.jpg';

interface TeamMember {
  name: string;
  role: string;
  image: string;
  email: string;
  phone: string;
  tagline: string;
  videoUrl?: string;
}

const teamMembers: TeamMember[] = [
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

function TeamMemberCard({ member }: { member: TeamMember }) {
  return (
    <div className="group text-center">
      <div className="relative w-52 h-52 mx-auto mb-6">
        <div className="w-full h-full rounded-full overflow-hidden bg-muted border-4 border-background shadow-xl">
          <img src={member.image} alt={member.name} className="w-full h-full object-cover object-top" />
        </div>
      </div>
      <h3 className="font-display text-xl font-semibold text-primary mb-1">{member.name}</h3>
      <p className="text-accent font-medium text-sm mb-4">{member.role}</p>
      <div className="space-y-2 mb-4">
        <a href={`tel:${member.phone.replace(/\s/g, '')}`} className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-accent transition-colors">
          <Phone className="h-4 w-4" /><span>{member.phone}</span>
        </a>
        <a href={`mailto:${member.email}`} className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-accent transition-colors">
          <Mail className="h-4 w-4" /><span>{member.email}</span>
        </a>
      </div>
      <p className="text-xs text-accent/80 font-medium uppercase tracking-wide">{member.tagline}</p>
    </div>
  );
}

export default function Team() {
  return (
    <PublicLayout>
      <section className="pt-32 pb-20 bg-background">
        <div className="container mx-auto px-4 md:px-8">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-semibold text-primary mb-6">
              Et stærkt partnerskab<br />
              <span className="text-accent">bygget på passion</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Vi kombinerer ejendomsekspertise med digital nytænkning. Kvalitet over kvantitet –
              det er vores filosofi.
            </p>
          </div>
          <div className="flex flex-col md:flex-row justify-center items-start gap-16 md:gap-28 max-w-3xl mx-auto">
            {teamMembers.map((m) => (
              <TeamMemberCard key={m.name} member={m} />
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 md:px-8 max-w-4xl">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl md:text-5xl font-semibold mt-4 mb-6">
              Vi gør tingene anderledes
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Target, title: 'Kvalitet over kvantitet', desc: 'Vi vælger samarbejder med omhu og giver 100% til hver ejer.' },
              { icon: Zap, title: 'Digital nytænkning', desc: 'Vi bruger de nyeste værktøjer til at maksimere din synlighed.' },
              { icon: Heart, title: 'Ægte passion', desc: 'Vi elsker sommerhuse og kender branchen indefra.' },
            ].map((item, i) => (
              <div key={i} className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-accent/20 flex items-center justify-center mx-auto mb-4">
                  <item.icon className="w-8 h-8 text-accent" />
                </div>
                <h3 className="font-display text-lg font-semibold mb-2">{item.title}</h3>
                <p className="text-primary-foreground/60 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4 md:px-8">
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center max-w-6xl mx-auto">
            <div className="relative">
              <div className="rounded-2xl overflow-hidden shadow-2xl">
                <img src={heroHouse} alt="Sommerhus" className="w-full h-[400px] object-cover" loading="lazy" />
              </div>
              <div className="absolute -bottom-6 -right-6 bg-accent text-primary px-8 py-4 rounded-xl shadow-lg">
                <span className="font-display font-bold text-lg">4+ års passion</span>
                <span className="block text-sm opacity-80">for boliger & sommerhuse</span>
              </div>
            </div>
            <div>
              <h2 className="font-display text-3xl md:text-4xl font-semibold text-primary mb-6">
                Fra passion til<br /><span className="text-accent">SommerVibes</span>
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
                <Button variant="outline" className="gap-2">
                  Se hvordan det virker <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 bg-background">
        <div className="container mx-auto px-4 md:px-8 max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl md:text-4xl font-semibold text-primary mb-4">
              To baggrunde, ét fælles mål
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-muted/30 rounded-2xl p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-accent">
                  <img src={teamEmil} alt="Emil" className="w-full h-full object-cover object-top" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-semibold text-primary">Ejendomsekspertise</h3>
                  <p className="text-sm text-accent">Emil Weng Klockmann</p>
                </div>
              </div>
              <ul className="space-y-3">
                {['Uddannet ejendomsmægler', 'Erfaren køber- og salgsrådgiver', 'Dyb indsigt i boligmarkedet', 'Selv ejer af sommerhuse'].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4 text-accent flex-shrink-0" /><span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-muted/30 rounded-2xl p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-accent">
                  <img src={teamErik} alt="Erik" className="w-full h-full object-cover object-top" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-semibold text-primary">Digital synlighed</h3>
                  <p className="text-sm text-accent">Erik Bendstrup</p>
                </div>
              </div>
              <ul className="space-y-3">
                {['Digital marketing specialist', 'Performance marketing ekspert', 'Multi-kanal strategi', 'Data-drevet optimering'].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4 text-accent flex-shrink-0" /><span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="text-center mt-12">
            <Link to="/pricing">
              <Button variant="gold" size="lg" className="gap-2">
                Se vores priser <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="py-24 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center max-w-3xl">
          <h2 className="font-display text-3xl md:text-4xl font-semibold mb-6">
            Du får en fast personlig rådgiver
          </h2>
          <p className="text-primary-foreground/70 text-lg mb-12 max-w-2xl mx-auto">
            Du er ikke bare et nummer i rækken. Du får en dedikeret kontaktperson der kender dit hus og dine mål.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/contact">
              <Button variant="gold" size="lg" className="gap-2">
                Kontakt os <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/kom-i-gang">
              <Button variant="outline" size="lg" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">
                Kom i gang
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
