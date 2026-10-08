-- Equo: guida dell'Agenda a due colonne (8 ottobre 2026)
update public.ai_conoscenze set aggiornato_il = now(), verificato_il = current_date,
  contenuto = 'Dove: barra in basso → "Agenda" → "Agenda della settimana"
Passi:
1. I giorni sono su due colonne: a sinistra Lunedì, Mercoledì, Venerdì; a destra Martedì, Giovedì, Sabato; Domenica su una riga intera sotto.
2. Ogni giorno chiuso mostra solo nome, data e il numero degli impegni (scadenze da ripetere comprese). Oggi ha il bordo dorato e si apre da solo entrando in Agenda.
3. Tocca un giorno per aprirlo: il dettaglio compare a tutta larghezza sotto la sua coppia di giorni e il giorno aperto prima si chiude. In alto vedi quanti clienti e quanti cavalli; sotto gli impegni divisi per cliente (nome del cliente una volta, poi i suoi cavalli con ora, lavoro e tasti) e "+ Aggiungi in questo giorno". Tocca di nuovo il giorno per chiuderlo.
4. Cambia settimana con ‹ e › o scorrendo col dito a sinistra/destra; "Torna a oggi" riporta alla settimana corrente.
5. Tocca un appuntamento (o ⋯) per le azioni.
Esempio: Luca apre giovedì: "2 clienti · 4 cavalli"; sotto SCUDERIA LE QUERCE trova 08:00 Aurora – Ferratura e 08:45 Stella – Pareggio.
Note: Gli impegni fatti mostrano "✓ Fatto"; le richieste dei clienti hanno "Accetta"; quelli proposti alle scuderie "attesa". Le righe "scad." sono promemoria di scadenza con "Fissa". In cima all''Agenda ci sono "Invita i tuoi clienti su Equo" e le richieste da confermare.
Parole chiave: agenda, calendario, settimana, appuntamenti, planning, programma, giorni, navigare settimane, due colonne, aprire giorno, chiudere giorno'
where id = '2319e387-35cc-4f53-a0c3-83bcd9461938';

-- controllo: deve dare 1
select count(*) from ai_conoscenze where id = '2319e387-35cc-4f53-a0c3-83bcd9461938' and contenuto like '%due colonne%';
