-- DIARIO del cavallo · fase 1 (personale). Nessun cancellamento fisico: la voce si nasconde.
insert into storage.buckets (id, name, public) values ('diario-media','diario-media',false) on conflict (id) do nothing;

create table if not exists public.diario_voci (
  id uuid primary key default gen_random_uuid(),
  horse_id uuid not null references public.horses(id) on delete cascade,
  autore_id uuid not null default auth.uid(),
  tipo text not null check (tipo in ('foto','nota','vocale','video')),
  categoria text check (categoria in ('allenamento','passeggiata','lezione','cura','traguardo','altro')),
  testo text,
  media_path text,
  media_mime text,
  media_byte bigint,
  meteo_temp numeric,
  meteo_desc text,
  luogo text,
  privacy text not null default 'solo_io' check (privacy in ('solo_io','persone','scuderia','community')),
  nascosta boolean not null default false,
  data_voce timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index if not exists diario_voci_cavallo_idx on public.diario_voci (horse_id, data_voce desc);
alter table public.diario_voci enable row level security;

create policy diario_voci_select on public.diario_voci for select to authenticated
  using (autore_id = auth.uid());
create policy diario_voci_insert on public.diario_voci for insert to authenticated
  with check (autore_id = auth.uid() and exists (select 1 from public.horses h where h.id = horse_id and h.owner_id = auth.uid()));
create policy diario_voci_update on public.diario_voci for update to authenticated
  using (autore_id = auth.uid()) with check (autore_id = auth.uid());
-- niente policy delete: lo storico resta (la voce si nasconde con nascosta = true)

create policy diario_media_select on storage.objects for select to authenticated
  using (bucket_id = 'diario-media' and (storage.foldername(name))[1] = auth.uid()::text);
create policy diario_media_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'diario-media' and (storage.foldername(name))[1] = auth.uid()::text);
