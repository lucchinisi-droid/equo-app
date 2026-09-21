-- ══════════════════════════════════════════════════════
-- EQUO SCUDERIA — "Aggiungi membro" (dipendenti diretti)
-- Da eseguire su Supabase → SQL Editor → New query → Run
-- (stesso progetto già usato per centri/scuderia_membri)
-- ══════════════════════════════════════════════════════

-- 1) user_id diventa opzionale: una riga con user_id NULL è un
--    dipendente aggiunto dall'admin ma non ancora registrato ("in attesa")
alter table scuderia_membri alter column user_id drop not null;

-- 2) colonne livello/permessi, se non già presenti (idempotente)
alter table scuderia_membri add column if not exists livello text;
alter table scuderia_membri add column if not exists permessi jsonb default '{}'::jsonb;

-- 3) amplia i ruoli ammessi: segretario, giardiniere, altro
--    (rimuove qualunque vecchio check sulla colonna ruolo e lo ricrea,
--    a prescindere dal nome che aveva)
do $$
declare c record;
begin
  for c in
    select conname from pg_constraint
    where conrelid = 'scuderia_membri'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%ruolo%'
  loop
    execute format('alter table scuderia_membri drop constraint %I', c.conname);
  end loop;
end $$;

alter table scuderia_membri add constraint scuderia_membri_ruolo_check
  check (ruolo in ('admin','istruttore','veterinario','maniscalco','allievo','segretario','giardiniere','collaboratore','altro'));

-- ══════════════════════════════════════════════════════
-- RPC: admin aggiunge un dipendente "in attesa" (senza account)
-- ══════════════════════════════════════════════════════
create or replace function public.add_pending_member(
  p_centro_id uuid,
  p_ruolo text,
  p_nome_visualizzato text,
  p_livello text default '1',
  p_permessi jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
as $$
declare
  v_id uuid;
begin
  if not is_admin_of_centro(p_centro_id) then
    raise exception 'Solo l''amministratore può aggiungere dipendenti';
  end if;
  if p_ruolo not in ('segretario','maniscalco','veterinario','istruttore','giardiniere','altro') then
    raise exception 'Ruolo non valido per un dipendente';
  end if;

  insert into scuderia_membri (centro_id, user_id, ruolo, nome_visualizzato, livello, permessi)
  values (p_centro_id, null, p_ruolo, p_nome_visualizzato, p_livello, p_permessi)
  returning id into v_id;

  return v_id;
end;
$$;

grant execute on function public.add_pending_member(uuid, text, text, text, jsonb) to authenticated;

-- ══════════════════════════════════════════════════════
-- Aggiorna join_centro_by_code: se esiste già una riga "in attesa"
-- con lo stesso ruolo (creata dall'admin), la aggancia invece di
-- crearne una nuova col ruolo di default.
-- ══════════════════════════════════════════════════════
create or replace function public.join_centro_by_code(
  p_join_code text,
  p_ruolo text,
  p_nome_visualizzato text default null
)
returns table(centro_id uuid, nome text)
language plpgsql
security definer
as $$
declare
  v_centro record;
  v_claimed_id uuid;
begin
  if p_ruolo not in ('istruttore','veterinario','maniscalco','allievo','segretario','giardiniere','altro') then
    raise exception 'Ruolo non valido per iscrizione autonoma';
  end if;

  select * into v_centro from centri where join_code = p_join_code;
  if not found then
    raise exception 'Codice invito non valido';
  end if;

  select id into v_claimed_id
  from scuderia_membri
  where centro_id = v_centro.id and user_id is null and ruolo = p_ruolo
  order by created_at asc
  limit 1;

  if v_claimed_id is not null then
    update scuderia_membri
    set user_id = auth.uid(),
        nome_visualizzato = coalesce(nome_visualizzato, p_nome_visualizzato)
    where id = v_claimed_id;
  else
    insert into scuderia_membri (centro_id, user_id, ruolo, nome_visualizzato)
    values (v_centro.id, auth.uid(), p_ruolo, p_nome_visualizzato)
    on conflict (centro_id, user_id) do update set ruolo = excluded.ruolo;
  end if;

  return query select v_centro.id, v_centro.nome;
end;
$$;

grant execute on function public.join_centro_by_code(text, text, text) to authenticated;
