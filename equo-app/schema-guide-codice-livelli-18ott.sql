-- Guide AI: codice cavallo a 3 livelli, proposte del maniscalco, conferme (18 ottobre 2026). Da eseguire DOPO il deploy.
-- Rieseguibile: toglie prima le schede con gli stessi titoli.
delete from public.ai_conoscenze where categoria = 'guida' and titolo in (
  'Come funziona il codice del mio cavallo (Provvisorio, Validato, Certificato)',
  'Il mio maniscalco mi ha preparato dei cavalli: come li accetto',
  'Come propongo i cavalli al proprietario',
  'Come confermo i dati di un cavallo (Da confermare)'
);
insert into public.ai_conoscenze (ambito, categoria, titolo, contenuto, attivo, verificato_il) values
('proprietario','guida','Come funziona il codice del mio cavallo (Provvisorio, Validato, Certificato)',
'Dove: barra in basso -> "Libretto" (o "Cavalli" -> apri il cavallo), in alto sopra i dati
Passi:
1. Ogni cavallo ha un codice Equo e un livello. Provvisorio: codice PRV-000123, appena creato. Validato: codice definitivo (es. PSA-000412), badge verde. Certificato: Validato + microchip verificato, badge dorato (solo prestigio).
2. Per diventare Validato servono nome, razza e data di nascita, la conferma del proprietario e la conferma di almeno un altro professionista collegato (maniscalco, istruttore o scuderia). Le conferme sono almeno 2, di 2 persone diverse, e una è sempre quella del proprietario.
3. Sulla scheda vedi la lista di cosa manca. Se i dati ci sono tocca "Confermo i dati"; se mancano tocca "Completa i dati".
4. Se cambi nome, razza o data di nascita le conferme degli altri decadono e vanno rinnovate: il cavallo torna Provvisorio ma tiene il codice definitivo già assegnato.
Esempio: Sara completa la data di nascita di Venere e tocca "Confermo i dati"; Alessandro, il maniscalco, conferma dalla sua Home e Venere diventa Validato con il codice definitivo.
Note: Una persona vale una conferma (la scuderia vale una persona sola). Il microchip si può cambiare senza perdere la conferma, ma torna "dichiarato". Dalla stessa scheda resta il codice che il professionista usa per trovare il cavallo.
Parole chiave: codice, codice equo, PRV, provvisorio, validato, certificato, conferma, conferme, badge, livello, definitivo', true, current_date),
('proprietario','guida','Il mio maniscalco mi ha preparato dei cavalli: come li accetto',
'Dove: barra in basso -> "Home", in alto compare il riquadro "(maniscalco) ha preparato N cavalli per te"
Passi:
1. Quando ti colleghi al tuo maniscalco con il suo codice, i cavalli che aveva già inserito per te compaiono nella Home come proposte.
2. Tocca "Accetta" per ogni cavallo (o "Accetta tutti"): il cavallo nasce nel tuo account con lo stesso codice e la stessa scheda del maniscalco, quindi non ci sono doppioni.
3. Se uno non è tuo tocca "Non è mio": il maniscalco potrà correggere la scheda e riproporlo.
4. Apri il cavallo, completa i dati che mancano (data di nascita, razza) e tocca "Confermo i dati". Poi il maniscalco o un altro professionista conferma come seconda persona.
Esempio: Marco scarica Equo, si collega ad Alessandro e vede Venere e White Night: accetta entrambi, aggiunge la data di nascita di Venere e conferma.
Note: Con il piano Free è completo un solo cavallo (il più vecchio): gli altri si aggiungono ma restano bloccati, sfocati, con il pulsante "Sblocca con Premium". Il maniscalco continua a registrare gli interventi, che restano al sicuro e compaiono appena passi a Premium.
Parole chiave: proposte, cavalli preparati, maniscalco ha inserito, accetta, non è mio, bloccato, sfocato, piano free, premium, doppioni', true, current_date)
;
insert into public.ai_conoscenze (ambito, categoria, titolo, contenuto, attivo, verificato_il) values
('maniscalco','guida','Come propongo i cavalli al proprietario',
'Dove: "Clienti" -> apri il cliente -> riquadro "Cavalli proposti al proprietario"
Passi:
1. Inserisci il cliente e i suoi cavalli come sempre (anche senza che abbia l''app) e invitalo a scaricare Equo con il suo codice invito.
2. Quando il cliente si collega a te, i suoi cavalli gli arrivano da soli come proposte nella Home.
3. Se aggiungi altri cavalli dopo il collegamento, apri il cliente e tocca "Proponi i cavalli al proprietario".
4. Nel riquadro vedi quanti sono in attesa, accettati e rifiutati. Se il proprietario tocca "Non è mio" puoi correggere la scheda e riproporla.
Esempio: Alessandro ha Venere e White Night su Marco Mattozzi; Marco si collega, accetta, completa i dati e Alessandro conferma.
Note: Il cavallo accettato ha lo stesso codice della tua scheda, senza doppioni. Con il piano Free del proprietario solo il primo cavallo è sbloccato per lui: tu continui a lavorare e registrare interventi normalmente.
Parole chiave: proponi cavalli, proposte, invito, scarica app, cliente collegato, proprietario accetta, codice', true, current_date),
('maniscalco','guida','Come confermo i dati di un cavallo (Da confermare)',
'Dove: "Home" -> riquadro "Da confermare"
Passi:
1. Nel riquadro compaiono i cavalli collegati a te che hanno nome, razza e data di nascita completi e che non hai ancora confermato.
2. Controlla che i dati siano giusti e tocca "Confermo".
3. La tua conferma più quella del proprietario rende il cavallo Validato: gli viene assegnato il codice definitivo con il badge verde.
4. Se il proprietario cambia nome, razza o data di nascita il cavallo ricompare in "Da confermare" con la scritta "dati cambiati, riconferma".
Esempio: Marco completa la data di nascita di Venere: Alessandro la trova in "Da confermare", conferma e Venere diventa Validato.
Note: Se hai creato e completato tu la scheda del cavallo, la tua conferma vale già. Una persona vale una conferma sola. Se non conosci davvero il cavallo non confermare.
Parole chiave: da confermare, conferma, validato, codice definitivo, seconda conferma, dati cambiati', true, current_date)
;
