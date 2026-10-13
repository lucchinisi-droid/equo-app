-- Equo: FERRATURA NEL LIBRETTO DEL CAVALLO + VISTA SEMPLICE / COMPLETA (12 ottobre 2026)
-- Va eseguito DOPO schema-scheda-cavallo-pro.sql e schema-sposta-cavallo.sql.
-- 1. il cavallo può essere Ferrato (completa), Mezza (2 davanti) o Pareggio (senza ferri): resta nella sua scheda
-- 2. tipo di ferro separato davanti / dietro (vista Completa): ferro_tipo = davanti, ferro_tipo_post = dietro (null = come davanti)
-- 3. l'appuntamento prende il lavoro dalla scheda; i lavori straordinari sono «Altro» e non toccano richiamo e scheda
-- 4. profiles.vista_maniscalco: 'semplice' | 'completa' (null = la chiede al primo accesso)

-- 1. scheda del cavallo
alter table public.cavalli_clienti_mascalcia drop constraint if exists cavalli_clienti_ferratura_tipo_chk;
alter table public.cavalli_clienti_mascalcia add constraint cavalli_clienti_ferratura_tipo_chk check (ferratura_tipo in ('completa','mezza','pareggio'));
alter table public.cavalli_clienti_mascalcia add column if not exists ferro_tipo_post text;
alter table public.cavalli_clienti_mascalcia drop constraint if exists cavalli_clienti_ferro_tipo_post_chk;
alter table public.cavalli_clienti_mascalcia add constraint cavalli_clienti_ferro_tipo_post_chk check (ferro_tipo_post is null or ferro_tipo_post in ('standard','correttivo'));

-- 2. vista dell'app maniscalco
alter table public.profiles add column if not exists vista_maniscalco text;
alter table public.profiles drop constraint if exists profiles_vista_maniscalco_chk;
alter table public.profiles add constraint profiles_vista_maniscalco_chk check (vista_maniscalco is null or vista_maniscalco in ('semplice','completa'));

-- 3. testo per libretto e scuderia: anche correttivo solo davanti o solo dietro
create or replace function public.equo_descr_intervento_libretto(p_tipo text, p_altro text, p_ferro_tipo text, p_ferro_note text, p_maniscalco uuid)
returns text language sql stable security definer set search_path = public as $$
  select equo_tipo_intervento(p_tipo, p_altro)
    || case when p_tipo not in ('ferratura','mezza_ferratura') then ''
            when p_ferro_tipo = 'correttivo' then ' · ferro correttivo' || coalesce(' (' || nullif(trim(p_ferro_note), '') || ')', '')
            when p_ferro_tipo = 'corr_davanti' then ' · ferro correttivo davanti, standard dietro' || coalesce(' (' || nullif(trim(p_ferro_note), '') || ')', '')
            when p_ferro_tipo = 'corr_dietro' then ' · ferro standard davanti, correttivo dietro' || coalesce(' (' || nullif(trim(p_ferro_note), '') || ')', '')
            when p_ferro_tipo = 'standard' then ' · ferro standard'
            else '' end
    || ' — registrata da ' || equo_nome_profilo(p_maniscalco) || ' (maniscalco) su Equo';
$$;

-- 4. l'intervento prende dalla scheda: misura, tipo di ferro (davanti/dietro) e il lavoro (completa, mezza, pareggio)
create or replace function public.interventi_ferro_da_scheda()
returns trigger language plpgsql security definer set search_path = public as $$
declare cv record;
begin
  if tg_op = 'UPDATE' and new.stato = 'fatto' then return new; end if;
  if new.tipo_ferratura not in ('ferratura','mezza_ferratura') or new.cavallo_cliente_id is null then return new; end if;
  select ferro_sistema, ferro_numero, ferratura_tipo, ferro_tipo, ferro_tipo_post, ferro_note into cv from cavalli_clienti_mascalcia where id = new.cavallo_cliente_id;
  if not found then return new; end if;
  -- l'appuntamento chiede solo «Ferratura»: completa, mezza o pareggio la dice la scheda (solo se lo inserisce il maniscalco)
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
    new.ferro_note := cv.ferro_note;
  end if;
  return new;
end $$;

-- 5. storico a vita: anche pareggio e ferro davanti / dietro
create or replace function public.cavalli_clienti_storico_ferro()
returns trigger language plpgsql security definer set search_path = public as $$
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
  if (new.ferro_tipo, coalesce(new.ferro_tipo_post, ''), coalesce(new.ferro_note, '')) is distinct from (old.ferro_tipo, coalesce(old.ferro_tipo_post, ''), coalesce(old.ferro_note, '')) then
    v_ft := case when new.ferro_tipo_post is not null and new.ferro_tipo_post <> new.ferro_tipo
                 then 'davanti ' || new.ferro_tipo || ', dietro ' || new.ferro_tipo_post
                 when new.ferro_tipo = 'correttivo' then 'correttivo' else 'standard' end;
    insert into cavalli_storico (codice_equo, horse_id, scuderia_cavallo_id, cavallo_cliente_id, tipo, descrizione, autore_user_id, autore_ruolo, app)
    values (new.codice_equo, new.horse_id, new.scuderia_cavallo_id, new.id, 'ferro_tipo',
            'Tipo di ferro: ' || v_ft || coalesce(' (' || nullif(trim(new.ferro_note), '') || ')', '') || v_chi,
            auth.uid(), 'maniscalco', 'app');
  end if;
  return null;
end $$;
drop trigger if exists trg_cavalli_clienti_storico_ferro on public.cavalli_clienti_mascalcia;
create trigger trg_cavalli_clienti_storico_ferro after update of ferro_sistema, ferro_numero, ferratura_tipo, ferro_tipo, ferro_tipo_post, ferro_note on public.cavalli_clienti_mascalcia
  for each row execute function public.cavalli_clienti_storico_ferro();

-- 6. una tantum: cavalli che dall'ultimo lavoro risultano a pareggio o a mezza (senza voci nello storico: non è un cambio reale)
select set_config('equo.ferro_iniziale', 'on', false);
with ultimo as (
  select distinct on (i.cavallo_cliente_id) i.cavallo_cliente_id, i.tipo_ferratura
  from interventi_mascalcia i
  where i.stato = 'fatto' and i.cavallo_cliente_id is not null and i.tipo_ferratura in ('ferratura','mezza_ferratura','pareggio')
  order by i.cavallo_cliente_id, i.data_intervento desc, i.created_at desc
)
update cavalli_clienti_mascalcia c
   set ferratura_tipo = case u.tipo_ferratura when 'pareggio' then 'pareggio' else 'mezza' end
  from ultimo u
 where u.cavallo_cliente_id = c.id and c.ferratura_tipo = 'completa' and u.tipo_ferratura in ('pareggio','mezza_ferratura');
select set_config('equo.ferro_iniziale', '', false);

-- controllo: deve dare 1 · 1 · 1 · (numero cavalli a pareggio, anche 0)
select (select count(*) from information_schema.columns where table_name = 'cavalli_clienti_mascalcia' and column_name = 'ferro_tipo_post') as colonna_dietro,
       (select count(*) from information_schema.columns where table_name = 'profiles' and column_name = 'vista_maniscalco') as colonna_vista,
       (select count(*) from pg_constraint where conname = 'cavalli_clienti_ferratura_tipo_chk' and pg_get_constraintdef(oid) like '%pareggio%') as pareggio_ok,
       (select count(*) from cavalli_clienti_mascalcia where ferratura_tipo = 'pareggio') as cavalli_a_pareggio;
