-- Equo: appuntamenti proprietario ↔ maniscalco visibili anche alla struttura dove sta il cavallo (ottobre 2026)
-- Il cavallo dell'app del proprietario (horses) è «lo stesso» della scheda in Equo Scuderia (scuderia_cavalli) quando
-- la scheda è collegata al proprietario (proprietario_membro_id → stesso utente) e coincide il microchip o il nome.
-- Cosa succede:
--  · appuntamento fissato / modificato / annullato dal maniscalco per quel cavallo → avviso alla struttura:
--      - se il maniscalco è collegato alla struttura: nella chat Professionisti con lui;
--      - altrimenti: nella chat della struttura con il proprietario (avviso automatico);
--  · Equo Scuderia → Professionisti → Appuntamenti mostra anche questi appuntamenti («con il proprietario», sola lettura);
--  · intervento fatto → registrato anche nella scheda sanitaria del cavallo in Scuderia.

-- 1) dal cavallo del proprietario alla scheda (o alle schede) in Scuderia
create or replace function public.equo_schede_scuderia_di(p_horse uuid)
returns table (scuderia_cavallo_id uuid, centro_id uuid, membro_id uuid, nome text)
language sql stable security definer set search_path = public as $$
  select sc.id, sc.centro_id, m.id, sc.nome
  from horses h
  join scuderia_membri m on m.user_id = h.owner_id
  join scuderia_cavalli sc on sc.proprietario_membro_id = m.id and sc.centro_id = m.centro_id
  where h.id = p_horse
    and (
      (nullif(upper(regexp_replace(coalesce(sc.microchip, ''), '\s', '', 'g')), '') is not null
       and upper(regexp_replace(coalesce(sc.microchip, ''), '\s', '', 'g')) = upper(regexp_replace(coalesce(h.microchip, ''), '\s', '', 'g')))
      or lower(trim(sc.nome)) = lower(trim(h.name))
    );
$$;
revoke all on function public.equo_schede_scuderia_di(uuid) from public, anon, authenticated;

-- 2) avviso alla struttura
create or replace function public.equo_avvisa_struttura_appuntamento(p_i public.interventi_mascalcia, p_evento text, p_prima text default null)
returns void language plpgsql security definer set search_path = public as $$
declare s record; v_card uuid; v_man text; v_prop text; v_testo text; v_cosa text;
begin
  if p_i.horse_id is null then return; end if;
  v_man := equo_nome_profilo(p_i.maniscalco_id);
  v_cosa := equo_tipo_intervento(p_i.tipo_ferratura, p_i.tipo_altro);
  for s in select * from equo_schede_scuderia_di(p_i.horse_id) loop
    select coalesce(nullif(trim(nome_visualizzato), ''), equo_nome_profilo(user_id)) into v_prop from scuderia_membri where id = s.membro_id;
    v_testo := case p_evento
      when 'nuovo' then '🔨 Maniscalco in arrivo: ' || v_cosa || ' per ' || s.nome || ' — ' || equo_data_it(p_i.data_intervento, p_i.ora)
                        || '. Fissato da ' || v_man || ' con il proprietario (' || coalesce(v_prop, 'proprietario') || ').'
      when 'modificato' then '✏️ Appuntamento del maniscalco MODIFICATO per ' || s.nome || E':\n• Prima: ' || coalesce(p_prima, '—')
                        || E'\n• Ora: ' || v_cosa || ' — ' || equo_data_it(p_i.data_intervento, p_i.ora)
                        || E'\nModificato da ' || v_man || ' (appuntamento con il proprietario ' || coalesce(v_prop, '') || ').'
      when 'annullato' then '❌ Annullato: ' || v_cosa || ' per ' || s.nome || ' — ' || equo_data_it(p_i.data_intervento, p_i.ora)
                        || ' (' || v_man || ', appuntamento con il proprietario).'
    end;
    if v_testo is null then continue; end if;
    -- maniscalco collegato alla struttura? → chat Professionisti
    select id into v_card from clienti_mascalcia
     where maniscalco_id = p_i.maniscalco_id and centro_id = s.centro_id and collegamento_stato = 'attivo' limit 1;
    if v_card is not null then
      perform set_config('equo.collegamento', 'on', true);
      insert into messaggi_mascalcia (maniscalco_id, cliente_mascalcia_id, mittente_tipo, mittente_user_id, tipo, testo, letto)
      values (p_i.maniscalco_id, v_card, 'maniscalco', p_i.maniscalco_id, 'testo', v_testo, false);
      perform set_config('equo.collegamento', '', true);
    else
      -- altrimenti nella chat della struttura con il proprietario (la struttura riceve la notifica)
      insert into chat_messaggi (centro_id, membro_id, mittente_user_id, tipo, testo, letto)
      select s.centro_id, s.membro_id, m.user_id, 'testo', 'ℹ️ Avviso automatico di Equo — ' || v_testo, false
        from scuderia_membri m where m.id = s.membro_id;
    end if;
  end loop;
end $$;
revoke all on function public.equo_avvisa_struttura_appuntamento(public.interventi_mascalcia, text, text) from public, anon, authenticated;

-- 3) quando scatta: appuntamenti col proprietario (non quelli già con la struttura), da oggi in poi
create or replace function public.interventi_avvisa_struttura()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_struttura boolean;
begin
  if tg_op = 'DELETE' then
    if old.horse_id is not null and old.gruppo_id is null and old.stato = 'programmato' and old.data_intervento >= current_date then
      select centro_id is not null into v_struttura from clienti_mascalcia where id = old.cliente_mascalcia_id;
      if not coalesce(v_struttura, false) then perform equo_avvisa_struttura_appuntamento(old, 'annullato'); end if;
    end if;
    return null;
  end if;
  if new.horse_id is null or new.gruppo_id is not null then return null; end if;
  select centro_id is not null into v_struttura from clienti_mascalcia where id = new.cliente_mascalcia_id;
  if coalesce(v_struttura, false) then return null; end if;
  if tg_op = 'INSERT' then
    if new.stato = 'programmato' and new.data_intervento >= current_date then perform equo_avvisa_struttura_appuntamento(new, 'nuovo'); end if;
    return null;
  end if;
  -- UPDATE
  if new.stato = 'programmato' and old.stato in ('richiesto','proposto') and new.data_intervento >= current_date then
    perform equo_avvisa_struttura_appuntamento(new, 'nuovo');                  -- richiesta del proprietario confermata
  elsif new.stato = 'programmato' and old.stato = 'programmato' and new.data_intervento >= current_date
        and (old.tipo_ferratura, coalesce(old.tipo_altro, ''), old.data_intervento, old.ora, old.horse_id)
            is distinct from (new.tipo_ferratura, coalesce(new.tipo_altro, ''), new.data_intervento, new.ora, new.horse_id) then
    perform equo_avvisa_struttura_appuntamento(new, 'modificato',
      equo_tipo_intervento(old.tipo_ferratura, old.tipo_altro) || ' — ' || equo_data_it(old.data_intervento, old.ora));
  elsif old.stato = 'programmato' and new.stato in ('annullato','rifiutato') and old.data_intervento >= current_date then
    perform equo_avvisa_struttura_appuntamento(old, 'annullato');
  end if;
  return null;
end $$;
drop trigger if exists trg_interventi_avvisa_struttura on public.interventi_mascalcia;
create trigger trg_interventi_avvisa_struttura after insert or update or delete on public.interventi_mascalcia
  for each row execute function public.interventi_avvisa_struttura();

-- 4) intervento fatto: anche nella scheda sanitaria del cavallo in Scuderia (prima solo per gli appuntamenti con la struttura)
create or replace function public.interventi_registra_in_scuderia()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_scav uuid; v_centro uuid; v_ev uuid; v_nome text;
begin
  if new.stato = 'fatto' and (tg_op = 'INSERT' or old.stato is distinct from 'fatto') and new.scuderia_evento_id is null then
    select cv.scuderia_cavallo_id, sc.centro_id into v_scav, v_centro
      from cavalli_clienti_mascalcia cv join scuderia_cavalli sc on sc.id = cv.scuderia_cavallo_id
     where cv.id = new.cavallo_cliente_id;
    if v_scav is null and new.horse_id is not null then
      -- cavallo del proprietario che sta in una struttura Equo Scuderia (se è in una sola)
      select x.scuderia_cavallo_id, x.centro_id into v_scav, v_centro from equo_schede_scuderia_di(new.horse_id) x
       where (select count(*) from equo_schede_scuderia_di(new.horse_id)) = 1;
    end if;
    if v_scav is null then return new; end if;
    v_nome := equo_nome_profilo(new.maniscalco_id);
    insert into scuderia_eventi_sanitari (centro_id, cavallo_id, tipo, tipo_altro, data_evento, data_scadenza, note)
    values (v_centro, v_scav,
            case when new.tipo_ferratura in ('ferratura','mezza_ferratura') then 'ferratura' else 'altro' end,
            case when new.tipo_ferratura in ('ferratura','mezza_ferratura') then null else equo_tipo_intervento(new.tipo_ferratura, new.tipo_altro) end,
            new.data_intervento, new.prossima_scadenza,
            equo_tipo_intervento(new.tipo_ferratura, new.tipo_altro) || ' — registrata da ' || v_nome || ' (maniscalco) su Equo')
    returning id into v_ev;
    new.scuderia_evento_id := v_ev;
  elsif tg_op = 'UPDATE' and old.stato = 'fatto' and new.stato <> 'fatto' and old.scuderia_evento_id is not null then
    new.scuderia_evento_id := null;          -- l'evento vecchio lo cancella il trigger AFTER
  elsif tg_op = 'UPDATE' and new.stato = 'fatto' and new.scuderia_evento_id is not null
        and (old.data_intervento, old.prossima_scadenza) is distinct from (new.data_intervento, new.prossima_scadenza) then
    update scuderia_eventi_sanitari set data_evento = new.data_intervento, data_scadenza = new.prossima_scadenza where id = new.scuderia_evento_id;
  end if;
  return new;
end $$;

-- 5) Scuderia → Professionisti → Appuntamenti: anche quelli del maniscalco con i proprietari dei cavalli del centro (sola lettura)
create or replace function public.scuderia_appuntamenti_professionista(p_cliente_id uuid)
returns json language sql stable security definer set search_path = public as $$
  select case when equo_cliente_struttura_staff(p_cliente_id) is null then '[]'::json else
  coalesce((select json_agg(g order by g.data_intervento desc, g.ora desc nulls last) from (
    select coalesce(i.gruppo_id, i.id) as gruppo_id,
           min(i.data_intervento) as data_intervento, to_char(min(i.ora), 'HH24:MI') as ora,
           min(i.tipo_ferratura) as tipo, min(i.tipo_altro) as tipo_altro, min(i.note) as note,
           coalesce(min(i.stato) filter (where i.stato <> 'fatto'), 'fatto') as stato,
           (array_agg(i.modifica order by i.updated_at desc) filter (where i.modifica is not null))[1] as modifica,
           null::text as con_proprietario,
           json_agg(json_build_object('nome', coalesce(cv.nome, 'Cavallo'), 'scuderia_cavallo_id', cv.scuderia_cavallo_id, 'fatto', i.stato = 'fatto',
                    'tipo', i.tipo_ferratura, 'tipo_altro', i.tipo_altro) order by cv.nome) as cavalli
    from interventi_mascalcia i
    left join cavalli_clienti_mascalcia cv on cv.id = i.cavallo_cliente_id
    where i.cliente_mascalcia_id = p_cliente_id
      and (i.data_intervento >= current_date - 60 or i.stato in ('richiesto','proposto','programmato'))
    group by coalesce(i.gruppo_id, i.id)
    union all
    select i.id, i.data_intervento, to_char(i.ora, 'HH24:MI'), i.tipo_ferratura, i.tipo_altro, null,
           i.stato, i.modifica,
           coalesce(nullif(trim(m.nome_visualizzato), ''), equo_nome_profilo(m.user_id), 'proprietario'),
           json_build_array(json_build_object('nome', s.nome, 'scuderia_cavallo_id', s.scuderia_cavallo_id, 'fatto', i.stato = 'fatto',
                    'tipo', i.tipo_ferratura, 'tipo_altro', i.tipo_altro))
    from clienti_mascalcia card
    join interventi_mascalcia i on i.maniscalco_id = card.maniscalco_id and i.horse_id is not null and i.gruppo_id is null
    join clienti_mascalcia cp on cp.id = i.cliente_mascalcia_id and cp.centro_id is null
    cross join lateral equo_schede_scuderia_di(i.horse_id) s
    join scuderia_membri m on m.id = s.membro_id
    where card.id = p_cliente_id and s.centro_id = card.centro_id
      and i.stato in ('programmato','fatto')
      and (i.data_intervento >= current_date - 60)
  ) g), '[]'::json) end;
$$;

-- controllo finale
select to_regprocedure('public.equo_schede_scuderia_di(uuid)') is not null as funzione_cavallo,
       (select count(*) from pg_trigger where tgname = 'trg_interventi_avvisa_struttura') as trigger_avviso,
       (select count(*) from equo_schede_scuderia_di((select id from horses where name = 'Rio' limit 1))) as rio_in_scuderia;
