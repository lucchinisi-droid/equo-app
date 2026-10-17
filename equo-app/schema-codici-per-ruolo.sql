-- Equo · codici personali per ruolo (sostituisce schema-fix-riscatta-codice-solo-maniscalchi.sql)
--   maniscalco   EQUO-PRO-XXXXX
--   allenatore   EQUO-TRA-XXXXX   (sostituisce il vecchio TR-…)
--   veterinario  EQUO-MED-XXXXX
-- Il codice è unico per persona: è profiles.codice_professionista (indice unico già presente).
-- Chat tra colleghi, ricerca per codice e Scuderia cercano il codice intero: non dipendono dal prefisso.
-- Nessun codice esistente cambia (4 codici, tutti di maniscalchi; trainer_codici è vuota).

-- 1) Il codice del proprietario → scheda cliente di mascalcia solo se il professionista è un maniscalco.
create or replace function public.riscatta_codice_maniscalco(p_codice text)
 returns json language plpgsql security definer set search_path to 'public'
as $function$
declare
  v_uid uuid := auth.uid();
  v_cod text := upper(trim(coalesce(p_codice, '')));
  r public.clienti_mascalcia%rowtype;
  v_nome text;
  v_pro uuid;
  v_nome_cliente text;
  v_invito text;
  v_nuovo boolean := false;
begin
  if v_uid is null then return json_build_object('ok', false, 'errore', 'non_autenticato'); end if;
  if v_cod = '' then return json_build_object('ok', false, 'errore', 'codice_non_valido'); end if;

  if v_cod like 'EQUO-PRO-%' then
    select id into v_pro from public.profiles
     where upper(codice_professionista) = v_cod
       and (ruolo = 'maniscalco' or ruolo_secondario = 'maniscalco') limit 1;
    if v_pro is null then return json_build_object('ok', false, 'errore', 'codice_non_valido'); end if;
    if v_pro = v_uid then return json_build_object('ok', false, 'errore', 'codice_tuo'); end if;
    select * into r from public.clienti_mascalcia
     where maniscalco_id = v_pro and cliente_user_id = v_uid and centro_id is null and archiviato_il is null
     order by created_at limit 1;
    if not found then
      select coalesce(nullif(trim(full_name), ''), nullif(split_part(coalesce(email, ''), '@', 1), ''), 'Cliente Equo')
        into v_nome_cliente from public.profiles where id = v_uid;
      loop
        v_invito := 'EQUO-' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 5));
        exit when not exists (select 1 from public.clienti_mascalcia where codice_invito = v_invito);
      end loop;
      insert into public.clienti_mascalcia (maniscalco_id, nome, cliente_user_id, codice_invito, tipo_cliente)
      values (v_pro, coalesce(v_nome_cliente, 'Cliente Equo'), v_uid, v_invito, 'proprietario')
      returning * into r;
      v_nuovo := true;
      insert into public.messaggi_mascalcia (maniscalco_id, cliente_mascalcia_id, mittente_tipo, mittente_user_id, tipo, testo)
      values (v_pro, r.id, 'cliente', v_uid, 'testo', 'Ciao! Mi sono collegato a te su Equo con il tuo codice personale.');
    end if;
  else
    select * into r from public.clienti_mascalcia where upper(codice_invito) = v_cod limit 1;
    if not found then return json_build_object('ok', false, 'errore', 'codice_non_valido'); end if;
    if r.maniscalco_id = v_uid then return json_build_object('ok', false, 'errore', 'codice_tuo'); end if;
    if r.cliente_user_id is not null and r.cliente_user_id <> v_uid then
      return json_build_object('ok', false, 'errore', 'codice_gia_usato');
    end if;
    update public.clienti_mascalcia set cliente_user_id = v_uid where id = r.id;
  end if;

  select coalesce(nullif(trim(p.full_name), ''), nullif(trim(p.dati_pagamento_nome), ''))
    into v_nome from public.profiles p where p.id = r.maniscalco_id;
  return json_build_object('ok', true, 'cliente_mascalcia_id', r.id, 'maniscalco_id', r.maniscalco_id,
                           'nome_maniscalco', coalesce(v_nome, 'Il tuo maniscalco'), 'nuovo', v_nuovo);
end $function$;

-- 2) Il codice dell'allenatore è EQUO-TRA-… e coincide con il suo codice personale.
create or replace function public.equo_mio_codice_trainer()
 returns text language plpgsql security definer set search_path to 'public'
as $function$
declare c text; i int := 0;
begin
  if auth.uid() is null then raise exception 'Accedi di nuovo'; end if;
  select codice_professionista into c from profiles where id = auth.uid();
  if c is not null and upper(c) like 'EQUO-TRA-%' then return c; end if;
  loop
    i := i + 1;
    c := 'EQUO-TRA-' || upper(substr(md5(random()::text || clock_timestamp()::text || auth.uid()::text), 1, 5));
    begin
      update profiles set codice_professionista = c where id = auth.uid();
      return c;
    exception when unique_violation then
      if i > 10 then raise; end if;
    end;
  end loop;
end $function$;

-- 3) Il proprietario invita l'allenatore con il suo codice EQUO-TRA-… (solo se è davvero un istruttore).
create or replace function public.equo_proprietario_invita_trainer(p_horse uuid, p_codice text)
 returns jsonb language plpgsql security definer set search_path to 'public'
as $function$
declare t uuid; l trainer_collegamenti%rowtype; st text; nome text;
begin
  if not exists (select 1 from horses where id = p_horse and owner_id = auth.uid()) then raise exception 'Cavallo non trovato'; end if;
  select id into t from profiles
   where upper(codice_professionista) = upper(trim(coalesce(p_codice,'')))
     and (ruolo = 'istruttore' or ruolo_secondario = 'istruttore') limit 1;
  if t is null then raise exception 'CODICE_NON_TROVATO'; end if;
  if t = auth.uid() then raise exception 'CODICE_PROPRIO'; end if;
  select * into l from trainer_collegamenti where trainer_id = t and horse_id = p_horse;
  if not found then
    insert into trainer_collegamenti (trainer_id, owner_id, horse_id, stato, origine) values (t, auth.uid(), p_horse, 'da_confermare_trainer', 'proprietario');
    st := 'da_confermare_trainer';
  elsif l.stato = 'da_confermare_proprietario' then
    update trainer_collegamenti set stato = 'attivo', risposto_il = now() where id = l.id; st := 'attivo';
    insert into trainer_cavalli (trainer_id, horse_id, nome) select t, p_horse, h.name from horses h where h.id = p_horse
      and not exists (select 1 from trainer_cavalli x where x.trainer_id = t and x.horse_id = p_horse and x.archiviato_il is null);
  elsif l.stato = 'revocato' then
    update trainer_collegamenti set stato = 'da_confermare_trainer', origine = 'proprietario', revocato_il = null, revocato_da = null, risposto_il = null where id = l.id;
    st := 'da_confermare_trainer';
  else st := l.stato; end if;
  select coalesce(nullif(trim(full_name),''),'Istruttore') into nome from profiles where id = t;
  return jsonb_build_object('ok', true, 'trainer', nome, 'stato', st);
end $function$;
