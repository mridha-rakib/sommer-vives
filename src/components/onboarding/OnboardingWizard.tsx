import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ArrowRight, ArrowLeft, Check, Camera, Video, Sparkles, Home, MapPin, Settings, CreditCard, Brush } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { createOwnerOnboardingProperty } from '@/lib/owner-onboarding-api';
import { toast } from 'sonner';

interface OnboardingData {
  // Step 1: Basic Info
  title: string;
  address: string;
  region: string;
  // Step 2: Property Details
  capacity: number;
  bedrooms: number;
  bathrooms: number;
  description: string;
  // Step 3: Amenities & Rules
  amenities: string[];
  houseRules: string;
  // Step 4: Cleaning Preference
  cleaningPreference: 'self' | 'platform';
  // Step 5: Add-ons
  addons: {
    proPhotos: boolean;
    proVideo: boolean;
    paymentMethod: 'now' | 'bookings' | null;
  };
}

const REGIONS = [
  'Nordjylland',
  'Midtjylland', 
  'Syddanmark',
  'Sjælland',
  'Hovedstaden',
  'Bornholm',
];

const AMENITIES_OPTIONS = [
  'WiFi',
  'Brændeovn',
  'Sauna',
  'Spabad',
  'Pool',
  'Legeplads',
  'Havudsigt',
  'Skovudsigt',
  'Terrasse',
  'Grill',
  'Opvaskemaskine',
  'Vaskemaskine',
  'P-plads',
  'Husdyr tilladt',
];

const DEFAULT_DATA: OnboardingData = {
  title: '',
  address: '',
  region: '',
  capacity: 4,
  bedrooms: 2,
  bathrooms: 1,
  description: '',
  amenities: [],
  houseRules: '',
  cleaningPreference: 'platform',
  addons: {
    proPhotos: false,
    proVideo: false,
    paymentMethod: null,
  },
};

export function OnboardingWizard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const storageKey = useMemo(() => user?.id ? `onboarding_wizard_${user.id}` : null, [user?.id]);

  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [data, setData] = useState<OnboardingData>(DEFAULT_DATA);

  // Restore saved wizard state (step + form data) from localStorage on first mount
  useEffect(() => {
    if (!storageKey) return;
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const { step, formData } = JSON.parse(saved);
        if (typeof step === 'number' && step >= 1 && step <= 5) setCurrentStep(step);
        if (formData) setData(prev => ({ ...prev, ...formData }));
      }
    } catch {
      // ignore corrupted data
    }
  }, [storageKey]);

  // Persist step + form data on every change
  useEffect(() => {
    if (!storageKey) return;
    localStorage.setItem(storageKey, JSON.stringify({ step: currentStep, formData: data }));
  }, [currentStep, data, storageKey]);

  const totalSteps = 5;
  const progress = (currentStep / totalSteps) * 100;

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
    if (!user) {
      toast.error('Du skal være logget ind');
      return;
    }

    setIsSubmitting(true);
    try {
      await createOwnerOnboardingProperty({
        ownerId: user.id,
        title: data.title,
        address: data.address,
        region: data.region,
        capacity: data.capacity,
        bedrooms: data.bedrooms,
        bathrooms: data.bathrooms,
        description: data.description,
        amenities: data.amenities,
        houseRules: data.houseRules,
        cleaningPreference: data.cleaningPreference,
        addons: data.addons,
      });

      if (storageKey) localStorage.removeItem(storageKey);
      toast.success('Dit sommerhus er oprettet!');
      navigate('/owner/properties');
    } catch (error) {
      console.error('Error creating property:', error);
      toast.error('Der opstod en fejl ved oprettelse');
    } finally {
      setIsSubmitting(false);
    }
  };

  const addonPrice = 12500;
  const hasAddons = data.addons.proPhotos || data.addons.proVideo;

  const renderStepIndicator = () => (
    <div className="mb-8">
      <Progress value={progress} className="h-2 mb-4" />
      <div className="flex justify-between">
        {[
          { icon: Home, label: 'Grundinfo' },
          { icon: MapPin, label: 'Detaljer' },
          { icon: Settings, label: 'Faciliteter' },
          { icon: Brush, label: 'Rengøring' },
          { icon: CreditCard, label: 'Tilkøb' },
        ].map((step, index) => (
          <div
            key={index}
            className={`flex flex-col items-center gap-1 ${
              index + 1 <= currentStep ? 'text-accent' : 'text-muted-foreground'
            }`}
          >
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                index + 1 < currentStep
                  ? 'bg-accent text-primary'
                  : index + 1 === currentStep
                  ? 'bg-accent/20 border-2 border-accent'
                  : 'bg-muted'
              }`}
            >
              {index + 1 < currentStep ? (
                <Check className="w-5 h-5" />
              ) : (
                <step.icon className="w-5 h-5" />
              )}
            </div>
            <span className="text-xs hidden sm:block">{step.label}</span>
          </div>
        ))}
      </div>
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-6">
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
              className={`p-3 rounded-lg border text-left transition-all ${
                data.region === region
                  ? 'border-accent bg-accent/10 text-accent'
                  : 'border-border hover:border-accent/50'
              }`}
            >
              {region}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
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
      <div>
        <Label htmlFor="description">Beskrivelse af dit sommerhus</Label>
        <Textarea
          id="description"
          placeholder="Beskriv hvad der gør dit sommerhus unikt... Atmosfæren, beliggenheden, de særlige oplevelser man kan få..."
          value={data.description}
          onChange={e => updateData({ description: e.target.value })}
          className="mt-2 min-h-[150px]"
        />
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div>
        <Label className="mb-4 block">Faciliteter</Label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {AMENITIES_OPTIONS.map(amenity => (
            <label
              key={amenity}
              className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                data.amenities.includes(amenity)
                  ? 'border-accent bg-accent/10'
                  : 'border-border hover:border-accent/50'
              }`}
            >
              <Checkbox
                checked={data.amenities.includes(amenity)}
                onCheckedChange={checked => {
                  if (checked) {
                    updateData({ amenities: [...data.amenities, amenity] });
                  } else {
                    updateData({ amenities: data.amenities.filter(a => a !== amenity) });
                  }
                }}
              />
              <span className="text-sm">{amenity}</span>
            </label>
          ))}
        </div>
      </div>
      <div>
        <Label htmlFor="houseRules">Husregler</Label>
        <Textarea
          id="houseRules"
          placeholder="F.eks. Ikke-ryger hus, ingen fester, check-in kl. 15..."
          value={data.houseRules}
          onChange={e => updateData({ houseRules: e.target.value })}
          className="mt-2 min-h-[120px]"
        />
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <Brush className="w-12 h-12 text-accent mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-primary mb-2">
          Hvordan vil du håndtere rengøring?
        </h3>
        <p className="text-muted-foreground">
          Vælg den løsning der passer bedst til dig
        </p>
      </div>

      <RadioGroup
        value={data.cleaningPreference}
        onValueChange={(value: 'self' | 'platform') => updateData({ cleaningPreference: value })}
        className="space-y-4"
      >
        <label
          className={`flex items-start gap-4 p-6 rounded-xl border cursor-pointer transition-all ${
            data.cleaningPreference === 'platform'
              ? 'border-accent bg-accent/5'
              : 'border-border hover:border-accent/50'
          }`}
        >
          <RadioGroupItem value="platform" className="mt-1" />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-semibold text-primary">Vi klarer rengøringen</h4>
              <span className="px-2 py-0.5 bg-accent/20 text-accent text-xs rounded-full">Anbefalet</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Vores professionelle, lokale rengøringspartnere sørger for at dit sommerhus altid er klar til næste gæst. 
              Rengøringsgebyr tilføjes automatisk til bookingprisen.
            </p>
          </div>
        </label>

        <label
          className={`flex items-start gap-4 p-6 rounded-xl border cursor-pointer transition-all ${
            data.cleaningPreference === 'self'
              ? 'border-accent bg-accent/5'
              : 'border-border hover:border-accent/50'
          }`}
        >
          <RadioGroupItem value="self" className="mt-1" />
          <div className="flex-1">
            <h4 className="font-semibold text-primary mb-1">Jeg styrer selv rengøringen</h4>
            <p className="text-sm text-muted-foreground">
              Du står selv for at arrangere rengøring mellem gæster. Du fastsætter selv rengøringsgebyret.
            </p>
          </div>
        </label>
      </RadioGroup>
    </div>
  );

  const renderStep5 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <Sparkles className="w-12 h-12 text-accent mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-primary mb-2">
          Professionel markedsføring
        </h3>
        <p className="text-muted-foreground">
          Giv dit sommerhus den bedste start med professionelle billeder og video
        </p>
      </div>

      <Card className={`border-2 transition-all ${hasAddons ? 'border-accent' : 'border-border'}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-accent" />
            <Video className="w-5 h-5 text-accent" />
            Professionel foto & video pakke
          </CardTitle>
          <CardDescription>
            Vores udlejningsspecialist besøger dit sommerhus og skaber professionelt indhold
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-accent" />
              15-20 professionelle billeder i høj kvalitet
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-accent" />
              2-3 minutters promoveringsvideo
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-accent" />
              Drone-optagelser (hvis muligt)
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-accent" />
              Optimeret til alle platforme
            </li>
          </ul>

          <div className="pt-4 border-t">
            <div className="flex items-center justify-between mb-4">
              <span className="text-2xl font-bold text-primary">
                {addonPrice.toLocaleString('da-DK')} kr.
              </span>
              <Checkbox
                checked={hasAddons}
                onCheckedChange={checked => {
                  updateData({
                    addons: {
                      ...data.addons,
                      proPhotos: !!checked,
                      proVideo: !!checked,
                      paymentMethod: checked ? 'bookings' : null,
                    },
                  });
                }}
              />
            </div>

            {hasAddons && (
              <div className="space-y-3 pt-4 border-t">
                <Label>Hvordan vil du betale?</Label>
                <RadioGroup
                  value={data.addons.paymentMethod || 'bookings'}
                  onValueChange={(value: 'now' | 'bookings') =>
                    updateData({ addons: { ...data.addons, paymentMethod: value } })
                  }
                  className="space-y-2"
                >
                  <label
                    className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-all ${
                      data.addons.paymentMethod === 'now'
                        ? 'border-accent bg-accent/5'
                        : 'border-border hover:border-accent/50'
                    }`}
                  >
                    <RadioGroupItem value="now" />
                    <div>
                      <span className="font-medium">Betal nu</span>
                      <p className="text-xs text-muted-foreground">
                        Engangsbetaling på {addonPrice.toLocaleString('da-DK')} kr.
                      </p>
                    </div>
                  </label>
                  <label
                    className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-all ${
                      data.addons.paymentMethod === 'bookings'
                        ? 'border-accent bg-accent/5'
                        : 'border-border hover:border-accent/50'
                    }`}
                  >
                    <RadioGroupItem value="bookings" />
                    <div>
                      <span className="font-medium">Betal gennem bookings</span>
                      <p className="text-xs text-muted-foreground">
                        Beløbet fratrækkes automatisk fra dine første udbetalinger
                      </p>
                    </div>
                  </label>
                </RadioGroup>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <p className="text-center text-sm text-muted-foreground">
        Du kan altid tilkøbe denne pakke senere fra din ejerportal
      </p>
    </div>
  );

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return data.title && data.address && data.region;
      case 2:
        return data.capacity > 0 && data.bedrooms > 0 && data.bathrooms > 0;
      default:
        return true;
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {renderStepIndicator()}

      <Card>
        <CardHeader>
          <CardTitle>
            {currentStep === 1 && 'Grundlæggende information'}
            {currentStep === 2 && 'Detaljer om dit sommerhus'}
            {currentStep === 3 && 'Faciliteter og husregler'}
            {currentStep === 4 && 'Rengøring'}
            {currentStep === 5 && 'Tilkøb'}
          </CardTitle>
          <CardDescription>
            {currentStep === 1 && 'Fortæl os om dit sommerhus'}
            {currentStep === 2 && 'Beskriv hvad dit sommerhus tilbyder'}
            {currentStep === 3 && 'Hvad gør dit sted unikt?'}
            {currentStep === 4 && 'Vælg hvordan rengøring skal håndteres'}
            {currentStep === 5 && 'Vælg ekstra services'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderStep4()}
          {currentStep === 5 && renderStep5()}

          <div className="flex justify-between mt-8 pt-6 border-t">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 1}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Tilbage
            </Button>

            {currentStep < totalSteps ? (
              <Button onClick={handleNext} disabled={!canProceed()}>
                Næste
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? 'Opretter...' : 'Opret sommerhus'}
                <Check className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
