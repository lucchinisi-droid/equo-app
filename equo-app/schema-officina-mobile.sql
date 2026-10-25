-- 27/10/2026 OFFICINA MOBILE DEL MANISCALCO: mezzi, aiutanti, materiali, giornata di lavoro, spese, guadagno netto
-- 1) officina_impostazioni: base di partenza (per i km), prezzo del carburante, mezzo e aiutante predefiniti, configurazione fatta
-- 2) officina_mezzi: furgone/auto/carrello con scadenze (revisione, tagliando a km o mesi, bombole, assicurazione, bollo)
--    e interruttore «Mostra ai clienti» (marca e modello nella pagina pubblica Premium)
-- 3) officina_interventi: storico e prossime manutenzioni del mezzo
-- 4) officina_aiutanti: collaboratori con compenso a giornata, a cavallo o a ore
-- 5) officina_materiali: ferri, chiodi, prodotti, attrezzi con costo e scorte
-- 6) officina_giornate: per ogni giorno mezzo, aiutante, km (Beta) e materiali usati
-- 7) officina_spese: spese automatiche (aiutante, carburante, materiali) e a mano → guadagno netto
-- 8) interventi_mascalcia: aiutante del singolo appuntamento (id e nome, il nome lo vede il cliente)
-- 9) promemoria_personali.fonte: i promemoria delle scadenze del mezzo si aggiornano senza doppioni
-- 10) geo_cache: coordinate degli indirizzi già cercati per i km (solo il server)
-- 11) equo_pro_pubblico: nella pagina pubblica anche il mezzo, se il professionista lo mostra
-- Si puo rieseguire senza danni.

create table if not exists public.officina_impostazioni (
  user_id uuid primary key references auth.users(id) on delete cascade,
  base_indirizzo text check (base_indirizzo is null or length(base_indirizzo) <= 300),
  base_lat double precision, base_lon double precision,
  prezzo_carburante numeric(6,3) check (prezzo_carburante is null or prezzo_carburante between 0 and 10),
  mezzo_predefinito uuid, aiutante_predefinito uuid,
  configurata_il timestamptz,
  aggiornato_il timestamptz not null default now()
);

create table if not exists public.officina_mezzi (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  tipo text not null default 'furgone' check (tipo in ('furgone', 'auto', 'carrello', 'altro')),
  marca text check (marca is null or length(marca) <= 40),
  modello text check (modello is null or length(modello) <= 60),
  targa text check (targa is null or length(targa) <= 15),
  immatricolazione date,
  alimentazione text check (alimentazione is null or alimentazione in ('diesel', 'benzina', 'gpl', 'metano', 'ibrido', 'elettrico')),
  km_attuali integer check (km_attuali is null or km_attuali between 0 and 3000000),
  km_aggiornati_il date,
  consumo_l100 numeric(5,2) check (consumo_l100 is null or consumo_l100 between 0 and 60),
  tagliando_km integer check (tagliando_km is null or tagliando_km between 1000 and 100000),
  tagliando_mesi smallint check (tagliando_mesi is null or tagliando_mesi between 1 and 60),
  ultimo_tagliando_data date, ultimo_tagliando_km integer,
  revisione_data date, assicurazione_data date, bollo_data date, bombole_data date,
  mostra_clienti boolean not null default false,
  archiviato boolean not null default false,
  creato_il timestamptz not null default now(),
  aggiornato_il timestamptz not null default now()
);
create index if not exists officina_mezzi_utente on public.officina_mezzi (user_id);

create table if not exists public.officina_interventi (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  mezzo_id uuid not null references public.officina_mezzi(id) on delete cascade,
  tipo text not null default 'altro',
  titolo text not null check (length(trim(titolo)) between 1 and 80),
  data date not null,
  km integer,
  importo numeric(10,2) check (importo is null or importo >= 0),
  stato text not null default 'fatto' check (stato in ('fatto', 'da_fare')),
  note text check (note is null or length(note) <= 300),
  creato_il timestamptz not null default now()
);
create index if not exists officina_interventi_mezzo on public.officina_interventi (mezzo_id, data desc);

create table if not exists public.officina_aiutanti (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  nome text not null check (length(trim(nome)) between 1 and 60),
  telefono text check (telefono is null or length(telefono) <= 30),
  compenso_tipo text not null default 'giornata' check (compenso_tipo in ('giornata', 'cavallo', 'ora')),
  compenso numeric(8,2) not null default 0 check (compenso >= 0),
  attivo boolean not null default true,
  creato_il timestamptz not null default now()
);
create index if not exists officina_aiutanti_utente on public.officina_aiutanti (user_id);

create table if not exists public.officina_materiali (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  categoria text not null default 'altro' check (categoria in ('ferri', 'chiodi', 'prodotti', 'attrezzi', 'altro')),
  nome text not null check (length(trim(nome)) between 1 and 60),
  misura text check (misura is null or length(misura) <= 20),
  unita text not null default 'pezzo' check (unita in ('pezzo', 'paio', 'scatola', 'barattolo', 'confezione', 'kg', 'litro')),
  costo numeric(8,2) not null default 0 check (costo >= 0),
  scorta numeric(9,2) not null default 0,
  scorta_minima numeric(9,2) check (scorta_minima is null or scorta_minima >= 0),
  attivo boolean not null default true,
  creato_il timestamptz not null default now()
);
create index if not exists officina_materiali_utente on public.officina_materiali (user_id);

create table if not exists public.officina_giornate (
  user_id uuid not null references auth.users(id) on delete cascade,
  giorno date not null,
  mezzo_id uuid references public.officina_mezzi(id) on delete set null,
  aiutante_id uuid references public.officina_aiutanti(id) on delete set null,
  ore numeric(4,1) check (ore is null or ore between 0 and 24),
  km numeric(7,1) check (km is null or km between 0 and 3000),
  km_stimati numeric(7,1),
  km_corretti boolean not null default false,
  materiali jsonb not null default '[]'::jsonb,
  automatica boolean not null default false,
  salvata_il timestamptz not null default now(),
  primary key (user_id, giorno)
);

create table if not exists public.officina_spese (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  data date not null,
  categoria text not null check (categoria in ('aiutanti', 'carburante', 'materiali', 'mezzo', 'altro')),
  descrizione text not null check (length(trim(descrizione)) between 1 and 120),
  importo numeric(10,2) not null check (importo >= 0),
  automatica boolean not null default false,
  fonte text,
  mezzo_id uuid references public.officina_mezzi(id) on delete set null,
  creato_il timestamptz not null default now()
);
create index if not exists officina_spese_utente on public.officina_spese (user_id, data desc);
drop index if exists public.officina_spese_fonte;
create unique index if not exists officina_spese_fonte_u on public.officina_spese (user_id, fonte);   -- fonte vuota: righe libere (i NULL non si scontrano)

-- regole: ognuno vede e modifica solo le sue righe
do $do$
declare t text;
begin
  foreach t in array array['officina_impostazioni', 'officina_mezzi', 'officina_interventi', 'officina_aiutanti', 'officina_materiali', 'officina_giornate', 'officina_spese'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists %I on public.%I', t || '_tutto', t);
    execute format('create policy %I on public.%I for all using (user_id = auth.uid()) with check (user_id = auth.uid())', t || '_tutto', t);
    execute format('revoke all on public.%I from anon', t);
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
  end loop;
end $do$;

-- aiutante del singolo appuntamento (il nome resta scritto anche se l'aiutante viene tolto)
alter table public.interventi_mascalcia add column if not exists aiutante_id uuid references public.officina_aiutanti(id) on delete set null;
alter table public.interventi_mascalcia add column if not exists aiutante_nome text check (aiutante_nome is null or length(aiutante_nome) <= 60);

-- promemoria delle scadenze del mezzo: una riga per scadenza, si aggiorna invece di duplicarsi
alter table public.promemoria_personali add column if not exists fonte text;
drop index if exists public.promemoria_personali_fonte;
create unique index if not exists promemoria_personali_fonte_u on public.promemoria_personali (user_id, fonte);

-- coordinate degli indirizzi (solo funzione Netlify «km-giro»)
create table if not exists public.geo_cache (
  testo text primary key,
  lat double precision, lon double precision,
  trovato boolean not null default true,
  creato_il timestamptz not null default now()
);
alter table public.geo_cache enable row level security;
revoke all on public.geo_cache from public, anon, authenticated;

-- pagina pubblica del professionista: anche il mezzo se «Mostra ai clienti» è acceso
create or replace function public.equo_pro_pubblico(p_slug text) returns json
language plpgsql stable security definer set search_path to 'public' as $fn$
declare r pro_cv; p profiles; d jsonb; v_ruolo text; v_ver text[]; v_mezzo text;
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
  select string_agg(trim(case tipo when 'furgone' then 'Furgone attrezzato ' when 'carrello' then 'Carrello ' else '' end || coalesce(marca, '') || ' ' || coalesce(modello, '')), ' · ')
    into v_mezzo from officina_mezzi where user_id = r.user_id and mostra_clienti and not archiviato and coalesce(marca, modello) is not null;
  return json_build_object(
    'nome', coalesce(nullif(trim(p.full_name), ''), p.dati_pagamento_nome), 'ruolo', v_ruolo, 'avatar', p.avatar_url,
    'certificato', p.certificazione_stato = 'verificato', 'codice', p.codice_professionista,
    'titolo', d->>'titolo', 'presentazione', d->>'presentazione', 'presentazione_en', d->>'presentazione_en',
    'zone', case when coalesce((d->>'mostra_zona')::boolean, true) then d->'zone' else '[]'::jsonb end,
    'trasferte', coalesce((d->>'trasferte')::boolean, false),
    'spec', d->'spec', 'lingue', d->'lingue', 'mezzo', v_mezzo,
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

-- aggiunte del 26/10 (tipi di intervento e cinghia): stesse righe di schema-officina-cinghia.sql

alter table public.officina_interventi drop constraint if exists officina_interventi_tipo_check;
alter table public.officina_interventi add constraint officina_interventi_tipo_check check (tipo in
  ('tagliando', 'revisione', 'pneumatici', 'pasticche', 'cinghia', 'manutenzione_ordinaria', 'manutenzione_straordinaria', 'riparazione', 'bombole', 'altro'));

alter table public.officina_mezzi add column if not exists cinghia_km integer;
alter table public.officina_mezzi add column if not exists cinghia_anni smallint;
alter table public.officina_mezzi add column if not exists ultima_cinghia_data date;
alter table public.officina_mezzi add column if not exists ultima_cinghia_km integer;
alter table public.officina_mezzi drop constraint if exists officina_mezzi_cinghia_check;
alter table public.officina_mezzi add constraint officina_mezzi_cinghia_check check (
  (cinghia_km is null or cinghia_km between 10000 and 400000) and (cinghia_anni is null or cinghia_anni between 1 and 15));

-- controllo: atteso 8 | 2 | 1
select (select count(*) from information_schema.tables where table_schema = 'public' and table_name in
          ('officina_impostazioni', 'officina_mezzi', 'officina_interventi', 'officina_aiutanti', 'officina_materiali', 'officina_giornate', 'officina_spese', 'geo_cache')) tabelle,
       (select count(*) from information_schema.columns where table_schema = 'public' and table_name = 'interventi_mascalcia' and column_name in ('aiutante_id', 'aiutante_nome')) colonne_aiutante,
       (select count(*) from information_schema.columns where table_schema = 'public' and table_name = 'promemoria_personali' and column_name = 'fonte') fonte_promemoria;
