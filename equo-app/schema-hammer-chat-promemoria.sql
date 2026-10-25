-- 27/10/2026 HAMMER (e tutti gli agenti): CHAT A GIORNI CON STORICO, MESSAGGI IMPORTANTI, PROMEMORIA PERSONALI
-- 1) ai_conversazioni: ogni giorno una chat nuova; lo storico si cerca, si riapre, si rinomina, si fissa, si elimina.
--    In Equo App una chat per vista (proprietario / professionista); in Equo Scuderia una per agente (chiave = agente).
-- 2) ai_messaggi: conversazione_id (assegnata in automatico alla chat del giorno se manca), importante, letto_at, azione.
--    I messaggi già esistenti vengono divisi in chat per giorno (titolo = inizio della prima domanda).
-- 3) promemoria_personali: «ricordami di…» del professionista; all'ora giusta Hammer scrive in chat (messaggio importante),
--    più notifica push ed email se la push non arriva (funzione Netlify «invia-promemoria» ogni 5 minuti).
-- 4) rispondi_segnalazione_boss: la risposta dei Boss diventa un messaggio importante nella chat del giorno.
-- Si puo rieseguire senza danni.

-- ===================== 1) CONVERSAZIONI =====================
create table if not exists public.ai_conversazioni (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  vista text not null,
  chiave text not null default '',
  centro_id uuid,
  giorno date not null default ((now() at time zone 'Europe/Rome')::date),
  titolo text check (titolo is null or length(titolo) <= 80),
  titolo_manuale boolean not null default false,
  fissata boolean not null default false,
  n_messaggi integer not null default 0,
  creata_il timestamptz not null default now(),
  aggiornata_il timestamptz not null default now()
);
create index if not exists ai_conversazioni_utente on public.ai_conversazioni (user_id, vista, chiave, aggiornata_il desc);
alter table public.ai_conversazioni enable row level security;
drop policy if exists ai_conversazioni_sel on public.ai_conversazioni;
create policy ai_conversazioni_sel on public.ai_conversazioni for select using (user_id = auth.uid());
drop policy if exists ai_conversazioni_ins on public.ai_conversazioni;
create policy ai_conversazioni_ins on public.ai_conversazioni for insert with check (user_id = auth.uid());
drop policy if exists ai_conversazioni_upd on public.ai_conversazioni;
create policy ai_conversazioni_upd on public.ai_conversazioni for update using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists ai_conversazioni_del on public.ai_conversazioni;
create policy ai_conversazioni_del on public.ai_conversazioni for delete using (user_id = auth.uid());
revoke all on public.ai_conversazioni from anon;
grant select, insert, update, delete on public.ai_conversazioni to authenticated;

alter table public.ai_messaggi add column if not exists conversazione_id uuid references public.ai_conversazioni(id) on delete cascade;
alter table public.ai_messaggi add column if not exists importante boolean not null default false;
alter table public.ai_messaggi add column if not exists letto_at timestamptz;
alter table public.ai_messaggi add column if not exists azione jsonb;
create index if not exists ai_messaggi_conversazione on public.ai_messaggi (conversazione_id, created_at);
create index if not exists ai_messaggi_importanti on public.ai_messaggi (user_id) where importante and letto_at is null;

-- chiave della conversazione: nelle app un solo agente per vista; in Scuderia l'agente (athena, merlino, hammer, ares)
create or replace function public.ai_chiave_conv(p_vista text, p_agente text) returns text
language sql immutable as $fn$ select case when p_vista = 'scuderia' then coalesce(nullif(p_agente, ''), 'athena') else '' end $fn$;

-- la chat «del giorno» (l'ultima toccata oggi, ora italiana); se non c'è si crea
create or replace function public.ai_conversazione_corrente(p_user uuid, p_vista text, p_chiave text, p_centro uuid) returns uuid
language plpgsql security definer set search_path to 'public' as $fn$
declare v_id uuid; v_oggi date := (now() at time zone 'Europe/Rome')::date;
begin
  perform pg_advisory_xact_lock(hashtext(p_user::text || '|' || p_vista || '|' || coalesce(p_chiave, '') || '|' || coalesce(p_centro::text, '')));
  select id into v_id from ai_conversazioni
   where user_id = p_user and vista = p_vista and chiave = coalesce(p_chiave, '') and centro_id is not distinct from p_centro and giorno = v_oggi
   order by aggiornata_il desc limit 1;
  if v_id is null then
    insert into ai_conversazioni (user_id, vista, chiave, centro_id, giorno) values (p_user, p_vista, coalesce(p_chiave, ''), p_centro, v_oggi) returning id into v_id;
  end if;
  return v_id;
end $fn$;
revoke all on function public.ai_conversazione_corrente(uuid, text, text, uuid) from public, anon, authenticated;

create or replace function public.ai_messaggi_conversazione() returns trigger
language plpgsql security definer set search_path to 'public' as $fn$
begin
  if new.conversazione_id is null then
    new.conversazione_id := ai_conversazione_corrente(new.user_id, new.vista, ai_chiave_conv(new.vista, new.agente), new.centro_id);
  end if;
  return new;
end $fn$;
drop trigger if exists trg_ai_messaggi_conversazione on public.ai_messaggi;
create trigger trg_ai_messaggi_conversazione before insert on public.ai_messaggi for each row execute function public.ai_messaggi_conversazione();

create or replace function public.ai_messaggi_conteggio() returns trigger
language plpgsql security definer set search_path to 'public' as $fn$
begin
  if tg_op = 'INSERT' then
    update ai_conversazioni set n_messaggi = n_messaggi + 1, aggiornata_il = now() where id = new.conversazione_id;
  elsif tg_op = 'DELETE' and old.conversazione_id is not null then
    update ai_conversazioni set n_messaggi = greatest(0, n_messaggi - 1) where id = old.conversazione_id;
  end if;
  return null;
end $fn$;
drop trigger if exists trg_ai_messaggi_conteggio on public.ai_messaggi;
create trigger trg_ai_messaggi_conteggio after insert or delete on public.ai_messaggi for each row execute function public.ai_messaggi_conteggio();

-- messaggi già esistenti: una chat per utente, vista, agente e giorno (titolo = inizio della prima domanda)
do $do$
declare g record; v_id uuid;
begin
  for g in
    select m.user_id, m.vista, ai_chiave_conv(m.vista, m.agente) chiave, m.centro_id, (m.created_at at time zone 'Europe/Rome')::date giorno,
           min(m.created_at) inizio, max(m.created_at) fine, count(*) n,
           (array_agg(left(regexp_replace(m.contenuto, '\s+', ' ', 'g'), 60) order by m.created_at) filter (where m.ruolo = 'user'))[1] titolo
      from ai_messaggi m where m.conversazione_id is null
     group by 1, 2, 3, 4, 5
  loop
    insert into ai_conversazioni (user_id, vista, chiave, centro_id, giorno, titolo, n_messaggi, creata_il, aggiornata_il)
    values (g.user_id, g.vista, g.chiave, g.centro_id, g.giorno, nullif(trim(g.titolo), ''), g.n, g.inizio, g.fine) returning id into v_id;
    update ai_messaggi m set conversazione_id = v_id
     where m.conversazione_id is null and m.user_id = g.user_id and m.vista = g.vista and ai_chiave_conv(m.vista, m.agente) = g.chiave
       and m.centro_id is not distinct from g.centro_id and (m.created_at at time zone 'Europe/Rome')::date = g.giorno;
  end loop;
end $do$;
-- le risposte dei Boss già arrivate restano importanti ma già lette
update public.ai_messaggi set importante = true, letto_at = coalesce(letto_at, now())
 where contenuto like '📬 **Risposta dai Boss**%' and not importante;

-- l'app segna letti i messaggi importanti che ha mostrato
create or replace function public.ai_segna_importanti_letti(p_ids uuid[] default null) returns integer
language plpgsql security definer set search_path to 'public' as $fn$
declare n integer;
begin
  update ai_messaggi set letto_at = now()
   where user_id = auth.uid() and importante and letto_at is null and (p_ids is null or id = any(p_ids));
  get diagnostics n = row_count;
  return n;
end $fn$;
revoke all on function public.ai_segna_importanti_letti(uuid[]) from public, anon;
grant execute on function public.ai_segna_importanti_letti(uuid[]) to authenticated;

-- ===================== 3) PROMEMORIA PERSONALI =====================
create table if not exists public.promemoria_personali (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  vista text not null default 'professionista' check (vista in ('professionista', 'proprietario')),
  testo text not null check (length(trim(testo)) between 1 and 300),
  quando timestamptz not null,
  cliente_mascalcia_id uuid references public.clienti_mascalcia(id) on delete set null,
  azione text check (azione is null or azione in ('conto', 'chat', 'naviga')),
  stato text not null default 'attivo' check (stato in ('attivo', 'fatto', 'annullato')),
  creato_da text not null default 'utente' check (creato_da in ('utente', 'hammer')),
  inviato_il timestamptz,
  inviato_push boolean,
  inviato_email boolean,
  fatto_il timestamptz,
  creato_il timestamptz not null default now(),
  aggiornato_il timestamptz not null default now()
);
create index if not exists promemoria_da_inviare on public.promemoria_personali (quando) where stato = 'attivo' and inviato_il is null;
create index if not exists promemoria_utente on public.promemoria_personali (user_id, quando);
alter table public.promemoria_personali enable row level security;
drop policy if exists promemoria_sel on public.promemoria_personali;
create policy promemoria_sel on public.promemoria_personali for select using (user_id = auth.uid());
drop policy if exists promemoria_ins on public.promemoria_personali;
create policy promemoria_ins on public.promemoria_personali for insert with check (user_id = auth.uid()
  and (cliente_mascalcia_id is null or exists (select 1 from public.clienti_mascalcia c where c.id = cliente_mascalcia_id and c.maniscalco_id = auth.uid())));
drop policy if exists promemoria_upd on public.promemoria_personali;
create policy promemoria_upd on public.promemoria_personali for update using (user_id = auth.uid()) with check (user_id = auth.uid()
  and (cliente_mascalcia_id is null or exists (select 1 from public.clienti_mascalcia c where c.id = cliente_mascalcia_id and c.maniscalco_id = auth.uid())));
drop policy if exists promemoria_del on public.promemoria_personali;
create policy promemoria_del on public.promemoria_personali for delete using (user_id = auth.uid());
revoke all on public.promemoria_personali from anon;
grant select, insert, update, delete on public.promemoria_personali to authenticated;

-- rimandato (nuova ora) o rimesso attivo: si potrà inviare di nuovo; i campi dell'invio li scrive solo il server
create or replace function public.promemoria_controlli() returns trigger
language plpgsql security definer set search_path to 'public' as $fn$
begin
  if auth.uid() is not null then
    if tg_op = 'INSERT' then new.inviato_il := null; new.inviato_push := null; new.inviato_email := null;
    else
      if new.quando is distinct from old.quando or (new.stato = 'attivo' and old.stato <> 'attivo') then
        new.inviato_il := null; new.inviato_push := null; new.inviato_email := null;
      else new.inviato_il := old.inviato_il; new.inviato_push := old.inviato_push; new.inviato_email := old.inviato_email;
      end if;
    end if;
  end if;
  if new.stato = 'fatto' and (tg_op = 'INSERT' or old.stato <> 'fatto') then new.fatto_il := now(); end if;
  if new.stato <> 'fatto' then new.fatto_il := null; end if;
  new.aggiornato_il := now();
  return new;
end $fn$;
drop trigger if exists trg_promemoria_controlli on public.promemoria_personali;
create trigger trg_promemoria_controlli before insert or update on public.promemoria_personali for each row execute function public.promemoria_controlli();

-- ===================== 4) RISPOSTA DEI BOSS = MESSAGGIO IMPORTANTE =====================
create or replace function public.rispondi_segnalazione_boss(p_id uuid, p_testo text) returns text
language plpgsql security definer set search_path to 'public' as $function$
declare r public.segnalazioni_boss%rowtype; v_nome text; v_data text;
begin
  if coalesce(trim(p_testo), '') = '' then raise exception 'Testo vuoto'; end if;
  select * into r from segnalazioni_boss where id = p_id;
  if r.id is null then raise exception 'Segnalazione non trovata'; end if;
  v_nome := case r.agente when 'pegasus' then 'Pegasus' when 'hammer' then 'Hammer' when 'athena' then 'Athena' else initcap(r.agente) end;
  v_data := to_char(r.created_at at time zone 'Europe/Rome', 'DD/MM/YYYY');
  insert into ai_messaggi (user_id, vista, agente, ruolo, contenuto, centro_id, importante)
  values (r.user_id, r.vista, r.agente, 'assistant',
    E'📬 **Risposta dai Boss** sulla tua segnalazione del ' || v_data || E':\n\n> ' || replace(r.riassunto, E'\n', ' ') ||
    E'\n\n' || trim(p_testo) || E'\n\nSe vuoi aggiungere qualcosa scrivimelo qui, lo giro di nuovo a loro.', r.centro_id, true);
  update segnalazioni_boss set risposta = trim(p_testo), risposta_at = now(), stato = 'risposta' where id = p_id;
  return 'Risposta inviata a ' || v_nome || ' per l''utente ' || r.user_id;
end $function$;

-- controllo: atteso 2 | 4 | 0 | 4
select (select count(*) from information_schema.tables where table_schema = 'public' and table_name in ('ai_conversazioni', 'promemoria_personali')) tabelle,
       (select count(*) from information_schema.columns where table_schema = 'public' and table_name = 'ai_messaggi' and column_name in ('conversazione_id', 'importante', 'letto_at', 'azione')) colonne,
       (select count(*) from public.ai_messaggi where conversazione_id is null) messaggi_senza_chat,
       (select count(*) from pg_proc where proname in ('ai_chiave_conv', 'ai_conversazione_corrente', 'ai_segna_importanti_letti', 'promemoria_controlli')) funzioni;
