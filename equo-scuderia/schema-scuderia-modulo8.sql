-- ══════════════════════════════════════════════════════
-- EQUO SCUDERIA — schema Contatti utili
-- Incolla ed esegui in Supabase → SQL Editor.
-- ══════════════════════════════════════════════════════

create table if not exists scuderia_contatti (
  id uuid primary key default gen_random_uuid(),
  centro_id uuid not null references centri(id) on delete cascade,
  tipo text not null check (tipo in ('istruttore_esterno','veterinario','maniscalco','commercialista','giardiniere','manutenzione','fornitore','altro')),
  tipo_altro text,
  nome text not null,
  telefono text,
  email text,
  note text,
  created_at timestamptz not null default now()
);
create index if not exists idx_contatti_centro on scuderia_contatti(centro_id);

alter table scuderia_contatti enable row level security;

-- Tutti i membri vedono la rubrica, solo l'admin la gestisce.
create policy "contatti_select_member" on scuderia_contatti for select
  using (is_member_of_centro(centro_id));
create policy "contatti_insert_admin" on scuderia_contatti for insert
  with check (is_admin_of_centro(centro_id));
create policy "contatti_update_admin" on scuderia_contatti for update
  using (is_admin_of_centro(centro_id));
create policy "contatti_delete_admin" on scuderia_contatti for delete
  using (is_admin_of_centro(centro_id));
