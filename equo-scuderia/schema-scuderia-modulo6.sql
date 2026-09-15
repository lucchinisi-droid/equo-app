-- ══════════════════════════════════════════════════════
-- EQUO SCUDERIA — schema Modulo Home:
-- post-it promemoria + sblocco cancellazione eventi sanitari a tutto il team
-- Incolla ed esegui in Supabase → SQL Editor.
-- ══════════════════════════════════════════════════════

-- Prima: solo l'admin poteva cancellare un evento sanitario.
-- Ora chi registra un evento può anche correggerlo/cancellarlo.
drop policy if exists "eventi_delete_admin" on scuderia_eventi_sanitari;
create policy "eventi_delete_member" on scuderia_eventi_sanitari for delete
  using (is_member_of_centro(centro_id));

-- ---------- POST-IT PROMEMORIA ----------
create table if not exists scuderia_note (
  id uuid primary key default gen_random_uuid(),
  centro_id uuid not null references centri(id) on delete cascade,
  testo text not null,
  colore text not null default 'giallo' check (colore in ('giallo','rosa','blu')),
  created_at timestamptz not null default now()
);
create index if not exists idx_note_centro on scuderia_note(centro_id);

alter table scuderia_note enable row level security;
create policy "note_select_member" on scuderia_note for select
  using (is_member_of_centro(centro_id));
create policy "note_insert_member" on scuderia_note for insert
  with check (is_member_of_centro(centro_id));
create policy "note_delete_member" on scuderia_note for delete
  using (is_member_of_centro(centro_id));
