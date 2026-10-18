-- Equo · conteggio visite e click di equohub.com e scuderia.equohub.com (senza cookie, senza IP)
-- Si scrive solo dalla funzione Netlify "visita" (service role). Nessun accesso diretto dall'app.
create table if not exists public.sito_visite (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  sito text not null check (sito in ('sito','scuderia')),
  tipo text not null check (tipo in ('visita','click')),
  pagina text,
  nome text,
  sorgente text,
  dispositivo text check (dispositivo in ('mobile','desktop')),
  visitatore text
);
create index if not exists sito_visite_data_idx on public.sito_visite (created_at desc);
create index if not exists sito_visite_sito_tipo_idx on public.sito_visite (sito, tipo, created_at desc);
alter table public.sito_visite enable row level security;
revoke all on public.sito_visite from anon, authenticated;
comment on table public.sito_visite is 'Statistiche anonime: visitatore = hash giornaliero (IP+browser+giorno+sale), l''IP non viene salvato.';
