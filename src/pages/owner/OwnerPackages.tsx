import { useState } from 'react';
import { OwnerLayout } from '@/components/layout/OwnerLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Check, Camera, Plane, Sparkles, Package, Clock, Star, TrendingUp } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';

interface ServicePackage {
  id: string;
  name: string;
  description: string | null;
  price: number;
  features: string[];
  category: string;
  is_active: boolean;
}

interface Property {
  id: string;
  title: string;
}

export default function OwnerPackages() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedPackage, setSelectedPackage] = useState<ServicePackage | null>(null);
  const [selectedProperty, setSelectedProperty] = useState<string>('');
  const [isPurchaseOpen, setIsPurchaseOpen] = useState(false);

  const { data: packages = [], isLoading: packagesLoading } = useQuery({
    queryKey: ['service-packages'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_packages')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      if (error) throw error;
      return data.map(p => ({
        ...p,
        features: Array.isArray(p.features) ? p.features : JSON.parse(p.features as string || '[]')
      })) as ServicePackage[];
    },
  });

  const { data: properties = [] } = useQuery({
    queryKey: ['owner-properties', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('properties')
        .select('id, title')
        .eq('owner_id', user.id);
      if (error) throw error;
      return data as Property[];
    },
    enabled: !!user?.id,
  });

  const { data: purchases = [] } = useQuery({
    queryKey: ['package-purchases', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('package_purchases')
        .select('*, service_packages(name), properties(title)')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const purchaseMutation = useMutation({
    mutationFn: async () => {
      if (!selectedPackage || !user?.id) throw new Error('Manglende data');
      const { error } = await supabase.from('package_purchases').insert({
        owner_id: user.id,
        property_id: selectedProperty || null,
        package_id: selectedPackage.id,
        amount: selectedPackage.price,
        status: 'pending',
        payment_status: selectedPackage.price === 0 ? 'paid' : 'pending',
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['package-purchases'] });
      toast.success('Pakke tilføjet! Vi kontakter dig snarest.');
      setIsPurchaseOpen(false);
      setSelectedPackage(null);
      setSelectedProperty('');
    },
    onError: () => {
      toast.error('Kunne ikke bestille pakken. Prøv igen.');
    },
  });

  const marketingPackages = packages.filter(p => p.category === 'marketing');
  const photoPackages = packages.filter(p => p.category === 'photo');

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'marketing': return <TrendingUp className="w-5 h-5" />;
      case 'photo': return <Camera className="w-5 h-5" />;
      default: return <Package className="w-5 h-5" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-accent/20 text-accent',
      processing: 'bg-blue-100 text-blue-700',
      completed: 'bg-green-100 text-green-700',
      cancelled: 'bg-destructive/10 text-destructive',
    };
    const labels: Record<string, string> = {
      pending: 'Afventer',
      processing: 'Under behandling',
      completed: 'Fuldført',
      cancelled: 'Annulleret',
    };
    return (
      <Badge className={styles[status] || styles.pending}>
        {labels[status] || status}
      </Badge>
    );
  };

  const handlePurchase = (pkg: ServicePackage) => {
    setSelectedPackage(pkg);
    setIsPurchaseOpen(true);
  };

  return (
    <OwnerLayout>
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-primary">Tilkøb & Pakker</h1>
        <p className="text-muted-foreground">Boost dit sommerhus med professionelle services</p>
      </div>

      <Tabs defaultValue="packages" className="space-y-6">
        <TabsList>
          <TabsTrigger value="packages">Tilgængelige pakker</TabsTrigger>
          <TabsTrigger value="purchases">Mine køb</TabsTrigger>
        </TabsList>

        <TabsContent value="packages" className="space-y-8">
          {/* Marketing Packages */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-accent" />
              <h2 className="font-display text-xl font-semibold text-primary">Markedsføringspakker</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {marketingPackages.map((pkg, idx) => (
                <Card key={pkg.id} className={`relative overflow-hidden ${idx === 1 ? 'ring-2 ring-accent' : ''}`}>
                  {idx === 1 && (
                    <div className="absolute top-0 right-0 bg-accent text-primary text-xs font-bold px-3 py-1">
                      Populær
                    </div>
                  )}
                  <CardHeader>
                    <CardTitle className="font-display">{pkg.name}</CardTitle>
                    <CardDescription>{pkg.description}</CardDescription>
                    <div className="pt-2">
                      {pkg.price === 0 ? (
                        <span className="text-2xl font-bold text-accent">Gratis</span>
                      ) : (
                        <>
                          <span className="text-2xl font-bold text-primary">{pkg.price.toLocaleString('da-DK')}</span>
                          <span className="text-muted-foreground"> kr</span>
                        </>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 mb-6">
                      {pkg.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <Check className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Button 
                      onClick={() => handlePurchase(pkg)} 
                      className="w-full"
                      variant={idx === 1 ? 'gold' : 'default'}
                    >
                      {pkg.price === 0 ? 'Aktiver gratis' : 'Vælg pakke'}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Photo Packages */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Camera className="w-5 h-5 text-accent" />
              <h2 className="font-display text-xl font-semibold text-primary">Foto & Video</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {photoPackages.map((pkg, idx) => (
                <Card key={pkg.id} className={`relative overflow-hidden ${idx === 2 ? 'ring-2 ring-accent' : ''}`}>
                  {idx === 2 && (
                    <div className="absolute top-0 right-0 bg-accent text-primary text-xs font-bold px-3 py-1">
                      Bedste værdi
                    </div>
                  )}
                  <CardHeader>
                    <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center mb-2">
                      {idx === 1 ? <Plane className="w-5 h-5 text-accent" /> : <Camera className="w-5 h-5 text-accent" />}
                    </div>
                    <CardTitle className="font-display">{pkg.name}</CardTitle>
                    <CardDescription>{pkg.description}</CardDescription>
                    <div className="pt-2">
                      <span className="text-2xl font-bold text-primary">{pkg.price.toLocaleString('da-DK')}</span>
                      <span className="text-muted-foreground"> kr</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 mb-6">
                      {pkg.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <Check className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Button 
                      onClick={() => handlePurchase(pkg)} 
                      className="w-full"
                      variant={idx === 2 ? 'gold' : 'outline'}
                    >
                      Bestil nu
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="purchases">
          <Card>
            <CardHeader>
              <CardTitle>Mine bestillinger</CardTitle>
              <CardDescription>Oversigt over dine købte pakker og services</CardDescription>
            </CardHeader>
            <CardContent>
              {purchases.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Du har ikke købt nogen pakker endnu.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {purchases.map((purchase: any) => (
                    <div key={purchase.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                          <Sparkles className="w-5 h-5 text-accent" />
                        </div>
                        <div>
                          <div className="font-medium">{purchase.service_packages?.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {purchase.properties?.title || 'Alle ejendomme'}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-semibold">{purchase.amount.toLocaleString('da-DK')} kr</span>
                        {getStatusBadge(purchase.status)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Purchase Dialog */}
      <Dialog open={isPurchaseOpen} onOpenChange={setIsPurchaseOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bestil {selectedPackage?.name}</DialogTitle>
            <DialogDescription>
              {selectedPackage?.price === 0 
                ? 'Aktiver denne gratis pakke for dit sommerhus.'
                : 'Vælg hvilken ejendom pakken skal tilknyttes.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {properties.length > 0 && (
              <div>
                <label className="text-sm font-medium mb-2 block">Vælg ejendom (valgfrit)</label>
                <Select value={selectedProperty} onValueChange={setSelectedProperty}>
                  <SelectTrigger>
                    <SelectValue placeholder="Alle ejendomme" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Alle ejendomme</SelectItem>
                    {properties.map(property => (
                      <SelectItem key={property.id} value={property.id}>
                        {property.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <span className="font-medium">{selectedPackage?.name}</span>
                <span className="font-bold">
                  {selectedPackage?.price === 0 ? 'Gratis' : `${selectedPackage?.price.toLocaleString('da-DK')} kr`}
                </span>
              </div>
            </div>

            {selectedPackage?.price !== 0 && (
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Vi kontakter dig inden for 1-2 hverdage for at aftale næste skridt.
              </p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPurchaseOpen(false)}>
              Annuller
            </Button>
            <Button 
              variant="gold" 
              onClick={() => purchaseMutation.mutate()}
              disabled={purchaseMutation.isPending}
            >
              {purchaseMutation.isPending ? 'Bestiller...' : 'Bekræft bestilling'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </OwnerLayout>
  );
}
