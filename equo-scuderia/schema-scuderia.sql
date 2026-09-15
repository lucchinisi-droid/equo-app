-- ══════════════════════════════════════════════════════
-- EQUO SCUDERIA — schema Modulo 1: centri, membri, RLS sicura
-- Da eseguire sullo STESSO progetto Supabase "equo-prod" già in uso
-- (stessa auth.users, stessa tabella profiles condivisa tra Equo App e Equo Scuderia)
-- Incolla ed esegui in Supabase → SQL Editor → New query → Run
-- ══════════════════════════════════════════════════════

create table if not exists centri (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  indirizzo text,
  telefono text,
  join_code text unique not null,
  owner_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists scuderia_membri (
  id uuid primary key default gen_random_uuid(),
  centro_id uuid not null references centri(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  ruolo text not null check (ruolo in ('admin','istruttore','veterinario','maniscalco','allievo')),
  nome_visualizzato text,
  created_at timestamptz not null default now(),
  unique (centro_id, user_id)
);

create index if not exists idx_membri_centro on scuderia_membri(centro_id);
create index if not exists idx_membri_user on scuderia_membri(user_id);

-- ══════════════════════════════════════════════════════
-- Funzioni SECURITY DEFINER — evitano la ricorsione RLS
-- (una policy su scuderia_membri non può interrogare scuderia_membri
-- direttamente: si blocca in un loop. Queste funzioni girano con
-- privilegi elevati e "bypassano" la RLS al loro interno, in sicurezza,
-- perché la logica dentro è comunque vincolata a auth.uid()).
-- ══════════════════════════════════════════════════════

create or replace function public.is_member_of_centro(check_centro_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from scuderia_membri
    where centro_id = check_centro_id and user_id = auth.uid()
  );
$$;

create or replace function public.is_admin_of_centro(check_centro_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from scuderia_membri
    where centro_id = check_centro_id and user_id = auth.uid() and ruolo = 'admin'
  );
$$;

-- ══════════════════════════════════════════════════════
-- RLS
-- ══════════════════════════════════════════════════════

alter table centri enable row level security;
alter table scuderia_membri enable row level security;

create policy "centri_select_member" on centri for select
  using (is_member_of_centro(id) or owner_id = auth.uid());
create policy "centri_insert_own" on centri for insert
  with check (owner_id = auth.uid());
create policy "centri_update_admin" on centri for update
  using (is_admin_of_centro(id));

create policy "membri_select_same_centro" on scuderia_membri for select
  using (is_member_of_centro(centro_id));
create policy "membri_update_admin" on scuderia_membri for update
  using (is_admin_of_centro(centro_id));
create policy "membri_delete_admin" on scuderia_membri for delete
  using (is_admin_of_centro(centro_id) and user_id <> auth.uid());

-- NB: nessuna policy INSERT diretta su scuderia_membri.
-- Gli inserimenti avvengono SOLO tramite:
--  1) il trigger sotto (creazione centro → l'owner diventa admin)
--  2) la funzione join_centro_by_code() (iscrizione con codice invito)
-- Questo impedisce a chiunque di auto-assegnarsi un ruolo/centro
-- scrivendo direttamente sulla tabella dal client.

-- ══════════════════════════════════════════════════════
-- Trigger: alla creazione di un centro, l'owner diventa admin
-- ══════════════════════════════════════════════════════

create or replace function public.handle_new_centro()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into scuderia_membri (centro_id, user_id, ruolo)
  values (new.id, new.owner_id, 'admin')
  on conflict (centro_id, user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_centro_created on centri;
create trigger on_centro_created
  after insert on centri
  for each row execute function public.handle_new_centro();

-- ══════════════════════════════════════════════════════
-- RPC: iscrizione con codice invito (valida il codice server-side,
-- vieta l'auto-assegnazione del ruolo 'admin')
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
begin
  if p_ruolo not in ('istruttore','veterinario','maniscalco','allievo') then
    raise exception 'Ruolo non valido per iscrizione autonoma';
  end if;

  select * into v_centro from centri where join_code = p_join_code;
  if not found then
    raise exception 'Codice invito non valido';
  end if;

  insert into scuderia_membri (centro_id, user_id, ruolo, nome_visualizzato)
  values (v_centro.id, auth.uid(), p_ruolo, p_nome_visualizzato)
  on conflict (centro_id, user_id) do update set ruolo = excluded.ruolo;

  return query select v_centro.id, v_centro.nome;
end;
$$;

grant execute on function public.join_centro_by_code(text, text, text) to authenticated;
grant execute on function public.is_member_of_centro(uuid) to authenticated;
grant execute on function public.is_admin_of_centro(uuid) to authenticated;
