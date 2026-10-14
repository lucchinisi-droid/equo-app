-- Equo: guide Hammer aggiornate per «Qui stanno» (14 ottobre 2026). Solo testi, nessuna modifica allo schema. Rieseguibile.

update public.ai_conoscenze set
  contenuto = 'Dove: Clienti → apri il cliente → tocca il cavallo → riquadro "Dove sta" → "Sposta"
Passi:
1. Scegli dove va: "A casa / privato" (indirizzo del cliente o un altro), una delle tue scuderie (cerca per nome) oppure "+ Nuova scuderia" con nome e indirizzo.
2. Scegli da che giorno e tocca "Sposta". Un avviso ti dice dove ritrovare il cavallo.
3. Il cliente che paga resta lo stesso: cambia solo il luogo. I prossimi appuntamenti del cavallo in Agenda passano sotto il nuovo luogo e "Naviga" porta lì.
4. Dove lo trovi dopo: nella scheda della scuderia, sotto "Qui stanno" (con il nome del proprietario); nella cartella "Scuderie" ogni scuderia dice quanti cavalli di altri clienti ha; nella cartella "Cavalli" la riga del cavallo dice "sta a …"; nella scheda del suo proprietario il cavallo resta e il riquadro "Dove sta" mostra il nuovo luogo.
Esempio: Aurora di Marco Rossi va alla Scuderia Le Querce: in Agenda il martedì trovi il blocco "Scuderia Le Querce" con Aurora (di Marco Rossi) e Brezza; nella scheda di Scuderia Le Querce, sotto "Qui stanno", c''è Aurora (di Marco Rossi); Marco continua a ricevere le richieste di pagamento.
Note: Il cavallo non cambia proprietario e non si duplica: nella scheda della scuderia lo vedi sotto "Qui stanno", non tra i "Cavalli" della scuderia (quelli sono i cavalli intestati alla scuderia stessa). Lo spostamento resta per sempre nello storico del cavallo e nel libretto del proprietario. Se il proprietario è collegato riceve un messaggio in chat; anche lui può spostare il cavallo dalla sua app e tu lo vedi subito. Se la scuderia usa Equo Scuderia riceve la richiesta di accoglierlo; se risponde "Non è da noi" il cavallo torna dov''era e ricevi l''avviso. I lavori già fatti ricordano dove sono stati fatti.
Parole chiave: sposta, spostare cavallo, cambio scuderia, trasferimento, dove sta, ubicazione, qui stanno, maneggio, centro ippico, a casa, privato, raggruppamento agenda, giro, non trovo il cavallo nella scuderia',
  aggiornato_il = now(), verificato_il = current_date
where ambito = 'maniscalco' and categoria = 'guida' and titolo = 'Come sposto un cavallo (a casa, in una scuderia)';

update public.ai_conoscenze set
  contenuto = replace(contenuto,
    '5. "Cerca…" trova per nome del cavallo, cliente o microchip.',
    '5. "Cerca…" trova per nome del cavallo, cliente, microchip o scuderia dove sta. Se un cavallo è stato spostato in una scuderia, la sua riga dice "sta a …".'),
  aggiornato_il = now(), verificato_il = current_date
where ambito = 'maniscalco' and categoria = 'guida' and titolo = 'Come trovo e aggiungo un cavallo (cartella Cavalli)';

-- controllo: deve dare 1 · 1
select (select count(*) from public.ai_conoscenze where titolo = 'Come sposto un cavallo (a casa, in una scuderia)' and contenuto like '%Qui stanno%') as guida_sposta,
       (select count(*) from public.ai_conoscenze where titolo = 'Come trovo e aggiungo un cavallo (cartella Cavalli)' and contenuto like '%sta a …%') as guida_cartella;
