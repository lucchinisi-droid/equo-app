-- Equo: guide degli agenti AI allineate ai nuovi testi delle app (7 ottobre 2026)
-- «struttura» resta solo dove è una scelta (tipo di cliente: «Struttura (scuderia, maneggio, centro)», sezione Clienti → STRUTTURE);
-- altrove: «scuderia» (collegamenti e appuntamenti con Equo Scuderia) o «centro ippico» (chi gestisce il centro, gestionale).

update public.ai_conoscenze set aggiornato_il = now(), verificato_il = current_date,
  contenuto =
    replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(
    replace(replace(replace(replace(replace(replace(replace(replace(replace(
      contenuto,
      'Struttura collegata: trovi la chat in Messaggi → Strutture', 'Scuderia collegata: trovi la chat in Messaggi → Scuderie'),
      'Messaggi → Strutture', 'Messaggi → Scuderie'),
      'Messaggi → "Strutture"', 'Messaggi → "Scuderie"'),
      '"Strutture": le chat con le strutture collegate', '"Scuderie": le chat con le scuderie collegate'),
      'Codice della struttura', 'Codice della scuderia'),
      'la struttura deve accettarla', 'la scuderia deve accettarla'),
      'Annulla con la struttura', 'Annulla con la scuderia'),
      'In attesa della conferma della struttura', 'In attesa della conferma della scuderia'),
      'In attesa della struttura', 'In attesa della scuderia'),
      'Cavalli della struttura', 'Cavalli della scuderia'),
      'Proposta della struttura', 'Proposta della scuderia'),
      'Collega una struttura', 'Collega una scuderia'),
      'Struttura · Equo Scuderia', 'Scuderia collegata · Equo Scuderia'),
      'Equo per la tua struttura', 'Equo per il tuo centro ippico'),
      'Promemoria della struttura', 'Promemoria del centro ippico'),
      'Cavallo di proprietà della struttura', 'Cavallo di proprietà del centro ippico'),
      'Manutenzione struttura', 'Manutenzione centro ippico'),
      'Pulizia struttura', 'Pulizia scuderia'),
      'Gestore struttura', 'Gestore centro ippico')
where contenuto ~* 'struttur';

-- moduli dell'App proprietario («Nome struttura» resta solo nell'App del maniscalco, dove dipende dalla scelta del tipo di cliente)
update public.ai_conoscenze set aggiornato_il = now(), verificato_il = current_date,
  contenuto = replace(replace(contenuto, '"Nome struttura"', '"Nome del centro ippico"'), '"Telefono struttura"', '"Telefono del centro ippico"')
where ambito = 'proprietario' and (contenuto like '%"Nome struttura"%' or contenuto like '%"Telefono struttura"%');

update public.ai_conoscenze set aggiornato_il = now(), titolo = 'Come aggiungo un post-it nei promemoria del centro ippico'
where titolo = 'Come aggiungo un post-it nei promemoria della struttura';

-- App del maniscalco: «struttura» non compare più da nessuna parte (7/10, decisione di Simone)
update public.ai_conoscenze set aggiornato_il = now(), verificato_il = current_date,
  titolo = replace(replace(replace(replace(titolo, 'Strutture', 'Scuderie'), 'Struttura', 'Scuderia'), 'strutture', 'scuderie'), 'struttura', 'scuderia'),
  contenuto =
    replace(replace(replace(replace(replace(replace(replace(replace(replace(
      contenuto,
      'Struttura (scuderia, maneggio, centro)', 'Scuderia o centro ippico'),
      'Aggiungere un profilo struttura (centro/scuderia)', 'Aggiungere un profilo scuderia o centro ippico'),
      '"Nome struttura"', '"Nome scuderia o centro ippico"'),
      '"STRUTTURE"', '"SCUDERIE E CENTRI IPPICI"'),
      'Clienti → Strutture', 'Clienti → Scuderie e centri ippici'),
      'Strutture', 'Scuderie'),
      'Struttura', 'Scuderia'),
      'strutture', 'scuderie'),
      'struttura', 'scuderia')
where ambito = 'maniscalco' and (contenuto ~* 'struttur' or titolo ~* 'struttur');

-- controllo finale: deve dare 0 (nessun vecchio testo delle app rimasto nelle guide, nessuna «struttura» nelle guide del maniscalco)
select count(*) as vecchi_testi_rimasti from ai_conoscenze
where (ambito = 'maniscalco' and (contenuto ~* 'struttur' or titolo ~* 'struttur')) or contenuto ~ '(Messaggi → "?Strutture|Codice della struttura|In attesa della struttura|Annulla con la struttura|Cavalli della struttura|Collega una struttura|Equo per la tua struttura|Promemoria della struttura|Manutenzione struttura|Pulizia struttura|Cavallo di proprietà della struttura)'
   or (ambito = 'proprietario' and contenuto ~ '"(Nome|Telefono) struttura"');
