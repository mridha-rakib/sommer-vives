import { Link } from 'react-router-dom';
import { Waves, Sparkles, Flame, TreePine } from 'lucide-react';

const categories = [
  {
    id: 'pool',
    name: 'Pool huse',
    icon: Waves,
    description: 'Sommerhuse med pool',
    amenity: 'Pool',
  },
  {
    id: 'spa',
    name: 'Spa huse',
    icon: Sparkles,
    description: 'Wellness og afslapning',
    amenity: 'Spa',
  },
  {
    id: 'sauna',
    name: 'Sauna huse',
    icon: Flame,
    description: 'Med sauna og varme',
    amenity: 'Sauna',
  },
  {
    id: 'nature',
    name: 'Skov & natur',
    icon: TreePine,
    description: 'Midt i naturen',
    amenity: 'Skovudsigt',
  },
];

export function CategorySection() {
  return (
    <section className="py-12 bg-muted/30">
      <div className="container mx-auto px-4">
        <h2 className="font-display text-2xl md:text-3xl font-bold text-primary mb-8 text-center">
          Find dit perfekte sommerhus
        </h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {categories.map((category) => (
            <Link
              key={category.id}
              to={`/rentals?category=${category.id}`}
              className="group"
            >
              <div className="bg-card rounded-2xl p-6 text-center transition-all duration-300 hover:shadow-elevated hover:-translate-y-1 border border-border hover:border-accent/30">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                  <category.icon className="w-8 h-8 text-accent" />
                </div>
                <h3 className="font-display text-lg font-semibold text-primary mb-1 group-hover:text-accent transition-colors">
                  {category.name}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {category.description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
