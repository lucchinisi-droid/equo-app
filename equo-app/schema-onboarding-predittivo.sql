-- Equo: ONBOARDING PREDITTIVO TRA PROFESSIONISTA E PROPRIETARIO (27 ottobre 2026)
-- Nato dai casi Sara Matteucci / Francesco Bizzarri e Simone / Riccardo (schede doppie dello stesso cavallo).
-- 1) Email del cliente: chi si iscrive con quella email trova «<maniscalco> ti segue già con …: collegati».
-- 2) Proprietario che crea un cavallo con lo stesso nome di uno proposto: si collega da solo alla scheda del maniscalco.
-- 3) Cavalli simili all'inserimento (stesso nome o microchip): il maniscalco vede «c'è già sotto …» prima di creare un doppione.
-- 4) Stato del collegamento nella scheda cliente + «Ricordaglielo».
-- 5) Ogni mattina: promemoria al proprietario per i cavalli proposti non accettati (dopo 24 ore) e a Hammer per il maniscalco
--    (dopo 3 giorni); una volta a settimana Hammer segnala i possibili doppioni tra clienti.
-- 6) Le unioni di schede copiano anche i dettagli del ferro correttivo (ferro_dettagli, ferro_dettagli_post).
-- Rieseguibile.

-- ===== 1) email del cliente e «ti segue già» =====
alter table public.clienti_mascalcia add column if not exists email text;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'clienti_mascalcia_email_chk') then
    alter table public.clienti_mascalcia add constraint clienti_mascalcia_email_chk check (email is null or (length(email) <= 200 and email like '%_@_%'));
  end if;
end $$;
create index if not exists clienti_mascalcia_email_idx on public.clienti_mascalcia (lower(email)) where email is not null and cliente_user_id is null;

create or replace function public.equo_professionisti_che_mi_seguono()
returns json language sql stable security definer set search_path = public as $$
  select coalesce(json_agg(json_build_object(
    'cliente_mascalcia_id', c.id, 'maniscalco_id', c.maniscalco_id, 'maniscalco', equo_nome_profilo(c.maniscalco_id),
    'cavalli', (select coalesce(json_agg(cv.nome order by cv.nome), '[]'::json) from cavalli_clienti_mascalcia cv where cv.cliente_mascalcia_id = c.id and cv.archiviato_il is null),
    'lavori', (select count(*) from interventi_mascalcia i where i.cliente_mascalcia_id = c.id and i.stato = 'fatto')
  ) order by c.created_at), '[]'::json)
  from clienti_mascalcia c
  where auth.uid() is not null and c.email is not null
    and lower(trim(c.email)) = (select lower(trim(u.email)) from auth.users u where u.id = auth.uid())
    and c.cliente_user_id is null and c.centro_id is null and c.archiviato_il is null and c.maniscalco_id <> auth.uid()
$$;
revoke all on function public.equo_professionisti_che_mi_seguono() from public, anon;
grant execute on function public.equo_professionisti_che_mi_seguono() to authenticated;

create or replace function public.equo_collegati_da_contatto(p_cliente uuid)
returns json language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); v_mail text; r clienti_mascalcia;
begin
  if v_uid is null then return json_build_object('ok', false, 'errore', 'non_autenticato'); end if;
  select lower(trim(email)) into v_mail from auth.users where id = v_uid;
  select * into r from clienti_mascalcia where id = p_cliente for update;
  if r.id is null or r.email is null or v_mail is null or lower(trim(r.email)) <> v_mail then return json_build_object('ok', false, 'errore', 'non_trovato'); end if;
  if r.cliente_user_id is not null and r.cliente_user_id <> v_uid then return json_build_object('ok', false, 'errore', 'codice_gia_usato'); end if;
  if r.cliente_user_id is null then
    update clienti_mascalcia set cliente_user_id = v_uid where id = r.id;   -- il trigger trg_proposte_al_collegamento prepara i cavalli
    insert into messaggi_mascalcia (maniscalco_id, cliente_mascalcia_id, mittente_tipo, mittente_user_id, tipo, testo)
    values (r.maniscalco_id, r.id, 'cliente', v_uid, 'testo', 'Ciao! Mi sono collegato a te su Equo.');
  end if;
  return json_build_object('ok', true, 'cliente_mascalcia_id', r.id, 'maniscalco_id', r.maniscalco_id,
                           'nome_maniscalco', coalesce(equo_nome_profilo(r.maniscalco_id), 'Il tuo maniscalco'));
end $$;
revoke all on function public.equo_collegati_da_contatto(uuid) from public, anon;
grant execute on function public.equo_collegati_da_contatto(uuid) to authenticated;

-- ===== 2) cavallo creato dal proprietario con lo stesso nome di uno proposto: si collega da solo =====
-- 1) accettazione di una proposta (interna: la usano «Accetta» e «Accetta tutti»)
create or replace function public.equo_accetta_proposta_interno(p_proposta uuid, p_uid uuid)
returns json language plpgsql security definer set search_path = public as $$
declare v_p cavalli_proposte; v_r cavalli_clienti_mascalcia; v_h horses; v_new uuid; v_horse uuid; v_come text;
        v_lavori int := 0; v_libretto int := 0; v_dal date;
begin
  perform set_config('equo.accetta', 'on', true);   -- 19: il trigger «stesso nome» sui cavalli non deve ripartire da qui
  select * into v_p from cavalli_proposte p where p.id = p_proposta and p.owner_id = p_uid and p.stato = 'in_attesa';
  if v_p.id is null then perform set_config('equo.accetta', '', true); return json_build_object('ok', false, 'motivo', 'proposta_non_trovata'); end if;
  select * into v_r from cavalli_clienti_mascalcia cv where cv.id = v_p.riga_id;
  if v_r.id is null then perform set_config('equo.accetta', '', true); return json_build_object('ok', false, 'motivo', 'scheda_non_trovata'); end if;

  if v_r.horse_id is not null then
    v_horse := v_r.horse_id; v_come := 'gia_collegata';
  else
    select h.* into v_h from horses h
     where h.owner_id = p_uid and h.condiviso_ecosistema is true and equo_norm_nome(h.name) = equo_norm_nome(v_r.nome)
     order by h.created_at limit 1;
    if v_h.id is not null then
      update cavalli_clienti_mascalcia set horse_id = v_h.id, nome = v_h.name,
        microchip = coalesce(nullif(microchip, ''), v_h.microchip) where id = v_r.id;
      perform equo_unifica_numero_cavallo(v_h.id, array[v_r.equo_numero]);
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
      'Cavallo preparato dal maniscalco (' || cv.nome || ') e accettato dal proprietario: stessa scheda, nessun doppione',
      p_uid, 'proprietario', 'app' from cavalli_clienti_mascalcia cv where cv.id = v_r.id;
  end if;

  -- i lavori della scheda (già fatti e in agenda) passano al cavallo del proprietario: quelli fatti entrano nel libretto
  update interventi_mascalcia set horse_id = v_horse
   where cavallo_cliente_id = v_r.id and horse_id is distinct from v_horse;
  select count(*) filter (where stato = 'fatto'), count(*) filter (where health_event_id is not null), min(data_intervento) filter (where stato = 'fatto')
    into v_lavori, v_libretto, v_dal
    from interventi_mascalcia where cavallo_cliente_id = v_r.id;

  update cavalli_proposte set stato = 'accettata', horse_id = v_horse, risposto_il = now() where id = v_p.id;
  perform set_config('equo.accetta', '', true);
  return json_build_object('ok', true, 'horse_id', v_horse, 'esito', v_come,
    'codice', (select h.codice_equo from horses h where h.id = v_horse),
    'nome', (select h.name from horses h where h.id = v_horse),
    'lavori', v_lavori, 'nel_libretto', v_libretto, 'dal', v_dal,
    'maniscalco_id', v_p.maniscalco_id, 'cliente_mascalcia_id', v_p.cliente_mascalcia_id);
end $$;
revoke all on function public.equo_accetta_proposta_interno(uuid, uuid) from public, anon, authenticated;


create or replace function public.equo_horse_stesso_nome_proposto()
returns trigger language plpgsql security definer set search_path = public as $$
declare p record; r json;
begin
  if coalesce(current_setting('equo.accetta', true), '') = 'on' or new.owner_id is null then return null; end if;
  select pr.id, pr.maniscalco_id, pr.cliente_mascalcia_id into p
    from cavalli_proposte pr join cavalli_clienti_mascalcia cv on cv.id = pr.riga_id
   where pr.owner_id = new.owner_id and pr.stato = 'in_attesa' and equo_norm_nome(cv.nome) = equo_norm_nome(new.name)
   order by pr.created_at limit 1;
  if p.id is null then return null; end if;
  r := equo_accetta_proposta_interno(p.id, new.owner_id);
  if (r->>'ok')::boolean then
    perform equo_msg_cavalli_accettati(p.maniscalco_id, p.cliente_mascalcia_id, array[r->>'nome'], (r->>'lavori')::int, (r->>'nel_libretto')::int, (r->>'dal')::date);
  end if;
  return null;
end $$;
drop trigger if exists trg_horses_stesso_nome_proposto on public.horses;
create trigger trg_horses_stesso_nome_proposto after insert on public.horses
  for each row execute function public.equo_horse_stesso_nome_proposto();

-- ===== 3) cavalli simili all'inserimento (lato maniscalco) =====
create or replace function public.equo_cavalli_simili(p_nome text, p_microchip text default null)
returns json language sql stable security definer set search_path = public as $$
  with io as (select auth.uid() as uid),
  mie as (
    select cv.id, cv.nome, c.nome as cliente, c.id as cliente_id, cv.codice_equo as codice,
           (cv.archiviato_il is not null or c.archiviato_il is not null) as archiviato,
           case when nullif(trim(coalesce(p_microchip, '')), '') is not null and upper(trim(cv.microchip)) = upper(trim(p_microchip)) then 'microchip' else 'nome' end as motivo,
           'mio' as tipo
      from cavalli_clienti_mascalcia cv join clienti_mascalcia c on c.id = cv.cliente_mascalcia_id, io
     where cv.maniscalco_id = io.uid
       and ((nullif(equo_norm_nome(p_nome), '') is not null and equo_norm_nome(cv.nome) = equo_norm_nome(p_nome))
            or (nullif(trim(coalesce(p_microchip, '')), '') is not null and upper(trim(cv.microchip)) = upper(trim(p_microchip))))
  ),
  dei_clienti as (
    select null::uuid as id, h.name as nome, c.nome as cliente, c.id as cliente_id, h.codice_equo as codice, false as archiviato,
           case when nullif(trim(coalesce(p_microchip, '')), '') is not null and upper(trim(h.microchip)) = upper(trim(p_microchip)) then 'microchip' else 'nome' end as motivo,
           'proprietario' as tipo
      from clienti_mascalcia c join horses h on h.owner_id = c.cliente_user_id and coalesce(h.condiviso_ecosistema, true), io
     where c.maniscalco_id = io.uid and c.archiviato_il is null
       and ((nullif(equo_norm_nome(p_nome), '') is not null and equo_norm_nome(h.name) = equo_norm_nome(p_nome))
            or (nullif(trim(coalesce(p_microchip, '')), '') is not null and upper(trim(h.microchip)) = upper(trim(p_microchip))))
       and not exists (select 1 from cavalli_clienti_mascalcia x where x.maniscalco_id = io.uid and x.horse_id = h.id)
  )
  select coalesce(json_agg(row_to_json(t) order by t.motivo = 'microchip' desc, t.archiviato, t.tipo), '[]'::json)
    from (select * from mie union all select * from dei_clienti limit 6) t
   where nullif(trim(coalesce(p_nome, '')), '') is not null or nullif(trim(coalesce(p_microchip, '')), '') is not null
$$;
revoke all on function public.equo_cavalli_simili(text, text) from public, anon;
grant execute on function public.equo_cavalli_simili(text, text) to authenticated;

-- ===== 4) stato del collegamento nella scheda cliente =====
alter table public.cavalli_proposte add column if not exists sollecitata_il timestamptz;

create or replace function public.equo_stato_onboarding_cliente(p_cliente uuid)
returns json language plpgsql stable security definer set search_path = public as $$
declare c clienti_mascalcia; v_conf json; v_da_me int := 0;
begin
  select * into c from clienti_mascalcia where id = p_cliente and maniscalco_id = auth.uid();
  if c.id is null then return json_build_object('ok', false); end if;
  begin
    v_conf := equo_cavalli_da_confermare();
    select count(*) into v_da_me from json_array_elements(v_conf) e
     where (e->>'horse_id')::uuid in (select horse_id from cavalli_clienti_mascalcia where cliente_mascalcia_id = c.id and horse_id is not null);
  exception when others then v_da_me := 0;
  end;
  return json_build_object('ok', true,
    'collegato', c.cliente_user_id is not null,
    'email', c.email,
    'proposte_attesa', (select coalesce(json_agg(cv.nome order by cv.nome), '[]'::json) from cavalli_proposte p join cavalli_clienti_mascalcia cv on cv.id = p.riga_id where p.cliente_mascalcia_id = c.id and p.stato = 'in_attesa'),
    'cavalli', (select count(*) from cavalli_clienti_mascalcia where cliente_mascalcia_id = c.id and archiviato_il is null),
    'collegati', (select count(*) from cavalli_clienti_mascalcia where cliente_mascalcia_id = c.id and archiviato_il is null and horse_id is not null),
    'definitivi', (select count(*) from cavalli_clienti_mascalcia cv join horses h on h.id = cv.horse_id where cv.cliente_mascalcia_id = c.id and cv.archiviato_il is null and h.codice_livello in ('validato', 'certificato')),
    'da_confermare_io', v_da_me);
end $$;
revoke all on function public.equo_stato_onboarding_cliente(uuid) from public, anon;
grant execute on function public.equo_stato_onboarding_cliente(uuid) to authenticated;

-- testo del promemoria al proprietario (cavalli proposti non ancora accettati)
create or replace function public.equo_testo_sollecito_proposte(p_cliente uuid)
returns text language sql stable security definer set search_path = public as $$
  select '📘 Equo: ' || equo_nome_profilo(c.maniscalco_id) || ' ti ha preparato '
         || (select string_agg(cv.nome, ', ' order by cv.nome) from cavalli_proposte p join cavalli_clienti_mascalcia cv on cv.id = p.riga_id
              where p.cliente_mascalcia_id = c.id and p.stato = 'in_attesa')
         || ' su Equo. Apri la Home e tocca «Accetta tutti»: entrano nel tuo account con i lavori già fatti nel libretto.'
    from clienti_mascalcia c where c.id = p_cliente
$$;
revoke all on function public.equo_testo_sollecito_proposte(uuid) from public, anon, authenticated;

create or replace function public.equo_sollecita_onboarding(p_cliente uuid)
returns json language plpgsql security definer set search_path = public as $$
declare c clienti_mascalcia; v_testo text;
begin
  select * into c from clienti_mascalcia where id = p_cliente and maniscalco_id = auth.uid();
  if c.id is null then return json_build_object('ok', false, 'motivo', 'non_trovato'); end if;
  if c.cliente_user_id is null then return json_build_object('ok', false, 'motivo', 'non_collegato'); end if;
  if not exists (select 1 from cavalli_proposte where cliente_mascalcia_id = c.id and stato = 'in_attesa') then
    return json_build_object('ok', true, 'niente', true);
  end if;
  v_testo := equo_testo_sollecito_proposte(c.id);
  insert into messaggi_mascalcia (maniscalco_id, cliente_mascalcia_id, mittente_tipo, mittente_user_id, tipo, testo, letto)
  values (c.maniscalco_id, c.id, 'maniscalco', c.maniscalco_id, 'testo', v_testo, false);
  update cavalli_proposte set sollecitata_il = now() where cliente_mascalcia_id = c.id and stato = 'in_attesa';
  return json_build_object('ok', true);
end $$;
revoke all on function public.equo_sollecita_onboarding(uuid) from public, anon;
grant execute on function public.equo_sollecita_onboarding(uuid) to authenticated;

-- ===== 5) ogni mattina: promemoria automatici =====
create or replace function public.equo_solleciti_onboarding()
returns json language plpgsql security definer set search_path = public as $$
declare g record; v_p int := 0; v_h int := 0; v_d int := 0; v_lista text;
begin
  -- a) al proprietario: cavalli proposti da più di 24 ore, una sola volta
  for g in select distinct p.cliente_mascalcia_id, p.maniscalco_id from cavalli_proposte p
            where p.stato = 'in_attesa' and p.sollecitata_il is null and p.created_at < now() - interval '24 hours' loop
    perform set_config('equo.collegamento', 'on', true);
    insert into messaggi_mascalcia (maniscalco_id, cliente_mascalcia_id, mittente_tipo, mittente_user_id, tipo, testo, letto)
    values (g.maniscalco_id, g.cliente_mascalcia_id, 'maniscalco', g.maniscalco_id, 'testo', equo_testo_sollecito_proposte(g.cliente_mascalcia_id), false);
    perform set_config('equo.collegamento', '', true);
    update cavalli_proposte set sollecitata_il = now() where cliente_mascalcia_id = g.cliente_mascalcia_id and stato = 'in_attesa';
    v_p := v_p + 1;
  end loop;
  -- b) al maniscalco (Hammer): proposte ferme da più di 3 giorni, una volta per cliente
  for g in select p.cliente_mascalcia_id, p.maniscalco_id, c.nome as cliente, string_agg(cv.nome, ', ' order by cv.nome) as cavalli
             from cavalli_proposte p join clienti_mascalcia c on c.id = p.cliente_mascalcia_id join cavalli_clienti_mascalcia cv on cv.id = p.riga_id
            where p.stato = 'in_attesa' and p.created_at < now() - interval '3 days'
            group by 1, 2, 3 loop
    insert into promemoria_personali (user_id, vista, testo, quando, cliente_mascalcia_id, azione, stato, creato_da, fonte)
    values (g.maniscalco_id, 'professionista',
            left(g.cliente || ' si è collegato su Equo ma non ha ancora accettato ' || g.cavalli || '. Tocca «Scrivi al cliente» per ricordarglielo: con «Accetta tutti» entrano con i lavori già fatti.', 300),
            now(), g.cliente_mascalcia_id, 'chat', 'attivo', 'hammer', 'onb:' || g.cliente_mascalcia_id)
    on conflict (user_id, fonte) do nothing;
    if found then v_h := v_h + 1; end if;
  end loop;
  -- c) al maniscalco (Hammer): possibili doppioni tra clienti diversi, al massimo una volta a settimana
  for g in select a.maniscalco_id, count(*) as n,
                  string_agg(a.nome || ' («' || ca.nome || '» e «' || cb.nome || '»)', '; ' order by a.nome) as elenco
             from cavalli_clienti_mascalcia a
             join cavalli_clienti_mascalcia b on b.maniscalco_id = a.maniscalco_id and a.id < b.id and a.cliente_mascalcia_id <> b.cliente_mascalcia_id
                  and equo_norm_nome(a.nome) = equo_norm_nome(b.nome)
             join clienti_mascalcia ca on ca.id = a.cliente_mascalcia_id
             join clienti_mascalcia cb on cb.id = b.cliente_mascalcia_id
            where a.archiviato_il is null and b.archiviato_il is null and ca.archiviato_il is null and cb.archiviato_il is null
              and (a.horse_id is null or b.horse_id is null or a.horse_id = b.horse_id)
              and (a.scuderia_cavallo_id is null or b.scuderia_cavallo_id is null or a.scuderia_cavallo_id = b.scuderia_cavallo_id)
              -- indizi che sia davvero lo stesso cavallo: privato + scuderia (caso Riccardo), stesso nome cliente o stesso microchip
              and (ca.tipo_cliente <> cb.tipo_cliente or equo_norm_nome(ca.nome) = equo_norm_nome(cb.nome)
                   or (equo_chip(a.microchip) is not null and equo_chip(a.microchip) = equo_chip(b.microchip)))
              -- nomi generici (mantello, «puledro»…) non contano
              and equo_norm_nome(a.nome) not in ('puledro','puledra','paint','baio','baia','grigio','grigia','sauro','saura','morello','morella','pony','cavallo','nuovo','senza nome')
            group by a.maniscalco_id loop
    v_lista := left(g.elenco, 170);
    insert into promemoria_personali (user_id, vista, testo, quando, azione, stato, creato_da, fonte)
    values (g.maniscalco_id, 'professionista',
            left('Possibili cavalli doppi in due clienti (' || g.n || '): ' || v_lista || case when length(g.elenco) > 170 then '…' else '' end
                 || '. Se è lo stesso cavallo, dalla scuderia usa «Proprietari dei cavalli» oppure archivia la scheda in più.', 300),
            now(), null, 'attivo', 'hammer', 'dup:' || to_char(current_date, 'IYYY-IW'))
    on conflict (user_id, fonte) do nothing;
    if found then v_d := v_d + 1; end if;
  end loop;
  return json_build_object('proprietari', v_p, 'hammer_proposte', v_h, 'hammer_doppioni', v_d);
end $$;
revoke all on function public.equo_solleciti_onboarding() from public, anon, authenticated;

do $$ begin
  if exists (select 1 from cron.job where jobname = 'equo-solleciti-onboarding') then perform cron.unschedule('equo-solleciti-onboarding'); end if;
  perform cron.schedule('equo-solleciti-onboarding', '40 7 * * *', 'select public.equo_solleciti_onboarding()');
end $$;

-- ===== 6) unioni di schede: anche i dettagli del ferro correttivo =====
do $$
declare v_def text;
begin
  v_def := pg_get_functiondef('public.equo_cavalli_clienti_unisci_manuali'::regproc);
  if position('ferro_dettagli' in v_def) = 0 then
    execute replace(v_def, 'ferro_numero     = coalesce(ferro_numero, d.ferro_numero),',
      'ferro_numero     = coalesce(ferro_numero, d.ferro_numero),
      ferro_dettagli   = coalesce(ferro_dettagli, d.ferro_dettagli),
      ferro_dettagli_post = coalesce(ferro_dettagli_post, d.ferro_dettagli_post),');
  end if;
  v_def := pg_get_functiondef('public.equo_unisci_cavalli_cliente'::regproc);
  if position('ferro_dettagli' in v_def) = 0 then
    execute replace(v_def, 'ferro_numero     = coalesce(ferro_numero, d.ferro_numero),',
      'ferro_numero     = coalesce(ferro_numero, d.ferro_numero),
    ferro_dettagli   = coalesce(ferro_dettagli, d.ferro_dettagli),
    ferro_dettagli_post = coalesce(ferro_dettagli_post, d.ferro_dettagli_post),');
  end if;
  v_def := pg_get_functiondef('public.equo_unisci_righe_maniscalco'::regproc);
  if position('ferro_dettagli' in v_def) = 0 then
    execute replace(v_def, 'ferro_numero = coalesce(ferro_numero, d.ferro_numero)',
      'ferro_numero = coalesce(ferro_numero, d.ferro_numero), ferro_dettagli = coalesce(ferro_dettagli, d.ferro_dettagli), ferro_dettagli_post = coalesce(ferro_dettagli_post, d.ferro_dettagli_post)');
  end if;
end $$;

-- ===== 7) guide degli agenti =====
insert into public.ai_conoscenze (ambito, categoria, attivo, titolo, contenuto, aggiornato_il, verificato_il)
select 'maniscalco', 'guida', true, 'Collegare un cliente a Equo senza doppioni',
'Dove: Clienti → nuovo cliente o scheda cliente
Passi:
1. Nel nuovo cliente scrivi anche la sua email: quando si iscrive a Equo con quella email trova subito «ti segue già» e si collega con un tocco, anche senza QR.
2. Il tipo si propone da solo dal nome: «Scuderia…», «Centro…», «Maneggio…», «ASD…» diventano scuderia; nome e cognome restano proprietario.
3. Quando aggiungi un cavallo, se ne hai già uno con lo stesso nome o microchip (anche in un altro cliente o archiviato) Equo ti chiede se è lo stesso: «No, è un altro» lo crea, «Apri quello» ti porta alla scheda esistente.
4. Aggiungendo un cavallo a una scuderia scegli «Di chi è»: se è di un tuo cliente privato la scheda va a lui (lavori e conti a chi paga) e il cavallo risulta in quella scuderia.
5. In «Aggiungi cavallo» puoi inquadrare la Equo Card del proprietario: il codice si compila da solo.
6. Nella scheda cliente vedi il percorso: invitato → collegato → cavalli accettati → codici definitivi, con il tasto per il passo che manca («Condividi l''invito», «Ricordaglielo», «Conferma i dati»).
Esempio: Francesco crea «Sara Matteucci» con la sua email e i cavalli Klaus e Hermes; Sara si iscrive, vede «Francesco ti segue già», si collega e accetta tutti e due con i lavori nel libretto.
Note: Ogni mattina Equo ricorda al cliente i cavalli proposti non accettati (dopo 24 ore) e Hammer ti avvisa se dopo 3 giorni sono ancora fermi; una volta a settimana Hammer segnala i possibili cavalli doppi tra due clienti.
Parole chiave: collegare cliente, invito, email cliente, doppione, cavallo doppio, stesso cavallo, di chi è, equo card, stato collegamento, ricordaglielo',
now(), current_date
where not exists (select 1 from public.ai_conoscenze where titolo = 'Collegare un cliente a Equo senza doppioni');

insert into public.ai_conoscenze (ambito, categoria, attivo, titolo, contenuto, aggiornato_il, verificato_il)
select 'proprietario', 'guida', true, 'Il mio maniscalco mi segue già: collegarmi senza codice',
'Dove: Home → riquadro «<maniscalco> ti segue già»
Passi:
1. Se il tuo maniscalco ha registrato la tua email, appena entri in Equo con quella email vedi «Francesco Bizzarri ti segue già con Klaus e Hermes».
2. Tocca «Collegati»: niente codice o QR, siete collegati e in chat arriva il tuo saluto.
3. Subito dopo trovi i cavalli che ha preparato per te: tocca «Accetta tutti» e entrano con i lavori già fatti nel libretto.
4. Se crei a mano un cavallo con lo stesso nome di uno che il maniscalco ti ha preparato, Equo lo collega da solo alla sua scheda: niente doppioni.
Esempio: Sara si iscrive con la sua email, vede Francesco, tocca «Collegati» e poi «Accetta tutti».
Note: Se non vedi il riquadro chiedi al maniscalco il QR o il codice invito. Se la data di nascita del cavallo è oggi o nel futuro Equo ti chiede di controllarla.
Parole chiave: collegarmi al maniscalco, ti segue già, senza codice, email, accetta tutti, cavallo doppio',
now(), current_date
where not exists (select 1 from public.ai_conoscenze where titolo = 'Il mio maniscalco mi segue già: collegarmi senza codice');

-- controllo finale: deve dare 1 · 7 · 1 · 1 · 3 · 2
select (select count(*) from information_schema.columns where table_schema = 'public' and table_name = 'clienti_mascalcia' and column_name = 'email') as email,
       (select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public'
         and p.proname in ('equo_professionisti_che_mi_seguono','equo_collegati_da_contatto','equo_horse_stesso_nome_proposto','equo_cavalli_simili',
                           'equo_stato_onboarding_cliente','equo_sollecita_onboarding','equo_solleciti_onboarding')) as funzioni,
       (select count(*) from pg_trigger where tgname = 'trg_horses_stesso_nome_proposto') as trigger_nome,
       (select count(*) from cron.job where jobname = 'equo-solleciti-onboarding') as cron,
       (select count(*) from pg_proc where proname in ('equo_cavalli_clienti_unisci_manuali','equo_unisci_cavalli_cliente','equo_unisci_righe_maniscalco')
         and pg_get_functiondef(oid) like '%ferro_dettagli%') as unioni_correttivo,
       (select count(*) from ai_conoscenze where titolo in ('Collegare un cliente a Equo senza doppioni','Il mio maniscalco mi segue già: collegarmi senza codice')) as guide;
