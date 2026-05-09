import { useState } from 'react';
import { OwnerLayout } from '@/components/layout/OwnerLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Check, Camera, Plane, Sparkles, Package, Clock, TrendingUp, Loader2, CreditCard, Shield } from 'lucide-react';
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
  const [paying, setPaying] = useState(false);

  const { data: packages = [] } = useQuery({
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
      const { data, error } = await supabase.from('properties').select('id, title').eq('owner_id', user.id);
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

  const handlePurchase = (pkg: ServicePackage) => {
    setSelectedPackage(pkg);
    setIsPurchaseOpen(true);
  };

  const handleCheckout = async () => {
    if (!selectedPackage || !user?.id) return;

    if (selectedPackage.price === 0) {
      // Free package — just insert
      const { error } = await supabase.from('package_purchases').insert({
        owner_id: user.id,
        property_id: selectedProperty && selectedProperty !== 'all' ? selectedProperty : null,
        package_id: selectedPackage.id,
        amount: 0,
        status: 'completed',
        payment_status: 'paid',
      });
      if (error) {
        toast.error('Kunne ikke aktivere pakken.');
        return;
      }
      queryClient.invalidateQueries({ queryKey: ['package-purchases'] });
      toast.success('Pakken er aktiveret!');
      setIsPurchaseOpen(false);
      return;
    }

    setPaying(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-addon-checkout', {
        body: {
          items: [{
            name: selectedPackage.name,
            description: selectedPackage.description || '',
            price: selectedPackage.price,
            quantity: 1,
            itemType: 'service_package',
            referenceId: selectedPackage.id,
          }],
          userType: 'owner',
          successUrl: `${window.location.origin}/owner/packages?payment=success`,
          cancelUrl: `${window.location.origin}/owner/packages?payment=cancelled`,
        },
      });

      if (error || !data?.url) throw new Error('Checkout failed');

      // Also create package_purchase record
      await supabase.from('package_purchases').insert({
        owner_id: user.id,
        property_id: selectedProperty && selectedProperty !== 'all' ? selectedProperty : null,
        package_id: selectedPackage.id,
        amount: selectedPackage.price,
        status: 'pending',
        payment_status: 'pending',
      });

      window.location.href = data.url;
    } catch {
      toast.error('Kunne ikke oprette betaling. Prøv igen.');
      setPaying(false);
    }
  };

  // Payment result from URL
  useState(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('payment') === 'success') {
      toast.success('Betaling gennemført!');
      window.history.replaceState({}, '', '/owner/packages');
      queryClient.invalidateQueries({ queryKey: ['package-purchases'] });
    } else if (params.get('payment') === 'cancelled') {
      toast.error('Betaling annulleret.');
      window.history.replaceState({}, '', '/owner/packages');
    }
  });

  const marketingPackages = packages.filter(p => p.category === 'marketing');
  const photoPackages = packages.filter(p => p.category === 'photo');
  const otherPackages = packages.filter(p => !['marketing', 'photo'].includes(p.category));

  const getCategoryIcon = (category: string, idx: number) => {
    if (category === 'photo' && idx === 1) return <Plane className="w-5 h-5 text-accent" />;
    if (category === 'photo') return <Camera className="w-5 h-5 text-accent" />;
    if (category === 'marketing') return <TrendingUp className="w-5 h-5 text-accent" />;
    return <Package className="w-5 h-5 text-accent" />;
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, { className: string; label: string }> = {
      pending: { className: 'bg-accent/20 text-accent', label: 'Afventer' },
      processing: { className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', label: 'Under behandling' },
      completed: { className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', label: 'Fuldført' },
      cancelled: { className: 'bg-destructive/10 text-destructive', label: 'Annulleret' },
    };
    const s = map[status] || map.pending;
    return <Badge className={s.className}>{s.label}</Badge>;
  };

  const PackageCard = ({ pkg, idx, highlighted }: { pkg: ServicePackage; idx: number; highlighted?: boolean }) => (
    <Card className={`relative overflow-hidden transition-all hover:shadow-lg ${highlighted ? 'ring-2 ring-accent' : ''}`}>
      {highlighted && (
        <div className="absolute top-0 right-0 bg-accent text-primary text-xs font-bold px-3 py-1 rounded-bl-lg">
          Populær
        </div>
      )}
      <CardHeader>
        <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center mb-2">
          {getCategoryIcon(pkg.category, idx)}
        </div>
        <CardTitle className="font-display">{pkg.name}</CardTitle>
        <CardDescription>{pkg.description}</CardDescription>
        <div className="pt-2">
          {pkg.price === 0 ? (
            <span className="text-2xl font-bold text-accent">Gratis</span>
          ) : (
            <>
              <span className="text-2xl font-bold text-foreground">{pkg.price.toLocaleString('da-DK')}</span>
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
          variant={highlighted ? 'gold' : 'outline'}
        >
          {pkg.price === 0 ? 'Aktiver gratis' : 'Bestil nu'}
        </Button>
      </CardContent>
    </Card>
  );

  return (
    <OwnerLayout>
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-foreground">Tilkøb & Services</h1>
        <p className="text-muted-foreground">Boost dit sommerhus med professionelle services</p>
      </div>

      <Tabs defaultValue="packages" className="space-y-6">
        <TabsList>
          <TabsTrigger value="packages">Tilgængelige pakker</TabsTrigger>
          <TabsTrigger value="purchases">Mine køb ({purchases.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="packages" className="space-y-8">
          {marketingPackages.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-accent" />
                <h2 className="font-display text-xl font-semibold">Markedsføringspakker</h2>
              </div>
              <div className="grid md:grid-cols-3 gap-6">
                {marketingPackages.map((pkg, idx) => (
                  <PackageCard key={pkg.id} pkg={pkg} idx={idx} highlighted={idx === 1} />
                ))}
              </div>
            </div>
          )}

          {photoPackages.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Camera className="w-5 h-5 text-accent" />
                <h2 className="font-display text-xl font-semibold">Foto & Video</h2>
              </div>
              <div className="grid md:grid-cols-3 gap-6">
                {photoPackages.map((pkg, idx) => (
                  <PackageCard key={pkg.id} pkg={pkg} idx={idx} highlighted={idx === 2} />
                ))}
              </div>
            </div>
          )}

          {otherPackages.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Package className="w-5 h-5 text-accent" />
                <h2 className="font-display text-xl font-semibold">Øvrige services</h2>
              </div>
              <div className="grid md:grid-cols-3 gap-6">
                {otherPackages.map((pkg, idx) => (
                  <PackageCard key={pkg.id} pkg={pkg} idx={idx} />
                ))}
              </div>
            </div>
          )}

          {packages.length === 0 && (
            <div className="bg-card border border-border rounded-xl p-12 text-center">
              <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground/40" />
              <p className="text-muted-foreground">Ingen pakker tilgængelige lige nu.</p>
            </div>
          )}
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
      <Dialog open={isPurchaseOpen} onOpenChange={(o) => { setIsPurchaseOpen(o); if (!o) setPaying(false); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedPackage?.price === 0 ? 'Aktiver' : 'Bestil'} {selectedPackage?.name}</DialogTitle>
            <DialogDescription>
              {selectedPackage?.price === 0
                ? 'Aktiver denne gratis pakke for dit sommerhus.'
                : 'Du bliver sendt til sikker betaling via Stripe.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {properties.length > 0 && (
              <div>
                <label className="text-sm font-medium mb-2 block">Vælg ejendom (valgfrit)</label>
                <Select value={selectedProperty} onValueChange={setSelectedProperty}>
                  <SelectTrigger><SelectValue placeholder="Alle ejendomme" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle ejendomme</SelectItem>
                    {properties.map(property => (
                      <SelectItem key={property.id} value={property.id}>{property.title}</SelectItem>
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
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Shield className="w-4 h-4" />
                <span>Sikker betaling via Stripe. Vi opbevarer aldrig dine kortoplysninger.</span>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPurchaseOpen(false)}>Annuller</Button>
            <Button variant="gold" onClick={handleCheckout} disabled={paying} className="gap-2">
              {paying && <Loader2 className="h-4 w-4 animate-spin" />}
              {paying ? 'Åbner betaling...' : selectedPackage?.price === 0 ? 'Aktiver gratis' : 'Betal nu'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </OwnerLayout>
  );
}
