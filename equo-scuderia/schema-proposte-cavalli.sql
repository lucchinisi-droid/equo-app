-- Equo: CAVALLI PROPOSTI DAL PROFESSIONISTA E STRUTTURE DA UNIRE (9 novembre 2026) · SQL 47 · richiesta di Simone del 9/11
-- Nasce dal caso Giulius Caesar: il maniscalco aveva già la struttura e i cavalli nella sua app, il collegamento ha creato doppioni.
--  · al collegamento il maniscalco può dire «è la stessa struttura di un mio cliente»: le schede si uniscono (cavalli, lavori);
--    anche dopo, nella scheda della struttura, Equo propone l'unione con i clienti dal nome simile;
--  · se una struttura si scollega e si ricollega, riprende la scheda di prima (niente secondo cliente);
--  · in scuderia, per ogni cavallo che il maniscalco ha nella struttura ma che non è collegato a una scheda, una PROPOSTA:
--    «è lo stesso cavallo?» (microchip, nome simile: Blonde → blonde girl, Serze → serse primo) · «aggiungilo alla scuderia» · «non è nostro»;
--  · «aggiungi» funziona anche oltre il limite di cavalli del pacchetto: il cavallo entra ma resta bloccato finché non si passa
--    al pacchetto superiore (decisione di Simone);
--  · «non è nostro»: nell'app del maniscalco resta «da verificare» per 30 giorni, poi lo può eliminare;
--  · soprannome: nell'app del maniscalco il cavallo collegato si chiama come in scuderia, con il suo nome tra parentesi
--    («blonde girl (Blonde)»): lo riconosce e lo trova cercando l'uno o l'altro.
-- Rieseguibile. Il controllo finale deve dare true · true · true · true.

create extension if not exists fuzzystrmatch with schema extensions;

-- 1 · colonne nuove -----------------------------------------------------------------------------------------------
alter table public.cavalli_clienti_mascalcia add column if not exists soprannome text;
alter table public.cavalli_clienti_mascalcia add column if not exists struttura_rifiutato_il timestamptz;
alter table public.clienti_mascalcia add column if not exists ex_centro_id uuid references public.centri(id) on delete set null;
alter table public.clienti_mascalcia add column if not exists non_unire uuid[] not null default '{}';
alter table public.scuderia_cavalli add column if not exists oltre_limite boolean not null default false;

-- 2 · confronto dei nomi ------------------------------------------------------------------------------------------
create or replace function public.equo_nome_cav(p text) returns text
language sql immutable as $$
  select trim(regexp_replace(translate(lower(coalesce(p, '')), 'àáâäèéêëìíîïòóôöùúûüçñ''’`', 'aaaaeeeeiiiioooouuuucn   '), '[^a-z0-9]+', ' ', 'g'))
$$;
-- 0-100: quanto è probabile che due schede siano lo stesso cavallo
create or replace function public.equo_punteggio_cavallo(a_nome text, a_chip text, b_nome text, b_chip text) returns int
language plpgsql immutable set search_path to 'public', 'extensions' as $$
declare a text := equo_nome_cav(a_nome); b text := equo_nome_cav(b_nome); ca text := upper(trim(coalesce(a_chip, ''))); cb text := upper(trim(coalesce(b_chip, '')));
  a1 text; w text; best int := 0; soglia int;
begin
  if ca <> '' and cb <> '' then return case when ca = cb then 100 else 0 end; end if;
  if a = '' or b = '' then return 0; end if;
  if a = b then return 95; end if;
  a1 := split_part(a, ' ', 1);
  if split_part(b, ' ', 1) = a1 or (length(a) >= 3 and b like a || '%') or (length(b) >= 3 and a like b || '%') then return 85; end if;
  foreach w in array string_to_array(b, ' ') loop
    if length(w) >= 4 and length(a1) >= 4 and left(w, 1) = left(a1, 1) then   -- stessa iniziale: «Bella» non diventa «della»
      soglia := case when length(a1) >= 6 then 2 else 1 end;
      if levenshtein(a1, w) <= soglia then
        best := greatest(best, case when w = split_part(b, ' ', 1) then 70 else 60 end);
      end if;
    end if;
  end loop;
  return best;
end $$;

-- 3 · limite dei cavalli: da una proposta si può inserire anche oltre il limite (cavallo bloccato) ------------------------
create or replace function public.limite_cavalli() returns trigger
language plpgsql security definer set search_path to 'public' as $$
declare n bigint;
begin
  select count(*) into n from scuderia_cavalli where centro_id = new.centro_id and uscito_il is null;
  if centro_limite_supera(new.centro_id, 'cavalli', n) then
    if coalesce(current_setting('equo.oltre_limite', true), '') = 'on' then new.oltre_limite := true; return new; end if;
    raise exception 'Hai raggiunto il limite di % cavalli del tuo pacchetto: passa a % per aggiungerne altri.', (centro_limiti(new.centro_id)->>'cavalli'), nome_pacchetto_superiore(new.centro_id);
  end if;
  return new;
end $$;

-- 4 · sincronia della struttura con il soprannome --------------------------------------------------------------------
create or replace function public.equo_sync_cavalli_struttura(p_cliente_id uuid)
returns void language plpgsql security definer set search_path to 'public' as $$
declare c record; r record; v_match uuid;
begin
  select id, maniscalco_id, centro_id into c from clienti_mascalcia
   where id = p_cliente_id and centro_id is not null and collegamento_stato = 'attivo';
  if c.id is null then return; end if;
  -- schede scritte a mano dal maniscalco riconosciute per microchip o nome identico
  for r in select sc.id, sc.nome, nullif(upper(trim(sc.microchip)), '') chip from scuderia_cavalli sc
            join scuderia_cavalli_professionisti a on a.scuderia_cavallo_id = sc.id and a.cliente_mascalcia_id = c.id and a.stato = 'attivo'
            where sc.centro_id = c.centro_id
              and not exists (select 1 from cavalli_clienti_mascalcia x where x.cliente_mascalcia_id = c.id and x.scuderia_cavallo_id = sc.id)
  loop
    v_match := null;
    if r.chip is not null then
      select x.id into v_match from cavalli_clienti_mascalcia x
       where x.cliente_mascalcia_id = c.id and x.scuderia_cavallo_id is null and upper(trim(x.microchip)) = r.chip limit 1;
    end if;
    if v_match is null then
      select min(x.id::text)::uuid into v_match from cavalli_clienti_mascalcia x
       where x.cliente_mascalcia_id = c.id and x.scuderia_cavallo_id is null and equo_nome_cav(x.nome) = equo_nome_cav(r.nome)
      having count(*) = 1;
    end if;
    if v_match is not null then
      update cavalli_clienti_mascalcia set scuderia_cavallo_id = r.id, microchip = coalesce(nullif(trim(microchip), ''), r.chip), struttura_rifiutato_il = null where id = v_match;
    end if;
  end loop;
  insert into cavalli_clienti_mascalcia (maniscalco_id, cliente_mascalcia_id, nome, microchip, scuderia_cavallo_id)
  select c.maniscalco_id, c.id, sc.nome, nullif(upper(trim(sc.microchip)), ''), sc.id
    from scuderia_cavalli sc
    join scuderia_cavalli_professionisti a on a.scuderia_cavallo_id = sc.id and a.cliente_mascalcia_id = c.id and a.stato = 'attivo'
   where sc.centro_id = c.centro_id
     and not exists (select 1 from cavalli_clienti_mascalcia x where x.cliente_mascalcia_id = c.id and x.scuderia_cavallo_id = sc.id);
  update cavalli_clienti_mascalcia x set archiviato_il = null
   where x.cliente_mascalcia_id = c.id and x.archiviato_il is not null
     and exists (select 1 from scuderia_cavalli_professionisti a where a.cliente_mascalcia_id = c.id and a.scuderia_cavallo_id = x.scuderia_cavallo_id and a.stato = 'attivo'
                  and greatest(a.proposto_il, coalesce(a.risposto_il, a.proposto_il)) >= x.archiviato_il);
  update cavalli_clienti_mascalcia x set archiviato_il = now()
   where x.cliente_mascalcia_id = c.id and x.scuderia_cavallo_id is not null and x.archiviato_il is null
     and not exists (select 1 from scuderia_cavalli_professionisti a where a.cliente_mascalcia_id = c.id and a.scuderia_cavallo_id = x.scuderia_cavallo_id and a.stato = 'attivo');
  -- il nome del maniscalco diventa soprannome; la scheda si chiama come in scuderia: «blonde girl (Blonde)»
  update cavalli_clienti_mascalcia x set soprannome = x.nome
    from scuderia_cavalli sc
   where x.cliente_mascalcia_id = c.id and x.scuderia_cavallo_id = sc.id and x.soprannome is null
     and equo_nome_cav(x.nome) <> equo_nome_cav(sc.nome) and x.nome not like sc.nome || ' (%';
  update cavalli_clienti_mascalcia x
     set nome = sc.nome || case when x.soprannome is not null and equo_nome_cav(x.soprannome) <> equo_nome_cav(sc.nome) then ' (' || x.soprannome || ')' else '' end
    from scuderia_cavalli sc
   where x.cliente_mascalcia_id = c.id and x.scuderia_cavallo_id = sc.id
     and x.nome is distinct from sc.nome || case when x.soprannome is not null and equo_nome_cav(x.soprannome) <> equo_nome_cav(sc.nome) then ' (' || x.soprannome || ')' else '' end;
end $$;
revoke all on function public.equo_sync_cavalli_struttura(uuid) from public, anon, authenticated;

-- 5 · scollegamento: si ricorda la struttura, per riprendere la stessa scheda se si ricollega ------------------------------
do $$
declare f text; v_def text;
begin
  foreach f in array array['pro_scollega_struttura', 'scuderia_scollega_professionista'] loop
    v_def := pg_get_functiondef(('public.' || f)::regproc);
    if position('ex_centro_id' in v_def) = 0 then
      execute replace(v_def, 'update clienti_mascalcia set centro_id = null,', 'update clienti_mascalcia set ex_centro_id = coalesce(centro_id, ex_centro_id), centro_id = null,');
    end if;
  end loop;
end $$;

-- invito dalla struttura: se il maniscalco aveva già avuto questa struttura, riprende quella scheda
create or replace function public.scuderia_aggiungi_maniscalco(p_centro_id uuid, p_codice text, p_cavalli uuid[] default null)
returns json language plpgsql security definer set search_path to 'public' as $$
declare v_centro record; v_pro record; v_es record; v_id uuid; v_senza boolean;
begin
  if not can_collegare_professionisti(p_centro_id) then return json_build_object('ok', false, 'errore', 'Solo l''amministratore o un membro di livello 2 o 3 può collegare professionisti.'); end if;
  select id, nome, telefono into v_centro from centri where id = p_centro_id;
  select id, ruolo, ruolo_secondario, dati_pagamento_piva_cf into v_pro from profiles where codice_professionista = equo_codice_trova(p_codice, 'profilo') limit 1;
  if v_pro.id is null then return json_build_object('ok', false, 'errore', 'Codice professionista non trovato. Controlla di averlo scritto bene.'); end if;
  if 'maniscalco' not in (coalesce(v_pro.ruolo, ''), coalesce(v_pro.ruolo_secondario, '')) then
    return json_build_object('ok', false, 'errore', 'Questo codice non è di un maniscalco. Veterinari e istruttori saranno collegabili a breve.');
  end if;
  v_senza := coalesce(trim(v_pro.dati_pagamento_piva_cf), '') = '';
  select * into v_es from clienti_mascalcia where maniscalco_id = v_pro.id and centro_id = p_centro_id;
  if v_es.id is not null then
    if p_cavalli is not null then perform equo_abbina_cavalli_pro(v_es.id, p_cavalli); end if;
    return json_build_object('ok', true, 'gia', true, 'stato', v_es.collegamento_stato, 'nome', equo_nome_profilo(v_pro.id), 'senza_piva', v_senza);
  end if;
  perform set_config('equo.collegamento', 'on', true);
  select id into v_id from clienti_mascalcia where maniscalco_id = v_pro.id and centro_id is null and ex_centro_id = p_centro_id and archiviato_il is null order by created_at limit 1;
  if v_id is not null then
    update clienti_mascalcia set centro_id = p_centro_id, collegamento_stato = 'da_confermare_pro', collegamento_origine = 'struttura', collegamento_il = now(), tipo_cliente = 'struttura' where id = v_id;
  else
    insert into clienti_mascalcia (maniscalco_id, nome, telefono, codice_invito, tipo_cliente, centro_id, collegamento_stato, collegamento_origine, collegamento_il)
    values (v_pro.id, coalesce(nullif(trim(v_centro.nome), ''), 'Struttura'), v_centro.telefono, equo_nuovo_codice_invito(), 'struttura', p_centro_id, 'da_confermare_pro', 'struttura', now())
    returning id into v_id;
  end if;
  insert into messaggi_mascalcia (maniscalco_id, cliente_mascalcia_id, mittente_tipo, mittente_user_id, tipo, testo, letto)
  values (v_pro.id, v_id, 'cliente', auth.uid(), 'testo',
    '🤝 ' || coalesce(nullif(trim(v_centro.nome), ''), 'Una struttura') || ' vuole collegarti come maniscalco su Equo: chat e appuntamenti con la struttura in un posto solo. Accetta da Clienti → Strutture.'
    || case when v_senza then E'\n\nℹ️ Nel tuo profilo mancano P.IVA o codice fiscale: aggiungili da menu profilo → Dati per i pagamenti.' else '' end, false);
  if p_cavalli is not null then perform equo_abbina_cavalli_pro(v_id, p_cavalli); end if;
  return json_build_object('ok', true, 'nome', equo_nome_profilo(v_pro.id), 'senza_piva', v_senza);
end $$;

-- richiesta dal maniscalco: senza scheda scelta, riprende quella che aveva già avuto con questa struttura
do $$
declare v_def text;
begin
  v_def := pg_get_functiondef('public.pro_richiedi_collegamento_struttura'::regproc);
  if position('ex_centro_id' in v_def) = 0 then
    v_def := replace(v_def, '  if p_cliente_id is not null then',
      '  if p_cliente_id is null then
    select id into p_cliente_id from clienti_mascalcia where maniscalco_id = v_me and centro_id is null and ex_centro_id = v_centro.id and archiviato_il is null order by created_at limit 1;
  end if;
  if p_cliente_id is not null then');
    execute v_def;
  end if;
end $$;

-- 6 · strutture da unire (lato maniscalco) ----------------------------------------------------------------------------
-- clienti del maniscalco che sembrano la stessa struttura di un collegamento: stesso telefono, nome simile, o già collegati prima
create or replace function public.pro_strutture_simili(p_cliente_id uuid)
returns json language plpgsql stable security definer set search_path to 'public', 'extensions' as $$
declare c record;
begin
  select * into c from clienti_mascalcia where id = p_cliente_id and maniscalco_id = auth.uid() and centro_id is not null;
  if c.id is null then return '[]'::json; end if;
  return coalesce((select json_agg(json_build_object('id', x.id, 'nome', x.nome, 'cavalli', x.cav, 'lavori', x.lav, 'motivo', x.motivo) order by x.punti desc, x.cav desc) from (
    select k.id, k.nome,
      (select count(*) from cavalli_clienti_mascalcia v where v.cliente_mascalcia_id = k.id and v.archiviato_il is null) cav,
      (select count(*) from interventi_mascalcia i where i.cliente_mascalcia_id = k.id) lav,
      case when k.ex_centro_id = c.centro_id then 'era collegato a questa struttura'
           when nullif(regexp_replace(coalesce(k.telefono, ''), '\D', '', 'g'), '') = nullif(regexp_replace(coalesce(c.telefono, ''), '\D', '', 'g'), '') then 'stesso telefono'
           else 'nome simile' end motivo,
      case when k.ex_centro_id = c.centro_id then 3
           when nullif(regexp_replace(coalesce(k.telefono, ''), '\D', '', 'g'), '') = nullif(regexp_replace(coalesce(c.telefono, ''), '\D', '', 'g'), '') then 2 else 1 end punti
    from clienti_mascalcia k
   where k.maniscalco_id = c.maniscalco_id and k.id <> c.id and k.centro_id is null and k.archiviato_il is null and not (k.id = any(c.non_unire))
     and (k.ex_centro_id = c.centro_id
          or nullif(regexp_replace(coalesce(k.telefono, ''), '\D', '', 'g'), '') = nullif(regexp_replace(coalesce(c.telefono, ''), '\D', '', 'g'), '')
          or exists (select 1 from unnest(string_to_array(equo_nome_cav(k.nome), ' ')) w1, unnest(string_to_array(equo_nome_cav(c.nome), ' ')) w2
                      where length(w1) >= 4 and length(w2) >= 4 and w1 not in ('centro', 'ippico', 'scuderia', 'equestre', 'circolo', 'club', 'riding', 'horse', 'ranch', 'maneggio', 'associazione')
                        and levenshtein(w1, w2) <= case when length(w1) >= 6 then 2 else 1 end))
  ) x), '[]'::json);
end $$;

-- unisce un cliente del maniscalco dentro il collegamento con la struttura: cavalli (stesso cavallo → una scheda sola), lavori.
-- La vecchia scheda resta archiviata con le note private del maniscalco (la struttura non le vede).
create or replace function public.equo_unisci_struttura(p_collegato uuid, p_vecchio uuid)
returns json language plpgsql security definer set search_path to 'public' as $$
declare c record; o record; d record; k uuid; n_uniti int := 0; n_spostati int := 0; n_lavori int;
begin
  select * into c from clienti_mascalcia where id = p_collegato and centro_id is not null;
  select * into o from clienti_mascalcia where id = p_vecchio and maniscalco_id = c.maniscalco_id and centro_id is null and id <> p_collegato;
  if c.id is null or o.id is null then return json_build_object('ok', false, 'errore', 'Schede non trovate.'); end if;
  perform set_config('equo.unisci_manuali', 'on', true);
  for d in select * from cavalli_clienti_mascalcia where cliente_mascalcia_id = o.id loop
    select x.id into k from cavalli_clienti_mascalcia x
     where x.cliente_mascalcia_id = c.id and x.id <> d.id
       and ((d.scuderia_cavallo_id is not null and x.scuderia_cavallo_id = d.scuderia_cavallo_id)
            or equo_punteggio_cavallo(d.nome, d.microchip, coalesce(x.soprannome, x.nome), x.microchip) >= 85
            or equo_punteggio_cavallo(d.nome, d.microchip, x.nome, x.microchip) >= 85)
     order by x.scuderia_cavallo_id is null, x.created_at limit 1;
    if k is not null then
      update interventi_mascalcia set cavallo_cliente_id = k where cavallo_cliente_id = d.id;
      update cavalli_problemi_piede set cavallo_cliente_id = k where cavallo_cliente_id = d.id;
      update cavalli_allegati set cavallo_cliente_id = k where cavallo_cliente_id = d.id;
      update cavalli_arrivi set cavallo_cliente_id = k where cavallo_cliente_id = d.id;
      update documenti set cavallo_cliente_id = k where cavallo_cliente_id = d.id;
      update cavalli_clienti_mascalcia set
        avviso_sicurezza = coalesce(nullif(avviso_sicurezza, ''), d.avviso_sicurezza), ferro_note = coalesce(nullif(ferro_note, ''), d.ferro_note),
        ferro_sistema = coalesce(ferro_sistema, d.ferro_sistema), ferro_numero = coalesce(ferro_numero, d.ferro_numero),
        ferro_dettagli = coalesce(ferro_dettagli, d.ferro_dettagli), razza = coalesce(nullif(razza, ''), d.razza),
        microchip = coalesce(nullif(microchip, ''), d.microchip), soprannome = coalesce(soprannome, case when equo_nome_cav(d.nome) <> equo_nome_cav(nome) then d.nome end)
       where id = k;
      insert into cavalli_storico (codice_equo, horse_id, scuderia_cavallo_id, cavallo_cliente_id, tipo, descrizione, autore_user_id, autore_ruolo, app)
      select codice_equo, horse_id, scuderia_cavallo_id, id, 'unione', 'Scheda «' || d.nome || '» di ' || o.nome || ' unita a quella della struttura ' || c.nome, auth.uid(), 'maniscalco', 'app'
        from cavalli_clienti_mascalcia where id = k;
      delete from cavalli_clienti_mascalcia where id = d.id;
      n_uniti := n_uniti + 1;
    else
      update cavalli_clienti_mascalcia set cliente_mascalcia_id = c.id where id = d.id;
      n_spostati := n_spostati + 1;
    end if;
  end loop;
  update interventi_mascalcia set cliente_mascalcia_id = c.id where cliente_mascalcia_id = o.id;
  get diagnostics n_lavori = row_count;
  update clienti_mascalcia set archiviato_il = now(), nome = left(o.nome || ' (unito in ' || c.nome || ')', 120) where id = o.id;
  perform set_config('equo.unisci_manuali', '', true);
  perform equo_sync_cavalli_struttura(c.id);
  return json_build_object('ok', true, 'uniti', n_uniti, 'spostati', n_spostati, 'lavori', n_lavori);
end $$;
revoke all on function public.equo_unisci_struttura(uuid, uuid) from public, anon, authenticated;

create or replace function public.pro_unisci_struttura(p_collegato uuid, p_vecchio uuid)
returns json language plpgsql security definer set search_path to 'public' as $$
begin
  if not exists (select 1 from clienti_mascalcia where id = p_collegato and maniscalco_id = auth.uid() and centro_id is not null) then
    return json_build_object('ok', false, 'errore', 'Collegamento non trovato.');
  end if;
  return equo_unisci_struttura(p_collegato, p_vecchio);
end $$;
create or replace function public.pro_non_unire(p_collegato uuid, p_vecchio uuid)
returns json language plpgsql security definer set search_path to 'public' as $$
begin
  update clienti_mascalcia set non_unire = array(select distinct unnest(non_unire || p_vecchio)) where id = p_collegato and maniscalco_id = auth.uid();
  return json_build_object('ok', found);
end $$;

-- accettando l'invito il maniscalco può indicare il suo cliente che è la stessa struttura
drop function if exists public.pro_rispondi_collegamento_struttura(uuid, boolean);
create or replace function public.pro_rispondi_collegamento_struttura(p_cliente_id uuid, p_accetta boolean, p_unisci uuid default null)
returns json language plpgsql security definer set search_path to 'public' as $$
declare c record; r json;
begin
  select * into c from clienti_mascalcia where id = p_cliente_id and maniscalco_id = auth.uid() and collegamento_stato = 'da_confermare_pro';
  if c.id is null then return json_build_object('ok', false, 'errore', 'Invito non trovato.'); end if;
  perform set_config('equo.collegamento', 'on', true);
  if p_accetta then
    update clienti_mascalcia set collegamento_stato = 'attivo', collegamento_il = now() where id = c.id;
    perform equo_sync_cavalli_struttura(c.id);
    if p_unisci is not null then r := equo_unisci_struttura(c.id, p_unisci); end if;
    insert into messaggi_mascalcia (maniscalco_id, cliente_mascalcia_id, mittente_tipo, mittente_user_id, tipo, testo, letto)
    values (c.maniscalco_id, c.id, 'maniscalco', auth.uid(), 'testo', '✅ Collegamento accettato: da ora possiamo scriverci e fissare gli appuntamenti qui su Equo.', false);
  elsif c.collegamento_origine = 'struttura' and not exists (select 1 from interventi_mascalcia where cliente_mascalcia_id = c.id) then
    delete from clienti_mascalcia where id = c.id;
  else
    update clienti_mascalcia set ex_centro_id = coalesce(centro_id, ex_centro_id), centro_id = null, collegamento_stato = null, collegamento_origine = null, collegamento_il = null where id = c.id;
  end if;
  return json_build_object('ok', true, 'unione', r);
end $$;

-- avvisi nella scheda della struttura (app del maniscalco): strutture da unire e cavalli che la struttura dice non suoi
create or replace function public.pro_struttura_avvisi(p_cliente_id uuid)
returns json language plpgsql security definer set search_path to 'public' as $$
begin
  if not exists (select 1 from clienti_mascalcia where id = p_cliente_id and maniscalco_id = auth.uid() and centro_id is not null) then return '{}'::json; end if;
  return json_build_object('simili', pro_strutture_simili(p_cliente_id),
    'rifiutati', coalesce((select json_agg(json_build_object('id', x.id, 'nome', x.nome, 'il', x.struttura_rifiutato_il, 'eliminabile', x.struttura_rifiutato_il < now() - interval '30 days',
        'lavori', (select count(*) from interventi_mascalcia i where i.cavallo_cliente_id = x.id)) order by x.nome)
      from cavalli_clienti_mascalcia x where x.cliente_mascalcia_id = p_cliente_id and x.struttura_rifiutato_il is not null and x.archiviato_il is null), '[]'::json),
    'in_attesa', (select count(*) from cavalli_clienti_mascalcia x where x.cliente_mascalcia_id = p_cliente_id and x.scuderia_cavallo_id is null and x.archiviato_il is null and x.struttura_rifiutato_il is null));
end $$;
-- dopo 30 giorni il maniscalco toglie il cavallo dalla struttura: si cancella se non ha lavori, altrimenti si archivia
create or replace function public.pro_cavallo_rifiutato(p_riga uuid, p_azione text)
returns json language plpgsql security definer set search_path to 'public' as $$
declare x record;
begin
  select * into x from cavalli_clienti_mascalcia where id = p_riga and maniscalco_id = auth.uid() and struttura_rifiutato_il is not null;
  if x.id is null then return json_build_object('ok', false, 'errore', 'Cavallo non trovato.'); end if;
  if p_azione = 'tieni' then
    update cavalli_clienti_mascalcia set struttura_rifiutato_il = null where id = x.id;     -- torna a essere proposto alla struttura
    return json_build_object('ok', true, 'fatto', 'riproposto');
  end if;
  if x.struttura_rifiutato_il > now() - interval '30 days' then
    return json_build_object('ok', false, 'errore', 'Si può eliminare dal ' || to_char(x.struttura_rifiutato_il + interval '30 days', 'DD/MM/YYYY') || '.');
  end if;
  if exists (select 1 from interventi_mascalcia where cavallo_cliente_id = x.id) then
    update cavalli_clienti_mascalcia set archiviato_il = now() where id = x.id;
    return json_build_object('ok', true, 'fatto', 'archiviato');
  end if;
  perform set_config('equo.unisci_manuali', 'on', true);
  delete from cavalli_clienti_mascalcia where id = x.id;
  return json_build_object('ok', true, 'fatto', 'eliminato');
end $$;

-- 7 · proposte in scuderia ------------------------------------------------------------------------------------------
create or replace function public.scuderia_proposte_pro(p_centro uuid)
returns json language plpgsql stable security definer set search_path to 'public', 'extensions' as $$
begin
  if not is_member_of_centro(p_centro) then return '[]'::json; end if;
  return coalesce((select json_agg(json_build_object('riga_id', x.id, 'cliente_id', c.id, 'professionista', equo_nome_profilo(c.maniscalco_id),
      'nome', x.nome, 'microchip', x.microchip, 'razza', x.razza, 'mantello', x.mantello, 'anno', x.anno_nascita, 'sesso', x.sesso,
      'lavori', (select count(*) from interventi_mascalcia i where i.cavallo_cliente_id = x.id),
      'ultimo', (select max(data_intervento) from interventi_mascalcia i where i.cavallo_cliente_id = x.id and i.stato = 'fatto'),
      'prossimo', (select min(data_intervento) from interventi_mascalcia i where i.cavallo_cliente_id = x.id and i.stato in ('programmato', 'richiesto', 'proposto') and i.data_intervento >= current_date),
      'candidato', (select json_build_object('id', sc.id, 'nome', sc.nome, 'punti', p.punti) from scuderia_cavalli sc
                     cross join lateral (select equo_punteggio_cavallo(x.nome, x.microchip, sc.nome, sc.microchip) punti) p
                    where sc.centro_id = p_centro and sc.uscito_il is null and p.punti >= 60
                      and not exists (select 1 from cavalli_clienti_mascalcia y where y.cliente_mascalcia_id = c.id and y.scuderia_cavallo_id = sc.id)
                    order by p.punti desc, sc.nome limit 1))
      order by c.id, x.nome)
    from clienti_mascalcia c join cavalli_clienti_mascalcia x on x.cliente_mascalcia_id = c.id
   where c.centro_id = p_centro and c.collegamento_stato = 'attivo'
     and x.scuderia_cavallo_id is null and x.archiviato_il is null and x.struttura_rifiutato_il is null), '[]'::json);
end $$;

-- conferma (è lo stesso cavallo / è un altro), aggiungi alla scuderia, non è nostro
create or replace function public.scuderia_proposta_rispondi(p_riga uuid, p_azione text, p_scheda uuid default null, p_categoria text default null)
returns json language plpgsql security definer set search_path to 'public' as $$
declare x record; c record; v_scheda uuid := p_scheda; v_gia uuid; v_oltre boolean := false; v_centro text; v_set uuid[]; r json;
begin
  select * into x from cavalli_clienti_mascalcia where id = p_riga;
  select * into c from clienti_mascalcia where id = x.cliente_mascalcia_id and centro_id is not null and collegamento_stato = 'attivo';
  if x.id is null or c.id is null then return json_build_object('ok', false, 'errore', 'Proposta non trovata.'); end if;
  if not can_collegare_professionisti(c.centro_id) then return json_build_object('ok', false, 'errore', 'Solo l''amministratore o un membro di livello 2 o 3 può decidere.'); end if;
  if x.scuderia_cavallo_id is not null then return json_build_object('ok', false, 'errore', 'Questo cavallo è già collegato.'); end if;
  select nome into v_centro from centri where id = c.centro_id;

  if p_azione = 'rifiuta' then
    update cavalli_clienti_mascalcia set struttura_rifiutato_il = now() where id = x.id;
    insert into messaggi_mascalcia (maniscalco_id, cliente_mascalcia_id, mittente_tipo, mittente_user_id, tipo, testo, letto)
    values (c.maniscalco_id, c.id, 'cliente', auth.uid(), 'testo',
      '📋 ' || coalesce(v_centro, 'La struttura') || ': «' || x.nome || '» non risulta tra i nostri cavalli. Lo trovi segnato «da verificare» nella scheda della struttura; dopo 30 giorni puoi eliminarlo.', false);
    return json_build_object('ok', true, 'fatto', 'rifiutato');
  end if;

  if p_azione = 'aggiungi' then
    perform set_config('equo.oltre_limite', 'on', true);
    insert into scuderia_cavalli (centro_id, nome, microchip, razza, mantello, sesso, tipo_proprieta)
    values (c.centro_id, x.nome, nullif(upper(trim(x.microchip)), ''), nullif(trim(x.razza), ''), nullif(trim(x.mantello), ''), nullif(trim(x.sesso), ''),
            case when p_categoria in ('proprieta', 'pensione', 'soci') then p_categoria else 'pensione' end)
    returning id, oltre_limite into v_scheda, v_oltre;
    perform set_config('equo.oltre_limite', '', true);
  elsif p_azione <> 'conferma' or v_scheda is null then
    return json_build_object('ok', false, 'errore', 'Scegli il cavallo della scuderia.');
  end if;
  if not exists (select 1 from scuderia_cavalli where id = v_scheda and centro_id = c.centro_id) then return json_build_object('ok', false, 'errore', 'Cavallo della scuderia non trovato.'); end if;

  perform set_config('equo.unisci_manuali', 'on', true);
  -- se il maniscalco ha già una scheda collegata a quel cavallo, si unisce lì (niente doppioni)
  select id into v_gia from cavalli_clienti_mascalcia where cliente_mascalcia_id = c.id and scuderia_cavallo_id = v_scheda limit 1;
  if v_gia is not null then
    update interventi_mascalcia set cavallo_cliente_id = v_gia where cavallo_cliente_id = x.id;
    update cavalli_problemi_piede set cavallo_cliente_id = v_gia where cavallo_cliente_id = x.id;
    update cavalli_allegati set cavallo_cliente_id = v_gia where cavallo_cliente_id = x.id;
    update cavalli_arrivi set cavallo_cliente_id = v_gia where cavallo_cliente_id = x.id;
    update documenti set cavallo_cliente_id = v_gia where cavallo_cliente_id = x.id;
    update cavalli_clienti_mascalcia set soprannome = coalesce(soprannome, x.nome), razza = coalesce(nullif(razza, ''), x.razza),
      ferro_note = coalesce(nullif(ferro_note, ''), x.ferro_note), avviso_sicurezza = coalesce(nullif(avviso_sicurezza, ''), x.avviso_sicurezza) where id = v_gia;
    delete from cavalli_clienti_mascalcia where id = x.id;
  else
    update cavalli_clienti_mascalcia set scuderia_cavallo_id = v_scheda, soprannome = coalesce(soprannome, nome),
      microchip = coalesce(nullif(trim(microchip), ''), (select nullif(upper(trim(microchip)), '') from scuderia_cavalli where id = v_scheda)) where id = x.id;
  end if;
  perform set_config('equo.unisci_manuali', '', true);
  -- il maniscalco diventa il professionista del cavallo (se c'è un proprietario con l'app, gli si chiede conferma)
  select array_agg(scuderia_cavallo_id) into v_set from scuderia_cavalli_professionisti where cliente_mascalcia_id = c.id and stato <> 'rifiutato';
  r := equo_abbina_cavalli_pro(c.id, coalesce(v_set, '{}') || v_scheda);
  perform equo_sync_cavalli_struttura(c.id);
  return json_build_object('ok', true, 'fatto', case when p_azione = 'aggiungi' then 'aggiunto' else 'collegato' end, 'scheda', v_scheda, 'oltre_limite', v_oltre,
    'da_confermare', coalesce((r->>'da_confermare')::int, 0) > 0);
end $$;

do $$ declare f text;
begin
  foreach f in array array['pro_strutture_simili(uuid)', 'pro_unisci_struttura(uuid, uuid)', 'pro_non_unire(uuid, uuid)', 'pro_rispondi_collegamento_struttura(uuid, boolean, uuid)',
    'pro_struttura_avvisi(uuid)', 'pro_cavallo_rifiutato(uuid, text)', 'scuderia_proposte_pro(uuid)', 'scuderia_proposta_rispondi(uuid, text, uuid, text)'] loop
    execute 'revoke all on function public.' || f || ' from public, anon';
    execute 'grant execute on function public.' || f || ' to authenticated, service_role';
  end loop;
end $$;

-- 8 · Giulius Caesar: i 7 cavalli già collegati prendono il soprannome che Francesco usava -------------------------------
update cavalli_clienti_mascalcia x set soprannome = v.sopr
  from (values ('blonde girl', 'Blonde'), ('kiri du rouet', 'Kiri'), ('miss guagliona', 'Miss'), ('peccarità', 'Peccarita'''),
               ('serse primo', 'Serze'), ('trionfo d''olimpia', 'Trionfo'), ('natascia sabina', 'Natasha')) v(sc_nome, sopr),
       scuderia_cavalli sc
 where x.cliente_mascalcia_id = '490c6fc9-8a83-4d7c-a3d9-cf5cd043d91d' and x.scuderia_cavallo_id = sc.id and sc.nome = v.sc_nome and x.soprannome is null;
select equo_sync_cavalli_struttura('490c6fc9-8a83-4d7c-a3d9-cf5cd043d91d');

-- controllo finale: deve dare true · true · true · true
select exists (select 1 from pg_proc where proname = 'scuderia_proposte_pro') as proposte,
       position('ex_centro_id' in pg_get_functiondef('public.pro_scollega_struttura'::regproc)) > 0 as ricollega,
       position('oltre_limite' in pg_get_functiondef('public.limite_cavalli'::regproc)) > 0 as oltre_limite,
       (select count(*) from cavalli_clienti_mascalcia where cliente_mascalcia_id = '490c6fc9-8a83-4d7c-a3d9-cf5cd043d91d' and soprannome is not null) >= 7 as soprannomi_giulius;
