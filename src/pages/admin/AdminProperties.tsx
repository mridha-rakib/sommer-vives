import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { MapPin, Users, Eye, Check, X, Globe } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Property {
  id: string;
  title: string;
  address: string;
  region: string;
  capacity: number;
  status: string;
  images: string[];
  owner_id: string;
  created_at: string;
}

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
}

const PORTALS = ['Airbnb', 'Booking.com', 'HomeAway', 'Feriepartner', 'DanCenter'];

export default function AdminProperties() {
  const { toast } = useToast();
  const [properties, setProperties] = useState<Property[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    // Load properties
    const { data: props, error } = await supabase
      .from('properties')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast({ title: 'Fejl', description: 'Kunne ikke indlæse ejendomme', variant: 'destructive' });
      return;
    }

    setProperties(props || []);

    // Load profiles for owner names
    const ownerIds = [...new Set(props?.map(p => p.owner_id) || [])];
    if (ownerIds.length > 0) {
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .in('id', ownerIds);

      const profilesMap: Record<string, Profile> = {};
      profilesData?.forEach(p => { profilesMap[p.id] = p; });
      setProfiles(profilesMap);
    }

    setLoading(false);
  };

  const updateStatus = async (propertyId: string, newStatus: string) => {
    const { error } = await supabase
      .from('properties')
      .update({ status: newStatus })
      .eq('id', propertyId);

    if (error) {
      toast({ title: 'Fejl', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Opdateret', description: `Status ændret til ${newStatus}.` });
      loadData();
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      draft: 'bg-muted text-muted-foreground',
      pending: 'bg-accent/20 text-accent',
      published: 'bg-green-100 text-green-700',
      archived: 'bg-destructive/10 text-destructive',
    };
    const labels: Record<string, string> = {
      draft: 'Kladde',
      pending: 'Afventer',
      published: 'Publiceret',
      archived: 'Arkiveret',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || styles.draft}`}>
        {labels[status] || status}
      </span>
    );
  };

  const filteredProperties = filter === 'all' 
    ? properties 
    : properties.filter(p => p.status === filter);

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-primary">Ejendomme</h1>
          <p className="text-muted-foreground">Administrer alle sommerhuse på platformen</p>
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle</SelectItem>
            <SelectItem value="draft">Kladde</SelectItem>
            <SelectItem value="pending">Afventer</SelectItem>
            <SelectItem value="published">Publiceret</SelectItem>
            <SelectItem value="archived">Arkiveret</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Indlæser...</div>
      ) : filteredProperties.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-12 text-center">
          <p className="text-muted-foreground">Ingen ejendomme fundet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredProperties.map(property => (
            <div key={property.id} className="bg-card rounded-xl border border-border overflow-hidden flex flex-col md:flex-row">
              <div className="w-full md:w-48 h-36 bg-muted flex-shrink-0">
                {property.images && property.images[0] ? (
                  <img src={property.images[0]} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
                    Intet billede
                  </div>
                )}
              </div>
              <div className="flex-1 p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-display text-lg font-semibold text-primary">{property.title}</h3>
                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                      <MapPin className="w-3 h-3" />
                      {property.region}
                    </div>
                  </div>
                  {getStatusBadge(property.status)}
                </div>

                <div className="text-sm text-muted-foreground mb-3">
                  Ejer: {profiles[property.owner_id]?.full_name || profiles[property.owner_id]?.email || 'Ukendt'}
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <a href={`/admin/properties/${property.id}/edit`}>Rediger</a>
                  </Button>
                  {property.status === 'pending' && (
                    <>
                      <Button variant="gold" size="sm" onClick={() => updateStatus(property.id, 'published')}>
                        <Check className="w-4 h-4 mr-1" />
                        Godkend
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => updateStatus(property.id, 'draft')}>
                        <X className="w-4 h-4 mr-1" />
                        Afvis
                      </Button>
                    </>
                  )}
                  {property.status === 'published' && (
                    <Button variant="outline" size="sm" onClick={() => updateStatus(property.id, 'archived')}>
                      Arkiver
                    </Button>
                  )}
                  {property.status === 'draft' && (
                    <Button variant="outline" size="sm" onClick={() => updateStatus(property.id, 'pending')}>
                      Send til godkendelse
                    </Button>
                  )}
                  {property.status === 'archived' && (
                    <Button variant="outline" size="sm" onClick={() => updateStatus(property.id, 'published')}>
                      Genaktiver
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
