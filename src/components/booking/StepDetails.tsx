import { useBooking } from './BookingContext';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export const StepDetails = () => {
  const { state, update } = useBooking();

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="font-display text-3xl md:text-4xl font-semibold text-foreground mb-2">Dine oplysninger</h2>
        <p className="text-muted-foreground">Vi bruger dine oplysninger til at bekræfte din booking</p>
      </div>

      <div className="max-w-lg mx-auto space-y-5">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Fulde navn</label>
          <Input value={state.name} onChange={(e) => update({ name: e.target.value })}
            placeholder="Dit fulde navn" className="bg-card border-border h-12" />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">E-mail</label>
          <Input type="email" value={state.email} onChange={(e) => update({ email: e.target.value })}
            placeholder="din@email.dk" className="bg-card border-border h-12" />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Telefon (valgfrit)</label>
          <Input type="tel" value={state.phone} onChange={(e) => update({ phone: e.target.value })}
            placeholder="+45 12 34 56 78" className="bg-card border-border h-12" />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Besked (valgfrit)</label>
          <Textarea value={state.message} onChange={(e) => update({ message: e.target.value })}
            placeholder="Særlige ønsker eller spørgsmål..." className="bg-card border-border min-h-[120px]" />
        </div>
      </div>
    </div>
  );
};
