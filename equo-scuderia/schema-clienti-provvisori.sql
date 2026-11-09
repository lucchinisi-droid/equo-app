-- Equo Scuderia · SQL 48 · Schede clienti provvisorie (9/11/2026)
-- Quando una scuderia scrive il nome del proprietario nella scheda di un cavallo:
--   · se quella persona è già tra i clienti, il cavallo si collega a lei;
--   · altrimenti nasce una scheda cliente PROVVISORIA (solo il nome), collegata al cavallo.
-- La scheda smette di essere provvisoria da sola appena ha un telefono o un'email (o la persona entra con l'app).
-- Le provvisorie non contano nel limite clienti del pacchetto e non hanno ricevute ASD.
-- Athena ricorda una volta a settimana all'amministratore le schede da completare.
-- Alla fine sistema i cavalli già inseriti che hanno il nome del proprietario ma nessun cliente collegato.

alter table scuderia_membri add column if not exists provvisorio boolean not null default false;

-- nome di persona confrontabile: minuscole, senza accenti e punteggiatura, parole in ordine alfabetico
-- («Rossi  Mario» = «mario rossi»)
create or replace function equo_nome_persona(p text) returns text
language sql immutable set search_path = public as $$
  select nullif(array_to_string(array(
    select w from unnest(regexp_split_to_array(
      btrim(regexp_replace(translate(lower(coalesce(p, '')), 'àáâäèéêëìíîïòóôöùúûüç''’.,;:-_/', 'aaaaeeeeiiiioooouuuuc          '), '\s+', ' ', 'g')), ' ')) w
    where w <> '' order by w), ' '), '')
$$;

-- il "proprietario" è la scuderia stessa? («ASD Giulius Caesar» per il centro «Giulius Caesar»)
create or replace function equo_nome_e_centro(p_centro uuid, p_nome text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from centri c where c.id = p_centro and (
    position(lower(btrim(c.nome)) in lower(p_nome)) > 0
    or (c.asd_nome is not null and position(lower(btrim(c.asd_nome)) in lower(p_nome)) > 0)))
$$;

-- trova il cliente con quel nome o crea la scheda provvisoria; restituisce il suo id
create or replace function equo_cliente_da_nome(p_centro uuid, p_nome text, p_vecchio uuid default null, p_cavallo uuid default null)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_norm text := equo_nome_persona(p_nome); v_id uuid; v_disp text;
begin
  if v_norm is null then return null; end if;
  -- 1) cliente già presente (anche provvisorio) con lo stesso nome
  select m.id into v_id from scuderia_membri m
   where m.centro_id = p_centro and m.ruolo in ('proprietario', 'allievo') and equo_nome_persona(m.nome_visualizzato) = v_norm
   order by m.provvisorio, (m.user_id is null), m.created_at limit 1;
  if v_id is not null then return v_id; end if;
  v_disp := btrim(regexp_replace(p_nome, '\s+', ' ', 'g'));
  if v_disp = lower(v_disp) then v_disp := initcap(v_disp); end if;
  -- 2) il cavallo aveva una scheda provvisoria usata solo da lui: è una correzione del nome, la rinomino
  if p_vecchio is not null and exists (select 1 from scuderia_membri where id = p_vecchio and provvisorio)
     and not exists (select 1 from scuderia_cavalli where proprietario_membro_id = p_vecchio and id is distinct from p_cavallo) then
    update scuderia_membri set nome_visualizzato = v_disp where id = p_vecchio;
    return p_vecchio;
  end if;
  -- 3) nuova scheda provvisoria
  insert into scuderia_membri (centro_id, user_id, ruolo, nome_visualizzato, provvisorio)
  values (p_centro, null, 'proprietario', v_disp, true) returning id into v_id;
  return v_id;
end $$;

-- prima del salvataggio del cavallo
create or replace function equo_proprietario_auto() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_nome text; v_vecchio uuid; v_vecchio_provv boolean := false; v_trovato uuid;
begin
  if tg_op = 'UPDATE' then
    -- il proprietario è stato scelto esplicitamente (dall'elenco clienti, dal codice app…): non tocco nulla
    if new.proprietario_membro_id is distinct from old.proprietario_membro_id then return new; end if;
    if coalesce(btrim(new.proprietario), '') = coalesce(btrim(old.proprietario), '')
       and not (new.tipo_proprieta is distinct from old.tipo_proprieta and old.tipo_proprieta = 'proprieta') then return new; end if;
    v_vecchio := old.proprietario_membro_id;
    select provvisorio into v_vecchio_provv from scuderia_membri where id = v_vecchio;
    v_vecchio_provv := coalesce(v_vecchio_provv, false);
  elsif new.proprietario_membro_id is not null then
    return new;
  end if;
  if new.uscito_il is not null then return new; end if;

  v_nome := nullif(btrim(regexp_replace(coalesce(new.proprietario, ''), '\s+', ' ', 'g')), '');
  -- nessun nome, cavallo della scuderia, o il "proprietario" è la scuderia stessa: nessuna scheda
  if v_nome is null or new.tipo_proprieta = 'proprieta' or equo_nome_e_centro(new.centro_id, v_nome) then
    if v_vecchio_provv then new.proprietario_membro_id := null; end if;
    return new;
  end if;

  if v_vecchio is not null and not v_vecchio_provv then
    -- collegato a un cliente vero (magari con l'app): cambio solo se il nuovo nome è un altro cliente esistente
    select m.id into v_trovato from scuderia_membri m
     where m.centro_id = new.centro_id and m.ruolo in ('proprietario', 'allievo') and m.id <> v_vecchio
       and equo_nome_persona(m.nome_visualizzato) = equo_nome_persona(v_nome)
     order by m.provvisorio, m.created_at limit 1;
    if v_trovato is not null then new.proprietario_membro_id := v_trovato; end if;
    return new;
  end if;

  new.proprietario_membro_id := equo_cliente_da_nome(new.centro_id, v_nome, v_vecchio, new.id);
  return new;
end $$;

drop trigger if exists trg_proprietario_auto on scuderia_cavalli;
create trigger trg_proprietario_auto before insert or update of proprietario, proprietario_membro_id, tipo_proprieta
  on scuderia_cavalli for each row execute function equo_proprietario_auto();

-- dopo: una scheda provvisoria rimasta senza cavalli e senza dati si toglie da sola
create or replace function equo_provvisorio_pulisci() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if old.proprietario_membro_id is not null and old.proprietario_membro_id is distinct from new.proprietario_membro_id
     and exists (select 1 from scuderia_membri where id = old.proprietario_membro_id and provvisorio)
     and not exists (select 1 from scuderia_cavalli where proprietario_membro_id = old.proprietario_membro_id)
     and not exists (select 1 from scuderia_clienti_dati where membro_id = old.proprietario_membro_id) then
    begin
      delete from scuderia_membri where id = old.proprietario_membro_id;
    exception when others then null;  -- ha già altro collegato (lezioni, conti…): resta
    end;
  end if;
  return null;
end $$;

drop trigger if exists trg_provvisorio_pulisci on scuderia_cavalli;
create trigger trg_provvisorio_pulisci after update of proprietario_membro_id, proprietario, tipo_proprieta
  on scuderia_cavalli for each row execute function equo_provvisorio_pulisci();

-- la scheda diventa definitiva da sola: telefono o email inseriti…
create or replace function equo_provvisorio_completa() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if nullif(btrim(coalesce(new.telefono, '')), '') is not null or nullif(btrim(coalesce(new.email, '')), '') is not null then
    update scuderia_membri set provvisorio = false where id = new.membro_id and provvisorio;
  end if;
  return null;
end $$;

drop trigger if exists trg_provvisorio_completa on scuderia_clienti_dati;
create trigger trg_provvisorio_completa after insert or update on scuderia_clienti_dati
  for each row execute function equo_provvisorio_completa();

-- …oppure la persona entra con l'app Equo
create or replace function equo_provvisorio_app() returns trigger
language plpgsql set search_path = public as $$
begin
  if new.user_id is not null then new.provvisorio := false; end if;
  return new;
end $$;

drop trigger if exists trg_provvisorio_app on scuderia_membri;
create trigger trg_provvisorio_app before insert or update of user_id on scuderia_membri
  for each row execute function equo_provvisorio_app();

-- le provvisorie non contano nel limite clienti del pacchetto
create or replace function limite_clienti() returns trigger
language plpgsql security definer set search_path = public as $$
declare n bigint;
begin
  if new.ruolo not in ('proprietario', 'allievo') then return new; end if;
  if new.provvisorio then return new; end if;
  if tg_op = 'UPDATE' and old.ruolo in ('proprietario', 'allievo') then return new; end if;
  select count(*) into n from scuderia_membri where centro_id = new.centro_id and ruolo in ('proprietario', 'allievo') and not provvisorio and id <> new.id;
  if centro_limite_supera(new.centro_id, 'clienti', n) then
    raise exception 'Questo centro ha già % clienti, il massimo del pacchetto attuale: serve il pacchetto %.', (centro_limiti(new.centro_id)->>'clienti'), nome_pacchetto_superiore(new.centro_id);
  end if;
  return new;
end $$;

-- niente ricevuta ASD a una scheda provvisoria
create or replace function asd_ricevuta(p_pagamento uuid) returns json
language plpgsql security definer set search_path = public as $$
declare p record; c record; m record; s record; v_pref text; v_n int; v_causale text;
begin
  select * into p from scuderia_pagamenti where id = p_pagamento;
  if p.id is null or not puo_gestire_incassi(p.centro_id) then return json_build_object('ok', false, 'errore', 'Non autorizzato.'); end if;
  if not equo_asd_full(p.centro_id) then return json_build_object('ok', false, 'errore', 'Le ricevute sono nella Gestione ASD Full (PREMIUM).'); end if;
  if p.cassa <> 'asd' then return json_build_object('ok', false, 'errore', 'Le ricevute si fanno per i pagamenti della cassa ASD.'); end if;
  select * into m from scuderia_membri where id = p.membro_id;
  if coalesce(m.provvisorio, false) and p.ricevuta is null then
    return json_build_object('ok', false, 'errore', 'La scheda di ' || coalesce(m.nome_visualizzato, 'questo cliente') || ' è ancora provvisoria: completala in Clienti (telefono o email) e poi fai la ricevuta.');
  end if;
  if p.ricevuta is null then
    perform pg_advisory_xact_lock(hashtext('asd_ricevute:' || p.centro_id));
    v_pref := 'R-' || extract(year from p.data) || '-';
    select coalesce(max(substring(ricevuta from length(v_pref) + 1)::int), 0) + 1 into v_n from scuderia_pagamenti where centro_id = p.centro_id and ricevuta like v_pref || '%';
    update scuderia_pagamenti set ricevuta = v_pref || lpad(v_n::text, 3, '0') where id = p.id returning ricevuta into p.ricevuta;
  end if;
  select * into c from centri where id = p.centro_id;
  select * into s from scuderia_asd_soci where centro_id = p.centro_id and membro_id = p.membro_id;
  select coalesce((select d.descrizione from scuderia_addebiti d where d.id = p.addebito_id),
                  (select 'Conto n. ' || co.numero from scuderia_conti co where co.id = p.conto_id),
                  'Versamento') into v_causale;
  return json_build_object('ok', true, 'numero', p.ricevuta, 'data', p.data, 'importo', p.importo, 'metodo', p.metodo, 'causale', v_causale, 'note', p.note,
    'socio', m.nome_visualizzato, 'socio_numero', s.numero,
    'asd', json_build_object('nome', coalesce(c.asd_nome, 'ASD ' || c.nome), 'cf', c.asd_cf, 'sede', coalesce(c.asd_sede, concat_ws(' ', c.indirizzo, c.citta)), 'rasd', c.asd_rasd));
end $$;

-- promemoria settimanale di Athena all'amministratore (lunedì mattina)
create or replace function equo_promemoria_clienti_provvisori() returns int
language plpgsql security definer set search_path = public as $$
declare g record; v_n int := 0; v_testo text;
begin
  for g in select m.centro_id, count(*) as n,
                  string_agg(m.nome_visualizzato, ', ' order by m.nome_visualizzato) as nomi
             from scuderia_membri m where m.provvisorio group by m.centro_id loop
    v_testo := '🗂️ **Schede clienti da completare**' || E'\n\n'
      || case when g.n = 1 then 'C''è una scheda cliente provvisoria: ' else 'Ci sono ' || g.n || ' schede clienti provvisorie: ' end
      || left(g.nomi, 300) || case when length(g.nomi) > 300 then '…' else '' end || '.' || E'\n\n'
      || 'Sono nate in automatico dal nome del proprietario scritto nella scheda dei cavalli. '
      || 'Apri **Clienti**, filtra «Da completare» e aggiungi almeno telefono o email: così potete intestare conti e ricevute e invitarli nell''app Equo.';
    insert into ai_messaggi (user_id, vista, agente, ruolo, contenuto, centro_id, importante)
    select a.user_id, 'scuderia', 'athena', 'assistant', v_testo, g.centro_id, true
      from scuderia_membri a
     where a.centro_id = g.centro_id and a.ruolo = 'admin' and a.user_id is not null
       and not exists (select 1 from ai_messaggi x where x.user_id = a.user_id and x.centro_id = g.centro_id
                        and x.agente = 'athena' and x.contenuto like '🗂️ **Schede clienti da completare**%' and x.created_at > now() - interval '6 days');
    if found then v_n := v_n + 1; end if;
  end loop;
  return v_n;
end $$;

revoke execute on function equo_cliente_da_nome(uuid, text, uuid, uuid) from public, anon, authenticated;
revoke execute on function equo_promemoria_clienti_provvisori() from public, anon, authenticated;
revoke execute on function equo_nome_e_centro(uuid, text) from public, anon;

select cron.unschedule('equo-clienti-provvisori') where exists (select 1 from cron.job where jobname = 'equo-clienti-provvisori');
select cron.schedule('equo-clienti-provvisori', '20 8 * * 1', 'select public.equo_promemoria_clienti_provvisori()');

-- cavalli già inseriti: nome del proprietario scritto ma nessun cliente collegato
update scuderia_cavalli c set proprietario_membro_id = equo_cliente_da_nome(c.centro_id, c.proprietario, null, c.id)
 where c.proprietario_membro_id is null and c.uscito_il is null
   and nullif(btrim(c.proprietario), '') is not null
   and c.tipo_proprieta is distinct from 'proprieta'
   and not equo_nome_e_centro(c.centro_id, c.proprietario);

-- riepilogo
select ce.nome as centro, m.nome_visualizzato as cliente, m.provvisorio,
       string_agg(c.nome, ', ' order by c.nome) as cavalli
  from scuderia_cavalli c join scuderia_membri m on m.id = c.proprietario_membro_id join centri ce on ce.id = c.centro_id
 where m.provvisorio
 group by 1, 2, 3 order by 1, 2;
