-- Equo: PREMIUM PER LIVELLO + chiusura falle che possono far perdere soldi (8 ottobre 2026)
-- 1) premium_livello: 'proprietario' (pagato al prezzo proprietario) o 'professionista' (vale per entrambi i profili).
--    Il Premium proprietario NON sblocca le funzioni da professionista; si passa a professionista pagando la differenza.
-- 2) Chi non ha ancora la riga in profiles (accessi con Google) poteva crearsela da solo con piano 'premium'
--    o badge 'verificato': ora l'inserimento dall'app parte sempre da Free e senza badge.

alter table public.profiles add column if not exists premium_livello text;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'profiles_premium_livello_chk') then
    alter table public.profiles add constraint profiles_premium_livello_chk check (premium_livello is null or premium_livello in ('proprietario','professionista'));
  end if;
end $$;
-- i Premium esistenti (assegnati a mano) valgono per entrambi i profili
update public.profiles set premium_livello = 'professionista' where piano = 'premium' and premium_livello is null;

-- Premium valido per le funzioni da professionista (livello vuoto = assegnato a mano = completo)
create or replace function public.equo_premium_pro(p_user uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select piano = 'premium' and coalesce(premium_livello, 'professionista') = 'professionista' from profiles where id = p_user), false)
$$;

-- piano, livello e dati Stripe si cambiano solo dal server (webhook / funzioni), mai dall'app
create or replace function public.profiles_piano_guard()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null and new.piano is distinct from old.piano then
    new.piano := old.piano;
  end if;
  if auth.uid() is not null and new.premium_livello is distinct from old.premium_livello then
    new.premium_livello := old.premium_livello;
  end if;
  if auth.uid() is not null and (new.stripe_subscription_id is distinct from old.stripe_subscription_id
                                 or new.stripe_customer_id is distinct from old.stripe_customer_id) then
    new.stripe_subscription_id := old.stripe_subscription_id;
    new.stripe_customer_id := old.stripe_customer_id;
  end if;
  return new;
end $$;

-- inserimento dall'app (riga mancante, es. accesso con Google): sempre Free, senza Stripe, senza badge, incassi di base
create or replace function public.profiles_insert_guard()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then return new; end if;
  new.piano := 'free';
  new.premium_livello := null;
  new.stripe_customer_id := null;
  new.stripe_subscription_id := null;
  new.certificazione_stato := null;
  new.certificazione_motivo := null;
  new.certificazione_richiesta_at := null;
  new.certificazione_verificata_at := null;
  new.certificazione_notificata_at := null;
  new.iscrizione_notificata_at := null;
  new.incassi_nascosti := false;
  new.incassi_pin_hash := null;
  new.incassi_pin_tentativi := 0;
  new.incassi_pin_blocco := null;
  return new;
end $$;
drop trigger if exists trg_profiles_insert_guard on public.profiles;
create trigger trg_profiles_insert_guard before insert on public.profiles
  for each row execute function public.profiles_insert_guard();

-- 3) funzioni da professionista: serve il Premium professionista (non basta quello da proprietario)
do $$
declare v_def text;
begin
  -- limite 10 clienti del maniscalco
  select pg_get_functiondef('public.limite_clienti_free'::regproc) into v_def;
  if v_def not like '%equo_premium_pro%' then
    v_def := replace(v_def, 'if coalesce((select piano from profiles where id = new.maniscalco_id), ''free'') = ''premium'' then return new; end if;',
                            'if equo_premium_pro(new.maniscalco_id) then return new; end if;');
    execute v_def;
  end if;
  -- vocali / video del maniscalco ai clienti
  select pg_get_functiondef('public.messaggi_mascalcia_limiti_piano'::regproc) into v_def;
  if v_def not like '%equo_premium_pro%' then
    v_def := replace(v_def, 'select coalesce(piano, ''free'') = ''premium'' into v_premium from profiles where id = new.maniscalco_id;',
                            'v_premium := equo_premium_pro(new.maniscalco_id);');
    execute v_def;
  end if;
  -- vocali / video tra colleghi professionisti
  select pg_get_functiondef('public.messaggi_colleghi_premium'::regproc) into v_def;
  if v_def not like '%equo_premium_pro%' then
    v_def := replace(v_def, 'and not exists (select 1 from public.profiles p where p.id = new.mittente_id and p.piano = ''premium'') then',
                            'and not public.equo_premium_pro(new.mittente_id) then');
    execute v_def;
  end if;
end $$;

-- 3b) registro dei pagamenti una tantum (lifetime e «differenza lifetime»): serve per rimborsi e contestazioni.
--     Lo scrive solo il webhook di Stripe (chiave di servizio); nessun accesso dall'app.
create table if not exists public.pagamenti_lifetime (
  payment_intent text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  importo_cent integer not null default 0,
  listino_cent integer not null default 0,
  tipo text not null check (tipo in ('lifetime','upgrade')),
  livello text not null check (livello in ('proprietario','professionista')),
  rimborsato_il timestamptz,
  created_at timestamptz not null default now()
);
alter table public.pagamenti_lifetime enable row level security;

-- posti Early Adopter: contano anche i lifetime pagati senza «cliente» Stripe (link di pagamento)
create or replace function public.promo_posti()
returns jsonb language sql stable security definer set search_path = public as $$
  with v as (
    select
      count(*) filter (where ruolo = 'proprietario') as prop,
      count(*) filter (where ruolo in ('maniscalco','veterinario','istruttore')) as pro
    from profiles p
    where piano = 'premium' and stripe_subscription_id is null
      and (stripe_customer_id is not null
           or exists (select 1 from pagamenti_lifetime l where l.user_id = p.id and l.tipo = 'lifetime' and l.rimborsato_il is null))
  )
  select jsonb_build_object(
    'proprietari',   jsonb_build_object('totale', 150, 'riservati', 30, 'rimasti', greatest(120 - prop, 0)),
    'professionisti', jsonb_build_object('totale', 50,  'riservati', 5,  'rimasti', greatest(45 - pro, 0)))
  from v;
$$;

-- 4) guida degli agenti AI
update public.ai_conoscenze set aggiornato_il = now(), verificato_il = current_date,
  contenuto = replace(contenuto,
    'Se hai anche un profilo da professionista (es. maniscalco) paghi il prezzo da professionista (7,99 €/mese, 59 €/anno, 99 € lifetime) e il Premium vale per entrambi i profili.',
    'Se hai anche un profilo da professionista (es. maniscalco) paghi il prezzo da professionista (7,99 €/mese, 59 €/anno, 99 € lifetime) e il Premium vale per entrambi i profili. Se hai preso il Premium da proprietario e poi aggiungi il profilo da professionista, nella vista professionista tocca "Passa a Premium professionista": paghi solo la differenza (per mensile e annuale calcolata sui giorni che restano, per il lifetime 50 €) e vedi la cifra prima di confermare.')
where titolo = 'Quanto costa Premium e cosa include';

-- controllo finale: deve dare 1 · 1 · 3 · 1 · 1
select (select count(*) from information_schema.columns where table_name = 'profiles' and column_name = 'premium_livello') as colonna,
       (select count(*) from pg_trigger where tgname = 'trg_profiles_insert_guard') as guard_insert,
       (select count(*) from pg_proc where proname in ('limite_clienti_free','messaggi_mascalcia_limiti_piano','messaggi_colleghi_premium') and pg_get_functiondef(oid) like '%equo_premium_pro%') as controlli_pro,
       (select count(*) from ai_conoscenze where titolo = 'Quanto costa Premium e cosa include' and contenuto like '%Passa a Premium professionista%') as guida,
       (select count(*) from information_schema.tables where table_name = 'pagamenti_lifetime') as registro_lifetime;
