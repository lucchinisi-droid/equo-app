-- Equo: CODICE PROVVISORIO (PRV-) E CODICE DEFINITIVO  FASE 2A (database)  18 ottobre 2026
-- Dopo questo SQL i codici che l'app mostra (codice_equo) diventano:
--   provvisorio  -> PRV-000161  (numero della sequenza attuale, resta l'identita' del cavallo e gli alias continuano a funzionare)
--   validato / certificato -> il codice definitivo (es. PSA-000201) assegnato dalla fase 1, che non cambia piu'
-- I numeri definitivi partono da 201: non si scontrano mai con i vecchi codici (numeri fino a 200).
-- Chi scrive un vecchio codice (es. PSA-000161) trova ancora il cavallo; chi scrive PRV-000161 pure; chi scrive un codice definitivo pure.
-- Da eseguire a BLOCCHI, uno alla volta, nel SQL Editor. Idempotente.

-- ===== BLOCCO A - i numeri definitivi partono da 201 =====
-- (nessun codice definitivo e' stato ancora assegnato: 0 conferme)
alter sequence public.equo_validati_seq restart with 201;

-- ===== BLOCCO B1 - cavalli dei proprietari =====
create or replace function public.equo_codice_horses() returns trigger
language plpgsql security definer set search_path to 'public' as $fn$
begin
  if tg_op = 'INSERT' then
    new.equo_numero := coalesce(new.equo_numero, nextval('public.equo_cavalli_seq'));
  elsif coalesce(current_setting('equo.unifica', true), '') = 'on' then
    new.equo_numero := coalesce(new.equo_numero, old.equo_numero);
  else
    new.equo_numero := coalesce(old.equo_numero, new.equo_numero, nextval('public.equo_cavalli_seq'));
  end if;
  new.codice_equo := coalesce(new.codice_definitivo, public.equo_formatta_codice('PRV', new.equo_numero));
  return new;
end
$fn$;

-- ===== BLOCCO B2 - cavalli delle scuderie (se collegati a un cavallo del proprietario, seguono il suo codice) =====
create or replace function public.equo_codice_scuderia() returns trigger
language plpgsql security definer set search_path to 'public' as $fn$
declare v_cod text;
begin
  if tg_op = 'INSERT' then
    new.equo_numero := coalesce(new.equo_numero, nextval('public.equo_cavalli_seq'));
  elsif coalesce(current_setting('equo.unifica', true), '') = 'on' then
    new.equo_numero := coalesce(new.equo_numero, old.equo_numero);
  else
    new.equo_numero := coalesce(old.equo_numero, new.equo_numero, nextval('public.equo_cavalli_seq'));
  end if;
  if new.horse_id is not null then
    select h.codice_equo into v_cod from public.horses h where h.id = new.horse_id;
  end if;
  new.codice_equo := coalesce(v_cod, new.codice_definitivo, public.equo_formatta_codice('PRV', new.equo_numero));
  return new;
end
$fn$;

-- ===== BLOCCO B3 - schede dei professionisti (collegate: copiano il codice del cavallo; manuali: provvisorio) =====
create or replace function public.equo_codice_cavalli_clienti() returns trigger
language plpgsql security definer set search_path to 'public' as $fn$
declare v_num bigint; v_cod text;
begin
  if new.horse_id is not null then
    select equo_numero, codice_equo into v_num, v_cod from public.horses where id = new.horse_id;
  elsif new.scuderia_cavallo_id is not null then
    select equo_numero, codice_equo into v_num, v_cod from public.scuderia_cavalli where id = new.scuderia_cavallo_id;
  end if;
  if v_num is not null then
    new.equo_numero := v_num; new.codice_equo := v_cod;
  else
    new.equo_numero := coalesce(case when tg_op = 'UPDATE' then old.equo_numero end, new.equo_numero, nextval('public.equo_cavalli_seq'));
    new.codice_equo := public.equo_formatta_codice('PRV', new.equo_numero);
  end if;
  return new;
end
$fn$;

-- ===== BLOCCO B4 - quando cambia il codice di un cavallo, lo seguono le schede collegate =====
create or replace function public.equo_codice_propaga() returns trigger
language plpgsql security definer set search_path to 'public' as $fn$
begin
  if new.codice_equo is distinct from old.codice_equo then
    if tg_table_name = 'horses' then
      update public.scuderia_cavalli set codice_equo = new.codice_equo where horse_id = new.id and codice_equo is distinct from new.codice_equo;
      update public.cavalli_clienti_mascalcia set codice_equo = new.codice_equo, equo_numero = new.equo_numero where horse_id = new.id;
    else
      update public.cavalli_clienti_mascalcia set codice_equo = new.codice_equo, equo_numero = new.equo_numero where horse_id is null and scuderia_cavallo_id = new.id;
    end if;
  end if;
  return null;
end
$fn$;

-- ===== BLOCCO C - chi digita un codice trova il cavallo (PRV, vecchio o definitivo) =====
create or replace function public.pro_cavallo_da_codice(p_cliente_id uuid, p_codice text, p_conferma boolean default false)
returns json
language plpgsql security definer set search_path to 'public' as $fn$
declare
  v_me uuid := auth.uid(); v_cli record; v_cod text; v_m text[];
  v_mio record; v_h record; v_s record; v_dup record; v_id uuid; v_scav uuid; v_nome_da text; v_cod_dopo text; v_horse uuid; v_num bigint;
begin
  if v_me is null then return json_build_object('ok', false, 'errore', 'Accedi di nuovo.'); end if;
  select * into v_cli from clienti_mascalcia where id = p_cliente_id and maniscalco_id = v_me;
  if v_cli.id is null then return json_build_object('ok', false, 'errore', 'Cliente non trovato.'); end if;
  v_m := regexp_match(upper(regexp_replace(coalesce(p_codice, ''), '\s', '', 'g')), '^([A-Z]{2,4})-?([0-9]{1,9})$');
  if v_m is null then return json_build_object('ok', false, 'errore', 'Scrivi il codice Equo del cavallo, es. PRV-000005 (lo trovi sotto il nome del cavallo).'); end if;
  v_cod := v_m[1] || '-' || lpad(v_m[2], 6, '0');
  v_num := v_m[2]::bigint;
  -- codice definitivo (numeri da 201 in su, prefisso di razza): si risale al numero del cavallo
  if v_m[1] <> 'PRV' and v_num > 200 then
    v_num := coalesce((select h.equo_numero from public.horses h where h.numero_definitivo = v_num),
                      (select s.equo_numero from public.scuderia_cavalli s where s.numero_definitivo = v_num), -1);
  end if;
  v_num := coalesce((select u.numero from public.equo_numeri_unificati u where u.numero_vecchio = v_num), v_num);

  select cv.*, c.nome as cliente_nome, c.cliente_user_id as cliente_utente into v_mio
    from cavalli_clienti_mascalcia cv join clienti_mascalcia c on c.id = cv.cliente_mascalcia_id
   where cv.maniscalco_id = v_me and cv.equo_numero = v_num limit 1;

  if v_mio.id is null then
    select * into v_h from horses where equo_numero = v_num limit 1;
    if v_h.id is not null then
      select cv.*, c.nome as cliente_nome, c.cliente_user_id as cliente_utente into v_mio
        from cavalli_clienti_mascalcia cv join clienti_mascalcia c on c.id = cv.cliente_mascalcia_id
       where cv.maniscalco_id = v_me and cv.horse_id = v_h.id limit 1;
      if v_mio.id is null then
        if not exists (select 1 from clienti_mascalcia where maniscalco_id = v_me and cliente_user_id = v_h.owner_id)
           and not exists (select 1 from equo_schede_scuderia_di(v_h.id) s
                            join clienti_mascalcia c on c.centro_id = s.centro_id and c.maniscalco_id = v_me and c.collegamento_stato = 'attivo') then
          return json_build_object('ok', false, 'errore', 'Questo cavallo ' || chr(232) || ' di un proprietario che non ' || chr(232) || ' ancora tuo cliente su Equo: chiedigli di collegarsi a te (codice invito o QR), poi riprova.');
        end if;
        if v_cli.centro_id is not null then
          select x.scuderia_cavallo_id into v_scav from equo_schede_scuderia_di(v_h.id) x where x.centro_id = v_cli.centro_id limit 1;
        end if;
        insert into cavalli_clienti_mascalcia (maniscalco_id, cliente_mascalcia_id, nome, microchip, razza, horse_id, scuderia_cavallo_id)
        values (v_me, p_cliente_id, v_h.name, nullif(upper(trim(coalesce(v_h.microchip, ''))), ''), v_h.breed, v_h.id, v_scav)
        returning id into v_id;
        insert into cavalli_storico (codice_equo, horse_id, scuderia_cavallo_id, cavallo_cliente_id, tipo, descrizione, autore_user_id, autore_ruolo, app)
        values (v_h.codice_equo, v_h.id, v_scav, v_id, 'aggiunto', 'Aggiunto dal maniscalco ' || equo_nome_profilo(v_me) || ' tra i cavalli di ' || v_cli.nome, v_me, 'maniscalco', 'app');
        return json_build_object('ok', true, 'azione', 'aggiunto', 'nome', v_h.name, 'codice', v_h.codice_equo);
      end if;
    else
      select * into v_s from scuderia_cavalli where equo_numero = v_num limit 1;
      if v_s.id is null then return json_build_object('ok', false, 'errore', 'Nessun cavallo con il numero ' || lpad(v_m[2], 6, '0') || '. Controlla di averlo scritto bene.'); end if;
      select cv.*, c.nome as cliente_nome, c.cliente_user_id as cliente_utente into v_mio
        from cavalli_clienti_mascalcia cv join clienti_mascalcia c on c.id = cv.cliente_mascalcia_id
       where cv.maniscalco_id = v_me and cv.scuderia_cavallo_id = v_s.id limit 1;
      if v_mio.id is null then
        if not exists (select 1 from clienti_mascalcia where maniscalco_id = v_me and centro_id = v_s.centro_id and collegamento_stato = 'attivo') then
          return json_build_object('ok', false, 'errore', 'Questo cavallo ' || chr(232) || ' in una struttura Equo Scuderia a cui non sei collegato.');
        end if;
        insert into cavalli_clienti_mascalcia (maniscalco_id, cliente_mascalcia_id, nome, microchip, razza, scuderia_cavallo_id)
        values (v_me, p_cliente_id, v_s.nome, nullif(upper(trim(coalesce(v_s.microchip, ''))), ''), v_s.razza, v_s.id)
        returning id into v_id;
        insert into cavalli_storico (codice_equo, scuderia_cavallo_id, cavallo_cliente_id, tipo, descrizione, autore_user_id, autore_ruolo, app)
        values (v_s.codice_equo, v_s.id, v_id, 'aggiunto', 'Aggiunto dal maniscalco ' || equo_nome_profilo(v_me) || ' tra i cavalli di ' || v_cli.nome, v_me, 'maniscalco', 'app');
        return json_build_object('ok', true, 'azione', 'aggiunto', 'nome', v_s.nome, 'codice', v_s.codice_equo);
      end if;
    end if;
  end if;

  if v_mio.cliente_mascalcia_id = p_cliente_id then
    return json_build_object('ok', true, 'azione', 'gia', 'nome', v_mio.nome, 'codice', v_mio.codice_equo);
  end if;
  if not coalesce(p_conferma, false) then
    return json_build_object('ok', false, 'chiedi', true, 'nome', v_mio.nome, 'codice', v_mio.codice_equo, 'da', v_mio.cliente_nome, 'a', v_cli.nome);
  end if;
  v_nome_da := v_mio.cliente_nome;
  v_scav := v_mio.scuderia_cavallo_id;
  if v_scav is null and v_cli.centro_id is not null and v_mio.horse_id is not null then
    select x.scuderia_cavallo_id into v_scav from equo_schede_scuderia_di(v_mio.horse_id) x where x.centro_id = v_cli.centro_id limit 1;
  end if;
  update cavalli_clienti_mascalcia set cliente_mascalcia_id = p_cliente_id, scuderia_cavallo_id = v_scav where id = v_mio.id;

  for v_dup in
    select * from cavalli_clienti_mascalcia d
     where d.cliente_mascalcia_id = p_cliente_id and d.id <> v_mio.id and d.maniscalco_id = v_me
       and ((d.horse_id is not null and d.horse_id = v_mio.horse_id)
         or (d.scuderia_cavallo_id is not null and d.scuderia_cavallo_id = v_scav)
         or (v_mio.horse_id is not null and d.scuderia_cavallo_id is not null and d.scuderia_cavallo_id in (select x.scuderia_cavallo_id from equo_schede_scuderia_di(v_mio.horse_id) x))
         or (nullif(upper(trim(coalesce(d.microchip, ''))), '') is not null and upper(trim(d.microchip)) = upper(trim(coalesce(v_mio.microchip, '')))))
  loop
    update interventi_mascalcia set cavallo_cliente_id = v_mio.id where cavallo_cliente_id = v_dup.id;
    update cavalli_clienti_mascalcia set
      horse_id = coalesce(horse_id, v_dup.horse_id), scuderia_cavallo_id = coalesce(scuderia_cavallo_id, v_dup.scuderia_cavallo_id),
      microchip = coalesce(nullif(microchip, ''), v_dup.microchip), razza = coalesce(nullif(razza, ''), v_dup.razza), ferro_sistema = case when ferro_numero is null then v_dup.ferro_sistema else ferro_sistema end, ferro_numero = coalesce(ferro_numero, v_dup.ferro_numero)
     where id = v_mio.id;
    insert into cavalli_storico (codice_equo, horse_id, scuderia_cavallo_id, cavallo_cliente_id, tipo, descrizione, autore_user_id, autore_ruolo, app)
    values (v_dup.codice_equo, v_dup.horse_id, v_dup.scuderia_cavallo_id, v_mio.id, 'unione',
            'Scheda ' || coalesce(v_dup.codice_equo, '') || ' unita a ' || coalesce(v_mio.codice_equo, '') || ' (stesso cavallo): storico e interventi in un''unica scheda', v_me, 'maniscalco', 'app');
    delete from cavalli_clienti_mascalcia where id = v_dup.id;
  end loop;

  select codice_equo, horse_id, scuderia_cavallo_id into v_cod_dopo, v_horse, v_scav from cavalli_clienti_mascalcia where id = v_mio.id;
  insert into cavalli_storico (codice_equo, horse_id, scuderia_cavallo_id, cavallo_cliente_id, tipo, descrizione, autore_user_id, autore_ruolo, app)
  values (v_cod_dopo, v_horse, v_scav, v_mio.id, 'spostamento', 'Spostato da ' || v_nome_da || ' a ' || v_cli.nome || ' (maniscalco ' || equo_nome_profilo(v_me) || ')', v_me, 'maniscalco', 'app');
  if v_mio.cliente_utente is not null then
    insert into messaggi_mascalcia (maniscalco_id, cliente_mascalcia_id, mittente_tipo, mittente_user_id, tipo, testo, letto)
    values (v_me, v_mio.cliente_mascalcia_id, 'maniscalco', v_me, 'testo', chr(128205) || ' ' || v_mio.nome || ' ora lo seguo presso ' || v_cli.nome || '.', false);
  end if;
  return json_build_object('ok', true, 'azione', 'spostato', 'nome', v_mio.nome, 'codice', v_cod_dopo, 'da', v_nome_da, 'a', v_cli.nome);
end
$fn$;

-- ===== BLOCCO D1 - aggiorna i codici dei cavalli dei proprietari (7 righe) =====
update public.horses set equo_numero = equo_numero;

-- ===== BLOCCO D2 - aggiorna i codici dei cavalli delle scuderie (4 righe) =====
update public.scuderia_cavalli set equo_numero = equo_numero;

-- ===== BLOCCO D3 - aggiorna i codici delle schede dei professionisti (circa 130 righe) =====
update public.cavalli_clienti_mascalcia set equo_numero = equo_numero;
