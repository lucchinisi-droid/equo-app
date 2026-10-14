-- ===== REFERRAL con codice dedicato: 3 mesi di Premium gratis al NUOVO PROPRIETARIO (gestione interna, niente Stripe) =====
-- Link: app.equohub.com/?ref=ALESSANDRO  (nel volantino è un QR). Il codice si applica dopo l'iscrizione, a chi ha il profilo proprietario.
-- Premium «proprietario» con data di fine (profiles.premium_fino). A scadenza torna Free, SALVO chi nel frattempo ha pagato (abbonamento o lifetime).

-- 1. colonne sul profilo
alter table public.profiles add column if not exists premium_fino timestamptz;
alter table public.profiles add column if not exists premium_origine text;

-- 2. codici e usi (nessun accesso diretto dall'app: solo le funzioni qui sotto)
create table if not exists public.referral_codici (
  codice text primary key check (codice = upper(codice)),
  nome text not null,
  giorni int not null default 90 check (giorni between 1 and 366),
  max_usi int,
  scade_il timestamptz,
  attivo boolean not null default true,
  creato_il timestamptz not null default now()
);
create table if not exists public.referral_usi (
  id bigserial primary key,
  codice text not null references public.referral_codici(codice),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  usato_il timestamptz not null default now(),
  premium_fino timestamptz not null
);
create index if not exists referral_usi_codice_idx on public.referral_usi (codice, usato_il desc);
alter table public.referral_codici enable row level security;
alter table public.referral_usi enable row level security;
revoke all on public.referral_codici, public.referral_usi from anon, authenticated;

-- 3. il guardiano del piano: nessuno cambia piano/Premium dall'app, tranne le funzioni qui sotto (flag valido solo dentro la transazione)
create or replace function public.profiles_piano_guard()
returns trigger language plpgsql security definer set search_path to 'public' as $function$
begin
  if coalesce(current_setting('equo.consenti_piano', true), '') = 'on' then return new; end if;
  if auth.uid() is not null and new.piano is distinct from old.piano then
    new.piano := old.piano;
  end if;
  if auth.uid() is not null and new.premium_livello is distinct from old.premium_livello then
    new.premium_livello := old.premium_livello;
  end if;
  if auth.uid() is not null and (new.premium_fino is distinct from old.premium_fino or new.premium_origine is distinct from old.premium_origine) then
    new.premium_fino := old.premium_fino;
    new.premium_origine := old.premium_origine;
  end if;
  if auth.uid() is not null and (new.stripe_subscription_id is distinct from old.stripe_subscription_id
                                 or new.stripe_customer_id is distinct from old.stripe_customer_id) then
    new.stripe_subscription_id := old.stripe_subscription_id;
    new.stripe_customer_id := old.stripe_customer_id;
  end if;
  return new;
end $function$;

-- 4. info pubbliche sul codice (per il benvenuto prima dell'accesso): dice solo se è valido e di chi è
create or replace function public.equo_referral_info(p_codice text)
returns jsonb language sql stable security definer set search_path = public as $$
  select coalesce((select jsonb_build_object('valido', true, 'nome', c.nome, 'giorni', c.giorni)
    from referral_codici c
    where c.codice = upper(trim(p_codice)) and c.attivo and (c.scade_il is null or c.scade_il > now())
      and (c.max_usi is null or (select count(*) from referral_usi u where u.codice = c.codice) < c.max_usi)),
    jsonb_build_object('valido', false))
$$;

-- 5. riscatto: solo chi ha il profilo proprietario, iscritto da meno di 30 giorni, ancora Free, mai usato un referral
create or replace function public.equo_riscatta_referral(p_codice text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid(); p record; c record; v_fino timestamptz;
begin
  if v_uid is null then return jsonb_build_object('ok', false, 'errore', 'non_autenticato'); end if;
  select * into p from profiles where id = v_uid for update;
  if not found then return jsonb_build_object('ok', false, 'errore', 'profilo'); end if;
  if p.ruolo is distinct from 'proprietario' and p.ruolo_secondario is distinct from 'proprietario' then
    return jsonb_build_object('ok', false, 'errore', 'non_proprietario');
  end if;
  if exists (select 1 from referral_usi where user_id = v_uid) then return jsonb_build_object('ok', false, 'errore', 'gia_usato'); end if;
  if p.piano = 'premium' then return jsonb_build_object('ok', false, 'errore', 'gia_premium'); end if;
  if p.created_at < now() - interval '30 days' then return jsonb_build_object('ok', false, 'errore', 'non_nuovo'); end if;
  select * into c from referral_codici
    where codice = upper(trim(p_codice)) and attivo and (scade_il is null or scade_il > now()) for update;
  if not found then return jsonb_build_object('ok', false, 'errore', 'codice_non_valido'); end if;
  if c.max_usi is not null and (select count(*) from referral_usi where codice = c.codice) >= c.max_usi then
    return jsonb_build_object('ok', false, 'errore', 'esaurito');
  end if;
  v_fino := now() + make_interval(days => c.giorni);
  perform set_config('equo.consenti_piano', 'on', true);
  update profiles set piano = 'premium', premium_livello = 'proprietario', premium_fino = v_fino, premium_origine = 'referral:' || c.codice where id = v_uid;
  perform set_config('equo.consenti_piano', 'off', true);
  insert into referral_usi (codice, user_id, premium_fino) values (c.codice, v_uid, v_fino);
  return jsonb_build_object('ok', true, 'nome', c.nome, 'giorni', c.giorni, 'premium_fino', v_fino);
end $$;

-- 6. scadenza: torna Free chi è arrivato a fine referral e non ha pagato (abbonamento attivo o acquisto dopo il riscatto)
create or replace function public.equo_scade_premium_referral(p_user uuid default null)
returns int language plpgsql security definer set search_path = public as $$
declare r record; n int := 0; pagato boolean;
begin
  for r in select pr.id, pr.stripe_subscription_id, u.usato_il from profiles pr
           left join referral_usi u on u.user_id = pr.id
           where pr.premium_origine like 'referral:%' and pr.premium_fino is not null and pr.premium_fino < now()
             and (p_user is null or pr.id = p_user) loop
    pagato := r.stripe_subscription_id is not null or exists (
      select 1 from pagamenti g where g.user_id = r.id and g.rimborsato_il is null and g.contestato_il is null
        and coalesce(g.pagato_il, g.created_at) >= coalesce(r.usato_il, '-infinity'));
    perform set_config('equo.consenti_piano', 'on', true);
    if pagato then
      update profiles set premium_fino = null, premium_origine = null where id = r.id;
    else
      update profiles set piano = 'free', premium_livello = null, premium_fino = null, premium_origine = null where id = r.id;
      n := n + 1;
    end if;
    perform set_config('equo.consenti_piano', 'off', true);
  end loop;
  return n;
end $$;

-- l'app la chiama all'accesso, per il proprio profilo
create or replace function public.equo_controlla_premium()
returns jsonb language plpgsql security definer set search_path = public as $$
declare n int;
begin
  if auth.uid() is null then return jsonb_build_object('scaduto', false); end if;
  n := equo_scade_premium_referral(auth.uid());
  return jsonb_build_object('scaduto', n > 0);
end $$;

revoke all on function public.equo_referral_info(text) from public;
revoke all on function public.equo_riscatta_referral(text) from public;
revoke all on function public.equo_scade_premium_referral(uuid) from public;
revoke all on function public.equo_controlla_premium() from public;
grant execute on function public.equo_referral_info(text) to anon, authenticated;
grant execute on function public.equo_riscatta_referral(text) to authenticated;
grant execute on function public.equo_controlla_premium() to authenticated;

-- 7. controllo automatico ogni notte (se l'estensione è attiva; altrimenti basta il controllo all'accesso)
do $$ begin
  create extension if not exists pg_cron;
  perform cron.unschedule(jobid) from cron.job where jobname = 'equo-scadenze-referral';
  perform cron.schedule('equo-scadenze-referral', '10 3 * * *', 'select public.equo_scade_premium_referral(null)');
exception when others then raise notice 'pg_cron non disponibile (%): resta il controllo all''accesso', sqlerrm;
end $$;

-- 8. il codice di Alessandro
insert into public.referral_codici (codice, nome, giorni) values ('ALESSANDRO', 'Alessandro', 90) on conflict (codice) do nothing;

-- 9. guida di Hammer
insert into public.ai_conoscenze (ambito, categoria, attivo, titolo, contenuto, aggiornato_il, verificato_il)
select 'proprietario', 'guida', true, 'Codice invito: 3 mesi di Premium gratis',
'Dove: si usa il link o il QR che ricevi da chi ti ha invitato (es. app.equohub.com/?ref=ALESSANDRO).
Passi:
1. Apri il link o inquadra il QR e crea il tuo account scegliendo "Ho un cavallo".
2. Finita la registrazione, l''app applica il codice da sola: compare il messaggio con la data di fine.
3. Per 3 mesi hai Premium proprietario: cavalli illimitati, promemoria automatici, storico spese completo, assistente.
4. Alla scadenza torni al piano Free (1 cavallo) senza addebiti: non serve la carta. Se vuoi continuare scegli Premium dal menu.
Note: Vale solo per i nuovi proprietari (iscritti da meno di 30 giorni), una volta sola per persona, e non si somma ad altri piani. Se sei già Premium il codice non serve.
Parole chiave: codice invito, referral, 3 mesi gratis, premium gratis, prova gratuita, link invito, qr, promo', now(), current_date
where not exists (select 1 from public.ai_conoscenze where titolo = 'Codice invito: 3 mesi di Premium gratis' and ambito = 'proprietario');

-- controllo: deve dare 2 · 2 · 4 · 1 · 1 · 1
select (select count(*) from information_schema.columns where table_name = 'profiles' and column_name in ('premium_fino','premium_origine')) as colonne,
       (select count(*) from information_schema.tables where table_schema = 'public' and table_name in ('referral_codici','referral_usi')) as tabelle,
       (select count(*) from pg_proc where proname in ('equo_referral_info','equo_riscatta_referral','equo_scade_premium_referral','equo_controlla_premium')) as funzioni,
       (select count(*) from referral_codici where codice = 'ALESSANDRO') as codice,
       (select count(*) from pg_proc where proname = 'profiles_piano_guard' and prosrc like '%consenti_piano%') as guardiano,
       (select count(*) from ai_conoscenze where titolo = 'Codice invito: 3 mesi di Premium gratis') as guida;
