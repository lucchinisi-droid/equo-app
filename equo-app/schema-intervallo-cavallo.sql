-- 24/10/2026 INTERVALLO DI FERRATURA DEL SINGOLO CAVALLO (richiesta di Francesco Bizzarri)
-- Vale prima di quello della struttura: proposta della prossima scadenza = cavallo > struttura > ultima volta > predefinito. Si puo rieseguire senza danni.
alter table public.cavalli_clienti_mascalcia add column if not exists intervallo_giorni integer;
do $c$
begin
  if not exists (select 1 from pg_constraint where conname = 'cavalli_clienti_mascalcia_intervallo_giorni_check') then
    alter table public.cavalli_clienti_mascalcia add constraint cavalli_clienti_mascalcia_intervallo_giorni_check
      check (intervallo_giorni is null or intervallo_giorni between 7 and 180);
  end if;
end
$c$;
create or replace function public.cavalli_clienti_storico_intervallo() returns trigger
language plpgsql security definer set search_path to 'public' as $fn$
begin
  if coalesce(current_setting('equo.unisci_righe', true), '') = 'on' or coalesce(current_setting('equo.unisci_manuali', true), '') = 'on' then return null; end if;
  if new.intervallo_giorni is distinct from old.intervallo_giorni then
    insert into cavalli_storico (codice_equo, horse_id, scuderia_cavallo_id, cavallo_cliente_id, tipo, descrizione, autore_user_id, autore_ruolo, app)
    values (new.codice_equo, new.horse_id, new.scuderia_cavallo_id, new.id, 'ferro_tipo',
            case when new.intervallo_giorni is null then 'Intervallo di ferratura tolto (era ' || old.intervallo_giorni || ' giorni)'
                 when old.intervallo_giorni is null then 'Intervallo di ferratura: ' || new.intervallo_giorni || ' giorni'
                 else 'Intervallo di ferratura: ' || old.intervallo_giorni || ' → ' || new.intervallo_giorni || ' giorni' end
            || ' (maniscalco ' || equo_nome_profilo(new.maniscalco_id) || ')',
            auth.uid(), 'maniscalco', 'app');
  end if;
  return null;
end $fn$;
drop trigger if exists trg_cavalli_clienti_storico_intervallo on public.cavalli_clienti_mascalcia;
create trigger trg_cavalli_clienti_storico_intervallo after update of intervallo_giorni on public.cavalli_clienti_mascalcia
  for each row execute function public.cavalli_clienti_storico_intervallo();
select (select count(*) from information_schema.columns where table_name = 'cavalli_clienti_mascalcia' and column_name = 'intervallo_giorni') colonna,
       (select count(*) from pg_trigger where tgname = 'trg_cavalli_clienti_storico_intervallo') trigger_storico;
