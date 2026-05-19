import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Save, Settings, Package, Percent, DollarSign, Clock, Plus, Edit, Trash2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PlatformSetting {
  id: string;
  key: string;
  value: any;
  description: string | null;
}

interface ServicePackage {
  id: string;
  name: string;
  description: string | null;
  price: number;
  features: string[];
  category: string;
  is_active: boolean;
  sort_order: number;
}

export default function AdminSettings() {
  const queryClient = useQueryClient();
  const [editingPackage, setEditingPackage] = useState<ServicePackage | null>(null);
  const [isPackageDialogOpen, setIsPackageDialogOpen] = useState(false);
  
  // Form state for settings
  const [commissionRate, setCommissionRate] = useState('20');
  const [guestServiceFee, setGuestServiceFee] = useState('5');
  const [taxFreeAmount, setTaxFreeAmount] = useState('42300');
  const [processingMin, setProcessingMin] = useState('1');
  const [processingMax, setProcessingMax] = useState('4');

  // Form state for package
  const [packageForm, setPackageForm] = useState({
    name: '',
    description: '',
    price: '',
    features: '',
    category: 'marketing',
    is_active: true,
    sort_order: 0,
  });

  const { data: settings = [], isLoading: settingsLoading } = useQuery({
    queryKey: ['platform-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('platform_settings')
        .select('*');
      if (error) throw error;
      return data as PlatformSetting[];
    },
  });

  const { data: packages = [], isLoading: packagesLoading } = useQuery({
    queryKey: ['all-service-packages'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_packages')
        .select('*')
        .order('category')
        .order('sort_order');
      if (error) throw error;
      return data.map(p => ({
        ...p,
        features: Array.isArray(p.features) ? p.features : JSON.parse(p.features as string || '[]')
      })) as ServicePackage[];
    },
  });

  // Populate settings from database
  useEffect(() => {
    settings.forEach(setting => {
      switch (setting.key) {
        case 'commission_rate':
          setCommissionRate(String(setting.value));
          break;
        case 'guest_service_fee':
          setGuestServiceFee(String(setting.value));
          break;
        case 'tax_free_amount':
          setTaxFreeAmount(String(setting.value));
          break;
        case 'marketing_processing_days': {
          const days = typeof setting.value === 'string' ? JSON.parse(setting.value) : setting.value;
          setProcessingMin(String(days.min));
          setProcessingMax(String(days.max));
          break;
        }
      }
    });
  }, [settings]);

  const updateSettingMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: any }) => {
      const { error } = await supabase
        .from('platform_settings')
        .update({ value, updated_at: new Date().toISOString() })
        .eq('key', key);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-settings'] });
      toast.success('Indstilling opdateret');
    },
    onError: () => {
      toast.error('Kunne ikke opdatere indstilling');
    },
  });

  const saveAllSettings = async () => {
    try {
      await Promise.all([
        updateSettingMutation.mutateAsync({ key: 'commission_rate', value: parseInt(commissionRate) }),
        updateSettingMutation.mutateAsync({ key: 'guest_service_fee', value: parseInt(guestServiceFee) }),
        updateSettingMutation.mutateAsync({ key: 'tax_free_amount', value: parseInt(taxFreeAmount) }),
        updateSettingMutation.mutateAsync({ 
          key: 'marketing_processing_days', 
          value: { min: parseInt(processingMin), max: parseInt(processingMax) }
        }),
      ]);
      toast.success('Alle indstillinger gemt');
    } catch {
      toast.error('Kunne ikke gemme alle indstillinger');
    }
  };

  const savePackageMutation = useMutation({
    mutationFn: async () => {
      const packageData = {
        name: packageForm.name,
        description: packageForm.description || null,
        price: parseFloat(packageForm.price) || 0,
        features: packageForm.features.split('\n').filter(f => f.trim()),
        category: packageForm.category,
        is_active: packageForm.is_active,
        sort_order: packageForm.sort_order,
      };

      if (editingPackage) {
        const { error } = await supabase
          .from('service_packages')
          .update(packageData)
          .eq('id', editingPackage.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('service_packages')
          .insert(packageData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-service-packages'] });
      toast.success(editingPackage ? 'Pakke opdateret' : 'Pakke oprettet');
      setIsPackageDialogOpen(false);
      setEditingPackage(null);
      resetPackageForm();
    },
    onError: () => {
      toast.error('Kunne ikke gemme pakke');
    },
  });

  const deletePackageMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('service_packages')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-service-packages'] });
      toast.success('Pakke slettet');
    },
    onError: () => {
      toast.error('Kunne ikke slette pakke');
    },
  });

  const togglePackageActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('service_packages')
        .update({ is_active })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-service-packages'] });
    },
  });

  const resetPackageForm = () => {
    setPackageForm({
      name: '',
      description: '',
      price: '',
      features: '',
      category: 'marketing',
      is_active: true,
      sort_order: 0,
    });
  };

  const openEditPackage = (pkg: ServicePackage) => {
    setEditingPackage(pkg);
    setPackageForm({
      name: pkg.name,
      description: pkg.description || '',
      price: String(pkg.price),
      features: pkg.features.join('\n'),
      category: pkg.category,
      is_active: pkg.is_active,
      sort_order: pkg.sort_order,
    });
    setIsPackageDialogOpen(true);
  };

  const openNewPackage = () => {
    setEditingPackage(null);
    resetPackageForm();
    setIsPackageDialogOpen(true);
  };

  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-primary">Indstillinger</h1>
        <p className="text-muted-foreground">Administrer platformens priser og indstillinger</p>
      </div>

      <Tabs defaultValue="pricing" className="space-y-6">
        <TabsList>
          <TabsTrigger value="pricing">Priser & Gebyrer</TabsTrigger>
          <TabsTrigger value="packages">Servicepakker</TabsTrigger>
        </TabsList>

        <TabsContent value="pricing">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Commission Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Percent className="w-5 h-5 text-accent" />
                  Provision & Gebyrer
                </CardTitle>
                <CardDescription>
                  Disse satser anvendes automatisk ved beregninger
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Provision fra ejere (%)</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input
                      type="number"
                      value={commissionRate}
                      onChange={(e) => setCommissionRate(e.target.value)}
                      className="w-24"
                    />
                    <span className="text-muted-foreground">%</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Den procentdel vi tager fra ejernes udlejningsindtægt
                  </p>
                </div>

                <div>
                  <Label>Gæsteservicegebyr (%)</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input
                      type="number"
                      value={guestServiceFee}
                      onChange={(e) => setGuestServiceFee(e.target.value)}
                      className="w-24"
                    />
                    <span className="text-muted-foreground">%</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Tillæg til gæstens totalpris
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Tax Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-accent" />
                  Skattefrit beløb
                </CardTitle>
                <CardDescription>
                  Årligt skattefrit udlejningsbeløb i prisberegneren
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Bundfradrag (DKK)</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input
                      type="number"
                      value={taxFreeAmount}
                      onChange={(e) => setTaxFreeAmount(e.target.value)}
                      className="w-32"
                    />
                    <span className="text-muted-foreground">kr/år</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Dette beløb bruges i prisberegneren til at estimere nettoindtægt
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Processing Time */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-accent" />
                  Behandlingstid
                </CardTitle>
                <CardDescription>
                  Forventet tid for markedsføringsopsætning
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <div>
                    <Label>Minimum dage</Label>
                    <Input
                      type="number"
                      value={processingMin}
                      onChange={(e) => setProcessingMin(e.target.value)}
                      className="w-20 mt-1"
                    />
                  </div>
                  <span className="text-muted-foreground mt-6">til</span>
                  <div>
                    <Label>Maximum dage</Label>
                    <Input
                      type="number"
                      value={processingMax}
                      onChange={(e) => setProcessingMax(e.target.value)}
                      className="w-20 mt-1"
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Vises til ejere når de publicerer: "{processingMin}-{processingMax} hverdage"
                </p>
              </CardContent>
            </Card>

            {/* Save Button */}
            <Card className="md:col-span-2">
              <CardContent className="pt-6">
                <Button onClick={saveAllSettings} variant="gold" className="w-full md:w-auto">
                  <Save className="w-4 h-4 mr-2" />
                  Gem alle indstillinger
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="packages">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Servicepakker</CardTitle>
                <CardDescription>Administrer de pakker ejere kan tilkøbe</CardDescription>
              </div>
              <Button onClick={openNewPackage} variant="gold">
                <Plus className="w-4 h-4 mr-2" />
                Ny pakke
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {packages.map(pkg => (
                  <div 
                    key={pkg.id} 
                    className={`flex items-center justify-between p-4 rounded-lg border ${
                      pkg.is_active ? 'bg-card' : 'bg-muted/50 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <Switch
                        checked={pkg.is_active}
                        onCheckedChange={(checked) => togglePackageActive.mutate({ id: pkg.id, is_active: checked })}
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{pkg.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {pkg.category === 'marketing' ? 'Markedsføring' : 'Foto'}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {pkg.features.length} features • Sortering: {pkg.sort_order}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-semibold">
                        {pkg.price === 0 ? 'Gratis' : `${pkg.price.toLocaleString('da-DK')} kr`}
                      </span>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" onClick={() => openEditPackage(pkg)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-destructive"
                          onClick={() => deletePackageMutation.mutate(pkg.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Package Dialog */}
      <Dialog open={isPackageDialogOpen} onOpenChange={setIsPackageDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingPackage ? 'Rediger pakke' : 'Opret ny pakke'}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Label>Navn</Label>
              <Input
                value={packageForm.name}
                onChange={(e) => setPackageForm(prev => ({ ...prev, name: e.target.value }))}
                className="mt-1"
              />
            </div>

            <div>
              <Label>Beskrivelse</Label>
              <Input
                value={packageForm.description}
                onChange={(e) => setPackageForm(prev => ({ ...prev, description: e.target.value }))}
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Pris (DKK)</Label>
                <Input
                  type="number"
                  value={packageForm.price}
                  onChange={(e) => setPackageForm(prev => ({ ...prev, price: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Kategori</Label>
                <select
                  value={packageForm.category}
                  onChange={(e) => setPackageForm(prev => ({ ...prev, category: e.target.value }))}
                  className="mt-1 w-full h-10 rounded-md border border-input bg-background px-3"
                >
                  <option value="marketing">Markedsføring</option>
                  <option value="photo">Foto</option>
                </select>
              </div>
            </div>

            <div>
              <Label>Features (én per linje)</Label>
              <Textarea
                value={packageForm.features}
                onChange={(e) => setPackageForm(prev => ({ ...prev, features: e.target.value }))}
                rows={4}
                className="mt-1"
                placeholder="Annoncering på alle portaler&#10;Professionel annoncetekst&#10;Søgeoptimering"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Sortering</Label>
                <Input
                  type="number"
                  value={packageForm.sort_order}
                  onChange={(e) => setPackageForm(prev => ({ ...prev, sort_order: parseInt(e.target.value) || 0 }))}
                  className="mt-1"
                />
              </div>
              <div className="flex items-center gap-2 pt-6">
                <Switch
                  checked={packageForm.is_active}
                  onCheckedChange={(checked) => setPackageForm(prev => ({ ...prev, is_active: checked }))}
                />
                <Label>Aktiv</Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPackageDialogOpen(false)}>
              Annuller
            </Button>
            <Button variant="gold" onClick={() => savePackageMutation.mutate()}>
              {editingPackage ? 'Gem ændringer' : 'Opret pakke'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
