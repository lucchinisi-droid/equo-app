-- Equo: guida "Incassi" aggiornata alle viste Semplice / Completa (9 ottobre 2026)
-- Va eseguito DOPO schema-incassi-giro.sql. Nessuna modifica alle tabelle.
update public.ai_conoscenze set aggiornato_il = now(), verificato_il = current_date,
  titolo = 'Come leggo gli incassi e le statistiche (vista Semplice e Completa)',
  contenuto = 'Dove: barra in basso → "Incassi"
Passi:
1. In alto l''interruttore "Semplice | Completa".
2. Vista Semplice (la cassa): scegli il periodo (Oggi, Settimana, Mese, Anno o "Scegli date"). Due riquadri: "Incassati" (lavori pagati nel periodo, con il confronto col periodo prima) e "Da incassare" (tutti i lavori già fatti e non ancora pagati, a prescindere dal periodo). Tocca un riquadro per aprirlo: Incassati mostra grafico, incassi per tipo di lavoro e per cliente e l''elenco dei pagamenti; Da incassare mostra i lavori per cliente con i giorni passati (in rosso oltre 30) e il tasto "Saldato".
3. Vista Completa (statistiche) con il periodo 3, 6 o 12 mesi:
   - Previsionale: quanto incasserai nelle prossime 4 settimane con gli appuntamenti in agenda che hanno il prezzo; quelli senza prezzo non sono contati e con "Aggiungi" puoi inserirlo.
   - Clienti e prezzi: cavalli e clienti totali, cavalli e ferratura media per ogni cliente; tocca un cliente per aprirne la scheda.
   - Medie operative: cavalli ferrati e pareggiati a settimana e al mese, guadagno medio (valore dei lavori fatti) a settimana e al mese.
   - Consumo ferri: ferri nuovi e rimessi a settimana e al mese, quanti te ne servono il mese prossimo e quali misure usi di più.
Esempio: Luca apre "Completa" su 6 mesi: 14,5 cavalli a settimana, 164 ferri nuovi al mese, il prossimo mese gliene servono circa 150, soprattutto n. 1.
Note: Se salvi un nuovo appuntamento senza prezzo Equo te lo chiede proponendo l''ultimo prezzo di quel cliente (o di quel cavallo); puoi scegliere "Non chiedermelo più". Ferratura completa = 4 ferri, mezza = 2, o il numero indicato nell''appuntamento. I dati sui ferri li vedi solo tu. Nel piano Free la vista Semplice mostra Oggi e il mese corrente; Settimana, Anno, date a scelta e la vista Completa sono Premium. Conta il giorno in cui il cliente ha pagato; per i lavori saldati prima del 9 ottobre 2026 vale il giorno del lavoro. Se hai nascosto gli incassi con il PIN, la sezione resta protetta.
Parole chiave: incassi, incassato, da incassare, saldati, da saldare, previsionale, previsti, statistiche, guadagni, fatturato, media, prezzo medio, ferri, consumo ferri, scorte, misure, quanto ho incassato, chi mi deve pagare, quanti ferri comprare'
where titolo in ('Come leggo gli incassi (Saldati, Da saldare, Previsti)', 'Come leggo gli incassi e le statistiche (vista Semplice e Completa)')
  and ambito = 'maniscalco' and categoria = 'guida';

-- controllo: deve dare 1
select count(*) from ai_conoscenze where titolo = 'Come leggo gli incassi e le statistiche (vista Semplice e Completa)' and contenuto like '%Vista Completa%';
