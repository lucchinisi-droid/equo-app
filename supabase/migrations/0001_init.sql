-- Equo — schema iniziale
-- Estensioni
create extension if not exists "uuid-ossp";

-- ==========================
-- PROFILES (1:1 con auth.users)
-- ==========================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null default 'owner' check (role in ('owner', 'manager')),
  stable_name text, -- se è un gestore di scuderia
  phone text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles: select own" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles: update own" on public.profiles
  for update using (auth.uid() = id);
create policy "profiles: insert own" on public.profiles
  for insert with check (auth.uid() = id);

-- ==========================
-- HORSES
-- ==========================
create table if not exists public.horses (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  breed text,
  birth_date date,
  sex text check (sex in ('stallone', 'castrone', 'giumenta')),
  color text,
  microchip_code text,
  passport_number text,
  photo_url text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.horses enable row level security;

create policy "horses: crud own" on public.horses
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

create index if not exists horses_owner_id_idx on public.horses(owner_id);

-- ==========================
-- HEALTH RECORDS (libretto sanitario)
-- tipi: vaccino, coggins, ferratura, sverminazione, visita, altro
-- ==========================
create table if not exists public.health_records (
  id uuid primary key default uuid_generate_v4(),
  horse_id uuid not null references public.horses(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('vaccino', 'coggins', 'ferratura', 'sverminazione', 'visita', 'altro')),
  title text not null,
  performed_at date not null,
  next_due_at date, -- scadenza calcolata, per lo scadenziario
  vet_name text,
  cost numeric(10,2),
  document_url text, -- PDF/foto in Supabase Storage
  notes text,
  created_at timestamptz not null default now()
);

alter table public.health_records enable row level security;

create policy "health_records: crud own" on public.health_records
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

create index if not exists health_records_horse_id_idx on public.health_records(horse_id);
create index if not exists health_records_next_due_idx on public.health_records(next_due_at) where next_due_at is not null;

-- ==========================
-- EXPENSES (registro spese)
-- categorie: pensione, mangime, veterinario, maniscalco, attrezzatura, altro
-- ==========================
create table if not exists public.expenses (
  id uuid primary key default uuid_generate_v4(),
  horse_id uuid references public.horses(id) on delete set null,
  owner_id uuid not null references auth.users(id) on delete cascade,
  category text not null check (category in ('pensione', 'mangime', 'veterinario', 'maniscalco', 'attrezzatura', 'assicurazione', 'altro')),
  description text,
  amount numeric(10,2) not null,
  expense_date date not null default current_date,
  recurring boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.expenses enable row level security;

create policy "expenses: crud own" on public.expenses
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

create index if not exists expenses_owner_id_idx on public.expenses(owner_id);
create index if not exists expenses_date_idx on public.expenses(expense_date);

-- ==========================
-- SERVICES (cliniche, maneggi — directory geolocalizzata)
-- ==========================
create table if not exists public.services (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  type text not null check (type in ('clinica_24h', 'maneggio', 'maniscalco', 'veterinario', 'negozio')),
  address text,
  lat double precision,
  lng double precision,
  phone text,
  website text,
  notes text,
  created_at timestamptz not null default now()
);

-- lettura pubblica, scrittura solo da service_role (seed manuale/admin)
alter table public.services enable row level security;
create policy "services: public read" on public.services
  for select using (true);

create index if not exists services_type_idx on public.services(type);

-- ==========================
-- WAITLIST (lead capture proprietari/scuderie)
-- ==========================
create table if not exists public.waitlist (
  id uuid primary key default uuid_generate_v4(),
  email text not null unique,
  name text,
  role text check (role in ('proprietario', 'scuderia')),
  created_at timestamptz not null default now()
);

alter table public.waitlist enable row level security;
create policy "waitlist: insert anyone" on public.waitlist
  for insert with check (true);
-- nessuna select pubblica: solo service_role la legge (dashboard admin/export)

-- ==========================
-- CHAT ASSISTENTE AI (storico conversazioni, opzionale ma utile per contesto)
-- ==========================
create table if not exists public.assistant_messages (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  horse_id uuid references public.horses(id) on delete set null,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz not null default now()
);

alter table public.assistant_messages enable row level security;
create policy "assistant_messages: crud own" on public.assistant_messages
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

create index if not exists assistant_messages_owner_idx on public.assistant_messages(owner_id, created_at);

-- ==========================
-- updated_at trigger per horses
-- ==========================
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists horses_set_updated_at on public.horses;
create trigger horses_set_updated_at
  before update on public.horses
  for each row execute function public.set_updated_at();
