import { PublicLayout } from '@/components/layout/PublicLayout';
import { motion } from 'framer-motion';

export default function Privacy() {
  return (
    <PublicLayout>
      <section className="pt-32 pb-8 bg-background">
        <div className="container mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <span className="text-primary font-body text-sm font-semibold tracking-[0.3em] uppercase block mb-6">Juridisk</span>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4"
          >
            Privatlivs<span className="text-primary italic font-normal">politik</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.4 }}
            className="text-muted-foreground max-w-xl mx-auto">
            Sidst opdateret: marts 2026
          </motion.p>
        </div>
      </section>

      <section className="py-16 bg-background">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="prose prose-invert max-w-none space-y-8">
            {[
              { title: '1. Dataansvarlig', content: 'SommerVibes ApS er dataansvarlig for behandlingen af de personoplysninger, vi modtager om dig. Du kan kontakte os på kontakt@sommervibes.dk.' },
              { title: '2. Formål med databehandling', content: 'Vi indsamler og behandler personoplysninger til følgende formål:\n• Administration af din ejerkonto og ejendom\n• Håndtering af bookinger og gæstekommunikation\n• Gennemførelse af betalinger og udbetalinger\n• Forbedring af vores tjenester\n• Markedsføring (kun med dit samtykke)' },
              { title: '3. Hvilke data indsamler vi?', content: 'Vi indsamler følgende kategorier af personoplysninger:\n• Kontaktoplysninger (navn, email, telefon, adresse)\n• Betalingsoplysninger (via Stripe — vi gemmer ikke kortdata)\n• Ejendomsoplysninger\n• Kommunikationshistorik\n• Tekniske data (IP-adresse, browsertype)' },
              { title: '4. Retsgrundlag', content: 'Behandlingen sker på grundlag af:\n• Opfyldelse af aftale (GDPR art. 6, stk. 1, litra b)\n• Retlig forpligtelse (GDPR art. 6, stk. 1, litra c)\n• Legitim interesse (GDPR art. 6, stk. 1, litra f)\n• Samtykke (GDPR art. 6, stk. 1, litra a)' },
              { title: '5. Opbevaringsperiode', content: 'Vi opbevarer dine personoplysninger så længe det er nødvendigt for de formål, de blev indsamlet til. Bogføringsdata opbevares i 5 år jf. bogføringsloven.' },
              { title: '6. Dine rettigheder', content: 'Du har ret til:\n• Indsigt i dine personoplysninger\n• Rettelse af forkerte oplysninger\n• Sletning af dine data\n• Begrænsning af behandling\n• Dataportabilitet\n• Indsigelse mod behandling\n\nKontakt os på kontakt@sommervibes.dk for at udøve dine rettigheder.' },
              { title: '7. Cookies', content: 'Vi bruger teknisk nødvendige cookies til at sikre hjemmesidens funktionalitet. Analytiske cookies bruges kun med dit samtykke.' },
              { title: '8. Databehandlere', content: 'Vi benytter følgende tredjeparter til databehandling:\n• Stripe (betalingsbehandling)\n• Hosting og infrastruktur\n\nAlle databehandlere er underlagt databehandleraftaler.' },
              { title: '9. Klage', content: 'Du kan klage til Datatilsynet over vores behandling af dine personoplysninger:\nDatatilsynet, Carl Jacobsens Vej 35, 2500 Valby, dt@datatilsynet.dk' },
            ].map((section, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
              >
                <h2 className="font-display text-xl font-semibold text-foreground mb-3">{section.title}</h2>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{section.content}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
