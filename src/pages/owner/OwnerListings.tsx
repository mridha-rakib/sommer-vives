import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { OwnerLayout } from '@/components/layout/OwnerLayout';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Eye, MapPin, Users, Bed, Bath, ToggleLeft, ToggleRight } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

interface Listing {
  id: string;
  name: string;
  slug: string;
  address: string | null;
  region: string | null;
  max_guests: number;
  bedrooms: number | null;
  bathrooms: number | null;
  base_price_per_night: number;
  is_active: boolean;
  hero_image: string | null;
  images: string[] | null;
}

export default function OwnerListings() {
  const { user } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    loadListings();
  }, [user]);

  const loadListings = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('listings')
      .select('id, name, slug, address, region, max_guests, bedrooms, bathrooms, base_price_per_night, is_active, hero_image, images')
      .eq('owner_id', user!.id)
      .order('sort_order');

    if (error) {
      toast.error('Kunne ikke hente listings');
    } else {
      setListings(data || []);
    }
    setLoading(false);
  };

  const toggleActive = async (id: string, currentState: boolean) => {
    const { error } = await supabase
      .from('listings')
      .update({ is_active: !currentState })
      .eq('id', id);

    if (error) {
      toast.error('Kunne ikke opdatere status');
    } else {
      toast.success(!currentState ? 'Listing aktiveret' : 'Listing deaktiveret');
      loadListings();
    }
  };

  const getImage = (listing: Listing) => {
    if (listing.hero_image) return listing.hero_image;
    if (listing.images?.length) return listing.images[0];
    return null;
  };

  return (
    <OwnerLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">Mine listings</h1>
            <p className="text-muted-foreground text-sm mt-1">Administrer dine sommerhuse og udlejninger</p>
          </div>
          <Link to="/owner/listings/new">
            <Button variant="gold" className="gap-2">
              <Plus className="w-4 h-4" />
              Opret ny listing
            </Button>
          </Link>
        </div>

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2">
            {[1, 2].map(i => (
              <div key={i} className="bg-card border border-border rounded-xl h-48 animate-pulse" />
            ))}
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-16 bg-card border border-border rounded-xl">
            <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
              <Bed className="w-8 h-8 text-accent" />
            </div>
            <h3 className="font-display text-lg font-semibold text-foreground mb-2">Ingen listings endnu</h3>
            <p className="text-muted-foreground text-sm mb-6">Opret din første listing for at komme i gang med udlejning.</p>
            <Link to="/owner/listings/new">
              <Button variant="gold" className="gap-2">
                <Plus className="w-4 h-4" />
                Opret listing
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {listings.map(listing => {
              const img = getImage(listing);
              return (
                <div key={listing.id} className="bg-card border border-border rounded-xl overflow-hidden hover:shadow-elevated transition-shadow">
                  {/* Image */}
                  <div className="relative h-40 bg-muted">
                    {img ? (
                      <img src={img} alt={listing.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        <Bed className="w-10 h-10" />
                      </div>
                    )}
                    <div className={`absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-medium ${
                      listing.is_active ? 'bg-accent/90 text-accent-foreground' : 'bg-muted text-muted-foreground'
                    }`}>
                      {listing.is_active ? 'Aktiv' : 'Inaktiv'}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4 space-y-3">
                    <div>
                      <h3 className="font-display font-semibold text-foreground">{listing.name}</h3>
                      {listing.address && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                          <MapPin className="w-3 h-3" /> {listing.address}
                        </p>
                      )}
                    </div>

                    <div className="flex gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {listing.max_guests} gæster</span>
                      <span className="flex items-center gap-1"><Bed className="w-3 h-3" /> {listing.bedrooms || 0} soveværelser</span>
                      <span className="flex items-center gap-1"><Bath className="w-3 h-3" /> {listing.bathrooms || 0} bad</span>
                    </div>

                    <div className="text-sm font-semibold text-accent">
                      {listing.base_price_per_night.toLocaleString('da-DK')} kr./nat
                    </div>

                    <div className="flex gap-2 pt-2 border-t border-border">
                      <Link to={`/owner/listings/${listing.id}/edit`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full gap-1 text-xs">
                          <Edit className="w-3 h-3" /> Rediger
                        </Button>
                      </Link>
                      <Link to={`/listing/${listing.slug}`} target="_blank" className="flex-1">
                        <Button variant="outline" size="sm" className="w-full gap-1 text-xs">
                          <Eye className="w-3 h-3" /> Se listing
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleActive(listing.id, listing.is_active)}
                        className="text-xs"
                      >
                        {listing.is_active ? <ToggleRight className="w-4 h-4 text-accent" /> : <ToggleLeft className="w-4 h-4 text-muted-foreground" />}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </OwnerLayout>
  );
}
