-- 24/10/2026 ANAGRAFICA DEL CAVALLO nella scheda del maniscalco (tutti i campi facoltativi)
-- anno di nascita, altezza al garrese (cm), mantello, disciplina, sesso, segni particolari, peso stimato (kg).
-- La razza c'era gia. Per i cavalli collegati al proprietario su Equo restano del proprietario nome, razza, nascita e mantello:
-- qui il maniscalco aggiunge i suoi dati. Si puo rieseguire senza danni.
alter table public.cavalli_clienti_mascalcia add column if not exists anno_nascita integer;
alter table public.cavalli_clienti_mascalcia add column if not exists altezza_cm integer;
alter table public.cavalli_clienti_mascalcia add column if not exists mantello text;
alter table public.cavalli_clienti_mascalcia add column if not exists disciplina text;
alter table public.cavalli_clienti_mascalcia add column if not exists sesso text;
alter table public.cavalli_clienti_mascalcia add column if not exists segni_particolari text;
alter table public.cavalli_clienti_mascalcia add column if not exists peso_kg integer;
do $c$
begin
  if not exists (select 1 from pg_constraint where conname = 'cavalli_clienti_mascalcia_anagrafica_check') then
    alter table public.cavalli_clienti_mascalcia add constraint cavalli_clienti_mascalcia_anagrafica_check check (
      (anno_nascita is null or anno_nascita between 1970 and 2100)
      and (altezza_cm is null or altezza_cm between 50 and 220)
      and (peso_kg is null or peso_kg between 30 and 1500)
      and (sesso is null or sesso in ('femmina', 'castrone', 'stallone'))
      and (mantello is null or length(mantello) <= 60)
      and (disciplina is null or length(disciplina) <= 60)
      and (segni_particolari is null or length(segni_particolari) <= 300));
  end if;
end
$c$;

-- controllo: atteso 7
select count(*) campi from information_schema.columns
 where table_name = 'cavalli_clienti_mascalcia' and column_name in ('anno_nascita', 'altezza_cm', 'mantello', 'disciplina', 'sesso', 'segni_particolari', 'peso_kg');
