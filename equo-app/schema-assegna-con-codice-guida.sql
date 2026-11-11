-- Equo: guida di Hammer «Assegna proprietario» con il codice Equo (11/11/2026). Rieseguibile.
-- DA ESEGUIRE DOPO IL DEPLOY dell'app con il campo «Codice Equo del proprietario» (commit «Assegna proprietario con codice Equo»).
-- Prima del deploy NO: Hammer spiegherebbe un campo che nell'app non c'è ancora.

update public.ai_conoscenze set aggiornato_il = now(), verificato_il = current_date,
  contenuto = $t$Dove: "Clienti" → apri la scuderia → tasto "+ Assegna proprietario a cavallo"; oppure scheda del cavallo → "Proprietario" → "Cambia"
Passi:
1. Scegli i cavalli ("Quali cavalli?"): puoi sceglierne più di uno insieme.
2. In "Proprietario (chi paga)" scrivi nella ricerca con la lente il nome del proprietario, di un suo cavallo o il telefono e tocca il nome; con la ✕ lo cambi. In cima c'è "+ Nuovo proprietario" (nome, telefono e "Codice Equo del proprietario").
3. Se il proprietario è già su Equo, scrivi il suo codice Equo (lo trova nell'app: Menu › Il mio codice Equo): compare "✓ Nome · su Equo" e il nome si compila da solo. Se il codice è sbagliato il riquadro diventa rosso e "Conferma" resta spento. Se non è ancora su Equo lascia vuoto.
4. Se ci sono lavori già fatti e da saldare, l'app chiede chi li paga: il nuovo proprietario o la scuderia.
5. Tocca "Conferma".
Esempio: Francesco passa Nusi, che sta alla Scuderia Macchia grande, a Daniela: tocca "+ Assegna proprietario a cavallo", spunta Nusi, "+ Nuovo proprietario", scrive il codice EQUOOWN… di Daniela e conferma. Daniela riceve Nusi nell'app; siccome aveva già creato un NUSI, Equo le chiede se è lo stesso cavallo.
Note: Il cavallo resta dove sta (nella scuderia, in "Qui stanno"): cambia solo chi paga. Gli appuntamenti futuri passano al nuovo proprietario. Con il codice il proprietario è subito collegato su Equo: riceve in chat "Ti ho aggiunto come mio cliente" e i cavalli da accettare nell'app. Si usa solo il codice Equo, non l'email (un'email diversa da quella di registrazione non lo troverebbe). Se il codice è di una persona che è già tra i tuoi clienti, l'app te lo dice: cercala nel campo "Proprietario". Senza codice puoi collegarlo dopo dalla sua scheda. Un cavallo collegato al suo proprietario su Equo non si cambia da qui.
Parole chiave: assegna proprietario, cambia proprietario, intestare, chi paga, proprietario cavallo, scuderia, codice equo proprietario, passare il cavallo, collegare proprietario, pagante, cerca proprietario$t$
 where id = 'ebd9a797-2fc6-42bb-a572-0a1588b6c291';

-- controllo: deve dare 1
select count(*) as guida_aggiornata from public.ai_conoscenze
 where id = 'ebd9a797-2fc6-42bb-a572-0a1588b6c291' and contenuto like '%Codice Equo del proprietario%';
