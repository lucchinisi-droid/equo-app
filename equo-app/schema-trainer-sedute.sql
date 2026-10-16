-- APP TRAINER: sedute, video, annotazioni, condivisioni (16/10/2026)
-- Regole: 10 slot Free non cancellabili e non rinnovabili (si consuma uno slot quando la seduta viene INVIATA),
-- video max 60 s nel Free, max 10 cavalli seguiti nel Free, nessuna cancellazione (si nasconde), annotazioni non distruttive.

-- 1) Cavalli seguiti dal trainer (un cavallo può essere su Equo (horse_id) o solo a nome)
create table if not exists public.trainer_cavalli (
  id uuid primary key default gen_random_uuid(),
  trainer_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  horse_id uuid references public.horses(id) on delete set null,
  nome text not null,
  cavaliere text,
  note text,
  archiviato_il timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists trainer_cavalli_idx on public.trainer_cavalli (trainer_id, created_at desc);
alter table public.trainer_cavalli enable row level security;
drop policy if exists trainer_cavalli_sel on public.trainer_cavalli;
drop policy if exists trainer_cavalli_ins on public.trainer_cavalli;
drop policy if exists trainer_cavalli_upd on public.trainer_cavalli;
create policy trainer_cavalli_sel on public.trainer_cavalli for select to authenticated using (trainer_id = auth.uid());
create policy trainer_cavalli_ins on public.trainer_cavalli for insert to authenticated with check (trainer_id = auth.uid());
create policy trainer_cavalli_upd on public.trainer_cavalli for update to authenticated using (trainer_id = auth.uid()) with check (trainer_id = auth.uid());

create or replace function public.trainer_limite_cavalli() returns trigger
language plpgsql security definer set search_path = public as $$
declare n bigint; prem boolean;
begin
  if auth.uid() is null or auth.uid() <> new.trainer_id then return new; end if;
  select coalesce((select piano from profiles where id = new.trainer_id),'free') = 'premium' into prem;
  if prem then return new; end if;
  select count(*) into n from trainer_cavalli where trainer_id = new.trainer_id and archiviato_il is null;
  if n >= 10 then
    raise exception 'LIMITE_CAVALLI_TRAINER: il piano Free comprende 10 cavalli seguiti. Passa a Premium per aggiungerne altri.';
  end if;
  return new;
end $$;
drop trigger if exists trg_trainer_limite_cavalli on public.trainer_cavalli;
create trigger trg_trainer_limite_cavalli before insert on public.trainer_cavalli
  for each row execute function public.trainer_limite_cavalli();

-- 2) Sedute
create table if not exists public.sedute (
  id uuid primary key default gen_random_uuid(),
  trainer_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  cavallo_id uuid references public.trainer_cavalli(id) on delete set null,
  horse_id uuid references public.horses(id) on delete set null,
  titolo text not null,
  note text,
  stato text not null default 'bozza' check (stato in ('bozza','inviata')),
  inviata_il timestamptz,
  nascosta boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists sedute_trainer_idx on public.sedute (trainer_id, created_at desc);
create index if not exists sedute_horse_idx on public.sedute (horse_id);

create table if not exists public.sedute_media (
  id uuid primary key default gen_random_uuid(),
  seduta_id uuid not null references public.sedute(id) on delete cascade,
  path text not null,
  tipo text not null default 'video' check (tipo in ('video','immagine')),
  durata_s numeric,
  mime text,
  byte bigint,
  created_at timestamptz not null default now()
);
create index if not exists sedute_media_idx on public.sedute_media (seduta_id);

create table if not exists public.sedute_annotazioni (
  id uuid primary key default gen_random_uuid(),
  seduta_id uuid not null references public.sedute(id) on delete cascade,
  media_id uuid references public.sedute_media(id) on delete cascade,
  autore_id uuid not null default auth.uid(),
  t_sec numeric not null default 0,
  tipo text not null check (tipo in ('punto','voce','lente','lavagna','rallenta')),
  testo text,
  payload jsonb not null default '{}'::jsonb,   -- lente: {x,y,w,h,zoom}; lavagna: {forme:[...]} ; rallenta: {da,a,vel}
  audio_path text,
  nascosta boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists sedute_ann_idx on public.sedute_annotazioni (seduta_id, t_sec);

create table if not exists public.sedute_condivisioni (
  id uuid primary key default gen_random_uuid(),
  seduta_id uuid not null references public.sedute(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  ruolo text not null default 'proprietario' check (ruolo in ('proprietario','cavaliere','veterinario','maniscalco')),
  visto_il timestamptz,
  created_at timestamptz not null default now(),
  unique (seduta_id, user_id)
);
create index if not exists sedute_cond_user_idx on public.sedute_condivisioni (user_id, created_at desc);

create table if not exists public.sedute_commenti (
  id uuid primary key default gen_random_uuid(),
  seduta_id uuid not null references public.sedute(id) on delete cascade,
  annotazione_id uuid references public.sedute_annotazioni(id) on delete set null,
  autore_id uuid not null default auth.uid(),
  testo text not null,
  created_at timestamptz not null default now()
);
create index if not exists sedute_comm_idx on public.sedute_commenti (seduta_id, created_at);

-- helper: chi può vedere una seduta
create or replace function public.equo_vede_seduta(p_seduta uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from sedute s where s.id = p_seduta and s.trainer_id = auth.uid())
      or exists (select 1 from sedute_condivisioni c join sedute s on s.id = c.seduta_id
                 where c.seduta_id = p_seduta and c.user_id = auth.uid() and s.stato = 'inviata');
$$;

alter table public.sedute enable row level security;
alter table public.sedute_media enable row level security;
alter table public.sedute_annotazioni enable row level security;
alter table public.sedute_condivisioni enable row level security;
alter table public.sedute_commenti enable row level security;

do $$ declare p record; begin
  for p in select policyname, tablename from pg_policies where schemaname='public' and tablename in ('sedute','sedute_media','sedute_annotazioni','sedute_condivisioni','sedute_commenti') loop
    execute format('drop policy %I on public.%I', p.policyname, p.tablename);
  end loop;
end $$;

create policy sedute_sel on public.sedute for select to authenticated using (public.equo_vede_seduta(id));
create policy sedute_ins on public.sedute for insert to authenticated with check (trainer_id = auth.uid() and stato = 'bozza');
create policy sedute_upd on public.sedute for update to authenticated using (trainer_id = auth.uid()) with check (trainer_id = auth.uid());

create policy sedute_media_sel on public.sedute_media for select to authenticated using (public.equo_vede_seduta(seduta_id));
create policy sedute_media_ins on public.sedute_media for insert to authenticated
  with check (exists (select 1 from sedute s where s.id = seduta_id and s.trainer_id = auth.uid()));

create policy sedute_ann_sel on public.sedute_annotazioni for select to authenticated using (public.equo_vede_seduta(seduta_id) and nascosta = false or autore_id = auth.uid());
create policy sedute_ann_ins on public.sedute_annotazioni for insert to authenticated
  with check (autore_id = auth.uid() and (
     exists (select 1 from sedute s where s.id = seduta_id and s.trainer_id = auth.uid())
     or (public.equo_vede_seduta(seduta_id) and coalesce((select piano from profiles where id = auth.uid()),'free') = 'premium')));
create policy sedute_ann_upd on public.sedute_annotazioni for update to authenticated using (autore_id = auth.uid()) with check (autore_id = auth.uid());

create policy sedute_cond_sel on public.sedute_condivisioni for select to authenticated
  using (user_id = auth.uid() or exists (select 1 from sedute s where s.id = seduta_id and s.trainer_id = auth.uid()));
create policy sedute_cond_upd on public.sedute_condivisioni for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy sedute_comm_sel on public.sedute_commenti for select to authenticated using (public.equo_vede_seduta(seduta_id));
create policy sedute_comm_ins on public.sedute_commenti for insert to authenticated with check (autore_id = auth.uid() and public.equo_vede_seduta(seduta_id));
-- nessun delete su nessuna tabella: tutto si nasconde

-- video max 60 s nel Free, durata obbligatoria
create or replace function public.sedute_media_limiti() returns trigger
language plpgsql security definer set search_path = public as $$
declare t uuid;
begin
  select trainer_id into t from sedute where id = new.seduta_id;
  if new.tipo = 'video' and coalesce((select piano from profiles where id = t),'free') <> 'premium' and coalesce(new.durata_s, 0) > 61 then
    raise exception 'VIDEO_TROPPO_LUNGO: nel piano Free il video può durare al massimo 60 secondi.';
  end if;
  return new;
end $$;
drop trigger if exists trg_sedute_media_limiti on public.sedute_media;
create trigger trg_sedute_media_limiti before insert on public.sedute_media for each row execute function public.sedute_media_limiti();

-- una seduta inviata non torna bozza e non cambia trainer; non si toccano gli slot
create or replace function public.sedute_guard() returns trigger
language plpgsql as $$
begin
  if new.trainer_id <> old.trainer_id then raise exception 'Non si cambia il trainer di una seduta'; end if;
  if old.stato = 'inviata' and new.stato <> 'inviata' then raise exception 'Una seduta inviata non torna in bozza'; end if;
  return new;
end $$;
drop trigger if exists trg_sedute_guard on public.sedute;
create trigger trg_sedute_guard before update on public.sedute for each row execute function public.sedute_guard();

-- 3) Slot: usati = sedute inviate (anche se poi nascoste)
create or replace function public.equo_trainer_slot() returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'usati', (select count(*) from sedute where trainer_id = auth.uid() and stato = 'inviata'),
    'limite', case when coalesce((select piano from profiles where id = auth.uid()),'free') = 'premium' then null else 10 end);
$$;

-- 4) Invio: controlla slot e video, condivide col proprietario del cavallo (se su Equo) e con eventuali altri utenti
create or replace function public.equo_invia_seduta(p_seduta uuid, p_destinatari uuid[] default '{}')
returns jsonb language plpgsql security definer set search_path = public as $$
declare s sedute%rowtype; prem boolean; usati bigint; prop uuid; d uuid;
begin
  select * into s from sedute where id = p_seduta and trainer_id = auth.uid();
  if not found then raise exception 'Seduta non trovata'; end if;
  if s.stato = 'inviata' then return jsonb_build_object('ok', true, 'gia_inviata', true); end if;
  if not exists (select 1 from sedute_media where seduta_id = s.id) then raise exception 'SEDUTA_SENZA_VIDEO: aggiungi almeno un video.'; end if;
  prem := coalesce((select piano from profiles where id = auth.uid()),'free') = 'premium';
  select count(*) into usati from sedute where trainer_id = auth.uid() and stato = 'inviata';
  if not prem and usati >= 10 then raise exception 'SLOT_ESAURITI: hai usato i 10 slot di prova. Passa a Premium per continuare.'; end if;
  update sedute set stato = 'inviata', inviata_il = now() where id = s.id;
  if s.horse_id is not null then
    select owner_id into prop from horses where id = s.horse_id;
    if prop is not null and prop <> auth.uid() then
      insert into sedute_condivisioni (seduta_id, user_id, ruolo) values (s.id, prop, 'proprietario') on conflict do nothing;
    end if;
  end if;
  foreach d in array coalesce(p_destinatari, '{}') loop
    if d <> auth.uid() then insert into sedute_condivisioni (seduta_id, user_id, ruolo) values (s.id, d, 'cavaliere') on conflict do nothing; end if;
  end loop;
  return jsonb_build_object('ok', true, 'slot_usati', usati + 1);
end $$;

-- 5) Storage privato per video e note audio: cartella 1 = trainer, cartella 2 = seduta
insert into storage.buckets (id, name, public) values ('sedute-media','sedute-media',false) on conflict (id) do nothing;
drop policy if exists sedute_media_obj_sel on storage.objects;
drop policy if exists sedute_media_obj_ins on storage.objects;
create policy sedute_media_obj_sel on storage.objects for select to authenticated using (
  bucket_id = 'sedute-media' and (
    (storage.foldername(name))[1] = auth.uid()::text
    or exists (select 1 from public.sedute s join public.sedute_condivisioni c on c.seduta_id = s.id
               where c.user_id = auth.uid() and s.stato = 'inviata'
                 and s.trainer_id::text = (storage.foldername(name))[1] and s.id::text = (storage.foldername(name))[2])));
create policy sedute_media_obj_ins on storage.objects for insert to authenticated
  with check (bucket_id = 'sedute-media' and (storage.foldername(name))[1] = auth.uid()::text);

-- 6) Collega un cavallo seguito a un cavallo Equo tramite il suo codice (conta solo il NUMERO, non le lettere)
create or replace function public.equo_trainer_collega_cavallo(p_cavallo uuid, p_codice text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare n bigint; h horses%rowtype;
begin
  if not exists (select 1 from trainer_cavalli where id = p_cavallo and trainer_id = auth.uid()) then raise exception 'Cavallo non trovato'; end if;
  n := nullif(regexp_replace(coalesce(p_codice,''), '\D', '', 'g'), '')::bigint;
  if n is null then raise exception 'CODICE_NON_VALIDO'; end if;
  select * into h from horses where equo_numero = n limit 1;
  if not found then raise exception 'CODICE_NON_TROVATO'; end if;
  update trainer_cavalli set horse_id = h.id where id = p_cavallo;
  -- le sedute già create per questo cavallo seguono il collegamento
  update sedute set horse_id = h.id where cavallo_id = p_cavallo and horse_id is null;
  return jsonb_build_object('ok', true, 'nome', h.name);
end $$;
