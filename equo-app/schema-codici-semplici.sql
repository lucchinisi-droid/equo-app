-- 25/10/2026 CODICI EQUO PIÙ SEMPLICI DA SCRIVERE
-- 1) i codici si accettano in qualunque modo: maiuscole o minuscole, con o senza trattini e spazi,
--    O al posto di 0 e I/L al posto di 1 (es. «equopro0fkem», «EQUO-PRO-OFKEM», «equo pro 0fkem» vanno tutti bene)
-- 2) i codici nuovi nascono senza trattini e senza lettere che si confondono: EQUOPRO0FKEM, EQUOOWN…, EQUO3F8A2
--    (i codici già dati restano validi così come sono)
-- Vale per: codice personale del professionista (PRO/TRA/MED), codice del proprietario (OWN), codice invito del cliente
-- del maniscalco, codice della struttura (Equo Scuderia).
-- Si puo rieseguire senza danni.

-- forma normalizzata di un codice (per confrontarli)
create or replace function public.equo_norm_codice(p text) returns text
language plpgsql immutable set search_path to 'public' as $fn$
declare s text; r text; t text;
begin
  s := upper(regexp_replace(coalesce(p, ''), '[^A-Za-z0-9]', '', 'g'));
  if s = '' then return null; end if;
  if translate(left(s, 4), '0', 'O') <> 'EQUO' then return translate(s, 'OIL', '011'); end if;
  r := substr(s, 5);
  t := translate(left(r, 3), '01', 'OI');
  if length(r) >= 7 and t in ('PRO', 'OWN', 'TRA', 'MED') then
    return 'EQUO' || t || translate(substr(r, 4), 'OIL', '011');
  end if;
  return 'EQUO' || translate(r, 'OIL', '011');
end $fn$;

-- tipo di codice: pro, tra, med, own (codici personali) oppure invito (cliente del maniscalco o struttura)
create or replace function public.equo_codice_tipo(p text) returns text
language sql immutable set search_path to 'public' as $fn$
  select case
    when n ~ '^EQUO(PRO|TRA|MED|OWN)[A-Z0-9]{3,8}$' then lower(substr(n, 5, 3))
    when n ~ '^EQUO[A-Z0-9]{3,8}$' then 'invito'
    else null end
  from (select public.equo_norm_codice(p) n) x
$fn$;

-- dal codice scritto dall'utente al codice salvato (se non c'è, torna il testo pulito)
--   p_dove: 'profilo' (codici personali), 'invito' (clienti del maniscalco), 'centro' (strutture), 'riscatta' (profilo o invito)
create or replace function public.equo_codice_trova(p text, p_dove text) returns text
language plpgsql stable security definer set search_path to 'public' as $fn$
declare n text := equo_norm_codice(p); v text; d text := p_dove;
begin
  if n is null then return upper(trim(coalesce(p, ''))); end if;
  if d = 'riscatta' then d := case when equo_codice_tipo(p) in ('pro', 'tra', 'med', 'own') then 'profilo' else 'invito' end; end if;
  if d = 'profilo' then
    select c into v from (
      select codice_professionista c from profiles where equo_norm_codice(codice_professionista) = n
      union all
      select codice_proprietario from profiles where equo_norm_codice(codice_proprietario) = n) x limit 1;
  elsif d = 'invito' then
    select codice_invito into v from clienti_mascalcia where equo_norm_codice(codice_invito) = n limit 1;
  elsif d = 'centro' then
    select join_code into v from centri where equo_norm_codice(join_code) = n limit 1;
  end if;
  return coalesce(v, upper(trim(p)));
end $fn$;
revoke all on function public.equo_codice_trova(text, text) from public, anon;
grant execute on function public.equo_norm_codice(text) to authenticated;
grant execute on function public.equo_codice_tipo(text) to authenticated;

-- ricerca veloce (e niente doppioni tra codici che si scrivono uguale)
create unique index if not exists profiles_codice_professionista_norm on public.profiles (public.equo_norm_codice(codice_professionista)) where codice_professionista is not null;
create unique index if not exists profiles_codice_proprietario_norm on public.profiles (public.equo_norm_codice(codice_proprietario)) where codice_proprietario is not null;
create unique index if not exists clienti_mascalcia_codice_invito_norm on public.clienti_mascalcia (public.equo_norm_codice(codice_invito)) where codice_invito is not null;
create unique index if not exists centri_join_code_norm on public.centri (public.equo_norm_codice(join_code)) where join_code is not null;

-- codici nuovi (o cambiati): salvati nella forma semplice, senza trattini
create or replace function public.equo_codici_forma_semplice() returns trigger
language plpgsql set search_path to 'public' as $fn$
begin
  if tg_table_name = 'profiles' then
    if new.codice_professionista is not null and (tg_op = 'INSERT' or new.codice_professionista is distinct from old.codice_professionista) then
      new.codice_professionista := equo_norm_codice(new.codice_professionista);
    end if;
    if new.codice_proprietario is not null and (tg_op = 'INSERT' or new.codice_proprietario is distinct from old.codice_proprietario) then
      new.codice_proprietario := equo_norm_codice(new.codice_proprietario);
    end if;
  elsif tg_table_name = 'clienti_mascalcia' then
    if new.codice_invito is not null and (tg_op = 'INSERT' or new.codice_invito is distinct from old.codice_invito) then
      new.codice_invito := equo_norm_codice(new.codice_invito);
    end if;
  elsif tg_table_name = 'centri' then
    if new.join_code is not null and (tg_op = 'INSERT' or new.join_code is distinct from old.join_code) then
      new.join_code := equo_norm_codice(new.join_code);
    end if;
  end if;
  return new;
end $fn$;
drop trigger if exists trg_profiles_codici_semplici on public.profiles;
create trigger trg_profiles_codici_semplici before insert or update of codice_professionista, codice_proprietario on public.profiles
  for each row execute function public.equo_codici_forma_semplice();
drop trigger if exists trg_clienti_mascalcia_codice_semplice on public.clienti_mascalcia;
create trigger trg_clienti_mascalcia_codice_semplice before insert or update of codice_invito on public.clienti_mascalcia
  for each row execute function public.equo_codici_forma_semplice();
drop trigger if exists trg_centri_codice_semplice on public.centri;
create trigger trg_centri_codice_semplice before insert or update of join_code on public.centri
  for each row execute function public.equo_codici_forma_semplice();

-- ===== funzioni che cercano un codice: ora con equo_codice_trova =====

CREATE OR REPLACE FUNCTION public.collega_cliente_mascalcia_da_codice(p_cliente_id uuid, p_codice text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_uid uuid := auth.uid();
  r public.clienti_mascalcia%rowtype;
  v_user uuid;
  v_nome text;
  v_altro text;
begin
  if v_uid is null then return json_build_object('ok', false, 'errore', 'non_autenticato'); end if;

  select * into r from public.clienti_mascalcia where id = p_cliente_id and maniscalco_id = v_uid;
  if not found then return json_build_object('ok', false, 'errore', 'cliente_non_trovato'); end if;

  if equo_codice_tipo(p_codice) in ('pro', 'tra', 'med') then return json_build_object('ok', false, 'errore', 'codice_professionista'); end if;
  select p.id, p.full_name into v_user, v_nome from public.profiles p
   where p.codice_proprietario = equo_codice_trova(p_codice, 'profilo') limit 1;
  if v_user is null then return json_build_object('ok', false, 'errore', 'codice_non_valido'); end if;
  if v_user = v_uid then return json_build_object('ok', false, 'errore', 'codice_tuo'); end if;

  if r.cliente_user_id is not null and r.cliente_user_id <> v_user then
    return json_build_object('ok', false, 'errore', 'gia_collegato_altro');
  end if;
  if r.cliente_user_id = v_user then
    return json_build_object('ok', true, 'gia_collegato', true, 'nome_proprietario', v_nome);
  end if;

  select nome into v_altro from public.clienti_mascalcia
   where maniscalco_id = v_uid and cliente_user_id = v_user and id <> p_cliente_id limit 1;
  if v_altro is not null then
    return json_build_object('ok', false, 'errore', 'gia_tuo_cliente', 'nome_cliente', v_altro);
  end if;

  update public.clienti_mascalcia set cliente_user_id = v_user where id = r.id;

  insert into public.messaggi_mascalcia (maniscalco_id, cliente_mascalcia_id, mittente_tipo, tipo, testo, letto)
  values (v_uid, r.id, 'maniscalco', 'testo',
          'Ciao! Ti ho aggiunto come mio cliente su Equo: da qui puoi scrivermi e prenotare gli appuntamenti.', false);

  return json_build_object('ok', true, 'nome_proprietario', v_nome);
end $function$;

CREATE OR REPLACE FUNCTION public.crea_chat_collega(p_codice text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_me uuid := auth.uid();
  v_altro record;
  v_conv uuid;
begin
  if v_me is null then return json_build_object('ok', false, 'errore', 'non_autenticato'); end if;
  if not exists (select 1 from profiles where id = v_me
                 and (ruolo in ('maniscalco','veterinario','istruttore') or ruolo_secondario in ('maniscalco','veterinario','istruttore'))) then
    return json_build_object('ok', false, 'errore', 'solo_professionisti');
  end if;
  select id, coalesce(nullif(trim(full_name), ''), nullif(trim(dati_pagamento_nome), '')) as nome,
         case when ruolo in ('maniscalco','veterinario','istruttore') then ruolo else ruolo_secondario end as ruolo_pro,
         avatar_url
    into v_altro
    from profiles
   where codice_professionista = equo_codice_trova(p_codice, 'profilo')
     and (ruolo in ('maniscalco','veterinario','istruttore') or ruolo_secondario in ('maniscalco','veterinario','istruttore'))
   limit 1;
  if v_altro.id is null then return json_build_object('ok', false, 'errore', 'codice_non_valido'); end if;
  if v_altro.id = v_me then return json_build_object('ok', false, 'errore', 'codice_tuo'); end if;

  select id into v_conv from conversazioni_proprietari
   where tipo = 'colleghi'
     and ((proprietario_a_id = v_me and proprietario_b_id = v_altro.id) or (proprietario_a_id = v_altro.id and proprietario_b_id = v_me))
   limit 1;
  if v_conv is null then
    begin
      insert into conversazioni_proprietari (proprietario_a_id, proprietario_b_id, tipo)
      values (v_me, v_altro.id, 'colleghi') returning id into v_conv;
    exception when unique_violation then
      select id into v_conv from conversazioni_proprietari
       where (proprietario_a_id = v_me and proprietario_b_id = v_altro.id) or (proprietario_a_id = v_altro.id and proprietario_b_id = v_me)
       limit 1;
    end;
  end if;
  return json_build_object('ok', true, 'conversazione_id', v_conv, 'nome', v_altro.nome, 'ruolo', v_altro.ruolo_pro, 'avatar_url', v_altro.avatar_url);
end $function$;

CREATE OR REPLACE FUNCTION public.equo_mio_codice_trainer()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare c text; i int := 0;
begin
  if auth.uid() is null then raise exception 'Accedi di nuovo'; end if;
  select codice_professionista into c from profiles where id = auth.uid();
  if c is not null and equo_codice_tipo(c) = 'tra' then return c; end if;
  loop
    i := i + 1;
    c := 'EQUOTRA' || upper(substr(md5(random()::text || clock_timestamp()::text || auth.uid()::text), 1, 5));
    begin
      update profiles set codice_professionista = c where id = auth.uid();
      return equo_norm_codice(c);
    exception when unique_violation then
      if i > 10 then raise; end if;
    end;
  end loop;
end $function$;

CREATE OR REPLACE FUNCTION public.equo_nuovo_codice_invito()
 RETURNS text
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
declare v text;
begin
  loop
    v := equo_norm_codice('EQUO' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 5)));
    exit when not exists (select 1 from clienti_mascalcia where equo_norm_codice(codice_invito) = v);
  end loop;
  return v;
end $function$;

CREATE OR REPLACE FUNCTION public.equo_proprietario_invita_trainer(p_horse uuid, p_codice text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare t uuid; l trainer_collegamenti%rowtype; st text; nome text;
begin
  if not exists (select 1 from horses where id = p_horse and owner_id = auth.uid()) then raise exception 'Cavallo non trovato'; end if;
  select id into t from profiles
   where codice_professionista = equo_codice_trova(p_codice, 'profilo')
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

CREATE OR REPLACE FUNCTION public.find_profile_by_chat_code(p_codice text)
 RETURNS TABLE(id uuid, full_name text, avatar_url text, ruolo text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
AS $function$
  select id, full_name, avatar_url, ruolo
  from public.profiles
  where (codice_proprietario = public.equo_codice_trova(p_codice, 'profilo') or codice_professionista = public.equo_codice_trova(p_codice, 'profilo'))
    and id <> auth.uid()
  limit 1;
$function$;

CREATE OR REPLACE FUNCTION public.join_centro_by_code(p_join_code text, p_ruolo text, p_nome_visualizzato text DEFAULT NULL::text)
 RETURNS TABLE(centro_id uuid, nome text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_centro record; v_claimed_id uuid; v_nome text; v_norm text;
begin
  if auth.uid() is null then raise exception 'Accedi prima di usare il codice invito'; end if;
  if p_ruolo not in ('istruttore','veterinario','maniscalco','allievo','segretario','giardiniere','altro') then
    raise exception 'Ruolo non valido per iscrizione autonoma';
  end if;
  select * into v_centro from centri where join_code = equo_codice_trova(p_join_code, 'centro');
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
    exception when unique_violation then null;
    end;
  end if;
  return query select v_centro.id, v_centro.nome;
end $function$;

CREATE OR REPLACE FUNCTION public.link_proprietario_da_codice(p_centro_id uuid, p_codice text, p_nome_fallback text DEFAULT NULL::text)
 RETURNS TABLE(membro_id uuid, user_id uuid, nome text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_profilo record;
  v_membro record;
begin
  if not exists (
    select 1 from scuderia_membri
    where centro_id = p_centro_id and scuderia_membri.user_id = auth.uid()
      and ruolo <> 'proprietario'
  ) then
    raise exception 'Non fai parte di questo centro';
  end if;
  if p_codice is null or length(trim(p_codice)) = 0 then
    raise exception 'Codice non valido';
  end if;
  select id, full_name into v_profilo from profiles
  where codice_proprietario = equo_codice_trova(p_codice, 'profilo');
  if not found then
    raise exception 'Codice non valido';
  end if;
  select * into v_membro from scuderia_membri
  where centro_id = p_centro_id and scuderia_membri.user_id = v_profilo.id;
  if found then
    return query select v_membro.id, v_profilo.id, coalesce(v_membro.nome_visualizzato, v_profilo.full_name, p_nome_fallback);
  else
    return query
      insert into scuderia_membri (centro_id, user_id, ruolo, nome_visualizzato)
      values (p_centro_id, v_profilo.id, 'proprietario', coalesce(v_profilo.full_name, p_nome_fallback))
      returning id, v_profilo.id, nome_visualizzato;
  end if;
end $function$;

CREATE OR REPLACE FUNCTION public.lookup_profilo_da_codice_app(p_codice text)
 RETURNS TABLE(id uuid, full_name text, avatar_url text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select p.id, coalesce(nullif(trim(p.full_name), ''), nullif(trim(p.dati_pagamento_nome), '')), p.avatar_url
  from profiles p
  where p.codice_proprietario = equo_codice_trova(p_codice, 'profilo') and p.id <> auth.uid();
$function$;

CREATE OR REPLACE FUNCTION public.pro_richiedi_collegamento_struttura(p_codice text, p_cliente_id uuid DEFAULT NULL::uuid)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_me uuid := auth.uid(); v_pro record; v_centro record; v_es record; v_id uuid; v_senza boolean;
begin
  if v_me is null then return json_build_object('ok', false, 'errore', 'Accedi di nuovo.'); end if;
  select ruolo, ruolo_secondario, dati_pagamento_piva_cf into v_pro from profiles where id = v_me;
  if 'maniscalco' not in (coalesce(v_pro.ruolo, ''), coalesce(v_pro.ruolo_secondario, '')) then
    return json_build_object('ok', false, 'errore', 'Per ora il collegamento con le strutture è disponibile per i maniscalchi.');
  end if;
  v_senza := coalesce(trim(v_pro.dati_pagamento_piva_cf), '') = '';
  select id, nome, telefono into v_centro from centri where join_code = equo_codice_trova(p_codice, 'centro') limit 1;
  if v_centro.id is null then return json_build_object('ok', false, 'errore', 'Codice struttura non trovato. Chiedilo alla struttura (lo trova in Equo Scuderia → Il tuo Centro).'); end if;
  select * into v_es from clienti_mascalcia where maniscalco_id = v_me and centro_id = v_centro.id;
  if v_es.id is not null then
    return json_build_object('ok', true, 'gia', true, 'stato', v_es.collegamento_stato, 'nome', v_centro.nome, 'cliente_id', v_es.id, 'senza_piva', v_senza);
  end if;
  perform set_config('equo.collegamento', 'on', true);
  if p_cliente_id is not null then
    update clienti_mascalcia
       set centro_id = v_centro.id, collegamento_stato = 'da_confermare_struttura', collegamento_origine = 'maniscalco',
           collegamento_il = now(), tipo_cliente = 'struttura'
     where id = p_cliente_id and maniscalco_id = v_me and centro_id is null
    returning id into v_id;
    if v_id is null then return json_build_object('ok', false, 'errore', 'Scheda cliente non valida.'); end if;
  else
    insert into clienti_mascalcia (maniscalco_id, nome, telefono, codice_invito, tipo_cliente, centro_id, collegamento_stato, collegamento_origine, collegamento_il)
    values (v_me, coalesce(nullif(trim(v_centro.nome), ''), 'Struttura'), v_centro.telefono, equo_nuovo_codice_invito(), 'struttura',
            v_centro.id, 'da_confermare_struttura', 'maniscalco', now())
    returning id into v_id;
  end if;
  insert into messaggi_mascalcia (maniscalco_id, cliente_mascalcia_id, mittente_tipo, mittente_user_id, tipo, testo, letto)
  values (v_me, v_id, 'maniscalco', v_me, 'testo',
    '🤝 ' || equo_nome_profilo(v_me) || ' chiede di collegarsi alla struttura come maniscalco su Equo.', false);
  return json_build_object('ok', true, 'nome', v_centro.nome, 'cliente_id', v_id, 'senza_piva', v_senza);
end $function$;

CREATE OR REPLACE FUNCTION public.riscatta_codice_maniscalco(p_codice text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_uid uuid := auth.uid();
  v_cod text := upper(coalesce(equo_codice_trova(p_codice, 'riscatta'), ''));
  r public.clienti_mascalcia%rowtype;
  v_nome text;
  v_pro uuid;
  v_nome_cliente text;
  v_invito text;
  v_nuovo boolean := false;
begin
  if v_uid is null then return json_build_object('ok', false, 'errore', 'non_autenticato'); end if;
  if v_cod = '' then return json_build_object('ok', false, 'errore', 'codice_non_valido'); end if;

  if equo_codice_tipo(v_cod) = 'pro' then
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
      v_invito := equo_nuovo_codice_invito();
      insert into public.clienti_mascalcia (maniscalco_id, nome, cliente_user_id, codice_invito, tipo_cliente)
      values (v_pro, coalesce(v_nome_cliente, 'Cliente Equo'), v_uid, v_invito, 'proprietario')
      returning * into r;
      v_nuovo := true;
      insert into public.messaggi_mascalcia (maniscalco_id, cliente_mascalcia_id, mittente_tipo, mittente_user_id, tipo, testo)
      values (v_pro, r.id, 'cliente', v_uid, 'testo', 'Ciao! Mi sono collegato a te su Equo con il tuo codice personale.');
    end if;
  elsif equo_codice_tipo(v_cod) in ('tra', 'med', 'own') then
    return json_build_object('ok', false, 'errore', 'codice_altro_tipo', 'tipo', equo_codice_tipo(v_cod));
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

CREATE OR REPLACE FUNCTION public.scuderia_aggiungi_maniscalco(p_centro_id uuid, p_codice text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_centro record; v_pro record; v_es record; v_id uuid; v_senza boolean;
begin
  if not can_collegare_professionisti(p_centro_id) then
    return json_build_object('ok', false, 'errore', 'Solo l''amministratore o un membro di livello 2 o 3 può collegare professionisti.');
  end if;
  select id, nome, telefono into v_centro from centri where id = p_centro_id;
  select id, ruolo, ruolo_secondario, dati_pagamento_piva_cf into v_pro from profiles
   where codice_professionista = equo_codice_trova(p_codice, 'profilo') limit 1;
  if v_pro.id is null then return json_build_object('ok', false, 'errore', 'Codice professionista non trovato. Controlla di averlo scritto bene.'); end if;
  if 'maniscalco' not in (coalesce(v_pro.ruolo, ''), coalesce(v_pro.ruolo_secondario, '')) then
    return json_build_object('ok', false, 'errore', 'Questo codice non è di un maniscalco. Veterinari e istruttori saranno collegabili a breve.');
  end if;
  -- P.IVA / codice fiscale mancanti: si segnala ma non si blocca
  v_senza := coalesce(trim(v_pro.dati_pagamento_piva_cf), '') = '';
  select * into v_es from clienti_mascalcia where maniscalco_id = v_pro.id and centro_id = p_centro_id;
  if v_es.id is not null then
    return json_build_object('ok', true, 'gia', true, 'stato', v_es.collegamento_stato, 'nome', equo_nome_profilo(v_pro.id), 'senza_piva', v_senza);
  end if;
  perform set_config('equo.collegamento', 'on', true);
  insert into clienti_mascalcia (maniscalco_id, nome, telefono, codice_invito, tipo_cliente, centro_id, collegamento_stato, collegamento_origine, collegamento_il)
  values (v_pro.id, coalesce(nullif(trim(v_centro.nome), ''), 'Struttura'), v_centro.telefono, equo_nuovo_codice_invito(), 'struttura',
          p_centro_id, 'da_confermare_pro', 'struttura', now())
  returning id into v_id;
  insert into messaggi_mascalcia (maniscalco_id, cliente_mascalcia_id, mittente_tipo, mittente_user_id, tipo, testo, letto)
  values (v_pro.id, v_id, 'cliente', auth.uid(), 'testo',
    '🤝 ' || coalesce(nullif(trim(v_centro.nome), ''), 'Una struttura') || ' vuole collegarti come maniscalco su Equo: chat e appuntamenti con la struttura in un posto solo. Accetta da Clienti → Strutture.'
    || case when v_senza then E'\n\nℹ️ Nel tuo profilo mancano P.IVA o codice fiscale: aggiungili da menu profilo → Dati per i pagamenti.' else '' end, false);
  return json_build_object('ok', true, 'nome', equo_nome_profilo(v_pro.id), 'senza_piva', v_senza);
end $function$;

-- controllo: atteso EQUOPRO0FKEM | EQUO-PRO-0FKEM | pro | invito | 4
select public.equo_norm_codice('equo-pro-ofkem') norma,
       public.equo_codice_trova('equopro OFKEM', 'profilo') trovato,
       public.equo_codice_tipo('EQUOPRO0FKEM') tipo1,
       public.equo_codice_tipo('equo-3f8a2') tipo2,
       (select count(*) from pg_trigger where tgname in ('trg_profiles_codici_semplici', 'trg_clienti_mascalcia_codice_semplice', 'trg_centri_codice_semplice'))
        + (select count(*) from pg_proc where proname = 'equo_codice_trova') trigger_e_funzioni;
