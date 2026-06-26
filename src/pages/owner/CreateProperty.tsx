import { OwnerLayout } from '@/components/layout/OwnerLayout';
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard';

export default function CreateProperty() {
  return (
    <OwnerLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-primary">Opret nyt sommerhus</h1>
        <p className="text-muted-foreground">
          Følg trinene nedenfor for at tilføje dit sommerhus til vores platform
        </p>
      </div>
      <OnboardingWizard />
    </OwnerLayout>
  );
}
