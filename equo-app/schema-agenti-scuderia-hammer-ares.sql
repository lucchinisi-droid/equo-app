-- ============================================================
-- EQUO SCUDERIA - Hammer e Ares acquistabili dal centro
-- Permette di scegliere anche Hammer, Ares e Galeno come "agente incluso" del pacchetto PREMIUM
-- (prima erano ammessi solo merlino e ermes). Gli agenti extra (agenti_extra) non hanno vincoli.
-- Idempotente: si puo' rieseguire.
-- ============================================================
alter table public.centri drop constraint if exists centri_agente_incluso_check;
alter table public.centri add constraint centri_agente_incluso_check
  check (agente_incluso is null or agente_incluso in ('merlino','ermes','galeno','hammer','ares'));

-- Come si attiva (da SQL Editor, per un centro ADVANCE o PREMIUM):
--   Add-on:            select set_config('equo.pacchetti','on',true);
--                      update centri set agenti_extra = array_append(agenti_extra, 'hammer') where id = '<id centro>';
--   Incluso PREMIUM:   select set_config('equo.pacchetti','on',true);
--                      update centri set agente_incluso = 'ares' where id = '<id centro>';
