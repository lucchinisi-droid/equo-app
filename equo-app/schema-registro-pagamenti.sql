-- Equo: REGISTRO DI TUTTI I PAGAMENTI (8 ottobre 2026)
-- Ogni pagamento è una riga, scritta dal webhook di Stripe (o a mano per Equo Scuderia), divisa per
--   categoria: proprietario · professionista · scuderia
--   tipo:      mensile · annuale · lifetime · passaggio (differenza per passare a Premium professionista)
--   evento:    acquisto · rinnovo · passaggio
-- con il NUMERO CRONOLOGICO d'acquisto nella sua serie e un codice leggibile:
--   PROP-MEN-0001 (1° mensile proprietario) · PRO-ANN-0003 (3° annuale professionista) · PRO-LIF-0002 · PROP-LIF-0007
--   PRO-PASS-0001 (1° passaggio a professionista) · SCU-ANN-0001 (1° annuale Equo Scuderia)
--   i rinnovi tengono il numero dell'acquisto: PRO-ANN-0003-R1, PRO-ANN-0003-R2 …
-- Sostituisce pagamenti_lifetime (vuota, creata ieri).

create table if not exists public.pagamenti (
  id bigserial primary key,
  codice text unique,
  categoria text not null check (categoria in ('proprietario','professionista','scuderia')),
  tipo text not null check (tipo in ('mensile','annuale','lifetime','passaggio')),
  evento text not null check (evento in ('acquisto','rinnovo','passaggio')),
  numero integer,                 -- numero cronologico d'acquisto nella serie (i rinnovi ripetono quello dell'acquisto)
  rinnovo_n integer,              -- 1°, 2°, … rinnovo
  user_id uuid references auth.users(id) on delete set null,
  centro_id uuid,
  importo_cent integer not null default 0,     -- pagato davvero (dopo eventuali sconti)
  listino_cent integer,                         -- prezzo di listino
  valuta text not null default 'eur',
  stripe_subscription_id text,
  stripe_invoice_id text unique,
  stripe_payment_intent text unique,
  stripe_session_id text unique,
  stato text not null default 'pagato' check (stato in ('pagato','rimborsato','contestato')),
  rimborsato_il timestamptz,
  contestato_il timestamptz,
  note text,
  pagato_il timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index if not exists pagamenti_user_idx on public.pagamenti (user_id);
create index if not exists pagamenti_sub_idx on public.pagamenti (stripe_subscription_id);
alter table public.pagamenti enable row level security;   -- nessun accesso dall'app: solo webhook (chiave di servizio) e SQL Editor

create table if not exists public.pagamenti_contatori (serie text primary key, ultimo integer not null default 0);
alter table public.pagamenti_contatori enable row level security;

-- numero cronologico e codice assegnati al momento della registrazione (contatore per serie, senza buchi né doppioni)
create or replace function public.pagamenti_numera()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_serie text; v_acq record;
begin
  -- stesso pagamento ricevuto due volte (Stripe ritenta): l'inserimento verrà ignorato, il numero non si consuma
  if exists (select 1 from pagamenti where (new.stripe_invoice_id is not null and stripe_invoice_id = new.stripe_invoice_id)
                                        or (new.stripe_payment_intent is not null and stripe_payment_intent = new.stripe_payment_intent)
                                        or (new.stripe_session_id is not null and stripe_session_id = new.stripe_session_id)) then
    return new;
  end if;
  v_serie := (case new.categoria when 'proprietario' then 'PROP' when 'professionista' then 'PRO' else 'SCU' end)
          || '-' || (case new.tipo when 'mensile' then 'MEN' when 'annuale' then 'ANN' when 'lifetime' then 'LIF' else 'PASS' end);
  if new.evento = 'rinnovo' then
    select numero, codice into v_acq from pagamenti
     where evento = 'acquisto' and stripe_subscription_id is not null and stripe_subscription_id = new.stripe_subscription_id
     order by id limit 1;
    new.rinnovo_n := 1 + (select count(*) from pagamenti where evento = 'rinnovo' and stripe_subscription_id = new.stripe_subscription_id);
    if v_acq.codice is not null then
      new.numero := v_acq.numero;
      new.codice := v_acq.codice || '-R' || new.rinnovo_n;
    else
      new.codice := v_serie || '-R-' || coalesce(new.stripe_subscription_id, 'manuale') || '-' || new.rinnovo_n;   -- abbonamento nato prima del registro
    end if;
  else
    insert into pagamenti_contatori (serie, ultimo) values (v_serie, 1)
      on conflict (serie) do update set ultimo = pagamenti_contatori.ultimo + 1
      returning ultimo into new.numero;
    new.codice := v_serie || '-' || lpad(new.numero::text, 4, '0');
  end if;
  return new;
end $$;
drop trigger if exists trg_pagamenti_numera on public.pagamenti;
create trigger trg_pagamenti_numera before insert on public.pagamenti
  for each row execute function public.pagamenti_numera();

-- il registro non si riscrive: dopo l'inserimento cambiano solo stato, rimborso/contestazione e note
create or replace function public.pagamenti_solo_stato()
returns trigger language plpgsql as $$
begin
  -- user_id può solo diventare vuoto (account eliminato): la riga resta nel registro
  if (new.codice, new.categoria, new.tipo, new.evento, new.numero, new.importo_cent, new.pagato_il)
     is distinct from (old.codice, old.categoria, old.tipo, old.evento, old.numero, old.importo_cent, old.pagato_il)
     or (new.user_id is not null and new.user_id is distinct from old.user_id) then
    raise exception 'Il registro dei pagamenti non si modifica: si cambiano solo stato e note.';
  end if;
  return new;
end $$;
drop trigger if exists trg_pagamenti_solo_stato on public.pagamenti;
create trigger trg_pagamenti_solo_stato before update on public.pagamenti
  for each row execute function public.pagamenti_solo_stato();
create or replace rule pagamenti_no_delete as on delete to public.pagamenti do instead nothing;

-- Equo Scuderia (pacchetti non ancora su Stripe): registrazione a mano dal SQL Editor
--   select registra_pagamento_scuderia('<id centro>', 'annuale', 'acquisto', 120000, 'bonifico pacchetto PREMIUM');
create or replace function public.registra_pagamento_scuderia(p_centro uuid, p_tipo text, p_evento text, p_importo_cent integer, p_note text default null)
returns text language plpgsql security definer set search_path = public as $$
declare v_codice text;
begin
  insert into pagamenti (categoria, tipo, evento, centro_id, user_id, importo_cent, listino_cent, note, stripe_subscription_id)
  values ('scuderia', p_tipo, p_evento, p_centro, (select owner_id from centri where id = p_centro), p_importo_cent, p_importo_cent, p_note,
          case when p_evento = 'rinnovo' or p_evento = 'acquisto' then 'scuderia:' || p_centro::text || ':' || p_tipo end)
  returning codice into v_codice;
  return v_codice;
end $$;
revoke execute on function public.registra_pagamento_scuderia(uuid, text, text, integer, text) from public, anon, authenticated;

-- dal vecchio registro dei lifetime (vuoto) al registro unico
do $$ begin
  if to_regclass('public.pagamenti_lifetime') is not null then
    insert into public.pagamenti (categoria, tipo, evento, user_id, importo_cent, listino_cent, stripe_payment_intent, stato, rimborsato_il, pagato_il)
    select l.livello, case when l.tipo = 'upgrade' then 'passaggio' else 'lifetime' end, case when l.tipo = 'upgrade' then 'passaggio' else 'acquisto' end,
           l.user_id, l.importo_cent, l.listino_cent, l.payment_intent, case when l.rimborsato_il is null then 'pagato' else 'rimborsato' end, l.rimborsato_il, l.created_at
      from public.pagamenti_lifetime l
     where not exists (select 1 from public.pagamenti p where p.stripe_payment_intent = l.payment_intent)
     order by l.created_at;
  end if;
end $$;

-- posti Early Adopter: lifetime pagati e non rimborsati
create or replace function public.promo_posti()
returns jsonb language sql stable security definer set search_path = public as $$
  with v as (
    select
      count(*) filter (where ruolo = 'proprietario') as prop,
      count(*) filter (where ruolo in ('maniscalco','veterinario','istruttore')) as pro
    from profiles p
    where piano = 'premium' and stripe_subscription_id is null
      and (stripe_customer_id is not null
           or exists (select 1 from pagamenti g where g.user_id = p.id and g.tipo = 'lifetime' and g.stato = 'pagato'))
  )
  select jsonb_build_object(
    'proprietari',   jsonb_build_object('totale', 150, 'riservati', 30, 'rimasti', greatest(120 - prop, 0)),
    'professionisti', jsonb_build_object('totale', 50,  'riservati', 5,  'rimasti', greatest(45 - pro, 0)))
  from v;
$$;
drop table if exists public.pagamenti_lifetime;

-- viste di consultazione (SQL Editor): registro leggibile e riepilogo per categoria e tipo
create or replace view public.registro_pagamenti as
select g.codice, g.pagato_il::date as data, g.categoria, g.tipo, g.evento, g.numero, g.rinnovo_n,
       coalesce(nullif(trim(p.full_name), ''), c.nome, '—') as cliente, coalesce(p.email, '') as email,
       round(g.importo_cent / 100.0, 2) as importo_eur, round(g.listino_cent / 100.0, 2) as listino_eur,
       g.stato, g.note, g.stripe_subscription_id, g.stripe_invoice_id, g.stripe_payment_intent
  from public.pagamenti g
  left join public.profiles p on p.id = g.user_id
  left join public.centri c on c.id = g.centro_id
 order by g.id;

create or replace view public.riepilogo_pagamenti as
select categoria, tipo,
       count(*) filter (where evento in ('acquisto','passaggio')) as acquisti,
       count(*) filter (where evento = 'rinnovo') as rinnovi,
       count(*) filter (where stato = 'rimborsato') as rimborsati,
       count(*) filter (where stato = 'contestato') as contestati,
       round(sum(importo_cent) filter (where stato = 'pagato') / 100.0, 2) as incassato_eur
  from public.pagamenti
 group by categoria, tipo
 order by categoria, tipo;
revoke all on public.registro_pagamenti, public.riepilogo_pagamenti from anon, authenticated;

-- controllo finale: deve dare 1 · 1 · 0 · 2
select (select count(*) from information_schema.tables where table_name = 'pagamenti' and table_type = 'BASE TABLE') as registro,
       (select count(*) from pg_trigger where tgname = 'trg_pagamenti_numera') as numerazione,
       (select count(*) from information_schema.tables where table_name = 'pagamenti_lifetime') as vecchio_registro,
       (select count(*) from information_schema.views where table_name in ('registro_pagamenti','riepilogo_pagamenti')) as viste;
