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
  Home, Check, ChevronLeft, ChevronRight,
  Wifi, Flame, PawPrint, Waves, TreePine, Car, Sparkles,
  Phone, Mail, Calculator
} from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

const propertyTypeValues = [
  { value: 'sommerhus', labelKey: 'calc.types.sommerhus' },
  { value: 'feriebolig', labelKey: 'calc.types.feriebolig' },
  { value: 'lejlighed', labelKey: 'calc.types.lejlighed' },
  { value: 'villa', labelKey: 'calc.types.villa' },
  { value: 'bondegård', labelKey: 'calc.types.bondegaard' },
];

const regionValues = [
  { value: 'nordjylland', labelKey: 'calc.regions.nordjylland', multiplier: 1.1 },
  { value: 'midtjylland', labelKey: 'calc.regions.midtjylland', multiplier: 1.0 },
  { value: 'syddanmark', labelKey: 'calc.regions.syddanmark', multiplier: 1.05 },
  { value: 'sjaelland', labelKey: 'calc.regions.sjaelland', multiplier: 1.15 },
  { value: 'hovedstaden', labelKey: 'calc.regions.hovedstaden', multiplier: 1.2 },
  { value: 'bornholm', labelKey: 'calc.regions.bornholm', multiplier: 1.25 },
];

const amenityValues = [
  { id: 'wifi', labelKey: 'calc.am.wifi', icon: Wifi },
  { id: 'fireplace', labelKey: 'calc.am.fireplace', icon: Flame },
  { id: 'pets', labelKey: 'calc.am.pets', icon: PawPrint },
  { id: 'pool', labelKey: 'calc.am.pool', icon: Waves },
  { id: 'nature', labelKey: 'calc.am.nature', icon: TreePine },
  { id: 'parking', labelKey: 'calc.am.parking', icon: Car },
  { id: 'luxury', labelKey: 'calc.am.luxury', icon: Sparkles },
];

const availabilityValues = [
  { value: 'full', labelKey: 'calc.avail.full', weeks: 52 },
  { value: 'summer', labelKey: 'calc.avail.summer', weeks: 20 },
  { value: 'partial', labelKey: 'calc.avail.partial', weeks: 12 },
  { value: 'offseason', labelKey: 'calc.avail.offseason', weeks: 30 },
];

export default function PriceCalculator() {
  const { t } = useTranslation();
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

  const STEPS = [
    { id: 1, title: t('calc.step1') },
    { id: 2, title: t('calc.step2') },
    { id: 3, title: t('calc.step3') },
    { id: 4, title: t('calc.step4') },
    { id: 5, title: t('calc.step5') },
    { id: 6, title: t('calc.step6') },
  ];

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
    let basePrice = 800 + (formData.size * 8) + (formData.sleepingPlaces * 100);
    const region = regionValues.find(r => r.value === formData.region);
    if (region) basePrice *= region.multiplier;
    const amenityBonus = formData.amenities.length * 0.05;
    basePrice *= (1 + amenityBonus);
    if (formData.distanceToBeach === 'under500') basePrice *= 1.15;
    else if (formData.distanceToBeach === '500to1000') basePrice *= 1.08;

    const availability = availabilityValues.find(a => a.value === formData.availability);
    const weeks = availability ? availability.weeks : formData.weeksPerYear;
    const occupancyRate = 0.65;

    const grossIncome = Math.round(basePrice * 7 * weeks * occupancyRate);
    const taxFreeAmount = 50200;
    const commission = 0.15;
    const netIncome = Math.round(grossIncome * (1 - commission));

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

  const nextStep = () => { if (canProceed() && step < STEPS.length) setStep(step + 1); };
  const prevStep = () => { if (step > 1) setStep(step - 1); };

  const income = calculateIncome();

  return (
    <div className="min-h-screen bg-background">
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

      <div className="bg-muted/50 py-3 border-b border-border">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap items-center justify-center gap-6 md:gap-12 text-sm">
            {[t('calc.trust1'), t('calc.trust2'), t('calc.trust3')].map((txt, i) => (
              <div key={i} className="flex items-center gap-2">
                <Check className="w-4 h-4 text-accent" />
                <span className="text-muted-foreground">{txt}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <main className="relative">
        <div className="grid lg:grid-cols-2 min-h-[calc(100vh-140px)]">
          <div className="flex items-center justify-center p-6 lg:p-12">
            <div className="w-full max-w-md bg-card rounded-2xl shadow-elevated p-8">
              <h2 className="font-display text-2xl font-bold text-primary mb-6">
                {STEPS[step - 1]?.title}
              </h2>

              {step === 1 && (
                <div className="space-y-5">
                  <div>
                    <Label>{t('calc.propType')}</Label>
                    <Select value={formData.propertyType} onValueChange={(v) => updateFormData('propertyType', v)}>
                      <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {propertyTypeValues.map(type => (
                          <SelectItem key={type.value} value={type.value}>{t(type.labelKey)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>{t('calc.size')} <span className="text-destructive">*</span></Label>
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
                    <Label>{t('calc.sleep')} <span className="text-destructive">*</span></Label>
                    <div className="flex items-center gap-4 mt-1.5">
                      <Button type="button" variant="outline" size="icon" onClick={() => updateFormData('sleepingPlaces', Math.max(1, formData.sleepingPlaces - 1))}>−</Button>
                      <span className="text-xl font-semibold w-12 text-center">{formData.sleepingPlaces}</span>
                      <Button type="button" variant="outline" size="icon" onClick={() => updateFormData('sleepingPlaces', Math.min(20, formData.sleepingPlaces + 1))}>+</Button>
                    </div>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-5">
                  <div>
                    <Label>{t('calc.region')} <span className="text-destructive">*</span></Label>
                    <Select value={formData.region} onValueChange={(v) => updateFormData('region', v)}>
                      <SelectTrigger className="mt-1.5"><SelectValue placeholder={t('calc.regionPh')} /></SelectTrigger>
                      <SelectContent>
                        {regionValues.map(region => (
                          <SelectItem key={region.value} value={region.value}>{t(region.labelKey)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>{t('calc.postal')}</Label>
                    <Input
                      type="text"
                      value={formData.postalCode}
                      onChange={(e) => updateFormData('postalCode', e.target.value)}
                      placeholder={t('calc.postalPh')}
                      className="mt-1.5"
                      maxLength={4}
                    />
                  </div>

                  <div>
                    <Label>{t('calc.beach')}</Label>
                    <Select value={formData.distanceToBeach} onValueChange={(v) => updateFormData('distanceToBeach', v)}>
                      <SelectTrigger className="mt-1.5"><SelectValue placeholder={t('calc.beachPh')} /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="under500">{t('calc.beach.under500')}</SelectItem>
                        <SelectItem value="500to1000">{t('calc.beach.500to1000')}</SelectItem>
                        <SelectItem value="1to3km">{t('calc.beach.1to3km')}</SelectItem>
                        <SelectItem value="over3km">{t('calc.beach.over3km')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4">
                  <p className="text-muted-foreground text-sm mb-4">{t('calc.amSubtitle')}</p>
                  <div className="grid grid-cols-2 gap-3">
                    {amenityValues.map(amenity => {
                      const Icon = amenity.icon;
                      const isSelected = formData.amenities.includes(amenity.id);
                      return (
                        <button
                          key={amenity.id}
                          type="button"
                          onClick={() => toggleAmenity(amenity.id)}
                          className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                            isSelected ? 'border-accent bg-accent/10 text-primary' : 'border-border bg-background hover:border-accent/50'
                          }`}
                        >
                          <Icon className={`w-5 h-5 ${isSelected ? 'text-accent' : 'text-muted-foreground'}`} />
                          <span className="text-sm font-medium">{t(amenity.labelKey)}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-4">
                  <p className="text-muted-foreground text-sm mb-4">{t('calc.availSubtitle')}</p>
                  <div className="space-y-3">
                    {availabilityValues.map(option => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => updateFormData('availability', option.value)}
                        className={`w-full flex items-center justify-between p-4 rounded-lg border transition-all ${
                          formData.availability === option.value ? 'border-accent bg-accent/10' : 'border-border bg-background hover:border-accent/50'
                        }`}
                      >
                        <span className="font-medium">{t(option.labelKey)}</span>
                        <span className="text-sm text-muted-foreground">{t('calc.avail.weeks').replace('{n}', String(option.weeks))}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {step === 5 && (
                <div className="space-y-5">
                  <div>
                    <Label>{t('calc.contact.name')} <span className="text-destructive">*</span></Label>
                    <Input type="text" value={formData.name} onChange={(e) => updateFormData('name', e.target.value)} placeholder={t('calc.contact.namePh')} className="mt-1.5" />
                  </div>

                  <div>
                    <Label>{t('calc.contact.email')} <span className="text-destructive">*</span></Label>
                    <Input type="email" value={formData.email} onChange={(e) => updateFormData('email', e.target.value)} placeholder={t('calc.contact.emailPh')} className="mt-1.5" />
                  </div>

                  <div>
                    <Label>{t('calc.contact.phone')}</Label>
                    <Input type="tel" value={formData.phone} onChange={(e) => updateFormData('phone', e.target.value)} placeholder="+45 12 34 56 78" className="mt-1.5" />
                  </div>

                  <div className="flex items-start gap-3 pt-2">
                    <Checkbox id="terms" checked={formData.acceptTerms} onCheckedChange={(checked) => updateFormData('acceptTerms', checked)} />
                    <label htmlFor="terms" className="text-sm text-muted-foreground leading-relaxed cursor-pointer">
                      {t('calc.contact.terms')}
                    </label>
                  </div>
                </div>
              )}

              {step === 6 && (
                <div className="space-y-6">
                  <div className="text-center py-4">
                    <Calculator className="w-12 h-12 text-accent mx-auto mb-4" />
                    <p className="text-muted-foreground mb-2">{t('calc.res.label')}</p>
                    <p className="text-5xl font-bold text-primary">
                      {income.netIncome.toLocaleString('da-DK')} kr.
                    </p>
                  </div>

                  <div className="space-y-3 bg-muted/50 rounded-xl p-5">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('calc.res.perNight')}</span>
                      <span className="font-semibold">{income.pricePerNight.toLocaleString('da-DK')} kr.</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('calc.res.weeksRented')}</span>
                      <span className="font-semibold">{t('calc.res.weeks').replace('{n}', String(income.weeksRented))}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('calc.res.gross')}</span>
                      <span className="font-semibold">{income.grossIncome.toLocaleString('da-DK')} kr.</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('calc.res.commission')}</span>
                      <span className="font-semibold text-destructive">-{Math.round(income.grossIncome * 0.2).toLocaleString('da-DK')} kr.</span>
                    </div>
                    <div className="pt-3 border-t border-border">
                      <div className="flex justify-between">
                        <span className="font-semibold text-primary">{t('calc.res.net')}</span>
                        <span className="font-bold text-xl text-accent">{income.netIncome.toLocaleString('da-DK')} kr.</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-accent/10 rounded-xl p-5 border border-accent/20">
                    <p className="text-sm text-primary mb-2 font-medium">🎉 {t('calc.res.bonus')}</p>
                    <p className="text-muted-foreground text-sm">
                      {t('calc.res.bonus.desc.pre')} <span className="font-semibold text-accent">{t('calc.res.bonus.amount')}</span> {t('calc.res.bonus.desc.post')}
                    </p>
                  </div>

                  <Button variant="gold" size="lg" className="w-full" asChild>
                    <Link to="/contact">
                      {t('calc.res.cta')}
                    </Link>
                  </Button>
                </div>
              )}

              {step < 6 && (
                <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
                  <span className="text-sm text-muted-foreground">
                    {t('calc.nav.stepOf').replace('{n}', String(step)).replace('{total}', String(STEPS.length))}
                  </span>
                  <div className="flex gap-3">
                    {step > 1 && (
                      <Button type="button" variant="ghost" onClick={prevStep}>
                        <ChevronLeft className="w-4 h-4 mr-1" />
                        {t('calc.nav.back')}
                      </Button>
                    )}
                    <Button type="button" variant="gold" onClick={nextStep} disabled={!canProceed()}>
                      {step === 5 ? t('calc.nav.seeResult') : t('calc.nav.next')}
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="hidden lg:block relative">
            <img
              src="https://l.icdbcdn.com/oh/648b6185-5c10-4bc9-8113-631bacd6b83e.jpg?w=1200"
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-background/20 to-transparent" />
          </div>
        </div>
      </main>

      <footer className="bg-card border-t border-border py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-center gap-8">
            <div className="flex -space-x-3">
              {[1,2,3,4].map(i => (
                <div key={i} className="w-12 h-12 rounded-full border-2 border-card bg-muted overflow-hidden">
                  <img src={`https://i.pravatar.cc/100?img=${i + 10}`} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
            <div className="text-center md:text-left">
              <p className="font-semibold text-primary mb-1">{t('calc.footer.title')}</p>
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
              <p className="text-xs text-muted-foreground mt-1">{t('calc.footer.hours')}</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
