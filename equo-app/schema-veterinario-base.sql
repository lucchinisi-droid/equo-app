-- Equo: VETERINARIO, base comune (29 ottobre 2026) · SQL 26
-- Il veterinario usa le stesse tabelle del maniscalco (un solo sistema). Qui:
--  1. equo_professione(utente): 'maniscalco' | 'veterinario' | 'istruttore'.
--  2. Colonna «professione» su clienti, cavalli dei clienti, interventi, conti, messaggi:
--     le righe di oggi diventano 'maniscalco' (nessun aggiornamento riga per riga: nessun trigger parte),
--     le nuove la prendono da chi le crea.
--  3. Tipi di visita del veterinario: visita, vaccino, urgenza, terapia, mtc, fisio (+ «altro» come prima).
--     equo_tipo_intervento li scrive per esteso; per il veterinario tipo_altro è il motivo («colica lieve»).
--  4. Libretto: per il maniscalco nulla cambia; il vaccino del veterinario va nel libretto come «vaccino»
--     con origine «veterinario».
--  5. «✅ Fatto» alla scuderia: «(veterinario Nome)» invece di «(maniscalco Nome)» quando è un veterinario.
--  6. Codice personale del veterinario (MED-…): il proprietario si collega come con il maniscalco.
--  7. Equo Scuderia: categoria del professionista = la sua professione (oggi solo maniscalchi: nulla cambia).
--  8. Viste con nomi neutri per il codice nuovo (sopra le stesse tabelle, regole di sicurezza di chi legge):
--     clienti_pro, cavalli_pro, interventi_pro, conti_pro, messaggi_pro.
-- Rieseguibile.

-- 1 · professione di un utente --------------------------------------------------------------
create or replace function public.equo_professione(p_uid uuid)
returns text language sql stable security definer set search_path to 'public' as $$
  select case when 'veterinario' in (p.ruolo, p.ruolo_secondario) then 'veterinario'
              when 'istruttore'  in (p.ruolo, p.ruolo_secondario) then 'istruttore'
              when 'maniscalco'  in (p.ruolo, p.ruolo_secondario) then 'maniscalco' end
    from profiles p where p.id = p_uid;
$$;
revoke all on function public.equo_professione(uuid) from public, anon;
grant execute on function public.equo_professione(uuid) to authenticated, service_role;

-- 2 · colonna professione + trigger che la imposta all'inserimento ---------------------------
alter table public.clienti_mascalcia         add column if not exists professione text not null default 'maniscalco';
alter table public.cavalli_clienti_mascalcia add column if not exists professione text not null default 'maniscalco';
alter table public.interventi_mascalcia      add column if not exists professione text not null default 'maniscalco';
alter table public.conti_mascalcia           add column if not exists professione text not null default 'maniscalco';
alter table public.messaggi_mascalcia        add column if not exists professione text not null default 'maniscalco';

do $$
declare t text;
begin
  foreach t in array array['clienti_mascalcia','cavalli_clienti_mascalcia','interventi_mascalcia','conti_mascalcia','messaggi_mascalcia'] loop
    if not exists (select 1 from pg_constraint where conname = t || '_professione_check') then
      execute format('alter table public.%I add constraint %I check (professione in (''maniscalco'',''veterinario'',''istruttore''))', t, t || '_professione_check');
    end if;
  end loop;
end $$;

create or replace function public.equo_imposta_professione()
returns trigger language plpgsql security definer set search_path to 'public' as $$
begin
  new.professione := coalesce(equo_professione(new.maniscalco_id), 'maniscalco');
  return new;
end $$;

drop trigger if exists trg_professione on public.clienti_mascalcia;
create trigger trg_professione before insert on public.clienti_mascalcia for each row execute function public.equo_imposta_professione();
drop trigger if exists trg_professione on public.cavalli_clienti_mascalcia;
create trigger trg_professione before insert on public.cavalli_clienti_mascalcia for each row execute function public.equo_imposta_professione();
drop trigger if exists trg_professione on public.interventi_mascalcia;
create trigger trg_professione before insert on public.interventi_mascalcia for each row execute function public.equo_imposta_professione();
drop trigger if exists trg_professione on public.conti_mascalcia;
create trigger trg_professione before insert on public.conti_mascalcia for each row execute function public.equo_imposta_professione();
drop trigger if exists trg_professione on public.messaggi_mascalcia;
create trigger trg_professione before insert on public.messaggi_mascalcia for each row execute function public.equo_imposta_professione();

-- 3 · tipi di visita del veterinario ----------------------------------------------------------
alter table public.interventi_mascalcia drop constraint if exists interventi_mascalcia_tipo_ferratura_check;
alter table public.interventi_mascalcia add constraint interventi_mascalcia_tipo_ferratura_check
  check (tipo_ferratura = any (array['ferratura','mezza_ferratura','pareggio','altro',
                                     'visita','vaccino','urgenza','terapia','mtc','fisio']));

create or replace function public.equo_tipo_intervento(p_tipo text, p_altro text)
returns text language sql immutable as $$
  select case p_tipo when 'ferratura' then 'Ferratura' when 'mezza_ferratura' then 'Mezza ferratura'
         when 'pareggio' then 'Pareggio'
         when 'visita'  then 'Visita'      || coalesce(' · ' || nullif(trim(p_altro), ''), '')
         when 'vaccino' then 'Vaccino'     || coalesce(' · ' || nullif(trim(p_altro), ''), '')
         when 'urgenza' then 'Urgenza'     || coalesce(' · ' || nullif(trim(p_altro), ''), '')
         when 'terapia' then 'Terapia'     || coalesce(' · ' || nullif(trim(p_altro), ''), '')
         when 'mtc'     then 'Agopuntura · MTC' || coalesce(' · ' || nullif(trim(p_altro), ''), '')
         when 'fisio'   then 'Fisioterapia'|| coalesce(' · ' || nullif(trim(p_altro), ''), '')
         else coalesce(nullif(trim(p_altro), ''), 'Altro') end;
$$;

-- 4 · libretto: vaccino del veterinario -----------------------------------------------------
alter table public.health_events drop constraint if exists health_events_origine_check;
alter table public.health_events add constraint health_events_origine_check
  check (origine = any (array['proprietario','scuderia','maniscalco','veterinario']));

create or replace function public.interventi_registra_nel_libretto()
returns trigger language plpgsql security definer set search_path to 'public' as $function$
declare v_ok boolean; v_ev uuid; v_nota text; v_vet boolean;
begin
  v_vet := new.professione = 'veterinario';
  v_ok := new.horse_id is not null
          and ((not v_vet and new.tipo_ferratura in ('ferratura','mezza_ferratura','pareggio'))
               or (v_vet and new.tipo_ferratura = 'vaccino'))
          and exists (select 1 from horses h where h.id = new.horse_id and coalesce(h.condiviso_ecosistema, true));
  if new.stato = 'fatto' and v_ok and new.health_event_id is null then
    if v_vet then
      v_nota := equo_tipo_intervento(new.tipo_ferratura, new.tipo_altro) || ' (veterinario ' || equo_nome_profilo(new.maniscalco_id) || ')';
      insert into health_events (horse_id, type, date, next_due_date, notes, origine)
      values (new.horse_id, 'vaccino', new.data_intervento, new.prossima_scadenza, v_nota, 'veterinario') returning id into v_ev;
    else
      v_nota := equo_descr_intervento_libretto(new.tipo_ferratura, new.tipo_altro, new.ferro_tipo, new.ferro_note, new.maniscalco_id);
      insert into health_events (horse_id, type, date, next_due_date, notes, origine)
      values (new.horse_id, 'ferratura', new.data_intervento, new.prossima_scadenza, v_nota, 'maniscalco') returning id into v_ev;
    end if;
    new.health_event_id := v_ev;
  elsif new.health_event_id is not null and (new.stato <> 'fatto' or not v_ok) then
    new.health_event_id := null;
  elsif tg_op = 'UPDATE' and new.health_event_id is not null
        and (old.data_intervento, old.prossima_scadenza, old.horse_id) is distinct from (new.data_intervento, new.prossima_scadenza, new.horse_id) then
    update health_events set date = new.data_intervento, next_due_date = new.prossima_scadenza, horse_id = new.horse_id where id = new.health_event_id;
  end if;
  return new;
end $function$;

-- 5 · «✅ Fatto»: professione giusta nell'avviso alla scuderia ---------------------------------
create or replace function public.interventi_avvisa_fatto()
returns trigger language plpgsql security definer set search_path to 'public' as $function$
declare v_cli record; v_cav text; v_horse uuid; v_scheda uuid; v_testo text; s record; v_card uuid; v_prop uuid;
begin
  if new.stato <> 'fatto' or old.stato is not distinct from 'fatto' or coalesce(current_setting('equo.hard_reset', true), '') = 'on' then return null; end if;
  if new.data_intervento < current_date - 3 then return null; end if;
  select c.id, c.nome, c.cliente_user_id, c.centro_id into v_cli from clienti_mascalcia c where c.id = new.cliente_mascalcia_id;
  select cv.nome, cv.horse_id, cv.scuderia_cavallo_id into v_cav, v_horse, v_scheda from cavalli_clienti_mascalcia cv where cv.id = new.cavallo_cliente_id;
  v_horse := coalesce(new.horse_id, v_horse);
  v_testo := '✅ Fatto: ' || equo_tipo_intervento(new.tipo_ferratura, new.tipo_altro) || coalesce(' a ' || nullif(trim(v_cav), ''), '')
             || ' il ' || to_char(new.data_intervento, 'DD/MM/YYYY')
             || case when new.prossima_scadenza is not null then ' · prossimo intorno al ' || to_char(new.prossima_scadenza, 'DD/MM/YYYY') else '' end;
  select owner_id into v_prop from horses where id = v_horse;
  if v_prop is not null then
    select id into v_card from clienti_mascalcia where maniscalco_id = new.maniscalco_id and cliente_user_id = v_prop and centro_id is null limit 1;
    if v_card is not null then
      insert into messaggi_mascalcia (maniscalco_id, cliente_mascalcia_id, mittente_tipo, mittente_user_id, tipo, testo, letto)
      values (new.maniscalco_id, v_card, 'maniscalco', new.maniscalco_id, 'testo', v_testo || case when new.health_event_id is not null then '. È nel libretto del cavallo.' else '.' end, false);
    end if;
  elsif v_cli.cliente_user_id is not null and v_cli.centro_id is null then
    insert into messaggi_mascalcia (maniscalco_id, cliente_mascalcia_id, mittente_tipo, mittente_user_id, tipo, testo, letto)
    values (new.maniscalco_id, v_cli.id, 'maniscalco', new.maniscalco_id, 'testo', v_testo || '.', false);
  end if;
  if v_cli.centro_id is null and new.gruppo_id is null and v_horse is not null then
    for s in select * from equo_schede_scuderia_di(v_horse) loop
      select id into v_card from clienti_mascalcia where maniscalco_id = new.maniscalco_id and centro_id = s.centro_id and collegamento_stato = 'attivo' limit 1;
      if v_card is not null then
        perform set_config('equo.collegamento', 'on', true);
        insert into messaggi_mascalcia (maniscalco_id, cliente_mascalcia_id, mittente_tipo, mittente_user_id, tipo, testo, letto)
        values (new.maniscalco_id, v_card, 'maniscalco', new.maniscalco_id, 'testo', v_testo || ' (appuntamento con il proprietario)' || case when new.scuderia_evento_id is not null then '. È nella scheda del cavallo.' else '.' end, false);
        perform set_config('equo.collegamento', '', true);
      else
        insert into chat_messaggi (centro_id, membro_id, mittente_user_id, tipo, testo, letto)
        select s.centro_id, s.membro_id, m.user_id, 'testo', 'ℹ️ Avviso automatico di Equo — ' || v_testo || ' (' || new.professione || ' ' || equo_nome_profilo(new.maniscalco_id) || ').', false
          from scuderia_membri m where m.id = s.membro_id;
      end if;
    end loop;
  end if;
  return null;
end $function$;

-- 6 · codice personale del veterinario --------------------------------------------------------
create or replace function public.riscatta_codice_maniscalco(p_codice text)
returns json language plpgsql security definer set search_path to 'public' as $function$
declare
  v_uid uuid := auth.uid();
  v_cod text := upper(coalesce(equo_codice_trova(p_codice, 'riscatta'), ''));
  r public.clienti_mascalcia%rowtype;
  v_nome text;
  v_pro uuid;
  v_nome_cliente text;
  v_invito text;
  v_nuovo boolean := false;
begin
  if v_uid is null then return json_build_object('ok', false, 'errore', 'non_autenticato'); end if;
  if v_cod = '' then return json_build_object('ok', false, 'errore', 'codice_non_valido'); end if;

  if equo_codice_tipo(v_cod) in ('pro', 'med') then
    select id into v_pro from public.profiles
     where upper(codice_professionista) = v_cod
       and (case when equo_codice_tipo(v_cod) = 'med' then 'veterinario' else 'maniscalco' end) in (ruolo, ruolo_secondario) limit 1;
    if v_pro is null then return json_build_object('ok', false, 'errore', 'codice_non_valido'); end if;
    if v_pro = v_uid then return json_build_object('ok', false, 'errore', 'codice_tuo'); end if;
    select * into r from public.clienti_mascalcia
     where maniscalco_id = v_pro and cliente_user_id = v_uid and centro_id is null and archiviato_il is null
     order by created_at limit 1;
    if not found then
      select coalesce(nullif(trim(full_name), ''), nullif(split_part(coalesce(email, ''), '@', 1), ''), 'Cliente Equo')
        into v_nome_cliente from public.profiles where id = v_uid;
      v_invito := equo_nuovo_codice_invito();
      insert into public.clienti_mascalcia (maniscalco_id, nome, cliente_user_id, codice_invito, tipo_cliente)
      values (v_pro, coalesce(v_nome_cliente, 'Cliente Equo'), v_uid, v_invito, 'proprietario')
      returning * into r;
      v_nuovo := true;
      insert into public.messaggi_mascalcia (maniscalco_id, cliente_mascalcia_id, mittente_tipo, mittente_user_id, tipo, testo)
      values (v_pro, r.id, 'cliente', v_uid, 'testo', 'Ciao! Mi sono collegato a te su Equo con il tuo codice personale.');
    end if;
  elsif equo_codice_tipo(v_cod) in ('tra', 'own') then
    return json_build_object('ok', false, 'errore', 'codice_altro_tipo', 'tipo', equo_codice_tipo(v_cod));
  else
    select * into r from public.clienti_mascalcia where upper(codice_invito) = v_cod limit 1;
    if not found then return json_build_object('ok', false, 'errore', 'codice_non_valido'); end if;
    if r.maniscalco_id = v_uid then return json_build_object('ok', false, 'errore', 'codice_tuo'); end if;
    if r.cliente_user_id is not null and r.cliente_user_id <> v_uid then
      return json_build_object('ok', false, 'errore', 'codice_gia_usato');
    end if;
    update public.clienti_mascalcia set cliente_user_id = v_uid where id = r.id;
  end if;

  select coalesce(nullif(trim(p.full_name), ''), nullif(trim(p.dati_pagamento_nome), ''))
    into v_nome from public.profiles p where p.id = r.maniscalco_id;
  return json_build_object('ok', true, 'cliente_mascalcia_id', r.id, 'maniscalco_id', r.maniscalco_id,
                           'nome_maniscalco', coalesce(v_nome, case when r.professione = 'veterinario' then 'Il tuo veterinario' else 'Il tuo maniscalco' end),
                           'professione', r.professione, 'nuovo', v_nuovo);
end $function$;

-- 7 · Equo Scuderia: categoria = professione ------------------------------------------------
create or replace function public.scuderia_lista_professionisti(p_centro_id uuid)
returns json language sql stable security definer set search_path to 'public' as $function$
  select case when not is_member_of_centro(p_centro_id) then '[]'::json else
  coalesce((select json_agg(x order by x.nome) from (
    select c.id as cliente_id, c.maniscalco_id as professionista_id, c.professione as categoria,
           equo_nome_profilo(c.maniscalco_id) as nome, p.avatar_url,
           coalesce(p.certificazione_stato = 'verificato', false) as certificato,
           coalesce(trim(p.dati_pagamento_piva_cf), '') = '' as senza_piva,
           c.collegamento_stato as stato, c.collegamento_origine as origine, c.collegamento_il,
           (select count(*) from messaggi_mascalcia m
             where m.cliente_mascalcia_id = c.id and m.mittente_tipo = 'maniscalco' and not coalesce(m.letto, false)) as non_letti,
           (select count(distinct coalesce(i.gruppo_id, i.id)) from interventi_mascalcia i
             where i.cliente_mascalcia_id = c.id and i.stato = 'proposto') as da_confermare,
           (select json_build_object('data', i.data_intervento, 'ora', to_char(i.ora, 'HH24:MI'), 'stato', i.stato,
                                     'tipo', equo_tipo_intervento(i.tipo_ferratura, i.tipo_altro))
              from interventi_mascalcia i
             where i.cliente_mascalcia_id = c.id and i.stato in ('richiesto','proposto','programmato') and i.data_intervento >= current_date
             order by i.data_intervento, i.ora nulls last limit 1) as prossimo
    from clienti_mascalcia c
    join profiles p on p.id = c.maniscalco_id
    where c.centro_id = p_centro_id and c.collegamento_stato is not null
  ) x), '[]'::json) end;
$function$;

-- 8 · viste con nomi neutri (stessi dati, stesse regole di chi legge) ------------------------
create or replace view public.clienti_pro with (security_invoker = true) as
  select id, maniscalco_id as professionista_id, professione, nome, nome_cavallo, telefono, email, indirizzo, note,
         cliente_user_id, codice_invito, tipo_cliente, centro_id, collegamento_stato, collegamento_origine, collegamento_il,
         promemoria_pagamenti, intervallo_giorni, archiviato_il, created_at
    from public.clienti_mascalcia;

create or replace view public.cavalli_pro with (security_invoker = true) as
  select id, maniscalco_id as professionista_id, professione, cliente_mascalcia_id as cliente_id, nome, microchip, horse_id,
         scuderia_cavallo_id, equo_numero, codice_equo, razza, sesso, anno_nascita, altezza_cm, mantello, disciplina,
         segni_particolari, peso_kg, avviso_sicurezza, intervallo_giorni,
         ubicazione_tipo, ubicazione_cliente_id, ubicazione_nome, ubicazione_indirizzo, ubicazione_dal,
         archiviato_il, created_at
    from public.cavalli_clienti_mascalcia;

create or replace view public.interventi_pro with (security_invoker = true) as
  select id, maniscalco_id as professionista_id, professione, cliente_mascalcia_id as cliente_id, cavallo_cliente_id as cavallo_id,
         horse_id, tipo_ferratura as tipo, tipo_altro as motivo, data_intervento, ora, prossima_scadenza, stato, data_da_confermare,
         importo, stato_pagamento, saldato_il, note, gruppo_id, ordine_giro, luogo_cliente_id, luogo_nome,
         scuderia_evento_id, health_event_id, modifica, aiutante_id, aiutante_nome, created_at, updated_at
    from public.interventi_mascalcia;

create or replace view public.conti_pro with (security_invoker = true) as
  select id, maniscalco_id as professionista_id, professione, cliente_mascalcia_id as cliente_id, anno, numero, modo,
         periodo_da, periodo_a, totale, n_lavori, stato, creato_il, pagato_il, annullato_il
    from public.conti_mascalcia;

create or replace view public.messaggi_pro with (security_invoker = true) as
  select id, maniscalco_id as professionista_id, professione, cliente_mascalcia_id as cliente_id,
         case when mittente_tipo = 'maniscalco' then 'professionista' else mittente_tipo end as mittente,
         mittente_user_id, mittente_nome, tipo, testo, audio_url, file_url, file_nome, risposta,
         letto, consegnato_at, letto_at, created_at
    from public.messaggi_mascalcia;

revoke all on public.clienti_pro, public.cavalli_pro, public.interventi_pro, public.conti_pro, public.messaggi_pro from anon;
grant select, insert, update, delete on public.clienti_pro, public.cavalli_pro, public.interventi_pro, public.conti_pro to authenticated;
grant select on public.messaggi_pro to authenticated;   -- i messaggi si scrivono sulla tabella (chat in tempo reale)
