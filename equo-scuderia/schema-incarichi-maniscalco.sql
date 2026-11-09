-- Equo Scuderia · SQL 50 · Incarichi del maniscalco per cavallo (9/11/2026)
-- La scuderia assegna, cambia e revoca il maniscalco di ogni cavallo, anche su più cavalli insieme.
-- Regole decise da Simone:
--   · decide la scuderia (admin o livello 2-3); se il cavallo ha un proprietario con l'app, lui deve confermare
--     (la revoca non chiede conferma: il proprietario riceve solo l'avviso);
--   · per cavallo: 1 maniscalco TITOLARE + al massimo 1 SOSTITUTO con data di fine (poi torna il titolare da solo);
--   · il cambio vale subito o da una data scelta (scatta da solo quel giorno);
--   · gli appuntamenti già fissati dal maniscalco revocato restano: li annulla o li conferma lui (riceve l'avviso).
-- Storico: un incarico non si cancella mai, si chiude (data, chi, motivo). I lavori restano del maniscalco che li ha fatti;
-- crediti e pagamenti non si toccano. Il maniscalco revocato tiene il suo storico ma il cavallo esce dal suo elenco attivo.
-- Un cavallo che esce dal centro chiude i suoi incarichi qui, ma resta al maniscalco (lo segue dove va).

-- 1 · tabella: ruolo, date, chiusura -----------------------------------------------------------------
alter table scuderia_cavalli_professionisti add column if not exists ruolo text not null default 'titolare';
alter table scuderia_cavalli_professionisti add column if not exists dal date not null default current_date;
alter table scuderia_cavalli_professionisti add column if not exists al date;
alter table scuderia_cavalli_professionisti add column if not exists sostituisce_id uuid references scuderia_cavalli_professionisti(id) on delete set null;
alter table scuderia_cavalli_professionisti add column if not exists chiuso_il timestamptz;
alter table scuderia_cavalli_professionisti add column if not exists chiuso_da uuid;
alter table scuderia_cavalli_professionisti add column if not exists motivo text;

do $$ declare r record; begin
  -- via il vecchio vincolo «una riga per coppia cavallo-professionista» (con lo storico le righe sono più d'una)
  for r in select conname from pg_constraint where conrelid = 'scuderia_cavalli_professionisti'::regclass and contype in ('u', 'c') loop
    execute format('alter table scuderia_cavalli_professionisti drop constraint %I', r.conname);
  end loop;
end $$;
alter table scuderia_cavalli_professionisti add constraint scp_stato_check check (stato in ('attivo', 'da_confermare_proprietario', 'programmato', 'rifiutato', 'chiuso'));
alter table scuderia_cavalli_professionisti add constraint scp_ruolo_check check (ruolo in ('titolare', 'sostituto'));
alter table scuderia_cavalli_professionisti add constraint scp_motivo_check check (char_length(motivo) <= 200);
alter table scuderia_cavalli_professionisti add constraint scp_date_check check (al is null or al >= dal);

-- dati di oggi: dove un cavallo ha più maniscalchi attivi, resta titolare quello collegato (o il più recente); gli altri si chiudono
with ord as (
  select a.id, row_number() over (partition by a.scuderia_cavallo_id
           order by (c.collegamento_stato = 'attivo') desc nulls last, a.proposto_il desc, a.id) as n
    from scuderia_cavalli_professionisti a join clienti_mascalcia c on c.id = a.cliente_mascalcia_id
   where a.stato = 'attivo')
update scuderia_cavalli_professionisti a set stato = 'chiuso', chiuso_il = now(), motivo = 'Riordino: un solo maniscalco titolare per cavallo'
  from ord where ord.id = a.id and ord.n > 1;
update scuderia_cavalli_professionisti set dal = coalesce(risposto_il, proposto_il)::date where dal = current_date and coalesce(risposto_il, proposto_il) < now() - interval '1 day';

create unique index if not exists scp_coppia_aperta on scuderia_cavalli_professionisti (scuderia_cavallo_id, cliente_mascalcia_id, ruolo)
  where stato in ('attivo', 'da_confermare_proprietario', 'programmato');
create unique index if not exists scp_un_titolare on scuderia_cavalli_professionisti (scuderia_cavallo_id) where ruolo = 'titolare' and stato = 'attivo';
create unique index if not exists scp_un_sostituto on scuderia_cavalli_professionisti (scuderia_cavallo_id) where ruolo = 'sostituto' and stato = 'attivo';
create index if not exists scp_cavallo_idx on scuderia_cavalli_professionisti (scuderia_cavallo_id, stato);

-- 2 · il cavallo uscito dal centro non sparisce dall'elenco del maniscalco (lo segue dove va) ------------------
do $$ declare v_def text; v_vecchio text := 'and not exists (select 1 from scuderia_cavalli_professionisti a where a.cliente_mascalcia_id = c.id and a.scuderia_cavallo_id = x.scuderia_cavallo_id and a.stato = ''attivo'');';
begin
  v_def := pg_get_functiondef('public.equo_sync_cavalli_struttura'::regproc);
  if position('uscito_il is not null' in v_def) = 0 then
    if position(v_vecchio in v_def) = 0 then raise exception 'SQL 50: equo_sync_cavalli_struttura non è come previsto, avvisa Claude.'; end if;
    execute replace(v_def, v_vecchio, 'and not exists (select 1 from scuderia_cavalli_professionisti a where a.cliente_mascalcia_id = c.id and a.scuderia_cavallo_id = x.scuderia_cavallo_id and a.stato = ''attivo'')
     and not exists (select 1 from scuderia_cavalli u where u.id = x.scuderia_cavallo_id and u.uscito_il is not null);');
  end if;
end $$;

-- 3 · il cuore: attiva, chiude, assegna -----------------------------------------------------------------
create or replace function equo_incarico_testo_ruolo(p_ruolo text, p_al date) returns text
language sql immutable as $$
  select case when p_ruolo = 'sostituto' then 'maniscalco sostituto' || coalesce(' fino al ' || to_char(p_al, 'DD/MM/YYYY'), '') else 'maniscalco' end
$$;

-- chiude un incarico (attivo, in attesa o programmato). Avvisa il maniscalco se era attivo.
create or replace function equo_incarico_chiudi(p_id uuid, p_motivo text, p_avvisa boolean default true)
returns void language plpgsql security definer set search_path = public as $$
declare a record; v_centro text; v_app int; v_testo text;
begin
  select x.*, sc.nome as cavallo, c.maniscalco_id, c.collegamento_stato into a
    from scuderia_cavalli_professionisti x join scuderia_cavalli sc on sc.id = x.scuderia_cavallo_id join clienti_mascalcia c on c.id = x.cliente_mascalcia_id
   where x.id = p_id and x.stato in ('attivo', 'da_confermare_proprietario', 'programmato');
  if a.id is null then return; end if;
  update scuderia_cavalli_professionisti set stato = 'chiuso', chiuso_il = now(), chiuso_da = auth.uid(), motivo = left(p_motivo, 200),
         al = case when a.stato = 'attivo' then least(coalesce(al, current_date), current_date) else al end
   where id = a.id;
  if a.stato = 'attivo' and p_avvisa and a.collegamento_stato = 'attivo' then
    select coalesce(nullif(trim(nome), ''), 'La scuderia') into v_centro from centri where id = a.centro_id;
    select count(*) into v_app from interventi_mascalcia i join cavalli_clienti_mascalcia cv on cv.id = i.cavallo_cliente_id
     where cv.cliente_mascalcia_id = a.cliente_mascalcia_id and cv.scuderia_cavallo_id = a.scuderia_cavallo_id
       and i.data_intervento >= current_date and i.stato in ('richiesto', 'proposto', 'programmato');
    v_testo := '🔚 ' || v_centro || ': da oggi non sei più il ' || equo_incarico_testo_ruolo(a.ruolo, null) || ' di «' || a.cavallo || '»'
      || coalesce(' (' || nullif(trim(p_motivo), '') || ')', '') || '. I lavori fatti restano nel tuo storico e i crediti aperti non cambiano.'
      || case when v_app > 0 then ' Hai ancora ' || v_app || case when v_app = 1 then ' appuntamento fissato' else ' appuntamenti fissati' end || ' per questo cavallo: decidi tu se confermarli o annullarli.' else '' end;
    perform set_config('equo.collegamento', 'on', true);
    insert into messaggi_mascalcia (maniscalco_id, cliente_mascalcia_id, mittente_tipo, mittente_user_id, tipo, testo, letto)
    values (a.maniscalco_id, a.cliente_mascalcia_id, 'cliente', auth.uid(), 'testo', v_testo, false);
    perform set_config('equo.collegamento', '', true);
  end if;
  if a.stato = 'attivo' then perform equo_sync_cavalli_struttura(a.cliente_mascalcia_id); end if;
end $$;

-- rende attivo un incarico: il titolare (o sostituto) precedente si chiude. Avvisa il nuovo maniscalco.
create or replace function equo_incarico_attiva(p_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare a record; v_prec uuid; v_centro text; v_nuovo text;
begin
  select x.*, sc.nome as cavallo, c.maniscalco_id, c.collegamento_stato into a
    from scuderia_cavalli_professionisti x join scuderia_cavalli sc on sc.id = x.scuderia_cavallo_id join clienti_mascalcia c on c.id = x.cliente_mascalcia_id
   where x.id = p_id and x.stato in ('da_confermare_proprietario', 'programmato');
  if a.id is null then return; end if;
  -- confermato dal proprietario quando il periodo era già finito: non parte
  if a.al is not null and a.al < current_date then
    update scuderia_cavalli_professionisti set stato = 'chiuso', chiuso_il = now(), motivo = 'periodo già finito alla conferma' where id = a.id;
    return;
  end if;
  v_nuovo := equo_nome_profilo(a.maniscalco_id);
  -- lo stesso maniscalco con l'altro ruolo (es. il sostituto diventa titolare): quell'incarico si chiude senza avvisi
  select id into v_prec from scuderia_cavalli_professionisti
   where scuderia_cavallo_id = a.scuderia_cavallo_id and cliente_mascalcia_id = a.cliente_mascalcia_id and stato = 'attivo' and id <> a.id;
  if v_prec is not null then
    update scuderia_cavalli_professionisti set stato = 'chiuso', chiuso_il = now(), chiuso_da = auth.uid(), motivo = 'Cambio di ruolo', al = current_date where id = v_prec;
  end if;
  -- chi aveva lo stesso ruolo sul cavallo
  for v_prec in select id from scuderia_cavalli_professionisti
                 where scuderia_cavallo_id = a.scuderia_cavallo_id and ruolo = a.ruolo and stato = 'attivo' and id <> a.id loop
    perform equo_incarico_chiudi(v_prec, 'sostituito da ' || coalesce(v_nuovo, 'un altro maniscalco'), true);
  end loop;
  update scuderia_cavalli_professionisti set stato = 'attivo', dal = greatest(dal, current_date) where id = a.id;
  if a.collegamento_stato = 'attivo' then
    select coalesce(nullif(trim(nome), ''), 'La scuderia') into v_centro from centri where id = a.centro_id;
    perform set_config('equo.collegamento', 'on', true);
    insert into messaggi_mascalcia (maniscalco_id, cliente_mascalcia_id, mittente_tipo, mittente_user_id, tipo, testo, letto)
    values (a.maniscalco_id, a.cliente_mascalcia_id, 'cliente', auth.uid(), 'testo',
      '🐴 ' || v_centro || ' ti affida «' || a.cavallo || '» come ' || equo_incarico_testo_ruolo(a.ruolo, a.al) || '. Lo trovi tra i cavalli della struttura.', false);
    perform set_config('equo.collegamento', '', true);
  end if;
  perform equo_sync_cavalli_struttura(a.cliente_mascalcia_id);
end $$;

-- assegna un maniscalco a un cavallo. Esito: attivo · programmato · da_confermare · gia · errore
create or replace function equo_incarico_assegna(p_cav uuid, p_cliente uuid, p_ruolo text, p_dal date, p_al date)
returns text language plpgsql security definer set search_path = public as $$
declare sc record; c record; v_own uuid; v_id uuid; v_membro uuid; v_dal date := greatest(coalesce(p_dal, current_date), current_date);
        v_tit text; v_centro text; v_pro text;
begin
  select * into sc from scuderia_cavalli where id = p_cav and uscito_il is null;
  select * into c from clienti_mascalcia where id = p_cliente and centro_id = sc.centro_id;
  if sc.id is null or c.id is null then return 'errore'; end if;
  if p_ruolo not in ('titolare', 'sostituto') then return 'errore'; end if;
  if p_ruolo = 'sostituto' and p_al is null then return 'errore'; end if;
  if p_al is not null and p_al < v_dal then return 'errore'; end if;
  -- già lo stesso incarico aperto
  if exists (select 1 from scuderia_cavalli_professionisti where scuderia_cavallo_id = p_cav and cliente_mascalcia_id = p_cliente
              and ruolo = p_ruolo and stato = 'attivo') then
    update scuderia_cavalli_professionisti set al = p_al where scuderia_cavallo_id = p_cav and cliente_mascalcia_id = p_cliente and ruolo = p_ruolo and stato = 'attivo';
    return 'gia';
  end if;
  -- una richiesta in attesa o programmata per la stessa coppia viene sostituita da questa
  for v_id in select id from scuderia_cavalli_professionisti where scuderia_cavallo_id = p_cav and cliente_mascalcia_id = p_cliente
               and stato in ('da_confermare_proprietario', 'programmato') loop
    perform equo_incarico_chiudi(v_id, 'sostituita da una nuova richiesta', false);
  end loop;
  -- e anche le altre richieste aperte per lo stesso ruolo sul cavallo (vale l'ultima decisione)
  for v_id in select id from scuderia_cavalli_professionisti where scuderia_cavallo_id = p_cav and ruolo = p_ruolo
               and stato in ('da_confermare_proprietario', 'programmato') loop
    perform equo_incarico_chiudi(v_id, 'sostituita da una nuova richiesta', false);
  end loop;
  v_own := equo_proprietario_scheda(p_cav);
  insert into scuderia_cavalli_professionisti (centro_id, scuderia_cavallo_id, cliente_mascalcia_id, stato, ruolo, dal, al, proposto_da, proposto_il,
         sostituisce_id)
  values (sc.centro_id, p_cav, p_cliente,
          case when v_own is not null and v_own is distinct from auth.uid() then 'da_confermare_proprietario' else 'programmato' end,
          p_ruolo, v_dal, p_al, auth.uid(), now(),
          (select id from scuderia_cavalli_professionisti where scuderia_cavallo_id = p_cav and ruolo = p_ruolo and stato = 'attivo' limit 1))
  returning id into v_id;
  -- il proprietario con l'app conferma: messaggio nella chat con la scuderia
  if v_own is not null and v_own is distinct from auth.uid() then
    select m.id into v_membro from scuderia_membri m where m.centro_id = sc.centro_id and m.user_id = v_own limit 1;
    if v_membro is not null then
      select coalesce(nullif(trim(nome), ''), 'La scuderia') into v_centro from centri where id = sc.centro_id;
      v_pro := equo_nome_profilo(c.maniscalco_id);
      select equo_nome_profilo(cc.maniscalco_id) into v_tit from scuderia_cavalli_professionisti x join clienti_mascalcia cc on cc.id = x.cliente_mascalcia_id
       where x.scuderia_cavallo_id = p_cav and x.ruolo = p_ruolo and x.stato = 'attivo' limit 1;
      insert into chat_messaggi (centro_id, membro_id, mittente_user_id, tipo, testo, letto)
      values (sc.centro_id, v_membro, auth.uid(), 'testo',
        '🐴 ' || v_centro || ' propone ' || v_pro || ' come ' || equo_incarico_testo_ruolo(p_ruolo, p_al) || ' di ' || sc.nome
        || coalesce(' al posto di ' || v_tit, '') || case when v_dal > current_date then ' dal ' || to_char(v_dal, 'DD/MM/YYYY') else '' end
        || '. Conferma o rifiuta dalla Home di Equo.', false);
    end if;
    return 'da_confermare';
  end if;
  if v_dal <= current_date then perform equo_incarico_attiva(v_id); return 'attivo'; end if;
  return 'programmato';
end $$;

-- ogni mattina: incarichi programmati che partono, sostituti e incarichi a termine che finiscono
create or replace function equo_incarichi_scadenze() returns json
language plpgsql security definer set search_path = public as $$
declare r record; n_on int := 0; n_off int := 0;
begin
  for r in select id from scuderia_cavalli_professionisti where stato = 'programmato' and dal <= current_date order by ruolo, dal loop
    perform equo_incarico_attiva(r.id); n_on := n_on + 1;
  end loop;
  for r in select id, ruolo from scuderia_cavalli_professionisti where stato = 'attivo' and al is not null and al < current_date loop
    perform equo_incarico_chiudi(r.id, case when r.ruolo = 'sostituto' then 'fine della sostituzione' else 'fine dell''incarico' end, true);
    n_off := n_off + 1;
  end loop;
  return json_build_object('attivati', n_on, 'chiusi', n_off);
end $$;

revoke all on function equo_incarico_chiudi(uuid, text, boolean) from public, anon, authenticated;
revoke all on function equo_incarico_attiva(uuid) from public, anon, authenticated;
revoke all on function equo_incarico_assegna(uuid, uuid, text, date, date) from public, anon, authenticated;
revoke all on function equo_incarichi_scadenze() from public, anon, authenticated;

select cron.unschedule('equo-incarichi-scadenze') where exists (select 1 from cron.job where jobname = 'equo-incarichi-scadenze');
select cron.schedule('equo-incarichi-scadenze', '5 5 * * *', 'select public.equo_incarichi_scadenze()');

-- il cavallo esce dal centro: incarichi chiusi qui (senza avvisi: lo spostamento avvisa già); resta al maniscalco
create or replace function equo_incarichi_uscita() returns trigger
language plpgsql security definer set search_path = public as $$
declare r record;
begin
  if new.uscito_il is not null and old.uscito_il is null then
    for r in select id from scuderia_cavalli_professionisti where scuderia_cavallo_id = new.id and stato in ('attivo', 'da_confermare_proprietario', 'programmato') loop
      perform equo_incarico_chiudi(r.id, 'uscito dal centro', false);
    end loop;
  end if;
  return null;
end $$;
drop trigger if exists trg_incarichi_uscita on scuderia_cavalli;
create trigger trg_incarichi_uscita after update of uscito_il on scuderia_cavalli for each row execute function equo_incarichi_uscita();

-- 4 · funzioni per il gestionale -----------------------------------------------------------------------
-- elenco cavallo → maniscalco, con i professionisti del centro
create or replace function scuderia_incarichi(p_centro uuid) returns json
language plpgsql stable security definer set search_path = public as $$
begin
  if not is_member_of_centro(p_centro) then return json_build_object('errore', 'Non autorizzato'); end if;
  return json_build_object(
    'puo', can_collegare_professionisti(p_centro),
    'pro', coalesce((select json_agg(json_build_object('cliente_id', c.id, 'nome', coalesce(equo_nome_profilo(c.maniscalco_id), c.nome), 'stato', c.collegamento_stato,
              'professione', coalesce(nullif(c.professione, ''), 'maniscalco')) order by equo_nome_profilo(c.maniscalco_id))
       from clienti_mascalcia c where c.centro_id = p_centro and c.collegamento_stato in ('attivo', 'da_confermare_pro', 'da_confermare_struttura')), '[]'::json),
    'cavalli', coalesce((select json_agg(json_build_object('id', sc.id, 'nome', sc.nome, 'foto_url', sc.foto_url, 'proprietario', sc.proprietario,
              'tipo', sc.tipo_proprieta, 'chiede_conferma', coalesce(equo_proprietario_scheda(sc.id) is distinct from auth.uid() and equo_proprietario_scheda(sc.id) is not null, false),
              'incarichi', coalesce((select json_agg(json_build_object('id', a.id, 'cliente_id', a.cliente_mascalcia_id, 'nome', coalesce(equo_nome_profilo(c.maniscalco_id), c.nome),
                    'ruolo', a.ruolo, 'stato', a.stato, 'dal', a.dal, 'al', a.al, 'collegato', c.collegamento_stato = 'attivo') order by a.ruolo, a.stato)
                 from scuderia_cavalli_professionisti a join clienti_mascalcia c on c.id = a.cliente_mascalcia_id
                where a.scuderia_cavallo_id = sc.id and a.stato in ('attivo', 'da_confermare_proprietario', 'programmato')), '[]'::json),
              'ultimo_rifiuto', (select json_build_object('nome', equo_nome_profilo(c.maniscalco_id), 'il', a.risposto_il)
                 from scuderia_cavalli_professionisti a join clienti_mascalcia c on c.id = a.cliente_mascalcia_id
                where a.scuderia_cavallo_id = sc.id and a.stato = 'rifiutato' and a.risposto_il > now() - interval '30 days' order by a.risposto_il desc limit 1))
            order by lower(sc.nome))
       from scuderia_cavalli sc where sc.centro_id = p_centro and sc.uscito_il is null), '[]'::json));
end $$;
revoke all on function scuderia_incarichi(uuid) from public, anon;
grant execute on function scuderia_incarichi(uuid) to authenticated;

-- storico degli incarichi di un cavallo (anche chiusi e rifiutati)
create or replace function scuderia_incarichi_storico(p_cav uuid) returns json
language plpgsql stable security definer set search_path = public as $$
declare v_centro uuid;
begin
  select centro_id into v_centro from scuderia_cavalli where id = p_cav;
  if v_centro is null or not is_member_of_centro(v_centro) then return '[]'::json; end if;
  return coalesce((select json_agg(json_build_object('id', a.id, 'nome', coalesce(equo_nome_profilo(c.maniscalco_id), c.nome), 'ruolo', a.ruolo, 'stato', a.stato,
          'dal', a.dal, 'al', a.al, 'chiuso_il', a.chiuso_il, 'motivo', a.motivo, 'proposto_il', a.proposto_il, 'risposto_il', a.risposto_il,
          'da', equo_nome_profilo(coalesce(a.chiuso_da, a.proposto_da))) order by coalesce(a.chiuso_il, a.risposto_il, a.proposto_il) desc)
     from scuderia_cavalli_professionisti a join clienti_mascalcia c on c.id = a.cliente_mascalcia_id where a.scuderia_cavallo_id = p_cav), '[]'::json);
end $$;
revoke all on function scuderia_incarichi_storico(uuid) from public, anon;
grant execute on function scuderia_incarichi_storico(uuid) to authenticated;

-- azioni, anche su più cavalli: assegna (titolare) · sostituto · revoca · annulla (una richiesta in attesa)
create or replace function scuderia_incarico_azione(p_centro uuid, p_azione text, p_cavalli uuid[], p_cliente uuid default null,
  p_dal date default null, p_al date default null, p_motivo text default null, p_incarico uuid default null)
returns json language plpgsql security definer set search_path = public as $$
declare v_cav uuid; v_es text; r record; n jsonb := '{}'::jsonb; v_dal date := greatest(coalesce(p_dal, current_date), current_date); v_membro uuid; v_own uuid; v_centro text;
begin
  if not can_collegare_professionisti(p_centro) then
    return json_build_object('ok', false, 'errore', 'Solo l''amministratore o un membro di livello 2 o 3 può assegnare o revocare i maniscalchi.');
  end if;
  if p_azione = 'annulla' then
    select a.* into r from scuderia_cavalli_professionisti a where a.id = p_incarico and a.centro_id = p_centro and a.stato in ('da_confermare_proprietario', 'programmato');
    if r.id is null then return json_build_object('ok', false, 'errore', 'Richiesta non trovata o già decisa.'); end if;
    perform equo_incarico_chiudi(r.id, coalesce(nullif(trim(p_motivo), ''), 'annullata dalla scuderia'), false);
    return json_build_object('ok', true, 'annullati', 1);
  end if;
  if p_azione not in ('assegna', 'sostituto', 'revoca') then return json_build_object('ok', false, 'errore', 'Azione non valida.'); end if;
  if p_azione in ('assegna', 'sostituto') and not exists (select 1 from clienti_mascalcia where id = p_cliente and centro_id = p_centro) then
    return json_build_object('ok', false, 'errore', 'Scegli il maniscalco.');
  end if;
  if p_azione = 'sostituto' and (p_al is null or p_al < v_dal) then return json_build_object('ok', false, 'errore', 'Per un sostituto indica fino a quando.'); end if;
  if coalesce(array_length(p_cavalli, 1), 0) = 0 then return json_build_object('ok', false, 'errore', 'Scegli almeno un cavallo.'); end if;
  if array_length(p_cavalli, 1) > 300 then return json_build_object('ok', false, 'errore', 'Al massimo 300 cavalli alla volta.'); end if;

  foreach v_cav in array p_cavalli loop
    if not exists (select 1 from scuderia_cavalli where id = v_cav and centro_id = p_centro and uscito_il is null) then
      n := n || jsonb_build_object('saltati', coalesce((n->>'saltati')::int, 0) + 1); continue;
    end if;
    if p_azione = 'revoca' then
      v_es := null;
      for r in select a.id, a.stato from scuderia_cavalli_professionisti a where a.scuderia_cavallo_id = v_cav
                and a.stato in ('attivo', 'da_confermare_proprietario', 'programmato') and (p_cliente is null or a.cliente_mascalcia_id = p_cliente) loop
        if r.stato = 'attivo' and v_dal > current_date then
          update scuderia_cavalli_professionisti set al = v_dal - 1, motivo = left(coalesce(nullif(trim(p_motivo), ''), 'revocato dalla scuderia'), 200) where id = r.id;
          v_es := 'revoca_programmata';
        else
          perform equo_incarico_chiudi(r.id, coalesce(nullif(trim(p_motivo), ''), 'revocato dalla scuderia'), true);
          v_es := 'revocati';
        end if;
      end loop;
      v_es := coalesce(v_es, 'nessuno');
      -- avviso al proprietario con l'app (solo informazione)
      if v_es = 'revocati' then
        v_own := equo_proprietario_scheda(v_cav);
        select m.id into v_membro from scuderia_membri m where m.centro_id = p_centro and m.user_id = v_own and v_own is distinct from auth.uid() limit 1;
        if v_membro is not null then
          select coalesce(nullif(trim(nome), ''), 'La scuderia') into v_centro from centri where id = p_centro;
          insert into chat_messaggi (centro_id, membro_id, mittente_user_id, tipo, testo, letto)
          select p_centro, v_membro, auth.uid(), 'testo', 'ℹ️ ' || v_centro || ': ' || sc.nome || ' per ora non ha più il maniscalco assegnato in scuderia'
                 || coalesce(' (' || nullif(trim(p_motivo), '') || ')', '') || '.', false
            from scuderia_cavalli sc where sc.id = v_cav;
        end if;
      end if;
    else
      v_es := equo_incarico_assegna(v_cav, p_cliente, case when p_azione = 'sostituto' then 'sostituto' else 'titolare' end, v_dal, p_al);
    end if;
    n := n || jsonb_build_object(v_es, coalesce((n->>v_es)::int, 0) + 1);
  end loop;
  return (jsonb_build_object('ok', true) || n)::json;
end $$;
revoke all on function scuderia_incarico_azione(uuid, text, uuid[], uuid, date, date, text, uuid) from public, anon;
grant execute on function scuderia_incarico_azione(uuid, text, uuid[], uuid, date, date, text, uuid) to authenticated;

-- 5 · i flussi già esistenti passano dallo stesso cuore (niente più cancellazioni) -----------------------------
-- scheda del professionista / invito: i cavalli spuntati diventano suoi (titolare); quelli tolti si chiudono
create or replace function equo_abbina_cavalli_pro(p_cliente_id uuid, p_cavalli uuid[])
returns json language plpgsql security definer set search_path = public as $$
declare c record; v_cav uuid; r record; v_es text; n_att int := 0; n_conf int := 0; n_tolti int := 0;
begin
  select * into c from clienti_mascalcia where id = p_cliente_id and centro_id is not null;
  if c.id is null then return json_build_object('ok', false, 'errore', 'Collegamento non trovato.'); end if;
  p_cavalli := coalesce(p_cavalli, '{}');
  for r in select id from scuderia_cavalli_professionisti a
            where a.cliente_mascalcia_id = c.id and a.stato in ('attivo', 'da_confermare_proprietario', 'programmato') and not (a.scuderia_cavallo_id = any(p_cavalli)) loop
    perform equo_incarico_chiudi(r.id, 'tolto dalla scheda del professionista', true);
    n_tolti := n_tolti + 1;
  end loop;
  foreach v_cav in array p_cavalli loop
    continue when exists (select 1 from scuderia_cavalli_professionisti where cliente_mascalcia_id = c.id and scuderia_cavallo_id = v_cav
                            and stato in ('attivo', 'da_confermare_proprietario', 'programmato'));
    v_es := equo_incarico_assegna(v_cav, c.id, 'titolare', current_date, null);
    if v_es = 'attivo' then n_att := n_att + 1; elsif v_es = 'da_confermare' then n_conf := n_conf + 1; end if;
  end loop;
  perform equo_sync_cavalli_struttura(c.id);
  return json_build_object('ok', true, 'attivi', n_att, 'da_confermare', n_conf, 'tolti', n_tolti);
end $$;
revoke all on function equo_abbina_cavalli_pro(uuid, uuid[]) from public, anon, authenticated;

-- proposta dal maniscalco accettata (SQL 47): diventa titolare solo se il cavallo non ne ha già uno
-- (se c'è già, la scuderia decide dalla pagina Incarichi: niente sostituzioni a sorpresa)
do $$ declare v_def text; v_vecchio text := 'r := equo_abbina_cavalli_pro(c.id, coalesce(v_set, ''{}'') || v_scheda);'; begin
  v_def := pg_get_functiondef('public.scuderia_proposta_rispondi'::regproc);
  if position('equo_incarico_assegna' in v_def) = 0 then
    if position(v_vecchio in v_def) = 0 then raise exception 'SQL 50: scuderia_proposta_rispondi non è come previsto, avvisa Claude.'; end if;
    execute replace(v_def, v_vecchio, 'r := case when exists (select 1 from scuderia_cavalli_professionisti where scuderia_cavallo_id = v_scheda and ruolo = ''titolare''
          and stato in (''attivo'', ''da_confermare_proprietario'', ''programmato'')) then json_build_object(''da_confermare'', 0)
        else json_build_object(''da_confermare'', case when equo_incarico_assegna(v_scheda, c.id, ''titolare'', current_date, null) = ''da_confermare'' then 1 else 0 end) end;');
  end if;
end $$;

-- scheda del professionista: per ogni cavallo l'incarico aperto (o l'ultimo)
do $$ declare v_def text; v_vecchio text := 'left join scuderia_cavalli_professionisti a on a.scuderia_cavallo_id = sc.id and a.cliente_mascalcia_id = c.id';
begin
  v_def := pg_get_functiondef('public.scuderia_pro_scheda'::regproc);
  if position('left join lateral' in v_def) = 0 then
    if position(v_vecchio in v_def) = 0 then raise exception 'SQL 50: scuderia_pro_scheda non è come previsto, avvisa Claude.'; end if;
    v_def := replace(v_def, v_vecchio, 'left join lateral (select * from scuderia_cavalli_professionisti a0 where a0.scuderia_cavallo_id = sc.id and a0.cliente_mascalcia_id = c.id
        order by (a0.stato in (''attivo'', ''da_confermare_proprietario'', ''programmato'')) desc, a0.proposto_il desc limit 1) a on true');
    v_def := replace(v_def, '''stato'', a.stato, ''risposto_il'', a.risposto_il,', '''stato'', a.stato, ''ruolo'', a.ruolo, ''dal'', a.dal, ''al'', a.al, ''risposto_il'', a.risposto_il,');
    execute v_def;
  end if;
end $$;

-- 6 · il proprietario conferma o rifiuta (App Equo) ---------------------------------------------------------
create or replace function mie_proposte_professionisti()
returns json language sql stable security definer set search_path = public as $$
  select coalesce(json_agg(json_build_object('id', a.id, 'cavallo', sc.nome, 'horse_id', sc.horse_id,
      'scuderia', coalesce(nullif(trim(ce.nome), ''), 'La scuderia'), 'professionista', equo_nome_profilo(c.maniscalco_id),
      'professione', coalesce(nullif(c.professione, ''), 'maniscalco'), 'proposto_il', a.proposto_il,
      'ruolo', a.ruolo, 'dal', a.dal, 'al', a.al,
      'al_posto_di', (select equo_nome_profilo(cc.maniscalco_id) from scuderia_cavalli_professionisti x join clienti_mascalcia cc on cc.id = x.cliente_mascalcia_id
                       where x.scuderia_cavallo_id = a.scuderia_cavallo_id and x.ruolo = a.ruolo and x.stato = 'attivo' and x.cliente_mascalcia_id <> a.cliente_mascalcia_id limit 1))
      order by a.proposto_il desc), '[]'::json)
    from scuderia_cavalli_professionisti a
    join scuderia_cavalli sc on sc.id = a.scuderia_cavallo_id
    join clienti_mascalcia c on c.id = a.cliente_mascalcia_id
    join centri ce on ce.id = a.centro_id
   where a.stato = 'da_confermare_proprietario' and auth.uid() is not null and equo_proprietario_scheda(sc.id) = auth.uid()
$$;
revoke all on function mie_proposte_professionisti() from public, anon;
grant execute on function mie_proposte_professionisti() to authenticated, service_role;

create or replace function rispondi_proposta_professionista(p_id uuid, p_accetta boolean)
returns json language plpgsql security definer set search_path = public as $$
declare a record; v_membro uuid; v_pro text;
begin
  select x.*, sc.nome as cavallo, c.maniscalco_id into a
    from scuderia_cavalli_professionisti x join scuderia_cavalli sc on sc.id = x.scuderia_cavallo_id join clienti_mascalcia c on c.id = x.cliente_mascalcia_id
   where x.id = p_id and x.stato = 'da_confermare_proprietario';
  if a.id is null then return json_build_object('ok', false, 'errore', 'Proposta non trovata o già decisa.'); end if;
  if auth.uid() is null or equo_proprietario_scheda(a.scuderia_cavallo_id) is distinct from auth.uid() then
    return json_build_object('ok', false, 'errore', 'Solo il proprietario del cavallo può rispondere.');
  end if;
  v_pro := equo_nome_profilo(a.maniscalco_id);
  if p_accetta then
    update scuderia_cavalli_professionisti set stato = 'programmato', risposto_il = now(), risposto_da = auth.uid() where id = a.id;
    if a.dal <= current_date then perform equo_incarico_attiva(a.id); end if;
  else
    update scuderia_cavalli_professionisti set stato = 'rifiutato', risposto_il = now(), risposto_da = auth.uid(), chiuso_il = now(), motivo = 'rifiutato dal proprietario' where id = a.id;
  end if;
  select m.id into v_membro from scuderia_membri m where m.centro_id = a.centro_id and m.user_id = auth.uid() limit 1;
  if v_membro is not null then
    insert into chat_messaggi (centro_id, membro_id, mittente_user_id, tipo, testo, letto)
    values (a.centro_id, v_membro, auth.uid(), 'testo',
      case when p_accetta then '✅ Confermo ' || v_pro || ' come ' || equo_incarico_testo_ruolo(a.ruolo, a.al) || ' di ' || a.cavallo
                               || case when a.dal > current_date then ' dal ' || to_char(a.dal, 'DD/MM/YYYY') else '' end || '.'
           else '❌ Non confermo ' || v_pro || ' come ' || equo_incarico_testo_ruolo(a.ruolo, a.al) || ' di ' || a.cavallo || '.' end, false);
  end if;
  return json_build_object('ok', true);
end $$;
revoke all on function rispondi_proposta_professionista(uuid, boolean) from public, anon;
grant execute on function rispondi_proposta_professionista(uuid, boolean) to authenticated, service_role;

-- riepilogo
select (select count(*) from scuderia_cavalli_professionisti where stato = 'attivo') as incarichi_attivi,
       (select count(*) from scuderia_cavalli_professionisti where stato = 'chiuso') as chiusi_nel_riordino,
       exists (select 1 from cron.job where jobname = 'equo-incarichi-scadenze') as controllo_mattutino;
