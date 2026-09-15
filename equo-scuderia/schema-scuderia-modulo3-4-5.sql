-- ══════════════════════════════════════════════════════
-- EQUO SCUDERIA — schema Moduli 3, 4, 5:
-- lezioni, pacchetti/abbonamenti, messaggi
-- Stesso progetto Supabase "equo-prod", riusa is_member_of_centro/is_admin_of_centro
-- (creati con schema-scuderia.sql). Incolla ed esegui in Supabase → SQL Editor.
-- ══════════════════════════════════════════════════════

-- ---------- MODULO 3: LEZIONI & PRENOTAZIONI ----------
create table if not exists scuderia_lezioni (
  id uuid primary key default gen_random_uuid(),
  centro_id uuid not null references centri(id) on delete cascade,
  data date not null,
  ora_inizio time not null,
  istruttore_id uuid references scuderia_membri(id) on delete set null,
  cavallo_id uuid references scuderia_cavalli(id) on delete set null,
  allievo_id uuid references scuderia_membri(id) on delete set null,
  stato text not null default 'prenotata' check (stato in ('prenotata','confermata','completata','annullata')),
  note text,
  created_at timestamptz not null default now()
);
create index if not exists idx_lezioni_centro on scuderia_lezioni(centro_id);
create index if not exists idx_lezioni_data on scuderia_lezioni(data);

alter table scuderia_lezioni enable row level security;
create policy "lezioni_select_member" on scuderia_lezioni for select
  using (is_member_of_centro(centro_id));
create policy "lezioni_insert_member" on scuderia_lezioni for insert
  with check (is_member_of_centro(centro_id));
create policy "lezioni_update_member" on scuderia_lezioni for update
  using (is_member_of_centro(centro_id));
create policy "lezioni_delete_admin" on scuderia_lezioni for delete
  using (is_admin_of_centro(centro_id));

-- ---------- MODULO 4: PACCHETTI & ABBONAMENTI ----------
create table if not exists scuderia_pacchetti (
  id uuid primary key default gen_random_uuid(),
  centro_id uuid not null references centri(id) on delete cascade,
  cliente text not null,
  tipo text not null check (tipo in ('carnet','abbonamento','pensione')),
  unita_totali int,
  unita_usate int default 0,
  data_inizio date,
  data_scadenza date,
  prezzo numeric(10,2),
  note text,
  created_at timestamptz not null default now()
);
create index if not exists idx_pacchetti_centro on scuderia_pacchetti(centro_id);

alter table scuderia_pacchetti enable row level security;
create policy "pacchetti_select_member" on scuderia_pacchetti for select
  using (is_member_of_centro(centro_id));
create policy "pacchetti_insert_member" on scuderia_pacchetti for insert
  with check (is_member_of_centro(centro_id));
create policy "pacchetti_update_member" on scuderia_pacchetti for update
  using (is_member_of_centro(centro_id));
create policy "pacchetti_delete_admin" on scuderia_pacchetti for delete
  using (is_admin_of_centro(centro_id));

-- ---------- MODULO 5: COMUNICAZIONI ----------
create table if not exists scuderia_messaggi (
  id uuid primary key default gen_random_uuid(),
  centro_id uuid not null references centri(id) on delete cascade,
  mittente_id uuid references scuderia_membri(id) on delete set null,
  destinatario_tipo text not null check (destinatario_tipo in ('tutti','ruolo','singolo')),
  destinatario_ruolo text,
  destinatario_membro_id uuid references scuderia_membri(id) on delete set null,
  testo text not null,
  priorita text not null default 'normale' check (priorita in ('normale','urgente')),
  created_at timestamptz not null default now()
);
create index if not exists idx_messaggi_centro on scuderia_messaggi(centro_id);

alter table scuderia_messaggi enable row level security;
create policy "messaggi_select_member" on scuderia_messaggi for select
  using (is_member_of_centro(centro_id));
create policy "messaggi_insert_member" on scuderia_messaggi for insert
  with check (is_member_of_centro(centro_id));
create policy "messaggi_delete_admin" on scuderia_messaggi for delete
  using (is_admin_of_centro(centro_id));
