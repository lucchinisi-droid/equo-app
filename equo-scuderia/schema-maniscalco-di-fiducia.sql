-- Equo · SQL 55 · Maniscalco di fiducia + mai bloccati sul lavoro fatto (10/11/2026)
-- Problema: un appuntamento del maniscalco con una scuderia Equo nasce «da confermare» e finché la scuderia
-- non conferma il maniscalco non può segnarlo fatto (scheda, ferri, costo). Oggi a Giulius Caesar Francesco
-- è rimasto 20 minuti bloccato su Chanel.
-- Ora:
--   1 · flag «Maniscalco di fiducia» sulla scheda del maniscalco nella scuderia (lo decide la scuderia:
--       admin o livello 2-3). Con il flag gli appuntamenti nascono già confermati, anche se lui sposta data o
--       servizio: la scuderia riceve solo l'avviso. Accendendolo, quelli in attesa diventano confermati.
--   2 · anche senza flag: se la data è oggi o passata, il maniscalco può segnare fatto un appuntamento ancora
--       da confermare; la scuderia riceve «Fatto senza la vostra conferma».
--   3 · flag acceso per Francesco Bizzarri a Giulius Caesar e al Centro Ippico del Levante (deciso da Simone).

alter table clienti_mascalcia add column if not exists di_fiducia boolean not null default false;
alter table clienti_mascalcia add column if not exists di_fiducia_il timestamptz;
alter table clienti_mascalcia add column if not exists di_fiducia_da uuid;

-- il flag lo cambia solo la scuderia (con scuderia_pro_fiducia), mai il maniscalco dalla sua scheda
create or replace function clienti_fiducia_guard() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if (new.di_fiducia, new.di_fiducia_il, new.di_fiducia_da) is distinct from (old.di_fiducia, old.di_fiducia_il, old.di_fiducia_da)
     and coalesce(current_setting('equo.fiducia', true), '') <> 'on' and auth.uid() is not null then
    new.di_fiducia := old.di_fiducia; new.di_fiducia_il := old.di_fiducia_il; new.di_fiducia_da := old.di_fiducia_da;
  end if;
  return new;
end $$;
drop trigger if exists trg_clienti_fiducia_guard on clienti_mascalcia;
create trigger trg_clienti_fiducia_guard before update on clienti_mascalcia for each row execute function clienti_fiducia_guard();

create or replace function equo_pro_di_fiducia(p_cliente uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select di_fiducia from clienti_mascalcia where id = p_cliente and centro_id is not null), false)
$$;
revoke all on function equo_pro_di_fiducia(uuid) from public, anon;
grant execute on function equo_pro_di_fiducia(uuid) to authenticated;

-- 1 · la scuderia accende/spegne il flag ---------------------------------------------------------------------
create or replace function scuderia_pro_fiducia(p_cliente uuid, p_on boolean) returns json
language plpgsql security definer set search_path = public as $$
declare c record; v_n int := 0; g uuid; v_centro text;
begin
  select * into c from clienti_mascalcia where id = p_cliente and centro_id is not null;
  if c.id is null then return json_build_object('ok', false, 'errore', 'Professionista non trovato.'); end if;
  if not can_collegare_professionisti(c.centro_id) then return json_build_object('ok', false, 'errore', 'Solo l''amministratore o un membro di livello 2 o 3 può deciderlo.'); end if;
  if c.di_fiducia = coalesce(p_on, false) then return json_build_object('ok', true, 'confermati', 0); end if;
  perform set_config('equo.fiducia', 'on', true);
  update clienti_mascalcia set di_fiducia = coalesce(p_on, false), di_fiducia_il = now(), di_fiducia_da = auth.uid() where id = c.id;
  perform set_config('equo.fiducia', '', true);
  select nome into v_centro from centri where id = c.centro_id;
  perform set_config('equo.appuntamenti', 'on', true);
  if p_on then
    for g in select distinct gruppo_id from interventi_mascalcia where cliente_mascalcia_id = c.id and stato = 'proposto' and gruppo_id is not null loop
      update interventi_mascalcia set stato = 'programmato' where gruppo_id = g and stato = 'proposto';
      v_n := v_n + 1;
    end loop;
  end if;
  perform set_config('equo.collegamento', 'on', true);
  insert into messaggi_mascalcia (maniscalco_id, cliente_mascalcia_id, mittente_tipo, mittente_user_id, tipo, testo, letto)
  values (c.maniscalco_id, c.id, 'cliente', auth.uid(), 'testo',
          case when p_on then '🤝 ' || coalesce(v_centro, 'La struttura') || ' ti ha indicato come maniscalco di fiducia: i tuoi appuntamenti qui non hanno più bisogno della loro conferma. Loro ricevono solo l''avviso.'
                              || case when v_n > 0 then ' ' || v_n || ' appuntament' || case when v_n = 1 then 'o in attesa è confermato' else 'i in attesa sono confermati' end || '.' else '' end
               else 'ℹ️ ' || coalesce(v_centro, 'La struttura') || ' ha tolto il «maniscalco di fiducia»: i nuovi appuntamenti tornano da confermare.' end, false);
  perform set_config('equo.appuntamenti', '', true);
  return json_build_object('ok', true, 'confermati', v_n);
end $$;
revoke all on function scuderia_pro_fiducia(uuid, boolean) from public, anon;
grant execute on function scuderia_pro_fiducia(uuid, boolean) to authenticated;

-- 2 · nuovo appuntamento e modifica dal maniscalco: con il flag nascono confermati -----------------------------
do $$ declare v_def text; v text;
begin
  v_def := pg_get_functiondef('public.pro_proponi_appuntamento_struttura(uuid, text, text, date, text, uuid[], text, numeric, text, text, integer)'::regprocedure);
  if position('di_fiducia' in v_def) = 0 then
    if (length(v_def) - length(replace(v_def, '''proposto'', ''da_saldare''', ''))) / length('''proposto'', ''da_saldare''') <> 2
       or position('''📅 Proposta appuntamento: '' || equo_descr_gruppo(v_gruppo) || ''. Da confermare in Equo Scuderia → Professionisti.''' in v_def) = 0 then
      raise exception 'SQL 55: pro_proponi_appuntamento_struttura non è come previsto, avvisa Claude.';
    end if;
    v_def := replace(v_def, '''proposto'', ''da_saldare''', 'case when c.di_fiducia then ''programmato'' else ''proposto'' end, ''da_saldare''');
    v_def := replace(v_def, '''📅 Proposta appuntamento: '' || equo_descr_gruppo(v_gruppo) || ''. Da confermare in Equo Scuderia → Professionisti.''',
      'case when c.di_fiducia then ''📅 Appuntamento fissato: '' || equo_descr_gruppo(v_gruppo) || ''. (Maniscalco di fiducia: non serve confermare.)'' else ''📅 Proposta appuntamento: '' || equo_descr_gruppo(v_gruppo) || ''. Da confermare in Equo Scuderia → Professionisti.'' end');
    execute v_def;
  end if;

  v_def := pg_get_functiondef('public.pro_azione_appuntamento_struttura(uuid, text, date, text, text)'::regprocedure);
  if position('di_fiducia' in v_def) = 0 then
    v := 'note = coalesce(nullif(trim(p_note), ''''), note), stato = ''proposto''';
    if position(v in v_def) = 0 or position('''). Da confermare in Equo Scuderia → Professionisti.''' in v_def) = 0 then
      raise exception 'SQL 55: pro_azione_appuntamento_struttura non è come previsto, avvisa Claude.';
    end if;
    v_def := replace(v_def, v, 'note = coalesce(nullif(trim(p_note), ''''), note), stato = case when (select di_fiducia from clienti_mascalcia where id = cliente_mascalcia_id) then ''programmato'' else ''proposto'' end');
    v_def := replace(v_def, '''). Da confermare in Equo Scuderia → Professionisti.''',
      ''').'' || case when (select bool_or(cm.di_fiducia) from interventi_mascalcia i join clienti_mascalcia cm on cm.id = i.cliente_mascalcia_id where i.gruppo_id = p_gruppo_id) then '' (Maniscalco di fiducia: non serve confermare.)'' else '' Da confermare in Equo Scuderia → Professionisti.'' end');
    execute v_def;
  end if;
end $$;

-- 3 · regole sugli appuntamenti con la struttura (riscritte: prima c'era solo programmato ↔ fatto) -------------
create or replace function public.interventi_gruppo_guard() returns trigger
language plpgsql security definer set search_path = public as $function$
declare v_fid boolean;
begin
  if new.gruppo_id is null or auth.uid() is null or coalesce(current_setting('equo.appuntamenti', true), '') = 'on' then
    return new;
  end if;
  v_fid := equo_pro_di_fiducia(new.cliente_mascalcia_id);
  if new.stato is distinct from old.stato
     and not ((old.stato = 'programmato' and new.stato = 'fatto') or (old.stato = 'fatto' and new.stato = 'programmato')
              -- SQL 55: il lavoro fatto non resta mai bloccato (oggi o data passata, oppure maniscalco di fiducia)
              or (old.stato in ('proposto','richiesto') and new.stato = 'fatto'
                  and (v_fid or new.data_intervento <= (now() at time zone 'Europe/Rome')::date))) then
    raise exception 'Per confermare, rifiutare o annullare un appuntamento con la struttura usa i tasti dedicati.';
  end if;
  if new.stato = 'fatto' and old.stato <> 'fatto' then return new; end if;   -- segnandolo fatto si può correggere la data
  if (old.data_intervento, old.ora) is distinct from (new.data_intervento, new.ora) then
    if old.stato not in ('programmato','richiesto','proposto') then
      raise exception 'Questo appuntamento non si può più spostare.';
    end if;
    new.stato := case when v_fid and old.stato in ('programmato','proposto') then 'programmato' else 'proposto' end;
  elsif (old.tipo_ferratura, coalesce(old.tipo_altro, '')) is distinct from (new.tipo_ferratura, coalesce(new.tipo_altro, ''))
        and old.stato in ('programmato','richiesto','proposto') then
    new.stato := case when v_fid and old.stato in ('programmato','proposto') then 'programmato' else 'proposto' end;
  end if;
  return new;
end $function$;

create or replace function public.interventi_gruppo_sync() returns trigger
language plpgsql security definer set search_path = public as $function$
declare v_data boolean; v_tipo boolean; v_cambi text := ''; v_cav text; v_fid boolean;
begin
  if new.gruppo_id is null or auth.uid() is null or coalesce(current_setting('equo.appuntamenti', true), '') = 'on' then
    return null;
  end if;
  -- SQL 55: fatto senza conferma → avviso alla struttura (una volta per cavallo)
  if new.stato = 'fatto' and old.stato in ('proposto','richiesto') then
    select cv.nome into v_cav from cavalli_clienti_mascalcia cv where cv.id = new.cavallo_cliente_id;
    perform equo_msg_gruppo(new.gruppo_id, false, '✅ Fatto senza la vostra conferma: ' || equo_tipo_intervento(new.tipo_ferratura, new.tipo_altro)
      || coalesce(' a ' || nullif(trim(v_cav), ''), '') || ' il ' || to_char(new.data_intervento, 'DD/MM/YYYY') || '. È solo per presa visione.');
    return null;
  end if;
  if new.stato = 'fatto' then return null; end if;
  if old.stato not in ('programmato','richiesto','proposto') then return null; end if;
  v_data := (old.data_intervento, old.ora) is distinct from (new.data_intervento, new.ora);
  v_tipo := (old.tipo_ferratura, coalesce(old.tipo_altro, '')) is distinct from (new.tipo_ferratura, coalesce(new.tipo_altro, ''));
  if not v_data and not v_tipo then return null; end if;
  v_fid := equo_pro_di_fiducia(new.cliente_mascalcia_id);
  perform set_config('equo.appuntamenti', 'on', true);
  if v_data then
    update interventi_mascalcia set data_intervento = new.data_intervento, ora = new.ora,
           stato = case when v_fid and stato in ('programmato','proposto') then 'programmato' else 'proposto' end
     where gruppo_id = new.gruppo_id and id <> new.id and stato not in ('fatto','annullato','rifiutato');
  else
    update interventi_mascalcia set stato = case when v_fid and stato = 'programmato' then 'programmato' else 'proposto' end
     where gruppo_id = new.gruppo_id and id <> new.id and stato in ('programmato','richiesto');
  end if;
  if v_tipo then
    select cv.nome into v_cav from cavalli_clienti_mascalcia cv where cv.id = new.cavallo_cliente_id;
    v_cambi := E'\n• Servizio' || coalesce(' (' || nullif(trim(v_cav), '') || ')', '') || ': '
            || equo_tipo_intervento(old.tipo_ferratura, old.tipo_altro) || ' → ' || equo_tipo_intervento(new.tipo_ferratura, new.tipo_altro);
  end if;
  if v_data then
    v_cambi := v_cambi || E'\n• Data: ' || equo_data_it(old.data_intervento, old.ora) || ' → ' || equo_data_it(new.data_intervento, new.ora);
  end if;
  perform equo_msg_gruppo(new.gruppo_id, false,
    '✏️ APPUNTAMENTO MODIFICATO da ' || equo_nome_profilo(auth.uid()) || ':' || v_cambi
    || E'\nOra: ' || equo_descr_gruppo(new.gruppo_id)
    || case when v_fid then E'.\nℹ️ Maniscalco di fiducia: non serve riconfermare.' else E'.\n⚠️ Da riconfermare in Equo Scuderia → Professionisti → Appuntamenti.' end);
  perform set_config('equo.appuntamenti', '', true);
  return null;
end $function$;

-- 4 · la scuderia vede il flag nella lista dei professionisti --------------------------------------------------
do $$ declare v_def text; v text := 'c.collegamento_stato as stato, c.collegamento_origine as origine, c.collegamento_il,';
begin
  v_def := pg_get_functiondef('public.scuderia_lista_professionisti(uuid)'::regprocedure);
  if position('di_fiducia' in v_def) = 0 then
    if position(v in v_def) = 0 then raise exception 'SQL 55: scuderia_lista_professionisti non è come previsto, avvisa Claude.'; end if;
    execute replace(v_def, v, v || ' c.di_fiducia,');
  end if;
end $$;

-- 5 · Francesco Bizzarri di fiducia a Giulius Caesar e al Centro Ippico del Levante -----------------------------
do $$ declare v_n int;
begin
  perform set_config('equo.fiducia', 'on', true);
  update clienti_mascalcia set di_fiducia = true, di_fiducia_il = now()
   where id in ('490c6fc9-8a83-4d7c-a3d9-cf5cd043d91d', 'ad654c6f-6bb8-46be-8eea-f34971a4618b') and not di_fiducia;
  perform set_config('equo.fiducia', '', true);
  perform set_config('equo.appuntamenti', 'on', true);
  update interventi_mascalcia set stato = 'programmato'
   where cliente_mascalcia_id in ('490c6fc9-8a83-4d7c-a3d9-cf5cd043d91d', 'ad654c6f-6bb8-46be-8eea-f34971a4618b') and stato = 'proposto' and gruppo_id is not null;
  get diagnostics v_n = row_count;
  perform set_config('equo.appuntamenti', '', true);
  raise notice 'Appuntamenti in attesa confermati: %', v_n;
end $$;

select (select count(*) from clienti_mascalcia where di_fiducia) as maniscalchi_di_fiducia,
       position('di_fiducia' in pg_get_functiondef('public.pro_proponi_appuntamento_struttura(uuid, text, text, date, text, uuid[], text, numeric, text, text, integer)'::regprocedure)) > 0 as proponi_ok,
       position('di_fiducia' in pg_get_functiondef('public.scuderia_lista_professionisti(uuid)'::regprocedure)) > 0 as lista_ok;
