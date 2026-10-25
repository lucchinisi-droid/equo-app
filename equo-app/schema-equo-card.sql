-- 26/10/2026 EQUO CARD DEL PROPRIETARIO
-- 1) horses.attivita: l'attività del cavallo (Dressage, Salto ostacoli, … o testo libero); vuota = «–» sulla card
-- 2) horses.obiettivo_settimana: uscite a settimana per l'anello «Movimento» (1..14, se vuoto 4)
-- 3) equo_cavallo_pubblico(codice): i dati NON sensibili del cavallo per la scheda pubblica che si apre dal QR della card
--    (app.equohub.com/cavallo/CODICE). La usa solo la funzione Netlify «pubblico» (chiave di servizio): nessun utente la chiama.
-- Si puo rieseguire senza danni.

alter table public.horses add column if not exists attivita text;
alter table public.horses add column if not exists obiettivo_settimana smallint;
do $do$ begin
  if not exists (select 1 from pg_constraint where conname = 'horses_attivita_lunghezza') then
    alter table public.horses add constraint horses_attivita_lunghezza check (attivita is null or length(attivita) <= 60);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'horses_obiettivo_settimana_ok') then
    alter table public.horses add constraint horses_obiettivo_settimana_ok check (obiettivo_settimana is null or obiettivo_settimana between 1 and 14);
  end if;
end $do$;

create or replace function public.equo_cavallo_pubblico(p_codice text) returns json
language plpgsql stable security definer set search_path to 'public' as $fn$
declare v_cod text := upper(regexp_replace(coalesce(p_codice, ''), '\s', '', 'g')); h horses; v_foto text; v_dove text;
begin
  if v_cod = '' then return null; end if;
  select * into h from horses where upper(codice_definitivo) = v_cod or upper(codice_equo) = v_cod
   order by (upper(codice_definitivo) = v_cod) desc nulls last limit 1;
  if h.id is null then return null; end if;
  select path into v_foto from cavalli_album where horse_id = h.id and nascosta = false order by copertina desc, created_at desc limit 1;
  v_dove := case when h.ubicazione_tipo = 'casa' then 'A casa'
                 when h.ubicazione_nome is not null then h.ubicazione_nome
                 else null end;
  return json_build_object(
    'nome', h.name, 'razza', h.breed, 'anno', extract(year from h.birth_date)::int, 'mantello', h.mantello,
    'attivita', h.attivita, 'codice', coalesce(h.codice_definitivo, h.codice_equo), 'livello', coalesce(h.codice_livello, 'provvisorio'),
    'dove', v_dove, 'foto_path', v_foto);
end $fn$;
revoke all on function public.equo_cavallo_pubblico(text) from public, anon, authenticated;
grant execute on function public.equo_cavallo_pubblico(text) to service_role;

-- controllo: atteso 2 | 1
select (select count(*) from information_schema.columns where table_name = 'horses' and column_name in ('attivita', 'obiettivo_settimana')) colonne,
       (select count(*) from pg_proc where proname = 'equo_cavallo_pubblico') funzione;
