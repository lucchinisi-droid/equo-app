-- 26/10/2026 EQUO CV, EQUO PASS, PAGINA PUBBLICA E REFERENZE DEI PROFESSIONISTI
-- 1) pro_cv: il curriculum del professionista (dati in jsonb), con indirizzo della pagina pubblica (slug) e interruttore
--    «pubblica» (solo PREMIUM: il database lo spegne se il piano non è Premium)
-- 2) pro_cv_verifiche: corsi e certificati verificati da Equo (si scrive solo dal SQL Editor: il professionista non può)
-- 3) pro_referenze: il professionista chiede una referenza a un suo cliente collegato, il cliente la scrive, il professionista
--    decide se pubblicarla
-- 4) numeri Equo calcolati dal lavoro registrato (cavalli seguiti, interventi, clienti, discipline, su Equo dal)
-- 5) equo_pro_pubblico(slug): i dati per la pagina pubblica app.equohub.com/pro/nome (solo la funzione Netlify «pubblico»)
-- 6) spazio file privato «pro-cv» per attestati e foto degli eventi (ogni professionista vede solo i suoi)
-- Si puo rieseguire senza danni.

create table if not exists public.pro_cv (
  user_id uuid primary key references auth.users(id) on delete cascade,
  dati jsonb not null default '{}'::jsonb,
  slug text unique check (slug is null or slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  pubblica boolean not null default false,
  hammer_giorno date,
  hammer_n int not null default 0,
  aggiornato_il timestamptz not null default now()
);
alter table public.pro_cv enable row level security;
drop policy if exists pro_cv_sel on public.pro_cv;
create policy pro_cv_sel on public.pro_cv for select using (user_id = auth.uid());
drop policy if exists pro_cv_ins on public.pro_cv;
create policy pro_cv_ins on public.pro_cv for insert with check (user_id = auth.uid());
drop policy if exists pro_cv_upd on public.pro_cv;
create policy pro_cv_upd on public.pro_cv for update using (user_id = auth.uid()) with check (user_id = auth.uid());
revoke all on public.pro_cv from anon;
grant select, insert, update on public.pro_cv to authenticated;

-- indirizzo della pagina pubblica dal nome (francesco-bizzarri, francesco-bizzarri-2…), pagina pubblica solo Premium,
-- contatori di Hammer non modificabili dall'app
create or replace function public.equo_slug_testo(t text) returns text language sql immutable as $fn$
  select trim(both '-' from regexp_replace(lower(translate(coalesce(t, ''), 'àáâäèéêëìíîïòóôöùúûüçñÀÁÂÄÈÉÊËÌÍÎÏÒÓÔÖÙÚÛÜÇÑ', 'aaaaeeeeiiiioooouuuucnaaaaeeeeiiiioooouuuucn')), '[^a-z0-9]+', '-', 'g'))
$fn$;
create or replace function public.pro_cv_controlli() returns trigger
language plpgsql security definer set search_path to 'public' as $fn$
declare v_base text; v_slug text; n int := 1;
begin
  if auth.uid() is not null then
    if tg_op = 'UPDATE' then new.hammer_giorno := old.hammer_giorno; new.hammer_n := old.hammer_n;
    else new.hammer_giorno := null; new.hammer_n := 0; end if;
  end if;
  if new.pubblica and not exists (select 1 from profiles where id = new.user_id and piano = 'premium') then new.pubblica := false; end if;
  if new.slug is not null then new.slug := nullif(equo_slug_testo(new.slug), ''); end if;
  if new.slug is null then
    select nullif(equo_slug_testo(coalesce(nullif(trim(full_name), ''), nullif(trim(dati_pagamento_nome), ''), 'professionista')), '') into v_base from profiles where id = new.user_id;
    v_base := left(coalesce(v_base, 'professionista'), 50); v_slug := v_base;
    while exists (select 1 from pro_cv where slug = v_slug and user_id <> new.user_id) loop n := n + 1; v_slug := v_base || '-' || n; end loop;
    new.slug := v_slug;
  elsif exists (select 1 from pro_cv where slug = new.slug and user_id <> new.user_id) then
    raise exception 'SLUG_USATO: questo indirizzo è già usato da un altro professionista';
  end if;
  new.aggiornato_il := now();
  return new;
end $fn$;
drop trigger if exists trg_pro_cv_controlli on public.pro_cv;
create trigger trg_pro_cv_controlli before insert or update on public.pro_cv for each row execute function public.pro_cv_controlli();

create table if not exists public.pro_cv_verifiche (
  user_id uuid not null references auth.users(id) on delete cascade,
  voce_id text not null,
  verificato_il timestamptz not null default now(),
  primary key (user_id, voce_id)
);
alter table public.pro_cv_verifiche enable row level security;
drop policy if exists pro_cv_verifiche_sel on public.pro_cv_verifiche;
create policy pro_cv_verifiche_sel on public.pro_cv_verifiche for select using (user_id = auth.uid());
revoke all on public.pro_cv_verifiche from anon, authenticated;
grant select on public.pro_cv_verifiche to authenticated;

create table if not exists public.pro_referenze (
  id uuid primary key default gen_random_uuid(),
  pro_id uuid not null references auth.users(id) on delete cascade,
  autore_id uuid not null references auth.users(id) on delete cascade,
  autore_nome text,
  autore_tipo text not null default 'proprietario',
  testo text check (testo is null or length(testo) <= 400),
  stato text not null default 'richiesta' check (stato in ('richiesta', 'da_approvare', 'pubblicata', 'nascosta')),
  created_at timestamptz not null default now(),
  scritta_il timestamptz,
  unique (pro_id, autore_id)
);
alter table public.pro_referenze enable row level security;
drop policy if exists pro_referenze_sel on public.pro_referenze;
create policy pro_referenze_sel on public.pro_referenze for select using (pro_id = auth.uid() or autore_id = auth.uid());
revoke all on public.pro_referenze from anon, authenticated;
grant select on public.pro_referenze to authenticated;

-- numeri Equo del professionista
create or replace function public.equo_numeri_pro(p_uid uuid) returns json
language sql stable security definer set search_path to 'public' as $fn$
  select json_build_object(
    'cavalli', (select count(*) from cavalli_clienti_mascalcia where maniscalco_id = p_uid and archiviato_il is null)
               + (select count(*) from trainer_cavalli where trainer_id = p_uid and archiviato_il is null),
    'interventi', (select count(*) from interventi_mascalcia where maniscalco_id = p_uid and stato = 'fatto'),
    'clienti', (select count(*) from clienti_mascalcia where maniscalco_id = p_uid and archiviato_il is null),
    'dal', (select extract(year from created_at)::int from profiles where id = p_uid),
    'discipline', (select coalesce(json_agg(d), '[]'::json) from (
        select disciplina d from cavalli_clienti_mascalcia where maniscalco_id = p_uid and archiviato_il is null and nullif(trim(disciplina), '') is not null
        group by disciplina order by count(*) desc limit 2) x))
$fn$;
revoke all on function public.equo_numeri_pro(uuid) from public, anon, authenticated;

-- tutto il CV del professionista per l'app
create or replace function public.equo_mio_cv() returns json
language plpgsql security definer set search_path to 'public' as $fn$
declare v_me uuid := auth.uid(); r pro_cv;
begin
  if v_me is null then return null; end if;
  select * into r from pro_cv where user_id = v_me;
  if r.user_id is null then
    insert into pro_cv (user_id) values (v_me) on conflict (user_id) do nothing;
    select * into r from pro_cv where user_id = v_me;
  end if;
  return json_build_object(
    'dati', r.dati, 'slug', r.slug, 'pubblica', r.pubblica, 'aggiornato_il', r.aggiornato_il,
    'premium', exists (select 1 from profiles where id = v_me and piano = 'premium'),
    'verifiche', (select coalesce(json_agg(voce_id), '[]'::json) from pro_cv_verifiche where user_id = v_me),
    'numeri', equo_numeri_pro(v_me),
    'referenze', (select coalesce(json_agg(json_build_object('id', id, 'autore', autore_nome, 'tipo', autore_tipo, 'testo', testo, 'stato', stato) order by created_at desc), '[]'::json)
                  from pro_referenze where pro_id = v_me));
end $fn$;
revoke all on function public.equo_mio_cv() from public, anon;
grant execute on function public.equo_mio_cv() to authenticated;

-- referenze: il professionista chiede (a un cliente proprietario collegato), il cliente scrive, il professionista pubblica o nasconde
create or replace function public.equo_chiedi_referenza(p_cliente uuid) returns json
language plpgsql security definer set search_path to 'public' as $fn$
declare v_me uuid := auth.uid(); c clienti_mascalcia; v_nome text;
begin
  select * into c from clienti_mascalcia where id = p_cliente and maniscalco_id = v_me;
  if c.id is null then return json_build_object('ok', false, 'motivo', 'cliente_non_trovato'); end if;
  if c.cliente_user_id is null then return json_build_object('ok', false, 'motivo', 'non_collegato'); end if;
  v_nome := coalesce(equo_nome_profilo(c.cliente_user_id), c.nome);
  insert into pro_referenze (pro_id, autore_id, autore_nome, autore_tipo, stato)
  values (v_me, c.cliente_user_id, v_nome, 'proprietario', 'richiesta')
  on conflict (pro_id, autore_id) do update set stato = case when pro_referenze.stato in ('pubblicata', 'da_approvare') then pro_referenze.stato else 'richiesta' end;
  insert into messaggi_mascalcia (maniscalco_id, cliente_mascalcia_id, mittente_tipo, mittente_user_id, tipo, testo, letto)
  values (v_me, c.id, 'maniscalco', v_me, 'testo', '⭐ Mi lasceresti una referenza per il mio Equo CV? Bastano due righe: la trovi nella Home di Equo.', false);
  return json_build_object('ok', true);
end $fn$;
revoke all on function public.equo_chiedi_referenza(uuid) from public, anon;
grant execute on function public.equo_chiedi_referenza(uuid) to authenticated;

create or replace function public.equo_referenze_da_scrivere() returns json
language sql stable security definer set search_path to 'public' as $fn$
  select coalesce(json_agg(json_build_object('id', r.id, 'pro', equo_nome_profilo(r.pro_id)) order by r.created_at), '[]'::json)
    from pro_referenze r where r.autore_id = auth.uid() and r.stato = 'richiesta'
$fn$;
revoke all on function public.equo_referenze_da_scrivere() from public, anon;
grant execute on function public.equo_referenze_da_scrivere() to authenticated;

create or replace function public.equo_scrivi_referenza(p_id uuid, p_testo text) returns json
language plpgsql security definer set search_path to 'public' as $fn$
declare v_t text := left(trim(coalesce(p_testo, '')), 400);
begin
  if length(v_t) < 5 then return json_build_object('ok', false, 'motivo', 'troppo_corta'); end if;
  update pro_referenze set testo = v_t, stato = 'da_approvare', scritta_il = now(),
         autore_nome = coalesce(equo_nome_profilo(auth.uid()), autore_nome)
   where id = p_id and autore_id = auth.uid() and stato in ('richiesta', 'da_approvare');
  if not found then return json_build_object('ok', false, 'motivo', 'non_trovata'); end if;
  return json_build_object('ok', true);
end $fn$;
revoke all on function public.equo_scrivi_referenza(uuid, text) from public, anon;
grant execute on function public.equo_scrivi_referenza(uuid, text) to authenticated;

create or replace function public.equo_referenza_stato(p_id uuid, p_stato text) returns json
language plpgsql security definer set search_path to 'public' as $fn$
begin
  if p_stato not in ('pubblicata', 'nascosta') then return json_build_object('ok', false); end if;
  update pro_referenze set stato = p_stato where id = p_id and pro_id = auth.uid() and testo is not null;
  return json_build_object('ok', found);
end $fn$;
revoke all on function public.equo_referenza_stato(uuid, text) from public, anon;
grant execute on function public.equo_referenza_stato(uuid, text) to authenticated;

-- pagina pubblica (solo con «pubblica» acceso e piano Premium): mai telefono, email, indirizzo e attestati
create or replace function public.equo_pro_pubblico(p_slug text) returns json
language plpgsql stable security definer set search_path to 'public' as $fn$
declare r pro_cv; p profiles; d jsonb; v_ruolo text; v_ver text[];
begin
  select * into r from pro_cv where slug = lower(trim(coalesce(p_slug, '')));
  if r.user_id is null or not r.pubblica then return null; end if;
  select * into p from profiles where id = r.user_id;
  if p.id is null or p.piano is distinct from 'premium' then return null; end if;
  d := r.dati;
  select array_agg(voce_id) into v_ver from pro_cv_verifiche where user_id = r.user_id;
  v_ruolo := case when 'maniscalco' in (p.ruolo, coalesce(p.ruolo_secondario, '')) then 'Maniscalco'
                  when 'veterinario' in (p.ruolo, coalesce(p.ruolo_secondario, '')) then 'Veterinario'
                  when 'istruttore' in (p.ruolo, coalesce(p.ruolo_secondario, '')) then 'Istruttore' else 'Professionista' end;
  return json_build_object(
    'nome', coalesce(nullif(trim(p.full_name), ''), p.dati_pagamento_nome), 'ruolo', v_ruolo, 'avatar', p.avatar_url,
    'certificato', p.certificazione_stato = 'verificato', 'codice', p.codice_professionista,
    'titolo', d->>'titolo', 'presentazione', d->>'presentazione', 'presentazione_en', d->>'presentazione_en',
    'zone', case when coalesce((d->>'mostra_zona')::boolean, true) then d->'zone' else '[]'::jsonb end,
    'trasferte', coalesce((d->>'trasferte')::boolean, false),
    'spec', d->'spec', 'lingue', d->'lingue',
    'social', json_build_object(
      'instagram', case when coalesce((d#>>'{contatti,instagram,m}')::boolean, false) then d#>>'{contatti,instagram,v}' end,
      'sito', case when coalesce((d#>>'{contatti,sito,m}')::boolean, false) then d#>>'{contatti,sito,v}' end),
    'formazione', (select coalesce(jsonb_agg(jsonb_build_object('titolo', x->>'titolo', 'ente', x->>'ente', 'anno', x->>'anno', 'verificato', (x->>'id') = any(coalesce(v_ver, '{}')))), '[]'::jsonb)
                    from jsonb_array_elements(coalesce(d->'formazione', '[]'::jsonb)) x),
    'esperienze', (select coalesce(jsonb_agg(jsonb_build_object('titolo', x->>'titolo', 'ruolo', x->>'ruolo', 'luogo', x->>'luogo', 'anno', x->>'anno', 'foto', x->'foto')), '[]'::jsonb)
                    from jsonb_array_elements(coalesce(d->'esperienze', '[]'::jsonb)) x),
    'numeri', equo_numeri_pro(r.user_id), 'mostra_numeri', coalesce(d->'numeri', '{}'::jsonb),
    'referenze', (select coalesce(json_agg(json_build_object('autore', autore_nome, 'tipo', autore_tipo, 'testo', testo) order by scritta_il desc), '[]'::json)
                   from pro_referenze where pro_id = r.user_id and stato = 'pubblicata'),
    'aggiornato_il', r.aggiornato_il, 'slug', r.slug);
end $fn$;
revoke all on function public.equo_pro_pubblico(text) from public, anon, authenticated;
grant execute on function public.equo_pro_pubblico(text) to service_role;

-- file del CV (privati): pro-cv/<id utente>/...
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('pro-cv', 'pro-cv', false, 8388608, array['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
on conflict (id) do nothing;
drop policy if exists pro_cv_file_ins on storage.objects;
create policy pro_cv_file_ins on storage.objects for insert to authenticated with check (bucket_id = 'pro-cv' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists pro_cv_file_sel on storage.objects;
create policy pro_cv_file_sel on storage.objects for select to authenticated using (bucket_id = 'pro-cv' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists pro_cv_file_del on storage.objects;
create policy pro_cv_file_del on storage.objects for delete to authenticated using (bucket_id = 'pro-cv' and (storage.foldername(name))[1] = auth.uid()::text);

-- controllo: atteso 3 | 7 | 1
select (select count(*) from information_schema.tables where table_name in ('pro_cv', 'pro_cv_verifiche', 'pro_referenze')) tabelle,
       (select count(*) from pg_proc where proname in ('equo_numeri_pro', 'equo_mio_cv', 'equo_chiedi_referenza', 'equo_referenze_da_scrivere', 'equo_scrivi_referenza', 'equo_referenza_stato', 'equo_pro_pubblico')) funzioni,
       (select count(*) from storage.buckets where id = 'pro-cv') spazio_file;
