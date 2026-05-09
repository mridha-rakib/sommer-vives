
CREATE OR REPLACE FUNCTION public.generate_sag_tasks(p_listing_id uuid, p_listing_name text, p_assigned_to uuid DEFAULT NULL::uuid, p_assigned_name text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  task_rec RECORD;
  task_list text[][] := ARRAY[
    -- Phase 1: Opstart & Formalia (11 tasks)
    ARRAY['Send formidlingsaftale til underskrift', 'Formidlingsaftalen skal sendes til ejer via email', 'high', '1'],
    ARRAY['Modtag underskrevet formidlingsaftale', 'Bekræft at aftalen er underskrevet og arkiveret', 'high', '2'],
    ARRAY['Send velkomstmail og tak for indgået formidlingsaftale til husejer + giv dem adgang til MitSommerVibes', 'Send velkomstmail til ejer med tak for samarbejdet og opret deres adgang til MitSommerVibes-portalen', 'high', '2'],
    ARRAY['Indhent persondatasamtykke (GDPR)', 'Ejer skal acceptere persondatabehandling', 'high', '3'],
    ARRAY['Opret ejerprofil med kontaktinfo', 'Fulde kontaktoplysninger på ejeren', 'normal', '4'],
    ARRAY['Registrer ejerens bankoplysninger', 'Til udbetaling af lejeindtægt', 'normal', '5'],
    ARRAY['Indhent CPR-nummer på ejer', 'Påkrævet til skatteindberetning', 'high', '6'],
    ARRAY['Indhent ejerens adresse', 'Nødvendig til aftale og fakturering', 'normal', '7'],
    ARRAY['Verificer ejendomsadresse', 'Kontroller at adressen er korrekt', 'normal', '8'],
    ARRAY['Opret sag i pipeline', 'Sagen skal have korrekt status i systemet', 'normal', '1'],
    ARRAY['Tildel ansvarlig mægler', 'Sæt ansvarlig udlejningsrådgiver', 'high', '1'],

    -- Phase 2: Ejendomsklargøring (10 tasks)
    ARRAY['Bestil professionelle fotos', 'Kontakt fotograf og book tid', 'high', '7'],
    ARRAY['Modtag og sorter fotos', 'Upload og organiser billederne i listingen', 'high', '14'],
    ARRAY['Bestil drone-fotos/video', 'Dronefotos af ejendommen og området', 'normal', '14'],
    ARRAY['Lav grundplan / plantegning', 'Plantegning over ejendommen', 'normal', '14'],
    ARRAY['Bestil og installer nøgleboks', 'Kontakt servicepartner for nøgleboks', 'high', '10'],
    ARRAY['Verificer nøgleboks-installation', 'Tjek at koden virker og placeringen er korrekt', 'normal', '14'],
    ARRAY['Opsæt WiFi-information', 'Registrer WiFi-navn og kode', 'normal', '7'],
    ARRAY['Lav velkomstguide / check-in guide', 'Ankomstinstruktioner til gæster', 'normal', '14'],
    ARRAY['Bestil rengøringspartner', 'Find og tilknyt rengøringsfirma', 'high', '10'],
    ARRAY['Aftale rengøringspris og tjekliste', 'Bekræft pris og omfang af rengøring', 'normal', '14'],

    -- Phase 3: Indhold & Listing (10 tasks)
    ARRAY['Skriv kort beskrivelse', 'Fængende kort tekst til listingen', 'high', '7'],
    ARRAY['Skriv lang beskrivelse', 'Detaljeret beskrivelse af ejendommen', 'normal', '10'],
    ARRAY['Tilføj faciliteter og udstyr', 'WiFi, opvaskemaskine, grill mv.', 'normal', '7'],
    ARRAY['Sæt husregler', 'Regler for gæster (rygning, husdyr mv.)', 'normal', '7'],
    ARRAY['Tilføj highlights / USPer', 'Ejendommens unikke styrker', 'normal', '7'],
    ARRAY['Opsæt soveværelsesinformation', 'Antal senge, sengetyper, billeder', 'normal', '10'],
    ARRAY['Tilføj område-beskrivelse', 'Info om lokalområdet og attraktioner', 'normal', '14'],
    ARRAY['Sæt check-in og check-out tider', 'Standard tidspunkter for ankomst/afgang', 'normal', '3'],
    ARRAY['Upload hovedbillede (hero)', 'Vælg det bedste billede som forsidebillede', 'high', '14'],
    ARRAY['Tilføj praktisk information', 'Parkering, affald, nøgler mv.', 'normal', '14'],

    -- Phase 4: Prissætning (6 tasks)
    ARRAY['Sæt basispris per nat', 'Grundlæggende pris for udlejning', 'high', '5'],
    ARRAY['Sæt weekendpris', 'Evt. forhøjet pris i weekender', 'normal', '7'],
    ARRAY['Sæt rengøringspris', 'Rengøringsgebyr per ophold', 'high', '5'],
    ARRAY['Opsæt sæsonpriser', 'Højsæson, lavsæson og mellemsæson', 'normal', '14'],
    ARRAY['Konfigurer minimum-nætter', 'Mindste antal nætter per booking', 'normal', '5'],
    ARRAY['Konfigurer rabatter', 'Ugerabat, månedsrabat mv.', 'low', '21'],

    -- Phase 5: Kanaler & Distribution (8 tasks)
    ARRAY['Klargør Airbnb-annonce', 'Kanalspecifikt indhold til Airbnb', 'normal', '21'],
    ARRAY['Klargør Booking.com-annonce', 'Kanalspecifikt indhold til Booking.com', 'normal', '21'],
    ARRAY['Publicer på SommerVibes.dk', 'Aktivér listingen på egen platform', 'high', '14'],
    ARRAY['Opsæt iCal-synkronisering', 'Kalendersync mellem kanaler', 'normal', '21'],
    ARRAY['Overfør indhold til kanaler', 'Push beskrivelser og billeder ud', 'normal', '21'],
    ARRAY['Verificer live-annonce', 'Tjek at alt ser korrekt ud online', 'normal', '21'],
    ARRAY['Tilføj SEO-metadata', 'Meta-titel og beskrivelse til Google', 'low', '14'],
    ARRAY['Tilknyt Beds24-integration', 'Opsæt channel manager', 'normal', '21'],

    -- Phase 6: Drift & Løbende (6 tasks)
    ARRAY['Opsæt automatiske emails', 'Booking-bekræftelse, check-in info mv.', 'normal', '21'],
    ARRAY['Opret tilkøbsmuligheder', 'Sengetøj, håndklæder, brænde mv.', 'normal', '14'],
    ARRAY['Lav første udlejningsrapport', 'Månedlig rapport til ejer', 'low', '60'],
    ARRAY['Planlæg opfølgning med ejer', 'Status-møde efter første bookinger', 'normal', '30'],
    ARRAY['Verificer skatteindberetning', 'Kontroller at data er korrekt', 'low', '90'],
    ARRAY['Kvalitetstjek efter første gæst', 'Evaluer gæsteoplevelsen', 'normal', '45']
  ];
  i int;
BEGIN
  IF EXISTS (SELECT 1 FROM system_tasks WHERE linked_type = 'listing' AND linked_id = p_listing_id LIMIT 1) THEN
    RETURN;
  END IF;

  FOR i IN 1..array_length(task_list, 1) LOOP
    INSERT INTO system_tasks (
      title, description, linked_type, linked_id, linked_name,
      assigned_to, assigned_name, priority, status, source, due_date
    ) VALUES (
      task_list[i][1],
      task_list[i][2],
      'listing',
      p_listing_id,
      p_listing_name,
      p_assigned_to,
      p_assigned_name,
      task_list[i][3]::task_priority,
      'not_started',
      'system',
      CURRENT_DATE + (task_list[i][4]::int)
    );
  END LOOP;
END;
$function$;
