import { PublicLayout } from '@/components/layout/PublicLayout';
import { HeroSection } from '@/components/landing/HeroSection';
import { PremiumServicesSection } from '@/components/landing/PremiumServicesSection';
import { ExitIntentPopup } from '@/components/landing/ExitIntentPopup';
import { PropertyTypesSection } from '@/components/landing/PropertyTypesSection';
import { HowItWorksSection } from '@/components/landing/HowItWorksSection';
import { TestimonialsSection } from '@/components/landing/TestimonialsSection';
import { ContextualFAQ } from '@/components/landing/ContextualFAQ';
import { ContactExpertsSection } from '@/components/landing/ContactExpertsSection';

const homeFAQs = [
  { q: 'Hvordan kommer jeg i gang?', a: 'Det tager fem minutter at oprette din bolig online. Vi tager kontakt bagefter med en personlig rådgiver, der hjælper dig resten af vejen — fra billeder til publicering.' },
  { q: 'Hvad koster det?', a: 'Oprettelse er gratis. Vi tager 15 % af gennemførte bookinger. Gæsten betaler et servicegebyr på 5 %. Ingen opstartsgebyrer, ingen skjulte omkostninger.' },
  { q: 'Kan jeg selv bruge mit hus?', a: 'Helt naturligt. Du blokerer de perioder, du selv vil bruge huset, direkte i din ejerportal. Du bestemmer altid.' },
  { q: 'Hvordan fungerer rengøring?', a: 'Vi koordinerer slutrengøring med lokale samarbejdspartnere. Gæstens pris inkluderer altid rengøringsgebyr, så du aldrig selv står med det.' },
  { q: 'Må jeg også udleje andre steder?', a: 'Ja. Din bolig er din. Vi kan endda hjælpe med at koordinere kalenderen, så du undgår dobbeltbookinger.' },
  { q: 'Hvad dækker forsikringen?', a: 'Vores udlejningsforsikring dækker pludselige og uforudsete skader, der opstår under gæstens ophold. Du kan læse vilkårene i din aftale.' },
];

const Index = () => {
  return (
    <PublicLayout>
      <ExitIntentPopup />
      <HeroSection />
      <PremiumServicesSection />
      <PropertyTypesSection />
      <HowItWorksSection />
      <TestimonialsSection />
      <div id="faq">
        <ContextualFAQ
          heading="Spørgsmål & svar"
          subheading="Det skal være nemt at forstå, hvad du får."
          items={homeFAQs}
        />
      </div>
      <ContactExpertsSection />
    </PublicLayout>
  );
};

export default Index;
