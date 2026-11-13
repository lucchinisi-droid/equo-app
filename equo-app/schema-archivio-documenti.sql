-- =====================================================================================
-- Equo · SQL 69 · schema-archivio-documenti.sql · 13/11/2026
-- Archivio dei professionisti (maniscalco e veterinario), mockup approvato il 13/11:
--   1. cartelle personali («+ Cartella») e «Rinomina» (nome visibile a tutti, sotto resta quello di Equo);
--   2. «Chi lo vede» per persona: Per sempre / 7 giorni / Nascosto, modificabile in ogni momento;
--   3. decisione di Simone (13/11): sui contenuti che CREA il professionista decide lui, anche verso il proprietario
--      (prima il proprietario li vedeva sempre). Il libretto mostra l'intervento con la data, mai gli allegati.
--      I nuovi contenuti dei professionisti nascono «Nascosti»: li vede solo l'autore finché non sceglie.
--      I documenti sanitari obbligatori (Coggins, vaccino, passaporto) restano visibili alla scuderia (regola del 2/11);
--   4. segni e misure sulle foto (livello sopra l'originale, che non cambia): colonna documenti.segni;
--   5. avviso privacy con la spunta prima di aprire (la spunta resta nel registro);
--   6. «Elimina»: recuperabile per 30 giorni;
--   7. allegati del maniscalco nello spazio privato (fase 4 della privacy): i 7 allegati caricati da professionisti
--      passano nel registro «documenti» (il file resta dov'è), con le stesse persone che li vedevano prima;
--      da ora gli allegati caricati dalla scheda del cavallo del professionista entrano nel registro.
--   Sicurezza: l'autore non può più cambiare percorso, spazio o autore di un documento (prima con un UPDATE poteva
--   puntare il percorso al file di un altro).
-- App: serve il deploy con l'Archivio. Prima del deploy l'app vecchia continua a funzionare (le funzioni vecchie
-- restano con gli stessi nomi; equo_allegati_cavallo ha due colonne in più in fondo).
--
-- PROVA SENZA EFFETTI: con v_prova := true (in fondo) lo script finisce con «PROVA_OK …» e annulla tutto.
-- Esecuzione vera: mettere v_prova := false.
-- =====================================================================================
begin;

-- ---------- 1. colonne e cartelle ----------
create table if not exists documenti_cartelle (
  id uuid primary key default gen_random_uuid(),
  autore_user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  nome text not null check (length(trim(nome)) between 1 and 60),
  creato_il timestamptz not null default now()
);
create index if not exists documenti_cartelle_autore on documenti_cartelle(autore_user_id);
alter table documenti_cartelle enable row level security;
drop policy if exists documenti_cartelle_mie on documenti_cartelle;
create policy documenti_cartelle_mie on documenti_cartelle for all to authenticated
  using (autore_user_id = auth.uid()) with check (autore_user_id = auth.uid());
grant select, insert, update, delete on documenti_cartelle to authenticated;

alter table documenti add column if not exists nome text;
alter table documenti add column if not exists cartella_id uuid;
alter table documenti add column if not exists segni jsonb;
alter table documenti add column if not exists segni_il timestamptz;
alter table documenti add column if not exists avviso_privacy boolean not null default true;
alter table documenti add column if not exists decide_autore boolean not null default false;
alter table documenti add column if not exists bucket text not null default 'documenti';
alter table documenti drop constraint if exists documenti_nome_check;
alter table documenti add constraint documenti_nome_check check (nome is null or length(nome) between 1 and 80);
alter table documenti drop constraint if exists documenti_bucket_check;
alter table documenti add constraint documenti_bucket_check check (bucket in ('documenti', 'cavalli-allegati'));
alter table documenti drop constraint if exists documenti_cartella_fk;
alter table documenti add constraint documenti_cartella_fk foreign key (cartella_id) references documenti_cartelle(id) on delete set null;
create index if not exists documenti_autore_creato on documenti(autore_user_id, creato_il desc);
create index if not exists documenti_cartella on documenti(cartella_id) where cartella_id is not null;
create index if not exists documenti_path on documenti(path);

alter table cavalli_allegati add column if not exists documento_id uuid references documenti(id) on delete set null;

alter table documenti_registro drop constraint if exists documenti_registro_azione_check;
alter table documenti_registro add constraint documenti_registro_azione_check check (azione = any (array[
  'caricato','condiviso','revocato','eliminato','urgenza_chiesta','urgenza_concessa',
  'visibilita','avviso_accettato','ripristinato']));

-- ---------- 2. campi protetti, chi decide, cartella dell'autore ----------
create or replace function equo_doc_protetti() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_ponte boolean := coalesce(current_setting('equo.doc_ponte', true), '') = '1';
begin
  if tg_op = 'INSERT' then
    if new.bucket is distinct from 'documenti' and not v_ponte then raise exception 'documenti: spazio non consentito'; end if;
    -- decide l'autore quando è un professionista (decisione 13/11)
    new.decide_autore := coalesce(new.autore_ruolo, (select p.ruolo from profiles p where p.id = new.autore_user_id), '')
                         in ('maniscalco', 'veterinario', 'istruttore');
    if new.segni is not null then new.segni_il := now(); end if;
  else
    if not v_ponte and (new.path is distinct from old.path or new.bucket is distinct from old.bucket
        or new.autore_user_id is distinct from old.autore_user_id or new.decide_autore is distinct from old.decide_autore) then
      raise exception 'documenti: percorso, spazio e autore non si possono cambiare';
    end if;
    if new.segni is distinct from old.segni then new.segni_il := now(); end if;
  end if;
  if new.cartella_id is not null and (tg_op = 'INSERT' or new.cartella_id is distinct from old.cartella_id)
     and not exists (select 1 from documenti_cartelle c where c.id = new.cartella_id and c.autore_user_id = new.autore_user_id) then
    raise exception 'documenti: la cartella non è tua';
  end if;
  return new;
end $$;
drop trigger if exists trg_documenti_protetti on documenti;
create trigger trg_documenti_protetti before insert or update on documenti for each row execute function equo_doc_protetti();

-- ---------- 3. regole di lettura e decisione ----------
create or replace function equo_doc_decide(p_doc uuid) returns text
language sql stable security definer set search_path = public as $$
  select case when coalesce((select solo_autore or decide_autore from documenti where id = p_doc), false) then 'autore'
              when equo_doc_owner(p_doc) is not null then 'proprietario'
              when equo_doc_centro(p_doc) is not null then 'struttura'
              else 'autore' end
$$;

create or replace function equo_doc_puo_vedere(p_doc uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select auth.uid() is not null and exists (
    select 1 from documenti d where d.id = p_doc and d.eliminato_il is null and (
      d.autore_user_id = auth.uid()
      or (not d.solo_autore and not d.decide_autore and (
           auth.uid() = equo_doc_owner(d.id)
           or (equo_doc_decide(d.id) = 'struttura' and is_admin_of_centro(equo_doc_centro(d.id)))))
      or (not d.solo_autore and d.sanitario_obbligatorio and equo_doc_centro(d.id) is not null and is_member_of_centro(equo_doc_centro(d.id)))
      or exists (select 1 from documenti_accessi a where a.documento_id = d.id and a.revocato_il is null
                   and (a.scade_il is null or a.scade_il > now())
                   and (a.user_id = auth.uid() or (a.centro_id is not null and is_member_of_centro(a.centro_id))))))
$$;

create or replace function equo_doc_path_visibile(p_path text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from documenti d where d.path = p_path and d.bucket = 'documenti' and equo_doc_puo_vedere(d.id))
$$;

create or replace function equo_allegato_visibile(p_id uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select case when (select documento_id from cavalli_allegati where id = p_id) is not null
    then equo_doc_puo_vedere((select documento_id from cavalli_allegati where id = p_id))
    else exists (
      select 1 from cavalli_allegati a
       where a.id = p_id and (
         a.autore_user_id = auth.uid()
         or exists (select 1 from horses h where h.id = a.horse_id and h.owner_id = auth.uid())
         or exists (select 1 from scuderia_cavalli sc where (sc.id = a.scuderia_cavallo_id or (a.horse_id is not null and sc.horse_id = a.horse_id))
                     and is_member_of_centro(sc.centro_id))
         or exists (select 1 from cavalli_clienti_mascalcia cv where cv.maniscalco_id = auth.uid()
                     and (cv.id = a.cavallo_cliente_id or (a.horse_id is not null and cv.horse_id = a.horse_id)
                          or (a.scuderia_cavallo_id is not null and cv.scuderia_cavallo_id = a.scuderia_cavallo_id))))) end
$$;

create or replace function equo_allegato_path_visibile(p_path text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from cavalli_allegati a where a.path = p_path and equo_allegato_visibile(a.id))
      or exists (select 1 from documenti d where d.path = p_path and d.bucket = 'cavalli-allegati' and equo_doc_puo_vedere(d.id))
$$;

-- condividere col proprietario ora crea un accesso quando decide l'autore
create or replace function equo_doc_condividi(p_doc uuid, p_user uuid default null, p_centro uuid default null, p_motivo text default 'condivisione')
returns json language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); d record; v_id uuid;
begin
  if v_uid is null then return json_build_object('ok', false, 'errore', 'non_autenticato'); end if;
  select * into d from documenti where id = p_doc and eliminato_il is null;
  if not found then return json_build_object('ok', false, 'errore', 'documento_non_trovato'); end if;
  if (p_user is null) = (p_centro is null) then return json_build_object('ok', false, 'errore', 'destinatario'); end if;
  if p_motivo not in ('condivisione','chat','consulto') then return json_build_object('ok', false, 'errore', 'motivo'); end if;
  if not (equo_doc_puo_decidere(p_doc) or (d.autore_user_id = v_uid and p_user is not null and p_user = equo_doc_owner(p_doc))) then
    return json_build_object('ok', false, 'errore', 'decide_' || equo_doc_decide(p_doc));
  end if;
  if p_user is not null and (p_user = d.autore_user_id or (not d.decide_autore and not d.solo_autore and p_user = equo_doc_owner(p_doc))) then
    return json_build_object('ok', true, 'gia', true);
  end if;
  select id into v_id from documenti_accessi
   where documento_id = p_doc and revocato_il is null and scade_il is null
     and coalesce(user_id::text, '') = coalesce(p_user::text, '') and coalesce(centro_id::text, '') = coalesce(p_centro::text, '');
  if v_id is not null then return json_build_object('ok', true, 'id', v_id, 'gia', true); end if;
  insert into documenti_accessi (documento_id, user_id, centro_id, motivo, concesso_da) values (p_doc, p_user, p_centro, p_motivo, v_uid) returning id into v_id;
  insert into documenti_registro (documento_id, user_id, azione, verso_user, verso_centro, dettagli)
    values (p_doc, v_uid, 'condiviso', p_user, p_centro, json_build_object('motivo', p_motivo)::jsonb);
  return json_build_object('ok', true, 'id', v_id);
end $$;

-- ---------- 4. «Chi lo vede»: Per sempre / 7 giorni / Nascosto ----------
create or replace function equo_doc_imposta(p_doc uuid, p_user uuid, p_centro uuid, p_modo text, p_motivo text default 'condivisione')
returns json language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); d documenti; v_scade timestamptz;
begin
  if v_uid is null then return json_build_object('ok', false, 'errore', 'non_autenticato'); end if;
  select * into d from documenti where id = p_doc and eliminato_il is null;
  if not found then return json_build_object('ok', false, 'errore', 'documento_non_trovato'); end if;
  if not equo_doc_puo_decidere(p_doc) then return json_build_object('ok', false, 'errore', 'non_puoi'); end if;
  if (p_user is null) = (p_centro is null) then return json_build_object('ok', false, 'errore', 'destinatario'); end if;
  if p_modo not in ('sempre', '7g', 'nascosto') then return json_build_object('ok', false, 'errore', 'modo'); end if;
  if p_motivo not in ('condivisione', 'chat', 'consulto') then return json_build_object('ok', false, 'errore', 'motivo'); end if;
  if p_user = d.autore_user_id then return json_build_object('ok', true, 'gia', true); end if;
  update documenti_accessi set revocato_il = now(), revocato_da = v_uid
   where documento_id = p_doc and revocato_il is null and (scade_il is null or scade_il > now())
     and coalesce(user_id::text, '') = coalesce(p_user::text, '') and coalesce(centro_id::text, '') = coalesce(p_centro::text, '');
  if p_modo <> 'nascosto' then
    v_scade := case when p_modo = '7g' then now() + interval '7 days' end;
    insert into documenti_accessi (documento_id, user_id, centro_id, motivo, concesso_da, scade_il)
      values (p_doc, p_user, p_centro, p_motivo, v_uid, v_scade);
  end if;
  insert into documenti_registro (documento_id, user_id, azione, verso_user, verso_centro, dettagli)
    values (p_doc, v_uid, 'visibilita', p_user, p_centro, jsonb_build_object('modo', p_modo, 'scade_il', v_scade, 'motivo', p_motivo));
  return json_build_object('ok', true, 'modo', p_modo, 'scade_il', v_scade,
    'resta_visibile', (p_centro is not null and d.sanitario_obbligatorio and p_modo = 'nascosto'));
end $$;

-- persone che possono vederlo: proprietario, cliente, struttura, colleghi che seguono il cavallo, chi l'ha ricevuto
create or replace function equo_doc_persone(p_doc uuid) returns json
language plpgsql stable security definer set search_path = public as $$
declare d documenti; v_horse uuid; v_owner uuid; v_cliu uuid; v_clic uuid; v_ubic uuid; r json;
begin
  select * into d from documenti where id = p_doc and eliminato_il is null;
  if not found or not equo_doc_puo_decidere(p_doc) then return null; end if;
  v_horse := equo_doc_horse(p_doc);
  v_owner := equo_doc_owner(p_doc);
  select cm.cliente_user_id, cm.centro_id into v_cliu, v_clic
    from cavalli_clienti_mascalcia cv join clienti_mascalcia cm on cm.id = cv.cliente_mascalcia_id where cv.id = d.cavallo_cliente_id;
  select cm.centro_id into v_ubic
    from cavalli_clienti_mascalcia cv join clienti_mascalcia cm on cm.id = cv.ubicazione_cliente_id where cv.id = d.cavallo_cliente_id;
  with cand as (
    select 1 as ord, 'proprietario'::text as tipo, v_owner as user_id, null::uuid as centro_id
     where v_owner is not null and v_owner <> d.autore_user_id
    union all
    select 2, 'cliente', v_cliu, null where v_cliu is not null and v_cliu is distinct from v_owner and v_cliu <> d.autore_user_id
    union all
    select 3, 'struttura', null, s.c from (select equo_doc_centro(p_doc) as c union select v_clic union select v_ubic) s where s.c is not null
    union all
    select 4, 'collega', x.maniscalco_id, null from (
      select distinct x2.maniscalco_id from cavalli_clienti_mascalcia x2
       where v_horse is not null and x2.horse_id = v_horse and x2.archiviato_il is null and x2.maniscalco_id <> d.autore_user_id) x
    union all
    select 5, 'altro', a.user_id, a.centro_id from documenti_accessi a
     where a.documento_id = p_doc and a.revocato_il is null and (a.scade_il is null or a.scade_il > now())
  ), uniq as (
    select distinct on (coalesce(user_id::text, ''), coalesce(centro_id::text, '')) * from cand
     order by coalesce(user_id::text, ''), coalesce(centro_id::text, ''), ord
  )
  select json_agg(json_build_object(
      'tipo', u.tipo, 'user_id', u.user_id, 'centro_id', u.centro_id,
      'nome', coalesce(equo_nome_profilo(u.user_id), (select c.nome from centri c where c.id = u.centro_id), 'Senza nome'),
      'ruolo', case u.tipo when 'proprietario' then 'Proprietario' when 'cliente' then 'Cliente' when 'struttura' then 'Struttura'
                 else coalesce(initcap((select p.ruolo from profiles p where p.id = u.user_id)), 'Ricevuto') end,
      'segue', u.tipo in ('proprietario', 'collega'),
      'motivo', acc.motivo,
      'modo', case when acc.id is null then 'nascosto' when acc.scade_il is null then 'sempre' else '7g' end,
      'scade_il', acc.scade_il,
      'bloccato', (u.centro_id is not null and d.sanitario_obbligatorio)
    ) order by u.ord) into r
  from uniq u
  left join lateral (
    select a.id, a.scade_il, a.motivo from documenti_accessi a
     where a.documento_id = p_doc and a.revocato_il is null and (a.scade_il is null or a.scade_il > now())
       and coalesce(a.user_id::text, '') = coalesce(u.user_id::text, '') and coalesce(a.centro_id::text, '') = coalesce(u.centro_id::text, '')
     order by a.scade_il nulls first limit 1) acc on true;
  return json_build_object('persone', coalesce(r, '[]'::json), 'sanitario', d.sanitario_obbligatorio,
    'avviso_privacy', d.avviso_privacy, 'decide', equo_doc_decide(p_doc));
end $$;

-- ---------- 5. Archivio: i miei contenuti e le mie cartelle ----------
create or replace function equo_archivio_lista() returns json
language sql stable security definer set search_path = public as $$
  select json_build_object(
    'cartelle', coalesce((select json_agg(json_build_object('id', c.id, 'nome', c.nome,
        'n', (select count(*) from documenti d where d.cartella_id = c.id and d.eliminato_il is null)) order by lower(c.nome))
      from documenti_cartelle c where c.autore_user_id = auth.uid()), '[]'::json),
    'documenti', coalesce((select json_agg(json_build_object(
        'id', d.id, 'nome', d.nome, 'titolo', d.titolo, 'categoria', d.categoria, 'mime', d.mime, 'byte', d.byte, 'path', d.path, 'bucket', d.bucket,
        'data_documento', d.data_documento, 'creato_il', d.creato_il, 'eliminato_il', d.eliminato_il, 'cartella_id', d.cartella_id,
        'n_segni', case when jsonb_typeof(d.segni -> 'items') = 'array' then jsonb_array_length(d.segni -> 'items') else 0 end,
        'avviso_privacy', d.avviso_privacy, 'sanitario', d.sanitario_obbligatorio, 'zona', d.zona, 'nota', d.nota, 'numero', d.numero,
        'horse_id', d.horse_id, 'cavallo_cliente_id', d.cavallo_cliente_id, 'visita_id', d.visita_id,
        'cavallo_nome', coalesce(cv.nome, h.name), 'cliente_nome', cm.nome,
        'sempre', (select count(*) from documenti_accessi a where a.documento_id = d.id and a.revocato_il is null and a.scade_il is null),
        'a_tempo', (select count(*) from documenti_accessi a where a.documento_id = d.id and a.revocato_il is null and a.scade_il > now()),
        'scade_il', (select min(a.scade_il) from documenti_accessi a where a.documento_id = d.id and a.revocato_il is null and a.scade_il > now())
      ) order by d.creato_il desc)
      from documenti d
      left join cavalli_clienti_mascalcia cv on cv.id = d.cavallo_cliente_id
      left join clienti_mascalcia cm on cm.id = cv.cliente_mascalcia_id
      left join horses h on h.id = d.horse_id
     where d.autore_user_id = auth.uid() and (d.eliminato_il is null or d.eliminato_il > now() - interval '30 days')), '[]'::json))
  where auth.uid() is not null
$$;

create or replace function equo_doc_ripristina(p_doc uuid) returns json
language plpgsql security definer set search_path = public as $$
declare d documenti;
begin
  select * into d from documenti where id = p_doc and autore_user_id = auth.uid();
  if not found then return json_build_object('ok', false, 'errore', 'non_trovato'); end if;
  if d.eliminato_il is null then return json_build_object('ok', true, 'gia', true); end if;
  if d.eliminato_il < now() - interval '30 days' then return json_build_object('ok', false, 'errore', 'scaduto'); end if;
  update documenti set eliminato_il = null where id = p_doc;
  insert into documenti_registro (documento_id, user_id, azione) values (p_doc, auth.uid(), 'ripristinato');
  return json_build_object('ok', true);
end $$;

-- ---------- 6. apertura con avviso privacy ----------
create or replace function equo_doc_apri(p_doc uuid) returns json
language plpgsql stable security definer set search_path = public as $$
declare d documenti;
begin
  if not equo_doc_puo_vedere(p_doc) then return json_build_object('ok', false, 'errore', 'accesso'); end if;
  select * into d from documenti where id = p_doc;
  return json_build_object('ok', true, 'id', d.id, 'bucket', d.bucket, 'path', d.path, 'mime', d.mime, 'titolo', d.titolo, 'nome', d.nome,
    'horse_id', d.horse_id, 'cavallo_cliente_id', d.cavallo_cliente_id, 'data_documento', d.data_documento, 'creato_il', d.creato_il,
    'segni', d.segni, 'mio', d.autore_user_id = auth.uid(), 'autore_nome', equo_nome_profilo(d.autore_user_id), 'io', equo_nome_profilo(auth.uid()),
    'avviso', d.avviso_privacy and d.autore_user_id <> auth.uid()
              and not exists (select 1 from documenti_registro r where r.documento_id = p_doc and r.user_id = auth.uid() and r.azione = 'avviso_accettato'),
    'scade_il', (select max(a.scade_il) from documenti_accessi a where a.documento_id = p_doc and a.user_id = auth.uid() and a.revocato_il is null
                   and a.scade_il > now() and not exists (select 1 from documenti_accessi b where b.documento_id = p_doc and b.user_id = auth.uid()
                   and b.revocato_il is null and b.scade_il is null)));
end $$;

create or replace function equo_doc_accetta_avviso(p_doc uuid) returns json
language plpgsql security definer set search_path = public as $$
begin
  if not equo_doc_puo_vedere(p_doc) then return json_build_object('ok', false, 'errore', 'accesso'); end if;
  if not exists (select 1 from documenti_registro r where r.documento_id = p_doc and r.user_id = auth.uid() and r.azione = 'avviso_accettato') then
    insert into documenti_registro (documento_id, user_id, azione, dettagli)
      values (p_doc, auth.uid(), 'avviso_accettato', jsonb_build_object('testo', 'Questo documento è protetto dalla normativa sulla privacy e dai diritti del professionista che lo ha inviato. Non puoi condividerlo, inoltrarlo o pubblicarlo senza la sua autorizzazione.'));
  end if;
  return json_build_object('ok', true);
end $$;

-- ---------- 7. allegati del professionista nel registro (ponte con cavalli_allegati) ----------
create or replace function equo_doc_titolo(p_cav text, p_data date, p_cat text, p_zona text, p_num int, p_nota text) returns text
language sql immutable set search_path = public as $$
  select left(array_to_string(array_remove(array[
      nullif(trim(coalesce(p_cav, '')), ''),
      case when p_data is null then null else extract(day from p_data)::int || ' '
        || (array['gen','feb','mar','apr','mag','giu','lug','ago','set','ott','nov','dic'])[extract(month from p_data)::int] || ' ' || extract(year from p_data)::int end,
      coalesce((jsonb_build_object('referto','Referto','lastra','Lastra','ecografia','Ecografia','esame','Esame','foto_clinica','Foto clinica','video','Video',
        'documento_sanitario','Documento sanitario','documento','Documento','seduta','Seduta','coggins','Coggins','vaccino','Vaccino','passaporto','Passaporto') ->> p_cat), 'Documento')
        || case when p_num > 1 then ' (' || p_num || ')' else '' end,
      nullif(trim(coalesce(p_nota, '')), '')], null), ' · '), 160)
$$;

create or replace function equo_doc_nome_da_file(p_nome text) returns text
language sql immutable set search_path = public as $$
  select case when x is null or x ~* '^(img|dsc|dcim|pxl|image|photo|foto|screenshot|whatsapp|scan|allegato|signal|telegram|[0-9_ -]+$)' then null else left(x, 80) end
    from (select nullif(trim(regexp_replace(coalesce(p_nome, ''), '\.[A-Za-z0-9]{1,5}$', '')), '') as x) s
$$;

drop function if exists equo_aggiungi_allegato(text, uuid, text, text, text, bigint);
create or replace function equo_aggiungi_allegato(p_vista text, p_id uuid, p_nome text, p_path text, p_mime text, p_byte bigint, p_vedi text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare k record; v_id uuid; v_riga uuid; v_scheda uuid; v_nome text; v_cod text; v_ruolo text; v_cat text; v_cav text; v_num int; v_own uuid; v_cli uuid;
begin
  select * into k from equo_chiavi_cavallo(p_vista, p_id);
  if not k.ok then return jsonb_build_object('ok', false, 'errore', 'Cavallo non trovato.'); end if;
  if p_path is null or split_part(p_path, '/', 1) <> auth.uid()::text then return jsonb_build_object('ok', false, 'errore', 'File non valido.'); end if;
  v_riga := case when p_vista = 'maniscalco' then p_id end;
  v_scheda := case when p_vista = 'scuderia' then p_id else k.schede[1] end;
  v_nome := equo_nome_profilo(auth.uid());
  select coalesce((select codice_equo from horses where id = k.horse), (select codice_equo from scuderia_cavalli where id = v_scheda),
                  (select codice_equo from cavalli_clienti_mascalcia where id = v_riga)) into v_cod;
  if p_vista = 'maniscalco' then
    -- professionista: entra nello spazio privato (decide lui chi lo vede; di base solo lui)
    v_ruolo := case when (select ruolo from profiles where id = auth.uid()) = 'veterinario' then 'veterinario' else 'maniscalco' end;
    v_cat := case when p_mime like 'image/%' then 'foto_clinica' when p_mime like 'video/%' then 'video' else 'documento' end;
    v_cav := coalesce((select nome from cavalli_clienti_mascalcia where id = v_riga), (select name from horses where id = k.horse));
    select coalesce(max(d.numero), 0) + 1 into v_num from documenti d
     where d.eliminato_il is null and d.data_documento = current_date and d.categoria = v_cat and d.zona is null
       and ((k.horse is not null and d.horse_id = k.horse) or d.cavallo_cliente_id = v_riga);
    perform set_config('equo.doc_ponte', '1', true);
    insert into documenti (horse_id, cavallo_cliente_id, scuderia_cavallo_id, autore_user_id, autore_ruolo, categoria, titolo, nome,
                           path, bucket, mime, byte, data_documento, numero)
    values (k.horse, v_riga, v_scheda, auth.uid(), v_ruolo, v_cat, equo_doc_titolo(v_cav, current_date, v_cat, null, v_num, null), equo_doc_nome_da_file(p_nome),
            p_path, 'cavalli-allegati', p_mime, p_byte, current_date, v_num)
    returning id into v_id;
    perform set_config('equo.doc_ponte', '', true);
    if p_vedi = 'proprietario' then
      v_own := equo_doc_owner(v_id);
      select cm.cliente_user_id into v_cli from cavalli_clienti_mascalcia cv join clienti_mascalcia cm on cm.id = cv.cliente_mascalcia_id where cv.id = v_riga;
      if v_own is not null and v_own <> auth.uid() then
        insert into documenti_accessi (documento_id, user_id, motivo, concesso_da) values (v_id, v_own, 'condivisione', auth.uid());
      end if;
      if v_cli is not null and v_cli is distinct from v_own and v_cli <> auth.uid() then
        insert into documenti_accessi (documento_id, user_id, motivo, concesso_da) values (v_id, v_cli, 'condivisione', auth.uid());
      end if;
    end if;
  else
    insert into cavalli_allegati (horse_id, scuderia_cavallo_id, cavallo_cliente_id, autore_user_id, autore_ruolo, autore_nome, nome, path, mime, byte)
    values (k.horse, v_scheda, v_riga, auth.uid(), p_vista, v_nome, left(coalesce(nullif(trim(p_nome), ''), 'allegato'), 160), p_path, p_mime, p_byte)
    returning id into v_id;
  end if;
  insert into cavalli_storico (codice_equo, horse_id, scuderia_cavallo_id, cavallo_cliente_id, tipo, descrizione, autore_user_id, autore_ruolo, app)
  values (v_cod, k.horse, v_scheda, v_riga, 'allegato', 'Allegato aggiunto: «' || left(coalesce(p_nome, 'allegato'), 160) || '» (' || p_vista || ' ' || coalesce(v_nome, '') || ')',
          auth.uid(), p_vista, case when p_vista = 'scuderia' then 'scuderia' else 'app' end);
  return jsonb_build_object('ok', true, 'id', v_id, 'documento', p_vista = 'maniscalco');
end $$;
grant execute on function equo_aggiungi_allegato(text, uuid, text, text, text, bigint, text) to authenticated;

drop function if exists equo_allegati_cavallo(text, uuid);
create or replace function equo_allegati_cavallo(p_vista text, p_id uuid)
returns table(id uuid, nome text, path text, mime text, byte bigint, autore_ruolo text, autore_nome text, mio boolean,
              created_at timestamptz, bucket text, documento boolean)
language plpgsql stable security definer set search_path = public as $$
declare k record;
begin
  select * into k from equo_chiavi_cavallo(p_vista, p_id);
  if not k.ok then return; end if;
  return query
    select x.* from (
      select a.id, a.nome, a.path, a.mime, a.byte, a.autore_ruolo, a.autore_nome, a.autore_user_id = auth.uid(), a.created_at,
             'cavalli-allegati'::text, false
        from cavalli_allegati a
       where a.documento_id is null
         and ((k.horse is not null and a.horse_id = k.horse) or a.scuderia_cavallo_id = any(k.schede) or a.cavallo_cliente_id = any(k.righe))
      union all
      select d.id, coalesce(d.nome, d.titolo), d.path, d.mime, d.byte, d.autore_ruolo, equo_nome_profilo(d.autore_user_id), d.autore_user_id = auth.uid(),
             d.creato_il, d.bucket, true
        from documenti d
       where d.eliminato_il is null
         and ((k.horse is not null and d.horse_id = k.horse) or d.scuderia_cavallo_id = any(k.schede) or d.cavallo_cliente_id = any(k.righe))
         and equo_doc_puo_vedere(d.id)
    ) x order by 9 desc;
end $$;
grant execute on function equo_allegati_cavallo(text, uuid) to authenticated;

create or replace function equo_elimina_allegato(p_id uuid) returns jsonb
language plpgsql security definer set search_path = public as $$
declare a cavalli_allegati; d documenti;
begin
  select * into d from documenti where id = p_id;
  if d.id is not null then
    if d.autore_user_id is distinct from auth.uid() then return jsonb_build_object('ok', false, 'errore', 'Puoi eliminare solo i file che hai caricato tu.'); end if;
    update documenti set eliminato_il = now() where id = p_id and eliminato_il is null;
    return jsonb_build_object('ok', true, 'path', null, 'recuperabile', true);   -- resta 30 giorni nell'Archivio, «Eliminati»
  end if;
  select * into a from cavalli_allegati where id = p_id;
  if a.id is null then return jsonb_build_object('ok', false, 'errore', 'Allegato non trovato.'); end if;
  if a.autore_user_id is distinct from auth.uid() then return jsonb_build_object('ok', false, 'errore', 'Puoi eliminare solo i file che hai caricato tu.'); end if;
  delete from cavalli_allegati where id = p_id;
  insert into cavalli_storico (codice_equo, horse_id, scuderia_cavallo_id, cavallo_cliente_id, tipo, descrizione, autore_user_id, autore_ruolo, app)
  values (null, a.horse_id, a.scuderia_cavallo_id, a.cavallo_cliente_id, 'allegato', 'Allegato eliminato: «' || a.nome || '» (' || a.autore_ruolo || ' ' || coalesce(a.autore_nome, '') || ')',
          auth.uid(), a.autore_ruolo, case when a.autore_ruolo = 'scuderia' then 'scuderia' else 'app' end);
  return jsonb_build_object('ok', true, 'path', a.path);
end $$;

grant execute on function equo_doc_imposta(uuid, uuid, uuid, text, text), equo_doc_persone(uuid), equo_archivio_lista(), equo_doc_ripristina(uuid),
  equo_doc_apri(uuid), equo_doc_accetta_avviso(uuid) to authenticated;
revoke execute on function equo_doc_imposta(uuid, uuid, uuid, text, text), equo_doc_persone(uuid), equo_archivio_lista(), equo_doc_ripristina(uuid),
  equo_doc_apri(uuid), equo_doc_accetta_avviso(uuid), equo_aggiungi_allegato(text, uuid, text, text, text, bigint, text) from anon;

-- ---------- 8. spostamento degli allegati dei professionisti (stesse persone di prima) ----------
do $$
declare a record; v_id uuid; v_cat text; v_cav text; v_num int; v_own uuid; c uuid; m uuid; v_data date;
begin
  perform set_config('equo.doc_ponte', '1', true);
  for a in select * from cavalli_allegati where documento_id is null and autore_ruolo in ('maniscalco', 'veterinario') order by created_at loop
    v_cat := case when a.mime like 'image/%' then 'foto_clinica' when a.mime like 'video/%' then 'video' else 'documento' end;
    v_cav := coalesce((select nome from cavalli_clienti_mascalcia where id = a.cavallo_cliente_id), (select name from horses where id = a.horse_id));
    v_data := (a.created_at at time zone 'Europe/Rome')::date;
    select coalesce(max(d.numero), 0) + 1 into v_num from documenti d
     where d.eliminato_il is null and d.data_documento = v_data and d.categoria = v_cat and d.zona is null
       and ((a.horse_id is not null and d.horse_id = a.horse_id) or (a.cavallo_cliente_id is not null and d.cavallo_cliente_id = a.cavallo_cliente_id));
    insert into documenti (horse_id, cavallo_cliente_id, scuderia_cavallo_id, autore_user_id, autore_ruolo, categoria, titolo, nome,
                           path, bucket, mime, byte, data_documento, numero, creato_il, avviso_privacy)
    values (a.horse_id, a.cavallo_cliente_id, a.scuderia_cavallo_id, a.autore_user_id, a.autore_ruolo, v_cat,
            equo_doc_titolo(v_cav, v_data, v_cat, null, v_num, null), equo_doc_nome_da_file(a.nome),
            a.path, 'cavalli-allegati', a.mime, a.byte, v_data, v_num, a.created_at, false)
    returning id into v_id;
    update cavalli_allegati set documento_id = v_id where id = a.id;
    -- chi lo vedeva prima: proprietario, scuderie dove sta o stava, maniscalchi che seguono il cavallo
    v_own := (select h.owner_id from horses h where h.id = a.horse_id);
    if v_own is not null and v_own <> a.autore_user_id then
      insert into documenti_accessi (documento_id, user_id, motivo, concesso_da) values (v_id, v_own, 'condivisione', a.autore_user_id);
    end if;
    for c in select distinct sc.centro_id from scuderia_cavalli sc
              where sc.centro_id is not null and (sc.id = a.scuderia_cavallo_id or (a.horse_id is not null and sc.horse_id = a.horse_id)) loop
      insert into documenti_accessi (documento_id, centro_id, motivo, concesso_da) values (v_id, c, 'condivisione', a.autore_user_id);
    end loop;
    for m in select distinct cv.maniscalco_id from cavalli_clienti_mascalcia cv
              where cv.maniscalco_id <> a.autore_user_id and (v_own is null or cv.maniscalco_id <> v_own)
                and (cv.id = a.cavallo_cliente_id or (a.horse_id is not null and cv.horse_id = a.horse_id)
                     or (a.scuderia_cavallo_id is not null and cv.scuderia_cavallo_id = a.scuderia_cavallo_id)) loop
      insert into documenti_accessi (documento_id, user_id, motivo, concesso_da) values (v_id, m, 'condivisione', a.autore_user_id);
    end loop;
  end loop;
  perform set_config('equo.doc_ponte', '', true);
end $$;

-- ---------- 9. guide degli agenti (Hammer e Galeno) ----------
insert into ai_conoscenze (categoria, titolo, contenuto, ambito)
select 'guida', 'Archivio: foto, lastre e documenti (rinomina, cartelle, chi lo vede)',
'Menu › Archivio (maniscalco e veterinario) raccoglie tutto quello che il professionista ha caricato: foto, lastre, PDF, referti, anche dalla scheda del cavallo e da «Segna un problema». In alto la ricerca (cavallo, cliente, nome) e i filtri Tutti · Foto · Lastre · PDF e referti · Disegnati; «+ Cartella» crea una cartella (le cartelle sono solo sue: chi riceve un file non le vede); «Carica» aggiunge un file scegliendo il cavallo. Toccando un contenuto: Disegna e misura · Rinomina (il nuovo nome lo vedono tutti, sotto resta quello dato da Equo) · Sposta in cartella · Chi lo vede · Manda in chat · Scarica (con i segni o solo l''originale) · Elimina (resta recuperabile 30 giorni in fondo all''Archivio, «Eliminati»). CHI LO VEDE: per ogni persona (proprietario, cliente, scuderia, colleghi che seguono il cavallo, chi l''ha ricevuto in chat) si sceglie Per sempre, 7 giorni (poi si chiude da solo) o Nascosto; si cambia quando si vuole. Di base un contenuto nuovo è Nascosto: lo vede solo chi l''ha caricato. Decide sempre il professionista che l''ha creato, anche verso il proprietario. Nel libretto del cavallo compare solo l''intervento con la data, mai gli allegati. I documenti sanitari obbligatori (Coggins, vaccino, passaporto) la scuderia li vede comunque. «+ Aggiungi un collega per un consulto» dà l''accesso a un collega. Togliere l''accesso non cancella le copie già scaricate. AVVISO PRIVACY: acceso di serie; chi riceve il file, la prima volta, legge «Questo documento è protetto dalla normativa sulla privacy e dai diritti del professionista che lo ha inviato. Non puoi condividerlo, inoltrarlo o pubblicarlo senza la sua autorizzazione.», mette la spunta «Ho letto e accetto» e solo allora apre; la spunta resta registrata. Le foto si aprono con il nome di chi guarda e la data in filigrana. L''interruttore è in «Chi lo vede».', 'maniscalco'
where not exists (select 1 from ai_conoscenze where categoria = 'guida' and titolo = 'Archivio: foto, lastre e documenti (rinomina, cartelle, chi lo vede)');

insert into ai_conoscenze (categoria, titolo, contenuto, ambito)
select 'guida', 'Disegnare e misurare su foto e lastre (prima/dopo)',
'Da Archivio (o toccando una foto) › «Disegna e misura». L''originale non cambia mai: i segni sono un livello sopra, si possono riaprire, correggere, spostare e cancellare; l''interruttore «Segni» li accende e spegne. Strumenti: Penna, Freccia, Forma (cerchio), Testo, Misura, Angolo, Bilancia, Prima/dopo; 4 colori e lo spessore; Annulla e Rifai. MISURE IN CM: prima si calibra («Calibra»): si traccia una linea su qualcosa di misura nota (marker della lastra, larghezza del ferro, righello) e si scrive quanti millimetri è; poi «Misura» dà la lunghezza in cm. ANGOLO: tre tocchi (primo punto, vertice, secondo punto), es. angolo della punta rispetto al terreno o asse falangeo. BILANCIA: una linea tra due punti (es. talloni mediale e laterale): dice di quanti gradi pende e la differenza in mm rispetto all''orizzontale. Ogni segno ha un numero e si può scrivere una nota. PRIMA/DOPO: si sceglie un''altra foto dello stesso cavallo, si vedono affiancate o sovrapposte, «Copia i segni» riporta i segni della prima sulla seconda, la tabella confronta angoli e misure (valgono solo se tutte e due le foto sono calibrate); «Salva il confronto» crea una nuova immagine nell''Archivio. Chi riceve la foto vede i segni sopra l''immagine.', 'maniscalco'
where not exists (select 1 from ai_conoscenze where categoria = 'guida' and titolo = 'Disegnare e misurare su foto e lastre (prima/dopo)');


insert into ai_conoscenze (categoria, titolo, contenuto, ambito)
select 'guida', 'Foto e lastre ricevute dal maniscalco o dal veterinario',
'Quando il maniscalco o il veterinario ti manda una foto, una lastra o un documento, lo trovi in chat e nella scheda del cavallo (Allegati). La prima volta compare l''avviso «Documento protetto»: metti la spunta «Ho letto e accetto» e tocca «Apri il documento»; la spunta resta registrata. Le foto si aprono dentro Equo con il tuo nome e la data in filigrana, e con i segni e le misure del professionista sopra (interruttore «Segni»). Il professionista decide chi vede i suoi contenuti: può darti l''accesso per sempre o per 7 giorni (poi si chiude da solo) e può toglierlo. Non condividere né pubblicare questi file senza il suo permesso. Nel libretto del cavallo trovi l''intervento con la data; gli allegati restano nella chat e nella scheda del cavallo.', 'proprietario'
where not exists (select 1 from ai_conoscenze where categoria = 'guida' and titolo = 'Foto e lastre ricevute dal maniscalco o dal veterinario');

-- ---------- 10. controlli ----------
do $$
declare v_prova boolean := true;   -- ← metti false per l'esecuzione vera
  n_doc int; n_acc int; n_ponte int; n_guide int;
begin
  select count(*) into n_doc from documenti where bucket = 'cavalli-allegati';
  select count(*) into n_acc from documenti_accessi a join documenti d on d.id = a.documento_id where d.bucket = 'cavalli-allegati';
  select count(*) into n_ponte from cavalli_allegati where documento_id is not null;
  select count(*) into n_guide from ai_conoscenze where categoria = 'guida' and titolo in ('Archivio: foto, lastre e documenti (rinomina, cartelle, chi lo vede)', 'Disegnare e misurare su foto e lastre (prima/dopo)', 'Foto e lastre ricevute dal maniscalco o dal veterinario');
  if n_doc <> n_ponte then raise exception 'ERRORE: documenti spostati % ma allegati collegati %', n_doc, n_ponte; end if;
  if exists (select 1 from cavalli_allegati where documento_id is null and autore_ruolo in ('maniscalco', 'veterinario')) then
    raise exception 'ERRORE: restano allegati di professionisti non spostati';
  end if;
  if v_prova then
    raise exception 'PROVA_OK spostati=% accessi=% guide=% (nessuna modifica salvata)', n_doc, n_acc, n_guide;
  end if;
  raise notice 'FATTO spostati=% accessi=% guide=%', n_doc, n_acc, n_guide;
end $$;

notify pgrst, 'reload schema';
commit;
