-- Equo Scuderia · SQL 49 · Paddock (9/11/2026)
-- Oltre ai box, i paddock: un nome, una capienza e più cavalli insieme.
-- Un cavallo può avere il box E stare in un paddock di giorno; oppure vivere solo nel paddock.
-- Box + paddock condividono lo stesso limite del pacchetto (START 0, ADVANCE 20, PREMIUM 100).
-- Capienza superata: si può aggiungere lo stesso, il gestionale segnala «sovraffollato».
-- Icone del giorno: quelle del paddock (fieno, acqua, pulito) valgono per tutto il paddock;
-- quelle di ogni cavallo (pasti, farmaco…) seguono il cavallo come nei box.

create table if not exists scuderia_paddock (
  id uuid primary key default gen_random_uuid(),
  centro_id uuid not null references centri(id) on delete cascade,
  nome text not null check (char_length(btrim(nome)) between 1 and 60),
  zona text check (char_length(zona) <= 60),
  capienza int not null default 4 check (capienza between 1 and 60),
  manutenzione boolean not null default false,
  manutenzione_motivo text check (manutenzione_motivo in ('pulizia', 'riparazione', 'terreno', 'altro')),
  manutenzione_nota text check (char_length(manutenzione_nota) <= 300),
  manutenzione_fino date,
  ordine int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists scuderia_paddock_centro_idx on scuderia_paddock (centro_id, ordine, nome);

create table if not exists scuderia_paddock_cavalli (
  id uuid primary key default gen_random_uuid(),
  centro_id uuid not null references centri(id) on delete cascade,
  paddock_id uuid not null references scuderia_paddock(id) on delete cascade,
  cavallo_id uuid not null unique references scuderia_cavalli(id) on delete cascade,  -- un paddock alla volta
  dal timestamptz not null default now()
);
create index if not exists scuderia_paddock_cavalli_idx on scuderia_paddock_cavalli (paddock_id);

-- limite condiviso box + paddock e controlli
create or replace function scuderia_paddock_prima() returns trigger
language plpgsql security definer set search_path = public as $$
declare lim int; n int;
begin
  new.updated_at := now();
  new.nome := btrim(new.nome);
  lim := box_limite(new.centro_id);
  if lim = 0 then raise exception 'Box / Stalla e paddock sono inclusi da ADVANCE: passa ad ADVANCE per usarli.'; end if;
  if tg_op = 'INSERT' then
    select (select count(*) from scuderia_box where centro_id = new.centro_id) + (select count(*) from scuderia_paddock where centro_id = new.centro_id) into n;
    if n >= lim then raise exception 'Hai raggiunto il massimo di % posti (box + paddock) del tuo pacchetto%.', lim, case when lim < 100 then ': con PREMIUM arrivi a 100' else '' end; end if;
  end if;
  if new.manutenzione = false then new.manutenzione_motivo := null; new.manutenzione_nota := null; new.manutenzione_fino := null; end if;
  return new;
end $$;
drop trigger if exists trg_scuderia_paddock_prima on scuderia_paddock;
create trigger trg_scuderia_paddock_prima before insert or update on scuderia_paddock for each row execute function scuderia_paddock_prima();

create or replace function scuderia_paddock_cavalli_prima() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from scuderia_paddock p where p.id = new.paddock_id and p.centro_id = new.centro_id) then raise exception 'Paddock non valido.'; end if;
  if not exists (select 1 from scuderia_cavalli c where c.id = new.cavallo_id and c.centro_id = new.centro_id and c.uscito_il is null) then raise exception 'Cavallo non valido.'; end if;
  if exists (select 1 from scuderia_paddock p where p.id = new.paddock_id and p.manutenzione) then raise exception 'Il paddock è in manutenzione.'; end if;
  if tg_op = 'INSERT' or new.paddock_id is distinct from old.paddock_id then new.dal := now(); end if;
  return new;
end $$;
drop trigger if exists trg_scuderia_paddock_cavalli_prima on scuderia_paddock_cavalli;
create trigger trg_scuderia_paddock_cavalli_prima before insert or update on scuderia_paddock_cavalli for each row execute function scuderia_paddock_cavalli_prima();

-- un cavallo che esce dal centro lascia il paddock
create or replace function equo_paddock_uscita() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.uscito_il is not null and old.uscito_il is null then delete from scuderia_paddock_cavalli where cavallo_id = new.id; end if;
  return null;
end $$;
drop trigger if exists trg_paddock_uscita on scuderia_cavalli;
create trigger trg_paddock_uscita after update of uscito_il on scuderia_cavalli for each row execute function equo_paddock_uscita();

-- il limite dei box ora conta anche i paddock
create or replace function scuderia_box_prima() returns trigger
language plpgsql security definer set search_path = public as $$
declare lim int; n int;
begin
  new.updated_at := now();
  if coalesce(current_setting('equo.box', true), '') = 'on' then return new; end if;
  lim := box_limite(new.centro_id);
  if tg_op = 'INSERT' then
    if lim = 0 then raise exception 'Box / Stalla è incluso da ADVANCE: passa ad ADVANCE per usarlo.'; end if;
    select (select count(*) from scuderia_box where centro_id = new.centro_id) + (select count(*) from scuderia_paddock where centro_id = new.centro_id) into n;
    if n >= lim then raise exception 'Hai raggiunto il massimo di % posti (box + paddock) del tuo pacchetto%.', lim, case when lim < 100 then ': con PREMIUM arrivi a 100' else '' end; end if;
  else
    if lim = 0 then raise exception 'Box / Stalla è incluso da ADVANCE: passa ad ADVANCE per usarlo.'; end if;
    if not can_gestire_box(new.centro_id) and (new.numero, new.nome, new.zona, new.cavallo_id, new.assegnato_cavallo_id, new.manutenzione, new.manutenzione_motivo, new.manutenzione_nota, new.manutenzione_fino, new.dispositivo_id)
        is distinct from (old.numero, old.nome, old.zona, old.cavallo_id, old.assegnato_cavallo_id, old.manutenzione, old.manutenzione_motivo, old.manutenzione_nota, old.manutenzione_fino, old.dispositivo_id) then
      raise exception 'Solo l''amministratore o un membro di livello 2-3 può modificare i box.';
    end if;
  end if;
  if new.cavallo_id is not null and not exists (select 1 from scuderia_cavalli c where c.id = new.cavallo_id and c.centro_id = new.centro_id) then
    raise exception 'Cavallo non valido.';
  end if;
  if new.assegnato_cavallo_id is not null and not exists (select 1 from scuderia_cavalli c where c.id = new.assegnato_cavallo_id and c.centro_id = new.centro_id) then
    raise exception 'Cavallo non valido.';
  end if;
  if new.cavallo_id is null then new.stato_cavallo := 'in_box'; end if;
  if tg_op = 'INSERT' or new.stato_cavallo is distinct from old.stato_cavallo or new.cavallo_id is distinct from old.cavallo_id then new.stato_aggiornato_il := now(); end if;
  if new.manutenzione = false then new.manutenzione_motivo := null; new.manutenzione_nota := null; new.manutenzione_fino := null; end if;
  return new;
end $$;

-- icone del giorno anche per i paddock
alter table scuderia_box_attivita add column if not exists paddock_id uuid references scuderia_paddock(id) on delete cascade;
alter table scuderia_box_attivita alter column box_id drop not null;
alter table scuderia_box_attivita drop constraint if exists scuderia_box_attivita_dove_check;
alter table scuderia_box_attivita add constraint scuderia_box_attivita_dove_check check (box_id is not null or paddock_id is not null);
create unique index if not exists box_att_paddock_tipo_giorno on scuderia_box_attivita (paddock_id, tipo, giorno) where cavallo_id is null and paddock_id is not null;

create or replace function scuderia_box_attivita_prima() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.box_id is not null then
    if not exists (select 1 from scuderia_box b where b.id = new.box_id and b.centro_id = new.centro_id) then raise exception 'Box non valido.'; end if;
  elsif new.paddock_id is not null then
    if not exists (select 1 from scuderia_paddock p where p.id = new.paddock_id and p.centro_id = new.centro_id) then raise exception 'Paddock non valido.'; end if;
    if new.cavallo_id is not null and not exists (select 1 from scuderia_paddock_cavalli x where x.paddock_id = new.paddock_id and x.cavallo_id = new.cavallo_id) then
      raise exception 'Il cavallo non è in questo paddock.'; end if;
  else
    raise exception 'Manca il box o il paddock.';
  end if;
  if box_limite(new.centro_id) = 0 then raise exception 'Box / Stalla è incluso da ADVANCE.'; end if;
  if new.cavallo_id is null and new.box_id is not null then select cavallo_id into new.cavallo_id from scuderia_box where id = new.box_id; end if;
  if auth.uid() is not null then
    new.fatto_da := auth.uid();
    new.fatto_da_nome := equo_nome_staff(new.centro_id, auth.uid());
    new.fatto_il := now();
    new.fonte := 'manuale';
    new.giorno := (now() at time zone 'Europe/Rome')::date;
  end if;
  return new;
end $$;

-- permessi: come i box (vedono tutti i membri del centro, gestiscono admin e livelli 2-3)
alter table scuderia_paddock enable row level security;
alter table scuderia_paddock_cavalli enable row level security;
drop policy if exists scuderia_paddock_select on scuderia_paddock;
drop policy if exists scuderia_paddock_insert on scuderia_paddock;
drop policy if exists scuderia_paddock_update on scuderia_paddock;
drop policy if exists scuderia_paddock_delete on scuderia_paddock;
create policy scuderia_paddock_select on scuderia_paddock for select using (is_member_of_centro(centro_id) or can_gestire_box(centro_id));
create policy scuderia_paddock_insert on scuderia_paddock for insert with check (can_gestire_box(centro_id));
create policy scuderia_paddock_update on scuderia_paddock for update using (can_gestire_box(centro_id)) with check (can_gestire_box(centro_id));
create policy scuderia_paddock_delete on scuderia_paddock for delete using (can_gestire_box(centro_id));
drop policy if exists scuderia_paddock_cav_select on scuderia_paddock_cavalli;
drop policy if exists scuderia_paddock_cav_insert on scuderia_paddock_cavalli;
drop policy if exists scuderia_paddock_cav_update on scuderia_paddock_cavalli;
drop policy if exists scuderia_paddock_cav_delete on scuderia_paddock_cavalli;
create policy scuderia_paddock_cav_select on scuderia_paddock_cavalli for select using (is_member_of_centro(centro_id) or can_gestire_box(centro_id));
create policy scuderia_paddock_cav_insert on scuderia_paddock_cavalli for insert with check (can_gestire_box(centro_id));
create policy scuderia_paddock_cav_update on scuderia_paddock_cavalli for update using (can_gestire_box(centro_id)) with check (can_gestire_box(centro_id));
create policy scuderia_paddock_cav_delete on scuderia_paddock_cavalli for delete using (can_gestire_box(centro_id));
grant select, insert, update, delete on scuderia_paddock, scuderia_paddock_cavalli to authenticated;

-- aggiornamento in diretta (modalità stalla sul tablet)
do $$ begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'scuderia_paddock') then
    alter publication supabase_realtime add table scuderia_paddock; end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'scuderia_paddock_cavalli') then
    alter publication supabase_realtime add table scuderia_paddock_cavalli; end if;
end $$;

select 'SQL 49 paddock: ok' as esito;
