import { PublicLayout } from '@/components/layout/PublicLayout';
import { motion } from 'framer-motion';

export default function Terms() {
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
            Vilkår og <span className="text-primary italic font-normal">betingelser</span>
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
              { title: '1. Generelt', content: 'Disse vilkår gælder for alle aftaler mellem SommerVibes ApS (herefter "SommerVibes") og sommerhusejere (herefter "Ejer") om formidling af udlejning af sommerhuse.' },
              { title: '2. Formidlingsaftale', content: 'Ved oprettelse af en ejendom på SommerVibes-platformen indgår Ejer en formidlingsaftale, hvorved SommerVibes bemyndiges til at markedsføre og formidle udlejning af Ejers sommerhus.\n\nSommerVibes handler som formidler — ikke som udlejer. Lejeaftalen indgås mellem Ejer og gæst.' },
              { title: '3. Kommission og gebyrer', content: '• Ejerkommission: 15% af den samlede lejepris (ekskl. gæsteservicegebyr)\n• Gæsteservicegebyr: 5% tillægges gæstens pris\n• Ingen oprettelsesgebyr\n• Ingen faste månedlige udgifter\n\nKommissionen fratrækkes automatisk inden udbetaling til Ejer.' },
              { title: '4. Binding og opsigelse', content: 'Aftalen har en bindingsperiode på 6 måneder fra oprettelsesdato. Herefter kan aftalen opsiges med 30 dages skriftlig varsel til udgangen af en måned.\n\nAllerede bekræftede bookinger skal altid gennemføres, også efter opsigelse.' },
              { title: '5. Udbetalinger', content: 'SommerVibes udbetaler lejeindtægter til Ejer månedligt. Udbetalingen foretages senest 14 dage efter gæstens afrejse.\n\nEjer er selv ansvarlig for indberetning af lejeindtægter til SKAT.' },
              { title: '6. Ejers forpligtelser', content: '• Holde sommerhuset i ordentlig og udlejningsklar stand\n• Sikre at alle oplysninger om ejendommen er korrekte og opdaterede\n• Meddele SommerVibes om ændringer i tilgængelighed\n• Overholde gældende lovgivning vedr. udlejning af sommerhuse' },
              { title: '7. SommerVibes\' forpligtelser', content: '• Professionel markedsføring af ejendommen\n• Håndtering af gæstekommunikation\n• Koordinering af rengøring (efter aftale)\n• Gennemsigtig rapportering og udbetalinger\n• Support i åbningstiden' },
              { title: '8. Rengøring', content: 'Slutrengøring koordineres af SommerVibes og betales af gæsten som en del af den samlede bookingpris. Ejer kan selv varetage rengøring efter aftale.' },
              { title: '9. Forsikring', content: 'SommerVibes dækker pludselige og uforudsete skader på ejendommen under lejeperioden inden for rimelige grænser. Ejer anbefales at opretholde egen ejendomsforsikring.' },
              { title: '10. Skattemæssige forhold', content: 'SommerVibes er registreret som udlejningsbureau, hvilket giver Ejer adgang til det fulde bundfradrag (50.200 kr. for 2024). SommerVibes indberetter udlejningsindtægter til SKAT på Ejers vegne.' },
              { title: '11. Ansvarsbegrænsning', content: 'SommerVibes er ikke ansvarlig for indirekte tab, herunder tabt fortjeneste, driftstab eller følgeskader. SommerVibes\' samlede ansvar kan ikke overstige den samlede kommission modtaget i de seneste 12 måneder.' },
              { title: '12. Tvister', content: 'Enhver tvist skal søges løst ved forhandling. Kan enighed ikke opnås, afgøres tvisten ved de danske domstole efter dansk ret.' },
              { title: '13. Kontakt', content: 'SommerVibes ApS\nkontakt@sommervibes.dk\n+45 12 34 56 78' },
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
