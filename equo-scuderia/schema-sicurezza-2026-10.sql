begin;

-- ===================== 1-2. FILE (storage) =====================
-- Le letture "aperte a tutti" permettevano di ELENCARE tutti i file dei bucket.
-- I link diretti (getPublicUrl) restano validi: i bucket sono pubblici e il link non passa da queste regole.
drop policy if exists avatar_read on storage.objects;
drop policy if exists cavalli_foto_public_read on storage.objects;
drop policy if exists cavalli_pdf_public_read on storage.objects;
drop policy if exists "lettura pubblica media chat" on storage.objects;
drop policy if exists mascalcia_audio_read on storage.objects;
drop policy if exists mascalcia_documenti_read on storage.objects;
drop policy if exists proprietari_chat_media_read on storage.objects;

-- regole vecchie: qualsiasi utente loggato poteva cambiare o cancellare i file degli altri
drop policy if exists avatar_update on storage.objects;
drop policy if exists avatar_upload on storage.objects;
drop policy if exists cavalli_foto_auth_delete on storage.objects;
drop policy if exists cavalli_foto_auth_insert on storage.objects;
drop policy if exists cavalli_foto_auth_update on storage.objects;
drop policy if exists cavalli_pdf_auth_delete on storage.objects;
drop policy if exists cavalli_pdf_auth_insert on storage.objects;
drop policy if exists cavalli_pdf_auth_update on storage.objects;
drop policy if exists mascalcia_audio_upload on storage.objects;
drop policy if exists proprietari_chat_media_upload on storage.objects;
drop policy if exists "utenti autenticati caricano media chat" on storage.objects;

-- centri di cui l'utente fa parte (cartella = id del centro)
create or replace function public.equo_miei_centri() returns setof text
language sql stable security definer set search_path = public as $$
  select centro_id::text from scuderia_membri where user_id = auth.uid() and ruolo not in ('allievo','proprietario')
  union select id::text from centri where owner_id = auth.uid();
$$;
revoke all on function public.equo_miei_centri() from public, anon;
grant execute on function public.equo_miei_centri() to authenticated;

-- avatar: solo nella propria cartella (utente/avatar.jpg)
drop policy if exists equo_avatar_propri on storage.objects;
create policy equo_avatar_propri on storage.objects for all to authenticated
  using (bucket_id = 'avatar-utenti' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'avatar-utenti' and (storage.foldername(name))[1] = auth.uid()::text);

-- foto e PDF dei cavalli della Scuderia: solo lo staff del centro (cartella = centro)
drop policy if exists equo_cavalli_file_centro on storage.objects;
create policy equo_cavalli_file_centro on storage.objects for all to authenticated
  using (bucket_id in ('cavalli-foto','cavalli-pdf') and (storage.foldername(name))[1] in (select public.equo_miei_centri()))
  with check (bucket_id in ('cavalli-foto','cavalli-pdf') and (storage.foldername(name))[1] in (select public.equo_miei_centri()));

-- media delle chat e note vocali: si carica solo nella propria cartella (utente/...)
drop policy if exists equo_media_propria_cartella on storage.objects;
create policy equo_media_propria_cartella on storage.objects for insert to authenticated
  with check (bucket_id in ('proprietari-chat-media','chat-media','mascalcia-note-vocali') and (storage.foldername(name))[1] = auth.uid()::text);

-- ===================== 7. CODICE INVITO =====================
-- Prima: chi entrava con il codice sceglieva il ruolo e "ereditava" il posto preparato dall'admin
-- (con livello e permessi già dati). Ora il posto preparato si prende solo se è un livello 1 senza permessi
-- oppure se il nome coincide con quello scritto dall'admin. Chi è già nel team non cambia ruolo.
create or replace function public.join_centro_by_code(p_join_code text, p_ruolo text, p_nome_visualizzato text default null)
returns table(centro_id uuid, nome text)
language plpgsql security definer set search_path = public as $$
declare
  v_centro record; v_claimed_id uuid; v_nome text; v_norm text;
begin
  if auth.uid() is null then raise exception 'Accedi prima di usare il codice invito'; end if;
  if p_ruolo not in ('istruttore','veterinario','maniscalco','allievo','segretario','giardiniere','altro') then
    raise exception 'Ruolo non valido per iscrizione autonoma';
  end if;
  select * into v_centro from centri where join_code = upper(trim(p_join_code));
  if not found then raise exception 'Codice invito non valido'; end if;

  v_nome := left(regexp_replace(coalesce(nullif(trim(p_nome_visualizzato), ''), (select nullif(trim(full_name), '') from profiles where id = auth.uid()), ''), '[<>]', '', 'g'), 60);
  v_norm := lower(regexp_replace(coalesce(v_nome, ''), '\s+', ' ', 'g'));

  if exists (select 1 from scuderia_membri where scuderia_membri.centro_id = v_centro.id and user_id = auth.uid()) then
    return query select v_centro.id, v_centro.nome; return;
  end if;

  select m.id into v_claimed_id from scuderia_membri m
   where m.centro_id = v_centro.id and m.user_id is null and m.ruolo = p_ruolo
     and ( (coalesce(m.livello, '1') = '1' and coalesce(m.permessi, '{}'::jsonb) = '{}'::jsonb)
           or (v_norm <> '' and lower(regexp_replace(coalesce(m.nome_visualizzato, ''), '\s+', ' ', 'g')) = v_norm) )
   order by (v_norm <> '' and lower(regexp_replace(coalesce(m.nome_visualizzato, ''), '\s+', ' ', 'g')) = v_norm) desc, m.created_at asc
   limit 1;

  if v_claimed_id is not null then
    update scuderia_membri set user_id = auth.uid(), nome_visualizzato = coalesce(nome_visualizzato, v_nome) where id = v_claimed_id;
  else
    begin
      insert into scuderia_membri (centro_id, user_id, ruolo, nome_visualizzato) values (v_centro.id, auth.uid(), p_ruolo, v_nome);
    exception when unique_violation then null; -- già nel team (doppio tocco)
    end;
  end if;
  return query select v_centro.id, v_centro.nome;
end $$;
revoke all on function public.join_centro_by_code(text, text, text) from public, anon;
grant execute on function public.join_centro_by_code(text, text, text) to authenticated;

-- ===================== 5. LIMITE MESSAGGI AI (atomico) =====================
create table if not exists public.ai_prenotazioni (
  chiave text not null, mese text not null, n int not null default 0, aggiornato_il timestamptz not null default now(),
  primary key (chiave, mese));
alter table public.ai_prenotazioni enable row level security;
revoke all on public.ai_prenotazioni from anon, authenticated;

-- prenota un messaggio: restituisce il numero del messaggio, oppure -1 se il limite è raggiunto
create or replace function public.ai_prenota(p_chiave text, p_mese text, p_limite int, p_base int default 0) returns int
language plpgsql security definer set search_path = public as $$
declare v int;
begin
  insert into ai_prenotazioni as a (chiave, mese, n) values (p_chiave, p_mese, greatest(coalesce(p_base, 0), 0) + 1)
  on conflict (chiave, mese) do update set n = a.n + 1, aggiornato_il = now() where a.n < p_limite
  returning n into v;
  if v is null or v > p_limite then return -1; end if;
  return v;
end $$;
create or replace function public.ai_rilascia(p_chiave text, p_mese text) returns void
language sql security definer set search_path = public as $$
  update ai_prenotazioni set n = greatest(n - 1, 0), aggiornato_il = now() where chiave = p_chiave and mese = p_mese;
$$;
revoke all on function public.ai_prenota(text, text, int, int), public.ai_rilascia(text, text) from public, anon, authenticated;
grant execute on function public.ai_prenota(text, text, int, int), public.ai_rilascia(text, text) to service_role;

-- ===================== Groom: tipi ammessi e spunte offline di ieri =====================
create or replace function public.groom_segna(p_token text, p_pin text, p_box uuid, p_tipo text, p_fatto boolean, p_quando timestamptz default null) returns jsonb
language plpgsql security definer set search_path = public as $$
declare g scuderia_groom; b scuderia_box; oggi date := (now() at time zone 'Europe/Rome')::date; q timestamptz := now(); giorno_q date;
begin
  g := groom_verifica(p_token, p_pin);
  if g.id is null then return jsonb_build_object('errore', 'GROOM_PIN_ERRATO'); end if;
  if p_tipo not in ('pasto_mattina','pasto_sera','fieno','acqua','paddock','lavorato','farmaco','box_pulito','integratore','coperta','zoccoli','grooming') then
    return jsonb_build_object('errore', 'TIPO'); end if;
  select * into b from scuderia_box where id = p_box and centro_id = g.centro_id;
  if b.id is null or b.cavallo_id is null then return jsonb_build_object('errore', 'BOX_VUOTO'); end if;
  -- spunta fatta senza rete: vale per il giorno e l'ora in cui è stata toccata (massimo ieri)
  if p_quando is not null and p_quando <= now() and (p_quando at time zone 'Europe/Rome')::date >= oggi - 1 then q := p_quando; end if;
  giorno_q := (q at time zone 'Europe/Rome')::date;
  if p_fatto then
    insert into scuderia_box_attivita (centro_id, box_id, cavallo_id, tipo, giorno, fatto_il, fatto_da, fatto_da_nome, fonte)
    values (g.centro_id, b.id, b.cavallo_id, p_tipo, giorno_q, q, null, g.nome, 'groom')
    on conflict (cavallo_id, tipo, giorno) where cavallo_id is not null do nothing;
  else
    delete from scuderia_box_attivita where cavallo_id = b.cavallo_id and tipo = p_tipo and giorno = giorno_q;
  end if;
  return jsonb_build_object('ok', true);
end $$;

commit;

select 'sicurezza ok' as esito,
  (select count(*) from pg_policies where schemaname = 'storage' and policyname like 'equo_%') as regole_file_nuove,
  (select count(*) from pg_policies where schemaname = 'storage' and cmd = 'SELECT' and roles::text like '%public%') as letture_aperte_rimaste;
