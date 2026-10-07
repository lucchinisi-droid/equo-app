-- Equo: modifiche agli appuntamenti più chiare (ottobre 2026)
-- Se il maniscalco cambia servizio, data o ora di un appuntamento non ancora fatto:
--  · l'appuntamento ricorda com'era prima (colonna «modifica»);
--  · struttura Equo Scuderia: torna «da confermare» e riceve in chat «prima → ora»;
--  · proprietario collegato: riceve in chat «prima → ora» (dall'app) e tocca «Ok, ho visto».
-- Se l'intervento è già fatto e cambia il servizio, si aggiornano anche libretto e scheda in Scuderia.

-- 1) com'era prima della modifica
alter table public.interventi_mascalcia add column if not exists modifica jsonb;
alter table public.interventi_mascalcia drop constraint if exists interventi_mascalcia_modifica_check;
alter table public.interventi_mascalcia add constraint interventi_mascalcia_modifica_check check (modifica is null or char_length(modifica::text) <= 600);

-- 2) traccia la modifica (scatta dopo il controllo della struttura, che può rimettere «proposto»)
create or replace function public.interventi_traccia_modifica()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_cambiato boolean;
begin
  v_cambiato := (old.tipo_ferratura, coalesce(old.tipo_altro, ''), old.data_intervento, old.ora)
                is distinct from (new.tipo_ferratura, coalesce(new.tipo_altro, ''), new.data_intervento, new.ora);
  if new.stato in ('fatto', 'annullato', 'rifiutato') then
    new.modifica := null;
  elsif v_cambiato and old.stato in ('programmato', 'proposto', 'richiesto') then
    -- si tiene la versione di partenza: dopo più modifiche di fila il «prima» resta quello concordato
    new.modifica := jsonb_build_object(
      'prima', coalesce(old.modifica -> 'prima', jsonb_build_object(
                 'tipo', old.tipo_ferratura, 'tipo_altro', old.tipo_altro,
                 'data', old.data_intervento, 'ora', to_char(old.ora, 'HH24:MI'))),
      'da', case when auth.uid() is not null and auth.uid() = new.maniscalco_id then 'maniscalco' else 'struttura' end,
      'il', now());
  elsif old.stato in ('proposto', 'richiesto') and new.stato = 'programmato' then
    new.modifica := null;   -- confermato: la modifica è stata accettata
  end if;
  return new;
end $$;
drop trigger if exists trg_interventi_h_modifica on public.interventi_mascalcia;
create trigger trg_interventi_h_modifica before update on public.interventi_mascalcia
  for each row execute function public.interventi_traccia_modifica();

-- 3) struttura: anche il cambio di servizio rimette l'appuntamento «da confermare»
create or replace function public.interventi_gruppo_guard()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.gruppo_id is null or auth.uid() is null or coalesce(current_setting('equo.appuntamenti', true), '') = 'on' then
    return new;
  end if;
  if new.stato is distinct from old.stato
     and not ((old.stato = 'programmato' and new.stato = 'fatto') or (old.stato = 'fatto' and new.stato = 'programmato')) then
    raise exception 'Per confermare, rifiutare o annullare un appuntamento con la struttura usa i tasti dedicati.';
  end if;
  if (old.data_intervento, old.ora) is distinct from (new.data_intervento, new.ora) then
    if old.stato not in ('programmato','richiesto','proposto') then
      raise exception 'Questo appuntamento non si può più spostare.';
    end if;
    new.stato := 'proposto';
  elsif (old.tipo_ferratura, coalesce(old.tipo_altro, '')) is distinct from (new.tipo_ferratura, coalesce(new.tipo_altro, ''))
        and old.stato in ('programmato','richiesto','proposto') then
    new.stato := 'proposto';
  end if;
  return new;
end $$;

-- 4) struttura: messaggio chiaro «prima → ora» e tutto il gruppo da riconfermare
create or replace function public.interventi_gruppo_sync()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_data boolean; v_tipo boolean; v_cambi text := ''; v_cav text;
begin
  if new.gruppo_id is null or auth.uid() is null or coalesce(current_setting('equo.appuntamenti', true), '') = 'on' then
    return null;
  end if;
  if old.stato not in ('programmato','richiesto','proposto') then return null; end if;
  v_data := (old.data_intervento, old.ora) is distinct from (new.data_intervento, new.ora);
  v_tipo := (old.tipo_ferratura, coalesce(old.tipo_altro, '')) is distinct from (new.tipo_ferratura, coalesce(new.tipo_altro, ''));
  if not v_data and not v_tipo then return null; end if;
  perform set_config('equo.appuntamenti', 'on', true);
  if v_data then
    update interventi_mascalcia set data_intervento = new.data_intervento, ora = new.ora, stato = 'proposto'
     where gruppo_id = new.gruppo_id and id <> new.id and stato not in ('fatto','annullato','rifiutato');
  else
    update interventi_mascalcia set stato = 'proposto'
     where gruppo_id = new.gruppo_id and id <> new.id and stato in ('programmato','richiesto');
  end if;
  if v_tipo then
    select cv.nome into v_cav from cavalli_clienti_mascalcia cv where cv.id = new.cavallo_cliente_id;
    v_cambi := E'\n• Servizio' || coalesce(' (' || nullif(trim(v_cav), '') || ')', '') || ': '
            || equo_tipo_intervento(old.tipo_ferratura, old.tipo_altro) || ' → ' || equo_tipo_intervento(new.tipo_ferratura, new.tipo_altro);
  end if;
  if v_data then
    v_cambi := v_cambi || E'\n• Data: ' || equo_data_it(old.data_intervento, old.ora) || ' → ' || equo_data_it(new.data_intervento, new.ora);
  end if;
  perform equo_msg_gruppo(new.gruppo_id, false,
    '✏️ APPUNTAMENTO MODIFICATO da ' || equo_nome_profilo(auth.uid()) || ':' || v_cambi
    || E'\nOra: ' || equo_descr_gruppo(new.gruppo_id)
    || E'.\n⚠️ Da riconfermare in Equo Scuderia → Professionisti → Appuntamenti.');
  perform set_config('equo.appuntamenti', '', true);
  return null;
end $$;

-- 5) intervento già fatto e servizio cambiato: si aggiornano libretto del proprietario e scheda in Scuderia
create or replace function public.interventi_aggiorna_servizio_fatto()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_descr text;
begin
  if new.stato <> 'fatto'
     or (old.tipo_ferratura, coalesce(old.tipo_altro, '')) is not distinct from (new.tipo_ferratura, coalesce(new.tipo_altro, '')) then
    return null;
  end if;
  v_descr := equo_tipo_intervento(new.tipo_ferratura, new.tipo_altro) || ' — registrata da ' || equo_nome_profilo(new.maniscalco_id) || ' (maniscalco) su Equo';
  if new.health_event_id is not null then
    update health_events set notes = v_descr where id = new.health_event_id;
  end if;
  if new.scuderia_evento_id is not null then
    update scuderia_eventi_sanitari
       set tipo = case when new.tipo_ferratura in ('ferratura','mezza_ferratura') then 'ferratura' else 'altro' end,
           tipo_altro = case when new.tipo_ferratura in ('ferratura','mezza_ferratura') then null else equo_tipo_intervento(new.tipo_ferratura, new.tipo_altro) end,
           note = v_descr
     where id = new.scuderia_evento_id;
  end if;
  return null;
end $$;
drop trigger if exists trg_interventi_servizio_fatto on public.interventi_mascalcia;
create trigger trg_interventi_servizio_fatto after update on public.interventi_mascalcia
  for each row execute function public.interventi_aggiorna_servizio_fatto();

-- 6) i conferma della struttura e del maniscalco cancellano la «modifica» (lo fa il trigger del punto 2 su proposto/richiesto → programmato)

-- 7) proprietario: gli appuntamenti col maniscalco riportano anche la modifica
create or replace function public.appuntamenti_maniscalco_cliente(p_cliente_id uuid)
returns json language sql stable security definer set search_path = public as $$
  select coalesce(json_agg(x order by x.data_intervento, x.ora nulls last), '[]'::json) from (
    select i.id, i.data_intervento, i.ora, i.tipo_ferratura, i.tipo_altro, i.stato, i.note, i.modifica,
           coalesce(cv.nome, c.nome_cavallo) as nome_cavallo
    from public.interventi_mascalcia i
    join public.clienti_mascalcia c on c.id = i.cliente_mascalcia_id and c.cliente_user_id = auth.uid()
    left join public.cavalli_clienti_mascalcia cv on cv.id = i.cavallo_cliente_id
    where i.cliente_mascalcia_id = p_cliente_id
      and i.stato in ('richiesto','programmato','rifiutato')
      and i.data_intervento >= current_date - 7
  ) x;
$$;

-- 8) proprietario: «Ok, ho visto» → la modifica sparisce e il maniscalco lo legge in chat
create or replace function public.prop_visto_modifica_appuntamento(p_intervento_id uuid)
returns json language plpgsql security definer set search_path = public as $$
declare v record;
begin
  select i.id, i.maniscalco_id, i.cliente_mascalcia_id, i.tipo_ferratura, i.tipo_altro, i.data_intervento, i.ora,
         coalesce(cv.nome, c.nome_cavallo) as cavallo
    into v
    from interventi_mascalcia i
    join clienti_mascalcia c on c.id = i.cliente_mascalcia_id and c.cliente_user_id = auth.uid() and c.centro_id is null
    left join cavalli_clienti_mascalcia cv on cv.id = i.cavallo_cliente_id
   where i.id = p_intervento_id and i.modifica is not null;
  if v.id is null then return json_build_object('ok', false, 'errore', 'Niente da confermare.'); end if;
  perform set_config('equo.appuntamenti', 'on', true);
  update interventi_mascalcia set modifica = null where id = v.id;
  insert into messaggi_mascalcia (maniscalco_id, cliente_mascalcia_id, mittente_tipo, tipo, testo, letto)
  values (v.maniscalco_id, v.cliente_mascalcia_id, 'cliente', 'testo',
    '👍 Ok, ho visto la modifica: ' || equo_tipo_intervento(v.tipo_ferratura, v.tipo_altro)
    || coalesce(' per ' || nullif(trim(v.cavallo), ''), '') || ' — ' || equo_data_it(v.data_intervento, v.ora) || '.', false);
  perform set_config('equo.appuntamenti', '', true);
  return json_build_object('ok', true);
end $$;
revoke all on function public.prop_visto_modifica_appuntamento(uuid) from public, anon;
grant execute on function public.prop_visto_modifica_appuntamento(uuid) to authenticated;

-- 9) Scuderia: elenco appuntamenti con il maniscalco riporta anche la modifica
create or replace function public.scuderia_appuntamenti_professionista(p_cliente_id uuid)
returns json language sql stable security definer set search_path = public as $$
  select case when equo_cliente_struttura_staff(p_cliente_id) is null then '[]'::json else
  coalesce((select json_agg(g order by g.data_intervento desc, g.ora desc nulls last) from (
    select coalesce(i.gruppo_id, i.id) as gruppo_id,
           min(i.data_intervento) as data_intervento, to_char(min(i.ora), 'HH24:MI') as ora,
           min(i.tipo_ferratura) as tipo, min(i.tipo_altro) as tipo_altro, min(i.note) as note,
           coalesce(min(i.stato) filter (where i.stato <> 'fatto'), 'fatto') as stato,
           (array_agg(i.modifica order by i.updated_at desc) filter (where i.modifica is not null))[1] as modifica,
           json_agg(json_build_object('nome', coalesce(cv.nome, 'Cavallo'), 'scuderia_cavallo_id', cv.scuderia_cavallo_id, 'fatto', i.stato = 'fatto',
                    'tipo', i.tipo_ferratura, 'tipo_altro', i.tipo_altro) order by cv.nome) as cavalli
    from interventi_mascalcia i
    left join cavalli_clienti_mascalcia cv on cv.id = i.cavallo_cliente_id
    where i.cliente_mascalcia_id = p_cliente_id
      and (i.data_intervento >= current_date - 60 or i.stato in ('richiesto','proposto','programmato'))
    group by coalesce(i.gruppo_id, i.id)
  ) g), '[]'::json) end;
$$;

-- controllo finale
select (select count(*) from information_schema.columns where table_name = 'interventi_mascalcia' and column_name = 'modifica') as colonna_modifica,
       (select count(*) from pg_trigger where tgname in ('trg_interventi_h_modifica','trg_interventi_servizio_fatto')) as trigger_nuovi,
       to_regprocedure('public.prop_visto_modifica_appuntamento(uuid)') is not null as rpc_visto;
