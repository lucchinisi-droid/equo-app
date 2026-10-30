-- Equo: Equo Certified e «Segnala un maneggio» di nuovo visibili (30 ottobre 2026). Rieseguibile.
-- 1) Riquadro «Diventa Equo Certified» nel banner della Home del maniscalco (l'app lo mostra solo a chi
--    non ha ancora chiesto il badge o se è stato respinto). Si spegne mettendo attivo = false.
-- 2) Guide di Hammer e Pegasus: dove si trovano ora Equo Certified e «Segnala un maneggio».

alter table public.home_banner drop constraint if exists home_banner_tipo_check;
alter table public.home_banner add constraint home_banner_tipo_check
  check (tipo = any (array['foto'::text, 'oggi'::text, 'hammer'::text, 'sponsor'::text, 'certified'::text]));

insert into public.home_banner (app, tipo, titolo, testo, attivo, ordine, pubblico)
select 'maniscalco', 'certified', 'Fai vedere ai clienti che sei un professionista verificato.', 'Diventa Equo Certified', true, 0, 'tutti'
where not exists (select 1 from public.home_banner where app = 'maniscalco' and tipo = 'certified');

update public.ai_conoscenze set aggiornato_il = now(), verificato_il = current_date,
  contenuto = $t$Dove: menu profilo (tocca la tua foto o iniziale in alto a sinistra) → «Attività professionale» → riga «Diventa Equo Certified» (per i maniscalchi c'è anche un riquadro nel banner della Home finché non lo chiedi)
Passi:
1. Tocca la riga: si apre il foglio «Diventa Equo Certified» con i 3 passaggi: "Partita IVA valida", "Nome o ragione sociale", "Foto profilo". La riga dice già quanti ne hai fatti e cosa manca.
2. Tocca un passaggio non spuntato per completarlo (i primi due aprono "Dati per i pagamenti", il terzo la scelta della foto).
3. Quando sono tutti spuntati tocca "Richiedi il badge".
Esempio: Luca vede «2 di 3 passaggi fatti · manca la Partita IVA», la inserisce in Dati per i pagamenti e richiede il badge.
Note: Il badge "✓ Equo Certified" compare accanto al tuo nome: i clienti lo vedono in chat e sui PDF, i colleghi nella lista Colleghi. Serve una P.IVA italiana valida (il codice fiscale non basta). Finché mancano requisiti il pulsante dice "Completa i 3 passaggi per richiederlo". Vale per maniscalco, veterinario e istruttore.
Parole chiave: badge, certificato, certificazione, equo certified, verificato, spunta verde, affidabilità, verifica professionista, dove trovo equo certified$t$
 where id = 'e43b82b1-1586-426f-b014-4c2e77bac57b';

update public.ai_conoscenze set aggiornato_il = now(), verificato_il = current_date,
  contenuto = $t$Dove: menu profilo → «Attività professionale» → riga del badge (in verifica, non approvata o attivo)
Passi:
1. Se la riga dice "Equo Certified in verifica", aspetta: la P.IVA viene controllata sull'anagrafe dell'Agenzia delle Entrate.
2. Se dice "Richiesta non approvata", toccala e leggi il motivo nel foglio.
3. Correggi i dati in "Dati per i pagamenti" o la foto profilo.
4. Tocca di nuovo "Richiedi il badge".
Esempio: La richiesta di Luca è respinta perché la ragione sociale non coincide con la P.IVA: la corregge e richiede di nuovo.
Note: La verifica di solito richiede entro 48 ore e ricevi un avviso quando il badge è approvato; allora la riga diventa verde «Sei Equo Certified». Se cambi P.IVA o nome dopo l'approvazione, il badge torna in verifica.
Parole chiave: badge in verifica, badge respinto, non approvato, quanto tempo, attesa certificazione, rifiutato badge$t$
 where id = '5e389647-e469-4c1b-84f7-1b759f3bc82f';

update public.ai_conoscenze set aggiornato_il = now(), verificato_il = current_date,
  contenuto = $t$Dove: menu profilo → sezione «Equo» → «Segnala un maneggio» (oppure, se nessun tuo cavallo è collegato a una scuderia su Equo, in Home la carta «La tua scuderia non è su Equo?»)
Passi:
1. Tocca «Segnala un maneggio» (o la carta in Home).
2. Compila "Nome del centro ippico", "Città" e "Email o telefono tuo, per ricevere il codice" (obbligatori); "Via" e "Telefono del centro ippico" sono facoltativi.
3. Tocca "Invia segnalazione": compare "Grazie! Ti contatteremo con il codice Premium."
Esempio: Marco segnala il "Centro Ippico Le Querce" di Colleferro: se il centro si registra, riceve 1 mese di Premium gratis.
Note: Il premio arriva solo se la struttura segnalata si registra su Equo. Nella stessa sezione «Equo» c'è «Hai un'attività per cavalli e cavalieri?»: serve a selleria, mangimi, trasporti e servizi che vogliono diventare partner di Equo (apre un'email al team).
Parole chiave: segnala maneggio, premio, premium gratis, mese gratis, invita scuderia, referral, partner, pubblicità, attività commerciale$t$
 where id = '22e77e10-cc55-47d8-b5e3-a21002908eb0';

-- controllo: deve dare 1 · 3
select (select count(*) from public.home_banner where app = 'maniscalco' and tipo = 'certified') as riquadro,
       (select count(*) from public.ai_conoscenze where id in ('e43b82b1-1586-426f-b014-4c2e77bac57b','5e389647-e469-4c1b-84f7-1b759f3bc82f','22e77e10-cc55-47d8-b5e3-a21002908eb0') and verificato_il = current_date) as guide;
