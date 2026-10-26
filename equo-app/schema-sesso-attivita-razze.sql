-- Equo · 26/10/2026 · Sesso e Attività in tutte le schede cavallo + razze Asino, Bardotto, Mulo
-- Da eseguire in Supabase PRIMA del deploy. Si può eseguire più volte.
--
-- 1) horses (cavalli del proprietario): nuova colonna sesso (attivita c'è già da schema-equo-card.sql)
-- 2) scuderia_cavalli (cavalli della Scuderia): nuove colonne sesso e attivita
--    Valori di sesso uguali alla scheda del maniscalco (cavalli_clienti_mascalcia.sesso): femmina, castrone, stallone
-- 3) equo_razze: Asino (ASN), Bardotto (BDT), Mulo (MUL)

-- 1) proprietario
alter table public.horses add column if not exists sesso text;
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'horses_sesso_valori') then
    alter table public.horses add constraint horses_sesso_valori check (sesso is null or sesso in ('femmina', 'castrone', 'stallone'));
  end if;
end $$;

-- 2) scuderia
alter table public.scuderia_cavalli add column if not exists sesso text;
alter table public.scuderia_cavalli add column if not exists attivita text;
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'scuderia_cavalli_sesso_valori') then
    alter table public.scuderia_cavalli add constraint scuderia_cavalli_sesso_valori check (sesso is null or sesso in ('femmina', 'castrone', 'stallone'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'scuderia_cavalli_attivita_lunghezza') then
    alter table public.scuderia_cavalli add constraint scuderia_cavalli_attivita_lunghezza check (attivita is null or length(attivita) <= 60);
  end if;
end $$;

-- 3) razze
insert into public.equo_razze(nome, sigla, italiana, ordine, alias) values
  ('Asino', 'ASN', false, 156, array['asina', 'somaro', 'ciuco']::text[]),
  ('Bardotto', 'BDT', false, 157, array['bardotta']::text[]),
  ('Mulo', 'MUL', false, 158, array['mula']::text[])
on conflict (nome) do update set sigla = excluded.sigla, alias = excluded.alias;

-- Controllo: atteso colonne = 3, razze = 3
select
  (select count(*) from information_schema.columns
    where table_schema = 'public' and ((table_name = 'horses' and column_name = 'sesso')
       or (table_name = 'scuderia_cavalli' and column_name in ('sesso', 'attivita')))) as colonne,
  (select count(*) from public.equo_razze where sigla in ('ASN', 'BDT', 'MUL')) as razze;
