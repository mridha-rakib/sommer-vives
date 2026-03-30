import { GuestLayout } from '@/components/layout/GuestLayout';

export default function GuestPayment() {
  return (
    <GuestLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Betaling</h1>
          <p className="text-sm text-muted-foreground mt-1">Overblik over din betaling og kvitteringer</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-8 text-center">
          <p className="text-muted-foreground">Betalingsoversigt indlæses...</p>
        </div>
      </div>
    </GuestLayout>
  );
}
