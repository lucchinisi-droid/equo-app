-- Equo: guide per Diario, nuova barra e Home (14 ottobre 2026) — da eseguire insieme al deploy
update public.ai_conoscenze set aggiornato_il = now(), verificato_il = current_date,
  contenuto = 'Dove: barra in basso → "Home"
Passi:
1. In alto vedi il saluto, il meteo e la carta "Oggi con (nome del cavallo)": con "Foto", "Vocale" e "Nota" scrivi subito un momento nel Diario.
2. Sotto la carta ci sono i tasti "Il Diario di (cavallo)", "Calendario" e "Spese": da qui si aprono Calendario e Spese.
3. Se nel Diario c''è una foto di un anno fa, compare "Un anno fa".
4. Poi i riquadri promozionali, "Spese questo mese", "Scadenze in arrivo", "ULTIMO MESSAGGIO", "Prossime scadenze" e "Servizi vicino a te".
Esempio: Sara apre Equo, tocca "Foto" nella carta "Oggi con Aurora" e il momento finisce nel Diario di Aurora.
Note: Se non hai ancora cavalli la Home mostra solo "Aggiungi il tuo primo cavallo". La barra in basso ha Home, Diario, il tasto "+" al centro, Chat e Cavalli. Il logo Equo in alto ti riporta sempre qui.
Parole chiave: home, pagina principale, schermata iniziale, dashboard, riepilogo, panoramica, oggi, calendario, spese'
where id = 'e32e9ae9-a31d-44cd-9017-312cf34955ba';

update public.ai_conoscenze set aggiornato_il = now(), verificato_il = current_date,
  contenuto = replace(replace(contenuto, 'barra in basso → "Calendario"', 'Home → "Calendario"'), 'barra in basso → "Spese"', 'Home → "Spese"')
where id in ('bc6561c0-bb2c-4216-bf20-83a9480cda45','79cff45a-2fee-4e4f-ba79-9a960cc4d7b1');

insert into public.ai_conoscenze (ambito, categoria, titolo, contenuto, attivo, verificato_il) values
('proprietario','guida','Come scrivo un momento nel Diario del mio cavallo',
'Dove: barra in basso → "Diario" (oppure il tasto "+" al centro della barra, oppure la carta "Oggi" nella Home)
Passi:
1. Tocca "+" al centro della barra in basso.
2. Scegli il "Cavallo" e il tipo: "Foto", "Nota" o "Vocale".
3. Foto: "Scatta o scegli una foto". Vocale: tocca il microfono per registrare (massimo 3 minuti) e tocca di nuovo per fermare. Nota: scrivi il testo.
4. Aggiungi, se vuoi, una riga e scegli la categoria: Allenamento, Passeggiata, Lezione, Cura, Traguardo o Altro.
5. Tocca "Salva nel Diario".
6. In "Diario" vedi la copertina del cavallo, i giorni di fila, i momenti del mese, gli ultimi 7 giorni con le foto e tutti i momenti. Con più cavalli scegli quale vedere dai tasti in alto.
Esempio: Marco scatta una foto di Rio al tramonto, scrive "Prima passeggiata dopo la pioggia", sceglie "Passeggiata" e salva: la foto compare nel Diario di Rio.
Note: Per ora ogni momento lo vedi solo tu (visibilità "solo tu"). "Nascondi" toglie un momento dal Diario ma resta nello storico del cavallo. Il video con Premium e la condivisione con la scuderia arrivano in seguito. Il Diario è una cosa diversa dal libretto sanitario, che resta nella scheda del cavallo.
Parole chiave: diario, foto, nota, vocale, momento, allenamento, passeggiata, giorni di fila, storico, ricordi, scrivere, +',
true, current_date);

-- controllo: deve dare 1 | 2 | 1
select (select count(*) from ai_conoscenze where titolo like 'Come scrivo un momento nel Diario%') as guida_diario,
       (select count(*) from ai_conoscenze where id in ('bc6561c0-bb2c-4216-bf20-83a9480cda45','79cff45a-2fee-4e4f-ba79-9a960cc4d7b1') and contenuto like '%Home → "%') as guide_aggiornate,
       (select count(*) from ai_conoscenze where id = 'e32e9ae9-a31d-44cd-9017-312cf34955ba' and contenuto like '%carta "Oggi%') as home;
