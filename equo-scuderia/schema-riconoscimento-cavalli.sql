-- Equo · SQL 53 · QR intelligente, fase 2: riconoscimento unico dei cavalli (9/11/2026)
-- Regola unica per dire se il cavallo del maniscalco è un cavallo che il proprietario o la scuderia hanno già:
--   CERTO       stessa scheda già collegata, stesso codice Equo, oppure stesso microchip
--   MAI         microchip presenti tutti e due ma diversi (anche se il nome è uguale)
--   PROBABILE   nome uguale o simile (punteggio ≥ 70) senza microchip in conflitto → si chiede
-- Decisioni di Simone:
--   · proprietario: si collega da solo solo se è CERTO; se c'è solo il nome, Equo chiede «È la tua …?»;
--   · scuderia: anche i casi certi si collegano solo dopo conferma («Collega i sicuri», con elenco);
--   · cliente doppio del maniscalco: decide il maniscalco (avviso nella scheda del cliente + promemoria di Hammer).

-- 1 · la regola ------------------------------------------------------------------------------------------
-- confronto tra il cavallo del maniscalco (riga) e un cavallo del proprietario o della scuderia
create or replace function equo_cavallo_confronto(r_horse uuid, r_codice text, r_numero bigint, r_chip text, r_nome text,
                                                  h_id uuid, h_codice text, h_numero bigint, h_chip text, h_nome text)
returns json language plpgsql stable set search_path = public as $$
declare ca text := equo_chip(r_chip); cb text := equo_chip(h_chip); p int;
begin
  if r_horse is not null and r_horse = h_id then return json_build_object('esito', 'certo', 'perche', 'già collegato', 'punti', 100); end if;
  if ca is not null and cb is not null then
    if ca = cb then return json_build_object('esito', 'certo', 'perche', 'stesso microchip', 'punti', 100); end if;
    return json_build_object('esito', 'mai', 'perche', 'microchip diverso', 'punti', 0);
  end if;
  if (nullif(trim(r_codice), '') is not null and upper(trim(r_codice)) = upper(trim(coalesce(h_codice, ''))))
     or (r_numero is not null and r_numero = h_numero) then
    return json_build_object('esito', 'certo', 'perche', 'stesso codice Equo', 'punti', 100);
  end if;
  p := equo_punteggio_cavallo(r_nome, null, h_nome, null);
  if p >= 70 then return json_build_object('esito', 'probabile', 'perche', case when p >= 95 then 'stesso nome' else 'nome simile' end, 'punti', p); end if;
  return json_build_object('esito', 'no', 'punti', p);
end $$;

-- i cavalli del proprietario confrontati con una riga del maniscalco (certi prima, poi probabili)
create or replace function equo_candidati_proprietario(p_riga uuid, p_uid uuid) returns json
language sql stable security definer set search_path = public as $$
  select coalesce(json_agg(json_build_object('horse_id', x.id, 'nome', x.name, 'esito', x.c->>'esito', 'perche', x.c->>'perche')
                           order by (x.c->>'esito') = 'certo' desc, (x.c->>'punti')::int desc, x.name), '[]'::json)
    from (select h.id, h.name,
                 equo_cavallo_confronto(cv.horse_id, cv.codice_equo, cv.equo_numero, cv.microchip, cv.nome, h.id, h.codice_equo, h.equo_numero, h.microchip, h.name) c
            from cavalli_clienti_mascalcia cv join horses h on h.owner_id = p_uid
           where cv.id = p_riga) x
   where x.c->>'esito' in ('certo', 'probabile')
$$;
revoke all on function equo_candidati_proprietario(uuid, uuid) from public, anon, authenticated;

-- 2 · proprietario: accetta un cavallo preparato dal maniscalco ------------------------------------------------
-- p_scelta: il cavallo del proprietario che ha detto essere lo stesso · p_nuovo: «No, è un altro cavallo»
drop function if exists equo_accetta_proposta_interno(uuid, uuid);
create or replace function equo_accetta_proposta_interno(p_proposta uuid, p_uid uuid, p_scelta uuid default null, p_nuovo boolean default false)
returns json language plpgsql security definer set search_path = public as $$
declare v_p cavalli_proposte; v_r cavalli_clienti_mascalcia; v_h horses; v_new uuid; v_horse uuid; v_come text;
        v_lavori int := 0; v_libretto int := 0; v_dal date; v_cand json; v_certo uuid; v_conf json;
begin
  perform set_config('equo.accetta', 'on', true);
  select * into v_p from cavalli_proposte p where p.id = p_proposta and p.owner_id = p_uid and p.stato = 'in_attesa';
  if v_p.id is null then perform set_config('equo.accetta', '', true); return json_build_object('ok', false, 'motivo', 'proposta_non_trovata'); end if;
  select * into v_r from cavalli_clienti_mascalcia cv where cv.id = v_p.riga_id;
  if v_r.id is null then perform set_config('equo.accetta', '', true); return json_build_object('ok', false, 'motivo', 'scheda_non_trovata'); end if;

  if v_r.horse_id is not null then
    v_horse := v_r.horse_id; v_come := 'gia_collegata';
  else
    if p_scelta is not null then
      select * into v_h from horses where id = p_scelta and owner_id = p_uid;
      if v_h.id is null then perform set_config('equo.accetta', '', true); return json_build_object('ok', false, 'motivo', 'cavallo_non_tuo'); end if;
      v_conf := equo_cavallo_confronto(null, v_r.codice_equo, v_r.equo_numero, v_r.microchip, v_r.nome, v_h.id, v_h.codice_equo, v_h.equo_numero, v_h.microchip, v_h.name);
      if v_conf->>'esito' = 'mai' then perform set_config('equo.accetta', '', true); return json_build_object('ok', false, 'motivo', 'microchip_diverso'); end if;
    elsif not p_nuovo then
      v_cand := equo_candidati_proprietario(v_r.id, p_uid);
      select (e->>'horse_id')::uuid into v_certo from json_array_elements(v_cand) e where e->>'esito' = 'certo' limit 1;
      if v_certo is not null then
        select * into v_h from horses where id = v_certo;
        select e into v_conf from json_array_elements(v_cand) e where e->>'esito' = 'certo' limit 1;
      elsif json_array_length(v_cand) > 0 then
        -- solo il nome: decide il proprietario
        perform set_config('equo.accetta', '', true);
        return json_build_object('ok', false, 'motivo', 'da_confermare', 'candidati', v_cand, 'nome', v_r.nome);
      end if;
    end if;
    if v_h.id is not null then
      update cavalli_clienti_mascalcia set horse_id = v_h.id, soprannome = coalesce(soprannome, case when equo_nome_cav(nome) <> equo_nome_cav(v_h.name) then nome end),
        nome = v_h.name, microchip = coalesce(nullif(microchip, ''), v_h.microchip) where id = v_r.id;
      if v_r.equo_numero is not null then perform equo_unifica_numero_cavallo(v_h.id, array[v_r.equo_numero]); end if;
      v_horse := v_h.id; v_come := 'collegato_esistente';
    else
      begin
        insert into horses (owner_id, name, breed, microchip, equo_numero)
        values (p_uid, v_r.nome, nullif(trim(coalesce(v_r.razza, '')), ''), nullif(trim(coalesce(v_r.microchip, '')), ''), v_r.equo_numero)
        returning id into v_new;
      exception when others then
        if sqlerrm like 'LIMITE_CAVALLI_FREE%' then
          perform set_config('equo.accetta', '', true);
          return json_build_object('ok', false, 'motivo', 'limite_cavalli_free');
        end if;
        raise;
      end;
      update cavalli_clienti_mascalcia set horse_id = v_new where id = v_r.id;
      v_horse := v_new; v_come := 'creato';
    end if;
    insert into cavalli_storico (codice_equo, horse_id, cavallo_cliente_id, tipo, descrizione, autore_user_id, autore_ruolo, app)
    select cv.codice_equo, v_horse, cv.id, 'collegamento',
      case when v_come = 'creato' then 'Cavallo preparato dal maniscalco (' || cv.nome || ') e accettato dal proprietario'
           else 'Scheda del maniscalco (' || coalesce(cv.soprannome, cv.nome) || ') collegata al cavallo del proprietario' || coalesce(' · ' || (v_conf->>'perche'), case when p_scelta is not null then ' · confermato dal proprietario' else '' end) end,
      p_uid, 'proprietario', 'app' from cavalli_clienti_mascalcia cv where cv.id = v_r.id;
  end if;

  update interventi_mascalcia set horse_id = v_horse where cavallo_cliente_id = v_r.id and horse_id is distinct from v_horse;
  select count(*) filter (where stato = 'fatto'), count(*) filter (where health_event_id is not null), min(data_intervento) filter (where stato = 'fatto')
    into v_lavori, v_libretto, v_dal from interventi_mascalcia where cavallo_cliente_id = v_r.id;
  update cavalli_proposte set stato = 'accettata', horse_id = v_horse, risposto_il = now() where id = v_p.id;
  perform set_config('equo.accetta', '', true);
  return json_build_object('ok', true, 'horse_id', v_horse, 'esito', v_come,
    'codice', (select h.codice_equo from horses h where h.id = v_horse), 'nome', (select h.name from horses h where h.id = v_horse),
    'lavori', v_lavori, 'nel_libretto', v_libretto, 'dal', v_dal, 'maniscalco_id', v_p.maniscalco_id, 'cliente_mascalcia_id', v_p.cliente_mascalcia_id);
end $$;
revoke all on function equo_accetta_proposta_interno(uuid, uuid, uuid, boolean) from public, anon, authenticated;

drop function if exists equo_accetta_cavallo_proposto(uuid);
create or replace function equo_accetta_cavallo_proposto(p_proposta uuid, p_horse uuid default null, p_nuovo boolean default false)
returns json language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); r json;
begin
  if v_uid is null then return json_build_object('ok', false, 'motivo', 'non_autenticato'); end if;
  r := equo_accetta_proposta_interno(p_proposta, v_uid, p_horse, coalesce(p_nuovo, false));
  if (r->>'ok')::boolean then
    perform equo_msg_cavalli_accettati((r->>'maniscalco_id')::uuid, (r->>'cliente_mascalcia_id')::uuid, array[r->>'nome'],
      (r->>'lavori')::int, (r->>'nel_libretto')::int, (r->>'dal')::date);
  end if;
  return r;
end $$;
revoke all on function equo_accetta_cavallo_proposto(uuid, uuid, boolean) from public, anon;
grant execute on function equo_accetta_cavallo_proposto(uuid, uuid, boolean) to authenticated;

-- «Accetta tutti»: quelli che hanno bisogno di una risposta restano in attesa e si contano
do $$ declare v_def text; begin
  v_def := pg_get_functiondef('public.equo_accetta_tutti_proposti'::regproc);
  if position('domande' in v_def) = 0 then
    v_def := replace(v_def, 'v_acc jsonb := ''[]''::jsonb;', 'v_acc jsonb := ''[]''::jsonb; v_dom int := 0;');
    v_def := replace(v_def, E'    elsif r->>\'motivo\' = \'limite_cavalli_free\' then', E'    elsif r->>\'motivo\' = \'da_confermare\' then\n      v_dom := v_dom + 1;\n    elsif r->>\'motivo\' = \'limite_cavalli_free\' then');
    v_def := replace(v_def, '''limite'', v_limite,', '''limite'', v_limite, ''domande'', v_dom,');
    if position('v_dom := v_dom + 1' in v_def) = 0 or position('''domande'', v_dom' in v_def) = 0 then raise exception 'SQL 53: equo_accetta_tutti_proposti non è come previsto, avvisa Claude.'; end if;
    execute v_def;
  end if;
end $$;

-- il proprietario crea a mano un cavallo: si collega da solo alla proposta solo se il microchip è lo stesso
create or replace function equo_horse_stesso_nome_proposto() returns trigger
language plpgsql security definer set search_path = public as $$
declare p record; r json;
begin
  if coalesce(current_setting('equo.accetta', true), '') = 'on' or new.owner_id is null or equo_chip(new.microchip) is null then return null; end if;
  select pr.id, pr.maniscalco_id, pr.cliente_mascalcia_id into p
    from cavalli_proposte pr join cavalli_clienti_mascalcia cv on cv.id = pr.riga_id
   where pr.owner_id = new.owner_id and pr.stato = 'in_attesa' and equo_chip(cv.microchip) = equo_chip(new.microchip)
   order by pr.created_at limit 1;
  if p.id is null then return null; end if;
  r := equo_accetta_proposta_interno(p.id, new.owner_id, new.id, false);
  if (r->>'ok')::boolean then
    perform equo_msg_cavalli_accettati(p.maniscalco_id, p.cliente_mascalcia_id, array[r->>'nome'], (r->>'lavori')::int, (r->>'nel_libretto')::int, (r->>'dal')::date);
  end if;
  return null;
end $$;

-- l'elenco delle proposte per l'App: con i cavalli che potrebbero essere gli stessi
create or replace function equo_proposte_cavalli_proprietario() returns json
language sql stable security definer set search_path = public as $$
  select coalesce(json_agg(json_build_object(
    'proposta', p.id, 'riga', cv.id, 'nome', cv.nome, 'razza', cv.razza, 'microchip', cv.microchip,
    'codice', cv.codice_equo, 'maniscalco', equo_nome_profilo(p.maniscalco_id), 'cliente', c.nome, 'dal', p.created_at,
    'candidati', equo_candidati_proprietario(cv.id, auth.uid()),
    'esiste_gia', exists (select 1 from json_array_elements(equo_candidati_proprietario(cv.id, auth.uid())) e where e->>'esito' = 'certo')
  ) order by p.created_at, cv.nome), '[]'::json)
  from cavalli_proposte p
  join cavalli_clienti_mascalcia cv on cv.id = p.riga_id
  join clienti_mascalcia c on c.id = p.cliente_mascalcia_id
  where p.owner_id = auth.uid() and p.stato = 'in_attesa' and auth.uid() is not null
$$;

-- 3 · scuderia: il candidato dice se è certo --------------------------------------------------------------
create or replace function scuderia_proposte_pro(p_centro uuid) returns json
language plpgsql stable security definer set search_path = public as $$
begin
  if not is_member_of_centro(p_centro) then return '[]'::json; end if;
  return coalesce((select json_agg(json_build_object('riga_id', x.id, 'cliente_id', c.id, 'professionista', equo_nome_profilo(c.maniscalco_id),
      'nome', x.nome, 'microchip', x.microchip, 'razza', x.razza, 'mantello', x.mantello, 'anno', x.anno_nascita, 'sesso', x.sesso,
      'lavori', (select count(*) from interventi_mascalcia i where i.cavallo_cliente_id = x.id),
      'ultimo', (select max(data_intervento) from interventi_mascalcia i where i.cavallo_cliente_id = x.id and i.stato = 'fatto'),
      'prossimo', (select min(data_intervento) from interventi_mascalcia i where i.cavallo_cliente_id = x.id and i.stato in ('programmato', 'richiesto', 'proposto') and i.data_intervento >= current_date),
      'candidato', (select json_build_object('id', sc.id, 'nome', sc.nome, 'punti', (k.c->>'punti')::int, 'certo', k.c->>'esito' = 'certo', 'perche', k.c->>'perche')
                      from scuderia_cavalli sc
                      cross join lateral (select equo_cavallo_confronto(x.horse_id, x.codice_equo, x.equo_numero, x.microchip, x.nome,
                                                 sc.horse_id, sc.codice_equo, coalesce(sc.numero_definitivo, sc.equo_numero), sc.microchip, sc.nome) c) k
                     where sc.centro_id = p_centro and sc.uscito_il is null
                       and (k.c->>'esito' = 'certo' or ((k.c->>'esito') = 'probabile') or (k.c->>'punti')::int >= 60 and k.c->>'esito' <> 'mai')
                       and not exists (select 1 from cavalli_clienti_mascalcia y where y.cliente_mascalcia_id = c.id and y.scuderia_cavallo_id = sc.id)
                     order by (k.c->>'esito') = 'certo' desc, (k.c->>'punti')::int desc, sc.nome limit 1))
      order by c.id, x.nome)
    from clienti_mascalcia c join cavalli_clienti_mascalcia x on x.cliente_mascalcia_id = c.id
   where c.centro_id = p_centro and c.collegamento_stato = 'attivo'
     and x.scuderia_cavallo_id is null and x.archiviato_il is null and x.struttura_rifiutato_il is null), '[]'::json);
end $$;

-- 4 · cliente doppio del maniscalco: decide lui --------------------------------------------------------------
-- clienti privati scritti a mano dal maniscalco che sembrano la stessa persona di un cliente collegato con l'app
create or replace function equo_clienti_simili(p_cliente_id uuid) returns json
language plpgsql stable security definer set search_path = public as $$
declare c record; v_tel text;
begin
  select * into c from clienti_mascalcia where id = p_cliente_id and cliente_user_id is not null and centro_id is null;
  if c.id is null then return '[]'::json; end if;
  v_tel := nullif(regexp_replace(coalesce(c.telefono, ''), '\D', '', 'g'), '');
  if length(v_tel) < 8 then v_tel := null; end if;
  return coalesce((select json_agg(json_build_object('id', k.id, 'nome', k.nome,
        'cavalli', (select count(*) from cavalli_clienti_mascalcia v where v.cliente_mascalcia_id = k.id and v.archiviato_il is null),
        'lavori', (select count(*) from interventi_mascalcia i where i.cliente_mascalcia_id = k.id),
        'motivo', case when v_tel is not null and regexp_replace(coalesce(k.telefono, ''), '\D', '', 'g') = v_tel then 'stesso telefono'
                       when equo_nome_persona(k.nome) = equo_nome_persona(c.nome) then 'stesso nome' else 'nome simile' end) order by k.nome)
    from clienti_mascalcia k
   where k.maniscalco_id = c.maniscalco_id and k.id <> c.id and k.cliente_user_id is null and k.centro_id is null and k.archiviato_il is null
     and coalesce(k.tipo_cliente, 'proprietario') <> 'struttura' and not (k.id = any(coalesce(c.non_unire, '{}')))
     and ((v_tel is not null and regexp_replace(coalesce(k.telefono, ''), '\D', '', 'g') = v_tel)
          or equo_nome_persona(k.nome) = equo_nome_persona(c.nome)
          or (split_part(equo_nome_persona(k.nome), ' ', 2) <> '' and split_part(equo_nome_persona(c.nome), ' ', 2) <> ''
              and levenshtein(equo_nome_persona(k.nome), equo_nome_persona(c.nome)) <= 2))), '[]'::json);
end $$;
revoke all on function equo_clienti_simili(uuid) from public, anon, authenticated;

-- unione di due schede cliente del maniscalco (privato): cavalli, lavori e documenti nella scheda collegata
create or replace function equo_unisci_clienti(p_tieni uuid, p_vecchio uuid) returns json
language plpgsql security definer set search_path = public as $$
declare c record; o record; d record; k uuid; n_uniti int := 0; n_spostati int := 0; n_lavori int;
begin
  select * into c from clienti_mascalcia where id = p_tieni and cliente_user_id is not null and centro_id is null;
  select * into o from clienti_mascalcia where id = p_vecchio and maniscalco_id = c.maniscalco_id and cliente_user_id is null and centro_id is null and id <> p_tieni;
  if c.id is null or o.id is null then return json_build_object('ok', false, 'errore', 'Schede non trovate.'); end if;
  perform set_config('equo.unisci_manuali', 'on', true);
  for d in select * from cavalli_clienti_mascalcia where cliente_mascalcia_id = o.id loop
    select x.id into k from cavalli_clienti_mascalcia x
     where x.cliente_mascalcia_id = c.id and x.id <> d.id
       and (equo_cavallo_confronto(d.horse_id, d.codice_equo, d.equo_numero, d.microchip, d.nome, x.horse_id, x.codice_equo, x.equo_numero, x.microchip, x.nome)->>'esito' = 'certo'
            or (equo_chip(d.microchip) is null or equo_chip(x.microchip) is null) and equo_punteggio_cavallo(d.nome, null, x.nome, null) >= 95)
     order by x.created_at limit 1;
    if k is not null then
      update interventi_mascalcia set cavallo_cliente_id = k where cavallo_cliente_id = d.id;
      update cavalli_problemi_piede set cavallo_cliente_id = k where cavallo_cliente_id = d.id;
      update cavalli_allegati set cavallo_cliente_id = k where cavallo_cliente_id = d.id;
      update cavalli_arrivi set cavallo_cliente_id = k where cavallo_cliente_id = d.id;
      update documenti set cavallo_cliente_id = k where cavallo_cliente_id = d.id;
      update cavalli_clienti_mascalcia set
        avviso_sicurezza = coalesce(nullif(avviso_sicurezza, ''), d.avviso_sicurezza), ferro_note = coalesce(nullif(ferro_note, ''), d.ferro_note),
        ferro_sistema = coalesce(ferro_sistema, d.ferro_sistema), ferro_numero = coalesce(ferro_numero, d.ferro_numero),
        ferro_dettagli = coalesce(ferro_dettagli, d.ferro_dettagli), razza = coalesce(nullif(razza, ''), d.razza), microchip = coalesce(nullif(microchip, ''), d.microchip)
       where id = k;
      delete from cavalli_clienti_mascalcia where id = d.id;
      n_uniti := n_uniti + 1;
    else
      update cavalli_clienti_mascalcia set cliente_mascalcia_id = c.id where id = d.id;
      n_spostati := n_spostati + 1;
    end if;
  end loop;
  update interventi_mascalcia set cliente_mascalcia_id = c.id where cliente_mascalcia_id = o.id;
  get diagnostics n_lavori = row_count;
  update messaggi_mascalcia set cliente_mascalcia_id = c.id where cliente_mascalcia_id = o.id;
  update clienti_mascalcia set telefono = coalesce(nullif(telefono, ''), o.telefono), indirizzo = coalesce(nullif(indirizzo, ''), o.indirizzo),
         note = nullif(concat_ws(E'\n', nullif(note, ''), nullif(o.note, '')), '') where id = c.id;
  update clienti_mascalcia set archiviato_il = now(), nome = left(o.nome || ' (unito in ' || c.nome || ')', 120) where id = o.id;
  perform set_config('equo.unisci_manuali', '', true);
  -- i cavalli arrivati dalla scheda vecchia vanno al proprietario come proposte (con i loro lavori)
  perform equo_proponi_interno(c.id, null);
  return json_build_object('ok', true, 'uniti', n_uniti, 'spostati', n_spostati, 'lavori', n_lavori);
end $$;
revoke all on function equo_unisci_clienti(uuid, uuid) from public, anon, authenticated;

-- l'app del maniscalco: «Da sistemare» anche per i clienti privati collegati, e l'unione
create or replace function pro_struttura_avvisi(p_cliente_id uuid) returns json
language plpgsql security definer set search_path = public as $$
declare c record;
begin
  select * into c from clienti_mascalcia where id = p_cliente_id and maniscalco_id = auth.uid();
  if c.id is null then return '{}'::json; end if;
  if c.centro_id is null then
    if c.cliente_user_id is null then return '{}'::json; end if;
    return json_build_object('tipo', 'cliente', 'simili', equo_clienti_simili(c.id), 'rifiutati', '[]'::json, 'in_attesa', 0);
  end if;
  return json_build_object('tipo', 'struttura', 'simili', pro_strutture_simili(p_cliente_id),
    'rifiutati', coalesce((select json_agg(json_build_object('id', x.id, 'nome', x.nome, 'il', x.struttura_rifiutato_il, 'eliminabile', x.struttura_rifiutato_il < now() - interval '30 days',
        'lavori', (select count(*) from interventi_mascalcia i where i.cavallo_cliente_id = x.id)) order by x.nome)
      from cavalli_clienti_mascalcia x where x.cliente_mascalcia_id = p_cliente_id and x.struttura_rifiutato_il is not null and x.archiviato_il is null), '[]'::json),
    'in_attesa', (select count(*) from cavalli_clienti_mascalcia x where x.cliente_mascalcia_id = p_cliente_id and x.scuderia_cavallo_id is null and x.archiviato_il is null and x.struttura_rifiutato_il is null));
end $$;

create or replace function pro_unisci_struttura(p_collegato uuid, p_vecchio uuid) returns json
language plpgsql security definer set search_path = public as $$
declare c record;
begin
  select * into c from clienti_mascalcia where id = p_collegato and maniscalco_id = auth.uid();
  if c.id is null then return json_build_object('ok', false, 'errore', 'Collegamento non trovato.'); end if;
  if c.centro_id is not null then return equo_unisci_struttura(p_collegato, p_vecchio); end if;
  if c.cliente_user_id is not null then return equo_unisci_clienti(p_collegato, p_vecchio); end if;
  return json_build_object('ok', false, 'errore', 'Collegamento non trovato.');
end $$;

-- quando un cliente si collega con il codice personale e c'è una scheda che gli somiglia: promemoria di Hammer al maniscalco
do $$ declare v_def text; v_vecchio text := E'      v_nuovo := true;';
begin
  v_def := pg_get_functiondef('public.riscatta_codice_maniscalco'::regproc);
  if position('equo_clienti_simili' in v_def) = 0 then
    if position(v_vecchio in v_def) = 0 then raise exception 'SQL 53: riscatta_codice_maniscalco non è come previsto, avvisa Claude.'; end if;
    v_def := replace(v_def, v_vecchio, v_vecchio || E'
      -- SQL 53: forse il maniscalco lo aveva già scritto a mano: glielo chiediamo (decide lui)
      if json_array_length(equo_clienti_simili(r.id)) > 0 then
        insert into public.promemoria_personali (user_id, vista, testo, quando, cliente_mascalcia_id, azione, stato, creato_da, fonte)
        values (v_pro, \'professionista\', left(coalesce(v_nome_cliente, \'Un cliente\') || \' si è collegato a te su Equo: forse è un cliente che hai già scritto (\'
                || (select string_agg(e->>\'nome\', \', \') from json_array_elements(equo_clienti_simili(r.id)) e) || \'). Apri la sua scheda e tocca «Sì, unisci» se è lui.\', 300),
                now(), r.id, \'chat\', \'attivo\', \'hammer\', \'cli:\' || r.id)
        on conflict (user_id, fonte) do nothing;
      end if;');
    execute v_def;
  end if;
end $$;

select exists (select 1 from pg_proc where proname = 'equo_cavallo_confronto') as regola,
       position('da_confermare' in pg_get_functiondef('public.equo_accetta_proposta_interno'::regproc)) > 0 as proprietario,
       position('certo' in pg_get_functiondef('public.scuderia_proposte_pro'::regproc)) > 0 as scuderia,
       position('equo_clienti_simili' in pg_get_functiondef('public.riscatta_codice_maniscalco'::regproc)) > 0 as cliente_doppio;
