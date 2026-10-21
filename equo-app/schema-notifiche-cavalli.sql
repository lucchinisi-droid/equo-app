-- 21/10/2026 NOTIFICHE DEL CODICE CAVALLO (push OneSignal tramite la funzione Netlify notify-cavalli).
-- 1) Il maniscalco propone i cavalli al proprietario (pulsante "Proponi i cavalli al proprietario"): il proprietario riceve
--    "Alessandro ti ha preparato 2 cavalli". (Quando le proposte nascono dal collegamento il proprietario e gia nell'app: niente push.)
-- 2) Cambiano nome, razza o data di nascita di un cavallo e i dati sono completi: chi puo confermare (proprietario, maniscalchi,
--    allenatori collegati, staff della scuderia) riceve "Da confermare: Venere"; chi ha fatto la modifica no.
-- Niente doppioni: lo stesso avviso alla stessa persona al massimo una volta ogni 10 minuti.

create table if not exists public.notifiche_cavalli (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  app text not null default 'equo' check (app in ('equo', 'scuderia')),
  titolo text not null,
  testo text not null,
  created_at timestamptz not null default now()
);
create index if not exists notifiche_cavalli_utente_idx on public.notifiche_cavalli (user_id, created_at desc);
alter table public.notifiche_cavalli enable row level security;
revoke all on public.notifiche_cavalli from anon, authenticated;

create or replace function public.equo_notifica(p_user uuid, p_app text, p_titolo text, p_testo text) returns void
language plpgsql security definer set search_path to 'public' as $fn$
begin
  if p_user is null or p_user = auth.uid() then return; end if;
  if exists (select 1 from notifiche_cavalli n where n.user_id = p_user and n.titolo = p_titolo and n.created_at > now() - interval '10 minutes') then return; end if;
  insert into notifiche_cavalli (user_id, app, titolo, testo) values (p_user, coalesce(p_app, 'equo'), left(p_titolo, 120), left(p_testo, 300));
end
$fn$;
revoke all on function public.equo_notifica(uuid, text, text, text) from public, anon, authenticated;

create or replace function public.equo_notifica_da_confermare(p_horse uuid, p_sc uuid, p_nome text) returns void
language plpgsql security definer set search_path to 'public' as $fn$
declare r record; v_io text;
  v_tit text := 'Da confermare: ' || coalesce(nullif(trim(p_nome), ''), 'un cavallo');
  v_txt text := 'Nome, razza o data di nascita di ' || coalesce(nullif(trim(p_nome), ''), 'un cavallo') || ' sono stati aggiornati: controlla e conferma i dati per il codice definitivo.';
begin
  select c.persona into v_io from equo_chi_conferma(auth.uid(), p_horse, p_sc) c limit 1;
  for r in
    select h.owner_id as uid, null::uuid as centro from horses h where p_horse is not null and h.id = p_horse
    union select cv.maniscalco_id, null::uuid from cavalli_clienti_mascalcia cv where p_horse is not null and cv.horse_id = p_horse
    union select t.trainer_id, null::uuid from trainer_collegamenti t where p_horse is not null and t.horse_id = p_horse and t.stato = 'attivo'
    union select null::uuid, sc.centro_id from scuderia_cavalli sc where p_horse is not null and sc.horse_id = p_horse
    union select null::uuid, sc.centro_id from scuderia_cavalli sc where p_horse is null and sc.id = p_sc
    union select cv.maniscalco_id, null::uuid from cavalli_clienti_mascalcia cv where p_horse is null and cv.scuderia_cavallo_id = p_sc
    union select tc.trainer_id, null::uuid from trainer_cavalli tc where p_horse is null and tc.scuderia_cavallo_id = p_sc and tc.archiviato_il is null
  loop
    if r.uid is not null then
      if v_io is distinct from 'u:' || r.uid::text then perform equo_notifica(r.uid, 'equo', v_tit, v_txt); end if;
    elsif r.centro is not null and v_io is distinct from 'c:' || r.centro::text then
      perform equo_notifica(m.user_id, 'scuderia', v_tit, v_txt)
         from scuderia_membri m where m.centro_id = r.centro and m.ruolo in ('admin', 'istruttore') and m.user_id is not null;
    end if;
  end loop;
end
$fn$;
revoke all on function public.equo_notifica_da_confermare(uuid, uuid, text) from public, anon, authenticated;

create or replace function public.equo_notifica_dati_cambiati() returns trigger
language plpgsql security definer set search_path to 'public' as $fn$
declare v_nome text; v_razza text; v_nasc date;
begin
  if tg_table_name = 'horses' then
    v_nome := new.name; v_razza := new.breed; v_nasc := new.birth_date;
  else
    v_nome := new.nome; v_razza := new.razza; v_nasc := new.data_nascita;
  end if;
  if nullif(trim(coalesce(v_nome, '')), '') is null or nullif(trim(coalesce(v_razza, '')), '') is null or v_nasc is null then return null; end if;
  if tg_table_name = 'horses' then
    perform equo_notifica_da_confermare(new.id, null, v_nome);
  elsif new.horse_id is null then
    perform equo_notifica_da_confermare(null, new.id, v_nome);
  end if;
  return null;
end
$fn$;
drop trigger if exists trg_horses_notifica_dati on public.horses;
create trigger trg_horses_notifica_dati after update of name, breed, birth_date on public.horses for each row
  when (old.name is distinct from new.name or old.breed is distinct from new.breed or old.birth_date is distinct from new.birth_date)
  execute function public.equo_notifica_dati_cambiati();
drop trigger if exists trg_scuderia_notifica_dati on public.scuderia_cavalli;
create trigger trg_scuderia_notifica_dati after update of nome, razza, data_nascita on public.scuderia_cavalli for each row
  when (old.nome is distinct from new.nome or old.razza is distinct from new.razza or old.data_nascita is distinct from new.data_nascita)
  execute function public.equo_notifica_dati_cambiati();

-- proposta dal pulsante del maniscalco: avviso al proprietario
create or replace function public.equo_proponi_cavalli_cliente(p_cliente uuid, p_riga uuid default null) returns json
language plpgsql security definer set search_path to 'public' as $fn$
declare v_n int; v_owner uuid;
begin
  if auth.uid() is null then return json_build_object('ok', false, 'motivo', 'non_autenticato'); end if;
  if not exists (select 1 from clienti_mascalcia c where c.id = p_cliente and c.maniscalco_id = auth.uid()) then
    return json_build_object('ok', false, 'motivo', 'cliente_non_trovato');
  end if;
  select c.cliente_user_id into v_owner from clienti_mascalcia c where c.id = p_cliente;
  if v_owner is null then
    return json_build_object('ok', false, 'motivo', 'cliente_non_collegato');
  end if;
  v_n := equo_proponi_interno(p_cliente, p_riga);
  if v_n > 0 then
    perform equo_notifica(v_owner, 'equo',
      coalesce(nullif(trim(equo_nome_profilo(auth.uid())), ''), 'Il tuo maniscalco') || ' ti ha preparato ' || case when v_n = 1 then '1 cavallo' else v_n || ' cavalli' end,
      'Aprili nella Home di Equo: accettali, completa i dati e confermali.');
  end if;
  return json_build_object('ok', true, 'proposti', v_n);
end
$fn$;
revoke all on function public.equo_proponi_cavalli_cliente(uuid, uuid) from public, anon;
grant execute on function public.equo_proponi_cavalli_cliente(uuid, uuid) to authenticated;

-- webhook: ogni avviso nuovo va alla funzione notify-cavalli (stesso segreto dei webhook della chat, copiato senza mostrarlo)
do $do$
declare segreto text;
begin
  select (regexp_match(pg_get_triggerdef(t.oid), '"x-webhook-secret"\s*:\s*"([^"]+)"', 'i'))[1] into segreto
    from pg_trigger t where t.tgname = 'notify-chat-scuderia' limit 1;
  if segreto is null then raise exception 'Segreto dei webhook non trovato: nessun webhook creato.'; end if;
  execute 'drop trigger if exists "notify-cavalli" on public.notifiche_cavalli';
  execute format('create trigger "notify-cavalli" after insert on public.notifiche_cavalli for each row execute function supabase_functions.http_request(%L, %L, %L, %L, %L)',
    'https://app.equohub.com/.netlify/functions/notify-cavalli', 'POST',
    '{"Content-Type":"application/json","X-Webhook-Secret":"' || segreto || '"}', '{}', '5000');
end
$do$;
