-- ══════════════════════════════════════════════════════
-- EQUO SCUDERIA — schema Modulo Home:
-- post-it promemoria + eventi sanitari: modifica per tutti,
-- cancellazione solo di chi ha creato l'evento (+ admin sempre)
-- Incolla ed esegui in Supabase → SQL Editor.
-- ══════════════════════════════════════════════════════

-- Traccia chi ha registrato ogni evento sanitario
alter table scuderia_eventi_sanitari
  add column if not exists creato_da uuid references scuderia_membri(id) on delete set null;

-- Funzione di appoggio: restituisce l'id-membro dell'utente corrente in un dato centro
create or replace function public.own_membro_id(check_centro_id uuid)
returns uuid
language sql
security definer
stable
as $$
  select id from scuderia_membri
  where centro_id = check_centro_id and user_id = auth.uid()
  limit 1;
$$;
grant execute on function public.own_membro_id(uuid) to authenticated;

-- Cancellazione evento: solo admin o chi lo ha creato
drop policy if exists "eventi_delete_admin" on scuderia_eventi_sanitari;
drop policy if exists "eventi_delete_member" on scuderia_eventi_sanitari;
create policy "eventi_delete_own_or_admin" on scuderia_eventi_sanitari for delete
  using (
    is_admin_of_centro(centro_id)
    or creato_da = own_membro_id(centro_id)
  );

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
