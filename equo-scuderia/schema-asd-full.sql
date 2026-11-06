-- Equo: GESTIONE ASD FULL (6 novembre 2026) · SQL 45 · richiesta di Simone del 6/11
-- ADVANCE = Gestione ASD Basic (SQL 44): cassa separata, certificati medici, tesseramenti, gare, trasferte.
-- PREMIUM = Gestione ASD Full (questo SQL):
--  · dati dell'ASD (codice fiscale, sede, numero RASD, affiliazioni), quota associativa annuale e inizio dell'anno sociale;
--  · libro soci: numero progressivo, qualifica, ammissione e cessazione;
--  · quote annuali generate per tutti i soci attivi (addebiti della cassa ASD, chi non ha rinnovato si vede subito);
--  · ricevute numerate (R-anno-numero) per i pagamenti della cassa ASD;
--  · uscite dell'ASD e rendiconto semplificato dell'anno (entrate incassate per voce, uscite per categoria, avanzo);
--  · scadenzario (affiliazione, tesseramenti, rendiconto in assemblea, RASD, assicurazione…).
-- Il rendiconto è un aiuto: quello ufficiale lo approva l'assemblea con il commercialista.
-- Rieseguibile. Il controllo finale deve dare 3 · true · true · true.

-- 0 · PREMIUM ----------------------------------------------------------------------------------------------
do $$
declare v_def text;
begin
  v_def := pg_get_functiondef('public.centro_limiti'::regproc);
  if position('''asd_full''' in v_def) = 0 then
    v_def := replace(v_def, '''incassi_auto'', pk not in (''start'', ''advance''));',
      '''incassi_auto'', pk not in (''start'', ''advance''), ''asd_full'', pk not in (''start'', ''advance''));');
    execute v_def;
  end if;
end $$;
create or replace function public.equo_asd_full(p_centro uuid) returns boolean
language sql stable security definer set search_path to 'public' as $$
  select coalesce((centro_limiti(p_centro)->>'asd_full')::boolean, false)
$$;
revoke all on function public.equo_asd_full(uuid) from public, anon;
grant execute on function public.equo_asd_full(uuid) to authenticated, service_role;

-- 1 · dati dell'ASD ---------------------------------------------------------------------------------------------
alter table public.centri add column if not exists asd_cf text;
alter table public.centri add column if not exists asd_sede text;
alter table public.centri add column if not exists asd_rasd text;
alter table public.centri add column if not exists asd_affiliazioni text;
alter table public.centri add column if not exists asd_quota_annuale numeric(10,2);
alter table public.centri add column if not exists asd_mese_inizio int not null default 1;
do $$ begin
  alter table public.centri add constraint centri_asd_mese_chk check (asd_mese_inizio between 1 and 12);
exception when duplicate_object then null; end $$;

-- la quota associativa è un'origine degli addebiti
alter table public.scuderia_addebiti drop constraint if exists scuderia_addebiti_origine_check;
alter table public.scuderia_addebiti add constraint scuderia_addebiti_origine_check
  check (origine in ('manuale', 'pacchetto', 'retta', 'lezione', 'gara', 'tesseramento', 'trasferta', 'quota'));

-- ricevute dei pagamenti ASD
alter table public.scuderia_pagamenti add column if not exists ricevuta text;
create unique index if not exists scuderia_pagamenti_ricevuta_idx on public.scuderia_pagamenti (centro_id, ricevuta) where ricevuta is not null;

-- 2 · libro soci, uscite, scadenze ---------------------------------------------------------------------------------
create table if not exists public.scuderia_asd_soci (
  id uuid primary key default gen_random_uuid(),
  centro_id uuid not null references public.centri(id) on delete cascade,
  membro_id uuid not null references public.scuderia_membri(id) on delete cascade,
  numero int not null,
  qualifica text not null default 'ordinario' check (qualifica in ('ordinario', 'fondatore', 'onorario', 'atleta', 'dirigente', 'istruttore')),
  ammesso_il date not null default current_date,
  cessato_il date,
  motivo_cessazione text,
  note text,
  created_at timestamptz not null default now(),
  unique (centro_id, numero),
  unique (centro_id, membro_id)
);
create table if not exists public.scuderia_asd_uscite (
  id uuid primary key default gen_random_uuid(),
  centro_id uuid not null references public.centri(id) on delete cascade,
  data date not null default current_date,
  descrizione text not null,
  categoria text not null default 'altro' check (categoria in ('affiliazione', 'tesseramenti', 'gare', 'istruttori', 'impianti', 'attrezzature', 'assicurazione', 'utenze', 'altro')),
  importo numeric(10,2) not null check (importo > 0),
  metodo text not null default 'bonifico' check (metodo in ('contanti', 'bonifico', 'pos', 'assegno', 'altro')),
  note text,
  created_at timestamptz not null default now()
);
create table if not exists public.scuderia_asd_scadenze (
  id uuid primary key default gen_random_uuid(),
  centro_id uuid not null references public.centri(id) on delete cascade,
  titolo text not null,
  data date,
  fatto_il date,
  note text,
  created_at timestamptz not null default now()
);
create index if not exists asd_soci_centro_idx on public.scuderia_asd_soci (centro_id, numero);
create index if not exists asd_uscite_centro_idx on public.scuderia_asd_uscite (centro_id, data);
create index if not exists asd_scadenze_centro_idx on public.scuderia_asd_scadenze (centro_id, data);
do $$ declare t text;
begin
  foreach t in array array['scuderia_asd_soci', 'scuderia_asd_uscite', 'scuderia_asd_scadenze'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists asd_full_gestione on public.%I', t);
    execute format('create policy asd_full_gestione on public.%I for all using (puo_gestire_incassi(centro_id) and equo_asd_full(centro_id)) with check (puo_gestire_incassi(centro_id) and equo_asd_full(centro_id))', t);
  end loop;
end $$;

-- socio: stesso centro e numero progressivo automatico
create or replace function public.asd_soci_prima() returns trigger
language plpgsql security definer set search_path to 'public' as $$
begin
  if not exists (select 1 from scuderia_membri where id = new.membro_id and centro_id = new.centro_id) then raise exception 'CLIENTE_ALTRO_CENTRO'; end if;
  if tg_op = 'INSERT' and new.numero is null then
    perform pg_advisory_xact_lock(hashtext('asd_soci:' || new.centro_id));
    select coalesce(max(numero), 0) + 1 into new.numero from scuderia_asd_soci where centro_id = new.centro_id;
  end if;
  return new;
end $$;
revoke all on function public.asd_soci_prima() from public, anon, authenticated;
alter table public.scuderia_asd_soci alter column numero drop not null;
drop trigger if exists trg_asd_soci_prima on public.scuderia_asd_soci;
create trigger trg_asd_soci_prima before insert or update on public.scuderia_asd_soci for each row execute function public.asd_soci_prima();

-- 3 · funzioni -----------------------------------------------------------------------------------------------------
create or replace function public.asd_salva_dati(p_centro uuid, p_cf text, p_sede text, p_rasd text, p_affiliazioni text, p_quota numeric, p_mese int)
returns json language plpgsql security definer set search_path to 'public' as $$
begin
  if not puo_gestire_incassi(p_centro) then return json_build_object('ok', false, 'errore', 'Non autorizzato.'); end if;
  if not equo_asd_full(p_centro) then return json_build_object('ok', false, 'errore', 'La Gestione ASD Full è nel pacchetto PREMIUM.'); end if;
  update centri set asd_cf = nullif(upper(trim(p_cf)), ''), asd_sede = nullif(trim(p_sede), ''), asd_rasd = nullif(trim(p_rasd), ''),
         asd_affiliazioni = nullif(trim(p_affiliazioni), ''), asd_quota_annuale = nullif(p_quota, 0), asd_mese_inizio = coalesce(p_mese, 1)
   where id = p_centro;
  return json_build_object('ok', true);
end $$;

-- quote dell'anno sociale per tutti i soci attivi (una volta sola per socio e anno)
create or replace function public.asd_genera_quote(p_centro uuid, p_anno int)
returns json language plpgsql security definer set search_path to 'public' as $$
declare c record; s record; n int := 0; v_etichetta text; v_data date;
begin
  if not puo_gestire_incassi(p_centro) then return json_build_object('ok', false, 'errore', 'Non autorizzato.'); end if;
  if not equo_asd_full(p_centro) then return json_build_object('ok', false, 'errore', 'La Gestione ASD Full è nel pacchetto PREMIUM.'); end if;
  select * into c from centri where id = p_centro;
  if coalesce(c.asd_quota_annuale, 0) <= 0 then return json_build_object('ok', false, 'errore', 'Imposta prima la quota associativa annuale nei dati dell''ASD.'); end if;
  v_data := make_date(p_anno, c.asd_mese_inizio, 1);
  v_etichetta := case when c.asd_mese_inizio = 1 then p_anno::text else p_anno || '/' || (p_anno + 1) end;
  for s in select * from scuderia_asd_soci where centro_id = p_centro and (cessato_il is null or cessato_il >= v_data) and ammesso_il < (v_data + interval '1 year')::date loop
    insert into scuderia_addebiti (centro_id, membro_id, cassa, origine, chiave, descrizione, quantita, prezzo, data)
    values (p_centro, s.membro_id, 'asd', 'quota', 'quota:' || s.id || ':' || p_anno, 'Quota associativa ' || v_etichetta || ' · socio n. ' || s.numero, 1, c.asd_quota_annuale, v_data)
    on conflict (centro_id, chiave) do nothing;
    if found then n := n + 1; end if;
  end loop;
  return json_build_object('ok', true, 'quote', n, 'anno', v_etichetta);
end $$;

-- ricevuta di un pagamento della cassa ASD: numero progressivo per anno, dati per il PDF
create or replace function public.asd_ricevuta(p_pagamento uuid)
returns json language plpgsql security definer set search_path to 'public' as $$
declare p record; c record; m record; s record; v_pref text; v_n int; v_causale text;
begin
  select * into p from scuderia_pagamenti where id = p_pagamento;
  if p.id is null or not puo_gestire_incassi(p.centro_id) then return json_build_object('ok', false, 'errore', 'Non autorizzato.'); end if;
  if not equo_asd_full(p.centro_id) then return json_build_object('ok', false, 'errore', 'Le ricevute sono nella Gestione ASD Full (PREMIUM).'); end if;
  if p.cassa <> 'asd' then return json_build_object('ok', false, 'errore', 'Le ricevute si fanno per i pagamenti della cassa ASD.'); end if;
  if p.ricevuta is null then
    perform pg_advisory_xact_lock(hashtext('asd_ricevute:' || p.centro_id));
    v_pref := 'R-' || extract(year from p.data) || '-';
    select coalesce(max(substring(ricevuta from length(v_pref) + 1)::int), 0) + 1 into v_n from scuderia_pagamenti where centro_id = p.centro_id and ricevuta like v_pref || '%';
    update scuderia_pagamenti set ricevuta = v_pref || lpad(v_n::text, 3, '0') where id = p.id returning ricevuta into p.ricevuta;
  end if;
  select * into c from centri where id = p.centro_id;
  select * into m from scuderia_membri where id = p.membro_id;
  select * into s from scuderia_asd_soci where centro_id = p.centro_id and membro_id = p.membro_id;
  select coalesce((select d.descrizione from scuderia_addebiti d where d.id = p.addebito_id),
                  (select 'Conto n. ' || co.numero from scuderia_conti co where co.id = p.conto_id),
                  'Versamento') into v_causale;
  return json_build_object('ok', true, 'numero', p.ricevuta, 'data', p.data, 'importo', p.importo, 'metodo', p.metodo, 'causale', v_causale, 'note', p.note,
    'socio', m.nome_visualizzato, 'socio_numero', s.numero,
    'asd', json_build_object('nome', coalesce(c.asd_nome, 'ASD ' || c.nome), 'cf', c.asd_cf, 'sede', coalesce(c.asd_sede, concat_ws(' ', c.indirizzo, c.citta)), 'rasd', c.asd_rasd));
end $$;

-- scadenze tipiche dell'ASD (senza data: la mette la segreteria)
create or replace function public.asd_scadenze_tipiche(p_centro uuid)
returns json language plpgsql security definer set search_path to 'public' as $$
declare t text; n int := 0;
begin
  if not puo_gestire_incassi(p_centro) or not equo_asd_full(p_centro) then return json_build_object('ok', false, 'errore', 'Non autorizzato.'); end if;
  foreach t in array array['Rinnovo dell''affiliazione (federazione o ente di promozione)', 'Rinnovo dei tesseramenti dei soci',
    'Assemblea dei soci: approvazione del rendiconto', 'Aggiornamento dei dati sul Registro attività sportive (RASD)',
    'Rinnovo dell''assicurazione', 'Controllo dei certificati medici in scadenza'] loop
    if not exists (select 1 from scuderia_asd_scadenze where centro_id = p_centro and titolo = t and fatto_il is null) then
      insert into scuderia_asd_scadenze (centro_id, titolo) values (p_centro, t); n := n + 1;
    end if;
  end loop;
  return json_build_object('ok', true, 'aggiunte', n);
end $$;

-- tutto quello che serve alla Gestione ASD Full in una chiamata (anno solare del rendiconto)
create or replace function public.asd_full_dati(p_centro uuid, p_anno int)
returns json language plpgsql security definer set search_path to 'public' as $$
declare c record; v_da date := make_date(p_anno, 1, 1); v_a date := make_date(p_anno + 1, 1, 1); v_qa date;
begin
  if not puo_gestire_incassi(p_centro) then return json_build_object('errore', 'Non autorizzato'); end if;
  if not equo_asd_full(p_centro) then return json_build_object('errore', 'premium'); end if;
  select * into c from centri where id = p_centro;
  v_qa := make_date(case when extract(month from current_date) >= c.asd_mese_inizio then extract(year from current_date)::int else extract(year from current_date)::int - 1 end, c.asd_mese_inizio, 1);
  create temp table if not exists _asd_z (addebito_id uuid, membro_id uuid, cassa text, importo numeric, pagato numeric, residuo numeric) on commit drop;
  truncate _asd_z;
  insert into _asd_z select * from equo_incassi_residui(p_centro) where cassa = 'asd';
  return json_build_object(
    'dati', json_build_object('nome', coalesce(c.asd_nome, 'ASD ' || c.nome), 'cf', c.asd_cf, 'sede', c.asd_sede, 'rasd', c.asd_rasd,
       'affiliazioni', c.asd_affiliazioni, 'quota', c.asd_quota_annuale, 'mese_inizio', c.asd_mese_inizio, 'anno_sociale', extract(year from v_qa)),
    'soci', coalesce((select json_agg(json_build_object('id', s.id, 'membro_id', s.membro_id, 'nome', m.nome_visualizzato, 'numero', s.numero, 'qualifica', s.qualifica,
        'ammesso_il', s.ammesso_il, 'cessato_il', s.cessato_il, 'motivo', s.motivo_cessazione,
        'quota', (select json_build_object('importo', z.importo, 'pagato', z.pagato) from scuderia_addebiti d join _asd_z z on z.addebito_id = d.id
                   where d.centro_id = p_centro and d.chiave = 'quota:' || s.id || ':' || extract(year from v_qa)),
        'certificato', (select max(scadenza) from scuderia_certificati where centro_id = p_centro and membro_id = s.membro_id)) order by s.numero)
      from scuderia_asd_soci s join scuderia_membri m on m.id = s.membro_id where s.centro_id = p_centro), '[]'::json),
    'uscite', coalesce((select json_agg(row_to_json(u) order by u.data desc) from scuderia_asd_uscite u where u.centro_id = p_centro and u.data >= v_da and u.data < v_a), '[]'::json),
    'scadenze', coalesce((select json_agg(row_to_json(x) order by x.fatto_il nulls first, x.data nulls first) from scuderia_asd_scadenze x where x.centro_id = p_centro and (x.fatto_il is null or x.fatto_il >= current_date - 90)), '[]'::json),
    'rendiconto', json_build_object('anno', p_anno,
      'entrate', coalesce((select json_object_agg(o.origine, o.tot) from (select d.origine, sum(z.pagato) tot from scuderia_addebiti d join _asd_z z on z.addebito_id = d.id
          where d.centro_id = p_centro and d.data >= v_da and d.data < v_a group by d.origine having sum(z.pagato) > 0) o), '{}'::json),
      'da_incassare', (select coalesce(sum(z.residuo), 0) from scuderia_addebiti d join _asd_z z on z.addebito_id = d.id where d.centro_id = p_centro and d.data >= v_da and d.data < v_a),
      'incassato_cassa', (select coalesce(sum(importo), 0) from scuderia_pagamenti where centro_id = p_centro and cassa = 'asd' and data >= v_da and data < v_a),
      'uscite', coalesce((select json_object_agg(x.categoria, x.tot) from (
          select categoria, sum(importo) tot from scuderia_asd_uscite where centro_id = p_centro and data >= v_da and data < v_a group by categoria
          union all
          select 'trasferte', sum(s.importo) from scuderia_gare_spese s join scuderia_gare g on g.id = s.gara_id where g.centro_id = p_centro and g.data_inizio >= v_da and g.data_inizio < v_a having sum(s.importo) > 0) x), '{}'::json))
  );
end $$;

do $$ declare f text;
begin
  foreach f in array array['asd_salva_dati(uuid, text, text, text, text, numeric, int)', 'asd_genera_quote(uuid, int)', 'asd_ricevuta(uuid)',
    'asd_scadenze_tipiche(uuid)', 'asd_full_dati(uuid, int)'] loop
    execute 'revoke all on function public.' || f || ' from public, anon';
    execute 'grant execute on function public.' || f || ' to authenticated, service_role';
  end loop;
end $$;

-- i pagamenti con la ricevuta non si cancellano (si annullano con un movimento contrario, d'accordo col commercialista)
create or replace function public.incassi_elimina_pagamento(p_id uuid)
returns json language plpgsql security definer set search_path to 'public' as $$
declare p record;
begin
  select * into p from scuderia_pagamenti where id = p_id;
  if p.id is null or not puo_gestire_incassi(p.centro_id) then return json_build_object('ok', false, 'errore', 'Non autorizzato.'); end if;
  if p.ricevuta is not null then return json_build_object('ok', false, 'errore', 'Questo pagamento ha la ricevuta ' || p.ricevuta || ': non si può cancellare.'); end if;
  delete from scuderia_pagamenti where id = p_id;
  return json_build_object('ok', true);
end $$;

-- nella lista dei pagamenti anche il numero di ricevuta
do $$
declare v_def text;
begin
  v_def := pg_get_functiondef('public.incassi_dati'::regproc);
  if position('''ricevuta''' in v_def) = 0 then
    v_def := replace(v_def, '''metodo'', p.metodo, ''note'', p.note,', '''metodo'', p.metodo, ''note'', p.note, ''ricevuta'', p.ricevuta,');
    execute v_def;
  end if;
end $$;

-- controllo finale: deve dare 3 · true · true · true
select (select count(*) from pg_tables where schemaname = 'public' and tablename in ('scuderia_asd_soci', 'scuderia_asd_uscite', 'scuderia_asd_scadenze')) as tabelle,
       position('''asd_full''' in pg_get_functiondef('public.centro_limiti'::regproc)) > 0 as premium,
       position('''ricevuta''' in pg_get_functiondef('public.incassi_dati'::regproc)) > 0 as ricevute_in_lista,
       exists (select 1 from pg_proc where proname = 'asd_full_dati') as dati_full;
