import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Home, Check, ChevronLeft, ChevronRight, MapPin, 
  Wifi, Flame, PawPrint, Waves, TreePine, Car, Sparkles,
  Phone, Mail, Calculator
} from 'lucide-react';

const STEPS = [
  { id: 1, title: 'Fortæl os om din feriebolig' },
  { id: 2, title: 'Hvor ligger din bolig?' },
  { id: 3, title: 'Hvad tilbyder din bolig?' },
  { id: 4, title: 'Hvornår kan boligen lejes ud?' },
  { id: 5, title: 'Din kontaktinformation' },
  { id: 6, title: 'Dit resultat' },
];

const propertyTypes = [
  { value: 'sommerhus', label: 'Sommerhus' },
  { value: 'feriebolig', label: 'Feriebolig' },
  { value: 'lejlighed', label: 'Lejlighed' },
  { value: 'villa', label: 'Villa' },
  { value: 'bondegård', label: 'Bondegård' },
];

const regions = [
  { value: 'nordjylland', label: 'Nordjylland', multiplier: 1.1 },
  { value: 'midtjylland', label: 'Midtjylland', multiplier: 1.0 },
  { value: 'syddanmark', label: 'Syddanmark', multiplier: 1.05 },
  { value: 'sjaelland', label: 'Sjælland', multiplier: 1.15 },
  { value: 'hovedstaden', label: 'Hovedstaden', multiplier: 1.2 },
  { value: 'bornholm', label: 'Bornholm', multiplier: 1.25 },
];

const amenities = [
  { id: 'wifi', label: 'WiFi', icon: Wifi },
  { id: 'fireplace', label: 'Brændeovn', icon: Flame },
  { id: 'pets', label: 'Kæledyr tilladt', icon: PawPrint },
  { id: 'pool', label: 'Pool', icon: Waves },
  { id: 'nature', label: 'Naturskønt område', icon: TreePine },
  { id: 'parking', label: 'P-plads', icon: Car },
  { id: 'luxury', label: 'Luksuriøst indrettet', icon: Sparkles },
];

const availabilityOptions = [
  { value: 'full', label: 'Hele året', weeks: 52 },
  { value: 'summer', label: 'Kun sommersæson (maj-sep)', weeks: 20 },
  { value: 'partial', label: 'Udvalgte uger', weeks: 12 },
  { value: 'offseason', label: 'Primært lavsæson', weeks: 30 },
];

export default function PriceCalculator() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    propertyType: 'sommerhus',
    size: 80,
    sleepingPlaces: 6,
    region: '',
    postalCode: '',
    distanceToBeach: '',
    amenities: [] as string[],
    availability: '',
    weeksPerYear: 20,
    name: '',
    email: '',
    phone: '',
    acceptTerms: false,
  });

  const updateFormData = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const toggleAmenity = (amenityId: string) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenityId)
        ? prev.amenities.filter(a => a !== amenityId)
        : [...prev.amenities, amenityId]
    }));
  };

  const calculateIncome = () => {
    // Base price per night based on size and sleeping places
    let basePrice = 800 + (formData.size * 8) + (formData.sleepingPlaces * 100);
    
    // Region multiplier
    const region = regions.find(r => r.value === formData.region);
    if (region) basePrice *= region.multiplier;
    
    // Amenities bonus
    const amenityBonus = formData.amenities.length * 0.05;
    basePrice *= (1 + amenityBonus);
    
    // Beach proximity bonus
    if (formData.distanceToBeach === 'under500') basePrice *= 1.15;
    else if (formData.distanceToBeach === '500to1000') basePrice *= 1.08;
    
    // Calculate annual income
    const availability = availabilityOptions.find(a => a.value === formData.availability);
    const weeks = availability ? availability.weeks : formData.weeksPerYear;
    const occupancyRate = 0.65; // 65% average occupancy
    
    const grossIncome = Math.round(basePrice * 7 * weeks * occupancyRate);
    const taxFreeAmount = 50200;
    const commission = 0.15;
    const netIncome = Math.round(grossIncome * (1 - commission));
    const taxableIncome = Math.max(0, netIncome - taxFreeAmount);
    const taxSavings = Math.round(taxableIncome * 0.4); // 40% of remaining is also tax-free
    
    return {
      grossIncome,
      netIncome,
      taxFreeAmount: Math.min(netIncome, taxFreeAmount),
      pricePerNight: Math.round(basePrice),
      weeksRented: Math.round(weeks * occupancyRate),
    };
  };

  const canProceed = () => {
    switch (step) {
      case 1: return formData.size > 0 && formData.sleepingPlaces > 0;
      case 2: return formData.region !== '';
      case 3: return true;
      case 4: return formData.availability !== '';
      case 5: return formData.name && formData.email && formData.acceptTerms;
      default: return true;
    }
  };

  const nextStep = () => {
    if (canProceed() && step < STEPS.length) {
      setStep(step + 1);
    }
  };

  const prevStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const income = calculateIncome();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <Link to="/" className="flex items-center gap-2">
            <Home className="h-6 w-6 text-primary" />
            <span className="font-display text-xl font-bold">
              <span className="text-primary">Sommer</span>
              <span className="text-accent">Vibes</span>
              <span className="text-primary text-sm">.dk</span>
            </span>
          </Link>
        </div>
      </header>

      {/* Trust Bar */}
      <div className="bg-muted/50 py-3 border-b border-border">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap items-center justify-center gap-6 md:gap-12 text-sm">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-accent" />
              <span className="text-muted-foreground">50.200 kr. skattefrit og kun 15% i kommission</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-accent" />
              <span className="text-muted-foreground">Udlej på de største portaler</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-accent" />
              <span className="text-muted-foreground">Ingen binding og besvær</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="relative">
        <div className="grid lg:grid-cols-2 min-h-[calc(100vh-140px)]">
          {/* Form Side */}
          <div className="flex items-center justify-center p-6 lg:p-12">
            <div className="w-full max-w-md bg-card rounded-2xl shadow-elevated p-8">
              <h2 className="font-display text-2xl font-bold text-primary mb-6">
                {STEPS[step - 1]?.title}
              </h2>

              {/* Step 1: Property Details */}
              {step === 1 && (
                <div className="space-y-5">
                  <div>
                    <Label>Boligtype</Label>
                    <Select
                      value={formData.propertyType}
                      onValueChange={(v) => updateFormData('propertyType', v)}
                    >
                      <SelectTrigger className="mt-1.5">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {propertyTypes.map(type => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>
                      Størrelse i m² <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      type="number"
                      value={formData.size}
                      onChange={(e) => updateFormData('size', parseInt(e.target.value) || 0)}
                      className="mt-1.5 text-center"
                      min={20}
                      max={500}
                    />
                  </div>

                  <div>
                    <Label>
                      Sovepladser <span className="text-destructive">*</span>
                    </Label>
                    <div className="flex items-center gap-4 mt-1.5">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => updateFormData('sleepingPlaces', Math.max(1, formData.sleepingPlaces - 1))}
                      >
                        −
                      </Button>
                      <span className="text-xl font-semibold w-12 text-center">{formData.sleepingPlaces}</span>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => updateFormData('sleepingPlaces', Math.min(20, formData.sleepingPlaces + 1))}
                      >
                        +
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Location */}
              {step === 2 && (
                <div className="space-y-5">
                  <div>
                    <Label>
                      Region <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={formData.region}
                      onValueChange={(v) => updateFormData('region', v)}
                    >
                      <SelectTrigger className="mt-1.5">
                        <SelectValue placeholder="Vælg region" />
                      </SelectTrigger>
                      <SelectContent>
                        {regions.map(region => (
                          <SelectItem key={region.value} value={region.value}>
                            {region.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Postnummer</Label>
                    <Input
                      type="text"
                      value={formData.postalCode}
                      onChange={(e) => updateFormData('postalCode', e.target.value)}
                      placeholder="f.eks. 9480"
                      className="mt-1.5"
                      maxLength={4}
                    />
                  </div>

                  <div>
                    <Label>Afstand til strand</Label>
                    <Select
                      value={formData.distanceToBeach}
                      onValueChange={(v) => updateFormData('distanceToBeach', v)}
                    >
                      <SelectTrigger className="mt-1.5">
                        <SelectValue placeholder="Vælg afstand" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="under500">Under 500 m</SelectItem>
                        <SelectItem value="500to1000">500-1000 m</SelectItem>
                        <SelectItem value="1to3km">1-3 km</SelectItem>
                        <SelectItem value="over3km">Over 3 km</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {/* Step 3: Amenities */}
              {step === 3 && (
                <div className="space-y-4">
                  <p className="text-muted-foreground text-sm mb-4">
                    Vælg de faciliteter din bolig har (valgfrit)
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {amenities.map(amenity => {
                      const Icon = amenity.icon;
                      const isSelected = formData.amenities.includes(amenity.id);
                      return (
                        <button
                          key={amenity.id}
                          type="button"
                          onClick={() => toggleAmenity(amenity.id)}
                          className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                            isSelected 
                              ? 'border-accent bg-accent/10 text-primary' 
                              : 'border-border bg-background hover:border-accent/50'
                          }`}
                        >
                          <Icon className={`w-5 h-5 ${isSelected ? 'text-accent' : 'text-muted-foreground'}`} />
                          <span className="text-sm font-medium">{amenity.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Step 4: Availability */}
              {step === 4 && (
                <div className="space-y-4">
                  <p className="text-muted-foreground text-sm mb-4">
                    Hvornår ønsker du at udleje din bolig?
                  </p>
                  <div className="space-y-3">
                    {availabilityOptions.map(option => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => updateFormData('availability', option.value)}
                        className={`w-full flex items-center justify-between p-4 rounded-lg border transition-all ${
                          formData.availability === option.value
                            ? 'border-accent bg-accent/10'
                            : 'border-border bg-background hover:border-accent/50'
                        }`}
                      >
                        <span className="font-medium">{option.label}</span>
                        <span className="text-sm text-muted-foreground">~{option.weeks} uger</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 5: Contact */}
              {step === 5 && (
                <div className="space-y-5">
                  <div>
                    <Label>
                      Fulde navn <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      type="text"
                      value={formData.name}
                      onChange={(e) => updateFormData('name', e.target.value)}
                      placeholder="Dit navn"
                      className="mt-1.5"
                    />
                  </div>

                  <div>
                    <Label>
                      E-mail <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => updateFormData('email', e.target.value)}
                      placeholder="din@email.dk"
                      className="mt-1.5"
                    />
                  </div>

                  <div>
                    <Label>Telefonnr.</Label>
                    <Input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => updateFormData('phone', e.target.value)}
                      placeholder="+45 12 34 56 78"
                      className="mt-1.5"
                    />
                  </div>

                  <div className="flex items-start gap-3 pt-2">
                    <Checkbox
                      id="terms"
                      checked={formData.acceptTerms}
                      onCheckedChange={(checked) => updateFormData('acceptTerms', checked)}
                    />
                    <label htmlFor="terms" className="text-sm text-muted-foreground leading-relaxed cursor-pointer">
                      Jeg accepterer at modtage information om udlejning og giver samtykke til behandling af mine data.
                    </label>
                  </div>
                </div>
              )}

              {/* Step 6: Results */}
              {step === 6 && (
                <div className="space-y-6">
                  <div className="text-center py-4">
                    <Calculator className="w-12 h-12 text-accent mx-auto mb-4" />
                    <p className="text-muted-foreground mb-2">Din estimerede årlige indtægt</p>
                    <p className="text-5xl font-bold text-primary">
                      {income.netIncome.toLocaleString('da-DK')} kr.
                    </p>
                  </div>

                  <div className="space-y-3 bg-muted/50 rounded-xl p-5">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Pris pr. nat (estimeret)</span>
                      <span className="font-semibold">{income.pricePerNight.toLocaleString('da-DK')} kr.</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Forventet udlejede uger</span>
                      <span className="font-semibold">{income.weeksRented} uger</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Bruttoindtægt</span>
                      <span className="font-semibold">{income.grossIncome.toLocaleString('da-DK')} kr.</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Kommission (20%)</span>
                      <span className="font-semibold text-destructive">-{Math.round(income.grossIncome * 0.2).toLocaleString('da-DK')} kr.</span>
                    </div>
                    <div className="pt-3 border-t border-border">
                      <div className="flex justify-between">
                        <span className="font-semibold text-primary">Netto til dig</span>
                        <span className="font-bold text-xl text-accent">{income.netIncome.toLocaleString('da-DK')} kr.</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-accent/10 rounded-xl p-5 border border-accent/20">
                    <p className="text-sm text-primary mb-2 font-medium">🎉 Skattefri bonus!</p>
                    <p className="text-muted-foreground text-sm">
                      De første <span className="font-semibold text-accent">47.900 kr.</span> af din lejeindtægt er helt skattefri. 
                      Og 40% af resten er også skattefri!
                    </p>
                  </div>

                  <Button variant="gold" size="lg" className="w-full" asChild>
                    <Link to="/contact">
                      Kom i gang med udlejning
                    </Link>
                  </Button>
                </div>
              )}

              {/* Navigation */}
              {step < 6 && (
                <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
                  <span className="text-sm text-muted-foreground">
                    Trin {step} af {STEPS.length}
                  </span>
                  <div className="flex gap-3">
                    {step > 1 && (
                      <Button type="button" variant="ghost" onClick={prevStep}>
                        <ChevronLeft className="w-4 h-4 mr-1" />
                        Tilbage
                      </Button>
                    )}
                    <Button 
                      type="button" 
                      variant="gold" 
                      onClick={nextStep}
                      disabled={!canProceed()}
                    >
                      {step === 5 ? 'Se resultat' : 'Næste'}
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Image Side */}
          <div className="hidden lg:block relative">
            <img
              src="https://l.icdbcdn.com/oh/648b6185-5c10-4bc9-8113-631bacd6b83e.jpg?w=1200"
              alt="Smukt sommerhus"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-background/20 to-transparent" />
          </div>
        </div>
      </main>

      {/* Contact Footer */}
      <footer className="bg-card border-t border-border py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-center gap-8">
            <div className="flex -space-x-3">
              {[1,2,3,4].map(i => (
                <div key={i} className="w-12 h-12 rounded-full border-2 border-card bg-muted overflow-hidden">
                  <img
                    src={`https://i.pravatar.cc/100?img=${i + 10}`}
                    alt="Team member"
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
            <div className="text-center md:text-left">
              <p className="font-semibold text-primary mb-1">Ring eller skriv til os</p>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm">
                <a href="tel:+4512345678" className="flex items-center gap-1 text-accent hover:underline">
                  <Phone className="w-4 h-4" />
                  +45 12 34 56 78
                </a>
                <a href="mailto:kontakt@sommervibes.dk" className="flex items-center gap-1 text-accent hover:underline">
                  <Mail className="w-4 h-4" />
                  kontakt@sommervibes.dk
                </a>
              </div>
              <p className="text-xs text-muted-foreground mt-1">08:00 - 16:00 alle hverdage</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
