-- Equo: INCASSI DELLA SCUDERIA E DELL'ASD (6 novembre 2026) · SQL 44 · richiesta di Simone del 6/11
-- Un solo meccanismo: tutto ciò che va pagato è un ADDEBITO intestato a un cliente (chi paga: per un minore il
-- genitore/referente dell'anagrafica), con il cavallo se c'entra. I PAGAMENTI (anche parziali) si registrano
-- contro un addebito, un conto o in acconto: si scalano dal più vecchio. Il CONTO del mese raccoglie gli addebiti.
--  · due casse: «scuderia» e «asd» (se il centro ha anche un'ASD): riepilogo e numerazione separati;
--  · addebiti automatici: pacchetti venduti, rette mensili dei cavalli, lezioni singole (se la scuderia lo sceglie),
--    tesseramenti, iscrizioni alle gare, spese di trasferta ripartite sugli iscritti;
--  · chi gestisce: amministratore e livello 3 con il permesso «incassi»; il cliente vede solo i conti inviati;
--  · pacchetto commerciale: ADVANCE e PREMIUM (START no, come i Pacchetti); PREMIUM anche sollecito automatico.
-- Il conto è un riepilogo, NON una fattura né una ricevuta fiscale.
-- Rieseguibile. Il controllo finale deve dare 9 · true · true · true.

-- 0 · chi può gestire gli incassi -----------------------------------------------------------------------
create or replace function public.puo_gestire_incassi(p_centro uuid) returns boolean
language sql stable security definer set search_path to 'public' as $$
  select auth.uid() is not null and exists (select 1 from scuderia_membri m
    where m.centro_id = p_centro and m.user_id = auth.uid()
      and (m.ruolo = 'admin' or m.livello = 'admin' or (m.livello = '3' and coalesce((m.permessi->>'incassi')::boolean, false))))
$$;
revoke all on function public.puo_gestire_incassi(uuid) from public, anon;
grant execute on function public.puo_gestire_incassi(uuid) to authenticated, service_role;

-- chi paga: per i clienti con un referente (minori) paga il referente
create or replace function public.equo_pagante(p_membro uuid) returns uuid
language sql stable security definer set search_path to 'public' as $$
  select coalesce((select d.referente_id from scuderia_clienti_dati d where d.membro_id = p_membro), p_membro)
$$;
revoke all on function public.equo_pagante(uuid) from public, anon, authenticated;

create or replace function public.equo_euro(p numeric) returns text
language sql immutable as $$ select replace(to_char(coalesce(p, 0), 'FM999999990.00'), '.', ',') || ' €' $$;

-- 1 · impostazioni del centro e retta dei cavalli ----------------------------------------------------------
alter table public.centri add column if not exists asd_attiva boolean not null default false;
alter table public.centri add column if not exists asd_nome text;
alter table public.centri add column if not exists lezioni_addebito text not null default 'nessuno';
alter table public.centri add column if not exists cassa_lezioni text not null default 'scuderia';
do $$ begin
  alter table public.centri add constraint centri_lezioni_addebito_chk check (lezioni_addebito in ('nessuno', 'conto', 'subito'));
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.centri add constraint centri_cassa_lezioni_chk check (cassa_lezioni in ('scuderia', 'asd'));
exception when duplicate_object then null; end $$;

alter table public.scuderia_cavalli add column if not exists retta numeric(10,2);
alter table public.scuderia_cavalli add column if not exists retta_intestatario_id uuid references public.scuderia_membri(id) on delete set null;

-- 2 · listino --------------------------------------------------------------------------------------------
create table if not exists public.scuderia_listino (
  id uuid primary key default gen_random_uuid(),
  centro_id uuid not null references public.centri(id) on delete cascade,
  nome text not null check (length(trim(nome)) between 1 and 80),
  categoria text not null default 'servizio' check (categoria in ('pensione', 'lezione', 'servizio', 'asd')),
  prezzo numeric(10,2) not null default 0 check (prezzo >= 0),
  unita text,
  cassa text not null default 'scuderia' check (cassa in ('scuderia', 'asd')),
  attivo boolean not null default true,
  ordine int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists scuderia_listino_centro_idx on public.scuderia_listino (centro_id, categoria, ordine);
alter table public.scuderia_listino enable row level security;
drop policy if exists listino_leggi on public.scuderia_listino;
create policy listino_leggi on public.scuderia_listino for select using (is_member_of_centro(centro_id));
drop policy if exists listino_scrivi on public.scuderia_listino;
create policy listino_scrivi on public.scuderia_listino for all using (puo_gestire_incassi(centro_id)) with check (puo_gestire_incassi(centro_id));

-- 3 · conti, addebiti, pagamenti ----------------------------------------------------------------------------
create table if not exists public.scuderia_conti (
  id uuid primary key default gen_random_uuid(),
  centro_id uuid not null references public.centri(id) on delete cascade,
  membro_id uuid not null references public.scuderia_membri(id) on delete cascade,
  cassa text not null default 'scuderia' check (cassa in ('scuderia', 'asd')),
  mese date not null,
  numero text not null,
  stato text not null default 'bozza' check (stato in ('bozza', 'inviato')),
  inviato_il timestamptz,
  note text,
  created_at timestamptz not null default now(),
  unique (centro_id, membro_id, cassa, mese),
  unique (centro_id, numero)
);
alter table public.scuderia_conti enable row level security;
drop policy if exists conti_leggi on public.scuderia_conti;
create policy conti_leggi on public.scuderia_conti for select using (puo_gestire_incassi(centro_id));

create table if not exists public.scuderia_addebiti (
  id uuid primary key default gen_random_uuid(),
  centro_id uuid not null references public.centri(id) on delete cascade,
  membro_id uuid not null references public.scuderia_membri(id) on delete cascade,      -- chi paga
  beneficiario_id uuid references public.scuderia_membri(id) on delete set null,       -- per chi (es. il figlio)
  cassa text not null default 'scuderia' check (cassa in ('scuderia', 'asd')),
  cavallo_id uuid references public.scuderia_cavalli(id) on delete set null,
  conto_id uuid references public.scuderia_conti(id) on delete set null,
  origine text not null default 'manuale' check (origine in ('manuale', 'pacchetto', 'retta', 'lezione', 'gara', 'tesseramento', 'trasferta')),
  chiave text,                                   -- per gli addebiti automatici: mai due volte lo stesso
  descrizione text not null,
  quantita numeric(10,2) not null default 1,
  prezzo numeric(10,2) not null default 0,
  importo numeric(10,2) not null default 0,
  data date not null default current_date,
  creato_da uuid default auth.uid(),
  created_at timestamptz not null default now(),
  unique (centro_id, chiave)
);
create index if not exists scuderia_addebiti_membro_idx on public.scuderia_addebiti (centro_id, membro_id, cassa, data);
create index if not exists scuderia_addebiti_conto_idx on public.scuderia_addebiti (conto_id);
alter table public.scuderia_addebiti enable row level security;
drop policy if exists addebiti_leggi on public.scuderia_addebiti;
create policy addebiti_leggi on public.scuderia_addebiti for select using (puo_gestire_incassi(centro_id));

create table if not exists public.scuderia_pagamenti (
  id uuid primary key default gen_random_uuid(),
  centro_id uuid not null references public.centri(id) on delete cascade,
  membro_id uuid not null references public.scuderia_membri(id) on delete cascade,
  cassa text not null default 'scuderia' check (cassa in ('scuderia', 'asd')),
  data date not null default current_date,
  importo numeric(10,2) not null check (importo > 0),
  metodo text not null default 'contanti' check (metodo in ('contanti', 'bonifico', 'pos', 'assegno', 'altro')),
  addebito_id uuid references public.scuderia_addebiti(id) on delete set null,
  conto_id uuid references public.scuderia_conti(id) on delete set null,
  note text,
  registrato_da uuid default auth.uid(),
  created_at timestamptz not null default now()
);
create index if not exists scuderia_pagamenti_membro_idx on public.scuderia_pagamenti (centro_id, membro_id, cassa, data);
alter table public.scuderia_pagamenti enable row level security;
drop policy if exists pagamenti_leggi on public.scuderia_pagamenti;
create policy pagamenti_leggi on public.scuderia_pagamenti for select using (puo_gestire_incassi(centro_id));

-- addebito: chi paga (referente per i minori) e importo = quantità × prezzo
create or replace function public.addebiti_prima() returns trigger
language plpgsql security definer set search_path to 'public' as $$
begin
  if tg_op = 'INSERT' or new.beneficiario_id is distinct from old.beneficiario_id or new.membro_id is distinct from old.membro_id then
    new.beneficiario_id := coalesce(new.beneficiario_id, new.membro_id);
    new.membro_id := equo_pagante(new.beneficiario_id);
  end if;
  if not exists (select 1 from scuderia_membri where id = new.membro_id and centro_id = new.centro_id) then
    raise exception 'CLIENTE_ALTRO_CENTRO';
  end if;
  new.quantita := coalesce(new.quantita, 1);
  new.prezzo := coalesce(new.prezzo, 0);
  new.importo := round(new.quantita * new.prezzo, 2);
  return new;
end $$;
drop trigger if exists trg_addebiti_prima on public.scuderia_addebiti;
create trigger trg_addebiti_prima before insert or update on public.scuderia_addebiti
  for each row execute function public.addebiti_prima();

-- 4 · quanto è pagato di ogni addebito ---------------------------------------------------------------------
-- prima i pagamenti legati all'addebito, poi quelli legati al conto (sulle sue righe, dalla più vecchia),
-- poi gli acconti liberi (sugli addebiti dello stesso cliente e cassa, dal più vecchio). Quello che avanza è credito.
create or replace function public.equo_incassi_residui(p_centro uuid)
returns table (addebito_id uuid, membro_id uuid, cassa text, importo numeric, pagato numeric, residuo numeric)
language plpgsql security definer set search_path to 'public' as $$
#variable_conflict use_column
declare p record; a record; v_res numeric; v_q numeric;
begin
  create temp table if not exists _inc_res (id uuid primary key, membro uuid, cassa text, conto uuid, data date, creato timestamptz, importo numeric, pagato numeric) on commit drop;
  create temp table if not exists _inc_pool (membro uuid, cassa text, resto numeric) on commit drop;
  truncate _inc_res; truncate _inc_pool;
  insert into _inc_res select d.id, d.membro_id, d.cassa, d.conto_id, d.data, d.created_at, d.importo, 0 from scuderia_addebiti d where d.centro_id = p_centro;
  for p in select x.* from scuderia_pagamenti x where x.centro_id = p_centro order by x.data, x.created_at loop
    v_res := p.importo;
    if p.addebito_id is not null then
      select r.importo - r.pagato into v_q from _inc_res r where r.id = p.addebito_id;
      v_q := least(coalesce(v_q, 0), v_res);
      if v_q > 0 then update _inc_res set pagato = pagato + v_q where id = p.addebito_id; v_res := v_res - v_q; end if;
    elsif p.conto_id is not null then
      for a in select r.id, r.importo - r.pagato as aperto from _inc_res r where r.conto = p.conto_id and r.importo > r.pagato order by r.data, r.creato loop
        exit when v_res <= 0;
        v_q := least(a.aperto, v_res);
        update _inc_res set pagato = pagato + v_q where id = a.id; v_res := v_res - v_q;
      end loop;
    end if;
    if v_res > 0 then insert into _inc_pool values (p.membro_id, p.cassa, v_res); end if;
  end loop;
  for p in select x.membro, x.cassa, sum(x.resto) as resto from _inc_pool x group by 1, 2 loop
    v_res := p.resto;
    for a in select r.id, r.importo - r.pagato as aperto from _inc_res r where r.membro = p.membro and r.cassa = p.cassa and r.importo > r.pagato order by r.data, r.creato loop
      exit when v_res <= 0;
      v_q := least(a.aperto, v_res);
      update _inc_res set pagato = pagato + v_q where id = a.id; v_res := v_res - v_q;
    end loop;
    if v_res > 0 then
      addebito_id := null; membro_id := p.membro; cassa := p.cassa; importo := 0; pagato := v_res; residuo := -v_res;
      return next;   -- credito del cliente
    end if;
  end loop;
  return query select r.id, r.membro, r.cassa, r.importo, r.pagato, r.importo - r.pagato from _inc_res r;
end $$;
revoke all on function public.equo_incassi_residui(uuid) from public, anon, authenticated;

-- 5 · addebiti automatici ---------------------------------------------------------------------------------
-- pacchetti venduti
create or replace function public.pacchetti_addebito() returns trigger
language plpgsql security definer set search_path to 'public' as $$
declare v_cassa text;
begin
  if tg_op = 'DELETE' then
    delete from scuderia_addebiti where centro_id = old.centro_id and chiave = 'pacchetto:' || old.id;
    return old;
  end if;
  if coalesce(new.prezzo, 0) <= 0 or new.membro_id is null then
    delete from scuderia_addebiti where centro_id = new.centro_id and chiave = 'pacchetto:' || new.id;
    return new;
  end if;
  select cassa_lezioni into v_cassa from centri where id = new.centro_id;
  insert into scuderia_addebiti (centro_id, membro_id, cassa, cavallo_id, origine, chiave, descrizione, quantita, prezzo, data)
  values (new.centro_id, new.membro_id, coalesce(v_cassa, 'scuderia'), new.cavallo_id, 'pacchetto', 'pacchetto:' || new.id,
    case new.tipo when 'carnet' then 'Carnet' || coalesce(' ' || new.unita_totali || ' lezioni', '')
                  when 'abbonamento' then 'Abbonamento' when 'pensione' then 'Pacchetto pensione' else 'Pacchetto' end,
    1, new.prezzo, coalesce(new.data_inizio, current_date))
  on conflict (centro_id, chiave) do update set membro_id = excluded.membro_id, beneficiario_id = excluded.beneficiario_id,
    cavallo_id = excluded.cavallo_id, descrizione = excluded.descrizione, prezzo = excluded.prezzo, data = excluded.data;
  return new;
end $$;
drop trigger if exists trg_pacchetti_addebito on public.scuderia_pacchetti;
create trigger trg_pacchetti_addebito after insert or update of prezzo, membro_id, tipo, unita_totali, data_inizio, cavallo_id or delete
  on public.scuderia_pacchetti for each row execute function public.pacchetti_addebito();

-- lezioni singole (fuori dal carnet), se la scuderia lo ha scelto: alla lezione completata
create or replace function public.lezioni_addebito() returns trigger
language plpgsql security definer set search_path to 'public' as $$
declare c record; l record; v_ok boolean;
begin
  if tg_op = 'DELETE' then
    delete from scuderia_addebiti where centro_id = old.centro_id and chiave = 'lezione:' || old.id;
    return old;
  end if;
  v_ok := new.stato = 'completata' and new.pacchetto_id is null and new.allievo_id is not null;
  if not v_ok then
    delete from scuderia_addebiti where centro_id = new.centro_id and chiave = 'lezione:' || new.id;
    return new;
  end if;
  select lezioni_addebito, cassa_lezioni into c from centri where id = new.centro_id;
  if coalesce(c.lezioni_addebito, 'nessuno') = 'nessuno' then return new; end if;
  select id, nome, prezzo into l from scuderia_listino where centro_id = new.centro_id and categoria = 'lezione' and attivo order by ordine, nome limit 1;
  if l.id is null or l.prezzo <= 0 then return new; end if;
  insert into scuderia_addebiti (centro_id, membro_id, cassa, cavallo_id, origine, chiave, descrizione, quantita, prezzo, data)
  values (new.centro_id, new.allievo_id, coalesce(c.cassa_lezioni, 'scuderia'), new.cavallo_id, 'lezione', 'lezione:' || new.id,
    l.nome || ' del ' || to_char(new.data, 'DD/MM'), 1, l.prezzo, new.data)
  on conflict (centro_id, chiave) do nothing;
  return new;
end $$;
drop trigger if exists trg_lezioni_addebito on public.scuderia_lezioni;
create trigger trg_lezioni_addebito after insert or update of stato, pacchetto_id, allievo_id or delete
  on public.scuderia_lezioni for each row execute function public.lezioni_addebito();

-- 6 · ASD: tesseramenti, certificati medici, gare e trasferte -----------------------------------------------
create table if not exists public.scuderia_tesseramenti (
  id uuid primary key default gen_random_uuid(),
  centro_id uuid not null references public.centri(id) on delete cascade,
  membro_id uuid not null references public.scuderia_membri(id) on delete cascade,
  ente text not null default 'FISE',
  tipo text,
  numero text,
  data_inizio date default current_date,
  scadenza date,
  quota numeric(10,2) not null default 0,
  note text,
  created_at timestamptz not null default now()
);
create table if not exists public.scuderia_certificati (
  id uuid primary key default gen_random_uuid(),
  centro_id uuid not null references public.centri(id) on delete cascade,
  membro_id uuid not null references public.scuderia_membri(id) on delete cascade,
  tipo text not null default 'non_agonistico' check (tipo in ('agonistico', 'non_agonistico')),
  rilasciato_il date,
  scadenza date not null,
  medico text,
  note text,
  created_at timestamptz not null default now()
);
create table if not exists public.scuderia_gare (
  id uuid primary key default gen_random_uuid(),
  centro_id uuid not null references public.centri(id) on delete cascade,
  nome text not null,
  luogo text,
  data_inizio date not null,
  data_fine date,
  quota_default numeric(10,2) not null default 0,
  box_default numeric(10,2) not null default 0,
  note text,
  created_at timestamptz not null default now()
);
create table if not exists public.scuderia_gare_iscritti (
  id uuid primary key default gen_random_uuid(),
  gara_id uuid not null references public.scuderia_gare(id) on delete cascade,
  centro_id uuid not null references public.centri(id) on delete cascade,
  membro_id uuid not null references public.scuderia_membri(id) on delete cascade,
  cavallo_id uuid references public.scuderia_cavalli(id) on delete set null,
  categoria text,
  quota numeric(10,2) not null default 0,
  box numeric(10,2) not null default 0,
  note text,
  created_at timestamptz not null default now()
);
create table if not exists public.scuderia_gare_spese (
  id uuid primary key default gen_random_uuid(),
  gara_id uuid not null references public.scuderia_gare(id) on delete cascade,
  centro_id uuid not null references public.centri(id) on delete cascade,
  descrizione text not null,
  importo numeric(10,2) not null check (importo >= 0),
  created_at timestamptz not null default now()
);
create index if not exists scuderia_tess_centro_idx on public.scuderia_tesseramenti (centro_id, scadenza);
create index if not exists scuderia_cert_centro_idx on public.scuderia_certificati (centro_id, scadenza);
create index if not exists scuderia_gare_centro_idx on public.scuderia_gare (centro_id, data_inizio);
create index if not exists scuderia_gare_iscr_idx on public.scuderia_gare_iscritti (gara_id);
create index if not exists scuderia_gare_spese_idx on public.scuderia_gare_spese (gara_id);
do $$ declare t text;
begin
  foreach t in array array['scuderia_tesseramenti', 'scuderia_certificati', 'scuderia_gare', 'scuderia_gare_iscritti', 'scuderia_gare_spese'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists asd_gestione on public.%I', t);
    execute format('create policy asd_gestione on public.%I for all using (puo_gestire_incassi(centro_id)) with check (puo_gestire_incassi(centro_id))', t);
  end loop;
end $$;

-- coerenza: cliente, cavallo e gara dello stesso centro
create or replace function public.asd_controlla() returns trigger
language plpgsql set search_path to 'public' as $$
begin
  if not exists (select 1 from scuderia_membri where id = new.membro_id and centro_id = new.centro_id) then raise exception 'CLIENTE_ALTRO_CENTRO'; end if;
  if tg_table_name = 'scuderia_gare_iscritti' then
    if not exists (select 1 from scuderia_gare where id = new.gara_id and centro_id = new.centro_id) then raise exception 'GARA_ALTRO_CENTRO'; end if;
    if new.cavallo_id is not null and not exists (select 1 from scuderia_cavalli where id = new.cavallo_id and centro_id = new.centro_id) then raise exception 'CAVALLO_ALTRO_CENTRO'; end if;
  end if;
  return new;
end $$;
drop trigger if exists trg_tess_controlla on public.scuderia_tesseramenti;
create trigger trg_tess_controlla before insert or update on public.scuderia_tesseramenti for each row execute function public.asd_controlla();
drop trigger if exists trg_cert_controlla on public.scuderia_certificati;
create trigger trg_cert_controlla before insert or update on public.scuderia_certificati for each row execute function public.asd_controlla();
drop trigger if exists trg_iscr_controlla on public.scuderia_gare_iscritti;
create trigger trg_iscr_controlla before insert or update on public.scuderia_gare_iscritti for each row execute function public.asd_controlla();

-- quota del tesseramento → addebito ASD
create or replace function public.tesseramenti_addebito() returns trigger
language plpgsql security definer set search_path to 'public' as $$
begin
  if tg_op = 'DELETE' or coalesce(new.quota, 0) <= 0 then
    delete from scuderia_addebiti where centro_id = coalesce(new.centro_id, old.centro_id) and chiave = 'tesseramento:' || coalesce(new.id, old.id);
    return coalesce(new, old);
  end if;
  insert into scuderia_addebiti (centro_id, membro_id, cassa, origine, chiave, descrizione, quantita, prezzo, data)
  values (new.centro_id, new.membro_id, 'asd', 'tesseramento', 'tesseramento:' || new.id,
    'Tesseramento ' || new.ente || coalesce(' · ' || nullif(trim(new.tipo), ''), '') || coalesce(' ' || to_char(new.data_inizio, 'YYYY'), ''), 1, new.quota, coalesce(new.data_inizio, current_date))
  on conflict (centro_id, chiave) do update set membro_id = excluded.membro_id, beneficiario_id = excluded.beneficiario_id,
    descrizione = excluded.descrizione, prezzo = excluded.prezzo, data = excluded.data;
  return new;
end $$;
drop trigger if exists trg_tess_addebito on public.scuderia_tesseramenti;
create trigger trg_tess_addebito after insert or update or delete on public.scuderia_tesseramenti for each row execute function public.tesseramenti_addebito();

-- iscrizione alla gara (quota + box) → addebito ASD
create or replace function public.gare_iscritti_addebito() returns trigger
language plpgsql security definer set search_path to 'public' as $$
declare g record; v_cav text;
begin
  if tg_op = 'DELETE' or coalesce(new.quota, 0) + coalesce(new.box, 0) <= 0 then
    delete from scuderia_addebiti where centro_id = coalesce(new.centro_id, old.centro_id) and chiave = 'gara:' || coalesce(new.id, old.id);
    perform equo_gara_ripartisci(coalesce(new.gara_id, old.gara_id));   -- cambiano le persone: si ridivide la trasferta
    return coalesce(new, old);
  end if;
  select nome, data_inizio into g from scuderia_gare where id = new.gara_id;
  select nome into v_cav from scuderia_cavalli where id = new.cavallo_id;
  insert into scuderia_addebiti (centro_id, membro_id, cassa, cavallo_id, origine, chiave, descrizione, quantita, prezzo, data)
  values (new.centro_id, new.membro_id, 'asd', new.cavallo_id, 'gara', 'gara:' || new.id,
    'Gara ' || g.nome || coalesce(' · ' || v_cav, '') || case when coalesce(new.box, 0) > 0 then ' (iscrizione ' || equo_euro(new.quota) || ' + box ' || equo_euro(new.box) || ')' else '' end,
    1, coalesce(new.quota, 0) + coalesce(new.box, 0), g.data_inizio)
  on conflict (centro_id, chiave) do update set membro_id = excluded.membro_id, beneficiario_id = excluded.beneficiario_id,
    cavallo_id = excluded.cavallo_id, descrizione = excluded.descrizione, prezzo = excluded.prezzo, data = excluded.data;
  perform equo_gara_ripartisci(new.gara_id);
  return new;
end $$;

-- spese di trasferta divise in parti uguali fra i cavalieri iscritti (una quota per persona, anche con più cavalli);
-- si ricalcola da sola a ogni spesa o iscritto aggiunto/tolto
create or replace function public.equo_gara_ripartisci(p_gara uuid)
returns json language plpgsql security definer set search_path to 'public' as $$
declare g record; v_tot numeric; v_n int; v_quota numeric; m record; v_chiavi text[] := '{}';
begin
  select * into g from scuderia_gare where id = p_gara;
  if g.id is null then return json_build_object('ok', false, 'errore', 'Gara non trovata.'); end if;
  select coalesce(sum(importo), 0) into v_tot from scuderia_gare_spese where gara_id = p_gara;
  select count(distinct membro_id) into v_n from scuderia_gare_iscritti where gara_id = p_gara;
  if v_tot > 0 and v_n > 0 then
    v_quota := round(v_tot / v_n, 2);
    for m in select distinct membro_id from scuderia_gare_iscritti where gara_id = p_gara loop
      v_chiavi := v_chiavi || ('trasferta:' || p_gara || ':' || m.membro_id);
      insert into scuderia_addebiti (centro_id, membro_id, cassa, origine, chiave, descrizione, quantita, prezzo, data)
      values (g.centro_id, m.membro_id, 'asd', 'trasferta', 'trasferta:' || p_gara || ':' || m.membro_id,
        'Trasferta ' || g.nome || ' (' || equo_euro(v_tot) || ' diviso ' || v_n || ')', 1, v_quota, g.data_inizio)
      on conflict (centro_id, chiave) do update set descrizione = excluded.descrizione, prezzo = excluded.prezzo, data = excluded.data;
    end loop;
  end if;
  delete from scuderia_addebiti where centro_id = g.centro_id and chiave like 'trasferta:' || p_gara || ':%' and not (chiave = any(v_chiavi));
  return json_build_object('ok', true, 'totale', v_tot, 'persone', v_n, 'quota', coalesce(v_quota, 0));
end $$;
revoke all on function public.equo_gara_ripartisci(uuid) from public, anon, authenticated;

-- spese di trasferta: stessa gara e stesso centro; ogni modifica ridivide la trasferta
create or replace function public.gare_spese_dopo() returns trigger
language plpgsql security definer set search_path to 'public' as $$
begin
  if tg_op <> 'DELETE' and not exists (select 1 from scuderia_gare where id = new.gara_id and centro_id = new.centro_id) then raise exception 'GARA_ALTRO_CENTRO'; end if;
  perform equo_gara_ripartisci(coalesce(new.gara_id, old.gara_id));
  return coalesce(new, old);
end $$;
revoke all on function public.gare_spese_dopo() from public, anon, authenticated;
drop trigger if exists trg_spese_dopo on public.scuderia_gare_spese;
create trigger trg_spese_dopo after insert or update or delete on public.scuderia_gare_spese for each row execute function public.gare_spese_dopo();

drop trigger if exists trg_iscr_addebito on public.scuderia_gare_iscritti;
create trigger trg_iscr_addebito after insert or update or delete on public.scuderia_gare_iscritti for each row execute function public.gare_iscritti_addebito();

-- 7 · funzioni del gestionale ---------------------------------------------------------------------------------
create or replace function public.incassi_impostazioni(p_centro uuid, p_asd_attiva boolean, p_asd_nome text, p_lezioni_addebito text, p_cassa_lezioni text)
returns json language plpgsql security definer set search_path to 'public' as $$
begin
  if not puo_gestire_incassi(p_centro) then return json_build_object('ok', false, 'errore', 'Non autorizzato.'); end if;
  update centri set asd_attiva = coalesce(p_asd_attiva, false), asd_nome = nullif(trim(p_asd_nome), ''),
         lezioni_addebito = coalesce(p_lezioni_addebito, 'nessuno'),
         cassa_lezioni = case when coalesce(p_asd_attiva, false) then coalesce(p_cassa_lezioni, 'scuderia') else 'scuderia' end
   where id = p_centro;
  return json_build_object('ok', true);
end $$;

create or replace function public.incassi_retta_cavallo(p_cavallo uuid, p_retta numeric, p_intestatario uuid)
returns json language plpgsql security definer set search_path to 'public' as $$
declare v_centro uuid;
begin
  select centro_id into v_centro from scuderia_cavalli where id = p_cavallo;
  if v_centro is null or not puo_gestire_incassi(v_centro) then return json_build_object('ok', false, 'errore', 'Non autorizzato.'); end if;
  if p_intestatario is not null and not exists (select 1 from scuderia_membri where id = p_intestatario and centro_id = v_centro) then
    return json_build_object('ok', false, 'errore', 'Cliente non trovato.');
  end if;
  update scuderia_cavalli set retta = nullif(p_retta, 0), retta_intestatario_id = p_intestatario where id = p_cavallo;
  return json_build_object('ok', true);
end $$;

create or replace function public.incassi_salva_addebito(p_centro uuid, p_id uuid, p_membro uuid, p_cassa text, p_cavallo uuid,
  p_descrizione text, p_quantita numeric, p_prezzo numeric, p_data date)
returns json language plpgsql security definer set search_path to 'public' as $$
declare v_id uuid; v_orig text;
begin
  if not puo_gestire_incassi(p_centro) then return json_build_object('ok', false, 'errore', 'Non autorizzato.'); end if;
  if coalesce(trim(p_descrizione), '') = '' then return json_build_object('ok', false, 'errore', 'Scrivi cosa si addebita.'); end if;
  if coalesce(p_prezzo, 0) < 0 then return json_build_object('ok', false, 'errore', 'Il prezzo non può essere negativo.'); end if;
  if p_id is null then
    insert into scuderia_addebiti (centro_id, membro_id, cassa, cavallo_id, origine, descrizione, quantita, prezzo, data)
    values (p_centro, p_membro, coalesce(p_cassa, 'scuderia'), p_cavallo, 'manuale', trim(p_descrizione), coalesce(p_quantita, 1), coalesce(p_prezzo, 0), coalesce(p_data, current_date))
    returning id into v_id;
  else
    select origine into v_orig from scuderia_addebiti where id = p_id and centro_id = p_centro;
    if v_orig is null then return json_build_object('ok', false, 'errore', 'Addebito non trovato.'); end if;
    if v_orig <> 'manuale' then return json_build_object('ok', false, 'errore', 'Questo addebito è automatico: si cambia da dove nasce (pacchetto, lezione, gara…).'); end if;
    update scuderia_addebiti set beneficiario_id = p_membro, membro_id = p_membro, cassa = coalesce(p_cassa, cassa), cavallo_id = p_cavallo,
           descrizione = trim(p_descrizione), quantita = coalesce(p_quantita, 1), prezzo = coalesce(p_prezzo, 0), data = coalesce(p_data, data)
     where id = p_id returning id into v_id;
  end if;
  return json_build_object('ok', true, 'id', v_id);
exception when others then
  return json_build_object('ok', false, 'errore', case when sqlerrm like '%CLIENTE_ALTRO_CENTRO%' then 'Cliente non trovato.' else 'Salvataggio non riuscito.' end);
end $$;

create or replace function public.incassi_elimina_addebito(p_id uuid)
returns json language plpgsql security definer set search_path to 'public' as $$
declare d record;
begin
  select * into d from scuderia_addebiti where id = p_id;
  if d.id is null or not puo_gestire_incassi(d.centro_id) then return json_build_object('ok', false, 'errore', 'Non autorizzato.'); end if;
  if d.origine <> 'manuale' then return json_build_object('ok', false, 'errore', 'Questo addebito è automatico: si toglie da dove nasce (pacchetto, lezione, gara…).'); end if;
  if exists (select 1 from scuderia_conti where id = d.conto_id and stato = 'inviato') then
    return json_build_object('ok', false, 'errore', 'È in un conto già inviato al cliente.');
  end if;
  delete from scuderia_addebiti where id = p_id;
  return json_build_object('ok', true);
end $$;

create or replace function public.incassi_registra_pagamento(p_centro uuid, p_membro uuid, p_cassa text, p_importo numeric, p_metodo text,
  p_data date, p_addebito uuid default null, p_conto uuid default null, p_note text default null)
returns json language plpgsql security definer set search_path to 'public' as $$
declare v_id uuid; v_membro uuid := p_membro; v_cassa text := p_cassa;
begin
  if not puo_gestire_incassi(p_centro) then return json_build_object('ok', false, 'errore', 'Non autorizzato.'); end if;
  if coalesce(p_importo, 0) <= 0 then return json_build_object('ok', false, 'errore', 'Scrivi l''importo incassato.'); end if;
  if p_addebito is not null then select membro_id, cassa into v_membro, v_cassa from scuderia_addebiti where id = p_addebito and centro_id = p_centro; end if;
  if p_conto is not null then select membro_id, cassa into v_membro, v_cassa from scuderia_conti where id = p_conto and centro_id = p_centro; end if;
  if v_membro is null or not exists (select 1 from scuderia_membri where id = v_membro and centro_id = p_centro) then
    return json_build_object('ok', false, 'errore', 'Cliente non trovato.');
  end if;
  insert into scuderia_pagamenti (centro_id, membro_id, cassa, data, importo, metodo, addebito_id, conto_id, note)
  values (p_centro, v_membro, coalesce(v_cassa, 'scuderia'), coalesce(p_data, current_date), round(p_importo, 2), coalesce(p_metodo, 'contanti'), p_addebito, p_conto, nullif(trim(p_note), ''))
  returning id into v_id;
  return json_build_object('ok', true, 'id', v_id);
end $$;

create or replace function public.incassi_elimina_pagamento(p_id uuid)
returns json language plpgsql security definer set search_path to 'public' as $$
declare v_centro uuid;
begin
  select centro_id into v_centro from scuderia_pagamenti where id = p_id;
  if v_centro is null or not puo_gestire_incassi(v_centro) then return json_build_object('ok', false, 'errore', 'Non autorizzato.'); end if;
  delete from scuderia_pagamenti where id = p_id;
  return json_build_object('ok', true);
end $$;

-- conti del mese: rette dei cavalli + addebiti non ancora in un conto e non pagati → un conto in bozza per cliente
create or replace function public.incassi_genera_conti(p_centro uuid, p_mese date, p_cassa text default 'scuderia')
returns json language plpgsql security definer set search_path to 'public' as $$
declare v_mese date := date_trunc('month', coalesce(p_mese, current_date))::date; v_fine date; r record;
  v_conto uuid; n_rette int := 0; n_conti int := 0; n_righe int := 0; v_pref text; v_num int; v_mese_it text;
begin
  if not puo_gestire_incassi(p_centro) then return json_build_object('ok', false, 'errore', 'Non autorizzato.'); end if;
  v_fine := (v_mese + interval '1 month')::date;
  v_mese_it := (array['gennaio','febbraio','marzo','aprile','maggio','giugno','luglio','agosto','settembre','ottobre','novembre','dicembre'])[extract(month from v_mese)::int] || ' ' || extract(year from v_mese);
  if coalesce(p_cassa, 'scuderia') = 'scuderia' then
    for r in select sc.id, sc.nome, sc.retta, coalesce(sc.retta_intestatario_id, sc.proprietario_membro_id) as chi from scuderia_cavalli sc
              where sc.centro_id = p_centro and coalesce(sc.retta, 0) > 0 and coalesce(sc.retta_intestatario_id, sc.proprietario_membro_id) is not null
                and (sc.uscito_il is null or sc.uscito_il >= v_mese) and sc.created_at < v_fine loop
      insert into scuderia_addebiti (centro_id, membro_id, cassa, cavallo_id, origine, chiave, descrizione, quantita, prezzo, data)
      values (p_centro, r.chi, 'scuderia', r.id, 'retta', 'retta:' || r.id || ':' || to_char(v_mese, 'YYYY-MM'), 'Retta ' || v_mese_it || ' · ' || r.nome, 1, r.retta, v_mese)
      on conflict (centro_id, chiave) do nothing;
      if found then n_rette := n_rette + 1; end if;
    end loop;
  end if;
  for r in select x.membro_id from (select d.membro_id, sum(z.residuo) as aperto
             from scuderia_addebiti d join equo_incassi_residui(p_centro) z on z.addebito_id = d.id
            where d.centro_id = p_centro and d.cassa = coalesce(p_cassa, 'scuderia') and d.conto_id is null and d.data < v_fine
            group by d.membro_id) x where x.aperto > 0 loop
    select id into v_conto from scuderia_conti where centro_id = p_centro and membro_id = r.membro_id and cassa = coalesce(p_cassa, 'scuderia') and mese = v_mese;
    if v_conto is null then
      v_pref := case when coalesce(p_cassa, 'scuderia') = 'asd' then 'A-' else 'C-' end || extract(year from v_mese) || '-';
      select coalesce(max(substring(numero from length(v_pref) + 1)::int), 0) + 1 into v_num from scuderia_conti where centro_id = p_centro and numero like v_pref || '%';
      insert into scuderia_conti (centro_id, membro_id, cassa, mese, numero) values (p_centro, r.membro_id, coalesce(p_cassa, 'scuderia'), v_mese, v_pref || lpad(v_num::text, 3, '0'))
      returning id into v_conto;
      n_conti := n_conti + 1;
    elsif exists (select 1 from scuderia_conti where id = v_conto and stato = 'inviato') then
      continue;   -- già inviato: i nuovi addebiti andranno nel prossimo conto
    end if;
    update scuderia_addebiti d set conto_id = v_conto
      from equo_incassi_residui(p_centro) z
     where z.addebito_id = d.id and z.residuo > 0 and d.centro_id = p_centro and d.membro_id = r.membro_id
       and d.cassa = coalesce(p_cassa, 'scuderia') and d.conto_id is null and d.data < v_fine;
    get diagnostics v_num = row_count; n_righe := n_righe + v_num;
  end loop;
  return json_build_object('ok', true, 'rette', n_rette, 'conti', n_conti, 'righe', n_righe);
end $$;

-- tutto quello che serve alla sezione Incassi in una chiamata
create or replace function public.incassi_dati(p_centro uuid, p_mese date default null)
returns json language plpgsql security definer set search_path to 'public' as $$
declare v_mese date := date_trunc('month', coalesce(p_mese, current_date))::date; v_fine date; c record; v_auto boolean;
begin
  if not puo_gestire_incassi(p_centro) then return json_build_object('errore', 'Non autorizzato'); end if;
  v_fine := (v_mese + interval '1 month')::date;
  select * into c from centri where id = p_centro;
  v_auto := coalesce((centro_limiti(p_centro)->>'incassi_auto')::boolean, false);
  create temp table if not exists _inc_z (addebito_id uuid, membro_id uuid, cassa text, importo numeric, pagato numeric, residuo numeric) on commit drop;
  truncate _inc_z;
  insert into _inc_z select * from equo_incassi_residui(p_centro);
  return json_build_object(
    'mese', v_mese,
    'impostazioni', json_build_object('asd_attiva', c.asd_attiva, 'asd_nome', c.asd_nome, 'lezioni_addebito', c.lezioni_addebito,
       'cassa_lezioni', c.cassa_lezioni, 'auto', v_auto, 'centro', c.nome),
    'listino', coalesce((select json_agg(json_build_object('id', l.id, 'nome', l.nome, 'categoria', l.categoria, 'prezzo', l.prezzo, 'unita', l.unita,
        'cassa', l.cassa, 'attivo', l.attivo) order by l.categoria, l.ordine, l.nome) from scuderia_listino l where l.centro_id = p_centro), '[]'::json),
    'clienti', coalesce((select json_agg(json_build_object('id', m.id, 'nome', m.nome_visualizzato, 'ruolo', m.ruolo, 'app', m.user_id is not null,
        'paga', equo_pagante(m.id)) order by m.nome_visualizzato) from scuderia_membri m where m.centro_id = p_centro), '[]'::json),
    'cavalli', coalesce((select json_agg(json_build_object('id', sc.id, 'nome', sc.nome, 'tipo', sc.tipo_proprieta, 'retta', sc.retta,
        'intestatario', coalesce(sc.retta_intestatario_id, sc.proprietario_membro_id), 'intestatario_scelto', sc.retta_intestatario_id) order by sc.nome)
        from scuderia_cavalli sc where sc.centro_id = p_centro and sc.uscito_il is null), '[]'::json),
    'addebiti', coalesce((select json_agg(json_build_object('id', d.id, 'membro_id', d.membro_id, 'beneficiario_id', d.beneficiario_id, 'cassa', d.cassa,
        'cavallo', cv.nome, 'cavallo_id', d.cavallo_id, 'origine', d.origine, 'descrizione', d.descrizione, 'quantita', d.quantita, 'prezzo', d.prezzo,
        'importo', d.importo, 'pagato', z.pagato, 'residuo', z.residuo, 'data', d.data, 'conto', co.numero, 'conto_id', d.conto_id) order by d.data desc, d.created_at desc)
        from scuderia_addebiti d join _inc_z z on z.addebito_id = d.id left join scuderia_cavalli cv on cv.id = d.cavallo_id left join scuderia_conti co on co.id = d.conto_id
       where d.centro_id = p_centro and (z.residuo > 0 or (d.data >= v_mese and d.data < v_fine))), '[]'::json),
    'pagamenti', coalesce((select json_agg(json_build_object('id', p.id, 'membro_id', p.membro_id, 'cassa', p.cassa, 'data', p.data, 'importo', p.importo,
        'metodo', p.metodo, 'note', p.note, 'per', coalesce(d.descrizione, case when co.numero is not null then 'Conto ' || co.numero end, 'Acconto'))
        order by p.data desc, p.created_at desc)
        from scuderia_pagamenti p left join scuderia_addebiti d on d.id = p.addebito_id left join scuderia_conti co on co.id = p.conto_id
       where p.centro_id = p_centro and p.data >= v_mese and p.data < v_fine), '[]'::json),
    'conti', coalesce((select json_agg(json_build_object('id', co.id, 'membro_id', co.membro_id, 'cassa', co.cassa, 'numero', co.numero, 'stato', co.stato,
        'inviato_il', co.inviato_il, 'righe', t.n, 'totale', t.tot, 'pagato', t.pag, 'residuo', t.res) order by co.numero)
        from scuderia_conti co
        cross join lateral (select count(*) n, coalesce(sum(z.importo), 0) tot, coalesce(sum(z.pagato), 0) pag, coalesce(sum(z.residuo), 0) res
                              from scuderia_addebiti d join _inc_z z on z.addebito_id = d.id where d.conto_id = co.id) t
       where co.centro_id = p_centro and co.mese = v_mese), '[]'::json),
    'saldi', coalesce((select json_agg(json_build_object('membro_id', s.membro_id, 'cassa', s.cassa, 'residuo', s.res, 'credito', s.cred, 'dal', s.dal)
        order by s.res desc) from (
          select z.membro_id, z.cassa, sum(greatest(z.residuo, 0)) res, sum(greatest(-z.residuo, 0)) cred,
                 min(d.data) filter (where z.residuo > 0) dal
            from _inc_z z left join scuderia_addebiti d on d.id = z.addebito_id group by 1, 2
          having sum(greatest(z.residuo, 0)) > 0 or sum(greatest(-z.residuo, 0)) > 0) s), '[]'::json),
    'riepilogo', coalesce((select json_agg(json_build_object('cassa', k.cassa,
        'emesso', (select coalesce(sum(importo), 0) from scuderia_addebiti where centro_id = p_centro and cassa = k.cassa and data >= v_mese and data < v_fine),
        'incassato', (select coalesce(sum(importo), 0) from scuderia_pagamenti where centro_id = p_centro and cassa = k.cassa and data >= v_mese and data < v_fine),
        'da_incassare', (select coalesce(sum(greatest(z.residuo, 0)), 0) from _inc_z z where z.cassa = k.cassa),
        'in_ritardo', (select coalesce(sum(z.residuo), 0) from _inc_z z join scuderia_addebiti d on d.id = z.addebito_id where z.cassa = k.cassa and z.residuo > 0 and d.data < current_date - 30),
        'per_metodo', (select coalesce(json_object_agg(x.metodo, x.tot), '{}'::json) from (select metodo, sum(importo) tot from scuderia_pagamenti
                         where centro_id = p_centro and cassa = k.cassa and data >= v_mese and data < v_fine group by metodo) x)))
        from (select 'scuderia' as cassa union all select 'asd' where c.asd_attiva) k), '[]'::json)
  );
end $$;

-- dettaglio di un conto (anche per il PDF): staff che gestisce gli incassi, oppure il cliente se il conto è stato inviato
create or replace function public.incassi_conto(p_id uuid)
returns json language plpgsql security definer set search_path to 'public' as $$
declare co record; c record; m record; v_staff boolean;
begin
  select * into co from scuderia_conti where id = p_id;
  if co.id is null then return json_build_object('errore', 'Conto non trovato'); end if;
  select * into m from scuderia_membri where id = co.membro_id;
  v_staff := puo_gestire_incassi(co.centro_id);
  if not v_staff and not (co.stato = 'inviato' and m.user_id = auth.uid() and auth.uid() is not null) then return json_build_object('errore', 'Non autorizzato'); end if;
  select * into c from centri where id = co.centro_id;
  create temp table if not exists _inc_z (addebito_id uuid, membro_id uuid, cassa text, importo numeric, pagato numeric, residuo numeric) on commit drop;
  truncate _inc_z;
  insert into _inc_z select * from equo_incassi_residui(co.centro_id);
  return json_build_object('id', co.id, 'numero', co.numero, 'mese', co.mese, 'stato', co.stato, 'inviato_il', co.inviato_il, 'cassa', co.cassa, 'note', co.note, 'membro_id', co.membro_id,
    'intestatario', m.nome_visualizzato, 'app', m.user_id is not null,
    'emittente', case when co.cassa = 'asd' then coalesce(c.asd_nome, 'ASD ' || c.nome) else c.nome end,
    'centro', json_build_object('nome', c.nome, 'indirizzo', c.indirizzo, 'citta', c.citta, 'provincia', c.provincia, 'telefono', c.telefono),
    'righe', coalesce((select json_agg(json_build_object('id', d.id, 'descrizione', d.descrizione, 'per', case when d.beneficiario_id <> d.membro_id then b.nome_visualizzato end,
        'cavallo', cv.nome, 'data', d.data, 'quantita', d.quantita, 'prezzo', d.prezzo, 'importo', d.importo, 'pagato', z.pagato, 'residuo', z.residuo) order by d.data, d.created_at)
        from scuderia_addebiti d join _inc_z z on z.addebito_id = d.id left join scuderia_membri b on b.id = d.beneficiario_id
        left join scuderia_cavalli cv on cv.id = d.cavallo_id where d.conto_id = co.id), '[]'::json),
    'totale', (select coalesce(sum(z.importo), 0) from scuderia_addebiti d join _inc_z z on z.addebito_id = d.id where d.conto_id = co.id),
    'pagato', (select coalesce(sum(z.pagato), 0) from scuderia_addebiti d join _inc_z z on z.addebito_id = d.id where d.conto_id = co.id),
    'residuo', (select coalesce(sum(z.residuo), 0) from scuderia_addebiti d join _inc_z z on z.addebito_id = d.id where d.conto_id = co.id));
end $$;

create or replace function public.incassi_invia_conto(p_id uuid)
returns json language plpgsql security definer set search_path to 'public' as $$
declare co record; m record; v_tot numeric; v_mese text; v_em text;
begin
  select * into co from scuderia_conti where id = p_id;
  if co.id is null or not puo_gestire_incassi(co.centro_id) then return json_build_object('ok', false, 'errore', 'Non autorizzato.'); end if;
  if not exists (select 1 from scuderia_addebiti where conto_id = co.id) then return json_build_object('ok', false, 'errore', 'Il conto è vuoto.'); end if;
  select * into m from scuderia_membri where id = co.membro_id;
  select sum(importo) into v_tot from scuderia_addebiti where conto_id = co.id;
  select case when co.cassa = 'asd' then coalesce(asd_nome, 'ASD ' || nome) else nome end into v_em from centri where id = co.centro_id;
  v_mese := (array['gennaio','febbraio','marzo','aprile','maggio','giugno','luglio','agosto','settembre','ottobre','novembre','dicembre'])[extract(month from co.mese)::int];
  update scuderia_conti set stato = 'inviato', inviato_il = now() where id = co.id;
  if m.user_id is not null then
    insert into chat_messaggi (centro_id, membro_id, mittente_user_id, tipo, testo, letto)
    values (co.centro_id, co.membro_id, auth.uid(), 'testo',
      '🧾 ' || v_em || ': il conto di ' || v_mese || ' (n. ' || co.numero || ') è pronto, totale ' || equo_euro(v_tot) || '. Lo trovi nella Home di Equo.', false);
  end if;
  return json_build_object('ok', true, 'app', m.user_id is not null);
end $$;

create or replace function public.incassi_sollecita(p_centro uuid, p_membro uuid, p_cassa text default 'scuderia')
returns json language plpgsql security definer set search_path to 'public' as $$
declare m record; v_res numeric; v_em text;
begin
  if not puo_gestire_incassi(p_centro) then return json_build_object('ok', false, 'errore', 'Non autorizzato.'); end if;
  select * into m from scuderia_membri where id = p_membro and centro_id = p_centro;
  if m.id is null then return json_build_object('ok', false, 'errore', 'Cliente non trovato.'); end if;
  if m.user_id is null then return json_build_object('ok', false, 'errore', 'Questo cliente non ha l''app Equo: contattalo tu.'); end if;
  select coalesce(sum(greatest(residuo, 0)), 0) into v_res from equo_incassi_residui(p_centro) where membro_id = p_membro and cassa = coalesce(p_cassa, 'scuderia');
  if v_res <= 0 then return json_build_object('ok', false, 'errore', 'Non ha niente da pagare.'); end if;
  select case when coalesce(p_cassa, 'scuderia') = 'asd' then coalesce(asd_nome, 'ASD ' || nome) else nome end into v_em from centri where id = p_centro;
  insert into chat_messaggi (centro_id, membro_id, mittente_user_id, tipo, testo, letto)
  values (p_centro, p_membro, auth.uid(), 'testo',
    '🔔 Promemoria da ' || v_em || ': risultano ancora da saldare ' || equo_euro(v_res) || '. Se hai già pagato, scrivicelo qui. Grazie!', false);
  return json_build_object('ok', true, 'importo', v_res);
end $$;

-- stato del pagamento dei pacchetti (per la tabella dei Pacchetti)
create or replace function public.incassi_stato_pacchetti(p_centro uuid)
returns json language plpgsql security definer set search_path to 'public' as $$
begin
  if not puo_gestire_incassi(p_centro) then return '{}'::json; end if;
  return coalesce((select json_object_agg(substring(d.chiave from 11), json_build_object('addebito_id', d.id, 'importo', z.importo, 'pagato', z.pagato, 'residuo', z.residuo))
    from scuderia_addebiti d join equo_incassi_residui(p_centro) z on z.addebito_id = d.id
   where d.centro_id = p_centro and d.origine = 'pacchetto'), '{}'::json);
end $$;

-- ASD in una chiamata
create or replace function public.asd_dati(p_centro uuid)
returns json language plpgsql stable security definer set search_path to 'public' as $$
begin
  if not puo_gestire_incassi(p_centro) then return json_build_object('errore', 'Non autorizzato'); end if;
  return json_build_object(
    'tesseramenti', coalesce((select json_agg(row_to_json(t) order by t.scadenza nulls last) from (select x.*, m.nome_visualizzato as nome from scuderia_tesseramenti x join scuderia_membri m on m.id = x.membro_id where x.centro_id = p_centro) t), '[]'::json),
    'certificati', coalesce((select json_agg(row_to_json(t) order by t.scadenza) from (select x.*, m.nome_visualizzato as nome from scuderia_certificati x join scuderia_membri m on m.id = x.membro_id where x.centro_id = p_centro) t), '[]'::json),
    'gare', coalesce((select json_agg(json_build_object('id', g.id, 'nome', g.nome, 'luogo', g.luogo, 'data_inizio', g.data_inizio, 'data_fine', g.data_fine,
        'quota_default', g.quota_default, 'box_default', g.box_default, 'note', g.note,
        'iscritti', coalesce((select json_agg(json_build_object('id', i.id, 'membro_id', i.membro_id, 'nome', m.nome_visualizzato, 'cavallo_id', i.cavallo_id, 'cavallo', cv.nome,
            'categoria', i.categoria, 'quota', i.quota, 'box', i.box) order by m.nome_visualizzato)
            from scuderia_gare_iscritti i join scuderia_membri m on m.id = i.membro_id left join scuderia_cavalli cv on cv.id = i.cavallo_id where i.gara_id = g.id), '[]'::json),
        'spese', coalesce((select json_agg(json_build_object('id', s.id, 'descrizione', s.descrizione, 'importo', s.importo) order by s.created_at) from scuderia_gare_spese s where s.gara_id = g.id), '[]'::json))
        order by g.data_inizio desc) from scuderia_gare g where g.centro_id = p_centro), '[]'::json));
end $$;

-- 8 · lato cliente (App Equo) ------------------------------------------------------------------------------------
create or replace function public.miei_conti()
returns json language plpgsql security definer set search_path to 'public' as $$
declare r record; v json := '[]'::json; v_list jsonb := '[]'::jsonb;
begin
  if auth.uid() is null then return '[]'::json; end if;
  for r in select co.id from scuderia_conti co join scuderia_membri m on m.id = co.membro_id
            where m.user_id = auth.uid() and co.stato = 'inviato' and co.mese >= (date_trunc('month', current_date) - interval '12 months')::date
            order by co.mese desc, co.numero desc loop
    v := incassi_conto(r.id);
    if v->>'errore' is null then v_list := v_list || jsonb_build_array(v::jsonb); end if;
  end loop;
  return v_list::json;
end $$;

create or replace function public.segnala_conto_pagato(p_id uuid, p_metodo text default null)
returns json language plpgsql security definer set search_path to 'public' as $$
declare co record; m record; v_res numeric;
begin
  select * into co from scuderia_conti where id = p_id;
  select * into m from scuderia_membri where id = co.membro_id;
  if co.id is null or m.user_id is distinct from auth.uid() or co.stato <> 'inviato' then return json_build_object('ok', false, 'errore', 'Conto non trovato.'); end if;
  select coalesce(sum(z.residuo), 0) into v_res from scuderia_addebiti d join equo_incassi_residui(co.centro_id) z on z.addebito_id = d.id where d.conto_id = co.id;
  insert into chat_messaggi (centro_id, membro_id, mittente_user_id, tipo, testo, letto)
  values (co.centro_id, co.membro_id, auth.uid(), 'testo',
    '💶 Ho pagato il conto n. ' || co.numero || ' (' || equo_euro(v_res) || ')' || coalesce(' con ' || nullif(trim(p_metodo), ''), '') || '. Potete registrarlo?', false);
  return json_build_object('ok', true);
end $$;

-- permessi di esecuzione
do $$ declare f text;
begin
  foreach f in array array[
    'incassi_impostazioni(uuid, boolean, text, text, text)', 'incassi_retta_cavallo(uuid, numeric, uuid)',
    'incassi_salva_addebito(uuid, uuid, uuid, text, uuid, text, numeric, numeric, date)', 'incassi_elimina_addebito(uuid)',
    'incassi_registra_pagamento(uuid, uuid, text, numeric, text, date, uuid, uuid, text)', 'incassi_elimina_pagamento(uuid)',
    'incassi_genera_conti(uuid, date, text)', 'incassi_dati(uuid, date)', 'incassi_conto(uuid)', 'incassi_invia_conto(uuid)',
    'incassi_sollecita(uuid, uuid, text)', 'incassi_stato_pacchetti(uuid)', 'asd_dati(uuid)', 'miei_conti()', 'segnala_conto_pagato(uuid, text)'] loop
    execute 'revoke all on function public.' || f || ' from public, anon';
    execute 'grant execute on function public.' || f || ' to authenticated, service_role';
  end loop;
end $$;
revoke all on function public.pacchetti_addebito() from public, anon, authenticated;
revoke all on function public.lezioni_addebito() from public, anon, authenticated;
revoke all on function public.tesseramenti_addebito() from public, anon, authenticated;
revoke all on function public.gare_iscritti_addebito() from public, anon, authenticated;
revoke all on function public.addebiti_prima() from public, anon, authenticated;

-- 9 · pacchetto commerciale: Incassi in ADVANCE e PREMIUM, automatismi in PREMIUM ----------------------------------
do $$
declare v_def text;
begin
  v_def := pg_get_functiondef('public.centro_limiti'::regproc);
  if position('''incassi''' in v_def) = 0 then
    v_def := replace(v_def, '  agenti := array[''athena''];',
      '  r := r || jsonb_build_object(''incassi'', pk <> ''start'', ''incassi_auto'', pk not in (''start'', ''advance''));
  agenti := array[''athena''];');
    execute v_def;
  end if;
end $$;

-- 10 · pacchetti già venduti: diventano addebiti (senza pagamenti: la scuderia segna quelli già incassati) ----------------
insert into scuderia_addebiti (centro_id, membro_id, cassa, cavallo_id, origine, chiave, descrizione, quantita, prezzo, data)
select p.centro_id, p.membro_id, 'scuderia', p.cavallo_id, 'pacchetto', 'pacchetto:' || p.id,
  case p.tipo when 'carnet' then 'Carnet' || coalesce(' ' || p.unita_totali || ' lezioni', '') when 'abbonamento' then 'Abbonamento' when 'pensione' then 'Pacchetto pensione' else 'Pacchetto' end,
  1, p.prezzo, coalesce(p.data_inizio, p.created_at::date)
  from scuderia_pacchetti p where coalesce(p.prezzo, 0) > 0 and p.membro_id is not null
on conflict (centro_id, chiave) do nothing;

-- controllo finale: deve dare 9 · true · true · true
select (select count(*) from pg_tables where schemaname = 'public' and tablename in ('scuderia_listino', 'scuderia_conti', 'scuderia_addebiti', 'scuderia_pagamenti',
          'scuderia_tesseramenti', 'scuderia_certificati', 'scuderia_gare', 'scuderia_gare_iscritti', 'scuderia_gare_spese')) as tabelle,
       position('''incassi''' in pg_get_functiondef('public.centro_limiti'::regproc)) > 0 as limiti,
       exists (select 1 from pg_trigger where tgname = 'trg_pacchetti_addebito') as pacchetti_addebito,
       exists (select 1 from pg_proc where proname = 'miei_conti') as conti_app;
