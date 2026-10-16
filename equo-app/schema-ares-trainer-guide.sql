-- Ares (agente istruttori) + guide app Trainer — 16 ottobre 2026 — da eseguire DOPO schema-trainer-sedute.sql
-- 1) ai_conoscenze ammette l'ambito 'istruttore' (Ares)
do $$
declare r record;
begin
  for r in select conname from pg_constraint where conrelid = 'public.ai_conoscenze'::regclass and contype = 'c' and pg_get_constraintdef(oid) ilike '%ambito%' loop
    execute format('alter table public.ai_conoscenze drop constraint %I', r.conname);
  end loop;
  alter table public.ai_conoscenze add constraint ai_conoscenze_ambito_check
    check (ambito in ('tutti','proprietario','professionista','maniscalco','veterinario','scuderia','istruttore'));
end $$;

-- 2) Guide dell'app Trainer (le legge Ares con guida_app)
insert into public.ai_conoscenze (ambito, categoria, titolo, contenuto, attivo, verificato_il) values
('istruttore','guida','Come creo una seduta con video (Trainer)',
'Dove: barra in basso → «Sedute» oppure «+» → Nuova seduta
Passi:
1. Tocca «+» e scegli «Nuova seduta».
2. Scegli il cavallo (se non c''è, aggiungilo da «Cavalli seguiti»), scrivi il titolo e carica o gira il video (massimo 60 secondi nel piano Free).
3. Si apre l''editor: la seduta resta una bozza finché non la invii.
Esempio: Marco carica il video del galoppo di Aurora, titolo «Galoppo a destra».
Note: La bozza non consuma slot e non la vede nessuno. Niente viene cancellato: una seduta si può solo nascondere.
Parole chiave: nuova seduta, video, bozza, carica video, trainer', true, current_date),
('istruttore','guida','Come annoto un video: Punto, Voce, Lente, Lavagna, Rallenta',
'Dove: Sedute → apri una seduta (editor)
Passi:
1. Metti in pausa il video sul momento che vuoi segnare.
2. Punto: segna un istante con una nota scritta.
3. Voce: registra un commento parlato su quel momento.
4. Lente: scegli una zona del fotogramma e ingrandiscila.
5. Lavagna: disegna linee, angoli e cerchi sopra il video (scegli il colore).
6. Rallenta: scegli un tratto del video e la velocità con cui mostrarlo.
Esempio: Marco segna con la Lavagna la linea della schiena e poi usa Rallenta sul salto.
Note: Le annotazioni non modificano il video originale e si possono nascondere. Tutte le annotazioni dei tuoi slot sono incluse.
Parole chiave: editor, annotare, lente, lavagna, rallenta, voce, punto, ingrandire, disegnare', true, current_date),
('istruttore','guida','Come invio una seduta al proprietario e cosa sono gli slot',
'Dove: Sedute → apri la bozza → «Invia»
Passi:
1. Controlla il video e le annotazioni.
2. Tocca «Invia» e conferma: la seduta arriva al proprietario del cavallo (collegato col codice Equo).
3. Il proprietario può guardarla e risponderti con un commento.
Esempio: Marco invia la seduta e Sara risponde «Grazie, la ripetiamo giovedì».
Note: Nel piano Free hai 10 slot: uno si consuma quando una seduta viene INVIATA, non si possono cancellare né rinnovare. Il Premium offre più capienza. Un proprietario Free può ricevere e rispondere ma non annotare.
Parole chiave: invia seduta, slot, esauriti, proprietario, premium, risposta, commento', true, current_date),
('istruttore','guida','Come aggiungo un cavallo seguito (Trainer)',
'Dove: Home → «Cavalli seguiti» oppure «+» → Aggiungi cavallo
Passi:
1. Tocca «Aggiungi cavallo» e scrivi nome e cavaliere.
2. Per collegarlo al proprietario inserisci il codice Equo del cavallo (EQ-…): le sedute inviate arrivano a lui.
3. Senza codice puoi comunque lavorare, ma non puoi inviargli la seduta.
Esempio: Marco aggiunge «Aurora» con il codice EQ-… che gli ha dato Sara.
Note: Nel piano Free puoi seguire fino a 10 cavalli. Le sedute restano nello storico del cavallo.
Parole chiave: cavalli seguiti, codice equo, collegare, limite 10, aggiungere cavallo', true, current_date),
('istruttore','guida','Come uso il menù in basso del Trainer e Ares',
'Dove: barra in basso
Passi:
1. Le voci sono Home, Sedute, Ares (il disco al centro), Messaggi, Agenda.
2. Il tasto «+» in alto a destra della barra apre le altre funzioni (nuova seduta, cavalli seguiti, aiuto).
3. Tocca il disco al centro per parlare con Ares, l''agente per istruttori.
Esempio: Marco chiede ad Ares «come imposto una seduta sul galoppo?».
Note: Ares non invia né modifica nulla da solo. Free: 5 messaggi al giorno; Premium: 500 al mese.
Parole chiave: menù, barra, ares, disco, più, plus, agente', true, current_date)
on conflict (titolo) do update set contenuto = excluded.contenuto, attivo = true, verificato_il = current_date, aggiornato_il = now();

select ambito, count(*) from ai_conoscenze where categoria = 'guida' group by 1 order by 1;
