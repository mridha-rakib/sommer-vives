import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { AdminSeasonRules } from './AdminSeasonRules';
import { AdminFeeRules } from './AdminFeeRules';
import { AdminAddOns } from './AdminAddOns';
import { AdminDiscounts } from './AdminDiscounts';

const TABS = [
  { value: 'seasons', label: 'Sæsonregler' },
  { value: 'fees', label: 'Gebyrer' },
  { value: 'addons', label: 'Tilkøb' },
  { value: 'discounts', label: 'Rabatter' },
] as const;

export function AdminPricingPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Priser & gebyrer</h1>
        <p className="text-sm text-muted-foreground mt-1">Administrér priser, sæsoner, gebyrer og tilkøb</p>
      </div>

      <Tabs defaultValue="seasons" className="w-full">
        <TabsList className="bg-muted/50 h-10 p-1 gap-1">
          {TABS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}
              className="text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md px-4">
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="seasons" className="mt-6"><AdminSeasonRules /></TabsContent>
        <TabsContent value="fees" className="mt-6"><AdminFeeRules /></TabsContent>
        <TabsContent value="addons" className="mt-6"><AdminAddOns /></TabsContent>
        <TabsContent value="discounts" className="mt-6"><AdminDiscounts /></TabsContent>
      </Tabs>
    </div>
  );
}
