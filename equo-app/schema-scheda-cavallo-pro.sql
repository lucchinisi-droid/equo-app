-- Equo: SCHEDA CAVALLO DEL MANISCALCO (8 ottobre 2026)
-- Scheda cliente a box, scheda del singolo cavallo con ferratura completa/mezza, ferro STANDARD/CORRETTIVO con note,
-- e allegati (PDF, foto) condivisi tra maniscalco, proprietario collegato e scuderia dove sta il cavallo.

-- 1. dati di ferratura nella scheda del cavallo (maniscalco) e nell'intervento (foto del giorno)
alter table public.cavalli_clienti_mascalcia
  add column if not exists ferratura_tipo text not null default 'completa',
  add column if not exists ferro_tipo text not null default 'standard',
  add column if not exists ferro_note text;
alter table public.cavalli_clienti_mascalcia drop constraint if exists cavalli_clienti_ferratura_tipo_chk;
alter table public.cavalli_clienti_mascalcia add constraint cavalli_clienti_ferratura_tipo_chk check (ferratura_tipo in ('completa','mezza'));
alter table public.cavalli_clienti_mascalcia drop constraint if exists cavalli_clienti_ferro_tipo_chk;
alter table public.cavalli_clienti_mascalcia add constraint cavalli_clienti_ferro_tipo_chk check (ferro_tipo in ('standard','correttivo'));
alter table public.interventi_mascalcia
  add column if not exists ferro_tipo text,
  add column if not exists ferro_note text;

-- 2. testo per libretto del proprietario e scheda della scuderia: tipo di lavoro + tipo di ferro (dato utile anche per la vendita)
create or replace function public.equo_descr_intervento_libretto(p_tipo text, p_altro text, p_ferro_tipo text, p_ferro_note text, p_maniscalco uuid)
returns text language sql stable security definer set search_path = public as $$
  select equo_tipo_intervento(p_tipo, p_altro)
    || case when p_tipo in ('ferratura','mezza_ferratura') and p_ferro_tipo = 'correttivo'
              then ' · ferro correttivo' || coalesce(' (' || nullif(trim(p_ferro_note), '') || ')', '')
            when p_tipo in ('ferratura','mezza_ferratura') and p_ferro_tipo = 'standard' then ' · ferro standard'
            else '' end
    || ' — registrata da ' || equo_nome_profilo(p_maniscalco) || ' (maniscalco) su Equo';
$$;

-- 3. l'intervento prende dalla scheda: misura, tipo di ferro e (solo se lo inserisce il maniscalco) mezza ferratura
create or replace function public.interventi_ferro_da_scheda()
returns trigger language plpgsql security definer set search_path = public as $$
declare cv record;
begin
  if tg_op = 'UPDATE' and new.stato = 'fatto' then return new; end if;
  if new.tipo_ferratura not in ('ferratura','mezza_ferratura') or new.cavallo_cliente_id is null then return new; end if;
  select ferro_sistema, ferro_numero, ferratura_tipo, ferro_tipo, ferro_note into cv from cavalli_clienti_mascalcia where id = new.cavallo_cliente_id;
  if not found then return new; end if;
  if new.numero_ferro is null and cv.ferro_numero is not null then
    new.numero_ferro := cv.ferro_numero;
    new.misura_sistema := coalesce(cv.ferro_sistema, 'italiana');
  end if;
  if new.ferro_tipo is null then
    new.ferro_tipo := cv.ferro_tipo;
    new.ferro_note := cv.ferro_note;
  end if;
  -- l'appuntamento chiede solo «Ferratura»: completa o mezza la dice la scheda del cavallo
  if tg_op = 'INSERT' and new.tipo_ferratura = 'ferratura' and cv.ferratura_tipo = 'mezza'
     and auth.uid() = new.maniscalco_id then   -- solo se lo inserisce il maniscalco (le richieste di proprietari e scuderie restano come chieste)
    new.tipo_ferratura := 'mezza_ferratura';
  end if;
  return new;
end $$;

create or replace function public.interventi_registra_nel_libretto()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_ok boolean; v_ev uuid; v_nota text;
begin
  v_ok := new.horse_id is not null and new.tipo_ferratura in ('ferratura','mezza_ferratura','pareggio')
          and exists (select 1 from horses h where h.id = new.horse_id and coalesce(h.condiviso_ecosistema, true));
  if new.stato = 'fatto' and v_ok and new.health_event_id is null then
    v_nota := equo_descr_intervento_libretto(new.tipo_ferratura, new.tipo_altro, new.ferro_tipo, new.ferro_note, new.maniscalco_id);
    insert into health_events (horse_id, type, date, next_due_date, notes, origine)
    values (new.horse_id, 'ferratura', new.data_intervento, new.prossima_scadenza, v_nota, 'maniscalco') returning id into v_ev;
    new.health_event_id := v_ev;
  elsif new.health_event_id is not null and (new.stato <> 'fatto' or not v_ok) then
    new.health_event_id := null;
  elsif tg_op = 'UPDATE' and new.health_event_id is not null
        and (old.data_intervento, old.prossima_scadenza, old.horse_id) is distinct from (new.data_intervento, new.prossima_scadenza, new.horse_id) then
    update health_events set date = new.data_intervento, next_due_date = new.prossima_scadenza, horse_id = new.horse_id where id = new.health_event_id;
  end if;
  return new;
end $$;

create or replace function public.interventi_registra_in_scuderia()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_scav uuid; v_centro uuid; v_ev uuid;
begin
  if new.stato = 'fatto' and (tg_op = 'INSERT' or old.stato is distinct from 'fatto') and new.scuderia_evento_id is null then
    select cv.scuderia_cavallo_id, sc.centro_id into v_scav, v_centro
      from cavalli_clienti_mascalcia cv join scuderia_cavalli sc on sc.id = cv.scuderia_cavallo_id
     where cv.id = new.cavallo_cliente_id;
    if v_scav is null and new.horse_id is not null then
      select x.scuderia_cavallo_id, x.centro_id into v_scav, v_centro from equo_schede_scuderia_di(new.horse_id) x
       where (select count(*) from equo_schede_scuderia_di(new.horse_id)) = 1;
    end if;
    if v_scav is null then return new; end if;
    insert into scuderia_eventi_sanitari (centro_id, cavallo_id, tipo, tipo_altro, data_evento, data_scadenza, note, origine)
    values (v_centro, v_scav,
            case when new.tipo_ferratura in ('ferratura','mezza_ferratura') then 'ferratura' else 'altro' end,
            case when new.tipo_ferratura in ('ferratura','mezza_ferratura') then null else equo_tipo_intervento(new.tipo_ferratura, new.tipo_altro) end,
            new.data_intervento, new.prossima_scadenza,
            equo_descr_intervento_libretto(new.tipo_ferratura, new.tipo_altro, new.ferro_tipo, new.ferro_note, new.maniscalco_id), 'maniscalco')
    returning id into v_ev;
    new.scuderia_evento_id := v_ev;
  elsif tg_op = 'UPDATE' and old.stato = 'fatto' and new.stato <> 'fatto' and old.scuderia_evento_id is not null then
    new.scuderia_evento_id := null;
  elsif tg_op = 'UPDATE' and new.stato = 'fatto' and new.scuderia_evento_id is not null
        and (old.data_intervento, old.prossima_scadenza) is distinct from (new.data_intervento, new.prossima_scadenza) then
    update scuderia_eventi_sanitari set data_evento = new.data_intervento, data_scadenza = new.prossima_scadenza where id = new.scuderia_evento_id;
  end if;
  return new;
end $$;

create or replace function public.interventi_aggiorna_servizio_fatto()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_descr text;
begin
  if new.stato <> 'fatto'
     or (old.tipo_ferratura, coalesce(old.tipo_altro, ''), coalesce(old.ferro_tipo, ''), coalesce(old.ferro_note, ''))
        is not distinct from (new.tipo_ferratura, coalesce(new.tipo_altro, ''), coalesce(new.ferro_tipo, ''), coalesce(new.ferro_note, '')) then
    return null;
  end if;
  v_descr := equo_descr_intervento_libretto(new.tipo_ferratura, new.tipo_altro, new.ferro_tipo, new.ferro_note, new.maniscalco_id);
  if new.health_event_id is not null then
    update health_events set notes = v_descr where id = new.health_event_id;
  end if;
  if new.scuderia_evento_id is not null then
    update scuderia_eventi_sanitari
       set tipo = case when new.tipo_ferratura in ('ferratura','mezza_ferratura') then 'ferratura' else 'altro' end,
           tipo_altro = case when new.tipo_ferratura in ('ferratura','mezza_ferratura') then null else equo_tipo_intervento(new.tipo_ferratura, new.tipo_altro) end,
           note = v_descr
     where id = new.scuderia_evento_id;
  end if;
  return null;
end $$;
drop trigger if exists trg_interventi_servizio_fatto on public.interventi_mascalcia;
create trigger trg_interventi_servizio_fatto after update on public.interventi_mascalcia
  for each row execute function public.interventi_aggiorna_servizio_fatto();

-- 4. storico a vita: anche completa/mezza e tipo di ferro
create or replace function public.cavalli_clienti_storico_ferro()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_chi text;
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
            case when new.ferratura_tipo = 'mezza' then 'Passa a mezza ferratura (2 anteriori)' else 'Passa a ferratura completa (4 ferri)' end || v_chi,
            auth.uid(), 'maniscalco', 'app');
  end if;
  if (new.ferro_tipo, coalesce(new.ferro_note, '')) is distinct from (old.ferro_tipo, coalesce(old.ferro_note, '')) then
    insert into cavalli_storico (codice_equo, horse_id, scuderia_cavallo_id, cavallo_cliente_id, tipo, descrizione, autore_user_id, autore_ruolo, app)
    values (new.codice_equo, new.horse_id, new.scuderia_cavallo_id, new.id, 'ferro_tipo',
            'Tipo di ferro: ' || case when new.ferro_tipo = 'correttivo' then 'correttivo' else 'standard' end
            || coalesce(' (' || nullif(trim(new.ferro_note), '') || ')', '') || v_chi,
            auth.uid(), 'maniscalco', 'app');
  end if;
  return null;
end $$;
drop trigger if exists trg_cavalli_clienti_storico_ferro on public.cavalli_clienti_mascalcia;
create trigger trg_cavalli_clienti_storico_ferro after update of ferro_sistema, ferro_numero, ferratura_tipo, ferro_tipo, ferro_note on public.cavalli_clienti_mascalcia
  for each row execute function public.cavalli_clienti_storico_ferro();

-- 5. foto del cavallo per i box del maniscalco (dalla scheda della scuderia collegata)
create or replace function public.pro_foto_cavalli(p_righe uuid[])
returns table(cavallo_cliente_id uuid, foto_url text) language sql stable security definer set search_path = public as $$
  select cv.id, sc.foto_url
    from cavalli_clienti_mascalcia cv join scuderia_cavalli sc on sc.id = cv.scuderia_cavallo_id
   where cv.id = any(p_righe) and cv.maniscalco_id = auth.uid() and sc.foto_url is not null;
$$;
revoke execute on function public.pro_foto_cavalli(uuid[]) from public, anon;
grant execute on function public.pro_foto_cavalli(uuid[]) to authenticated;

-- 6. ALLEGATI del cavallo (PDF, foto): li vedono maniscalco, proprietario collegato e scuderia dove sta il cavallo
create table if not exists public.cavalli_allegati (
  id uuid primary key default gen_random_uuid(),
  horse_id uuid references public.horses(id) on delete set null,
  scuderia_cavallo_id uuid references public.scuderia_cavalli(id) on delete set null,
  cavallo_cliente_id uuid references public.cavalli_clienti_mascalcia(id) on delete set null,
  autore_user_id uuid references auth.users(id) on delete set null,
  autore_ruolo text not null check (autore_ruolo in ('maniscalco','proprietario','scuderia')),
  autore_nome text,
  nome text not null,
  path text not null unique,
  mime text,
  byte bigint,
  created_at timestamptz not null default now()
);
create index if not exists cavalli_allegati_horse on public.cavalli_allegati(horse_id);
create index if not exists cavalli_allegati_scheda on public.cavalli_allegati(scuderia_cavallo_id);
create index if not exists cavalli_allegati_riga on public.cavalli_allegati(cavallo_cliente_id);
alter table public.cavalli_allegati enable row level security;
revoke all on public.cavalli_allegati from anon, authenticated;   -- solo tramite le funzioni qui sotto

-- chi può vedere un allegato
create or replace function public.equo_allegato_visibile(p_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from cavalli_allegati a
     where a.id = p_id and (
       a.autore_user_id = auth.uid()
       or exists (select 1 from horses h where h.id = a.horse_id and h.owner_id = auth.uid())
       or exists (select 1 from scuderia_cavalli sc where (sc.id = a.scuderia_cavallo_id or (a.horse_id is not null and sc.horse_id = a.horse_id))
                   and is_member_of_centro(sc.centro_id))
       or exists (select 1 from cavalli_clienti_mascalcia cv where cv.maniscalco_id = auth.uid()
                   and (cv.id = a.cavallo_cliente_id or (a.horse_id is not null and cv.horse_id = a.horse_id)
                        or (a.scuderia_cavallo_id is not null and cv.scuderia_cavallo_id = a.scuderia_cavallo_id)))));
$$;

-- chiavi del cavallo viste da chi chiede (p_vista: maniscalco = riga cavalli_clienti_mascalcia, proprietario = horses, scuderia = scuderia_cavalli)
create or replace function public.equo_chiavi_cavallo(p_vista text, p_id uuid, out ok boolean, out horse uuid, out schede uuid[], out righe uuid[])
language plpgsql stable security definer set search_path = public as $$
declare v_scheda uuid;
begin
  ok := false;
  if p_vista = 'maniscalco' then
    select cv.horse_id, cv.scuderia_cavallo_id into horse, v_scheda from cavalli_clienti_mascalcia cv where cv.id = p_id and cv.maniscalco_id = auth.uid();
    if not found then return; end if;
    if horse is null and v_scheda is not null then select sc.horse_id into horse from scuderia_cavalli sc where sc.id = v_scheda; end if;
  elsif p_vista = 'proprietario' then
    if not exists (select 1 from horses h where h.id = p_id and h.owner_id = auth.uid()) then return; end if;
    horse := p_id;
  elsif p_vista = 'scuderia' then
    select sc.horse_id into horse from scuderia_cavalli sc where sc.id = p_id and is_member_of_centro(sc.centro_id);
    if not found then return; end if;
    v_scheda := p_id;
  else return;
  end if;
  ok := true;
  select coalesce(array_agg(distinct sc.id), '{}') into schede from scuderia_cavalli sc
   where sc.id = v_scheda or (horse is not null and sc.horse_id = horse);
  select coalesce(array_agg(distinct cv.id), '{}') into righe from cavalli_clienti_mascalcia cv
   where (p_vista = 'maniscalco' and cv.id = p_id) or (horse is not null and cv.horse_id = horse) or cv.scuderia_cavallo_id = any(schede);
end $$;

create or replace function public.equo_allegati_cavallo(p_vista text, p_id uuid)
returns table(id uuid, nome text, path text, mime text, byte bigint, autore_ruolo text, autore_nome text, mio boolean, created_at timestamptz)
language plpgsql stable security definer set search_path = public as $$
declare k record;
begin
  select * into k from equo_chiavi_cavallo(p_vista, p_id);
  if not k.ok then return; end if;
  return query
    select a.id, a.nome, a.path, a.mime, a.byte, a.autore_ruolo, a.autore_nome, a.autore_user_id = auth.uid(), a.created_at
      from cavalli_allegati a
     where (k.horse is not null and a.horse_id = k.horse) or a.scuderia_cavallo_id = any(k.schede) or a.cavallo_cliente_id = any(k.righe)
     order by a.created_at desc;
end $$;

create or replace function public.equo_aggiungi_allegato(p_vista text, p_id uuid, p_nome text, p_path text, p_mime text, p_byte bigint)
returns jsonb language plpgsql security definer set search_path = public as $$
declare k record; v_id uuid; v_riga uuid; v_scheda uuid; v_nome text; v_cod text;
begin
  select * into k from equo_chiavi_cavallo(p_vista, p_id);
  if not k.ok then return jsonb_build_object('ok', false, 'errore', 'Cavallo non trovato.'); end if;
  if p_path is null or split_part(p_path, '/', 1) <> auth.uid()::text then return jsonb_build_object('ok', false, 'errore', 'File non valido.'); end if;
  v_riga := case when p_vista = 'maniscalco' then p_id end;
  v_scheda := case when p_vista = 'scuderia' then p_id else k.schede[1] end;
  v_nome := equo_nome_profilo(auth.uid());
  insert into cavalli_allegati (horse_id, scuderia_cavallo_id, cavallo_cliente_id, autore_user_id, autore_ruolo, autore_nome, nome, path, mime, byte)
  values (k.horse, v_scheda, v_riga, auth.uid(), p_vista, v_nome, left(coalesce(nullif(trim(p_nome), ''), 'allegato'), 160), p_path, p_mime, p_byte)
  returning id into v_id;
  select coalesce((select codice_equo from horses where id = k.horse), (select codice_equo from scuderia_cavalli where id = v_scheda),
                  (select codice_equo from cavalli_clienti_mascalcia where id = v_riga)) into v_cod;
  insert into cavalli_storico (codice_equo, horse_id, scuderia_cavallo_id, cavallo_cliente_id, tipo, descrizione, autore_user_id, autore_ruolo, app)
  values (v_cod, k.horse, v_scheda, v_riga, 'allegato', 'Allegato aggiunto: «' || left(p_nome, 160) || '» (' || p_vista || ' ' || coalesce(v_nome, '') || ')',
          auth.uid(), p_vista, case when p_vista = 'scuderia' then 'scuderia' else 'app' end);
  return jsonb_build_object('ok', true, 'id', v_id);
end $$;

create or replace function public.equo_elimina_allegato(p_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare a cavalli_allegati;
begin
  select * into a from cavalli_allegati where id = p_id;
  if a.id is null then return jsonb_build_object('ok', false, 'errore', 'Allegato non trovato.'); end if;
  if a.autore_user_id is distinct from auth.uid() then return jsonb_build_object('ok', false, 'errore', 'Puoi eliminare solo i file che hai caricato tu.'); end if;
  delete from cavalli_allegati where id = p_id;
  insert into cavalli_storico (codice_equo, horse_id, scuderia_cavallo_id, cavallo_cliente_id, tipo, descrizione, autore_user_id, autore_ruolo, app)
  values (null, a.horse_id, a.scuderia_cavallo_id, a.cavallo_cliente_id, 'allegato', 'Allegato eliminato: «' || a.nome || '» (' || a.autore_ruolo || ' ' || coalesce(a.autore_nome, '') || ')',
          auth.uid(), a.autore_ruolo, case when a.autore_ruolo = 'scuderia' then 'scuderia' else 'app' end);
  return jsonb_build_object('ok', true, 'path', a.path);
end $$;

revoke execute on function public.equo_allegato_visibile(uuid) from public, anon;
revoke execute on function public.equo_chiavi_cavallo(text, uuid) from public, anon, authenticated;
revoke execute on function public.equo_allegati_cavallo(text, uuid) from public, anon;
revoke execute on function public.equo_aggiungi_allegato(text, uuid, text, text, text, bigint) from public, anon;
revoke execute on function public.equo_elimina_allegato(uuid) from public, anon;
grant execute on function public.equo_allegato_visibile(uuid) to authenticated;
grant execute on function public.equo_allegati_cavallo(text, uuid) to authenticated;
grant execute on function public.equo_aggiungi_allegato(text, uuid, text, text, text, bigint) to authenticated;
grant execute on function public.equo_elimina_allegato(uuid) to authenticated;

-- spazio file PRIVATO: si carica nella propria cartella, si apre solo con link a tempo se l'allegato è visibile
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('cavalli-allegati', 'cavalli-allegati', false, 15728640, array['application/pdf','image/jpeg','image/png','image/webp','image/heic','image/heif'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;
drop policy if exists cavalli_allegati_carica on storage.objects;
create policy cavalli_allegati_carica on storage.objects for insert to authenticated
  with check (bucket_id = 'cavalli-allegati' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists cavalli_allegati_leggi on storage.objects;
create policy cavalli_allegati_leggi on storage.objects for select to authenticated
  using (bucket_id = 'cavalli-allegati' and (
    (storage.foldername(name))[1] = auth.uid()::text
    or exists (select 1 from public.cavalli_allegati a where a.path = name and public.equo_allegato_visibile(a.id))));
drop policy if exists cavalli_allegati_elimina on storage.objects;
create policy cavalli_allegati_elimina on storage.objects for delete to authenticated
  using (bucket_id = 'cavalli-allegati' and (storage.foldername(name))[1] = auth.uid()::text);

-- 7. guide degli assistenti
update public.ai_conoscenze set aggiornato_il = now(), verificato_il = current_date,
  contenuto = replace(contenuto, 'Nella scheda il telefono è toccabile per chiamare.', 'Nella scheda il telefono è toccabile per chiamare; sotto ci sono i box dei cavalli.')
where titolo = 'Come modifico i dati di un cliente' and contenuto not like '%box dei cavalli%';

update public.ai_conoscenze set aggiornato_il = now(), verificato_il = current_date,
  titolo = 'Come vedo i cavalli e lo storico di un cliente',
  contenuto = 'Dove: "Clienti" → tocca il cliente → box dei cavalli → tocca un cavallo
Passi:
1. Apri la scheda del cliente: in alto i suoi dati (Messaggi, QR e codice invito, Naviga), sotto un box per ogni cavallo in ordine alfabetico. Il primo box è sempre "+ Aggiungi cavallo". Con tanti cavalli usa "Cerca cavallo".
2. Ogni box mostra foto (o iniziale), pallino della scadenza (verde in regola, arancio entro 7 giorni, rosso scaduta), nome, codice Equo, ferro standard, ultimo lavoro e prossimo.
3. Tocca un box per la scheda del cavallo: Anagrafica, Ferratura, Storico (solo quel cavallo, anche se l''hai seguito presso un altro cliente) e Allegati.
4. Dalla scheda del cavallo "+ Intervento" apre un appuntamento già impostato su di lui.
5. Se ci sono interventi vecchi registrati senza cavallo compare il riquadro "Interventi senza cavallo": "Assegna" li collega a un cavallo, "Elimina" li toglie.
Esempio: Luca apre Scuderia Le Querce, tocca il box di Aurora e vede le ultime tre ferrature con misura, ferri nuovi o rimessa e pagamento.
Note: Lo storico per cliente non c''è più: ogni cavallo ha il suo, a vita. Ferri nuovi/rimessa e tipo di ferro li vedi solo tu nell''app; nel libretto del proprietario e in Equo Scuderia compare il lavoro con "ferro standard" o "ferro correttivo".
Parole chiave: storico, cronologia, interventi passati, ultima ferratura, lavori fatti, scheda cavallo, box cavalli, cavalli del cliente, interventi senza cavallo'
where id = '2455e8e7-7405-4371-8243-7cd7eeed9cfb';

insert into public.ai_conoscenze (ambito, categoria, attivo, titolo, contenuto, aggiornato_il, verificato_il)
select a, 'guida', true, t, c, now(), current_date from (values
('maniscalco', 'Ferratura completa o mezza e tipo di ferro del cavallo',
'Dove: "Clienti" → cliente → box del cavallo → sezione "Ferratura"
Passi:
1. Apri la scheda del cavallo e vai a "Ferratura".
2. Scegli "Completa (4 ferri)" o "Mezza (2 anteriori)": vale per tutti i suoi appuntamenti.
3. Scegli il tipo di ferro: "Standard" o "Correttivo"; per il correttivo scrivi modello o note (es. barra a uovo, sollevamento talloni).
4. Con "Cambia ferro" imposti sistema e misura del ferro standard.
Esempio: Stella ha solo gli anteriori ferrati: Luca sceglie "Mezza"; quando fissa "Ferratura" per lei, Equo registra "Mezza ferratura" e la rotella parte da 2 ferri.
Note: Nell''appuntamento il tipo è solo "Ferratura", "Pareggio" o "Altro": completa o mezza la decide la scheda del cavallo (con più cavalli insieme ognuno usa la sua). Ogni cambio resta nello storico del cavallo. Il tipo di ferro (standard/correttivo con le note) compare anche nel libretto del proprietario e in Equo Scuderia; "ferri nuovi/rimessa" resta solo tuo.
Parole chiave: mezza ferratura, ferratura completa, anteriori, ferro correttivo, ferro ortopedico, ferro standard, tipo di ferro, modello ferro, misura ferro'),
('tutti', 'Allegati del cavallo (PDF e foto)',
'Dove: scheda del cavallo → "Allegati" → "+ Carica" (maniscalco: Clienti → cliente → box del cavallo; proprietario: I miei cavalli → cavallo; Equo Scuderia: Cavalli → cavallo)
Passi:
1. Apri la scheda del cavallo e vai ad "Allegati".
2. Tocca "+ Carica" e scegli un PDF o una foto (fino a 15 MB).
3. Il file compare con il nome di chi l''ha caricato e la data; "Apri" lo mostra.
4. Per toglierlo tocca "Elimina": puoi eliminare solo i file caricati da te.
Esempio: Luca carica "Lastre anteriori settembre.pdf" su Aurora: lo vedono anche Giulia (proprietaria) e la Scuderia Le Querce dove sta Aurora.
Note: Gli allegati sono del cavallo, non del cliente: li vedono il maniscalco che lo segue, il proprietario collegato su Equo e la scuderia dove si trova. I file sono privati e si aprono solo dall''app. Ogni caricamento ed eliminazione resta nello storico del cavallo.
Parole chiave: allegati, documenti, pdf, lastre, radiografie, referto, foto zoccolo, caricare file, documenti cavallo')
) v(a, t, c)
where not exists (select 1 from public.ai_conoscenze x where x.titolo = v.t);

update public.ai_conoscenze set aggiornato_il = now(), verificato_il = current_date,
  contenuto = replace(contenuto, 'Note: Gli impegni fatti mostrano', 'Note: Nell''appuntamento il tipo è "Ferratura", "Pareggio" o "Altro": completa o mezza la decide la scheda del cavallo. Gli impegni fatti mostrano')
where id = '2319e387-35cc-4f53-a0c3-83bcd9461938' and contenuto not like '%completa o mezza la decide%';

-- controllo finale: deve dare 3 · 2 · 1 · 1 · 2 · 1
select (select count(*) from information_schema.columns where table_name = 'cavalli_clienti_mascalcia' and column_name in ('ferratura_tipo','ferro_tipo','ferro_note')) as colonne_scheda,
       (select count(*) from information_schema.columns where table_name = 'interventi_mascalcia' and column_name in ('ferro_tipo','ferro_note')) as colonne_intervento,
       (select count(*) from information_schema.tables where table_name = 'cavalli_allegati') as allegati,
       (select count(*) from storage.buckets where id = 'cavalli-allegati' and not public) as spazio_privato,
       (select count(*) from ai_conoscenze where titolo in ('Ferratura completa o mezza e tipo di ferro del cavallo','Allegati del cavallo (PDF e foto)')) as guide_nuove,
       (select count(*) from ai_conoscenze where titolo = 'Come vedo i cavalli e lo storico di un cliente') as guida_storico;
