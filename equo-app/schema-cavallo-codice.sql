-- Equo: aggiungere o spostare un cavallo con il suo codice Equo (scheda cliente del maniscalco) + storico a vita (ottobre 2026)
-- REGOLA: il cavallo è al centro dell'ecosistema · azioni univoche · storico a vita.
--  · codice di un cavallo già tra i miei → si SPOSTA nella scheda di questo cliente (stessa riga, stesso storico, nessun doppione);
--    se nel cliente c'era già lo stesso cavallo con un altro codice (es. Rio della scuderia e Rio del proprietario) le due righe si UNISCONO;
--  · codice di un cavallo del proprietario (App) → si aggiunge, se il proprietario è mio cliente collegato o il cavallo sta in una struttura collegata a me;
--  · codice di un cavallo di Equo Scuderia → si aggiunge, se sono collegato a quella struttura;
--  · ogni spostamento, aggiunta e unione resta nello storico del cavallo (cavalli_storico, solo aggiunte).

-- 1) storico a vita del cavallo (si scrive solo dalle funzioni; nessuno può modificare o cancellare)
create table if not exists public.cavalli_storico (
  id uuid primary key default gen_random_uuid(),
  codice_equo text,
  horse_id uuid,
  scuderia_cavallo_id uuid,
  cavallo_cliente_id uuid,
  tipo text not null,
  descrizione text not null,
  autore_user_id uuid,
  autore_ruolo text,
  app text,
  created_at timestamptz not null default now()
);
create index if not exists cavalli_storico_codice_idx on public.cavalli_storico (codice_equo, created_at);
alter table public.cavalli_storico enable row level security;
drop policy if exists cavalli_storico_lettura on public.cavalli_storico;
create policy cavalli_storico_lettura on public.cavalli_storico for select to authenticated using (
  exists (select 1 from public.cavalli_clienti_mascalcia c where c.id = cavallo_cliente_id and c.maniscalco_id = auth.uid())
  or exists (select 1 from public.horses h where h.id = horse_id and h.owner_id = auth.uid())
  or exists (select 1 from public.scuderia_cavalli s where s.id = scuderia_cavallo_id and public.is_member_of_centro(s.centro_id))
);
revoke insert, update, delete on public.cavalli_storico from anon, authenticated;

-- 2) aggiungi / sposta con il codice Equo
create or replace function public.pro_cavallo_da_codice(p_cliente_id uuid, p_codice text, p_conferma boolean default false)
returns json language plpgsql security definer set search_path = public as $$
declare
  v_me uuid := auth.uid(); v_cli record; v_cod text; v_m text[];
  v_mio record; v_h record; v_s record; v_dup record; v_id uuid; v_scav uuid; v_nome_da text; v_cod_dopo text; v_horse uuid; v_num bigint;
begin
  if v_me is null then return json_build_object('ok', false, 'errore', 'Accedi di nuovo.'); end if;
  select * into v_cli from clienti_mascalcia where id = p_cliente_id and maniscalco_id = v_me;
  if v_cli.id is null then return json_build_object('ok', false, 'errore', 'Cliente non trovato.'); end if;
  -- codice: «alt-7», «ALT 000007», «MAR-000007» → numero 7 (le lettere non contano)
  v_m := regexp_match(upper(regexp_replace(coalesce(p_codice, ''), '\s', '', 'g')), '^([A-Z]{2,4})-?([0-9]{1,9})$');
  if v_m is null then return json_build_object('ok', false, 'errore', 'Scrivi il codice Equo del cavallo, es. MAR-000005 (lo trovi sotto il nome del cavallo).'); end if;
  v_cod := v_m[1] || '-' || lpad(v_m[2], 6, '0');
  -- conta solo il NUMERO (identità del cavallo, non cambia mai); le lettere seguono la razza e sono solo indicative
  v_num := v_m[2]::bigint;

  -- a) è già uno dei miei cavalli?
  select cv.*, c.nome as cliente_nome, c.cliente_user_id as cliente_utente into v_mio
    from cavalli_clienti_mascalcia cv join clienti_mascalcia c on c.id = cv.cliente_mascalcia_id
   where cv.maniscalco_id = v_me and cv.equo_numero = v_num limit 1;

  if v_mio.id is null then
    -- b) cavallo del proprietario (App)
    select * into v_h from horses where equo_numero = v_num limit 1;
    if v_h.id is not null then
      select cv.*, c.nome as cliente_nome, c.cliente_user_id as cliente_utente into v_mio
        from cavalli_clienti_mascalcia cv join clienti_mascalcia c on c.id = cv.cliente_mascalcia_id
       where cv.maniscalco_id = v_me and cv.horse_id = v_h.id limit 1;
      if v_mio.id is null then
        if not exists (select 1 from clienti_mascalcia where maniscalco_id = v_me and cliente_user_id = v_h.owner_id)
           and not exists (select 1 from equo_schede_scuderia_di(v_h.id) s
                            join clienti_mascalcia c on c.centro_id = s.centro_id and c.maniscalco_id = v_me and c.collegamento_stato = 'attivo') then
          return json_build_object('ok', false, 'errore', 'Questo cavallo è di un proprietario che non è ancora tuo cliente su Equo: chiedigli di collegarsi a te (codice invito o QR), poi riprova.');
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
      -- c) cavallo di Equo Scuderia
      select * into v_s from scuderia_cavalli where equo_numero = v_num limit 1;
      if v_s.id is null then return json_build_object('ok', false, 'errore', 'Nessun cavallo con il numero ' || lpad(v_m[2], 6, '0') || '. Controlla di averlo scritto bene.'); end if;
      select cv.*, c.nome as cliente_nome, c.cliente_user_id as cliente_utente into v_mio
        from cavalli_clienti_mascalcia cv join clienti_mascalcia c on c.id = cv.cliente_mascalcia_id
       where cv.maniscalco_id = v_me and cv.scuderia_cavallo_id = v_s.id limit 1;
      if v_mio.id is null then
        if not exists (select 1 from clienti_mascalcia where maniscalco_id = v_me and centro_id = v_s.centro_id and collegamento_stato = 'attivo') then
          return json_build_object('ok', false, 'errore', 'Questo cavallo è in una struttura Equo Scuderia a cui non sei collegato.');
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

  -- d) spostamento di un cavallo già mio
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

  -- e) stesso cavallo già presente nel cliente con un altro codice → una sola riga (gli interventi passano alla riga che resta)
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
      microchip = coalesce(nullif(microchip, ''), v_dup.microchip), razza = coalesce(nullif(razza, ''), v_dup.razza)
     where id = v_mio.id;
    insert into cavalli_storico (codice_equo, horse_id, scuderia_cavallo_id, cavallo_cliente_id, tipo, descrizione, autore_user_id, autore_ruolo, app)
    values (v_dup.codice_equo, v_dup.horse_id, v_dup.scuderia_cavallo_id, v_mio.id, 'unione',
            'Scheda ' || coalesce(v_dup.codice_equo, '') || ' unita a ' || coalesce(v_mio.codice_equo, '') || ' (stesso cavallo): storico e interventi in un''unica scheda', v_me, 'maniscalco', 'app');
    delete from cavalli_clienti_mascalcia where id = v_dup.id;
  end loop;

  select codice_equo, horse_id, scuderia_cavallo_id into v_cod_dopo, v_horse, v_scav from cavalli_clienti_mascalcia where id = v_mio.id;
  insert into cavalli_storico (codice_equo, horse_id, scuderia_cavallo_id, cavallo_cliente_id, tipo, descrizione, autore_user_id, autore_ruolo, app)
  values (v_cod_dopo, v_horse, v_scav, v_mio.id, 'spostamento', 'Spostato da ' || v_nome_da || ' a ' || v_cli.nome || ' (maniscalco ' || equo_nome_profilo(v_me) || ')', v_me, 'maniscalco', 'app');
  -- il proprietario collegato lo sa in chat
  if v_mio.cliente_utente is not null then
    insert into messaggi_mascalcia (maniscalco_id, cliente_mascalcia_id, mittente_tipo, mittente_user_id, tipo, testo, letto)
    values (v_me, v_mio.cliente_mascalcia_id, 'maniscalco', v_me, 'testo', '📍 ' || v_mio.nome || ' ora lo seguo presso ' || v_cli.nome || '.', false);
  end if;
  return json_build_object('ok', true, 'azione', 'spostato', 'nome', v_mio.nome, 'codice', v_cod_dopo, 'da', v_nome_da, 'a', v_cli.nome);
end $$;
revoke all on function public.pro_cavallo_da_codice(uuid, text, boolean) from public, anon;
grant execute on function public.pro_cavallo_da_codice(uuid, text, boolean) to authenticated;

-- 3) richiesta del proprietario: usa la scheda del cavallo che il maniscalco ha già (anche se ora è presso una struttura), mai un doppione
create or replace function public.richiedi_appuntamento_maniscalco(p_cliente_id uuid, p_horse_id uuid, p_nome_cavallo text, p_tipo text, p_tipo_altro text, p_data date, p_ora text, p_note text)
returns json language plpgsql security definer set search_path = public as $$
declare
  v_man public.clienti_mascalcia.maniscalco_id%type;
  v_cv public.cavalli_clienti_mascalcia.id%type;
  v_id public.interventi_mascalcia.id%type;
  v_nome text;
  v_chip text;
  v_tipo text;
  v_testo text;
  v_giorni text[] := array['dom','lun','mar','mer','gio','ven','sab'];
  v_mesi text[] := array['gen','feb','mar','apr','mag','giu','lug','ago','set','ott','nov','dic'];
begin
  select maniscalco_id into v_man from public.clienti_mascalcia
   where id = p_cliente_id and cliente_user_id = auth.uid();
  if v_man is null then return json_build_object('ok', false, 'errore', 'non_collegato'); end if;
  if p_tipo is null or p_tipo not in ('ferratura','mezza_ferratura','pareggio','altro') then
    return json_build_object('ok', false, 'errore', 'tipo_non_valido');
  end if;
  if p_data is null or p_data < current_date then return json_build_object('ok', false, 'errore', 'data_non_valida'); end if;

  if p_horse_id is not null then
    select name, microchip into v_nome, v_chip from public.horses where id = p_horse_id and owner_id = auth.uid();
    if not found then return json_build_object('ok', false, 'errore', 'non_tuo_cavallo'); end if;
    select id into v_cv from public.cavalli_clienti_mascalcia
     where cliente_mascalcia_id = p_cliente_id and horse_id = p_horse_id limit 1;
    -- il cavallo è già nelle schede del maniscalco presso un altro cliente (es. spostato nella struttura dove sta)
    if v_cv is null then
      select id into v_cv from public.cavalli_clienti_mascalcia
       where maniscalco_id = v_man and horse_id = p_horse_id limit 1;
    end if;
    if v_cv is null and coalesce(trim(v_chip), '') <> '' then
      select id into v_cv from public.cavalli_clienti_mascalcia
       where cliente_mascalcia_id = p_cliente_id and horse_id is null
         and upper(trim(microchip)) = upper(trim(v_chip)) limit 1;
      if v_cv is not null then
        update public.cavalli_clienti_mascalcia set horse_id = p_horse_id where id = v_cv;
        update public.interventi_mascalcia set horse_id = p_horse_id where cavallo_cliente_id = v_cv;
      end if;
    end if;
    if v_cv is null then
      select id into v_cv from public.cavalli_clienti_mascalcia
       where cliente_mascalcia_id = p_cliente_id and horse_id is null
         and lower(trim(nome)) = lower(trim(v_nome)) limit 1;
    end if;
    if v_cv is null then
      insert into public.cavalli_clienti_mascalcia (maniscalco_id, cliente_mascalcia_id, nome, microchip, horse_id)
      values (v_man, p_cliente_id, v_nome, nullif(upper(trim(v_chip)), ''), p_horse_id)
      returning id into v_cv;
    end if;
  else
    v_nome := nullif(trim(p_nome_cavallo), '');
    if v_nome is not null then
      select id into v_cv from public.cavalli_clienti_mascalcia
       where cliente_mascalcia_id = p_cliente_id and horse_id is null and lower(trim(nome)) = lower(v_nome) limit 1;
      if v_cv is null then
        insert into public.cavalli_clienti_mascalcia (maniscalco_id, cliente_mascalcia_id, nome)
        values (v_man, p_cliente_id, v_nome)
        returning id into v_cv;
      end if;
    end if;
  end if;

  insert into public.interventi_mascalcia
    (maniscalco_id, cliente_mascalcia_id, cavallo_cliente_id, horse_id, tipo_ferratura, tipo_altro,
     data_intervento, ora, stato, stato_pagamento, note)
  values
    (v_man, p_cliente_id, v_cv, p_horse_id, p_tipo,
     case when p_tipo = 'altro' then nullif(trim(p_tipo_altro), '') end,
     p_data, nullif(trim(p_ora), '')::time, 'richiesto', 'da_saldare', nullif(trim(p_note), ''))
  returning id into v_id;

  v_tipo := case p_tipo when 'ferratura' then 'Ferratura' when 'mezza_ferratura' then 'Mezza ferratura'
            when 'pareggio' then 'Pareggio' else coalesce(nullif(trim(p_tipo_altro), ''), 'Altro') end;
  v_testo := '📅 Richiesta appuntamento: ' || v_tipo || coalesce(' per ' || v_nome, '') || ', '
    || v_giorni[extract(dow from p_data)::int + 1] || ' ' || extract(day from p_data)::int || ' ' || v_mesi[extract(month from p_data)::int]
    || coalesce(' ore ' || left(nullif(trim(p_ora), ''), 5), '') || '.'
    || coalesce(' Note: ' || nullif(trim(p_note), ''), '');
  insert into public.messaggi_mascalcia (maniscalco_id, cliente_mascalcia_id, mittente_tipo, tipo, testo, letto)
  values (v_man, p_cliente_id, 'cliente', 'testo', v_testo, false);

  return json_build_object('ok', true, 'id', v_id);
end $$;


-- 4) guida degli agenti (Hammer)
update public.ai_conoscenze set aggiornato_il = now(), verificato_il = current_date, contenuto =
'Dove: "Clienti" → cliente → "Modifica" → sezione "Cavalli"
Passi:
1. Apri "Modifica cliente".
2. Se il cavallo ha già un codice Equo (es. MAR-000005, si legge sotto il nome del cavallo) scrivilo in "Codice Equo del cavallo" e tocca "Aggiungi": arriva con tutto il suo storico. Se è già tra i cavalli di un altro tuo cliente, l''app chiede se spostarlo qui (es. il cavallo del proprietario che sta in una scuderia).
3. Per un cavallo nuovo scrivi "Nome nuovo cavallo" e, se lo sai, "Microchip (opz.)", poi tocca "+ Aggiungi cavallo".
4. Per togliere un cavallo inserito da te tocca il cestino e conferma.
Esempio: Rio di Simone ora sta alla Scuderia Colleferro: Riccardo apre la struttura, scrive PSI-000002 e conferma lo spostamento; se Rio c''era già con il codice della scuderia, le due schede diventano una.
Note: Conta il numero del codice: le tre lettere indicano la razza e possono cambiare se la razza viene corretta (MAR-000005 e ALT-000005 sono lo stesso cavallo). Ogni cavallo ha un solo numero e uno storico a vita: spostamenti e unioni restano registrati. Puoi aggiungere con il codice i cavalli dei proprietari tuoi clienti su Equo e quelli delle strutture collegate. Il proprietario collegato riceve in chat "Rio ora lo seguo presso …". Nella scheda del proprietario il cavallo resta visibile con "📍 presso …". I cavalli marcati "su Equo" arrivano dal proprietario e non si cancellano da qui.
Parole chiave: cavalli cliente, aggiungere cavallo, codice equo, codice cavallo, spostare cavallo, cambio scuderia, unire schede, doppione, microchip, eliminare cavallo'
where titolo = 'Come aggiungo o tolgo i cavalli di un cliente';

-- controllo finale: deve dare true · true · true · 1
select to_regclass('public.cavalli_storico') is not null as storico,
       to_regprocedure('public.pro_cavallo_da_codice(uuid,text,boolean)') is not null as funzione_codice,
       pg_get_functiondef('public.richiedi_appuntamento_maniscalco(uuid,uuid,text,text,text,date,text,text)'::regprocedure) like '%maniscalco_id = v_man and horse_id = p_horse_id%' as richieste_senza_doppioni,
       (select count(*) from ai_conoscenze where titolo = 'Come aggiungo o tolgo i cavalli di un cliente' and contenuto like '%Codice Equo del cavallo%') as guida_aggiornata;
