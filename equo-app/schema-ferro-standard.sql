-- Equo: FERRO STANDARD nella scheda del cavallo (maniscalco) + appuntamento semplificato (7 ottobre 2026)
-- Misura del ferro (sistema + numero) salvata una volta nella scheda del cavallo; ogni appuntamento ne tiene una copia
-- (così lo storico resta quello vero anche se poi il ferro cambia). Ogni cambio di ferro standard finisce in cavalli_storico.

-- 1) colonne nella scheda del cavallo del maniscalco
alter table public.cavalli_clienti_mascalcia add column if not exists ferro_sistema text;
alter table public.cavalli_clienti_mascalcia add column if not exists ferro_numero text;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'cavalli_clienti_ferro_sistema_chk') then
    alter table public.cavalli_clienti_mascalcia add constraint cavalli_clienti_ferro_sistema_chk
      check (ferro_sistema is null or ferro_sistema in ('italiana','olandese','tedesca'));
  end if;
end $$;

-- 1b) «Ferri nuovi utilizzati» (false = rimessa, stessi ferri riutilizzati): dato SOLO del maniscalco.
--     interventi_mascalcia è leggibile solo dal maniscalco (RLS); le funzioni per proprietari e scuderie
--     restituiscono campi scelti uno per uno e NON devono mai includere questa colonna.
alter table public.interventi_mascalcia add column if not exists ferri_nuovi boolean;
comment on column public.interventi_mascalcia.ferri_nuovi is 'Solo per il maniscalco: true = ferri nuovi, false = rimessa. Mai mostrato a proprietari o scuderie.';

-- 2) ogni cambio del ferro standard resta nello storico del cavallo
create or replace function public.equo_sigla_misura(s text) returns text language sql immutable as $$
  select case s when 'italiana' then 'IT' when 'olandese' then 'NL' when 'tedesca' then 'DE' else '' end
$$;

create or replace function public.cavalli_clienti_storico_ferro()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if coalesce(current_setting('equo.unisci_righe', true), '') = 'on' or coalesce(current_setting('equo.ferro_iniziale', true), '') = 'on' then return null; end if;
  if (new.ferro_sistema, new.ferro_numero) is distinct from (old.ferro_sistema, old.ferro_numero) then
    insert into cavalli_storico (codice_equo, horse_id, scuderia_cavallo_id, cavallo_cliente_id, tipo, descrizione, autore_user_id, autore_ruolo, app)
    values (new.codice_equo, new.horse_id, new.scuderia_cavallo_id, new.id, 'ferro_standard',
            case when new.ferro_numero is null then 'Ferro standard tolto'
                 when old.ferro_numero is null then 'Ferro standard impostato: n. ' || new.ferro_numero || ' ' || equo_sigla_misura(coalesce(new.ferro_sistema, 'italiana'))
                 else 'Ferro standard cambiato: n. ' || old.ferro_numero || ' ' || equo_sigla_misura(coalesce(old.ferro_sistema, 'italiana')) || ' → n. ' || new.ferro_numero || ' ' || equo_sigla_misura(coalesce(new.ferro_sistema, 'italiana')) end
            || ' (maniscalco ' || equo_nome_profilo(new.maniscalco_id) || ')',
            auth.uid(), 'maniscalco', 'app');
  end if;
  return null;
end $$;
drop trigger if exists trg_cavalli_clienti_storico_ferro on public.cavalli_clienti_mascalcia;
create trigger trg_cavalli_clienti_storico_ferro after update of ferro_sistema, ferro_numero on public.cavalli_clienti_mascalcia
  for each row execute function public.cavalli_clienti_storico_ferro();

-- 3) un appuntamento di ferratura senza misura prende il ferro standard del cavallo
--    (vale anche per Hammer, richieste dei proprietari e proposte alle scuderie)
create or replace function public.interventi_ferro_da_scheda()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_s text; v_n text;
begin
  if tg_op = 'UPDATE' and new.stato = 'fatto' then return new; end if; -- lo storico già fatto non si riscrive
  if new.numero_ferro is null and new.tipo_ferratura in ('ferratura','mezza_ferratura') and new.cavallo_cliente_id is not null then
    select ferro_sistema, ferro_numero into v_s, v_n from cavalli_clienti_mascalcia where id = new.cavallo_cliente_id;
    if v_n is not null then
      new.numero_ferro := v_n;
      new.misura_sistema := coalesce(v_s, 'italiana');
    end if;
  end if;
  return new;
end $$;
drop trigger if exists trg_interventi_a_ferro_da_scheda on public.interventi_mascalcia;
create trigger trg_interventi_a_ferro_da_scheda before insert or update of cavallo_cliente_id, tipo_ferratura on public.interventi_mascalcia
  for each row execute function public.interventi_ferro_da_scheda();

-- 4) quando due schede dello stesso cavallo si uniscono, il ferro standard non si perde
do $$
declare v_def text;
begin
  select pg_get_functiondef(p.oid) into v_def from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public' and p.proname = 'pro_cavallo_da_codice';
  if v_def is not null and v_def not like '%ferro_numero%' then
    v_def := replace(v_def, 'razza = coalesce(nullif(razza, ''''), v_dup.razza)',
      'razza = coalesce(nullif(razza, ''''), v_dup.razza), ferro_sistema = case when ferro_numero is null then v_dup.ferro_sistema else ferro_sistema end, ferro_numero = coalesce(ferro_numero, v_dup.ferro_numero)');
    execute v_def;
  end if;
  select pg_get_functiondef(p.oid) into v_def from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public' and p.proname = 'equo_unisci_righe_maniscalco';
  if v_def is not null and v_def not like '%ferro_numero%' then
    v_def := replace(v_def, 'razza = coalesce(nullif(razza, ''''), d.razza)',
      'razza = coalesce(nullif(razza, ''''), d.razza), ferro_sistema = case when ferro_numero is null then d.ferro_sistema else ferro_sistema end, ferro_numero = coalesce(ferro_numero, d.ferro_numero)');
    execute v_def;
  end if;
end $$;

-- 5) subito: ogni cavallo prende come ferro standard l'ultima misura usata (senza voce nello storico per questo primo riempimento)
select set_config('equo.ferro_iniziale', 'on', false);
update public.cavalli_clienti_mascalcia cv set ferro_sistema = x.sistema, ferro_numero = x.numero_ferro
  from (select distinct on (cavallo_cliente_id) cavallo_cliente_id, coalesce(misura_sistema, 'italiana') as sistema, numero_ferro
          from public.interventi_mascalcia
         where cavallo_cliente_id is not null and numero_ferro is not null
         order by cavallo_cliente_id, data_intervento desc, created_at desc) x
 where x.cavallo_cliente_id = cv.id and cv.ferro_numero is null;
select set_config('equo.ferro_iniziale', '', false);

-- 6) guide degli agenti AI (maniscalco)
update public.ai_conoscenze set aggiornato_il = now(), verificato_il = current_date, contenuto =
'Dove: Agenda → "+ Nuovo appuntamento" (oppure Home → "+ Nuovo intervento")
Passi:
1. Scegli il "Cliente" (o "+ Nuovo cliente").
2. Spunta uno o più "Cavalli" dello stesso cliente (o "+ Aggiungi cavallo").
3. Scegli il "Tipo". Per ferratura e mezza ferratura vedi il ferro standard di ogni cavallo (dalla sua scheda), scegli con la rotella quanti ferri (1-4) e lascia la spunta "Ferri nuovi utilizzati" (toglila se è una rimessa).
4. Imposta "Data" e "Ora"; se serve aggiungi le "Note".
5. Tocca "Salva appuntamento".
Esempio: Cliente Marco Rossi, cavalli Aurora e Tornado, Ferratura, 4 ferri, giovedì alle 9:00: Luca salva e trova due appuntamenti, uno per cavallo, con il ferro di ciascuno.
Note: Importo e pagamento non si scrivono qui: li chiede il riquadro che si apre quando segni l''appuntamento "Fatto". Per un ferro diverso solo questa volta tocca "Cambia ferro" sotto il cavallo: al salvataggio l''app chiede "Vuoi modificare il ferro standard di …?" (Sì = cambia anche la scheda del cavallo, No = solo questo appuntamento). Con data futura l''appuntamento resta da fare; con data passata è registrato come fatto; con la data di oggi puoi spuntare "L''ho già fatto". Se scegli una scuderia collegata a Equo Scuderia si apre invece "Proponi a…". La prossima scadenza si calcola da sola.
Parole chiave: nuovo appuntamento, aggiungere appuntamento, fissare ferratura, più cavalli, prenotare, programmare intervento, inserire lavoro, nuovo intervento'
where titolo = 'Come aggiungo un nuovo appuntamento';

update public.ai_conoscenze set aggiornato_il = now(), verificato_il = current_date, contenuto =
'Dove: Clienti → cliente → "Modifica" → Cavalli → "Ferro" accanto al cavallo
Passi:
1. Tocca "Ferro" accanto al cavallo.
2. Scegli il sistema: "Olandese / Internazionale", "Italiana" o "Tedesca".
3. Scorri la rotella e fermati sulla misura: sotto leggi "Equivale a:" negli altri due sistemi.
4. Tocca "Salva ferro standard".
Esempio: Luca imposta per Aurora Italiana 4: l''app mostra "Equivale a: NL 0 · DE 2" e da ora ogni ferratura di Aurora usa il n. 4 IT.
Note: Il ferro standard vale per tutti gli appuntamenti di quel cavallo; nell''appuntamento lo vedi sotto il nome e con "Cambia ferro" puoi usarne un altro solo per quella volta (l''app chiede se aggiornare anche la scheda). Ogni appuntamento conserva il ferro usato quel giorno, quindi lo storico resta corretto. Ogni cambio del ferro standard resta nello storico del cavallo. All''inizio ogni cavallo ha come ferro standard l''ultima misura che avevi usato. Scale: Italiana 1–9, Olandese 4/0–5, Tedesca 2/0–7 (stessa riga = stessa misura).
Parole chiave: misura ferro, numero ferro, ferro standard, taglia ferro, misura olandese, misura italiana, misura tedesca, conversione misure, equivalenza, scheda cavallo'
where titolo = 'Come inserisco la misura del ferro';

update public.ai_conoscenze set aggiornato_il = now(), verificato_il = current_date, contenuto =
'Dove: nuovo appuntamento → Tipo "Ferratura" o "Mezza ferratura" → rotella "Ferri"
Passi:
1. Scegli Ferratura o Mezza ferratura.
2. Scorri la rotella "Ferri" da 1 a 4 (proposta: 4 per la ferratura, 2 per la mezza).
3. Lascia la spunta "Ferri nuovi utilizzati" se metti ferri nuovi o cambiati; toglila se è una rimessa (stessi ferri riutilizzati).
Esempio: Mezza ferratura agli anteriori di Aurora: rotella su 2. Rimessa di Tornado: 4 ferri, spunta tolta.
Note: "Ferri nuovi" o "rimessa" lo vedi solo tu (agenda, storico, Home): non compare ai clienti, alle scuderie, nel PDF né nei messaggi. Con più cavalli numero e spunta valgono per ciascun cavallo; se un cavallo è diverso, aprilo dopo e modificalo. La quantità compare in agenda (es. "4 ferri"), nello storico del cliente e nel PDF. La rotella non compare per pareggio o altro.
Parole chiave: quantità ferri, numero di ferri, quanti ferri, anteriori, posteriori, 4 ferri, 2 ferri, rotella, ferri nuovi, rimessa, riutilizzo ferri'
where titolo = 'Come indico quanti ferri ho messo';

update public.ai_conoscenze set aggiornato_il = now(), verificato_il = current_date, contenuto =
'Dove: riquadro che si apre quando segni un appuntamento "Fatto"; per correggere: appuntamento fatto → "Modifica"
Passi:
1. Segna l''appuntamento "Fatto" (Agenda, Home, oppure salvando un intervento già fatto).
2. Nel riquadro controlla l''"Importo" di ogni cavallo: è già proposto con il prezzo dell''ultima volta di quel cavallo (o dell''ultima volta di quel cliente).
3. Scegli "Da saldare" o "Saldato" e tocca "OK".
4. Quando il cliente paga più tardi: apri l''intervento fatto → "Modifica" → "Pagamento: Saldato" → "Salva modifiche".
Esempio: Luca ferra Aurora e Tornado di Marco Rossi: Aurora 90 €, Tornado con ferri ortopedici 140 €, totale 230 €, "Da saldare".
Note: Con più cavalli ogni cavallo ha il suo importo e sotto vedi il totale. Il prezzo cambiato per un cavallo viene riproposto la volta dopo. Importo e pagamento non si scrivono più nel nuovo appuntamento. Puoi anche dire a Hammer "Marco ha pagato": prepara "Segna saldato" da confermare. Se gli incassi sono nascosti con il PIN, il riquadro non chiede importo e pagamento. Gli interventi da saldare compaiono in Incassi → "Da saldare" e con badge rosso nello storico del cliente; nel PDF di un intervento da saldare compaiono i tuoi dati di pagamento.
Parole chiave: importo, prezzo, pagamento, saldato, da saldare, pagato, incassato, contanti, segnare pagato, prezzo diverso, ferri ortopedici'
where titolo = 'Come registro l''importo e segno un intervento saldato';

update public.ai_conoscenze set aggiornato_il = now(), verificato_il = current_date, contenuto =
'Dove: Home → "+ Nuovo intervento"; scheda cliente → "+ Intervento"; chat cliente → "Segna intervento fatto"
Passi:
1. Apri il modulo da uno dei punti indicati.
2. Scegli cliente, uno o più cavalli e tipo.
3. Con la data di oggi spunta "L''ho già fatto"; con una data passata è registrato come fatto da solo.
4. Tocca "Salva appuntamento": nel riquadro che si apre conferma i giorni del prossimo intervento, l''importo di ogni cavallo e il pagamento.
Esempio: Luca ha appena pareggiato Tornado di Marco Rossi: salva con data di oggi e "L''ho già fatto", conferma 56 giorni e 60 € "Saldato".
Note: Senza la spunta "L''ho già fatto" un appuntamento di oggi resta "da fare" e lo segni "Fatto" dopo il lavoro. Con data futura resta sempre da fare.
Parole chiave: registrare intervento, lavoro fatto, ho già ferrato, inserire intervento passato, già fatto, storico, segnare lavoro'
where titolo = 'Come registro un intervento già fatto';

update public.ai_conoscenze set aggiornato_il = now(), verificato_il = current_date,
  contenuto = replace(contenuto, 'Note: Si apre il riquadro "Prossimo intervento": "OK" per i giorni proposti o "CAMBIA" per sceglierne altri (1-60).',
    'Note: Si apre il riquadro "Prossimo intervento": controlla l''importo (già proposto con il prezzo dell''ultima volta) e il pagamento, poi "OK" per i giorni proposti o "CAMBIA" per sceglierne altri (1-60). Per "Altro" il riquadro chiede solo importo e pagamento.')
where titolo = 'Come segno una ferratura fatta';

update public.ai_conoscenze set aggiornato_il = now(), verificato_il = current_date,
  contenuto = replace(contenuto, '3. Aggiungi importo, misura ferro, quantità, eventualmente sistema data e ora.',
    '3. Controlla cavallo, tipo e ferri (il ferro arriva dalla scheda del cavallo); se serve cambia data e ora.')
where titolo = 'Come accetto una richiesta di appuntamento di un proprietario';
update public.ai_conoscenze set aggiornato_il = now(), verificato_il = current_date,
  contenuto = replace(contenuto, 'Esempio: Giulia Verdi chiede un pareggio per Stella sabato: Luca accetta e mette 60 €.',
    'Esempio: Giulia Verdi chiede un pareggio per Stella sabato: Luca accetta; l''importo lo inserirà quando lo segna "Fatto".')
where titolo = 'Come accetto una richiesta di appuntamento di un proprietario';

update public.ai_conoscenze set aggiornato_il = now(), verificato_il = current_date,
  contenuto = replace(contenuto, 'già compilato con cliente, cavallo, tipo, misura, quantità e data di scadenza.',
    'già compilato con cliente, cavallo, tipo, quantità ferri e data di scadenza (il ferro arriva dalla scheda del cavallo).')
where titolo = 'Come fisso la prossima ferratura da una scadenza';

update public.ai_conoscenze set aggiornato_il = now(), verificato_il = current_date,
  contenuto = replace(replace(contenuto,
    '3. Cambia i campi (cavallo, tipo, misura, data, ora, importo, pagamento, note).',
    '3. Cambia i campi (cavallo, tipo, ferri, data, ora, note; se l''appuntamento è già fatto anche importo e pagamento).'),
    'Il cliente non si può cambiare in modifica.',
    'Il cliente non si può cambiare in modifica. Il ferro di un singolo appuntamento si cambia con "Cambia ferro" (l''app chiede se aggiornare anche il ferro standard del cavallo).')
where titolo = 'Come modifico un appuntamento';

update public.ai_conoscenze set aggiornato_il = now(), verificato_il = current_date,
  contenuto = replace(contenuto, '"Altro" non ha richiamo.', '"Altro" non ha richiamo: il riquadro chiede solo importo e pagamento.')
where titolo = 'Come viene calcolata la prossima scadenza';

update public.ai_conoscenze set aggiornato_il = now(), verificato_il = current_date,
  contenuto = replace(contenuto, 'Misura e numero di ferri li aggiungi poi aprendo l''appuntamento.',
    'Il ferro lo prende dalla scheda del cavallo; il numero di ferri lo cambi aprendo l''appuntamento.')
where titolo = 'Cosa può fare Hammer al posto mio';

update public.ai_conoscenze set aggiornato_il = now(), verificato_il = current_date,
  contenuto = replace(contenuto, 'Note: Con Ferratura e Mezza ferratura compaiono "Misura ferro" e "Quantità ferri".',
    'Note: Con Ferratura e Mezza ferratura compaiono il ferro standard del cavallo e la rotella dei ferri (1-4).')
where titolo = 'Quali tipi di intervento posso registrare';

update public.ai_conoscenze set aggiornato_il = now(), verificato_il = current_date,
  contenuto = replace(contenuto, 'importi nell''appuntamento,', 'importi nel riquadro del "Fatto",')
where titolo = 'Nascondere gli incassi con il PIN';

-- controllo finale: deve dare 3 · 1 · 0 (colonne create, trigger del ferro, nessuna guida con i vecchi campi)
select (select count(*) from information_schema.columns where (table_name = 'cavalli_clienti_mascalcia' and column_name in ('ferro_sistema','ferro_numero')) or (table_name = 'interventi_mascalcia' and column_name = 'ferri_nuovi')) as colonne,
       (select count(*) from pg_trigger where tgname = 'trg_interventi_a_ferro_da_scheda') as trigger_ferro,
       (select count(*) from ai_conoscenze where ambito = 'maniscalco' and contenuto ~ '(Compila "Importo \(€\)"|imposta "Misura ferro" e "Quantità ferri"|Aggiungi importo, misura ferro|Misura e numero di ferri li aggiungi)') as guide_vecchie;
