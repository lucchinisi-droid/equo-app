-- Equo: PIANO TERAPEUTICO del veterinario (2 novembre 2026) · SQL 34 · passo 5 della chat «App Veterinario»
-- Decisioni di Simone (2/11):
--  · il veterinario scrive il piano nella scheda della visita: farmaci (dose scritta da lui, via, orari, giorni), cure ed esercizi;
--    per i cavalli DPA il tempo di attesa → «fino a quando»;
--  · il PROPRIETARIO su Equo lo vede solo dopo che il veterinario lo manda; riceve il promemoria all'ora giusta
--    (funzione Netlify «invia-terapie») e, se il veterinario lo chiede, conferma con «Fatto»;
--  · una somministrazione non confermata dopo 12 ORE è «saltata» per il veterinario;
--  · la scuderia (Equo Scuderia) arriva in un secondo passo; senza proprietario su Equo il piano va solo nel referto.
-- Tabelle: piani_terapia, piani_terapia_voci, terapie_somministrazioni. Funzioni: equo_terapia_owner, equo_terapia_puo_vedere,
-- equo_terapia_genera (somministrazioni previste), equo_terapia_fatto (il «Fatto» del proprietario o del veterinario).
-- Rieseguibile.

-- 1 · tabelle -------------------------------------------------------------------------------------
create table if not exists public.piani_terapia (
  id uuid primary key default gen_random_uuid(),
  professionista_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  visita_id uuid references public.visite_pro(id) on delete set null,
  cliente_id uuid references public.clienti_mascalcia(id) on delete set null,
  cavallo_cliente_id uuid references public.cavalli_clienti_mascalcia(id) on delete set null,
  horse_id uuid references public.horses(id) on delete set null,
  cavallo_nome text,
  stato text not null default 'bozza' check (stato in ('bozza','attivo','sospeso','concluso')),
  chiedi_conferme boolean not null default false,
  attesa_fino date,                                  -- DPA: fine del tempo di attesa (calcolata dall'app)
  note text check (note is null or length(note) <= 1000),
  inviato_il timestamptz,                            -- da qui lo vede il proprietario
  creato_il timestamptz not null default now(),
  aggiornato_il timestamptz not null default now(),
  check (cavallo_cliente_id is not null or horse_id is not null)
);
create index if not exists piani_terapia_pro_idx on public.piani_terapia (professionista_id, stato);
create index if not exists piani_terapia_cavcli_idx on public.piani_terapia (cavallo_cliente_id) where stato in ('attivo','sospeso');
create index if not exists piani_terapia_horse_idx on public.piani_terapia (horse_id) where stato in ('attivo','sospeso');
create index if not exists piani_terapia_visita_idx on public.piani_terapia (visita_id);

create table if not exists public.piani_terapia_voci (
  id uuid primary key default gen_random_uuid(),
  piano_id uuid not null references public.piani_terapia(id) on delete cascade,
  ordine int not null default 0,
  tipo text not null default 'farmaco' check (tipo in ('farmaco','cura','esercizio','riposo','altro')),
  nome text not null check (length(nome) between 1 and 120),
  dose text check (dose is null or length(dose) <= 120),           -- scritta dal veterinario: Equo non calcola dosi
  via text check (via is null or length(via) <= 40),
  orari text[] not null default '{}' check (coalesce(array_length(orari, 1), 0) <= 6),   -- 'HH:MM', ora italiana
  ogni_giorni int not null default 1 check (ogni_giorni between 1 and 60),
  giorni int not null default 1 check (giorni between 1 and 365),
  inizio date not null default current_date,
  attesa_giorni int check (attesa_giorni is null or attesa_giorni between 0 and 400),   -- DPA
  note text check (note is null or length(note) <= 300),
  creato_il timestamptz not null default now()
);
create index if not exists piani_terapia_voci_piano_idx on public.piani_terapia_voci (piano_id, ordine);

create table if not exists public.terapie_somministrazioni (
  id uuid primary key default gen_random_uuid(),
  piano_id uuid not null references public.piani_terapia(id) on delete cascade,
  voce_id uuid not null references public.piani_terapia_voci(id) on delete cascade,
  previsto_il timestamptz not null,
  fatto_il timestamptz,
  fatto_da uuid references auth.users(id) on delete set null,
  nota text check (nota is null or length(nota) <= 200),
  avvisato_il timestamptz,                           -- promemoria mandato (invia-terapie)
  unique (voce_id, previsto_il)
);
create index if not exists terapie_somm_piano_idx on public.terapie_somministrazioni (piano_id, previsto_il);
create index if not exists terapie_somm_da_avvisare_idx on public.terapie_somministrazioni (previsto_il) where fatto_il is null and avvisato_il is null;

-- 2 · chi è il proprietario e chi vede ----------------------------------------------------------------
-- proprietario su Equo: owner del cavallo Equo; altrimenti il cliente collegato (persona, non scuderia) del cavallo del veterinario
create or replace function public.equo_terapia_owner(p_piano uuid) returns uuid
language sql stable security definer set search_path to 'public' as $$
  select coalesce(
    (select h.owner_id from piani_terapia p left join cavalli_clienti_mascalcia cv on cv.id = p.cavallo_cliente_id
       join horses h on h.id = coalesce(p.horse_id, cv.horse_id) where p.id = p_piano),
    (select c.cliente_user_id from piani_terapia p join cavalli_clienti_mascalcia cv on cv.id = p.cavallo_cliente_id
       join clienti_mascalcia c on c.id = cv.cliente_mascalcia_id
      where p.id = p_piano and c.centro_id is null and coalesce(c.tipo_cliente, 'proprietario') <> 'struttura'),
    (select c.cliente_user_id from piani_terapia p join clienti_mascalcia c on c.id = p.cliente_id
      where p.id = p_piano and c.centro_id is null and coalesce(c.tipo_cliente, 'proprietario') <> 'struttura'))
$$;
create or replace function public.equo_terapia_puo_vedere(p_piano uuid) returns boolean
language sql stable security definer set search_path to 'public' as $$
  select auth.uid() is not null and exists (select 1 from piani_terapia p where p.id = p_piano and (
    p.professionista_id = auth.uid()
    or (p.inviato_il is not null and p.stato <> 'bozza' and equo_terapia_owner(p.id) = auth.uid())))
$$;
revoke all on function public.equo_terapia_owner(uuid) from public, anon;
grant execute on function public.equo_terapia_puo_vedere(uuid) to authenticated;

-- 3 · regole di accesso: scrive solo il veterinario; il proprietario legge (e conferma con equo_terapia_fatto) -----
alter table public.piani_terapia enable row level security;
alter table public.piani_terapia_voci enable row level security;
alter table public.terapie_somministrazioni enable row level security;

drop policy if exists piani_terapia_leggi on public.piani_terapia;
create policy piani_terapia_leggi on public.piani_terapia for select to authenticated using (public.equo_terapia_puo_vedere(id));
drop policy if exists piani_terapia_scrivi on public.piani_terapia;
create policy piani_terapia_scrivi on public.piani_terapia for all to authenticated
  using (professionista_id = auth.uid()) with check (professionista_id = auth.uid());

drop policy if exists piani_terapia_voci_leggi on public.piani_terapia_voci;
create policy piani_terapia_voci_leggi on public.piani_terapia_voci for select to authenticated using (public.equo_terapia_puo_vedere(piano_id));
drop policy if exists piani_terapia_voci_scrivi on public.piani_terapia_voci;
create policy piani_terapia_voci_scrivi on public.piani_terapia_voci for all to authenticated
  using (exists (select 1 from piani_terapia p where p.id = piano_id and p.professionista_id = auth.uid()))
  with check (exists (select 1 from piani_terapia p where p.id = piano_id and p.professionista_id = auth.uid()));

drop policy if exists terapie_somm_leggi on public.terapie_somministrazioni;
create policy terapie_somm_leggi on public.terapie_somministrazioni for select to authenticated using (public.equo_terapia_puo_vedere(piano_id));
-- niente scrittura diretta: le somministrazioni le crea equo_terapia_genera e le conferma equo_terapia_fatto

-- 4 · somministrazioni previste (dal piano attivo, solo future) -------------------------------------
create or replace function public.equo_terapia_genera(p_piano uuid) returns int
language plpgsql security definer set search_path to 'public' as $$
declare v record; g int; o text; t timestamptz; n int := 0; st text;
begin
  select stato into st from piani_terapia where id = p_piano and professionista_id = auth.uid();
  if st is null then raise exception 'non_autorizzato'; end if;
  -- le previste future non fatte si rifanno sempre (voci cambiate, piano sospeso o concluso)
  delete from terapie_somministrazioni where piano_id = p_piano and fatto_il is null and previsto_il > now();
  if st <> 'attivo' then return 0; end if;
  for v in select * from piani_terapia_voci where piano_id = p_piano and coalesce(array_length(orari, 1), 0) > 0 loop
    for g in 0 .. v.giorni - 1 loop
      continue when g % greatest(v.ogni_giorni, 1) <> 0;
      foreach o in array v.orari loop
        continue when o !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$';
        t := ((v.inizio + g)::text || ' ' || o)::timestamp at time zone 'Europe/Rome';
        continue when t <= now();
        insert into terapie_somministrazioni (piano_id, voce_id, previsto_il) values (p_piano, v.id, t) on conflict (voce_id, previsto_il) do nothing;
        if found then n := n + 1; end if;
      end loop;
    end loop;
  end loop;
  return n;
end $$;

-- 5 · «Fatto» (o «non ancora») del proprietario o del veterinario --------------------------------------
create or replace function public.equo_terapia_fatto(p_id uuid, p_fatto boolean default true, p_nota text default null)
returns boolean language plpgsql security definer set search_path to 'public' as $$
declare s record;
begin
  select * into s from terapie_somministrazioni where id = p_id;
  if not found or not equo_terapia_puo_vedere(s.piano_id) then return false; end if;
  if s.previsto_il > now() + interval '12 hours' then raise exception 'troppo_presto'; end if;
  update terapie_somministrazioni set fatto_il = case when p_fatto then now() else null end,
    fatto_da = case when p_fatto then auth.uid() else null end, nota = left(nullif(trim(coalesce(p_nota, '')), ''), 200)
   where id = p_id;
  return true;
end $$;

revoke all on function public.equo_terapia_genera(uuid), public.equo_terapia_fatto(uuid, boolean, text) from public, anon;
grant execute on function public.equo_terapia_genera(uuid), public.equo_terapia_fatto(uuid, boolean, text) to authenticated;

-- aggiornato_il automatico
create or replace function public.equo_terapia_aggiornato() returns trigger language plpgsql set search_path to 'public' as $$
begin new.aggiornato_il := now(); return new; end $$;
drop trigger if exists trg_piani_terapia_aggiornato on public.piani_terapia;
create trigger trg_piani_terapia_aggiornato before update on public.piani_terapia for each row execute function public.equo_terapia_aggiornato();
