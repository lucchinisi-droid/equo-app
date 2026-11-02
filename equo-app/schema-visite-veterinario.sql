-- Equo: SCHEDA DELLA VISITA del veterinario, con i modelli (2 novembre 2026) · SQL 31
-- Passo 1 del piano approvato da Simone il 2/11: scheda visita → referto → allegati → dettatura → piano terapeutico.
--  1. visite_pro: una visita compilata (bozza o conclusa), legata all'appuntamento in agenda (se c'è), al cliente
--     e al cavallo (cavallo unico: scheda del professionista e, se c'è, cavallo Equo). I campi stanno in «dati» (jsonb)
--     perché cambiano con il modello. La vede e la modifica SOLO il professionista che l'ha scritta
--     (il proprietario la vedrà con il referto, passo 2).
--  2. modelli_visita: i modelli personali del veterinario (campi accesi/spenti e campi aggiunti).
--     I modelli «Standard» e «Agopuntura · MTC · Fisioterapia» sono scritti nell'app e non stanno qui.
-- Nomi neutri (professionista_id), come le viste *_pro dell'SQL 26. Nessuna tabella del maniscalco cambia.
-- Rieseguibile.

create table if not exists public.visite_pro (
  id uuid primary key default gen_random_uuid(),
  professionista_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  professione text not null default 'veterinario' check (professione in ('veterinario','maniscalco','istruttore')),
  intervento_id uuid references public.interventi_mascalcia(id) on delete set null,
  cliente_id uuid references public.clienti_mascalcia(id) on delete set null,
  cavallo_cliente_id uuid references public.cavalli_clienti_mascalcia(id) on delete set null,
  horse_id uuid references public.horses(id) on delete set null,
  modello text not null default 'standard',          -- 'standard' | 'mtc' | id di modelli_visita
  modello_nome text,                                  -- nome del modello al momento della visita
  dati jsonb not null default '{}'::jsonb,            -- campi compilati { chiave: valore }
  campi jsonb,                                        -- per i modelli personali: copia dei campi usati (la visita resta leggibile anche se il modello cambia)
  stato text not null default 'bozza' check (stato in ('bozza','conclusa')),
  data_visita date not null default current_date,
  conclusa_il timestamptz,
  creata_il timestamptz not null default now(),
  aggiornata_il timestamptz not null default now()
);
create index if not exists visite_pro_prof_idx on public.visite_pro (professionista_id, data_visita desc);
create index if not exists visite_pro_cavallo_idx on public.visite_pro (cavallo_cliente_id);
create index if not exists visite_pro_horse_idx on public.visite_pro (horse_id);
create unique index if not exists visite_pro_intervento_uk on public.visite_pro (intervento_id) where intervento_id is not null;

create table if not exists public.modelli_visita (
  id uuid primary key default gen_random_uuid(),
  professionista_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  nome text not null check (length(trim(nome)) between 1 and 80),
  base text not null default 'standard' check (base in ('standard','mtc','vuoto')),
  campi jsonb not null default '[]'::jsonb,           -- [{ k, etichetta, tipo, sezione, opzioni, max, attivo }]
  ordine int not null default 0,
  archiviato_il timestamptz,
  creato_il timestamptz not null default now(),
  aggiornato_il timestamptz not null default now()
);
create index if not exists modelli_visita_prof_idx on public.modelli_visita (professionista_id);

alter table public.visite_pro enable row level security;
alter table public.modelli_visita enable row level security;

drop policy if exists visite_pro_tutto on public.visite_pro;
create policy visite_pro_tutto on public.visite_pro for all to authenticated
  using (professionista_id = auth.uid()) with check (professionista_id = auth.uid());
drop policy if exists modelli_visita_tutto on public.modelli_visita;
create policy modelli_visita_tutto on public.modelli_visita for all to authenticated
  using (professionista_id = auth.uid()) with check (professionista_id = auth.uid());

revoke all on public.visite_pro, public.modelli_visita from anon;
grant select, insert, update, delete on public.visite_pro, public.modelli_visita to authenticated;

-- ora di aggiornamento
create or replace function public.equo_tocca_aggiornata() returns trigger
language plpgsql set search_path to 'public' as $$
begin
  if tg_table_name = 'visite_pro' then new.aggiornata_il := now(); else new.aggiornato_il := now(); end if;
  return new;
end $$;
drop trigger if exists trg_visite_pro_aggiornata on public.visite_pro;
create trigger trg_visite_pro_aggiornata before update on public.visite_pro for each row execute function public.equo_tocca_aggiornata();
drop trigger if exists trg_modelli_visita_aggiornato on public.modelli_visita;
create trigger trg_modelli_visita_aggiornato before update on public.modelli_visita for each row execute function public.equo_tocca_aggiornata();
