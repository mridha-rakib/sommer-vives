import { OwnerLayout } from '@/components/layout/OwnerLayout';
import { Card, CardContent } from '@/components/ui/card';
import { MessageCircle, Bell, Users, Wrench } from 'lucide-react';

const categories = [
  { icon: MessageCircle, label: 'SommerVibes Support', desc: 'Direkte kommunikation med dit team', count: 0 },
  { icon: Bell, label: 'Systemopdateringer', desc: 'Bookinger, betalinger og statusændringer', count: 0 },
  { icon: Users, label: 'Gæstebeskeder', desc: 'Forespørgsler og gæstekommunikation', count: 0 },
  { icon: Wrench, label: 'Driftsbeskeder', desc: 'Rengøring, vedligehold og logistik', count: 0 },
];

export default function OwnerMessages() {
  return (
    <OwnerLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Beskeder</h1>
          <p className="text-sm text-muted-foreground mt-1">Al din kommunikation samlet ét sted</p>
        </div>

        <div className="grid md:grid-cols-2 gap-3">
          {categories.map(cat => (
            <Card key={cat.label} className="hover:border-accent/20 transition-colors cursor-pointer">
              <CardContent className="p-5 flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <cat.icon className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-foreground">{cat.label}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{cat.desc}</div>
                </div>
                {cat.count > 0 && (
                  <div className="w-5 h-5 rounded-full bg-accent text-background text-[10px] font-bold flex items-center justify-center">
                    {cat.count}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardContent className="py-16 text-center">
            <MessageCircle className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">Ingen nye beskeder</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Beskeder fra SommerVibes og gæster vises her</p>
          </CardContent>
        </Card>
      </div>
    </OwnerLayout>
  );
}
