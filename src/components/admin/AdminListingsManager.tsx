import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Home, MapPin, Users, Pencil } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ListingEditor } from './ListingEditor';
import { formatDKK } from '@/lib/pricing';

interface ListingRow {
  id: string; slug: string; name: string; description: string | null;
  address: string | null; city: string | null; max_guests: number; bedrooms: number | null; bathrooms: number | null;
  base_price_per_night: number; cleaning_fee: number | null;
  weekend_price_per_night: number | null;
  check_in_time: string | null; check_out_time: string | null;
  is_active: boolean; amenities: string[] | null; house_rules: string | null;
  practical_info: string | null; images: string[] | null; hero_image: string | null;
  currency: string; region: string | null; owner_id: string;
  min_nights: number | null; max_nights: number | null;
  checkin_info: string | null; checkout_info: string | null;
  property_type: string | null; tagline: string | null;
}

export function AdminListingsManager() {
  const [listings, setListings] = useState<ListingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);

  const fetchListings = async () => {
    setLoading(true);
    const { data } = await supabase.from('listings').select('*').order('sort_order');
    if (data) setListings(data as unknown as ListingRow[]);
    setLoading(false);
  };

  useEffect(() => { fetchListings(); }, []);

  const editingListing = listings.find((l) => l.id === editingId);

  if (editingListing) {
    return (
      <ListingEditor
        listing={editingListing}
        onBack={() => { setEditingId(null); fetchListings(); }}
      />
    );
  }

  if (loading) return <div className="flex items-center justify-center py-20 text-muted-foreground gap-2"><Loader2 className="h-5 w-5 animate-spin" /> Henter listings...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-semibold text-foreground">Listings</h2>
        <p className="text-sm text-muted-foreground mt-1">Klik for at redigere en listing</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {listings.map((listing) => (
          <button
            key={listing.id}
            onClick={() => setEditingId(listing.id)}
            className="bg-card border border-border rounded-xl overflow-hidden text-left hover:border-primary/50 hover:shadow-md transition-all group relative"
          >
            <div className="h-40 bg-muted relative overflow-hidden">
              {(listing.hero_image || listing.images?.[0]) ? (
                <img src={listing.hero_image || listing.images![0]} alt={listing.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              ) : (
                <div className="w-full h-full flex items-center justify-center"><Home className="h-10 w-10 text-muted-foreground/30" /></div>
              )}
              <div className="absolute top-3 right-3 flex gap-1.5">
                <Badge variant={listing.is_active ? 'default' : 'secondary'} className="text-[10px]">
                  {listing.is_active ? 'Aktiv' : 'Inaktiv'}
                </Badge>
              </div>
            </div>
            <div className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-lg font-semibold text-foreground">{listing.name}</h3>
                <Pencil className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              {listing.address && <p className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" /> {listing.address}</p>}
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {listing.max_guests} gæster</span>
                <span>{listing.bedrooms || 0} soveværelser</span>
                <span>{listing.bathrooms || 0} bad</span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-border">
                <span className="text-sm font-medium text-primary">{formatDKK(listing.base_price_per_night)} / nat</span>
                <span className="text-xs text-muted-foreground">Rengøring: {formatDKK(listing.cleaning_fee || 0)}</span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
