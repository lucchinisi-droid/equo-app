-- LIBRETTO a tre schede: Identità · Salute · Sport (16/10/2026)
-- Eseguire UNA volta nel SQL editor di Supabase. Non cancella nulla.

-- 1) Identità: cavallo verificato / dichiarato, foto di riconoscimento, visibilità per professionista
alter table public.horses add column if not exists microchip_verificato boolean not null default false;
alter table public.horses add column if not exists foto_riconoscimento jsonb not null default '{}'::jsonb;   -- {"fronte":"path","sinistra":"path","destra":"path","particolari":"path"}
alter table public.horses add column if not exists libretto_visibilita jsonb not null default '{}'::jsonb;   -- {"<user_id professionista>":{"identita":true,"salute":true,"sport":false}}

-- 2) Storico dei cambi importanti (microchip, nome, codice): resta a vita, segue il cavallo
create table if not exists public.cavalli_storico (
  id uuid primary key default gen_random_uuid(),
  horse_id uuid not null references public.horses(id) on delete cascade,
  campo text not null,
  valore_prima text,
  valore_dopo text,
  autore_id uuid default auth.uid(),
  created_at timestamptz not null default now()
);
create index if not exists cavalli_storico_idx on public.cavalli_storico (horse_id, created_at desc);
alter table public.cavalli_storico enable row level security;
drop policy if exists cavalli_storico_select on public.cavalli_storico;
create policy cavalli_storico_select on public.cavalli_storico for select to authenticated
  using (exists (select 1 from public.horses h where h.id = horse_id and h.owner_id = auth.uid()));
-- nessuna insert/update/delete dal client: scrive solo il trigger

create or replace function public.horses_storico_cambi() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.microchip is distinct from old.microchip then
    insert into cavalli_storico (horse_id, campo, valore_prima, valore_dopo) values (new.id, 'microchip', old.microchip, new.microchip);
    new.microchip_verificato := false;   -- un microchip cambiato torna «dichiarato» finché un professionista non lo verifica
  end if;
  if new.name is distinct from old.name then
    insert into cavalli_storico (horse_id, campo, valore_prima, valore_dopo) values (new.id, 'nome', old.name, new.name);
  end if;
  return new;
end $$;
drop trigger if exists trg_horses_storico_cambi on public.horses;
create trigger trg_horses_storico_cambi before update on public.horses
  for each row execute function public.horses_storico_cambi();

-- 3) Sport (solo Premium): discipline e risultati
create table if not exists public.cavalli_sport (
  id uuid primary key default gen_random_uuid(),
  horse_id uuid not null references public.horses(id) on delete cascade,
  disciplina text not null,
  livello text,
  tessera text,
  note text,
  created_at timestamptz not null default now()
);
create table if not exists public.sport_voci (
  id uuid primary key default gen_random_uuid(),
  horse_id uuid not null references public.horses(id) on delete cascade,
  data date not null default current_date,
  tipo text not null default 'gara' check (tipo in ('gara','allenamento','titolo','altro')),
  titolo text not null,
  luogo text,
  esito text,
  note text,
  created_at timestamptz not null default now()
);
create index if not exists cavalli_sport_idx on public.cavalli_sport (horse_id);
create index if not exists sport_voci_idx on public.sport_voci (horse_id, data desc);
alter table public.cavalli_sport enable row level security;
alter table public.sport_voci enable row level security;
do $$ declare t text; begin
  foreach t in array array['cavalli_sport','sport_voci'] loop
    execute format('drop policy if exists %I_sel on public.%I', t, t);
    execute format('drop policy if exists %I_ins on public.%I', t, t);
    execute format('drop policy if exists %I_upd on public.%I', t, t);
    execute format($p$create policy %I_sel on public.%I for select to authenticated using (exists (select 1 from public.horses h where h.id = horse_id and h.owner_id = auth.uid()))$p$, t, t);
    execute format($p$create policy %I_ins on public.%I for insert to authenticated with check (coalesce((select piano from public.profiles where id = auth.uid()),'free') = 'premium' and exists (select 1 from public.horses h where h.id = horse_id and h.owner_id = auth.uid()))$p$, t, t);
    execute format($p$create policy %I_upd on public.%I for update to authenticated using (exists (select 1 from public.horses h where h.id = horse_id and h.owner_id = auth.uid())) with check (exists (select 1 from public.horses h where h.id = horse_id and h.owner_id = auth.uid()))$p$, t, t);
  end loop;
end $$;
-- niente delete: i dati sportivi restano nello storico del cavallo
