import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const faqs = [
  {
    question: 'Hvad koster det at komme i gang?',
    answer: 'Det er gratis at oprette dit sommerhus hos os. Vi tager kun 20% i kommission af gennemførte lejeaftaler – ingen skjulte gebyrer.',
  },
  {
    question: 'Hvordan fungerer udlejningen?',
    answer: 'Når du har oprettet dit sommerhus, håndterer vi alt fra annoncering på de største portaler til booking, lejerdialog og rengøring. Du læner dig bare tilbage og modtager udbetalinger.',
  },
  {
    question: 'Kan jeg selv bestemme, hvornår mit sommerhus er ledigt?',
    answer: 'Ja, du har fuld kontrol over tilgængeligheden. Du kan blokere datoer for eget brug når som helst gennem vores ejerportal.',
  },
  {
    question: 'Hvem står for rengøringen?',
    answer: 'Vi samarbejder med professionelle, lokale rengøringspartnere, der sørger for at dit sommerhus altid er klar til næste lejer.',
  },
  {
    question: 'Hvordan modtager jeg mine udbetalinger?',
    answer: 'Udbetalinger sker automatisk efter hver afsluttet lejeperiode. Du kan følge med i alle transaktioner i din ejerportal.',
  },
  {
    question: 'Er der bindingsperiode?',
    answer: 'Nej, vi har ingen bindingsperiode. Du kan opsige samarbejdet når som helst uden varsel.',
  },
];

export function FAQSection() {
  return (
    <section id="faq" className="section-padding bg-background">
      <div className="container mx-auto">
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-primary mb-4">
            Ofte stillede spørgsmål
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Har du spørgsmål? Vi har samlet svar på de mest almindelige spørgsmål her.
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="bg-card rounded-lg border border-border px-6 data-[state=open]:border-accent/50 transition-colors"
              >
                <AccordionTrigger className="text-left font-display text-lg font-semibold text-primary hover:text-accent hover:no-underline py-5">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-5">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
