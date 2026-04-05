import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { OwnerLayout } from '@/components/layout/OwnerLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Building2, MapPin, Users, BedDouble, Bath, Globe, Image } from 'lucide-react';

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

  if (loading) {
    return (
      <OwnerLayout>
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-[hsl(var(--gold))] border-t-transparent rounded-full animate-spin" />
        </div>
      </OwnerLayout>
    );
  }

  if (!property) {
    return (
      <OwnerLayout>
        <div className="text-center py-20 max-w-md mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-muted/40 flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-7 h-7 text-muted-foreground/30" />
          </div>
          <h2 className="font-display text-xl font-semibold text-foreground mb-2">Ingen bolig registreret</h2>
          <p className="text-muted-foreground text-sm mb-6">Opret din bolig via onboarding-flowet for at komme i gang.</p>
          <Button variant="gold" asChild><a href="/kom-i-gang">Kom i gang</a></Button>
        </div>
      </OwnerLayout>
    );
  }

  const statusMap: Record<string, { label: string; className: string }> = {
    draft: { label: 'Kladde', className: 'bg-amber-400/15 text-amber-400 border-amber-400/20' },
    published: { label: 'Aktiv', className: 'bg-emerald-400/15 text-emerald-400 border-emerald-400/20' },
    inactive: { label: 'Inaktiv', className: 'bg-muted text-muted-foreground border-border' },
  };
  const status = statusMap[property.status] || statusMap.draft;

  return (
    <OwnerLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Hero */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[hsl(var(--gold-dark)/0.1)] via-card to-card border border-border/60 p-6">
          <div className="flex items-start justify-between">
            <div>
              <Badge variant="outline" className={`text-[10px] mb-3 ${status.className}`}>{status.label}</Badge>
              <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">{property.title}</h1>
              {property.address && (
                <div className="flex items-center gap-1.5 mt-2 text-sm text-muted-foreground">
                  <MapPin className="w-3.5 h-3.5" />
                  {property.address}{property.region ? `, ${property.region}` : ''}
                </div>
              )}
            </div>
          </div>

          {/* Quick stats */}
          <div className="flex flex-wrap gap-4 mt-5 pt-4 border-t border-border/40">
            {[
              { icon: Users, value: `${property.capacity || '—'} gæster` },
              { icon: BedDouble, value: `${property.bedrooms || '—'} soveværelser` },
              { icon: Bath, value: `${property.bathrooms || '—'} badeværelser` },
            ].map((stat, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                <stat.icon className="w-4 h-4" />
                <span>{stat.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Photos */}
        {property.images && property.images.length > 0 && (
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-foreground">Billeder</h3>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Image className="w-3 h-3" /> {property.images.length}
                </span>
              </div>
              <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                {property.images.slice(0, 10).map((img: string, i: number) => (
                  <div key={i} className="aspect-[4/3] rounded-xl bg-muted overflow-hidden">
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Description & Amenities */}
        <div className="grid md:grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-5">
              <h3 className="text-sm font-semibold text-foreground mb-3">Beskrivelse</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {property.description || 'Ingen beskrivelse tilføjet endnu.'}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <h3 className="text-sm font-semibold text-foreground mb-3">Faciliteter</h3>
              {property.amenities && property.amenities.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {property.amenities.map((a: string) => (
                    <Badge key={a} variant="secondary" className="text-xs rounded-lg">{a}</Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Ingen faciliteter tilføjet.</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Listings */}
        {listings.length > 0 && (
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <Globe className="w-4 h-4 text-[hsl(var(--gold-light))]" />
                <h3 className="text-sm font-semibold text-foreground">Dine listings</h3>
              </div>
              <div className="space-y-2">
                {listings.map(listing => (
                  <div key={listing.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
                    <div>
                      <div className="text-sm font-medium text-foreground">{listing.name}</div>
                      <div className="text-xs text-muted-foreground">{listing.region} · {listing.max_guests} gæster</div>
                    </div>
                    <Badge variant="outline" className={`text-[10px] ${listing.is_active ? 'bg-emerald-400/15 text-emerald-400 border-emerald-400/20' : ''}`}>
                      {listing.is_active ? 'Aktiv' : 'Inaktiv'}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Pricing */}
        <Card>
          <CardContent className="p-5">
            <h3 className="text-sm font-semibold text-foreground mb-3">Prissætning</h3>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Pr. nat', value: property.price_per_night },
                { label: 'Ugepris', value: property.price_per_week },
                { label: 'Rengøring', value: property.cleaning_fee },
              ].map(item => (
                <div key={item.label} className="text-center p-3 rounded-xl bg-muted/30">
                  <div className="text-xs text-muted-foreground mb-1">{item.label}</div>
                  <div className="text-base font-bold text-foreground">
                    {item.value ? `${item.value.toLocaleString('da-DK')} kr` : '—'}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </OwnerLayout>
  );
}
