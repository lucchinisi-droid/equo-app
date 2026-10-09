-- Equo: guida dei Messaggi a cartelle (9 ottobre 2026)
update public.ai_conoscenze set aggiornato_il = now(), verificato_il = current_date,
  contenuto = 'Dove: barra in basso → "Messaggi"
Passi:
1. In alto tre cartelle: "Clienti" (chat con i proprietari dei cavalli), "Scuderie" (scuderie, maneggi e centri ippici, anche quelle collegate a Equo Scuderia) e "Colleghi" (maniscalchi, veterinari e altri professionisti, con "+ Collega").
2. Accanto al nome di ogni cartella c''è il numero delle chat; se ci sono messaggi non letti il numero diventa rosso e indica quanti sono.
3. Tocca una cartella per vedere solo quelle conversazioni (l''app ricorda l''ultima aperta), poi tocca una conversazione per aprirla. Da una scheda cliente puoi usare anche "Messaggi".
Esempio: Luca vede "Clienti 2" in rosso: apre la cartella e trova Marco Rossi · Aurora: "Ciao! Quando puoi passare per Aurora?".
Note: Il badge su "Messaggi" nella barra indica messaggi non letti; il totale è anche in Home. Aprendo la chat i messaggi risultano letti. Le chat si aggiornano in tempo reale; se arrivano messaggi mentre scorri compare "Nuovi messaggi ↓".
Parole chiave: messaggi, chat, inbox, conversazioni, cartelle, clienti, scuderie, colleghi, dove sono i messaggi, scrivere al cliente, non letti'
where id = '8a5be94c-2210-47ff-9213-fdf69b683cf6';

-- controllo: deve dare 1
select count(*) from ai_conoscenze where id = '8a5be94c-2210-47ff-9213-fdf69b683cf6' and contenuto like '%tre cartelle%';
