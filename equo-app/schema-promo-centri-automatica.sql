-- ============================================================
-- EQUO SCUDERIA - Offerta "3 mesi di PREMIUM gratis" (volantino)
-- Completa il meccanismo: attivazione protetta (una sola volta),
-- scadenza automatica ogni notte, helper onboarding.
-- Idempotente: si puo' rieseguire.
-- ============================================================

-- 1) Attivazione protetta: una sola promo per centro, solo da start/advance
create or replace function public.attiva_promo_centro(p_centro uuid, p_mesi integer default 3)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare c centri%rowtype;
begin
  select * into c from centri where id = p_centro;
  if c.id is null then raise exception 'Centro non trovato'; end if;
  if c.promo_inizio is not null then
    raise exception 'Promo gia'' usata da questo centro (dal %)', c.promo_inizio;
  end if;
  if c.pacchetto in ('premium','enterprise') then
    raise exception 'Il centro ha gia'' il pacchetto %: promo non necessaria', c.pacchetto;
  end if;
  if p_mesi is null or p_mesi < 1 or p_mesi > 12 then
    raise exception 'Durata non valida (1-12 mesi)';
  end if;
  perform set_config('equo.pacchetti','on',true);
  update centri set
    promo_pacchetto_prima = c.pacchetto,
    pacchetto = 'premium',
    promo_inizio = current_date,
    promo_fino = (current_date + make_interval(months => p_mesi))::date,
    onboarding_stato = 'da_fare'
  where id = p_centro;
end $$;

-- 2) Scadenza: riporta al pacchetto precedente i centri con promo finita
create or replace function public.equo_scade_promo_centri()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare r record; n integer := 0;
begin
  for r in select id from centri
           where promo_pacchetto_prima is not null
             and promo_fino is not null
             and promo_fino < current_date
  loop
    perform termina_promo_centro(r.id);
    n := n + 1;
  end loop;
  return n;
end $$;

-- 3) Helper onboarding (da_fare | in_corso | fatto)
create or replace function public.imposta_onboarding_centro(p_centro uuid, p_stato text, p_note text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_stato not in ('da_fare','in_corso','fatto') then
    raise exception 'Stato non valido: usa da_fare, in_corso o fatto';
  end if;
  perform set_config('equo.pacchetti','on',true);
  update centri set onboarding_stato = p_stato,
         onboarding_note = coalesce(p_note, onboarding_note)
  where id = p_centro;
  if not found then raise exception 'Centro non trovato'; end if;
end $$;

-- 4) Permessi: solo service_role / SQL Editor
revoke all on function public.attiva_promo_centro(uuid, integer) from public, anon, authenticated;
revoke all on function public.equo_scade_promo_centri() from public, anon, authenticated;
revoke all on function public.imposta_onboarding_centro(uuid, text, text) from public, anon, authenticated;
grant execute on function public.attiva_promo_centro(uuid, integer) to service_role;
grant execute on function public.equo_scade_promo_centri() to service_role;
grant execute on function public.imposta_onboarding_centro(uuid, text, text) to service_role;

-- 5) Esecuzione automatica ogni notte (~00:05 ora italiana)
create extension if not exists pg_cron;
do $$
begin
  if exists (select 1 from cron.job where jobname = 'equo_scade_promo_centri') then
    perform cron.unschedule('equo_scade_promo_centri');
  end if;
  perform cron.schedule('equo_scade_promo_centri', '5 22 * * *', 'select public.equo_scade_promo_centri();');
end $$;
