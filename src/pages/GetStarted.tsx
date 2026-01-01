import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight, ArrowLeft, Check, Camera, Video, Sparkles, Home, MapPin, Settings, CreditCard, Star, Zap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';

interface OnboardingData {
  // Step 1: Package selection
  package: 'basic' | 'plus' | null;
  // Step 2: Add-ons
  addons: {
    proPhotos: boolean;
    proVideo: boolean;
    premiumPlacement: boolean;
  };
  // Step 3: Property info
  title: string;
  address: string;
  region: string;
  capacity: number;
  bedrooms: number;
  bathrooms: number;
  // Step 4: Account
  name: string;
  email: string;
  phone: string;
  password: string;
  acceptTerms: boolean;
}

const REGIONS = [
  'Nordjylland',
  'Midtjylland',
  'Syddanmark',
  'Sjælland',
  'Hovedstaden',
  'Bornholm',
];

const PACKAGES = [
  {
    id: 'basic',
    name: 'Basis udlejning',
    price: 'Gratis',
    commission: '15%',
    description: 'Perfekt til at komme i gang',
    features: [
      'Annoncering på 3+ portaler',
      'Personlig rådgiver',
      'Booking-håndtering',
      'Månedlige udbetalinger',
    ],
    popular: false,
  },
  {
    id: 'plus',
    name: 'Plus udlejning',
    price: '299 kr./md.',
    commission: '12%',
    description: 'For den seriøse udlejer',
    features: [
      'Alt i Basis',
      'Premium placering',
      'Prioriteret support',
      'Ugentlige udbetalinger',
      'Detaljeret statistik',
    ],
    popular: true,
  },
];

const ADDONS = [
  {
    id: 'proPhotos',
    name: 'Professionelle billeder & video',
    price: '9.995 kr.',
    priceNote: 'engangspris',
    description: '15-20 professionelle billeder + drone-optagelser + 2-3 min. udlejningsvideo',
    tag: 'ANBEFALET',
  },
  {
    id: 'proVideo',
    name: 'Kun udlejningsvideo',
    price: '5.995 kr.',
    priceNote: 'engangspris',
    description: '2-3 minutters professionel udlejningsvideo med drone-optagelser',
    tag: null,
  },
  {
    id: 'premiumPlacement',
    name: 'Premium placering i 3 mdr.',
    price: '1.495 kr.',
    priceNote: 'pr. måned',
    description: 'Top-placering på alle portaler for maksimal synlighed',
    tag: 'BOOST',
  },
];

export default function GetStarted() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [data, setData] = useState<OnboardingData>({
    package: null,
    addons: {
      proPhotos: false,
      proVideo: false,
      premiumPlacement: false,
    },
    title: '',
    address: '',
    region: '',
    capacity: 4,
    bedrooms: 2,
    bathrooms: 1,
    name: '',
    email: '',
    phone: '',
    password: '',
    acceptTerms: false,
  });

  const totalSteps = 4;

  const updateData = (updates: Partial<OnboardingData>) => {
    setData(prev => ({ ...prev, ...updates }));
  };

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (!data.acceptTerms) {
      toast.error('Du skal acceptere handelsbetingelserne');
      return;
    }

    setIsSubmitting(true);
    try {
      // Sign up if not logged in
      if (!user) {
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: data.email,
          password: data.password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              full_name: data.name,
            },
          },
        });

        if (authError) throw authError;

        if (authData.user) {
          // Create property
          const { error: propertyError } = await supabase.from('properties').insert({
            owner_id: authData.user.id,
            title: data.title,
            address: data.address,
            region: data.region,
            capacity: data.capacity,
            bedrooms: data.bedrooms,
            bathrooms: data.bathrooms,
            status: 'draft',
          });

          if (propertyError) throw propertyError;
        }
      } else {
        // Already logged in - just create property
        const { error: propertyError } = await supabase.from('properties').insert({
          owner_id: user.id,
          title: data.title,
          address: data.address,
          region: data.region,
          capacity: data.capacity,
          bedrooms: data.bedrooms,
          bathrooms: data.bathrooms,
          status: 'draft',
        });

        if (propertyError) throw propertyError;
      }

      toast.success('Dit sommerhus er oprettet! Tjek din email for at bekræfte din konto.');
      navigate('/owner/properties');
    } catch (error: any) {
      console.error('Error:', error);
      toast.error(error.message || 'Der opstod en fejl');
    } finally {
      setIsSubmitting(false);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return data.package !== null;
      case 2:
        return true; // Add-ons are optional
      case 3:
        return data.title && data.address && data.region;
      case 4:
        return user || (data.name && data.email && data.password && data.acceptTerms);
      default:
        return true;
    }
  };

  const stepLabels = ['Vælg pakke', 'Vælg tilkøb', 'Dit sommerhus', user ? 'Bekræft' : 'Opret konto'];

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center gap-0 mb-12">
      {stepLabels.map((label, index) => (
        <div key={index} className="flex items-center">
          <div className="flex flex-col items-center">
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center font-semibold transition-all ${
                index + 1 < currentStep
                  ? 'bg-primary text-primary-foreground'
                  : index + 1 === currentStep
                  ? 'bg-primary text-primary-foreground ring-4 ring-primary/20'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {index + 1 < currentStep ? (
                <Check className="w-5 h-5" />
              ) : (
                index + 1
              )}
            </div>
            <span className={`text-xs mt-2 ${
              index + 1 <= currentStep ? 'text-primary font-medium' : 'text-muted-foreground'
            }`}>
              {label}
            </span>
          </div>
          {index < stepLabels.length - 1 && (
            <div className={`w-16 md:w-24 h-0.5 mx-2 ${
              index + 1 < currentStep ? 'bg-primary' : 'bg-muted'
            }`} />
          )}
        </div>
      ))}
    </div>
  );

  const renderStep1 = () => (
    <div className="max-w-3xl mx-auto">
      <div className="text-center mb-10">
        <h2 className="font-display text-3xl font-semibold text-primary mb-3">Vælg din pakke</h2>
        <p className="text-muted-foreground">Start med den pakke der passer til dine behov</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {PACKAGES.map((pkg) => (
          <button
            key={pkg.id}
            onClick={() => updateData({ package: pkg.id as 'basic' | 'plus' })}
            className={`relative text-left p-6 rounded-2xl border-2 transition-all ${
              data.package === pkg.id
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50'
            }`}
          >
            {pkg.popular && (
              <div className="absolute -top-3 left-6 px-3 py-1 bg-accent text-primary text-xs font-semibold rounded-full">
                MEST POPULÆR
              </div>
            )}

            <div className="flex items-center gap-3 mb-4">
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                data.package === pkg.id ? 'border-primary bg-primary' : 'border-muted-foreground'
              }`}>
                {data.package === pkg.id && <Check className="w-3 h-3 text-primary-foreground" />}
              </div>
              <h3 className="font-display text-xl font-semibold text-primary">{pkg.name}</h3>
            </div>

            <div className="mb-4">
              <span className="text-3xl font-bold text-accent">{pkg.price}</span>
              <span className="text-muted-foreground ml-2">+ {pkg.commission} kommission</span>
            </div>

            <p className="text-muted-foreground mb-4">{pkg.description}</p>

            <ul className="space-y-2">
              {pkg.features.map((feature, i) => (
                <li key={i} className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-accent" />
                  <span className="text-muted-foreground">{feature}</span>
                </li>
              ))}
            </ul>
          </button>
        ))}
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="max-w-3xl mx-auto">
      <div className="text-center mb-10">
        <h2 className="font-display text-3xl font-semibold text-primary mb-3">Vælg tilkøb (valgfrit)</h2>
        <p className="text-muted-foreground">Boost dit sommerhus med professionelt indhold</p>
      </div>

      <div className="space-y-4">
        {ADDONS.map((addon) => (
          <button
            key={addon.id}
            onClick={() => updateData({
              addons: {
                ...data.addons,
                [addon.id]: !data.addons[addon.id as keyof typeof data.addons],
              },
            })}
            className={`w-full text-left p-6 rounded-2xl border-2 transition-all ${
              data.addons[addon.id as keyof typeof data.addons]
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mt-0.5 ${
                  data.addons[addon.id as keyof typeof data.addons] ? 'border-primary bg-primary' : 'border-muted-foreground'
                }`}>
                  {data.addons[addon.id as keyof typeof data.addons] && <Check className="w-3 h-3 text-primary-foreground" />}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-primary">{addon.name}</h3>
                    {addon.tag && (
                      <span className="px-2 py-0.5 bg-accent/20 text-accent text-xs font-medium rounded-full">
                        {addon.tag}
                      </span>
                    )}
                  </div>
                  <p className="text-muted-foreground text-sm">{addon.description}</p>
                </div>
              </div>
              <div className="text-right flex-shrink-0 ml-4">
                <div className="text-xl font-bold text-accent">{addon.price}</div>
                <div className="text-xs text-muted-foreground">{addon.priceNote}</div>
              </div>
            </div>
          </button>
        ))}
      </div>

      <p className="text-center text-sm text-muted-foreground mt-8">
        Du kan altid tilkøbe disse pakker senere fra din ejerportal
      </p>
    </div>
  );

  const renderStep3 = () => (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-10">
        <h2 className="font-display text-3xl font-semibold text-primary mb-3">Dit sommerhus</h2>
        <p className="text-muted-foreground">Fortæl os om dit sommerhus – det tager kun 2 minutter</p>
      </div>

      <Card>
        <CardContent className="p-8 space-y-6">
          <div>
            <Label htmlFor="title">Navn på sommerhus *</Label>
            <Input
              id="title"
              placeholder="F.eks. Hyggeligt sommerhus ved Kvie Sø"
              value={data.title}
              onChange={e => updateData({ title: e.target.value })}
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="address">Adresse *</Label>
            <Input
              id="address"
              placeholder="Søvej 28, 6800 Varde"
              value={data.address}
              onChange={e => updateData({ address: e.target.value })}
              className="mt-2"
            />
          </div>

          <div>
            <Label>Region *</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
              {REGIONS.map(region => (
                <button
                  key={region}
                  type="button"
                  onClick={() => updateData({ region })}
                  className={`p-3 rounded-lg border text-left text-sm transition-all ${
                    data.region === region
                      ? 'border-primary bg-primary/10 text-primary font-medium'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  {region}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="capacity">Antal gæster</Label>
              <Input
                id="capacity"
                type="number"
                min={1}
                max={20}
                value={data.capacity}
                onChange={e => updateData({ capacity: parseInt(e.target.value) || 1 })}
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="bedrooms">Soveværelser</Label>
              <Input
                id="bedrooms"
                type="number"
                min={1}
                max={10}
                value={data.bedrooms}
                onChange={e => updateData({ bedrooms: parseInt(e.target.value) || 1 })}
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="bathrooms">Badeværelser</Label>
              <Input
                id="bathrooms"
                type="number"
                min={1}
                max={5}
                value={data.bathrooms}
                onChange={e => updateData({ bathrooms: parseInt(e.target.value) || 1 })}
                className="mt-2"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderStep4 = () => (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-10">
        <h2 className="font-display text-3xl font-semibold text-primary mb-3">
          {user ? 'Bekræft og opret' : 'Opret din konto'}
        </h2>
        <p className="text-muted-foreground">
          {user ? 'Gennemse dine valg og opret dit sommerhus' : 'Sidste skridt – opret din konto'}
        </p>
      </div>

      <Card>
        <CardContent className="p-8 space-y-6">
          {!user && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Navn *</Label>
                  <Input
                    id="name"
                    placeholder="Dit fulde navn"
                    value={data.name}
                    onChange={e => updateData({ name: e.target.value })}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Telefon</Label>
                  <Input
                    id="phone"
                    placeholder="+45 XX XX XX XX"
                    value={data.phone}
                    onChange={e => updateData({ phone: e.target.value })}
                    className="mt-2"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="din@email.dk"
                  value={data.email}
                  onChange={e => updateData({ email: e.target.value })}
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="password">Adgangskode *</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Mindst 6 tegn"
                  value={data.password}
                  onChange={e => updateData({ password: e.target.value })}
                  className="mt-2"
                />
              </div>

              <div className="pt-4 border-t">
                <label className="flex items-start gap-3 cursor-pointer">
                  <Checkbox
                    checked={data.acceptTerms}
                    onCheckedChange={(checked) => updateData({ acceptTerms: !!checked })}
                    className="mt-0.5"
                  />
                  <span className="text-sm text-muted-foreground">
                    Jeg accepterer{' '}
                    <a href="/terms" className="text-accent hover:underline">handelsbetingelserne</a>
                    {' '}og{' '}
                    <a href="/privacy" className="text-accent hover:underline">privatlivspolitikken</a>
                  </span>
                </label>
              </div>
            </>
          )}

          {/* Summary */}
          <div className="bg-muted/50 rounded-xl p-6 space-y-4">
            <h3 className="font-semibold text-primary">Opsummering</h3>
            
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Pakke</span>
              <span className="font-medium text-primary">
                {PACKAGES.find(p => p.id === data.package)?.name || '-'}
              </span>
            </div>

            {(data.addons.proPhotos || data.addons.proVideo || data.addons.premiumPlacement) && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tilkøb</span>
                <span className="font-medium text-primary">
                  {[
                    data.addons.proPhotos && 'Foto',
                    data.addons.proVideo && 'Video',
                    data.addons.premiumPlacement && 'Premium',
                  ].filter(Boolean).join(', ')}
                </span>
              </div>
            )}

            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Sommerhus</span>
              <span className="font-medium text-primary">{data.title || '-'}</span>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Beliggenhed</span>
              <span className="font-medium text-primary">{data.region || '-'}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <PublicLayout>
      <section className="py-12 md:py-20 bg-muted/30 min-h-[calc(100vh-4rem)]">
        <div className="container mx-auto px-4 md:px-8">
          {renderStepIndicator()}

          <div className="mb-12">
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep3()}
            {currentStep === 4 && renderStep4()}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between max-w-3xl mx-auto">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 1}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Tilbage
            </Button>

            {currentStep < totalSteps ? (
              <Button
                variant="gold"
                onClick={handleNext}
                disabled={!canProceed()}
                className="gap-2"
              >
                Næste
                <ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                variant="gold"
                onClick={handleSubmit}
                disabled={!canProceed() || isSubmitting}
                className="gap-2"
              >
                {isSubmitting ? 'Opretter...' : 'Opret sommerhus'}
                <ArrowRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
