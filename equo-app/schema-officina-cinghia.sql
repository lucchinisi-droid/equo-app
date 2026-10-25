-- 26/10/2026 OFFICINA MOBILE · aggiunte
-- 1) interventi sul mezzo: nuovi tipi Pasticche, Cinghia distribuzione, Manutenzione ordinaria e straordinaria («pneumatici» ora si chiama Gomme)
-- 2) cinghia di distribuzione con scadenza: ogni N km o anni dall'ultima sostituzione (se mai cambiata: dall'immatricolazione)
-- Eseguire PRIMA del push. Si puo rieseguire senza danni.

alter table public.officina_interventi drop constraint if exists officina_interventi_tipo_check;
alter table public.officina_interventi add constraint officina_interventi_tipo_check check (tipo in
  ('tagliando', 'revisione', 'pneumatici', 'pasticche', 'cinghia', 'manutenzione_ordinaria', 'manutenzione_straordinaria', 'riparazione', 'bombole', 'altro'));

alter table public.officina_mezzi add column if not exists cinghia_km integer;
alter table public.officina_mezzi add column if not exists cinghia_anni smallint;
alter table public.officina_mezzi add column if not exists ultima_cinghia_data date;
alter table public.officina_mezzi add column if not exists ultima_cinghia_km integer;
alter table public.officina_mezzi drop constraint if exists officina_mezzi_cinghia_check;
alter table public.officina_mezzi add constraint officina_mezzi_cinghia_check check (
  (cinghia_km is null or cinghia_km between 10000 and 400000) and (cinghia_anni is null or cinghia_anni between 1 and 15));

-- controllo: atteso 4 | 1
select (select count(*) from information_schema.columns where table_schema = 'public' and table_name = 'officina_mezzi'
          and column_name in ('cinghia_km', 'cinghia_anni', 'ultima_cinghia_data', 'ultima_cinghia_km')) colonne_cinghia,
       (select count(*) from pg_constraint where conname = 'officina_interventi_tipo_check'
          and pg_get_constraintdef(oid) like '%manutenzione_straordinaria%') tipi_nuovi;
