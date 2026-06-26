import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { OwnerLayout } from '@/components/layout/OwnerLayout';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash2, MapPin, Users, Bed } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Property {
  id: string;
  title: string;
  address: string;
  region: string;
  capacity: number;
  bedrooms: number;
  status: string;
  images: string[];
  price_per_night: number | null;
}

export default function OwnerProperties() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProperties();
  }, [user]);

  const loadProperties = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      toast({ title: 'Fejl', description: 'Kunne ikke indlæse ejendomme', variant: 'destructive' });
    } else {
      setProperties(data || []);
    }
    setLoading(false);
  };

  const deleteProperty = async (id: string) => {
    const { error } = await supabase.from('properties').delete().eq('id', id);

    if (error) {
      toast({ title: 'Fejl', description: 'Kunne ikke slette ejendom', variant: 'destructive' });
    } else {
      toast({ title: 'Slettet', description: 'Ejendommen er slettet.' });
      loadProperties();
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

  return (
    <OwnerLayout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-primary">Mine sommerhuse</h1>
          <p className="text-muted-foreground">Administrer dine ejendomme</p>
        </div>
        <Link to="/owner/properties/new">
          <Button variant="gold">
            <Plus className="w-4 h-4 mr-2" />
            Tilføj sommerhus
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Indlæser...</div>
      ) : properties.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-12 text-center">
          <h2 className="font-display text-xl font-semibold text-primary mb-2">Ingen sommerhuse endnu</h2>
          <p className="text-muted-foreground mb-6">Opret dit første sommerhus for at komme i gang med udlejning.</p>
          <Link to="/owner/properties/new">
            <Button variant="gold">
              <Plus className="w-4 h-4 mr-2" />
              Opret sommerhus
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-6">
          {properties.map(property => (
            <div key={property.id} className="bg-card rounded-xl border border-border overflow-hidden flex flex-col md:flex-row">
              <div className="w-full md:w-64 h-48 md:h-auto bg-muted flex-shrink-0">
                {property.images && property.images[0] ? (
                  <img src={property.images[0]} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    Intet billede
                  </div>
                )}
              </div>
              <div className="flex-1 p-6">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-display text-xl font-semibold text-primary">{property.title}</h3>
                    <div className="flex items-center gap-2 text-muted-foreground text-sm mt-1">
                      <MapPin className="w-4 h-4" />
                      {property.address} • {property.region}
                    </div>
                  </div>
                  {getStatusBadge(property.status)}
                </div>

                <div className="flex items-center gap-6 text-sm text-muted-foreground mb-4">
                  <span className="flex items-center gap-1">
                    <Users className="w-4 h-4" /> {property.capacity} personer
                  </span>
                  <span className="flex items-center gap-1">
                    <Bed className="w-4 h-4" /> {property.bedrooms} soveværelser
                  </span>
                  {property.price_per_night && (
                    <span className="text-accent font-medium">
                      {property.price_per_night.toLocaleString('da-DK')} kr/nat
                    </span>
                  )}
                </div>

                <div className="flex gap-2">
                  <Link to={`/owner/properties/${property.id}/edit`}>
                    <Button variant="outline" size="sm">
                      <Edit className="w-4 h-4 mr-1" /> Rediger
                    </Button>
                  </Link>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                        <Trash2 className="w-4 h-4 mr-1" /> Slet
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Er du sikker?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Denne handling kan ikke fortrydes. Ejendommen og alle tilknyttede data vil blive slettet permanent.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Annuller</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteProperty(property.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                          Slet
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </OwnerLayout>
  );
}
