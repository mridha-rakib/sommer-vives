import { ArrowRight, Shield, Heart, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import heroHouse from '@/assets/hero-house.jpg';

const values = [
  {
    icon: Shield,
    title: 'Gennemsigtighed',
    description: 'Ingen skjulte gebyrer. Du ved altid præcis hvad du betaler og tjener.',
  },
  {
    icon: Heart,
    title: 'Personlig service',
    description: 'Din egen faste rådgiver der kender dit hus og dine mål.',
  },
  {
    icon: Users,
    title: 'Lokalt team',
    description: 'Vi er et dansk team med passion for sommerhuse og gæsteoplevelser.',
  },
];

export function StorySection() {
  return (
    <section className="py-20 bg-primary text-primary-foreground overflow-hidden">
      <div className="container mx-auto px-4 md:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center max-w-6xl mx-auto">
          {/* Content */}
          <div>
            <span className="text-accent font-medium text-sm uppercase tracking-wide">Hvorfor Sommerdrøm</span>
            <h2 className="font-display text-3xl md:text-4xl font-bold mt-2 mb-6">
              Vi gjorde op med det etablerede
            </h2>
            
            <p className="text-primary-foreground/80 leading-relaxed mb-6">
              De store udlejningsbureauer tager høje gebyrer og behandler ejere som numre i rækken. 
              Vi startede Sommerdrøm fordi vi selv oplevede frustrationen – og vidste det kunne gøres bedre.
            </p>
            
            <p className="text-primary-foreground/80 leading-relaxed mb-8">
              Med kun <span className="text-accent font-semibold">15% i kommission</span> og en personlig 
              rådgiver til hver ejer, giver vi dig det bedste af begge verdener: Professionel service 
              til en fair pris.
            </p>

            <div className="space-y-4 mb-8">
              {values.map((value, index) => (
                <div key={index} className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center flex-shrink-0">
                    <value.icon className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">{value.title}</h3>
                    <p className="text-sm text-primary-foreground/70">{value.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <Link to="/team">
              <Button variant="gold" className="gap-2">
                Mød teamet bag
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>

          {/* Image */}
          <div className="relative">
            <div className="rounded-2xl overflow-hidden shadow-2xl">
              <img 
                src={heroHouse} 
                alt="Sommerhus i naturskønne omgivelser" 
                className="w-full h-[400px] md:h-[500px] object-cover"
              />
            </div>
            
            {/* Floating stats */}
            <div className="absolute -bottom-6 -left-6 bg-background rounded-xl p-6 shadow-xl">
              <div className="text-3xl font-bold text-accent mb-1">150+</div>
              <div className="text-sm text-muted-foreground">Tilfredse ejere</div>
            </div>
            
            <div className="absolute -top-6 -right-6 bg-accent rounded-xl p-6 shadow-xl text-primary">
              <div className="text-3xl font-bold mb-1">15%</div>
              <div className="text-sm">Kommission</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
