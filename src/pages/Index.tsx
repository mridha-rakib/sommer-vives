import { PublicLayout } from '@/components/layout/PublicLayout';
import { HeroSection } from '@/components/landing/HeroSection';
import { PremiumServicesSection } from '@/components/landing/PremiumServicesSection';
import { ExitIntentPopup } from '@/components/landing/ExitIntentPopup';
import { EarningsSection } from '@/components/landing/EarningsSection';
import { HowItWorksSection } from '@/components/landing/HowItWorksSection';
import { WhyUsSection } from '@/components/landing/WhyUsSection';
import { PricingSection } from '@/components/landing/PricingSection';
import { TestimonialsSection } from '@/components/landing/TestimonialsSection';
import { ContextualFAQ } from '@/components/landing/ContextualFAQ';
import { ContactExpertsSection } from '@/components/landing/ContactExpertsSection';

const homeFAQs = [
  { q: 'Hvordan starter jeg op med SommerVibes?', a: 'Det tager fem minutter at oprette din bolig online. Vi tager kontakt bagefter med en personlig rådgiver, der hjælper dig resten af vejen — fra billeder til publicering.' },
  { q: 'Hvad koster det at udleje med jer?', a: 'Oprettelse er gratis. Vi tager 15 % af gennemførte bookinger. Gæsten betaler et servicegebyr på 5 %. Ingen opstartsgebyrer, ingen skjulte omkostninger.' },
  { q: 'Kan jeg stadig bruge huset selv?', a: 'Helt naturligt. Du blokerer de perioder, du selv vil bruge huset, direkte i din ejerportal. Du bestemmer altid.' },
  { q: 'Hvordan tager I jer af gæster og rengøring?', a: 'Vi håndterer al gæstekommunikation og koordinerer slutrengøring med lokale samarbejdspartnere. Gæstens pris inkluderer altid rengøringsgebyr, så du aldrig selv står med det.' },
  { q: 'Må jeg også udleje via andre kanaler?', a: 'Ja. Din bolig er din. Vi kan endda hjælpe med at koordinere kalenderen, så du undgår dobbeltbookinger.' },
  { q: 'Hvad hvis en gæst forårsager skade?', a: 'Vores udlejningsforsikring dækker pludselige og uforudsete skader, der opstår under gæstens ophold. Du kan læse vilkårene i din aftale.' },
];

const Index = () => {
  return (
    <PublicLayout>
      <ExitIntentPopup />
      <HeroSection />
      <PremiumServicesSection />
      <EarningsSection />
      <div id="saadan-virker-det">
        <HowItWorksSection />
      </div>
      <WhyUsSection />
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
