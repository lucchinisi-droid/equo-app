-- Equo: REGISTRO SANITARIO COMUNE (scheda cavallo unica, passo 2) — ottobre 2026
-- REGOLA: il cavallo è al centro dell'ecosistema · azioni univoche · storico a vita.
-- Una voce sanitaria (vaccino, Coggins, ferratura, sverminazione) inserita da UNO compare anche agli ALTRI due
-- e gli altri due ricevono l'avviso:
--   · proprietario (libretto App)  → scheda del cavallo in Equo Scuderia + avviso al centro e ai maniscalchi del cavallo
--   · Equo Scuderia (scheda cavallo) → libretto del proprietario + avviso al proprietario (già esistente) e ai maniscalchi
--   · maniscalco (intervento fatto) → libretto e scheda (già esistente) + avviso al proprietario e al centro
-- Modifiche e cancellazioni si allineano sull'altra copia; ogni azione resta in cavalli_storico.
-- Il cavallo dell'App e la scheda in Scuderia sono «lo stesso» se la scheda è collegata al proprietario e coincide microchip o nome
-- (equo_schede_scuderia_di). Il proprietario che ha tolto la condivisione (condiviso_ecosistema = false) non manda le sue voci al centro.

-- 0) da dove arriva ogni voce e con quale copia è legata
alter table public.health_events add column if not exists origine text not null default 'proprietario';
alter table public.health_events add column if not exists scuderia_evento_id uuid;
alter table public.health_events drop constraint if exists health_events_origine_check;
alter table public.health_events add constraint health_events_origine_check check (origine in ('proprietario', 'scuderia', 'maniscalco'));
alter table public.scuderia_eventi_sanitari add column if not exists origine text not null default 'scuderia';
alter table public.scuderia_eventi_sanitari add column if not exists health_event_id uuid;
alter table public.scuderia_eventi_sanitari drop constraint if exists scuderia_eventi_sanitari_origine_check;
alter table public.scuderia_eventi_sanitari add constraint scuderia_eventi_sanitari_origine_check check (origine in ('proprietario', 'scuderia', 'maniscalco'));
-- voci già create dagli interventi del maniscalco
update public.health_events h set origine = 'maniscalco' where origine = 'proprietario' and exists (select 1 from public.interventi_mascalcia i where i.health_event_id = h.id);
update public.scuderia_eventi_sanitari s set origine = 'maniscalco' where origine = 'scuderia' and exists (select 1 from public.interventi_mascalcia i where i.scuderia_evento_id = s.id);

-- 1) dalla scheda di Equo Scuderia al cavallo dell'App (una sola corrispondenza, altrimenti nessuna)
create or replace function public.equo_horse_di_scheda(p_scheda uuid)
returns uuid language sql stable security definer set search_path = public as $$
  select case when count(*) = 1 then min(h.id::text)::uuid end
  from scuderia_cavalli sc
  join scuderia_membri m on m.id = sc.proprietario_membro_id
  join horses h on h.owner_id = m.user_id
  where sc.id = p_scheda
    and ((nullif(upper(regexp_replace(coalesce(sc.microchip, ''), '\s', '', 'g')), '') is not null
          and upper(regexp_replace(coalesce(sc.microchip, ''), '\s', '', 'g')) = upper(regexp_replace(coalesce(h.microchip, ''), '\s', '', 'g')))
         or lower(trim(sc.nome)) = lower(trim(h.name)));
$$;
revoke all on function public.equo_horse_di_scheda(uuid) from public, anon, authenticated;

create or replace function public.equo_tipo_sanitario(p_tipo text, p_altro text)
returns text language sql immutable as $$
  select case p_tipo when 'vaccino' then 'Vaccino' when 'coggins' then 'Coggins' when 'ferratura' then 'Ferratura'
         when 'sverminazione' then 'Sverminazione' else coalesce(nullif(trim(p_altro), ''), 'Evento sanitario') end;
$$;

-- avviso ai maniscalchi che seguono il cavallo (escluso chi ha fatto l'azione)
create or replace function public.equo_avvisa_maniscalchi_cavallo(p_horse uuid, p_scheda uuid, p_testo text, p_escludi uuid)
returns void language plpgsql security definer set search_path = public as $$
declare r record;
begin
  for r in
    select distinct on (cv.maniscalco_id) cv.maniscalco_id, cv.cliente_mascalcia_id
      from cavalli_clienti_mascalcia cv
     where cv.maniscalco_id is distinct from p_escludi
       and ((p_horse is not null and cv.horse_id = p_horse) or (p_scheda is not null and cv.scuderia_cavallo_id = p_scheda))
     order by cv.maniscalco_id
  loop
    perform set_config('equo.collegamento', 'on', true);
    insert into messaggi_mascalcia (maniscalco_id, cliente_mascalcia_id, mittente_tipo, tipo, testo, letto)
    values (r.maniscalco_id, r.cliente_mascalcia_id, 'cliente', 'testo', p_testo, false);
    perform set_config('equo.collegamento', '', true);
  end loop;
end $$;
revoke all on function public.equo_avvisa_maniscalchi_cavallo(uuid, uuid, text, uuid) from public, anon, authenticated;

-- 2) LIBRETTO DEL PROPRIETARIO → scheda in Scuderia (+ avvisi, storico)
create or replace function public.health_events_registro_comune()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_h record; v_s record; v_n int; v_ev uuid; v_testo text; v_cosa text; r record;
begin
  if coalesce(current_setting('equo.registro', true), '') = 'on' or coalesce(current_setting('equo.hard_reset', true), '') = 'on' then return null; end if;
  if tg_op = 'DELETE' then r := old; else r := new; end if;
  select id, name, codice_equo, owner_id, coalesce(condiviso_ecosistema, true) as condiviso into v_h from horses where id = r.horse_id;
  v_cosa := equo_tipo_sanitario(r.type, null) || ' del ' || to_char(r.date, 'DD/MM/YYYY')
            || case when tg_op <> 'DELETE' and r.next_due_date is not null then ' · prossima scadenza ' || to_char(r.next_due_date, 'DD/MM/YYYY') else '' end;
  -- storico a vita
  insert into cavalli_storico (codice_equo, horse_id, tipo, descrizione, autore_user_id, autore_ruolo, app)
  values (v_h.codice_equo, r.horse_id, case tg_op when 'INSERT' then 'evento' when 'UPDATE' then 'evento_modificato' else 'evento_rimosso' end,
          case tg_op when 'INSERT' then 'Registrato: ' when 'UPDATE' then 'Modificato: ' else 'Rimosso: ' end || v_cosa
          || case r.origine when 'scuderia' then ' (voce del centro)' when 'maniscalco' then ' (voce del maniscalco)' else '' end,
          auth.uid(), case when auth.uid() = v_h.owner_id then 'proprietario' else r.origine end, 'app');

  perform set_config('equo.registro', 'on', true);
  if tg_op = 'INSERT' and new.origine = 'proprietario' and v_h.condiviso then
    select count(*) into v_n from equo_schede_scuderia_di(new.horse_id);
    if v_n = 1 then
      select * into v_s from equo_schede_scuderia_di(new.horse_id);
      insert into scuderia_eventi_sanitari (centro_id, cavallo_id, tipo, data_evento, data_scadenza, note, origine, health_event_id)
      values (v_s.centro_id, v_s.scuderia_cavallo_id, new.type, new.date, new.next_due_date,
              trim(coalesce(new.notes, '') || ' — registrato dal proprietario su Equo'), 'proprietario', new.id)
      returning id into v_ev;
      update health_events set scuderia_evento_id = v_ev where id = new.id;
      -- avviso al centro (chat del centro con il proprietario)
      insert into chat_messaggi (centro_id, membro_id, mittente_user_id, tipo, testo, letto)
      values (v_s.centro_id, v_s.membro_id, v_h.owner_id, 'testo',
              '🩺 Ho registrato nel libretto di ' || v_h.name || ': ' || v_cosa || '. È già anche nella scheda del cavallo.', false);
    end if;
    v_testo := '🩺 ' || v_h.name || ': il proprietario ha registrato ' || v_cosa || '.';
    perform equo_avvisa_maniscalchi_cavallo(new.horse_id, null, v_testo, auth.uid());
  elsif tg_op = 'UPDATE' and new.scuderia_evento_id is not null
        and (old.type, old.date, old.next_due_date, coalesce(old.notes, '')) is distinct from (new.type, new.date, new.next_due_date, coalesce(new.notes, '')) then
    update scuderia_eventi_sanitari set tipo = new.type, data_evento = new.date, data_scadenza = new.next_due_date where id = new.scuderia_evento_id;
  elsif tg_op = 'DELETE' and old.scuderia_evento_id is not null and old.origine in ('proprietario', 'scuderia') then
    delete from scuderia_eventi_sanitari where id = old.scuderia_evento_id;
  end if;
  perform set_config('equo.registro', '', true);
  return null;
end $$;
drop trigger if exists trg_health_events_registro_comune on public.health_events;
create trigger trg_health_events_registro_comune after insert or update or delete on public.health_events
  for each row execute function public.health_events_registro_comune();

-- 3) SCHEDA IN EQUO SCUDERIA → libretto del proprietario (+ avvisi ai maniscalchi, storico)
create or replace function public.scuderia_eventi_registro_comune()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_horse uuid; v_sc record; v_he uuid; v_cosa text; v_centro text; r record;
begin
  if coalesce(current_setting('equo.registro', true), '') = 'on' or coalesce(current_setting('equo.hard_reset', true), '') = 'on' then return null; end if;
  if tg_op = 'DELETE' then r := old; else r := new; end if;
  select id, nome, codice_equo into v_sc from scuderia_cavalli where id = r.cavallo_id;
  select nome into v_centro from centri where id = r.centro_id;
  v_cosa := equo_tipo_sanitario(r.tipo, r.tipo_altro) || ' del ' || to_char(r.data_evento, 'DD/MM/YYYY')
            || case when tg_op <> 'DELETE' and r.data_scadenza is not null then ' · prossima scadenza ' || to_char(r.data_scadenza, 'DD/MM/YYYY') else '' end;
  if v_sc.id is not null then
    insert into cavalli_storico (codice_equo, scuderia_cavallo_id, tipo, descrizione, autore_user_id, autore_ruolo, app)
    values (v_sc.codice_equo, v_sc.id, case tg_op when 'INSERT' then 'evento' when 'UPDATE' then 'evento_modificato' else 'evento_rimosso' end,
            case tg_op when 'INSERT' then 'Registrato: ' when 'UPDATE' then 'Modificato: ' else 'Rimosso: ' end || v_cosa || ' (' || coalesce(v_centro, 'centro') || ')',
            auth.uid(), r.origine, 'scuderia');
  end if;

  perform set_config('equo.registro', 'on', true);
  if tg_op = 'INSERT' and new.origine = 'scuderia' then
    v_horse := equo_horse_di_scheda(new.cavallo_id);
    if v_horse is not null and new.tipo in ('vaccino', 'coggins', 'ferratura', 'sverminazione') then
      insert into health_events (horse_id, type, date, next_due_date, notes, origine, scuderia_evento_id)
      values (v_horse, new.tipo, new.data_evento, new.data_scadenza,
              trim(coalesce(new.note, '') || ' — registrato da ' || coalesce(v_centro, 'la scuderia') || ' (Equo Scuderia)'), 'scuderia', new.id)
      returning id into v_he;
      update scuderia_eventi_sanitari set health_event_id = v_he where id = new.id;
    end if;
    perform equo_avvisa_maniscalchi_cavallo(v_horse, new.cavallo_id,
      '🩺 ' || coalesce(v_sc.nome, 'Cavallo') || ': ' || coalesce(v_centro, 'la scuderia') || ' ha registrato ' || v_cosa || '.', auth.uid());
  elsif tg_op = 'UPDATE' and new.health_event_id is not null and new.tipo in ('vaccino', 'coggins', 'ferratura', 'sverminazione')
        and (old.tipo, old.data_evento, old.data_scadenza) is distinct from (new.tipo, new.data_evento, new.data_scadenza) then
    update health_events set type = new.tipo, date = new.data_evento, next_due_date = new.data_scadenza where id = new.health_event_id;
  elsif tg_op = 'DELETE' and old.health_event_id is not null and old.origine in ('proprietario', 'scuderia') then
    delete from health_events where id = old.health_event_id;
  end if;
  perform set_config('equo.registro', '', true);
  return null;
end $$;
drop trigger if exists trg_scuderia_eventi_registro_comune on public.scuderia_eventi_sanitari;
create trigger trg_scuderia_eventi_registro_comune after insert or update or delete on public.scuderia_eventi_sanitari
  for each row execute function public.scuderia_eventi_registro_comune();

-- 4) avviso al proprietario dalla Scuderia: solo per le voci scritte dal centro (le altre hanno già il loro avviso)
create or replace function public.eventi_notifica_proprietario()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  r record;
  v_u uuid; v_m uuid; v_cav text; v_tipo text; v_testo text;
begin
  if v_uid is null or coalesce(current_setting('equo.hard_reset', true), '') = 'on' then return null; end if;
  if tg_op = 'DELETE' then r := old; else r := new; end if;
  if r.origine <> 'scuderia' then return null; end if;
  if tg_op = 'UPDATE' and (old.tipo, old.tipo_altro, old.data_evento, old.data_scadenza, old.cavallo_id)
                          is not distinct from (new.tipo, new.tipo_altro, new.data_evento, new.data_scadenza, new.cavallo_id) then
    return null;
  end if;
  select m.user_id, m.id, sc.nome into v_u, v_m, v_cav
    from scuderia_cavalli sc
    join scuderia_membri m on m.id = sc.proprietario_membro_id and m.ruolo = 'proprietario'
   where sc.id = r.cavallo_id;
  if v_u is null or v_u = v_uid then return null; end if;
  v_tipo := equo_tipo_sanitario(r.tipo, r.tipo_altro);
  v_testo := case tg_op
    when 'INSERT' then '🩺 ' || v_tipo || ' registrato per ' || v_cav || ' il ' || to_char(r.data_evento, 'DD/MM/YYYY')
    when 'UPDATE' then '🩺 Aggiornato: ' || v_tipo || ' di ' || v_cav || ' del ' || to_char(r.data_evento, 'DD/MM/YYYY')
    else '🩺 Rimosso dalla scheda di ' || v_cav || ': ' || v_tipo || ' del ' || to_char(r.data_evento, 'DD/MM/YYYY') end
    || case when tg_op <> 'DELETE' and r.data_scadenza is not null then ' · prossima scadenza ' || to_char(r.data_scadenza, 'DD/MM/YYYY') else '' end
    || case when tg_op = 'INSERT' and r.tipo in ('vaccino', 'coggins', 'ferratura', 'sverminazione') and equo_horse_di_scheda(r.cavallo_id) is not null
            then '. È già anche nel tuo libretto' else '' end
    || '.';
  insert into chat_messaggi (centro_id, membro_id, mittente_user_id, tipo, testo, letto)
  values (r.centro_id, v_m, v_uid, 'testo', v_testo, false);
  return null;
end $$;

-- 5) MANISCALCO: le voci che nascono dagli interventi fatti sono segnate «maniscalco»
create or replace function public.interventi_registra_nel_libretto()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_ok boolean; v_ev uuid; v_nota text;
begin
  v_ok := new.horse_id is not null and new.tipo_ferratura in ('ferratura','mezza_ferratura','pareggio')
          and exists (select 1 from horses h where h.id = new.horse_id and coalesce(h.condiviso_ecosistema, true));
  if new.stato = 'fatto' and v_ok and new.health_event_id is null then
    v_nota := equo_tipo_intervento(new.tipo_ferratura, new.tipo_altro) || ' — registrata da ' || equo_nome_profilo(new.maniscalco_id) || ' (maniscalco) su Equo';
    insert into health_events (horse_id, type, date, next_due_date, notes, origine)
    values (new.horse_id, 'ferratura', new.data_intervento, new.prossima_scadenza, v_nota, 'maniscalco') returning id into v_ev;
    new.health_event_id := v_ev;
  elsif new.health_event_id is not null and (new.stato <> 'fatto' or not v_ok) then
    new.health_event_id := null;
  elsif tg_op = 'UPDATE' and new.health_event_id is not null
        and (old.data_intervento, old.prossima_scadenza, old.horse_id) is distinct from (new.data_intervento, new.prossima_scadenza, new.horse_id) then
    update health_events set date = new.data_intervento, next_due_date = new.prossima_scadenza, horse_id = new.horse_id where id = new.health_event_id;
  end if;
  return new;
end $$;

create or replace function public.interventi_registra_in_scuderia()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_scav uuid; v_centro uuid; v_ev uuid; v_nome text;
begin
  if new.stato = 'fatto' and (tg_op = 'INSERT' or old.stato is distinct from 'fatto') and new.scuderia_evento_id is null then
    select cv.scuderia_cavallo_id, sc.centro_id into v_scav, v_centro
      from cavalli_clienti_mascalcia cv join scuderia_cavalli sc on sc.id = cv.scuderia_cavallo_id
     where cv.id = new.cavallo_cliente_id;
    if v_scav is null and new.horse_id is not null then
      select x.scuderia_cavallo_id, x.centro_id into v_scav, v_centro from equo_schede_scuderia_di(new.horse_id) x
       where (select count(*) from equo_schede_scuderia_di(new.horse_id)) = 1;
    end if;
    if v_scav is null then return new; end if;
    v_nome := equo_nome_profilo(new.maniscalco_id);
    insert into scuderia_eventi_sanitari (centro_id, cavallo_id, tipo, tipo_altro, data_evento, data_scadenza, note, origine)
    values (v_centro, v_scav,
            case when new.tipo_ferratura in ('ferratura','mezza_ferratura') then 'ferratura' else 'altro' end,
            case when new.tipo_ferratura in ('ferratura','mezza_ferratura') then null else equo_tipo_intervento(new.tipo_ferratura, new.tipo_altro) end,
            new.data_intervento, new.prossima_scadenza,
            equo_tipo_intervento(new.tipo_ferratura, new.tipo_altro) || ' — registrata da ' || v_nome || ' (maniscalco) su Equo', 'maniscalco')
    returning id into v_ev;
    new.scuderia_evento_id := v_ev;
  elsif tg_op = 'UPDATE' and old.stato = 'fatto' and new.stato <> 'fatto' and old.scuderia_evento_id is not null then
    new.scuderia_evento_id := null;
  elsif tg_op = 'UPDATE' and new.stato = 'fatto' and new.scuderia_evento_id is not null
        and (old.data_intervento, old.prossima_scadenza) is distinct from (new.data_intervento, new.prossima_scadenza) then
    update scuderia_eventi_sanitari set data_evento = new.data_intervento, data_scadenza = new.prossima_scadenza where id = new.scuderia_evento_id;
  end if;
  return new;
end $$;

-- 6) MANISCALCO: lavoro fatto → avviso al proprietario e al centro (gli altri due)
create or replace function public.interventi_avvisa_fatto()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_cli record; v_cav text; v_horse uuid; v_scheda uuid; v_testo text; s record; v_card uuid; v_prop uuid;
begin
  if new.stato <> 'fatto' or old.stato is not distinct from 'fatto' or coalesce(current_setting('equo.hard_reset', true), '') = 'on' then return null; end if;
  if new.data_intervento < current_date - 3 then return null; end if;   -- correzioni di lavori vecchi: niente avvisi
  select c.id, c.nome, c.cliente_user_id, c.centro_id into v_cli from clienti_mascalcia c where c.id = new.cliente_mascalcia_id;
  select cv.nome, cv.horse_id, cv.scuderia_cavallo_id into v_cav, v_horse, v_scheda from cavalli_clienti_mascalcia cv where cv.id = new.cavallo_cliente_id;
  v_horse := coalesce(new.horse_id, v_horse);
  v_testo := '✅ Fatto: ' || equo_tipo_intervento(new.tipo_ferratura, new.tipo_altro) || coalesce(' a ' || nullif(trim(v_cav), ''), '')
             || ' il ' || to_char(new.data_intervento, 'DD/MM/YYYY')
             || case when new.prossima_scadenza is not null then ' · prossimo intorno al ' || to_char(new.prossima_scadenza, 'DD/MM/YYYY') else '' end;
  -- proprietario: nella chat con il maniscalco (scheda del proprietario), anche se l'appuntamento era con la struttura
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
  -- centro: solo per i lavori fatti con il proprietario (quelli con la struttura il centro li segue già nei suoi appuntamenti)
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
        select s.centro_id, s.membro_id, m.user_id, 'testo', 'ℹ️ Avviso automatico di Equo — ' || v_testo || ' (maniscalco ' || equo_nome_profilo(new.maniscalco_id) || ').', false
          from scuderia_membri m where m.id = s.membro_id;
      end if;
    end loop;
  end if;
  return null;
end $$;
drop trigger if exists trg_interventi_avvisa_fatto on public.interventi_mascalcia;
create trigger trg_interventi_avvisa_fatto after update on public.interventi_mascalcia
  for each row execute function public.interventi_avvisa_fatto();

-- 7) guide degli agenti
insert into public.ai_conoscenze (ambito, categoria, titolo, contenuto, attivo, verificato_il)
select 'proprietario', 'guida', 'Libretto condiviso con scuderia e maniscalco',
'Dove: I miei cavalli → cavallo → libretto sanitario
Passi:
1. Quando registri un vaccino, un Coggins, una ferratura o una sverminazione, la voce compare anche nella scheda del cavallo della tua scuderia (se usa Equo Scuderia) e la scuderia e il maniscalco ricevono un avviso.
2. Quando la scuderia registra una voce nella scheda del cavallo, compare anche nel tuo libretto con la nota "registrato da …" e ti arriva un messaggio.
3. Quando il maniscalco segna fatta una ferratura, la trovi nel libretto e ricevi "✅ Fatto" in chat.
4. Se modifichi o cancelli una tua voce, si aggiorna anche la copia della scuderia.
Esempio: Sara registra il vaccino di Rio: la Scuderia Colleferro lo vede nella scheda di Rio e Riccardo riceve "il proprietario ha registrato Vaccino".
Note: Funziona se il cavallo è collegato alla scuderia (stesso microchip o nome) e se non hai tolto la condivisione del cavallo. Ogni voce resta nello storico del cavallo.
Parole chiave: libretto condiviso, vaccino scuderia, voce sanitaria, scheda unica, avviso, sincronizzato'
, true, current_date
where not exists (select 1 from public.ai_conoscenze where titolo = 'Libretto condiviso con scuderia e maniscalco');

insert into public.ai_conoscenze (ambito, categoria, titolo, contenuto, attivo, verificato_il)
select 'scuderia', 'guida', 'Eventi sanitari condivisi con proprietario e maniscalco',
'Dove: Cavalli & Salute → cavallo → eventi sanitari
Passi:
1. Quando registri un vaccino, un Coggins, una ferratura o una sverminazione, la voce compare anche nel libretto del proprietario su Equo App; il proprietario e i maniscalchi del cavallo ricevono un avviso.
2. Le voci registrate dal proprietario nel suo libretto arrivano qui con la nota "registrato dal proprietario su Equo", con un messaggio nella chat con il proprietario.
3. Le ferrature segnate fatte dal maniscalco arrivano qui con la nota "registrata da … (maniscalco)".
4. Modifiche e cancellazioni si aggiornano anche sull''altra copia.
Esempio: la segreteria registra la sverminazione di Rio: Simone la trova nel libretto e Riccardo riceve l''avviso.
Note: Funziona per i cavalli collegati al proprietario (proprietario collegato e stesso microchip o nome). Le voci "Altro" restano solo nella scheda del centro. Ogni voce resta nello storico del cavallo.
Parole chiave: eventi sanitari condivisi, vaccino, libretto proprietario, sincronizzazione, avviso maniscalco, scheda unica'
, true, current_date
where not exists (select 1 from public.ai_conoscenze where titolo = 'Eventi sanitari condivisi con proprietario e maniscalco');

insert into public.ai_conoscenze (ambito, categoria, titolo, contenuto, attivo, verificato_il)
select 'maniscalco', 'guida', 'Avvisi sanitari dei cavalli che segui',
'Dove: chat del cliente o della struttura
Passi:
1. Quando il proprietario o la scuderia registrano un vaccino, un Coggins, una ferratura o una sverminazione di un cavallo che segui, ricevi un messaggio "🩺 …" nella chat del cliente.
2. Quando segni "Fatto" un intervento, il proprietario riceve "✅ Fatto" in chat e la voce va nel suo libretto; se il cavallo sta in una struttura Equo Scuderia, la voce va anche nella scheda del centro, che riceve l''avviso.
Esempio: la Scuderia Colleferro registra il vaccino di Rio: Riccardo riceve "Rio: Scuderia Colleferro ha registrato Vaccino del 07/10/2026".
Note: Gli avvisi arrivano solo per i lavori di questi giorni (non per le correzioni di lavori vecchi). Ogni voce resta nello storico del cavallo.
Parole chiave: avvisi sanitari, vaccino, libretto, fatto, notifica proprietario, notifica scuderia, scheda unica'
, true, current_date
where not exists (select 1 from public.ai_conoscenze where titolo = 'Avvisi sanitari dei cavalli che segui');

-- controllo finale: deve dare true · 3 · 3
select to_regprocedure('public.equo_horse_di_scheda(uuid)') is not null as funzione_collegamento,
       (select count(*) from pg_trigger where tgname in ('trg_health_events_registro_comune','trg_scuderia_eventi_registro_comune','trg_interventi_avvisa_fatto')) as trigger_nuovi,
       (select count(*) from ai_conoscenze where titolo in ('Libretto condiviso con scuderia e maniscalco','Eventi sanitari condivisi con proprietario e maniscalco','Avvisi sanitari dei cavalli che segui')) as guide;
