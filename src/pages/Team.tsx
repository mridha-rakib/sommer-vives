import { PublicLayout } from '@/components/layout/PublicLayout';
import { Play, Phone, Mail, Users } from 'lucide-react';
import { useState } from 'react';
import teamEmil from '@/assets/team-emil.jpg';
import teamErik from '@/assets/team-erik.webp';

interface TeamMember {
  name: string;
  role: string;
  image: string;
  email: string;
  phone: string;
  videoUrl?: string;
}

const teamMembers: TeamMember[] = [
  {
    name: 'Emil Weng Klockmann',
    role: 'Udlejningschef',
    image: teamEmil,
    email: 'emil@sommerdrom.dk',
    phone: '+45 12 34 56 78',
    videoUrl: undefined,
  },
  {
    name: 'Erik Bendstrup',
    role: 'Marketingchef',
    image: teamErik,
    email: 'erik@sommerdrom.dk',
    phone: '+45 12 34 56 79',
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
        <p className="text-muted-foreground mb-6">{member.role}</p>
        
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

      {/* Contact CTA Section */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container mx-auto px-4 md:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="font-display text-3xl md:text-4xl font-semibold text-primary mb-6">
              Har du spørgsmål?
            </h2>
            <p className="text-muted-foreground text-lg mb-8">
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
