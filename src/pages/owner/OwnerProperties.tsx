import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { OwnerLayout } from '@/components/layout/OwnerLayout';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash2, Eye, MapPin, Users, Bed, Globe, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { PropertyAIRecommendations } from '@/components/owner/PropertyAIRecommendations';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Property {
  id: string;
  title: string;
  address: string;
  region: string;
  capacity: number;
  bedrooms: number;
  bathrooms: number;
  status: string;
  images: string[];
  price_per_night: number | null;
  price_per_week: number | null;
  description: string | null;
  amenities: string[] | null;
  house_rules: string | null;
}

export default function OwnerProperties() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);

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

  const publishProperty = async (id: string) => {
    setPublishingId(id);
    const { error } = await supabase
      .from('properties')
      .update({ status: 'published' })
      .eq('id', id);
    
    if (error) {
      toast({ title: 'Fejl', description: 'Kunne ikke publicere', variant: 'destructive' });
    } else {
      setShowSuccessDialog(true);
      loadProperties();
    }
    setPublishingId(null);
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
        <div className="space-y-6">
          {properties.map(property => (
            <div key={property.id} className="bg-card rounded-xl border border-border overflow-hidden">
              <div className="flex flex-col md:flex-row">
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

                  <div className="flex flex-wrap gap-2">
                    {property.status === 'draft' && (
                      <Button 
                        variant="gold" 
                        size="sm"
                        onClick={() => publishProperty(property.id)}
                        disabled={publishingId === property.id}
                      >
                        <Globe className="w-4 h-4 mr-1" />
                        {publishingId === property.id ? 'Publicerer...' : 'Offentliggør'}
                      </Button>
                    )}
                    <Button variant="outline" size="sm" onClick={() => setSelectedProperty(property)}>
                      <Sparkles className="w-4 h-4 mr-1" /> AI Anbefalinger
                    </Button>
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
                            Denne handling kan ikke fortrydes.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Annuller</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteProperty(property.id)} className="bg-destructive text-destructive-foreground">
                            Slet
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <Globe className="w-5 h-5" />
              Dit sommerhus er nu live!
            </DialogTitle>
            <DialogDescription className="pt-4 space-y-3">
              <p>Din annonce er nu synlig på vores hjemmeside under "Udlejning".</p>
              <div className="bg-accent/10 rounded-lg p-4 border border-accent/20">
                <p className="font-medium text-primary">Markedsføringsopsætning</p>
                <p className="text-sm mt-1">
                  Der går ca. <strong>1-4 hverdage</strong> før din annonce er fuldendt i vores markedsføringssystem og synlig på alle partnersider (Airbnb, Booking.com, etc.).
                </p>
              </div>
              <p className="text-sm text-muted-foreground">
                Vi kontakter dig, hvis vi har brug for yderligere information.
              </p>
            </DialogDescription>
          </DialogHeader>
          <Button onClick={() => setShowSuccessDialog(false)} variant="gold" className="w-full">
            Forstået
          </Button>
        </DialogContent>
      </Dialog>

      {/* AI Recommendations Dialog */}
      <Dialog open={!!selectedProperty} onOpenChange={() => setSelectedProperty(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedProperty?.title}</DialogTitle>
          </DialogHeader>
          {selectedProperty && <PropertyAIRecommendations property={selectedProperty} />}
        </DialogContent>
      </Dialog>
    </OwnerLayout>
  );
}
