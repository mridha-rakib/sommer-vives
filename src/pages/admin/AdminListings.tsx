import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Globe, Check, X, MapPin } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

interface Property {
  id: string;
  title: string;
  region: string;
  status: string;
  images: string[];
}

interface PortalListing {
  id: string;
  property_id: string;
  portal_name: string;
  is_active: boolean;
}

const PORTALS = ['Airbnb', 'Booking.com', 'HomeAway', 'Feriepartner', 'DanCenter'];

export default function AdminListings() {
  const { toast } = useToast();
  const [properties, setProperties] = useState<Property[]>([]);
  const [listings, setListings] = useState<Record<string, PortalListing[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    // Load published properties
    const { data: props } = await supabase
      .from('properties')
      .select('id, title, region, status, images')
      .eq('status', 'published')
      .order('title');

    setProperties(props || []);

    // Load portal listings
    const propertyIds = props?.map(p => p.id) || [];
    if (propertyIds.length > 0) {
      const { data: listingsData } = await supabase
        .from('portal_listings')
        .select('*')
        .in('property_id', propertyIds);

      const listingsMap: Record<string, PortalListing[]> = {};
      listingsData?.forEach(l => {
        if (!listingsMap[l.property_id]) listingsMap[l.property_id] = [];
        listingsMap[l.property_id].push(l);
      });
      setListings(listingsMap);
    }

    setLoading(false);
  };

  const togglePortal = async (propertyId: string, portalName: string, isCurrentlyActive: boolean) => {
    const existing = listings[propertyId]?.find(l => l.portal_name === portalName);

    if (existing) {
      // Update existing
      const { error } = await supabase
        .from('portal_listings')
        .update({ is_active: !isCurrentlyActive })
        .eq('id', existing.id);

      if (error) {
        toast({ title: 'Fejl', description: error.message, variant: 'destructive' });
        return;
      }
    } else {
      // Create new
      const { error } = await supabase
        .from('portal_listings')
        .insert({ property_id: propertyId, portal_name: portalName, is_active: true });

      if (error) {
        toast({ title: 'Fejl', description: error.message, variant: 'destructive' });
        return;
      }
    }

    toast({ title: 'Opdateret', description: `Portal ${isCurrentlyActive ? 'deaktiveret' : 'aktiveret'}.` });
    loadData();
  };

  const isPortalActive = (propertyId: string, portalName: string) => {
    const listing = listings[propertyId]?.find(l => l.portal_name === portalName);
    return listing?.is_active || false;
  };

  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-primary">Annoncer</h1>
        <p className="text-muted-foreground">Administrer hvilke portaler ejendomme er listet på</p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Indlæser...</div>
      ) : properties.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-12 text-center">
          <Globe className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Ingen publicerede ejendomme at vise.</p>
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left p-4 font-medium text-muted-foreground">Ejendom</th>
                  {PORTALS.map(portal => (
                    <th key={portal} className="text-center p-4 font-medium text-muted-foreground">
                      {portal}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {properties.map(property => (
                  <tr key={property.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-16 h-12 rounded bg-muted flex-shrink-0 overflow-hidden">
                          {property.images?.[0] && (
                            <img src={property.images[0]} alt="" className="w-full h-full object-cover" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-primary">{property.title}</div>
                          <div className="text-xs text-muted-foreground flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {property.region}
                          </div>
                        </div>
                      </div>
                    </td>
                    {PORTALS.map(portal => {
                      const isActive = isPortalActive(property.id, portal);
                      return (
                        <td key={portal} className="p-4 text-center">
                          <button
                            onClick={() => togglePortal(property.id, portal, isActive)}
                            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                              isActive
                                ? 'bg-green-100 text-green-600 hover:bg-green-200'
                                : 'bg-muted text-muted-foreground hover:bg-muted/80'
                            }`}
                          >
                            {isActive ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
