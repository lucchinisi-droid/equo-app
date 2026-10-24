-- 24/10/2026 PREZZO ABITUALE DEL CAVALLO (richiesta di Francesco Bizzarri)
-- Importo proposto quando il maniscalco segna fatto o crea un appuntamento. Solo del maniscalco:
-- non va nel libretto del proprietario ne nella scheda della scuderia, non entra nello storico. Si puo rieseguire senza danni.
alter table public.cavalli_clienti_mascalcia add column if not exists prezzo_ferratura numeric(8,2);
do $c$
begin
  if not exists (select 1 from pg_constraint where conname = 'cavalli_clienti_mascalcia_prezzo_ferratura_check') then
    alter table public.cavalli_clienti_mascalcia add constraint cavalli_clienti_mascalcia_prezzo_ferratura_check
      check (prezzo_ferratura is null or (prezzo_ferratura >= 0 and prezzo_ferratura <= 10000));
  end if;
end
$c$;

-- controllo
select (select count(*) from information_schema.columns where table_name = 'cavalli_clienti_mascalcia' and column_name = 'prezzo_ferratura') colonna;
