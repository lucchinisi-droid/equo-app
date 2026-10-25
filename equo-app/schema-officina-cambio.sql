-- 26/10/2026 OFFICINA MOBILE · tipo di cambio e tagliando del cambio automatico
-- 1) officina_mezzi.cambio: manuale o automatico
-- 2) tagliando del cambio automatico con scadenza: ogni N km o anni dall'ultimo (se mai fatto: dall'immatricolazione)
-- 3) nuovo tipo di intervento «tagliando_cambio» (contiene anche i tipi del 26/10: pasticche, cinghia, manutenzioni)
-- Eseguire PRIMA del push. Si puo rieseguire senza danni.

alter table public.officina_mezzi add column if not exists cambio text not null default 'manuale';
alter table public.officina_mezzi drop constraint if exists officina_mezzi_cambio_check;
alter table public.officina_mezzi add constraint officina_mezzi_cambio_check check (cambio in ('manuale', 'automatico'));
alter table public.officina_mezzi add column if not exists cambio_aut_km integer;
alter table public.officina_mezzi add column if not exists cambio_aut_anni smallint;
alter table public.officina_mezzi add column if not exists ultimo_cambio_aut_data date;
alter table public.officina_mezzi add column if not exists ultimo_cambio_aut_km integer;
alter table public.officina_mezzi drop constraint if exists officina_mezzi_cambio_aut_check;
alter table public.officina_mezzi add constraint officina_mezzi_cambio_aut_check check (
  (cambio_aut_km is null or cambio_aut_km between 10000 and 300000) and (cambio_aut_anni is null or cambio_aut_anni between 1 and 15));

alter table public.officina_interventi drop constraint if exists officina_interventi_tipo_check;
alter table public.officina_interventi add constraint officina_interventi_tipo_check check (tipo in
  ('tagliando', 'revisione', 'pneumatici', 'pasticche', 'cinghia', 'tagliando_cambio', 'manutenzione_ordinaria', 'manutenzione_straordinaria', 'riparazione', 'bombole', 'altro'));

-- controllo: atteso 5 | 1
select (select count(*) from information_schema.columns where table_schema = 'public' and table_name = 'officina_mezzi'
          and column_name in ('cambio', 'cambio_aut_km', 'cambio_aut_anni', 'ultimo_cambio_aut_data', 'ultimo_cambio_aut_km')) colonne_cambio,
       (select count(*) from pg_constraint where conname = 'officina_interventi_tipo_check'
          and pg_get_constraintdef(oid) like '%tagliando_cambio%') tipo_nuovo;
