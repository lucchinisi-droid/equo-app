-- Equo: guide degli agenti AI per meteo in Home (App e Scuderia) e lente di ricerca in Equo Scuderia (ottobre 2026)

-- Home a widget: in cima c'è il meteo (non più la barra di ricerca)
update public.ai_conoscenze set aggiornato_il = now(), verificato_il = current_date,
  contenuto = replace(contenuto, '1. Di base la Home è a widget: Oggi', '1. In cima c''è il meteo dei prossimi 7 giorni; sotto, di base, la Home è a widget: Oggi')
where titolo = 'Home a widget o vista standard' and contenuto not like '%meteo%';
update public.ai_conoscenze set aggiornato_il = now(), verificato_il = current_date,
  contenuto = replace(contenuto, '1. Di base la Home è a widget: Prossime scadenze', '1. In cima c''è il meteo dei prossimi 7 giorni; sotto, di base, la Home è a widget: Prossime scadenze')
where titolo = 'Home a widget o vista standard (proprietario)' and contenuto not like '%meteo%';

insert into public.ai_conoscenze (ambito, categoria, titolo, contenuto, attivo, verificato_il)
select a.ambito, 'guida', a.titolo,
'Dove: Home → riquadro in cima con i giorni e le icone del tempo
Passi:
1. La prima volta tocca "tocca per usare la tua posizione" e consenti la posizione: il meteo è quello di dove ti trovi.
2. Nel riquadro vedi i prossimi 7 giorni (giorno e icona).
3. Tocca il riquadro per il dettaglio: scegli il giorno in alto e scorri le ore con temperatura, pioggia in mm e vento.
Esempio: ' || a.esempio || '
Note: Ora per ora per i primi 2-3 giorni, poi ogni 6 ore. Se hai negato la posizione, riattivala nelle impostazioni del telefono (app o browser). Puoi anche chiedere all''assistente AI "che tempo fa domani da …?" (cliente, struttura, scuderia o località). Il sole grigio sbarrato vuol dire meteo non disponibile. La ricerca è nella lente in alto a destra. Fonte dei dati indicata in fondo al dettaglio.
Parole chiave: meteo, previsioni, tempo, pioggia, temperatura, vento, 7 giorni, ora per ora, posizione'
, true, current_date
from (values
  ('maniscalco', 'Meteo dei prossimi 7 giorni in Home', 'Luca guarda giovedì: pioggia dalle 14, sposta le ferrature all''aperto alla mattina.'),
  ('proprietario', 'Meteo dei prossimi 7 giorni in Home (proprietario)', 'Sara vede vento forte sabato e decide di uscire domenica con Rio.')
) a(ambito, titolo, esempio)
where not exists (select 1 from public.ai_conoscenze x where x.titolo = a.titolo);

insert into public.ai_conoscenze (ambito, categoria, titolo, contenuto, attivo, verificato_il)
select 'scuderia', 'guida', 'Meteo del centro in Home',
'Dove: Home → riquadro accanto al nome del centro
Passi:
1. Il meteo usa l''indirizzo del centro: se non lo vedi, vai in "Il tuo Centro" e compila indirizzo, città e provincia.
2. Nel riquadro vedi i prossimi 7 giorni (giorno e icona).
3. Tocca il riquadro per il dettaglio: scegli il giorno e scorri le ore con temperatura, pioggia e vento.
Esempio: la segreteria vede temporale sabato pomeriggio e sposta le lezioni in campo coperto.
Note: Ora per ora per i primi 2-3 giorni, poi ogni 6 ore. Se l''indirizzo non viene trovato compare "controllalo": verifica città e provincia. Puoi anche chiedere ad Athena o Merlino "che tempo fa sabato pomeriggio?" o il meteo di un''altra località.
Parole chiave: meteo, previsioni, tempo, pioggia, temperatura, vento, 7 giorni, ora per ora, indirizzo centro'
, true, current_date
where not exists (select 1 from public.ai_conoscenze where titolo = 'Meteo del centro in Home');

insert into public.ai_conoscenze (ambito, categoria, titolo, contenuto, attivo, verificato_il)
select 'scuderia', 'guida', 'Come cerco nel gestionale (lente)',
'Dove: lente in alto a destra (in Home accanto al meteo, sul telefono nella barra in alto); dal computer anche Ctrl+K (Cmd+K su Mac)
Passi:
1. Tocca la lente e scrivi: nome di un cavallo, codice Equo o microchip, nome di una persona, una data (es. 12/10) o un articolo come "fieno".
2. I risultati sono divisi in Cavalli, Persone (team, clienti, maniscalchi, rubrica), Lezioni, Magazzino e Sezioni.
3. Tocca un risultato (o premi Invio per il primo): si apre la scheda del cavallo, la chat con la persona, la lezione o l''articolo.
Esempio: scrivi "luna" e trovi il cavallo Luna, le sue lezioni e il proprietario.
Note: Cerca solo nelle sezioni incluse nel pacchetto del centro. Più parole restringono i risultati.
Parole chiave: cerca, ricerca, lente, trovare, cercare cavallo, cercare persona, microchip, ctrl k'
, true, current_date
where not exists (select 1 from public.ai_conoscenze where titolo = 'Come cerco nel gestionale (lente)');


insert into public.ai_conoscenze (ambito, categoria, titolo, contenuto, attivo, verificato_il)
select 'maniscalco', 'guida', 'Meteo accanto agli appuntamenti di oggi',
'Dove: Home → widget "Oggi" → accanto al cavallo/cliente di ogni appuntamento
Passi:
1. L''icona mostra il tempo previsto all''ora dell''appuntamento (alle 10 se non c''è l''ora), con la temperatura.
2. Il luogo è l''indirizzo del cliente; per le strutture collegate a Equo Scuderia quello del centro.
3. Il sole grigio sbarrato vuol dire meteo non disponibile: di solito manca l''indirizzo. Aggiungilo in Clienti → cliente → "Modifica" → Indirizzo (oppure con "Naviga", che lo salva).
Esempio: alle 15 da Marco Bianchi c''è la nuvola con la pioggia: Luca chiede a Marco di tenere Aurora al coperto.
Note: Puoi chiedere a Hammer "che tempo fa giovedì dalle Querce?" per avere il dettaglio ora per ora e un consiglio su quando ferrare.
Parole chiave: meteo appuntamento, icona meteo, pioggia, sole sbarrato, meteo non disponibile, indirizzo cliente, tempo'
, true, current_date
where not exists (select 1 from public.ai_conoscenze where titolo = 'Meteo accanto agli appuntamenti di oggi');

-- controllo finale: deve dare 5 e 2
select (select count(*) from ai_conoscenze where titolo in ('Meteo dei prossimi 7 giorni in Home','Meteo dei prossimi 7 giorni in Home (proprietario)','Meteo del centro in Home','Come cerco nel gestionale (lente)','Meteo accanto agli appuntamenti di oggi')) as guide_nuove,
       (select count(*) from ai_conoscenze where titolo in ('Home a widget o vista standard','Home a widget o vista standard (proprietario)') and contenuto like '%meteo%') as home_aggiornate;
