import { Check, X } from 'lucide-react';

const features = [
  { name: 'Lav kommission (20%)', us: true, traditional: false, portals: true },
  { name: '100% fleksibel', us: true, traditional: false, portals: true },
  { name: 'Professionel rengøring', us: true, traditional: true, portals: false },
  { name: 'Ingen binding', us: true, traditional: false, portals: true },
  { name: 'Vi håndterer lejerdialog', us: true, traditional: true, portals: false },
  { name: 'Lokale servicepartnere', us: true, traditional: true, portals: false },
];

function FeatureIcon({ available }: { available: boolean }) {
  return available ? (
    <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center">
      <Check className="w-4 h-4 text-accent" />
    </div>
  ) : (
    <div className="w-6 h-6 rounded-full bg-destructive/10 flex items-center justify-center">
      <X className="w-4 h-4 text-destructive" />
    </div>
  );
}

export function ComparisonSection() {
  return (
    <section className="section-padding bg-cream-dark">
      <div className="container mx-auto">
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-primary mb-4">
            Sammenlign os med andre
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Se hvordan vi adskiller os fra traditionelle bureauer og udlejningsportaler.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-primary/10">
                  <th className="text-left py-4 px-4 font-display text-lg font-semibold text-primary">
                    Feature
                  </th>
                  <th className="text-center py-4 px-4">
                    <div className="inline-flex flex-col items-center">
                      <span className="font-display text-lg font-bold text-accent">
                        SommerhusBureau
                      </span>
                      <span className="text-xs text-muted-foreground">Vores løsning</span>
                    </div>
                  </th>
                  <th className="text-center py-4 px-4">
                    <div className="inline-flex flex-col items-center">
                      <span className="font-display text-lg font-semibold text-primary">
                        Traditionelle bureauer
                      </span>
                      <span className="text-xs text-muted-foreground">Høj kommission</span>
                    </div>
                  </th>
                  <th className="text-center py-4 px-4">
                    <div className="inline-flex flex-col items-center">
                      <span className="font-display text-lg font-semibold text-primary">
                        Udlejningsportaler
                      </span>
                      <span className="text-xs text-muted-foreground">Gør-det-selv</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {features.map((feature, index) => (
                  <tr
                    key={index}
                    className="border-b border-border hover:bg-card/50 transition-colors"
                  >
                    <td className="py-4 px-4 font-medium text-primary">
                      {feature.name}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex justify-center">
                        <FeatureIcon available={feature.us} />
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex justify-center">
                        <FeatureIcon available={feature.traditional} />
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex justify-center">
                        <FeatureIcon available={feature.portals} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
