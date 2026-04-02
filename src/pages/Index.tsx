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
  // Opstart
  { q: 'Hvordan starter jeg op med SommerVibes?', a: 'Det tager fem minutter at oprette din bolig online. En personlig rådgiver tager kontakt inden for 24 timer og guider dig igennem næste skridt — billeder, tekst og publicering.' },
  { q: 'Hvor hurtigt kan mit hus komme live?', a: 'De fleste husejere er klar til første booking inden for 1–2 uger efter oprettelse. Vi klarer fotografering, listing og publicering.' },
  // Økonomi
  { q: 'Hvad koster det at udleje med jer?', a: 'Oprettelse er gratis. Vi tager 15 % af gennemførte bookinger. Gæsten betaler et servicegebyr på 5 %. Ingen opstartsgebyrer, ingen skjulte omkostninger.' },
  { q: 'Hvornår udbetales min indtjening?', a: 'Din udbetaling overføres kort efter gæstens check-in. Du kan altid følge med i din ejerportal.' },
  // Drift
  { q: 'Kan jeg stadig bruge huset selv?', a: 'Helt naturligt. Du blokerer de perioder, du selv vil bruge huset, direkte i din ejerportal. Du bestemmer altid.' },
  { q: 'Hvordan tager I jer af gæster og rengøring?', a: 'Vi håndterer al gæstekommunikation og koordinerer slutrengøring med lokale samarbejdspartnere. Gæstens pris inkluderer altid rengøringsgebyr, så du aldrig selv står med det.' },
  { q: 'Må jeg også udleje via andre kanaler?', a: 'Ja. Din bolig er din. Vi kan endda hjælpe med at koordinere kalenderen, så du undgår dobbeltbookinger.' },
  // Aftale & tryghed
  { q: 'Hvordan fungerer jeres 6 måneders aftale?', a: 'Vi investerer tid i professionelle billeder, listingopsætning og markedsføring fra dag ét. Aftalen sikrer, at vi begge får det bedste ud af samarbejdet. Herefter er du fri til at opsige.' },
  { q: 'Hvad hvis en gæst forårsager skade?', a: 'Vores udlejningsforsikring dækker pludselige og uforudsete skader, der opstår under gæstens ophold. Du kan læse vilkårene i din aftale.' },
  { q: 'Hvad skal jeg selv have klar?', a: 'Meget lidt. Vi hjælper dig hele vejen. Du skal blot have adgang til huset og en god idé om, hvornår det er ledigt.' },
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
      <PricingSection />
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
