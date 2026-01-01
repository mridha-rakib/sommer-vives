import { Percent, Globe, Sparkles, Clock, HeadphonesIcon, Users } from 'lucide-react';

const valueProps = [
  {
    icon: Percent,
    title: 'Lav kommission',
    description: 'Kun 15% i kommission – behold mere af din indtjening. Gæster betaler kun 5% servicegebyr.',
  },
  {
    icon: Globe,
    title: 'Bred eksponering',
    description: 'Dit sommerhus vises på de største udlejningsportaler.',
  },
  {
    icon: Sparkles,
    title: 'Professionel rengøring',
    description: 'Vi sørger for professionel rengøring mellem lejere.',
  },
  {
    icon: Clock,
    title: 'Ingen binding',
    description: 'Fleksibel aftale – du kan altid opsige uden varsel.',
  },
  {
    icon: HeadphonesIcon,
    title: 'Vi håndterer alt',
    description: 'Al lejerdialog og administration klares af os.',
  },
  {
    icon: Users,
    title: 'Lokale partnere',
    description: 'Samarbejde med pålidelige, lokale servicepartnere.',
  },
];

export function ValuePropsSection() {
  return (
    <section className="section-padding bg-background">
      <div className="container mx-auto">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-primary mb-4">
            Hvorfor vælge os?
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Læn dig tilbage og lad os klare al administration, lejerdialog og rengøring.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {valueProps.map((prop, index) => (
            <div
              key={index}
              className="group p-6 md:p-8 rounded-xl bg-card border border-border hover:border-accent/50 hover:shadow-elevated transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-colors">
                <prop.icon className="w-6 h-6 text-accent" />
              </div>
              <h3 className="font-display text-xl font-semibold text-primary mb-2">
                {prop.title}
              </h3>
              <p className="text-muted-foreground">
                {prop.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
