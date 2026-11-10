-- Equo · SQL 59 · Configurazione guidata, blocco B2: i dati che mancavano (10/11/2026)
--   · centri: email, forma giuridica e logo (facoltativi). Il logo va nel bucket «cavalli-foto» già esistente,
--     nella cartella del centro (stessa regola di accesso delle foto dei cavalli): nessun bucket nuovo.
--   · ricerca di un cavallo per microchip o codice Equo PRIMA di crearlo (passo 6): restituisce i dati solo se il
--     cavallo è già della scuderia; se esiste su Equo ma è di altri dice soltanto «esiste, serve il codice del
--     proprietario», senza mostrare nulla. Così niente doppioni e niente dati di altri.
-- Solo aggiunte: per annullare  alter table centri drop column email, drop column forma_giuridica, drop column logo_url;
--                               drop function equo_cerca_cavallo_conf(uuid, text);

alter table centri add column if not exists email text;
alter table centri add column if not exists forma_giuridica text;
alter table centri add column if not exists logo_url text;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'centri_email_lunghezza') then
    alter table centri add constraint centri_email_lunghezza check (email is null or (char_length(email) <= 120 and email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'centri_forma_giuridica_valori') then
    alter table centri add constraint centri_forma_giuridica_valori check (forma_giuridica is null or forma_giuridica in
      ('asd', 'ssd', 'ditta_individuale', 'societa_agricola', 'snc', 'sas', 'srl', 'srls', 'spa', 'associazione', 'altro'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'centri_logo_url_lunghezza') then
    alter table centri add constraint centri_logo_url_lunghezza check (logo_url is null or char_length(logo_url) <= 500);
  end if;
end $$;

create or replace function equo_cerca_cavallo_conf(p_centro uuid, p_testo text) returns json
language plpgsql stable security definer set search_path = public as $$
declare t text := upper(regexp_replace(coalesce(p_testo, ''), '[^A-Za-z0-9]', '', 'g')); r record; v_altrove boolean;
begin
  if not is_member_of_centro(p_centro) then return json_build_object('esito', 'errore', 'errore', 'Non autorizzato'); end if;
  if length(t) < 6 then return json_build_object('esito', 'corto'); end if;
  -- già nella scuderia?
  select sc.id, sc.nome, sc.razza, sc.proprietario into r from scuderia_cavalli sc
   where sc.centro_id = p_centro and sc.uscito_il is null
     and (upper(regexp_replace(coalesce(sc.microchip, ''), '[^A-Za-z0-9]', '', 'g')) = t
          or upper(regexp_replace(coalesce(sc.codice_equo, ''), '[^A-Za-z0-9]', '', 'g')) = t
          or upper(coalesce(sc.numero_definitivo::text, sc.equo_numero::text, '')) = t)
   limit 1;
  if r.id is not null then
    return json_build_object('esito', 'tuo', 'id', r.id, 'nome', r.nome, 'razza', r.razza, 'proprietario', r.proprietario);
  end if;
  -- esiste su Equo (proprietario con l'app o un'altra scuderia)? Nessun dato: solo che esiste.
  select exists (select 1 from horses h
                  where upper(regexp_replace(coalesce(h.microchip, ''), '[^A-Za-z0-9]', '', 'g')) = t
                     or upper(regexp_replace(coalesce(h.codice_equo, ''), '[^A-Za-z0-9]', '', 'g')) = t)
      or exists (select 1 from scuderia_cavalli sc where sc.centro_id <> p_centro
                  and (upper(regexp_replace(coalesce(sc.microchip, ''), '[^A-Za-z0-9]', '', 'g')) = t
                       or upper(regexp_replace(coalesce(sc.codice_equo, ''), '[^A-Za-z0-9]', '', 'g')) = t))
    into v_altrove;
  if v_altrove then return json_build_object('esito', 'altrove'); end if;
  return json_build_object('esito', 'nessuno');
end $$;
revoke all on function equo_cerca_cavallo_conf(uuid, text) from public, anon;
grant execute on function equo_cerca_cavallo_conf(uuid, text) to authenticated;

select (select count(*) from information_schema.columns where table_name = 'centri' and column_name in ('email', 'forma_giuridica', 'logo_url')) as colonne_nuove,
       exists (select 1 from pg_proc where proname = 'equo_cerca_cavallo_conf') as ricerca_ok;
