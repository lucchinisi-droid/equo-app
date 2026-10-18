-- Costo reale di ogni risposta AI, per agente (serve a decidere prezzi e modelli dopo i primi mesi).
-- Additivo e sicuro: nessun accesso dall'app (RLS attiva, nessuna policy); scrive solo agent.js con la service role.
create table if not exists ai_costi (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  user_id uuid,
  centro_id uuid,
  agente text,
  vista text,
  modello text,
  token_in integer not null default 0,
  token_out integer not null default 0,
  cache_read integer not null default 0,
  cache_write integer not null default 0,
  ricerche integer not null default 0,
  giri integer not null default 0,
  prova boolean not null default false,
  costo_usd numeric(10,5) not null default 0
);
create index if not exists ai_costi_agente_data on ai_costi (agente, created_at desc);
create index if not exists ai_costi_centro_data on ai_costi (centro_id, created_at desc);
alter table ai_costi enable row level security;
revoke all on ai_costi from anon, authenticated;
