-- 24/10/2026 FERRATURA: misura preferita del maniscalco + dettagli del ferro correttivo
-- Richiesta di Francesco Bizzarri (video 24/10). Si puo rieseguire senza danni.

-- 1) misura che il maniscalco usa di solito: la scheda Ferratura parte da questa
alter table public.profiles add column if not exists ferro_sistema_predefinito text;
do $c$
begin
  if not exists (select 1 from pg_constraint where conname = 'profiles_ferro_sistema_predefinito_check') then
    alter table public.profiles add constraint profiles_ferro_sistema_predefinito_check
      check (ferro_sistema_predefinito is null or ferro_sistema_predefinito in ('italiana', 'olandese', 'tedesca'));
  end if;
end
$c$;

-- 2) dettagli del correttivo (pad, soletta, alluminio, pianella, banda larga in punta, ferro asimmetrico)
--    ferro_dettagli = davanti (o unico); ferro_dettagli_post = dietro (solo Completa con 4 ferri)
alter table public.cavalli_clienti_mascalcia add column if not exists ferro_dettagli text[];
alter table public.cavalli_clienti_mascalcia add column if not exists ferro_dettagli_post text[];

-- testo unico dettagli + note: «pad, soletta · alluminio particolare» / «davanti: pad; dietro: alluminio»
create or replace function public.equo_testo_ferro_dettagli(p_det text[], p_det_post text[], p_note text) returns text
language sql immutable set search_path to 'public' as $fn$
  select nullif(concat_ws(' · ',
    case when coalesce(cardinality(p_det_post), 0) > 0
         then concat_ws('; ', 'davanti: ' || nullif(array_to_string(p_det, ', '), ''), 'dietro: ' || array_to_string(p_det_post, ', '))
         else nullif(array_to_string(p_det, ', '), '') end,
    nullif(trim(p_note), '')), '');
$fn$;

-- 3) l'appuntamento prende il ferro dalla scheda del cavallo: ora anche i dettagli del correttivo
--    (vanno nel testo delle note: cosi arrivano nel libretto del proprietario e nella scheda della scuderia)
create or replace function public.interventi_ferro_da_scheda() returns trigger
language plpgsql security definer set search_path to 'public' as $fn$
declare cv record;
begin
  if tg_op = 'UPDATE' and new.stato = 'fatto' then return new; end if;
  if new.tipo_ferratura not in ('ferratura','mezza_ferratura') or new.cavallo_cliente_id is null then return new; end if;
  select ferro_sistema, ferro_numero, ferratura_tipo, ferro_tipo, ferro_tipo_post, ferro_note, ferro_dettagli, ferro_dettagli_post into cv
    from cavalli_clienti_mascalcia where id = new.cavallo_cliente_id;
  if not found then return new; end if;
  if tg_op = 'INSERT' and new.tipo_ferratura = 'ferratura' and auth.uid() = new.maniscalco_id then
    if cv.ferratura_tipo = 'mezza' then new.tipo_ferratura := 'mezza_ferratura';
    elsif cv.ferratura_tipo = 'pareggio' then new.tipo_ferratura := 'pareggio'; new.quantita_ferri := null; return new;
    end if;
  end if;
  if new.numero_ferro is null and cv.ferro_numero is not null then
    new.numero_ferro := cv.ferro_numero;
    new.misura_sistema := coalesce(cv.ferro_sistema, 'italiana');
  end if;
  if new.ferro_tipo is null then
    new.ferro_tipo := case
      when new.tipo_ferratura = 'ferratura' and cv.ferro_tipo_post is not null and cv.ferro_tipo_post <> cv.ferro_tipo
        then case when cv.ferro_tipo = 'correttivo' then 'corr_davanti' else 'corr_dietro' end
      else cv.ferro_tipo end;
    new.ferro_note := equo_testo_ferro_dettagli(cv.ferro_dettagli,
      case when new.tipo_ferratura = 'ferratura' then cv.ferro_dettagli_post end, cv.ferro_note);
  end if;
  return new;
end $fn$;

-- 4) storico del cavallo: un cambio dei dettagli del correttivo resta scritto come le note
create or replace function public.cavalli_clienti_storico_ferro() returns trigger
language plpgsql security definer set search_path to 'public' as $fn$
declare v_chi text; v_ft text;
begin
  if coalesce(current_setting('equo.unisci_righe', true), '') = 'on' or coalesce(current_setting('equo.ferro_iniziale', true), '') = 'on' then return null; end if;
  v_chi := ' (maniscalco ' || equo_nome_profilo(new.maniscalco_id) || ')';
  if (new.ferro_sistema, new.ferro_numero) is distinct from (old.ferro_sistema, old.ferro_numero) then
    insert into cavalli_storico (codice_equo, horse_id, scuderia_cavallo_id, cavallo_cliente_id, tipo, descrizione, autore_user_id, autore_ruolo, app)
    values (new.codice_equo, new.horse_id, new.scuderia_cavallo_id, new.id, 'ferro_standard',
            case when new.ferro_numero is null then 'Ferro standard tolto'
                 when old.ferro_numero is null then 'Ferro standard impostato: n. ' || new.ferro_numero || ' ' || equo_sigla_misura(coalesce(new.ferro_sistema, 'italiana'))
                 else 'Ferro standard cambiato: n. ' || old.ferro_numero || ' ' || equo_sigla_misura(coalesce(old.ferro_sistema, 'italiana')) || ' → n. ' || new.ferro_numero || ' ' || equo_sigla_misura(coalesce(new.ferro_sistema, 'italiana')) end
            || v_chi, auth.uid(), 'maniscalco', 'app');
  end if;
  if new.ferratura_tipo is distinct from old.ferratura_tipo then
    insert into cavalli_storico (codice_equo, horse_id, scuderia_cavallo_id, cavallo_cliente_id, tipo, descrizione, autore_user_id, autore_ruolo, app)
    values (new.codice_equo, new.horse_id, new.scuderia_cavallo_id, new.id, 'ferratura_tipo',
            case when new.ferratura_tipo = 'mezza' then 'Passa a mezza ferratura (2 davanti)'
                 when new.ferratura_tipo = 'pareggio' then 'Passa a pareggio (senza ferri)'
                 else 'Passa a ferratura completa (4 ferri)' end || v_chi,
            auth.uid(), 'maniscalco', 'app');
  end if;
  if (new.ferro_tipo, coalesce(new.ferro_tipo_post, ''), coalesce(new.ferro_note, ''), coalesce(new.ferro_dettagli, '{}'), coalesce(new.ferro_dettagli_post, '{}'))
     is distinct from (old.ferro_tipo, coalesce(old.ferro_tipo_post, ''), coalesce(old.ferro_note, ''), coalesce(old.ferro_dettagli, '{}'), coalesce(old.ferro_dettagli_post, '{}')) then
    v_ft := case when new.ferro_tipo_post is not null and new.ferro_tipo_post <> new.ferro_tipo
                 then 'davanti ' || new.ferro_tipo || ', dietro ' || new.ferro_tipo_post
                 when new.ferro_tipo = 'correttivo' then 'correttivo' else 'standard' end;
    insert into cavalli_storico (codice_equo, horse_id, scuderia_cavallo_id, cavallo_cliente_id, tipo, descrizione, autore_user_id, autore_ruolo, app)
    values (new.codice_equo, new.horse_id, new.scuderia_cavallo_id, new.id, 'ferro_tipo',
            'Tipo di ferro: ' || v_ft || coalesce(' (' || equo_testo_ferro_dettagli(new.ferro_dettagli, new.ferro_dettagli_post, new.ferro_note) || ')', '') || v_chi,
            auth.uid(), 'maniscalco', 'app');
  end if;
  return null;
end $fn$;

-- controllo
select (select count(*) from information_schema.columns where table_name = 'profiles' and column_name = 'ferro_sistema_predefinito') misura_preferita,
       (select count(*) from information_schema.columns where table_name = 'cavalli_clienti_mascalcia' and column_name in ('ferro_dettagli', 'ferro_dettagli_post')) dettagli,
       equo_testo_ferro_dettagli(array['pad','soletta'], null, 'alluminio particolare') prova_1,
       equo_testo_ferro_dettagli(array['pad'], array['alluminio'], null) prova_2;
