-- Equo: «Sposta» appuntamenti — un cavallo, alcuni o tutta la giornata (11/11/2026). Rieseguibile.
-- Prima: con una scuderia su Equo Scuderia, cambiando data o ora a UN cavallo il database spostava tutto il gruppo;
-- con gli altri clienti si spostava un cavallo alla volta (e partiva un avviso per ognuno).
-- Ora:
-- 1) pro_sposta_appuntamenti(ids, data, ora, motivo): sposta solo i cavalli scelti, con UN messaggio per cliente
--    o per scuderia. Con una scuderia: se sposti solo alcuni cavalli del gruppo, quelli diventano un appuntamento a
--    parte; gli altri restano com'erano. Regole della scuderia invariate: maniscalco di fiducia → resta confermato,
--    la scuderia ha solo l'avviso; altrimenti la scuderia deve riconfermare.
-- 2) «Modifica» di un solo cavallo (data o ora): si sposta solo quel cavallo (si stacca dal gruppo), non più tutti.

create or replace function public.pro_sposta_appuntamenti(p_ids uuid[], p_data date, p_ora text, p_motivo text default null)
 returns json
 language plpgsql
 security definer
 set search_path to 'public'
as $f$
declare
  v_uid uuid := auth.uid();
  v_ora time := nullif(trim(coalesce(p_ora, '')), '')::time;
  v_n int; v_ok int;
  g record; c record;
  v_nuovo uuid; v_fid boolean; v_cav text; v_prima text; v_resto int; v_testo text; v_mot text;
  v_spostati int := 0;
begin
  if v_uid is null then return json_build_object('ok', false, 'errore', 'Accedi di nuovo.'); end if;
  if p_ids is null or cardinality(p_ids) = 0 then return json_build_object('ok', false, 'errore', 'Scegli almeno un cavallo.'); end if;
  if p_data is null or p_data < (now() at time zone 'Europe/Rome')::date then
    return json_build_object('ok', false, 'errore', 'Scegli oggi o un giorno futuro.');
  end if;
  select count(*), count(*) filter (where stato in ('programmato','proposto')) into v_n, v_ok
    from interventi_mascalcia where id = any(p_ids) and maniscalco_id = v_uid;
  if v_n <> cardinality(p_ids) then return json_build_object('ok', false, 'errore', 'Appuntamento non trovato.'); end if;
  if v_ok <> v_n then return json_build_object('ok', false, 'errore', 'Si spostano solo gli appuntamenti ancora da fare.'); end if;
  v_mot := nullif(trim(coalesce(p_motivo, '')), '');

  perform set_config('equo.appuntamenti', 'on', true);
  perform set_config('equo.collegamento', 'on', true);

  -- A) appuntamenti con una scuderia su Equo Scuderia (gruppo): un messaggio per gruppo
  for g in select i.gruppo_id, i.cliente_mascalcia_id, min(i.data_intervento) d, min(i.ora) o, count(*) n
             from interventi_mascalcia i where i.id = any(p_ids) and i.gruppo_id is not null
            group by i.gruppo_id, i.cliente_mascalcia_id loop
    v_fid := equo_pro_di_fiducia(g.cliente_mascalcia_id);
    v_prima := equo_data_it(g.d, g.o);
    select count(*) into v_resto from interventi_mascalcia
     where gruppo_id = g.gruppo_id and not (id = any(p_ids)) and stato in ('programmato','proposto','richiesto');
    v_nuovo := case when v_resto > 0 then gen_random_uuid() else g.gruppo_id end;
    update interventi_mascalcia
       set data_intervento = p_data, ora = v_ora, gruppo_id = v_nuovo,
           stato = case when v_fid then stato else 'proposto' end
     where id = any(p_ids) and gruppo_id = g.gruppo_id;
    select string_agg(coalesce(cv.nome, 'cavallo'), ', ' order by cv.nome) into v_cav
      from interventi_mascalcia i left join cavalli_clienti_mascalcia cv on cv.id = i.cavallo_cliente_id
     where i.id = any(p_ids) and i.gruppo_id = v_nuovo;
    v_testo := '📅 APPUNTAMENTO SPOSTATO da ' || equo_nome_profilo(v_uid) || E'\n'
      || case when v_resto > 0 then 'Solo ' || v_cav || ': ' else '' end
      || 'da ' || v_prima || ' a ' || equo_data_it(p_data, v_ora) || '.'
      || case when v_resto = 0 then E'\nCavalli: ' || v_cav || ' (' || g.n || ').'
              else E'\nGli altri ' || v_resto || case when v_resto = 1 then ' cavallo resta' else ' cavalli restano' end || ' come prima.' end
      || coalesce(E'\nMotivo: ' || v_mot, '')
      || case when v_fid then E'\nℹ️ Maniscalco di fiducia: è solo per presa visione.'
              else E'\n⚠️ Da riconfermare in Equo Scuderia → Professionisti → Appuntamenti.' end;
    perform equo_msg_gruppo(v_nuovo, false, v_testo);
    v_spostati := v_spostati + g.n;
  end loop;

  -- B) tutti gli altri (privati, scuderie non su Equo Scuderia): un messaggio per cliente
  for c in select i.cliente_mascalcia_id, min(i.data_intervento) d, min(i.ora) o, count(*) n,
                  string_agg(coalesce(cv.nome, 'cavallo'), ', ' order by cv.nome) cav,
                  bool_or(i.stato = 'programmato') confermato
             from interventi_mascalcia i left join cavalli_clienti_mascalcia cv on cv.id = i.cavallo_cliente_id
            where i.id = any(p_ids) and i.gruppo_id is null
            group by i.cliente_mascalcia_id loop
    update interventi_mascalcia set data_intervento = p_data, ora = v_ora
     where id = any(p_ids) and gruppo_id is null and cliente_mascalcia_id = c.cliente_mascalcia_id;
    if c.confermato then
      insert into messaggi_mascalcia (maniscalco_id, cliente_mascalcia_id, mittente_tipo, mittente_user_id, tipo, testo, letto)
      select v_uid, c.cliente_mascalcia_id, 'maniscalco', v_uid, 'testo',
             '📅 APPUNTAMENTO SPOSTATO' || E'\n' || 'Da ' || equo_data_it(c.d, c.o) || ' a ' || equo_data_it(p_data, v_ora) || '.'
             || E'\nCavall' || case when c.n = 1 then 'o: ' else 'i: ' end || c.cav || '.'
             || coalesce(E'\nMotivo: ' || v_mot, '')
             || case when cm.cliente_user_id is not null and cm.centro_id is null
                     then E'\n👉 Tocca «Ok, ho visto» nell''appuntamento per confermare, o scrivimi qui se non ti va bene.'
                     else E'\nSe non ti va bene scrivimi qui.' end,
             false
        from clienti_mascalcia cm where cm.id = c.cliente_mascalcia_id;
    end if;
    v_spostati := v_spostati + c.n;
  end loop;

  perform set_config('equo.appuntamenti', '', true);
  perform set_config('equo.collegamento', '', true);
  return json_build_object('ok', true, 'spostati', v_spostati);
end $f$;

revoke execute on function public.pro_sposta_appuntamenti(uuid[], date, text, text) from public, anon;
grant execute on function public.pro_sposta_appuntamenti(uuid[], date, text, text) to authenticated;

-- 2) «Modifica» di un cavallo del gruppo: cambiando data o ora si stacca dal gruppo (gli altri restano dove sono)
create or replace function public.interventi_gruppo_guard()
 returns trigger
 language plpgsql
 security definer
 set search_path to 'public'
as $f$
declare v_fid boolean;
begin
  if new.gruppo_id is null or auth.uid() is null or coalesce(current_setting('equo.appuntamenti', true), '') = 'on' then return new; end if;
  v_fid := equo_pro_di_fiducia(new.cliente_mascalcia_id);
  if new.stato is distinct from old.stato
     and not ((old.stato = 'programmato' and new.stato = 'fatto') or (old.stato = 'fatto' and new.stato = 'programmato')
              -- SQL 55: il lavoro fatto non resta mai bloccato (oggi o data passata, oppure maniscalco di fiducia)
              or (old.stato in ('proposto','richiesto') and new.stato = 'fatto' and (v_fid or new.data_intervento <= (now() at time zone 'Europe/Rome')::date))) then
    raise exception 'Per confermare, rifiutare o annullare un appuntamento con la struttura usa i tasti dedicati.';
  end if;
  if new.stato = 'fatto' and old.stato <> 'fatto' then return new; end if;   -- segnandolo fatto si può correggere la data
  if (old.data_intervento, old.ora) is distinct from (new.data_intervento, new.ora) then
    if old.stato not in ('programmato','richiesto','proposto') then raise exception 'Questo appuntamento non si può più spostare.'; end if;
    new.stato := case when v_fid and old.stato in ('programmato','proposto') then 'programmato' else 'proposto' end;
    -- 11/11/2026: si sposta solo questo cavallo; se nel gruppo ce ne sono altri, diventa un appuntamento a parte
    if exists (select 1 from interventi_mascalcia x where x.gruppo_id = old.gruppo_id and x.id <> old.id
                and x.stato in ('programmato','proposto','richiesto')) then
      new.gruppo_id := gen_random_uuid();
    end if;
  elsif (old.tipo_ferratura, coalesce(old.tipo_altro, '')) is distinct from (new.tipo_ferratura, coalesce(new.tipo_altro, ''))
        and old.stato in ('programmato','richiesto','proposto') then
    new.stato := case when v_fid and old.stato in ('programmato','proposto') then 'programmato' else 'proposto' end;
  end if;
  return new;
end $f$;

create or replace function public.interventi_gruppo_sync()
 returns trigger
 language plpgsql
 security definer
 set search_path to 'public'
as $f$
declare v_data boolean; v_tipo boolean; v_cambi text := ''; v_cav text; v_fid boolean;
begin
  if new.gruppo_id is null or auth.uid() is null or coalesce(current_setting('equo.appuntamenti', true), '') = 'on' then return null; end if;
  -- SQL 55: fatto senza conferma → avviso alla struttura (una volta per cavallo)
  if new.stato = 'fatto' and old.stato in ('proposto','richiesto') then
    select cv.nome into v_cav from cavalli_clienti_mascalcia cv where cv.id = new.cavallo_cliente_id;
    perform equo_msg_gruppo(new.gruppo_id, false, '✅ Fatto senza la vostra conferma: ' || equo_tipo_intervento(new.tipo_ferratura, new.tipo_altro)
      || coalesce(' a ' || nullif(trim(v_cav), ''), '') || ' il ' || to_char(new.data_intervento, 'DD/MM/YYYY') || '. È solo per presa visione.');
    return null;
  end if;
  if new.stato = 'fatto' then return null; end if;
  if old.stato not in ('programmato','richiesto','proposto') then return null; end if;
  v_data := (old.data_intervento, old.ora) is distinct from (new.data_intervento, new.ora);
  v_tipo := (old.tipo_ferratura, coalesce(old.tipo_altro, '')) is distinct from (new.tipo_ferratura, coalesce(new.tipo_altro, ''));
  if not v_data and not v_tipo then return null; end if;
  v_fid := equo_pro_di_fiducia(new.cliente_mascalcia_id);
  perform set_config('equo.appuntamenti', 'on', true);
  -- 11/11/2026: un cambio di data o ora NON sposta più gli altri cavalli del gruppo (il guard ha già staccato questo).
  -- Un cambio di servizio rimette in attesa gli altri del gruppo solo se la scuderia deve confermare (come prima).
  if not v_data then
    update interventi_mascalcia set stato = case when v_fid and stato = 'programmato' then 'programmato' else 'proposto' end
     where gruppo_id = new.gruppo_id and id <> new.id and stato in ('programmato','richiesto');
  end if;
  select cv.nome into v_cav from cavalli_clienti_mascalcia cv where cv.id = new.cavallo_cliente_id;
  if v_tipo then
    v_cambi := E'\n• Servizio' || coalesce(' (' || nullif(trim(v_cav), '') || ')', '') || ': '
      || equo_tipo_intervento(old.tipo_ferratura, old.tipo_altro) || ' → ' || equo_tipo_intervento(new.tipo_ferratura, new.tipo_altro);
  end if;
  if v_data then
    v_cambi := v_cambi || E'\n• Data' || case when new.gruppo_id is distinct from old.gruppo_id then coalesce(' (solo ' || nullif(trim(v_cav), '') || ')', '') else '' end
      || ': ' || equo_data_it(old.data_intervento, old.ora) || ' → ' || equo_data_it(new.data_intervento, new.ora);
  end if;
  perform equo_msg_gruppo(new.gruppo_id, false, '✏️ APPUNTAMENTO MODIFICATO da ' || equo_nome_profilo(auth.uid()) || ':' || v_cambi
    || E'\nOra: ' || equo_descr_gruppo(new.gruppo_id)
    || case when v_fid then E'.\nℹ️ Maniscalco di fiducia: è solo per presa visione.'
            else E'.\n⚠️ Da riconfermare in Equo Scuderia → Professionisti → Appuntamenti.' end);
  perform set_config('equo.appuntamenti', '', true);
  return null;
end $f$;

-- 3) PARTE 2 — DA ESEGUIRE DOPO IL DEPLOY dell'app con il tasto «Sposta» (le guide di Hammer parlano del tasto nuovo).
--    Prima del deploy NO: Hammer spiegherebbe un tasto che nell'app non c'è ancora.
/*
insert into public.ai_conoscenze (ambito, categoria, titolo, contenuto, verificato_il, aggiornato_il)
select 'maniscalco', 'guida', 'Come sposto un appuntamento (un cavallo, alcuni o tutta la giornata)', $t$Dove: Agenda → tocca l'appuntamento → «Sposta»
Passi:
1. Scegli la nuova data e l'ora.
2. In «Quali cavalli sposti» è già spuntato il cavallo che hai toccato: lascia solo lui se il problema è di quel cavallo, oppure tocca «Seleziona tutti» per spostare tutta la giornata da quel cliente o da quella scuderia (puoi anche spuntarne solo alcuni).
3. Scrivi il motivo se vuoi (lo legge il cliente) e tocca «Sposta N cavalli».
Esempio: Francesco ha un imprevisto: tocca un cavallo del Levante, «Seleziona tutti (6)», venerdì alle 8:30, «Sposta 6 cavalli». Il Levante riceve un solo messaggio con i 6 cavalli.
Note: Parte un solo messaggio per cliente o scuderia, non uno per cavallo. Con una scuderia su Equo Scuderia: se sei il loro maniscalco di fiducia lo spostamento vale subito e la scuderia ha solo l'avviso; altrimenti deve riconfermarlo. Se sposti solo alcuni cavalli, gli altri restano alla data di prima. Anche da «Modifica» cambiando la data si sposta solo quel cavallo.
Parole chiave: sposta, spostare appuntamento, rimandare, cambiare data, imprevisto, tutta la giornata, tutti i cavalli, un solo cavallo, rinviare giro, posticipare$t$, current_date, now()
where not exists (select 1 from public.ai_conoscenze where categoria = 'guida' and titolo = 'Come sposto un appuntamento (un cavallo, alcuni o tutta la giornata)');

update public.ai_conoscenze set aggiornato_il = now(), verificato_il = current_date,
  contenuto = replace(contenuto, 'Con una scuderia Equo Scuderia l''appuntamento torna "In attesa della scuderia" e va riconfermato.',
    'Con una scuderia Equo Scuderia cambiando data o ora si sposta solo quel cavallo (gli altri del gruppo restano); se sei il loro maniscalco di fiducia vale subito, altrimenti torna "In attesa della scuderia" e va riconfermato. Per spostare più cavalli insieme usa «Sposta».')
 where id = '27da059f-dc95-497b-b2a9-f25a63ca2975';

update public.ai_conoscenze set aggiornato_il = now(), verificato_il = current_date,
  contenuto = replace(contenuto, 'la scuderia riceve "✏️ APPUNTAMENTO MODIFICATO" con prima → ora e deve riconfermare;',
    'la scuderia riceve "✏️ APPUNTAMENTO MODIFICATO" con prima → ora e deve riconfermare (se sei il loro maniscalco di fiducia è solo per presa visione); cambiando la data si sposta solo quel cavallo, per spostarne più insieme usa «Sposta»;')
 where id = '9ebab396-25a0-4d43-806f-92b60d96ab34';
*/

-- controllo: deve dare 1 (dopo la parte 2, anche la seconda colonna 1)
select (select count(*) from pg_proc where proname = 'pro_sposta_appuntamenti') as funzione,
       (select count(*) from public.ai_conoscenze where categoria = 'guida' and titolo = 'Come sposto un appuntamento (un cavallo, alcuni o tutta la giornata)') as guida;
