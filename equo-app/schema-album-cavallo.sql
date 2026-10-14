-- ALBUM FOTO del cavallo (14/10/2026): le foto della scheda diventano copertina di Diario e Home
insert into storage.buckets (id, name, public) values ('cavalli-album','cavalli-album',false) on conflict (id) do nothing;

create table if not exists public.cavalli_album (
  id uuid primary key default gen_random_uuid(),
  horse_id uuid not null references public.horses(id) on delete cascade,
  autore_id uuid not null default auth.uid(),
  path text not null,
  mime text,
  byte bigint,
  copertina boolean not null default false,
  nascosta boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists cavalli_album_cavallo_idx on public.cavalli_album (horse_id, created_at desc);
alter table public.cavalli_album enable row level security;

create policy cavalli_album_select on public.cavalli_album for select to authenticated
  using (exists (select 1 from public.horses h where h.id = horse_id and h.owner_id = auth.uid()));
create policy cavalli_album_insert on public.cavalli_album for insert to authenticated
  with check (autore_id = auth.uid() and exists (select 1 from public.horses h where h.id = horse_id and h.owner_id = auth.uid()));
create policy cavalli_album_update on public.cavalli_album for update to authenticated
  using (exists (select 1 from public.horses h where h.id = horse_id and h.owner_id = auth.uid()))
  with check (exists (select 1 from public.horses h where h.id = horse_id and h.owner_id = auth.uid()));
-- niente delete: la foto si nasconde (nascosta = true)

create policy album_media_select on storage.objects for select to authenticated
  using (bucket_id = 'cavalli-album' and (storage.foldername(name))[1] = auth.uid()::text);
create policy album_media_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'cavalli-album' and (storage.foldername(name))[1] = auth.uid()::text);
