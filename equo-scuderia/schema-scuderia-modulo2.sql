-- ══════════════════════════════════════════════════════
-- EQUO SCUDERIA — schema Modulo 2: cavalli, eventi sanitari
-- Stesso progetto Supabase "equo-prod", stesse funzioni helper
-- create prima con schema-scuderia.sql (is_member_of_centro, is_admin_of_centro)
-- Incolla ed esegui in Supabase → SQL Editor → New query → Run
-- ══════════════════════════════════════════════════════

create table if not exists scuderia_cavalli (
  id uuid primary key default gen_random_uuid(),
  centro_id uuid not null references centri(id) on delete cascade,
  nome text not null,
  razza text,
  mantello text,
  data_nascita date,
  microchip text,
  proprietario text,
  note text,
  created_at timestamptz not null default now()
);

create table if not exists scuderia_eventi_sanitari (
  id uuid primary key default gen_random_uuid(),
  centro_id uuid not null references centri(id) on delete cascade,
  cavallo_id uuid not null references scuderia_cavalli(id) on delete cascade,
  tipo text not null check (tipo in ('vaccino','coggins','ferratura','sverminazione')),
  data_evento date not null,
  data_scadenza date,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists idx_cavalli_centro on scuderia_cavalli(centro_id);
create index if not exists idx_eventi_centro on scuderia_eventi_sanitari(centro_id);
create index if not exists idx_eventi_cavallo on scuderia_eventi_sanitari(cavallo_id);

alter table scuderia_cavalli enable row level security;
alter table scuderia_eventi_sanitari enable row level security;

-- Cavalli: tutti i membri del centro vedono/gestiscono l'anagrafica,
-- solo l'admin può eliminare un cavallo (con cascade sul suo storico).
create policy "cavalli_select_member" on scuderia_cavalli for select
  using (is_member_of_centro(centro_id));
create policy "cavalli_insert_member" on scuderia_cavalli for insert
  with check (is_member_of_centro(centro_id));
create policy "cavalli_update_member" on scuderia_cavalli for update
  using (is_member_of_centro(centro_id));
create policy "cavalli_delete_admin" on scuderia_cavalli for delete
  using (is_admin_of_centro(centro_id));

-- Eventi sanitari: stessa logica — tutti i membri registrano eventi
-- (istruttori, veterinari, maniscalchi), solo l'admin elimina.
create policy "eventi_select_member" on scuderia_eventi_sanitari for select
  using (is_member_of_centro(centro_id));
create policy "eventi_insert_member" on scuderia_eventi_sanitari for insert
  with check (is_member_of_centro(centro_id));
create policy "eventi_update_member" on scuderia_eventi_sanitari for update
  using (is_member_of_centro(centro_id));
create policy "eventi_delete_admin" on scuderia_eventi_sanitari for delete
  using (is_admin_of_centro(centro_id));
