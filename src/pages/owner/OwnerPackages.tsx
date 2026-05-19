import { useEffect, useState } from 'react';
import { OwnerLayout } from '@/components/layout/OwnerLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Check, Camera, Plane, Sparkles, Package, TrendingUp, Loader2, Shield } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth';
import { useTranslation } from '@/lib/i18n';
import {
  activateFreeOwnerPackage,
  createOwnerPackageCheckout,
  getOwnerPackageProperties,
  getOwnerPackagePurchases,
  getOwnerServicePackages,
  type OwnerServicePackage,
} from '@/lib/owner-packages-api';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export default function OwnerPackages() {
  const { user } = useAuth();
  const { t, language } = useTranslation();
  const queryClient = useQueryClient();
  const [selectedPackage, setSelectedPackage] = useState<OwnerServicePackage | null>(null);
  const [selectedProperty, setSelectedProperty] = useState<string>('');
  const [isPurchaseOpen, setIsPurchaseOpen] = useState(false);
  const [paying, setPaying] = useState(false);

  const { data: packages = [] } = useQuery({
    queryKey: ['service-packages'],
    queryFn: getOwnerServicePackages,
  });

  const { data: properties = [] } = useQuery({
    queryKey: ['owner-properties', user?.id],
    queryFn: () => getOwnerPackageProperties(user!.id),
    enabled: !!user?.id,
  });

  const { data: purchases = [] } = useQuery({
    queryKey: ['package-purchases', user?.id],
    queryFn: () => getOwnerPackagePurchases(user!.id),
    enabled: !!user?.id,
  });

  const moneyLocale = language === 'da'
    ? 'da-DK'
    : language === 'de'
      ? 'de-DE'
      : language === 'nl'
        ? 'nl-NL'
        : 'en-US';

  const formatMoney = (amount: number) => {
    const formatted = amount.toLocaleString(moneyLocale);
    return language === 'da' ? `${formatted} kr` : `DKK ${formatted}`;
  };

  const handlePurchase = (pkg: OwnerServicePackage) => {
    setSelectedPackage(pkg);
    setIsPurchaseOpen(true);
  };

  const handleCheckout = async () => {
    if (!selectedPackage || !user?.id) return;

    if (selectedPackage.price === 0) {
      try {
        await activateFreeOwnerPackage(user.id, selectedPackage.id, selectedProperty);
        queryClient.invalidateQueries({ queryKey: ['package-purchases'] });
        toast.success(t('owner.packages.toast.activated'));
        setIsPurchaseOpen(false);
      } catch {
        toast.error(t('owner.packages.toast.activateError'));
      }
      return;
    }

    setPaying(true);
    try {
      const checkoutUrl = await createOwnerPackageCheckout({
        ownerId: user.id,
        package: selectedPackage,
        propertyId: selectedProperty,
        successUrl: `${window.location.origin}/owner/packages?payment=success`,
        cancelUrl: `${window.location.origin}/owner/packages?payment=cancelled`,
      });

      window.location.href = checkoutUrl;
    } catch {
      toast.error(t('owner.packages.toast.checkoutError'));
      setPaying(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('payment') === 'success') {
      const orderId = params.get('order_id');
      const sessionId = params.get('session_id');
      if (orderId || sessionId) {
        supabase.functions.invoke('verify-payment', {
          body: { orderId, sessionId },
        }).finally(() => {
          queryClient.invalidateQueries({ queryKey: ['package-purchases'] });
        });
      }
      toast.success(t('owner.packages.toast.paymentSuccess'));
      window.history.replaceState({}, '', '/owner/packages');
      queryClient.invalidateQueries({ queryKey: ['package-purchases'] });
    } else if (params.get('payment') === 'cancelled') {
      toast.error(t('owner.packages.toast.paymentCancelled'));
      window.history.replaceState({}, '', '/owner/packages');
    }
  }, [queryClient, t]);

  const marketingPackages = packages.filter(p => p.category === 'marketing');
  const photoPackages = packages.filter(p => p.category === 'photo');
  const otherPackages = packages.filter(p => !['marketing', 'photo'].includes(p.category));

  const getCategoryIcon = (category: string, idx: number) => {
    if (category === 'photo' && idx === 1) return <Plane className="w-5 h-5 text-accent" />;
    if (category === 'photo') return <Camera className="w-5 h-5 text-accent" />;
    if (category === 'marketing') return <TrendingUp className="w-5 h-5 text-accent" />;
    return <Package className="w-5 h-5 text-accent" />;
  };

  const getStatusBadge = (status: string | null) => {
    const map: Record<string, { className: string; label: string }> = {
      pending: { className: 'bg-accent/20 text-accent', label: t('owner.packages.status.pending') },
      processing: { className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', label: t('owner.packages.status.processing') },
      completed: { className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', label: t('owner.packages.status.completed') },
      cancelled: { className: 'bg-destructive/10 text-destructive', label: t('owner.packages.status.cancelled') },
    };
    const s = map[status || 'pending'] || map.pending;
    return <Badge className={s.className}>{s.label}</Badge>;
  };

  const PackageCard = ({ pkg, idx, highlighted }: { pkg: OwnerServicePackage; idx: number; highlighted?: boolean }) => (
    <Card className={`relative overflow-hidden transition-all hover:shadow-lg ${highlighted ? 'ring-2 ring-accent' : ''}`}>
      {highlighted && (
        <div className="absolute top-0 right-0 bg-accent text-primary text-xs font-bold px-3 py-1 rounded-bl-lg">
          {t('owner.packages.popular')}
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
            <span className="text-2xl font-bold text-accent">{t('owner.packages.free')}</span>
          ) : (
            <>
              <span className="text-2xl font-bold text-foreground">{pkg.price.toLocaleString(moneyLocale)}</span>
              <span className="text-muted-foreground">{language === 'da' ? ' kr' : ' DKK'}</span>
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
          {pkg.price === 0 ? t('owner.packages.activateFree') : t('owner.packages.orderNow')}
        </Button>
      </CardContent>
    </Card>
  );

  return (
    <OwnerLayout>
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-foreground">{t('owner.packages.title')}</h1>
        <p className="text-muted-foreground">{t('owner.packages.subtitle')}</p>
      </div>

      <Tabs defaultValue="packages" className="space-y-6">
        <TabsList>
          <TabsTrigger value="packages">{t('owner.packages.tab.available')}</TabsTrigger>
          <TabsTrigger value="purchases">{t('owner.packages.tab.purchases')} ({purchases.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="packages" className="space-y-8">
          {marketingPackages.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-accent" />
                <h2 className="font-display text-xl font-semibold">{t('owner.packages.category.marketing')}</h2>
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
                <h2 className="font-display text-xl font-semibold">{t('owner.packages.category.photo')}</h2>
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
                <h2 className="font-display text-xl font-semibold">{t('owner.packages.category.other')}</h2>
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
              <p className="text-muted-foreground">{t('owner.packages.emptyAvailable')}</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="purchases">
          <Card>
            <CardHeader>
              <CardTitle>{t('owner.packages.myOrders')}</CardTitle>
              <CardDescription>{t('owner.packages.myOrdersDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
              {purchases.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>{t('owner.packages.emptyPurchases')}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {purchases.map((purchase) => (
                    <div key={purchase.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                          <Sparkles className="w-5 h-5 text-accent" />
                        </div>
                        <div>
                          <div className="font-medium">{purchase.service_packages?.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {purchase.properties?.title || t('owner.packages.allProperties')}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-semibold">{formatMoney(purchase.amount)}</span>
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
            <DialogTitle>{selectedPackage?.price === 0 ? t('owner.packages.dialog.activate') : t('owner.packages.dialog.order')} {selectedPackage?.name}</DialogTitle>
            <DialogDescription>
              {selectedPackage?.price === 0
                ? t('owner.packages.dialog.freeDescription')
                : t('owner.packages.dialog.paidDescription')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {properties.length > 0 && (
              <div>
                <label className="text-sm font-medium mb-2 block">{t('owner.packages.chooseProperty')}</label>
                <Select value={selectedProperty} onValueChange={setSelectedProperty}>
                  <SelectTrigger><SelectValue placeholder={t('owner.packages.allProperties')} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('owner.packages.allProperties')}</SelectItem>
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
                  {selectedPackage?.price === 0 ? t('owner.packages.free') : formatMoney(selectedPackage?.price || 0)}
                </span>
              </div>
            </div>

            {selectedPackage?.price !== 0 && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Shield className="w-4 h-4" />
                <span>{t('owner.packages.dialog.secureStripe')}</span>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPurchaseOpen(false)}>{t('owner.packages.cancel')}</Button>
            <Button variant="gold" onClick={handleCheckout} disabled={paying} className="gap-2">
              {paying && <Loader2 className="h-4 w-4 animate-spin" />}
              {paying ? t('owner.packages.openingPayment') : selectedPackage?.price === 0 ? t('owner.packages.activateFree') : t('owner.packages.payNow')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </OwnerLayout>
  );
}
