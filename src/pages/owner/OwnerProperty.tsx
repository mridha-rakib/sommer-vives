import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { OwnerLayout } from '@/components/layout/OwnerLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Building2, MapPin, Users, BedDouble, Bath, Clock, Key, Sparkles, Globe, Image, ChevronRight } from 'lucide-react';

export default function OwnerProperty() {
  const { user } = useAuth();
  const [property, setProperty] = useState<any>(null);
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    const [propRes, listRes] = await Promise.all([
      supabase.from('properties').select('*').eq('owner_id', user.id).limit(1).single(),
      supabase.from('listings').select('*').eq('owner_id', user.id),
    ]);
    setProperty(propRes.data);
    setListings(listRes.data || []);
    setLoading(false);
  };

  const statusMap: Record<string, { label: string; className: string }> = {
    draft: { label: 'Kladde', className: 'bg-amber-400/15 text-amber-400 border-amber-400/20' },
    published: { label: 'Aktiv', className: 'bg-emerald-400/15 text-emerald-400 border-emerald-400/20' },
    inactive: { label: 'Inaktiv', className: 'bg-muted text-muted-foreground border-border' },
  };

  if (loading) {
    return (
      <OwnerLayout>
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      </OwnerLayout>
    );
  }

  if (!property) {
    return (
      <OwnerLayout>
        <div className="text-center py-20">
          <Building2 className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <h2 className="font-display text-xl font-semibold text-foreground mb-2">Ingen bolig registreret</h2>
          <p className="text-muted-foreground text-sm mb-6">Opret din bolig via onboarding-flowet for at komme i gang.</p>
          <Button variant="gold" asChild><a href="/kom-i-gang">Kom i gang</a></Button>
        </div>
      </OwnerLayout>
    );
  }

  const status = statusMap[property.status] || statusMap.draft;

  return (
    <OwnerLayout>
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">{property.title}</h1>
            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
              <MapPin className="w-3.5 h-3.5" />
              {property.address}, {property.region}
            </div>
          </div>
          <Badge variant="outline" className={status.className}>{status.label}</Badge>
        </div>

        {/* Property overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { icon: Users, label: 'Kapacitet', value: `${property.capacity} gæster` },
            { icon: BedDouble, label: 'Soveværelser', value: property.bedrooms },
            { icon: Bath, label: 'Badeværelser', value: property.bathrooms },
            { icon: Clock, label: 'Check-in', value: '15:00' },
          ].map(item => (
            <Card key={item.label}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <item.icon className="w-4 h-4 text-muted-foreground" />
                </div>
                <div>
                  <div className="text-[11px] text-muted-foreground uppercase tracking-wide">{item.label}</div>
                  <div className="text-sm font-semibold text-foreground">{item.value}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Photos */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Billeder</CardTitle>
              <Badge variant="outline" className="text-[10px]">
                <Image className="w-3 h-3 mr-1" />
                {property.images?.length || 0} billeder
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {property.images && property.images.length > 0 ? (
              <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                {property.images.slice(0, 10).map((img: string, i: number) => (
                  <div key={i} className="aspect-[4/3] rounded-lg bg-muted overflow-hidden">
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-sm text-muted-foreground">
                Ingen billeder uploadet endnu
              </div>
            )}
          </CardContent>
        </Card>

        {/* Details grid */}
        <div className="grid md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Beskrivelse</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {property.description || 'Ingen beskrivelse tilføjet endnu.'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Faciliteter</CardTitle>
            </CardHeader>
            <CardContent>
              {property.amenities && property.amenities.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {property.amenities.map((a: string) => (
                    <Badge key={a} variant="secondary" className="text-xs">{a}</Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Ingen faciliteter tilføjet.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Husregler</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                {property.house_rules || 'Ingen husregler tilføjet.'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Prissætning</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Pris pr. nat</span>
                <span className="font-medium text-foreground">{property.price_per_night?.toLocaleString('da-DK') || '—'} kr</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Ugepris</span>
                <span className="font-medium text-foreground">{property.price_per_week?.toLocaleString('da-DK') || '—'} kr</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Rengøring</span>
                <span className="font-medium text-foreground">{property.cleaning_fee?.toLocaleString('da-DK') || '—'} kr</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Listings / Portal distribution */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Globe className="w-4 h-4 text-accent" />
                Dine listings
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {listings.length > 0 ? (
              <div className="space-y-2">
                {listings.map(listing => (
                  <div key={listing.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <div>
                      <div className="text-sm font-medium text-foreground">{listing.name}</div>
                      <div className="text-xs text-muted-foreground">{listing.region} · {listing.max_guests} gæster</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={listing.is_active ? 'bg-emerald-400/15 text-emerald-400 border-emerald-400/20' : ''}>
                        {listing.is_active ? 'Aktiv' : 'Inaktiv'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-6">
                Ingen listings oprettet endnu. SommerVibes opretter din listing efter aftaleunderskrift.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </OwnerLayout>
  );
}
