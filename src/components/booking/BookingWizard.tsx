import { useState } from 'react';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { CalendarDays, Home, Package, Clock, Receipt, ChevronRight, ChevronLeft, Check } from 'lucide-react';

interface BookingWizardProps {
  isOpen: boolean;
  onClose: () => void;
  property: {
    id: string;
    title: string;
    region: string;
    price_per_night?: number | null;
    price_per_week?: number | null;
    cleaning_fee?: number | null;
    capacity: number;
  };
  dateRange: { from?: Date; to?: Date };
  guests: number;
}

const BEDDING_PRICE_PER_PERSON = 200;
const EARLY_CHECKIN_PRICE_PER_PERSON = 200;
const ELECTRICITY_FEE_PER_DAY = 65;
const WATER_FEE_PER_DAY = 65;
const ADMIN_FEE = 125;
const SERVICE_FEE_PERCENT = 0.05;

export function BookingWizard({ isOpen, onClose, property, dateRange, guests }: BookingWizardProps) {
  const [step, setStep] = useState(1);
  const [addBedding, setAddBedding] = useState(false);
  const [addEarlyCheckin, setAddEarlyCheckin] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inquiryForm, setInquiryForm] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  });

  const pricePerNight = property.price_per_night || Math.round((property.price_per_week || 7000) / 7);
  const cleaningFee = property.cleaning_fee || 750;
  
  const nights = dateRange.from && dateRange.to
    ? Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  // Calculate all costs
  const accommodationTotal = pricePerNight * nights;
  const beddingTotal = addBedding ? BEDDING_PRICE_PER_PERSON * guests : 0;
  const earlyCheckinTotal = addEarlyCheckin ? EARLY_CHECKIN_PRICE_PER_PERSON * guests : 0;
  const electricityTotal = ELECTRICITY_FEE_PER_DAY * nights;
  const waterTotal = WATER_FEE_PER_DAY * nights;
  const subtotal = accommodationTotal + cleaningFee + beddingTotal + earlyCheckinTotal + electricityTotal + waterTotal + ADMIN_FEE;
  const serviceFee = Math.round(subtotal * SERVICE_FEE_PERCENT);
  const grandTotal = subtotal + serviceFee;

  const handleSubmitInquiry = async () => {
    if (!inquiryForm.name || !inquiryForm.email) {
      toast.error('Udfyld venligst navn og email');
      return;
    }
    if (!dateRange.from || !dateRange.to) {
      toast.error('Ingen datoer valgt');
      return;
    }

    setIsSubmitting(true);
    try {
      const addonsInfo = [];
      if (addBedding) addonsInfo.push(`Sengepakke: ${beddingTotal} kr.`);
      if (addEarlyCheckin) addonsInfo.push(`Tidlig indtjekning/udtjekning: ${earlyCheckinTotal} kr.`);
      
      const fullMessage = `${inquiryForm.message || 'Ingen besked'}

---
Tilkøb: ${addonsInfo.length > 0 ? addonsInfo.join(', ') : 'Ingen'}
Samlet pris inkl. gebyrer: ${grandTotal.toLocaleString('da-DK')} kr.`;

      const { error } = await supabase.from('inquiries').insert({
        property_id: property.id,
        guest_name: inquiryForm.name,
        guest_email: inquiryForm.email,
        guest_phone: inquiryForm.phone || null,
        message: fullMessage,
        check_in: format(dateRange.from, 'yyyy-MM-dd'),
        check_out: format(dateRange.to, 'yyyy-MM-dd'),
        guests: guests,
      });

      if (error) throw error;

      toast.success('Din forespørgsel er sendt! Vi vender tilbage hurtigst muligt.');
      onClose();
      setStep(1);
      setInquiryForm({ name: '', email: '', phone: '', message: '' });
      setAddBedding(false);
      setAddEarlyCheckin(false);
    } catch (error) {
      console.error('Error submitting inquiry:', error);
      toast.error('Der opstod en fejl. Prøv venligst igen.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = [
    { number: 1, title: 'Booking', icon: CalendarDays },
    { number: 2, title: 'Sengepakke', icon: Package },
    { number: 3, title: 'Tidlig check-in', icon: Clock },
    { number: 4, title: 'Overblik', icon: Receipt },
  ];

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center gap-2 mb-6">
      {steps.map((s, idx) => (
        <div key={s.number} className="flex items-center">
          <div 
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
              step === s.number 
                ? 'bg-accent text-accent-foreground' 
                : step > s.number 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted text-muted-foreground'
            }`}
          >
            {step > s.number ? <Check className="w-4 h-4" /> : s.number}
          </div>
          {idx < steps.length - 1 && (
            <div className={`w-8 h-0.5 mx-1 ${step > s.number ? 'bg-primary' : 'bg-muted'}`} />
          )}
        </div>
      ))}
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <Home className="w-12 h-12 mx-auto text-accent mb-4" />
        <h3 className="text-xl font-semibold text-primary mb-2">Din booking</h3>
        <p className="text-muted-foreground">Bekræft dine bookingdetaljer</p>
      </div>

      <div className="bg-muted/50 rounded-lg p-4 space-y-3">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Sommerhus</span>
          <span className="font-medium text-primary">{property.title}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Område</span>
          <span className="font-medium text-primary">{property.region}</span>
        </div>
        <Separator />
        <div className="flex justify-between">
          <span className="text-muted-foreground">Check-in</span>
          <span className="font-medium text-primary">
            {dateRange.from ? format(dateRange.from, 'd. MMMM yyyy', { locale: da }) : '-'}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Check-ud</span>
          <span className="font-medium text-primary">
            {dateRange.to ? format(dateRange.to, 'd. MMMM yyyy', { locale: da }) : '-'}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Antal nætter</span>
          <span className="font-medium text-primary">{nights}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Antal gæster</span>
          <span className="font-medium text-primary">{guests}</span>
        </div>
        <Separator />
        <div className="flex justify-between">
          <span className="text-muted-foreground">Pris pr. nat</span>
          <span className="font-medium text-primary">{pricePerNight.toLocaleString('da-DK')} kr.</span>
        </div>
        <div className="flex justify-between font-semibold">
          <span>Overnatning i alt</span>
          <span className="text-primary">{accommodationTotal.toLocaleString('da-DK')} kr.</span>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <Package className="w-12 h-12 mx-auto text-accent mb-4" />
        <h3 className="text-xl font-semibold text-primary mb-2">Sengepakke</h3>
        <p className="text-muted-foreground">Tilkøb af håndklæder og sengetøj</p>
      </div>

      <div 
        className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
          addBedding ? 'border-accent bg-accent/5' : 'border-border hover:border-accent/50'
        }`}
        onClick={() => setAddBedding(!addBedding)}
      >
        <div className="flex items-start gap-4">
          <Checkbox checked={addBedding} onCheckedChange={() => setAddBedding(!addBedding)} />
          <div className="flex-1">
            <h4 className="font-semibold text-primary mb-1">Lej sengepakke</h4>
            <p className="text-sm text-muted-foreground mb-2">
              Inkluderer friske håndklæder og sengetøj til alle gæster
            </p>
            <p className="text-sm font-medium text-accent">
              {BEDDING_PRICE_PER_PERSON} kr. pr. person × {guests} gæster = {(BEDDING_PRICE_PER_PERSON * guests).toLocaleString('da-DK')} kr.
            </p>
          </div>
        </div>
      </div>

      <p className="text-sm text-muted-foreground text-center">
        Du kan vælge at springe dette over, hvis du medbringer dit eget sengetøj og håndklæder.
      </p>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <Clock className="w-12 h-12 mx-auto text-accent mb-4" />
        <h3 className="text-xl font-semibold text-primary mb-2">Tidlig indtjekning/udtjekning</h3>
        <p className="text-muted-foreground">Fleksible check-in og check-out tider</p>
      </div>

      <div 
        className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
          addEarlyCheckin ? 'border-accent bg-accent/5' : 'border-border hover:border-accent/50'
        }`}
        onClick={() => setAddEarlyCheckin(!addEarlyCheckin)}
      >
        <div className="flex items-start gap-4">
          <Checkbox checked={addEarlyCheckin} onCheckedChange={() => setAddEarlyCheckin(!addEarlyCheckin)} />
          <div className="flex-1">
            <h4 className="font-semibold text-primary mb-1">Tidlig indtjekning & sen udtjekning</h4>
            <p className="text-sm text-muted-foreground mb-2">
              Check ind fra kl. 12:00 (i stedet for 15:00) og check ud til kl. 12:00 (i stedet for 10:00)
            </p>
            <p className="text-sm font-medium text-accent">
              {EARLY_CHECKIN_PRICE_PER_PERSON} kr. pr. person × {guests} gæster = {(EARLY_CHECKIN_PRICE_PER_PERSON * guests).toLocaleString('da-DK')} kr.
            </p>
          </div>
        </div>
      </div>

      <p className="text-sm text-muted-foreground text-center">
        Dette er valgfrit og afhænger af tilgængelighed.
      </p>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <Receipt className="w-12 h-12 mx-auto text-accent mb-4" />
        <h3 className="text-xl font-semibold text-primary mb-2">Prisoverblik</h3>
        <p className="text-muted-foreground">Samlet pris for dit ophold</p>
      </div>

      <div className="bg-muted/50 rounded-lg p-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">{pricePerNight.toLocaleString('da-DK')} kr. × {nights} nætter</span>
          <span>{accommodationTotal.toLocaleString('da-DK')} kr.</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Rengøringsgebyr</span>
          <span>{cleaningFee.toLocaleString('da-DK')} kr.</span>
        </div>
        
        {addBedding && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Sengepakke ({guests} pers.)</span>
            <span>{beddingTotal.toLocaleString('da-DK')} kr.</span>
          </div>
        )}
        
        {addEarlyCheckin && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Tidlig check-in/ud ({guests} pers.)</span>
            <span>{earlyCheckinTotal.toLocaleString('da-DK')} kr.</span>
          </div>
        )}

        <Separator className="my-2" />
        
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Elgebyr ({ELECTRICITY_FEE_PER_DAY} kr./dag × {nights} dage)</span>
          <span>{electricityTotal.toLocaleString('da-DK')} kr.</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Vandgebyr ({WATER_FEE_PER_DAY} kr./dag × {nights} dage)</span>
          <span>{waterTotal.toLocaleString('da-DK')} kr.</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Adm. gebyr (engangsgebyr)</span>
          <span>{ADMIN_FEE.toLocaleString('da-DK')} kr.</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Servicegebyr (5%)</span>
          <span>{serviceFee.toLocaleString('da-DK')} kr.</span>
        </div>

        <Separator className="my-2" />
        
        <div className="flex justify-between font-bold text-lg">
          <span className="text-primary">I alt</span>
          <span className="text-primary">{grandTotal.toLocaleString('da-DK')} kr.</span>
        </div>
      </div>

      {/* Contact form */}
      <div className="space-y-3 pt-4 border-t">
        <h4 className="font-semibold text-primary">Dine oplysninger</h4>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="wizard-name">Navn *</Label>
            <Input
              id="wizard-name"
              value={inquiryForm.name}
              onChange={(e) => setInquiryForm({ ...inquiryForm, name: e.target.value })}
              placeholder="Dit navn"
            />
          </div>
          <div>
            <Label htmlFor="wizard-email">Email *</Label>
            <Input
              id="wizard-email"
              type="email"
              value={inquiryForm.email}
              onChange={(e) => setInquiryForm({ ...inquiryForm, email: e.target.value })}
              placeholder="din@email.dk"
            />
          </div>
        </div>
        <div>
          <Label htmlFor="wizard-phone">Telefon</Label>
          <Input
            id="wizard-phone"
            type="tel"
            value={inquiryForm.phone}
            onChange={(e) => setInquiryForm({ ...inquiryForm, phone: e.target.value })}
            placeholder="+45 12 34 56 78"
          />
        </div>
        <div>
          <Label htmlFor="wizard-message">Besked til ejeren</Label>
          <Textarea
            id="wizard-message"
            value={inquiryForm.message}
            onChange={(e) => setInquiryForm({ ...inquiryForm, message: e.target.value })}
            placeholder="Fortæl os om dit ophold..."
            rows={2}
          />
        </div>
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-center">Booking af sommerhus</DialogTitle>
        </DialogHeader>

        {renderStepIndicator()}

        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        {step === 4 && renderStep4()}

        <div className="flex gap-3 pt-4">
          {step > 1 && (
            <Button
              variant="outline"
              onClick={() => setStep(step - 1)}
              className="flex-1"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Tilbage
            </Button>
          )}
          
          {step < 4 ? (
            <Button
              onClick={() => setStep(step + 1)}
              className="flex-1"
              variant="gold"
            >
              Næste
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <div className="flex-1 flex flex-col gap-2">
              <Button
                onClick={handleSubmitInquiry}
                disabled={isSubmitting}
                variant="gold"
                className="w-full"
              >
                {isSubmitting ? 'Sender...' : 'Send forespørgsel til ejeren'}
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                Du betaler ikke nu. Ejeren kontakter dig med bekræftelse.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
