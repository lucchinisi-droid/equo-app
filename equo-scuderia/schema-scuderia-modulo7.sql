-- ══════════════════════════════════════════════════════
-- EQUO SCUDERIA — ordinamento personalizzato post-it
-- Incolla ed esegui in Supabase → SQL Editor.
-- ══════════════════════════════════════════════════════

alter table scuderia_note add column if not exists ordine integer;

update scuderia_note set ordine = sub.rn
from (
  select id, row_number() over (partition by centro_id order by created_at) - 1 as rn
  from scuderia_note
) sub
where scuderia_note.id = sub.id and scuderia_note.ordine is null;

alter table scuderia_note alter column ordine set default 0;
