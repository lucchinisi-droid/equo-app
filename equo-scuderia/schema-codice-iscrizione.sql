-- Equo · SQL 52 · QR intelligente, fase 1: il codice del maniscalco all'iscrizione (9/11/2026 · decisione CEO)
-- Solo maniscalco (veterinario dopo). Codici: si gestiscono quelli già usati (nessuna scadenza).
--
-- 1) Proprietario (App Equo) · riscatta_codice_maniscalco:
--    · con il codice personale del maniscalco (EQUOPRO…) si riusa il cliente che il maniscalco aveva già scritto
--      con la stessa email (se è uno solo): niente cliente doppio, cavalli e lavori già lì;
--    · il codice invito di una SCUDERIA non si può usare da proprietario (prima collegava il proprietario alla scheda della scuderia).
-- 2) Scuderia (Equo Scuderia) · scuderia_usa_codice_invito: la scuderia scrive il codice invito (o incolla il link del QR)
--    che il maniscalco ha generato per lei → si collega SUBITO alla scheda che il maniscalco ha già (nessuna scheda nuova)
--    e i cavalli che lui ha inserito arrivano alla scuderia come proposte da confermare (SQL 47).
--    Il codice personale del maniscalco (EQUOPRO…) resta l'invito classico che lui deve accettare.

-- 1 · proprietario -------------------------------------------------------------------------------------
do $$ declare v_def text; v_vecchio text;
begin
  v_def := pg_get_functiondef('public.riscatta_codice_maniscalco'::regproc);
  if position('SQL 52' in v_def) = 0 then
    -- a) codice personale: riusa il cliente con la stessa email
    v_vecchio := E'    if not found then\n      select coalesce(nullif(trim(full_name), \'\')';
    if position(v_vecchio in v_def) = 0 then raise exception 'SQL 52: riscatta_codice_maniscalco (a) non è come previsto, avvisa Claude.'; end if;
    v_def := replace(v_def, v_vecchio, E'    if not found then
      -- SQL 52: il cliente che il maniscalco aveva già scritto con la stessa email (uno solo) diventa questo account
      select k.* into r from public.clienti_mascalcia k
       where k.maniscalco_id = v_pro and k.cliente_user_id is null and k.centro_id is null and k.archiviato_il is null
         and coalesce(k.tipo_cliente, \'proprietario\') <> \'struttura\'
         and nullif(lower(trim(k.email)), \'\') = (select nullif(lower(trim(email)), \'\') from public.profiles where id = v_uid)
         and (select count(*) from public.clienti_mascalcia k2 where k2.maniscalco_id = v_pro and k2.cliente_user_id is null and k2.centro_id is null
                and k2.archiviato_il is null and lower(trim(k2.email)) = lower(trim(k.email))) = 1
       limit 1;
      if found then
        update public.clienti_mascalcia set cliente_user_id = v_uid where id = r.id;
        insert into public.messaggi_mascalcia (maniscalco_id, cliente_mascalcia_id, mittente_tipo, mittente_user_id, tipo, testo)
        values (v_pro, r.id, \'cliente\', v_uid, \'testo\', \'Ciao! Mi sono collegato a te su Equo con il tuo codice personale.\');
      end if;
    end if;
    if not found then
      select coalesce(nullif(trim(full_name), \'\')');
    -- b) codice invito di una scuderia: non si usa da proprietario
    v_vecchio := E'    if r.maniscalco_id = v_uid then return json_build_object(\'ok\', false, \'errore\', \'codice_tuo\'); end if;';
    if position(v_vecchio in v_def) = 0 then raise exception 'SQL 52: riscatta_codice_maniscalco (b) non è come previsto, avvisa Claude.'; end if;
    v_def := replace(v_def, v_vecchio, v_vecchio || E'
    if r.centro_id is not null or r.tipo_cliente = \'struttura\' then return json_build_object(\'ok\', false, \'errore\', \'codice_scuderia\'); end if;   -- SQL 52');
    execute v_def;
  end if;
end $$;

-- 2 · scuderia: codice invito del maniscalco ----------------------------------------------------------------
create or replace function scuderia_usa_codice_invito(p_centro uuid, p_codice text)
returns json language plpgsql security definer set search_path = public as $$
declare v_cod text; r record; v_gia record; v_centro text; n_cav int; v_u json;
begin
  if not can_collegare_professionisti(p_centro) then
    return json_build_object('ok', false, 'errore', 'Solo l''amministratore o un membro di livello 2 o 3 può collegare i professionisti.');
  end if;
  v_cod := upper(coalesce(equo_codice_trova(p_codice, 'invito'), ''));
  if equo_codice_tipo(v_cod) in ('pro', 'med', 'tra', 'own') then return json_build_object('ok', false, 'errore_tipo', 'profilo'); end if;
  select * into r from clienti_mascalcia where upper(codice_invito) = v_cod limit 1;
  if r.id is null then return json_build_object('ok', false, 'errore', 'Codice non trovato: controlla di averlo scritto bene o chiedi al maniscalco di mostrarti di nuovo il QR.'); end if;
  -- solo l'invito della scheda di una scuderia: quello di un cliente privato si usa nell'App Equo
  if r.cliente_user_id is not null or coalesce(r.tipo_cliente, '') <> 'struttura' then
    return json_build_object('ok', false, 'errore', 'Questo è l''invito di un cliente privato del maniscalco, non della tua scuderia. Chiedigli il QR della scheda della scuderia (oppure il suo codice personale EQUOPRO…).');
  end if;
  if r.centro_id = p_centro then
    return json_build_object('ok', true, 'gia', true, 'nome', equo_nome_profilo(r.maniscalco_id), 'cliente_id', r.id);
  end if;
  if r.centro_id is not null then
    return json_build_object('ok', false, 'errore', 'Questo codice è già stato usato da un''altra scuderia. Chiedi al maniscalco di controllare la scheda della tua scuderia.');
  end if;
  select coalesce(nullif(trim(nome), ''), 'La scuderia') into v_centro from centri where id = p_centro;
  perform set_config('equo.collegamento', 'on', true);
  -- il maniscalco era già collegato a questa scuderia con un'altra scheda: si uniscono (niente doppioni)
  select * into v_gia from clienti_mascalcia where maniscalco_id = r.maniscalco_id and centro_id = p_centro;
  if v_gia.id is not null then
    v_u := equo_unisci_struttura(v_gia.id, r.id);
    if v_gia.collegamento_stato is distinct from 'attivo' then
      update clienti_mascalcia set collegamento_stato = 'attivo', collegamento_il = now() where id = v_gia.id;
    end if;
    perform equo_sync_cavalli_struttura(v_gia.id);
    perform set_config('equo.collegamento', '', true);
    return json_build_object('ok', true, 'gia', true, 'unita', true, 'nome', equo_nome_profilo(r.maniscalco_id), 'cliente_id', v_gia.id);
  end if;
  update clienti_mascalcia set centro_id = p_centro, collegamento_stato = 'attivo', collegamento_origine = 'invito', collegamento_il = now(),
         tipo_cliente = 'struttura', ex_centro_id = null
   where id = r.id;
  select count(*) into n_cav from cavalli_clienti_mascalcia where cliente_mascalcia_id = r.id and archiviato_il is null and scuderia_cavallo_id is null;
  insert into messaggi_mascalcia (maniscalco_id, cliente_mascalcia_id, mittente_tipo, mittente_user_id, tipo, testo, letto)
  values (r.maniscalco_id, r.id, 'cliente', auth.uid(), 'testo',
    '🤝 ' || v_centro || ' si è collegata a te su Equo con il tuo invito: da ora chat e appuntamenti passano da qui.'
    || case when n_cav > 0 then ' I ' || n_cav || ' cavalli che hai già inserito le arrivano da confermare: niente da ricopiare.' else '' end, false);
  perform equo_sync_cavalli_struttura(r.id);
  perform set_config('equo.collegamento', '', true);
  return json_build_object('ok', true, 'nome', equo_nome_profilo(r.maniscalco_id), 'cliente_id', r.id, 'cavalli', n_cav);
end $$;
revoke all on function scuderia_usa_codice_invito(uuid, text) from public, anon;
grant execute on function scuderia_usa_codice_invito(uuid, text) to authenticated;

select position('SQL 52' in pg_get_functiondef('public.riscatta_codice_maniscalco'::regproc)) > 0 as proprietario_ok,
       exists (select 1 from pg_proc where proname = 'scuderia_usa_codice_invito') as scuderia_ok;
