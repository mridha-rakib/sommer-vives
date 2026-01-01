import { PublicLayout } from '@/components/layout/PublicLayout';
import { Play } from 'lucide-react';
import { useState } from 'react';
import teamEmil from '@/assets/team-emil.jpg';
import teamErik from '@/assets/team-erik.webp';

interface TeamMember {
  name: string;
  role: string;
  image: string;
  email: string;
  phone: string;
  description: string;
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
    videoUrl: undefined,
  },
  {
    name: 'Erik Bendstrup',
    role: 'Marketingchef',
    image: teamErik,
    email: 'erik@sommerdrom.dk',
    phone: '+45 12 34 56 79',
    description: 'Erik er ekspert i at synliggøre sommerhuse og sikre, at de når ud til de rette gæster. Med hans marketingstrategier får dit sommerhus maksimal eksponering på tværs af alle kanaler.',
    videoUrl: undefined,
  },
];

function TeamMemberCard({ member }: { member: TeamMember }) {
  const [showVideo, setShowVideo] = useState(false);

  return (
    <div className="group">
      <div className="relative aspect-[3/4] overflow-hidden rounded-2xl mb-6">
        <img
          src={member.image}
          alt={member.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        
        {/* Video play button overlay */}
        {member.videoUrl && (
          <button
            onClick={() => setShowVideo(true)}
            className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          >
            <div className="w-16 h-16 rounded-full bg-accent/90 flex items-center justify-center shadow-xl">
              <Play className="h-8 w-8 text-primary fill-primary ml-1" />
            </div>
          </button>
        )}
        
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      <div className="space-y-2">
        <h3 className="font-display text-2xl font-semibold text-primary">{member.name}</h3>
        <p className="text-accent font-medium">{member.role}</p>
        <p className="text-muted-foreground leading-relaxed mt-4">{member.description}</p>
        
        <div className="pt-4 space-y-1">
          <a 
            href={`mailto:${member.email}`} 
            className="block text-sm text-muted-foreground hover:text-accent transition-colors"
          >
            {member.email}
          </a>
          <a 
            href={`tel:${member.phone.replace(/\s/g, '')}`}
            className="block text-sm text-muted-foreground hover:text-accent transition-colors"
          >
            {member.phone}
          </a>
        </div>
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
      <section className="pt-32 pb-16 bg-background">
        <div className="container mx-auto px-4 md:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-semibold text-primary mb-6">
              Mød <span className="text-accent">teamet</span>
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              Hos Sommerdrøm står vi klar til at hjælpe dig med alt inden for sommerhusudlejning. 
              Vi brænder for at skabe de bedste oplevelser for både ejere og gæster.
            </p>
          </div>
        </div>
      </section>

      {/* Team Grid */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container mx-auto px-4 md:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 max-w-4xl mx-auto">
            {teamMembers.map((member) => (
              <TeamMemberCard key={member.name} member={member} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 md:px-8 text-center">
          <h2 className="font-display text-3xl md:text-4xl font-semibold mb-6">
            Har du spørgsmål?
          </h2>
          <p className="text-primary-foreground/70 text-lg mb-8 max-w-2xl mx-auto">
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
      </section>
    </PublicLayout>
  );
}
