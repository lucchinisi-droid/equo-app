-- Equo: BANNER DELLA HOME DEL MANISCALCO (12 ottobre 2026)
-- Spazio gestito solo da noi (messaggi nostri e, più avanti, sponsor). L'app legge i riquadri attivi;
-- viste e tocchi si contano con equo_banner_evento (una vista al giorno per persona e riquadro).
-- tipo: 'foto' (immagine + frase + logo), 'oggi' (appuntamenti di oggi, automatico), 'hammer' (invito a provare Hammer),
--       'sponsor' (immagine + titolo + testo del tasto + link https)
-- pubblico: 'tutti' | 'free' | 'premium'

create table if not exists public.home_banner (
  id uuid primary key default gen_random_uuid(),
  app text not null default 'maniscalco',
  ordine int not null default 0,
  tipo text not null check (tipo in ('foto','oggi','hammer','sponsor')),
  titolo text,
  testo text,
  immagine text,
  link text check (link is null or link like 'https://%'),
  sponsor text,
  pubblico text not null default 'tutti' check (pubblico in ('tutti','free','premium')),
  dal date,
  al date,
  attivo boolean not null default true,
  creato_il timestamptz not null default now()
);
alter table public.home_banner enable row level security;
drop policy if exists home_banner_lettura on public.home_banner;
create policy home_banner_lettura on public.home_banner for select to authenticated using (attivo);
-- nessuna policy di scrittura: i riquadri li inseriamo noi dal pannello di Supabase

create table if not exists public.home_banner_eventi (
  id bigserial primary key,
  banner_id uuid not null references public.home_banner(id) on delete cascade,
  user_id uuid not null,
  tipo text not null check (tipo in ('vista','tocco')),
  giorno date not null default current_date,
  creato_il timestamptz not null default now()
);
create unique index if not exists home_banner_eventi_vista_giorno on public.home_banner_eventi (banner_id, user_id, giorno) where tipo = 'vista';
create index if not exists home_banner_eventi_banner on public.home_banner_eventi (banner_id, tipo, giorno);
alter table public.home_banner_eventi enable row level security;
-- nessuna policy: si scrive solo con la funzione qui sotto, si legge solo da noi

create or replace function public.equo_banner_evento(p_banner uuid, p_tipo text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null or p_tipo not in ('vista','tocco') then return; end if;
  if not exists (select 1 from home_banner where id = p_banner and attivo) then return; end if;
  insert into home_banner_eventi (banner_id, user_id, tipo) values (p_banner, auth.uid(), p_tipo)
  on conflict do nothing;
end $$;
revoke all on function public.equo_banner_evento(uuid, text) from public;
grant execute on function public.equo_banner_evento(uuid, text) to authenticated;

-- riepilogo per noi: viste (persone diverse al giorno) e tocchi per riquadro
create or replace view public.home_banner_statistiche with (security_invoker = true) as
select b.id, b.ordine, b.tipo, b.titolo, b.sponsor, b.dal, b.al, b.attivo,
       count(*) filter (where e.tipo = 'vista') as viste,
       count(*) filter (where e.tipo = 'tocco') as tocchi,
       count(distinct e.user_id) as persone
from home_banner b left join home_banner_eventi e on e.banner_id = b.id
group by b.id;
revoke all on public.home_banner_statistiche from anon, authenticated;

-- i 3 riquadri di partenza
insert into public.home_banner (app, ordine, tipo, titolo, testo, immagine)
select * from (values
  ('maniscalco', 1, 'foto', 'La cura del cavallo inizia dai dettagli.', null::text, 'assets/banner/cavallo.webp'),
  ('maniscalco', 2, 'oggi', null::text, null::text, null::text),
  ('maniscalco', 3, 'hammer', 'Chiedi a Hammer:<br>«Chi devo richiamare questa settimana?»', 'Prova Hammer', 'assets/banner/hammer.webp')
) v(app, ordine, tipo, titolo, testo, immagine)
where not exists (select 1 from public.home_banner where app = 'maniscalco');

-- controllo: deve dare 3 · 1
select (select count(*) from home_banner where app = 'maniscalco' and attivo) as riquadri,
       (select count(*) from pg_proc where proname = 'equo_banner_evento') as funzione_eventi;
