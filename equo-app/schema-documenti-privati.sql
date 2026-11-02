-- Equo: DOCUMENTI PRIVATI con accessi file per file (2 novembre 2026) · SQL 32 · fase 1 di claude/Equo_Privacy_documenti.md
-- Sistema COMUNE a tutti i ruoli. Decisioni di Simone (2/11):
--  · un file lo vedono di base solo il PROPRIETARIO del cavallo e l'AUTORE (chi l'ha caricato); l'autore lo vede sempre;
--  · chi decide sugli accessi: proprietario su Equo → altrimenti la struttura (admin di Equo Scuderia dove sta il cavallo)
--    → altrimenti l'autore, solo per i suoi file;
--  · documenti sanitari obbligatori (Coggins, vaccini, passaporto): visibili anche allo staff della scuderia dove sta il cavallo;
--  · ogni condivisione e revoca resta nello storico.
-- Qui: tabelle documenti / documenti_accessi / documenti_registro, spazio privato «documenti» (link solo temporanei),
-- funzioni «chi vede» e «chi decide», condivisione e revoca. Nessun dato esistente viene spostato (fase 4).
-- L'accesso d'urgenza (fase 5) userà documenti_accessi con motivo 'urgenza' e scadenza.
-- Rieseguibile.

-- 1 · tabelle -------------------------------------------------------------------------------------
create table if not exists public.documenti (
  id uuid primary key default gen_random_uuid(),
  horse_id uuid references public.horses(id) on delete set null,
  cavallo_cliente_id uuid references public.cavalli_clienti_mascalcia(id) on delete set null,
  scuderia_cavallo_id uuid references public.scuderia_cavalli(id) on delete set null,
  autore_user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  autore_ruolo text,                                   -- veterinario | maniscalco | istruttore | proprietario | scuderia
  categoria text not null default 'documento' check (categoria in
    ('referto','lastra','ecografia','esame','foto_clinica','video','documento_sanitario','documento','seduta')),
  sanitario_obbligatorio boolean not null default false,   -- Coggins, vaccini, passaporto
  titolo text not null default 'Documento' check (length(titolo) between 1 and 160),
  path text not null unique,                           -- nello spazio «documenti»: <autore>/<…>
  mime text, byte bigint,
  visita_id uuid references public.visite_pro(id) on delete set null,
  creato_il timestamptz not null default now(),
  eliminato_il timestamptz,
  check (horse_id is not null or cavallo_cliente_id is not null or scuderia_cavallo_id is not null)
);
create index if not exists documenti_horse_idx on public.documenti (horse_id);
create index if not exists documenti_cavcli_idx on public.documenti (cavallo_cliente_id);
create index if not exists documenti_sccav_idx on public.documenti (scuderia_cavallo_id);
create index if not exists documenti_autore_idx on public.documenti (autore_user_id);
create index if not exists documenti_visita_idx on public.documenti (visita_id);

create table if not exists public.documenti_accessi (
  id uuid primary key default gen_random_uuid(),
  documento_id uuid not null references public.documenti(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  centro_id uuid references public.centri(id) on delete cascade,     -- staff della struttura
  motivo text not null default 'condivisione' check (motivo in ('condivisione','chat','consulto','urgenza')),
  concesso_da uuid references auth.users(id) on delete set null,
  concesso_il timestamptz not null default now(),
  scade_il timestamptz,
  revocato_il timestamptz,
  revocato_da uuid references auth.users(id) on delete set null,
  check ((user_id is not null) <> (centro_id is not null))
);
create index if not exists documenti_accessi_doc_idx on public.documenti_accessi (documento_id);
create index if not exists documenti_accessi_user_idx on public.documenti_accessi (user_id) where revocato_il is null;

create table if not exists public.documenti_registro (
  id bigserial primary key,
  documento_id uuid not null references public.documenti(id) on delete cascade,
  user_id uuid,                                        -- chi ha fatto l'azione
  azione text not null check (azione in ('caricato','condiviso','revocato','eliminato','urgenza_chiesta','urgenza_concessa')),
  verso_user uuid, verso_centro uuid,
  quando timestamptz not null default now(),
  dettagli jsonb
);
create index if not exists documenti_registro_doc_idx on public.documenti_registro (documento_id, quando desc);

-- 2 · chi è chi per un documento -----------------------------------------------------------------
-- cavallo Equo del documento (diretto, dalla scheda del professionista o dalla scheda della scuderia)
create or replace function public.equo_doc_horse(p_doc uuid) returns uuid
language sql stable security definer set search_path to 'public' as $$
  select coalesce(d.horse_id, cv.horse_id, sc.horse_id)
    from documenti d
    left join cavalli_clienti_mascalcia cv on cv.id = d.cavallo_cliente_id
    left join scuderia_cavalli sc on sc.id = d.scuderia_cavallo_id
   where d.id = p_doc
$$;
-- proprietario su Equo: owner del cavallo Equo, oppure il proprietario-membro della scheda in scuderia
create or replace function public.equo_doc_owner(p_doc uuid) returns uuid
language sql stable security definer set search_path to 'public' as $$
  select coalesce(
    (select h.owner_id from horses h where h.id = equo_doc_horse(p_doc)),
    (select m.user_id from documenti d join scuderia_cavalli sc on sc.id = d.scuderia_cavallo_id
       join scuderia_membri m on m.id = sc.proprietario_membro_id where d.id = p_doc))
$$;
-- struttura (Equo Scuderia) dove il cavallo sta adesso
create or replace function public.equo_doc_centro(p_doc uuid) returns uuid
language sql stable security definer set search_path to 'public' as $$
  select sc.centro_id from documenti d
    join scuderia_cavalli sc on sc.uscito_il is null
     and (sc.id = d.scuderia_cavallo_id or (equo_doc_horse(p_doc) is not null and sc.horse_id = equo_doc_horse(p_doc)))
   where d.id = p_doc
   order by (sc.id = d.scuderia_cavallo_id) desc
   limit 1
$$;
-- chi decide: 'proprietario' | 'struttura' | 'autore'
create or replace function public.equo_doc_decide(p_doc uuid) returns text
language sql stable security definer set search_path to 'public' as $$
  select case when equo_doc_owner(p_doc) is not null then 'proprietario'
              when equo_doc_centro(p_doc) is not null then 'struttura'
              else 'autore' end
$$;
create or replace function public.equo_doc_puo_decidere(p_doc uuid) returns boolean
language sql stable security definer set search_path to 'public' as $$
  select auth.uid() is not null and exists (select 1 from documenti d where d.id = p_doc and d.eliminato_il is null) and
    case equo_doc_decide(p_doc)
      when 'proprietario' then auth.uid() = equo_doc_owner(p_doc)
      when 'struttura' then is_admin_of_centro(equo_doc_centro(p_doc))
      else auth.uid() = (select autore_user_id from documenti where id = p_doc) end
$$;
create or replace function public.equo_doc_puo_vedere(p_doc uuid) returns boolean
language sql stable security definer set search_path to 'public' as $$
  select auth.uid() is not null and exists (
    select 1 from documenti d where d.id = p_doc and d.eliminato_il is null and (
      d.autore_user_id = auth.uid()
      or auth.uid() = equo_doc_owner(d.id)
      or (equo_doc_decide(d.id) = 'struttura' and is_admin_of_centro(equo_doc_centro(d.id)))
      or (d.sanitario_obbligatorio and equo_doc_centro(d.id) is not null and is_member_of_centro(equo_doc_centro(d.id)))
      or exists (select 1 from documenti_accessi a where a.documento_id = d.id and a.revocato_il is null
                   and (a.scade_il is null or a.scade_il > now())
                   and (a.user_id = auth.uid() or (a.centro_id is not null and is_member_of_centro(a.centro_id))))))
$$;
-- chi può caricare un documento su un cavallo: proprietario, professionista che ha la scheda del cavallo, staff della scuderia
create or replace function public.equo_doc_puo_caricare(p_horse uuid, p_cavcli uuid, p_sccav uuid) returns boolean
language sql stable security definer set search_path to 'public' as $$
  select auth.uid() is not null and (
    (p_horse is not null and exists (select 1 from horses h where h.id = p_horse and h.owner_id = auth.uid()))
    or (p_cavcli is not null and exists (select 1 from cavalli_clienti_mascalcia cv where cv.id = p_cavcli and cv.maniscalco_id = auth.uid()))
    or (p_horse is not null and exists (select 1 from cavalli_clienti_mascalcia cv where cv.horse_id = p_horse and cv.maniscalco_id = auth.uid() and cv.archiviato_il is null))
    or (p_sccav is not null and exists (select 1 from scuderia_cavalli sc where sc.id = p_sccav and is_member_of_centro(sc.centro_id))))
$$;
create or replace function public.equo_doc_path_visibile(p_path text) returns boolean
language sql stable security definer set search_path to 'public' as $$
  select exists (select 1 from documenti d where d.path = p_path and equo_doc_puo_vedere(d.id))
$$;

-- 3 · regole di accesso alle tabelle --------------------------------------------------------------
alter table public.documenti enable row level security;
alter table public.documenti_accessi enable row level security;
alter table public.documenti_registro enable row level security;

drop policy if exists documenti_leggi on public.documenti;
create policy documenti_leggi on public.documenti for select to authenticated
  using (equo_doc_puo_vedere(id) or equo_doc_puo_decidere(id));
drop policy if exists documenti_carica on public.documenti;
create policy documenti_carica on public.documenti for insert to authenticated
  with check (autore_user_id = auth.uid() and split_part(path, '/', 1) = auth.uid()::text
              and equo_doc_puo_caricare(horse_id, cavallo_cliente_id, scuderia_cavallo_id));
drop policy if exists documenti_modifica on public.documenti;
create policy documenti_modifica on public.documenti for update to authenticated
  using (autore_user_id = auth.uid()) with check (autore_user_id = auth.uid());

drop policy if exists documenti_accessi_leggi on public.documenti_accessi;
create policy documenti_accessi_leggi on public.documenti_accessi for select to authenticated
  using (user_id = auth.uid() or equo_doc_puo_decidere(documento_id)
         or exists (select 1 from documenti d where d.id = documento_id and d.autore_user_id = auth.uid()));
drop policy if exists documenti_registro_leggi on public.documenti_registro;
create policy documenti_registro_leggi on public.documenti_registro for select to authenticated
  using (equo_doc_puo_decidere(documento_id) or exists (select 1 from documenti d where d.id = documento_id and d.autore_user_id = auth.uid()));

revoke all on public.documenti, public.documenti_accessi, public.documenti_registro from anon;
grant select, insert, update on public.documenti to authenticated;
grant select on public.documenti_accessi, public.documenti_registro to authenticated;
revoke insert, update, delete on public.documenti_accessi, public.documenti_registro from authenticated;

-- storico: caricamento ed eliminazione
create or replace function public.equo_doc_storico() returns trigger
language plpgsql security definer set search_path to 'public' as $$
begin
  if tg_op = 'INSERT' then
    insert into documenti_registro (documento_id, user_id, azione, dettagli) values (new.id, auth.uid(), 'caricato', json_build_object('titolo', new.titolo, 'categoria', new.categoria)::jsonb);
  elsif new.eliminato_il is not null and old.eliminato_il is null then
    insert into documenti_registro (documento_id, user_id, azione) values (new.id, auth.uid(), 'eliminato');
  end if;
  return new;
end $$;
drop trigger if exists trg_documenti_storico on public.documenti;
create trigger trg_documenti_storico after insert or update of eliminato_il on public.documenti for each row execute function public.equo_doc_storico();

-- 4 · condividere e revocare ----------------------------------------------------------------------
-- Può condividere chi decide; l'autore può sempre mandare il suo file al proprietario.
create or replace function public.equo_doc_condividi(p_doc uuid, p_user uuid default null, p_centro uuid default null, p_motivo text default 'condivisione')
returns json language plpgsql security definer set search_path to 'public' as $$
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
  -- autore e proprietario lo vedono già sempre
  if p_user is not null and (p_user = d.autore_user_id or p_user = equo_doc_owner(p_doc)) then
    return json_build_object('ok', true, 'gia', true);
  end if;
  select id into v_id from documenti_accessi
   where documento_id = p_doc and revocato_il is null and (scade_il is null or scade_il > now())
     and coalesce(user_id::text, '') = coalesce(p_user::text, '') and coalesce(centro_id::text, '') = coalesce(p_centro::text, '');
  if v_id is not null then return json_build_object('ok', true, 'id', v_id, 'gia', true); end if;
  insert into documenti_accessi (documento_id, user_id, centro_id, motivo, concesso_da) values (p_doc, p_user, p_centro, p_motivo, v_uid) returning id into v_id;
  insert into documenti_registro (documento_id, user_id, azione, verso_user, verso_centro, dettagli)
    values (p_doc, v_uid, 'condiviso', p_user, p_centro, json_build_object('motivo', p_motivo)::jsonb);
  return json_build_object('ok', true, 'id', v_id);
end $$;

-- Può revocare chi decide oppure chi aveva concesso l'accesso. L'autore non si revoca (non è negli accessi).
create or replace function public.equo_doc_revoca(p_accesso uuid)
returns json language plpgsql security definer set search_path to 'public' as $$
declare v_uid uuid := auth.uid(); a record;
begin
  if v_uid is null then return json_build_object('ok', false, 'errore', 'non_autenticato'); end if;
  select * into a from documenti_accessi where id = p_accesso;
  if not found or a.revocato_il is not null then return json_build_object('ok', false, 'errore', 'accesso_non_trovato'); end if;
  if not (equo_doc_puo_decidere(a.documento_id) or a.concesso_da = v_uid) then return json_build_object('ok', false, 'errore', 'non_puoi'); end if;
  update documenti_accessi set revocato_il = now(), revocato_da = v_uid where id = p_accesso;
  insert into documenti_registro (documento_id, user_id, azione, verso_user, verso_centro) values (a.documento_id, v_uid, 'revocato', a.user_id, a.centro_id);
  return json_build_object('ok', true);
end $$;

-- Chi vede un documento (per il foglio «Chi lo vede»): solo per chi decide e per l'autore
create or replace function public.equo_doc_chi_vede(p_doc uuid)
returns json language plpgsql stable security definer set search_path to 'public' as $$
declare d record;
begin
  select * into d from documenti where id = p_doc and eliminato_il is null;
  if not found or not (equo_doc_puo_decidere(p_doc) or d.autore_user_id = auth.uid()) then return null; end if;
  return json_build_object(
    'decide', equo_doc_decide(p_doc), 'puoi_decidere', equo_doc_puo_decidere(p_doc),
    'autore', json_build_object('id', d.autore_user_id, 'nome', equo_nome_profilo(d.autore_user_id), 'ruolo', d.autore_ruolo),
    'proprietario', (select json_build_object('id', o, 'nome', equo_nome_profilo(o)) from (select equo_doc_owner(p_doc) o) x where o is not null),
    'struttura', (select json_build_object('id', c.id, 'nome', c.nome, 'sanitario', d.sanitario_obbligatorio) from centri c where c.id = equo_doc_centro(p_doc)),
    'accessi', coalesce((select json_agg(json_build_object('id', a.id, 'user_id', a.user_id, 'centro_id', a.centro_id,
        'nome', coalesce(equo_nome_profilo(a.user_id), (select nome from centri where id = a.centro_id)), 'motivo', a.motivo,
        'da', equo_nome_profilo(a.concesso_da), 'il', a.concesso_il, 'scade_il', a.scade_il) order by a.concesso_il)
      from documenti_accessi a where a.documento_id = p_doc and a.revocato_il is null and (a.scade_il is null or a.scade_il > now())), '[]'::json));
end $$;

revoke all on function public.equo_doc_condividi(uuid, uuid, uuid, text), public.equo_doc_revoca(uuid), public.equo_doc_chi_vede(uuid) from public, anon;
grant execute on function public.equo_doc_condividi(uuid, uuid, uuid, text), public.equo_doc_revoca(uuid), public.equo_doc_chi_vede(uuid) to authenticated;
grant execute on function public.equo_doc_puo_vedere(uuid), public.equo_doc_puo_decidere(uuid), public.equo_doc_decide(uuid) to authenticated;

-- 5 · spazio privato «documenti»: si apre solo con link temporanei, per chi ha il permesso -------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('documenti', 'documenti', false, 52428800,
  array['application/pdf','image/jpeg','image/png','image/webp','image/heic','image/heif',
        'video/mp4','video/quicktime','video/webm','video/3gpp','application/dicom'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists documenti_file_carica on storage.objects;
create policy documenti_file_carica on storage.objects for insert to authenticated
  with check (bucket_id = 'documenti' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists documenti_file_leggi on storage.objects;
create policy documenti_file_leggi on storage.objects for select to authenticated
  using (bucket_id = 'documenti' and ((storage.foldername(name))[1] = auth.uid()::text or public.equo_doc_path_visibile(name)));
drop policy if exists documenti_file_elimina on storage.objects;
create policy documenti_file_elimina on storage.objects for delete to authenticated
  using (bucket_id = 'documenti' and (storage.foldername(name))[1] = auth.uid()::text);
