import { PublicLayout } from '@/components/layout/PublicLayout';
import { Play, Phone, Mail, Users, Award, Home, Heart, Sparkles } from 'lucide-react';
import { useState } from 'react';
import teamEmil from '@/assets/team-emil.jpg';
import teamErik from '@/assets/team-erik.webp';
import heroHouse from '@/assets/hero-house.jpg';

interface TeamMember {
  name: string;
  role: string;
  image: string;
  email: string;
  phone: string;
  description: string;
  credentials?: string[];
  advisorTagline?: string;
  videoUrl?: string;
}

const teamMembers: TeamMember[] = [
  {
    name: 'Emil Weng Klockmann',
    role: 'Udlejningschef',
    image: teamEmil,
    email: 'emil@sommerdrom.dk',
    phone: '+45 12 34 56 78',
    description: 'Emil har mange års erfaring inden for sommerhusudlejning og sørger for, at alle vores ejere får den bedste service og support. Han står klar til at hjælpe dig med alt fra oprettelse til optimering af din udlejning.',
    credentials: [
      'Uddannet ejendomsmægler',
      'Tidl. køberrådgiver',
      'Vurderingskonsulent, Totalkredit',
      'Ejer selv 2 sommerhuse',
    ],
    advisorTagline: 'Din personlige udlejningsrådgiver',
    videoUrl: undefined,
  },
  {
    name: 'Erik Bendstrup',
    role: 'Marketingchef',
    image: teamErik,
    email: 'erik@sommerdrom.dk',
    phone: '+45 12 34 56 79',
    description: 'Erik er ekspert i at synliggøre sommerhuse og sikre, at de når ud til de rette gæster. Med hans marketingstrategier får dit sommerhus maksimal eksponering på tværs af alle kanaler.',
    credentials: [
      'Digital marketing ekspert',
      'Performance marketing specialist',
    ],
    advisorTagline: 'Din personlige synlighedsrådgiver',
    videoUrl: undefined,
  },
];

function TeamMemberCard({ member }: { member: TeamMember }) {
  const [showVideo, setShowVideo] = useState(false);

  return (
    <div className="flex flex-col md:flex-row gap-6 md:gap-8">
      {/* Image with video play button */}
      <div className="relative flex-shrink-0">
        <div className="relative w-full md:w-64 h-80 overflow-hidden rounded-xl bg-[#1a1a2e]">
          <img
            src={member.image}
            alt={member.name}
            className="w-full h-full object-cover object-top"
          />
          
          {/* Video play button - always visible in top left */}
          <button
            onClick={() => member.videoUrl && setShowVideo(true)}
            className={`absolute top-4 left-4 w-12 h-12 rounded-lg bg-primary/90 flex items-center justify-center shadow-lg transition-all ${
              member.videoUrl ? 'hover:bg-primary cursor-pointer' : 'opacity-50 cursor-not-allowed'
            }`}
            disabled={!member.videoUrl}
          >
            <Play className="h-5 w-5 text-primary-foreground fill-primary-foreground ml-0.5" />
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="flex flex-col justify-center py-2">
        <h3 className="font-display text-2xl font-semibold text-primary mb-1">
          {member.name}
        </h3>
        <p className="text-muted-foreground mb-4">{member.role}</p>
        
        {/* Description */}
        <p className="text-muted-foreground text-sm leading-relaxed mb-5">
          {member.description}
        </p>
        
        {/* Credentials */}
        {member.credentials && member.credentials.length > 0 && (
          <div className="mb-5 space-y-1.5">
            {member.credentials.map((credential, index) => (
              <div key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                <Award className="h-3.5 w-3.5 text-accent flex-shrink-0" />
                <span>{credential}</span>
              </div>
            ))}
          </div>
        )}
        
        <div className="space-y-3">
          <a 
            href={`tel:${member.phone.replace(/\s/g, '')}`}
            className="flex items-center gap-3 text-accent hover:text-accent/80 transition-colors"
          >
            <Phone className="h-5 w-5" />
            <span className="font-medium">{member.phone}</span>
          </a>
          <a 
            href={`mailto:${member.email}`} 
            className="flex items-center gap-3 text-accent hover:text-accent/80 transition-colors"
          >
            <Mail className="h-5 w-5" />
            <span className="font-medium">{member.email}</span>
          </a>
        </div>

        {/* Advisor tagline */}
        {member.advisorTagline && (
          <div className="mt-5 pt-4 border-t border-border">
            <div className="flex items-center gap-2 text-sm">
              <Heart className="h-4 w-4 text-accent" />
              <span className="font-medium text-primary">{member.advisorTagline}</span>
            </div>
          </div>
        )}
      </div>

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
      <section className="pt-32 pb-16 bg-muted/30">
        <div className="container mx-auto px-4 md:px-8">
          <div className="flex flex-col items-center text-center mb-16">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
              <Users className="h-8 w-8 text-primary" />
            </div>
            <h1 className="font-display text-4xl md:text-5xl font-semibold text-primary mb-4">
              Mød holdet
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl">
              Vi er klar til at hjælpe dig med alt inden for sommerhusudlejning
            </p>
          </div>

          {/* Team Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 md:gap-16 max-w-5xl mx-auto">
            {teamMembers.map((member) => (
              <TeamMemberCard key={member.name} member={member} />
            ))}
          </div>
        </div>
      </section>

      {/* Our Story Section */}
      <section className="py-20 md:py-28 bg-background overflow-hidden">
        <div className="container mx-auto px-4 md:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* Image */}
            <div className="relative order-2 lg:order-1">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                <img 
                  src={heroHouse} 
                  alt="Sommerhus i naturskønne omgivelser" 
                  className="w-full h-[400px] md:h-[500px] object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-primary/40 via-transparent to-transparent" />
              </div>
              
              {/* Floating card */}
              <div className="absolute -bottom-6 -right-6 md:bottom-8 md:-right-8 bg-background rounded-xl p-5 shadow-xl border border-border max-w-[200px]">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                    <Heart className="h-5 w-5 text-accent" />
                  </div>
                  <span className="font-display font-semibold text-primary">Passion</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Skabt af folk der elsker sommerhuse
                </p>
              </div>
            </div>

            {/* Content */}
            <div className="order-1 lg:order-2">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="h-5 w-5 text-accent" />
                <span className="text-accent font-medium text-sm uppercase tracking-wide">Vores historie</span>
              </div>
              
              <h2 className="font-display text-3xl md:text-4xl font-semibold text-primary mb-6">
                Fra frustration til{' '}
                <span className="text-accent">Sommerdrøm</span>
              </h2>
              
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  Som ejer af to sommerhuse oplevede Emil selv frustrationen ved at udleje gennem de store bureauer. 
                  <strong className="text-primary"> Høje gebyrer, manglende gennemsigtighed og en følelse af at være bare endnu et nummer i rækken.</strong>
                </p>
                
                <p>
                  Med baggrund som uddannet ejendomsmægler, køberrådgiver og vurderingskonsulent hos Totalkredit, 
                  vidste Emil præcis hvad der skulle til for at skabe en bedre oplevelse for sommerhusejere.
                </p>
                
                <p>
                  <strong className="text-primary">Sommerdrøm blev skabt med én mission:</strong> At give sommerhusejere 
                  den personlige service og gennemsigtighed de fortjener – uden at betale overpris.
                </p>
                
                <p>
                  Sammen med Erik, der bringer ekspertise inden for digital marketing, sikrer vi at dit sommerhus 
                  får maksimal synlighed og de bedste gæster. Vi er ikke bare en platform – vi er dit team.
                </p>
              </div>

              {/* Key values */}
              <div className="grid grid-cols-2 gap-4 mt-8">
                <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                  <Home className="h-5 w-5 text-accent" />
                  <span className="text-sm font-medium text-primary">Personlig service</span>
                </div>
                <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                  <Award className="h-5 w-5 text-accent" />
                  <span className="text-sm font-medium text-primary">Ingen skjulte gebyrer</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact CTA Section */}
      <section className="py-16 md:py-24 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 md:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="font-display text-3xl md:text-4xl font-semibold mb-6">
              Har du spørgsmål?
            </h2>
            <p className="text-primary-foreground/70 text-lg mb-8">
              Vi er altid klar til at hjælpe. Kontakt os i dag, og lad os tage en snak om, 
              hvordan vi kan hjælpe dig med din sommerhusudlejning.
            </p>
            <a
              href="/contact"
              className="inline-flex items-center justify-center px-8 py-4 bg-accent text-primary font-semibold rounded-lg hover:bg-accent/90 transition-colors"
            >
              Kontakt os
            </a>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
