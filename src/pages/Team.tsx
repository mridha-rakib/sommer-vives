import { PublicLayout } from '@/components/layout/PublicLayout';
import { Play, Phone, Mail, Users, Star, Shield, Sparkles, ArrowRight, CheckCircle2 } from 'lucide-react';
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
    role: 'Udlejningschef',
    image: teamEmil,
    email: 'emil@sommerdrom.dk',
    phone: '+45 12 34 56 78',
    tagline: 'Din personlige udlejningsrådgiver',
    videoUrl: undefined,
  },
  {
    name: 'Erik Bendstrup',
    role: 'Marketingchef',
    image: teamErik,
    email: 'erik@sommerdrom.dk',
    phone: '+45 12 34 56 79',
    tagline: 'Din personlige synlighedsrådgiver',
    videoUrl: undefined,
  },
];

function TeamMemberCard({ member }: { member: TeamMember }) {
  const [showVideo, setShowVideo] = useState(false);

  return (
    <div className="group text-center">
      {/* Image */}
      <div className="relative w-48 h-48 mx-auto mb-6">
        <div className="w-full h-full rounded-full overflow-hidden bg-muted border-4 border-background shadow-xl">
          <img
            src={member.image}
            alt={member.name}
            className="w-full h-full object-cover object-top"
          />
        </div>
        
        {/* Video play button */}
        <button
          onClick={() => member.videoUrl && setShowVideo(true)}
          className={`absolute bottom-2 right-2 w-10 h-10 rounded-full bg-accent flex items-center justify-center shadow-lg transition-all ${
            member.videoUrl ? 'hover:scale-110 cursor-pointer' : 'opacity-40 cursor-not-allowed'
          }`}
          disabled={!member.videoUrl}
        >
          <Play className="h-4 w-4 text-primary fill-primary ml-0.5" />
        </button>
      </div>

      {/* Info */}
      <h3 className="font-display text-xl font-semibold text-primary mb-1">
        {member.name}
      </h3>
      <p className="text-accent font-medium text-sm mb-4">{member.role}</p>
      
      <div className="space-y-2 mb-4">
        <a 
          href={`tel:${member.phone.replace(/\s/g, '')}`}
          className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-accent transition-colors"
        >
          <Phone className="h-4 w-4" />
          <span>{member.phone}</span>
        </a>
        <a 
          href={`mailto:${member.email}`} 
          className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-accent transition-colors"
        >
          <Mail className="h-4 w-4" />
          <span>{member.email}</span>
        </a>
      </div>

      <p className="text-xs text-accent/80 font-medium uppercase tracking-wide">
        {member.tagline}
      </p>

      {/* Video Modal */}
      {showVideo && member.videoUrl && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setShowVideo(false)}
        >
          <div className="relative w-full max-w-4xl aspect-video">
            <video
              src={member.videoUrl}
              controls
              autoPlay
              className="w-full h-full rounded-lg"
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default function Team() {
  return (
    <PublicLayout>
      {/* Hero Section */}
      <section className="pt-32 pb-20 bg-background">
        <div className="container mx-auto px-4 md:px-8">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent/10 rounded-full mb-6">
              <Users className="h-4 w-4 text-accent" />
              <span className="text-sm font-medium text-accent">To dedikerede eksperter</span>
            </div>
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-semibold text-primary mb-6">
              Mød holdet bag<br />
              <span className="text-accent">Sommerdrøm</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Vi kombinerer ejendomsekspertise med digital marketing for at give dig den bedste udlejningsoplevelse
            </p>
          </div>

          {/* Team Grid - Clean & Balanced */}
          <div className="flex flex-col md:flex-row justify-center items-start gap-16 md:gap-24 max-w-3xl mx-auto">
            {teamMembers.map((member) => (
              <TeamMemberCard key={member.name} member={member} />
            ))}
          </div>
        </div>
      </section>

      {/* Story Section 1 - Why We Exist */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4 md:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center max-w-6xl mx-auto">
            <div className="relative">
              <div className="rounded-2xl overflow-hidden shadow-2xl">
                <img 
                  src={heroHouse} 
                  alt="Sommerhus i naturskønne omgivelser" 
                  className="w-full h-[350px] object-cover"
                />
              </div>
              <div className="absolute -bottom-4 -right-4 bg-accent text-primary px-6 py-3 rounded-lg shadow-lg">
                <span className="font-display font-semibold">Grundlagt 2024</span>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="h-4 w-4 text-accent" />
                <span className="text-accent font-medium text-sm uppercase tracking-wide">Vores mission</span>
              </div>
              
              <h2 className="font-display text-3xl md:text-4xl font-semibold text-primary mb-6">
                Skabt af sommerhusejere,<br />
                <span className="text-accent">for sommerhusejere</span>
              </h2>
              
              <p className="text-muted-foreground leading-relaxed mb-6">
                Vi startede Sommerdrøm fordi vi selv oplevede frustrationerne ved de store udlejningsbureauer. 
                Høje gebyrer, manglende gennemsigtighed og upersonlig service.
              </p>
              
              <p className="text-muted-foreground leading-relaxed mb-8">
                Med baggrund i ejendomsbranchen og digital marketing besluttede vi at skabe det alternativ, 
                vi selv havde ønsket os – en partner der virkelig forstår hvad det vil sige at eje et sommerhus.
              </p>

              <Link to="/how-it-works">
                <Button variant="outline" className="gap-2">
                  Se hvordan det virker
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Story Section 2 - Our Expertise */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4 md:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Star className="h-4 w-4 text-accent" />
                <span className="text-accent font-medium text-sm uppercase tracking-wide">Vores ekspertise</span>
              </div>
              <h2 className="font-display text-3xl md:text-4xl font-semibold text-primary mb-4">
                Hvad vi bringer til bordet
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                To forskellige baggrunde, ét fælles mål: At maksimere din udlejning
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Emil's expertise */}
              <div className="bg-muted/30 rounded-2xl p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-full overflow-hidden">
                    <img src={teamEmil} alt="Emil" className="w-full h-full object-cover object-top" />
                  </div>
                  <div>
                    <h3 className="font-display font-semibold text-primary">Ejendomsekspertise</h3>
                    <p className="text-sm text-muted-foreground">Emil Weng Klockmann</p>
                  </div>
                </div>
                <ul className="space-y-3">
                  {[
                    'Uddannet ejendomsmægler',
                    'Erfaren køberrådgiver',
                    'Vurderingskonsulent hos Totalkredit',
                    'Ejer selv 2 sommerhuse',
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-muted-foreground">
                      <CheckCircle2 className="h-4 w-4 text-accent flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Erik's expertise */}
              <div className="bg-muted/30 rounded-2xl p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-full overflow-hidden">
                    <img src={teamErik} alt="Erik" className="w-full h-full object-cover object-top" />
                  </div>
                  <div>
                    <h3 className="font-display font-semibold text-primary">Digital synlighed</h3>
                    <p className="text-sm text-muted-foreground">Erik Bendstrup</p>
                  </div>
                </div>
                <ul className="space-y-3">
                  {[
                    'Digital marketing specialist',
                    'Performance marketing ekspert',
                    'Multi-kanal strategi',
                    'Data-drevet optimering',
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-muted-foreground">
                      <CheckCircle2 className="h-4 w-4 text-accent flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="text-center mt-12">
              <Link to="/pricing">
                <Button variant="gold" size="lg" className="gap-2">
                  Se vores priser
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Story Section 3 - Our Promise */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 md:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex items-center justify-center gap-2 mb-6">
              <Shield className="h-5 w-5 text-accent" />
              <span className="text-accent font-medium text-sm uppercase tracking-wide">Vores løfte</span>
            </div>
            
            <h2 className="font-display text-3xl md:text-4xl font-semibold mb-6">
              Du får en fast personlig rådgiver
            </h2>
            
            <p className="text-primary-foreground/70 text-lg mb-10 max-w-2xl mx-auto">
              Hos os er du ikke bare et nummer i rækken. Du får en dedikeret kontaktperson, 
              der kender dit hus og dine mål – og som altid er klar til at hjælpe.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              {[
                { title: 'Personlig kontakt', desc: 'Din egen rådgiver fra dag ét' },
                { title: 'Hurtig respons', desc: 'Svar inden for 24 timer' },
                { title: 'Ingen skjulte gebyrer', desc: 'Fuld gennemsigtighed altid' },
              ].map((item, i) => (
                <div key={i} className="bg-primary-foreground/5 rounded-xl p-6">
                  <h3 className="font-display font-semibold mb-2">{item.title}</h3>
                  <p className="text-primary-foreground/60 text-sm">{item.desc}</p>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/contact">
                <Button variant="gold" size="lg" className="gap-2">
                  Kontakt os i dag
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/auth?mode=signup">
                <Button variant="outline" size="lg" className="border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10">
                  Opret dit sommerhus
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
