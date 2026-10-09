-- Equo: SPOSTA CAVALLO (dove sta il cavallo: a casa / in una scuderia) · 10 ottobre 2026
-- Il cavallo è al centro: lo spostamento è UNO, vale per proprietario, maniscalchi e scuderia, e resta nello storico a vita.
-- Chi paga NON cambia: cambia solo il luogo (scelta di Simone). L'agenda del maniscalco raggruppa per luogo.

-- 1. DOVE STA ---------------------------------------------------------------
-- riga del maniscalco: ubicazione_tipo vuoto = sta dal cliente (a casa se privato, nella scuderia se il cliente è una scuderia)
alter table public.cavalli_clienti_mascalcia
  add column if not exists ubicazione_tipo text,
  add column if not exists ubicazione_cliente_id uuid references public.clienti_mascalcia(id) on delete set null,
  add column if not exists ubicazione_nome text,
  add column if not exists ubicazione_indirizzo text,
  add column if not exists ubicazione_dal date;
do $$ begin
  alter table public.cavalli_clienti_mascalcia add constraint cavalli_clienti_ubicazione_tipo_check check (ubicazione_tipo is null or ubicazione_tipo in ('casa','scuderia'));
exception when duplicate_object then null; end $$;

-- cavallo del proprietario (app Equo)
alter table public.horses
  add column if not exists ubicazione_tipo text,
  add column if not exists ubicazione_centro_id uuid references public.centri(id) on delete set null,
  add column if not exists ubicazione_nome text,
  add column if not exists ubicazione_indirizzo text,
  add column if not exists ubicazione_dal date;
do $$ begin
  alter table public.horses add constraint horses_ubicazione_tipo_check check (ubicazione_tipo is null or ubicazione_tipo in ('casa','scuderia'));
exception when duplicate_object then null; end $$;

-- ogni lavoro fatto ricorda dove è stato fatto
alter table public.interventi_mascalcia
  add column if not exists luogo_cliente_id uuid,
  add column if not exists luogo_nome text;

-- Equo Scuderia: un cavallo uscito dal centro non si cancella, resta come «uscito»
alter table public.scuderia_cavalli
  add column if not exists uscito_il timestamptz,
  add column if not exists uscito_verso text;

-- il limite di cavalli del pacchetto conta solo quelli presenti
create or replace function public.limite_cavalli()
returns trigger language plpgsql security definer set search_path = public as $$
declare n bigint;
begin
  select count(*) into n from scuderia_cavalli where centro_id = new.centro_id and uscito_il is null;
  if centro_limite_supera(new.centro_id, 'cavalli', n) then
    raise exception 'Hai raggiunto il limite di % cavalli del tuo pacchetto: passa a % per aggiungerne altri.', (centro_limiti(new.centro_id)->>'cavalli'), nome_pacchetto_superiore(new.centro_id);
  end if;
  return new;
end $$;

-- 2. RICHIESTE DI ARRIVO per le scuderie su Equo Scuderia --------------------
create table if not exists public.cavalli_arrivi (
  id uuid primary key default gen_random_uuid(),
  centro_id uuid not null references public.centri(id) on delete cascade,
  horse_id uuid references public.horses(id) on delete set null,
  cavallo_cliente_id uuid references public.cavalli_clienti_mascalcia(id) on delete set null,
  nome_cavallo text not null,
  proprietario_nome text,
  richiesto_da uuid,
  richiesto_ruolo text,
  richiesto_nome text,
  dal date not null default current_date,
  prima jsonb,
  stato text not null default 'in_attesa' check (stato in ('in_attesa','accolto','rifiutato','annullato')),
  risposto_da uuid,
  risposto_il timestamptz,
  scuderia_cavallo_id uuid,
  created_at timestamptz not null default now()
);
create index if not exists cavalli_arrivi_centro on public.cavalli_arrivi (centro_id, stato);
create index if not exists cavalli_arrivi_horse on public.cavalli_arrivi (horse_id);
alter table public.cavalli_arrivi enable row level security;
drop policy if exists cavalli_arrivi_lettura on public.cavalli_arrivi;
create policy cavalli_arrivi_lettura on public.cavalli_arrivi for select using (
  is_member_of_centro(centro_id) or richiesto_da = auth.uid()
  or exists (select 1 from horses h where h.id = cavalli_arrivi.horse_id and h.owner_id = auth.uid()));
-- scritture solo dalle funzioni qui sotto

-- 3. LUOGO DI UNA RIGA DEL MANISCALCO (testo) -------------------------------
create or replace function public.equo_luogo_riga(p_riga uuid)
returns text language sql stable security definer set search_path = public as $$
  select case cv.ubicazione_tipo
           when 'scuderia' then coalesce(cv.ubicazione_nome, u.nome, 'scuderia')
           when 'casa' then 'A casa' || coalesce(' · ' || nullif(cv.ubicazione_nome, ''), '')
           else case when c.centro_id is not null or c.tipo_cliente = 'struttura' then c.nome else 'A casa' end
         end
  from cavalli_clienti_mascalcia cv
  join clienti_mascalcia c on c.id = cv.cliente_mascalcia_id
  left join clienti_mascalcia u on u.id = cv.ubicazione_cliente_id
  where cv.id = p_riga;
$$;

-- il lavoro segnato «fatto» ricorda il luogo di quel momento
create or replace function public.interventi_luogo()
returns trigger language plpgsql security definer set search_path = public as $$
declare r record;
begin
  if new.stato = 'fatto' and new.cavallo_cliente_id is not null and new.luogo_nome is null
     and (tg_op = 'INSERT' or old.stato is distinct from 'fatto') then
    select cv.ubicazione_tipo, cv.ubicazione_cliente_id, cv.cliente_mascalcia_id into r
      from cavalli_clienti_mascalcia cv where cv.id = new.cavallo_cliente_id;
    if found then
      new.luogo_cliente_id := case r.ubicazione_tipo when 'scuderia' then r.ubicazione_cliente_id when 'casa' then null else r.cliente_mascalcia_id end;
      new.luogo_nome := equo_luogo_riga(new.cavallo_cliente_id);
    end if;
  end if;
  return new;
end $$;
drop trigger if exists trg_interventi_luogo on public.interventi_mascalcia;
create trigger trg_interventi_luogo before insert or update of stato on public.interventi_mascalcia
  for each row execute function public.interventi_luogo();

-- 4. SPOSTA IL CAVALLO -------------------------------------------------------
-- p_vista 'maniscalco' (p_id = riga cavalli_clienti_mascalcia) o 'proprietario' (p_id = horses.id)
-- p_dest 'casa' | 'scuderia' (p_cliente = una scuderia del maniscalco, oppure p_centro = scuderia su Equo Scuderia) | 'nuova' (p_nome, p_indirizzo)
create or replace function public.equo_sposta_cavallo(p_vista text, p_id uuid, p_dest text, p_cliente uuid default null, p_centro uuid default null,
  p_nome text default null, p_indirizzo text default null, p_dal date default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_me uuid := auth.uid();
  v_row cavalli_clienti_mascalcia;
  v_h horses;
  v_horse uuid;
  v_scheda uuid;
  v_nome_cav text;
  v_codice text;
  v_ruolo text;
  v_autore text;
  v_dal date := coalesce(p_dal, current_date);
  v_dest_nome text; v_dest_ind text; v_dest_centro uuid; v_dest_cli uuid;
  v_prima_nome text;
  v_prima jsonb;
  v_usciti uuid[] := '{}';
  v_prop_nome text;
  v_cli uuid;
  v_arrivo uuid;
  v_testo text;
  r record; s record; c centri;
begin
  if v_me is null then return jsonb_build_object('ok', false, 'errore', 'Accesso richiesto.'); end if;
  if p_dest not in ('casa','scuderia','nuova') then return jsonb_build_object('ok', false, 'errore', 'Destinazione non valida.'); end if;

  if p_vista = 'maniscalco' then
    select * into v_row from cavalli_clienti_mascalcia where id = p_id and maniscalco_id = v_me;
    if v_row.id is null then return jsonb_build_object('ok', false, 'errore', 'Cavallo non trovato.'); end if;
    v_horse := v_row.horse_id; v_scheda := v_row.scuderia_cavallo_id;
    if v_horse is null and v_scheda is not null then select horse_id into v_horse from scuderia_cavalli where id = v_scheda; end if;
    v_nome_cav := v_row.nome; v_codice := v_row.codice_equo; v_ruolo := 'maniscalco';
    v_prima_nome := equo_luogo_riga(v_row.id);
  elsif p_vista = 'proprietario' then
    select * into v_h from horses where id = p_id and owner_id = v_me;
    if v_h.id is null then return jsonb_build_object('ok', false, 'errore', 'Cavallo non trovato.'); end if;
    v_horse := v_h.id; v_nome_cav := v_h.name; v_codice := v_h.codice_equo; v_ruolo := 'proprietario';
    v_prima_nome := case v_h.ubicazione_tipo when 'scuderia' then v_h.ubicazione_nome when 'casa' then 'A casa' end;
  else
    return jsonb_build_object('ok', false, 'errore', 'Vista non valida.');
  end if;
  if v_horse is not null and v_h.id is null then select * into v_h from horses where id = v_horse; end if;
  if v_h.id is not null then v_prop_nome := equo_nome_profilo(v_h.owner_id); end if;
  if v_prima_nome is null and v_horse is not null then
    select equo_luogo_riga(cv.id) into v_prima_nome from cavalli_clienti_mascalcia cv where cv.horse_id = v_horse order by cv.ubicazione_dal desc nulls last limit 1;
  end if;
  v_autore := coalesce(equo_nome_profilo(v_me), case v_ruolo when 'maniscalco' then 'maniscalco' else 'proprietario' end);

  -- destinazione
  if p_dest = 'casa' then
    v_dest_nome := 'A casa'; v_dest_ind := nullif(trim(coalesce(p_indirizzo, '')), '');
  elsif p_dest = 'scuderia' and p_cliente is not null then
    if p_vista <> 'maniscalco' then return jsonb_build_object('ok', false, 'errore', 'Destinazione non valida.'); end if;
    select cm.id, cm.nome, coalesce(nullif(cm.indirizzo, ''), nullif(concat_ws(', ', ce.indirizzo, ce.citta), '')), cm.centro_id
      into v_dest_cli, v_dest_nome, v_dest_ind, v_dest_centro
      from clienti_mascalcia cm left join centri ce on ce.id = cm.centro_id
     where cm.id = p_cliente and cm.maniscalco_id = v_me and cm.archiviato_il is null;
    if v_dest_cli is null then return jsonb_build_object('ok', false, 'errore', 'Scegli una delle tue scuderie.'); end if;
  elsif p_dest = 'scuderia' and p_centro is not null then
    select * into c from centri where id = p_centro;
    if c.id is null then return jsonb_build_object('ok', false, 'errore', 'Scuderia non trovata.'); end if;
    v_dest_centro := c.id; v_dest_nome := c.nome; v_dest_ind := nullif(concat_ws(', ', nullif(c.indirizzo, ''), nullif(c.citta, '')), '');
  elsif p_dest = 'nuova' then
    v_dest_nome := nullif(trim(coalesce(p_nome, '')), ''); v_dest_ind := nullif(trim(coalesce(p_indirizzo, '')), '');
    if v_dest_nome is null then return jsonb_build_object('ok', false, 'errore', 'Scrivi il nome della scuderia.'); end if;
    if p_vista = 'maniscalco' then
      select id into v_dest_cli from clienti_mascalcia
       where maniscalco_id = v_me and archiviato_il is null and equo_norm(nome) = equo_norm(v_dest_nome) limit 1;
      if v_dest_cli is null then
        insert into clienti_mascalcia (maniscalco_id, nome, tipo_cliente, indirizzo, codice_invito, telefono, note)
        values (v_me, v_dest_nome, 'struttura', v_dest_ind, equo_nuovo_codice_invito(), '', '')
        returning id into v_dest_cli;
      end if;
    end if;
  else
    return jsonb_build_object('ok', false, 'errore', 'Scegli dove va il cavallo.');
  end if;

  -- com'era prima (serve se la scuderia risponde «Non è da noi»)
  v_prima := jsonb_build_object(
    'horse', case when v_h.id is not null then jsonb_build_object('tipo', v_h.ubicazione_tipo, 'centro', v_h.ubicazione_centro_id, 'nome', v_h.ubicazione_nome, 'indirizzo', v_h.ubicazione_indirizzo, 'dal', v_h.ubicazione_dal) end,
    'righe', (select coalesce(jsonb_agg(jsonb_build_object('id', cv.id, 'tipo', cv.ubicazione_tipo, 'cliente', cv.ubicazione_cliente_id, 'nome', cv.ubicazione_nome, 'indirizzo', cv.ubicazione_indirizzo, 'dal', cv.ubicazione_dal)), '[]'::jsonb)
                from cavalli_clienti_mascalcia cv where cv.id = v_row.id or (v_horse is not null and cv.horse_id = v_horse)),
    'luogo', v_prima_nome);

  -- a) scheda del proprietario
  if v_h.id is not null then
    update horses set ubicazione_tipo = case when p_dest = 'casa' then 'casa' else 'scuderia' end,
      ubicazione_centro_id = v_dest_centro,
      ubicazione_nome = case when p_dest = 'casa' then null else v_dest_nome end,
      ubicazione_indirizzo = v_dest_ind, ubicazione_dal = v_dal
     where id = v_h.id;
  end if;

  -- b) righe di tutti i maniscalchi che seguono il cavallo
  for r in
    select cv.*, cm.centro_id as cli_centro, cm.tipo_cliente as cli_tipo, cm.indirizzo as cli_ind
      from cavalli_clienti_mascalcia cv join clienti_mascalcia cm on cm.id = cv.cliente_mascalcia_id
     where cv.id = v_row.id or (v_horse is not null and cv.horse_id = v_horse)
  loop
    v_cli := null;
    if p_dest <> 'casa' then
      if r.maniscalco_id = v_me and v_dest_cli is not null then v_cli := v_dest_cli;
      else
        if v_dest_centro is not null then
          select id into v_cli from clienti_mascalcia where maniscalco_id = r.maniscalco_id and centro_id = v_dest_centro and archiviato_il is null limit 1;
        end if;
        if v_cli is null then
          select id into v_cli from clienti_mascalcia
           where maniscalco_id = r.maniscalco_id and archiviato_il is null and equo_norm(nome) = equo_norm(v_dest_nome)
             and (tipo_cliente = 'struttura' or centro_id is not null) limit 1;
        end if;
        if v_cli is null then
          -- la scuderia nuova entra nella cartella Scuderie del maniscalco (fuori dal limite Free: l'ha scelta il proprietario)
          insert into clienti_mascalcia (maniscalco_id, nome, tipo_cliente, indirizzo, codice_invito, telefono, note)
          values (r.maniscalco_id, v_dest_nome, 'struttura', v_dest_ind, equo_nuovo_codice_invito(), '', 'Creata da Equo: ' || v_nome_cav || ' sta qui (indicato da ' || v_autore || ')')
          returning id into v_cli;
        end if;
      end if;
    end if;
    update cavalli_clienti_mascalcia set
      ubicazione_tipo = case
        when p_dest = 'casa' then case when r.cli_centro is null and coalesce(r.cli_tipo, '') <> 'struttura'
                                         and (v_dest_ind is null or equo_norm(v_dest_ind) = equo_norm(r.cli_ind)) then null else 'casa' end
        when v_cli = r.cliente_mascalcia_id then null else 'scuderia' end,
      ubicazione_cliente_id = case when p_dest = 'casa' or v_cli = r.cliente_mascalcia_id then null else v_cli end,
      ubicazione_nome = case when p_dest = 'casa' then case when r.cli_centro is not null or coalesce(r.cli_tipo, '') = 'struttura' then v_prop_nome end else v_dest_nome end,
      ubicazione_indirizzo = case when p_dest = 'casa' then v_dest_ind end,
      ubicazione_dal = v_dal
     where id = r.id;
  end loop;

  -- c) esce dalle scuderie su Equo Scuderia dove risultava (resta nel loro storico come «uscito»)
  for s in
    select sc.id, sc.centro_id, ce.nome as centro_nome from scuderia_cavalli sc join centri ce on ce.id = sc.centro_id
     where sc.uscito_il is null and sc.centro_id is distinct from v_dest_centro
       and ((v_horse is not null and sc.horse_id = v_horse) or (v_scheda is not null and sc.id = v_scheda))
  loop
    update scuderia_cavalli set uscito_il = now(), uscito_verso = v_dest_nome where id = s.id;
    perform set_config('equo.box', 'on', true);
    update scuderia_box set cavallo_id = null where cavallo_id = s.id;
    update scuderia_box set assegnato_cavallo_id = null where assegnato_cavallo_id = s.id;
    perform set_config('equo.box', '', true);
    v_usciti := v_usciti || s.id;
    insert into cavalli_storico (codice_equo, horse_id, scuderia_cavallo_id, cavallo_cliente_id, tipo, descrizione, autore_user_id, autore_ruolo, app)
    values (v_codice, v_horse, s.id, v_row.id, 'uscita',
            'Uscito da ' || s.centro_nome || ' verso «' || v_dest_nome || '» dal ' || to_char(v_dal, 'DD/MM/YYYY') || ' (indicato da ' || v_autore || ', ' || v_ruolo || ')',
            v_me, v_ruolo, 'equo');
  end loop;
  v_prima := v_prima || jsonb_build_object('usciti', to_jsonb(v_usciti));

  -- richieste di arrivo precedenti ancora aperte: annullate
  update cavalli_arrivi set stato = 'annullato', risposto_il = now()
   where stato = 'in_attesa' and ((v_horse is not null and horse_id = v_horse) or (v_row.id is not null and cavallo_cliente_id = v_row.id));

  -- d) storico (uno solo, a vita)
  insert into cavalli_storico (codice_equo, horse_id, scuderia_cavallo_id, cavallo_cliente_id, tipo, descrizione, autore_user_id, autore_ruolo, app)
  values (v_codice, v_horse, v_scheda, v_row.id, 'spostamento',
          'Spostato' || coalesce(' da «' || v_prima_nome || '»', '') || ' a «' || v_dest_nome || '»' || coalesce(' (' || v_dest_ind || ')', '')
          || ' dal ' || to_char(v_dal, 'DD/MM/YYYY') || ' · ' || v_autore || ' (' || v_ruolo || ')',
          v_me, v_ruolo, case v_ruolo when 'maniscalco' then 'app' else 'app' end);

  -- e) scuderia su Equo Scuderia: richiesta di accoglierlo (se non c'è già)
  if v_dest_centro is not null and not exists (
       select 1 from scuderia_cavalli sc where sc.centro_id = v_dest_centro and sc.uscito_il is null
          and ((v_horse is not null and sc.horse_id = v_horse) or (v_scheda is not null and sc.id = v_scheda))) then
    insert into cavalli_arrivi (centro_id, horse_id, cavallo_cliente_id, nome_cavallo, proprietario_nome, richiesto_da, richiesto_ruolo, richiesto_nome, dal, prima)
    values (v_dest_centro, v_horse, v_row.id, v_nome_cav,
            coalesce(v_prop_nome, (select nome from clienti_mascalcia where id = v_row.cliente_mascalcia_id)),
            v_me, v_ruolo, v_autore, v_dal, v_prima)
    returning id into v_arrivo;
  end if;

  -- f) avvisi
  v_testo := '🐴 ' || v_nome_cav || ': dal ' || equo_data_it(v_dal, null) || ' sta a «' || v_dest_nome || '»' || coalesce(' (' || v_dest_ind || ')', '') || '.';
  if p_vista = 'maniscalco' then
    -- al proprietario collegato, nella chat con il maniscalco
    insert into messaggi_mascalcia (maniscalco_id, cliente_mascalcia_id, mittente_tipo, tipo, testo, letto)
    select v_me, cm.id, 'maniscalco', 'testo', v_testo || ' I prossimi appuntamenti li faccio lì.', false
      from clienti_mascalcia cm where cm.id = v_row.cliente_mascalcia_id and cm.cliente_user_id is not null and cm.centro_id is null;
    -- agli altri maniscalchi del cavallo
    if v_horse is not null then
      perform equo_avvisa_maniscalchi_cavallo(v_horse, null, 'ℹ️ Avviso automatico di Equo — ' || v_testo || ' Indicato da ' || v_autore || ' (maniscalco).', v_me);
    end if;
  else
    perform equo_avvisa_maniscalchi_cavallo(v_horse, null, v_testo || ' (aggiornato da ' || v_autore || ', proprietario)', null);
  end if;

  return jsonb_build_object('ok', true, 'luogo', v_dest_nome, 'indirizzo', v_dest_ind, 'arrivo', v_arrivo is not null, 'scuderia_cliente_id', v_dest_cli);
end $$;
grant execute on function public.equo_sposta_cavallo(text, uuid, text, uuid, uuid, text, text, date) to authenticated;

-- 5. LA SCUDERIA RISPONDE: «Accogli» o «Non è da noi» -------------------------
create or replace function public.equo_rispondi_arrivo(p_id uuid, p_accogli boolean)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_me uuid := auth.uid(); a cavalli_arrivi; v_centro text; v_h horses; v_cv cavalli_clienti_mascalcia;
  v_sc uuid; v_staff text; v_testo text; x jsonb; v_codice text; v_tipo text;
begin
  select * into a from cavalli_arrivi where id = p_id;
  if a.id is null or a.stato <> 'in_attesa' then return jsonb_build_object('ok', false, 'errore', 'Richiesta non più valida.'); end if;
  if not (is_member_of_centro(a.centro_id) and member_can(a.centro_id, 'cavalli')) then
    return jsonb_build_object('ok', false, 'errore', 'Solo chi gestisce i cavalli del centro può rispondere.');
  end if;
  select nome into v_centro from centri where id = a.centro_id;
  v_staff := coalesce(equo_nome_staff(a.centro_id, v_me), equo_nome_profilo(v_me), v_centro);
  if a.horse_id is not null then select * into v_h from horses where id = a.horse_id; end if;
  if a.cavallo_cliente_id is not null then select * into v_cv from cavalli_clienti_mascalcia where id = a.cavallo_cliente_id; end if;
  v_codice := coalesce(v_h.codice_equo, v_cv.codice_equo);

  if p_accogli then
    -- c'era già (anche uscito, o con lo stesso microchip)? si riattiva quella scheda, niente doppioni
    select sc.id into v_sc from scuderia_cavalli sc
     where sc.centro_id = a.centro_id
       and ((a.horse_id is not null and sc.horse_id = a.horse_id)
         or (v_cv.scuderia_cavallo_id is not null and sc.id = v_cv.scuderia_cavallo_id)
         or (equo_chip(coalesce(v_h.microchip, v_cv.microchip)) is not null and equo_chip(sc.microchip) = equo_chip(coalesce(v_h.microchip, v_cv.microchip))))
     order by (sc.uscito_il is null) desc, sc.created_at limit 1;
    if v_sc is not null then
      update scuderia_cavalli set uscito_il = null, uscito_verso = null where id = v_sc;
    else
      v_tipo := case when v_h.tipo_proprieta in ('pensione','mezza_pensione','soci') then v_h.tipo_proprieta else 'pensione' end;
      insert into scuderia_cavalli (centro_id, nome, razza, mantello, data_nascita, microchip, gruppo_sanguigno, proprietario, tipo_proprieta)
      values (a.centro_id, a.nome_cavallo, coalesce(v_h.breed, v_cv.razza), v_h.mantello, v_h.birth_date, coalesce(v_h.microchip, v_cv.microchip), v_h.gruppo_sanguigno, a.proprietario_nome, v_tipo)
      returning id into v_sc;
    end if;
    if a.horse_id is not null and not exists (select 1 from scuderia_cavalli where id = v_sc and horse_id = a.horse_id) then
      perform equo_collega_cavallo(a.horse_id, v_sc, 'arrivo indicato in Equo', false);
    end if;
    update cavalli_arrivi set stato = 'accolto', risposto_da = v_me, risposto_il = now(), scuderia_cavallo_id = v_sc where id = a.id;
    insert into cavalli_storico (codice_equo, horse_id, scuderia_cavallo_id, cavallo_cliente_id, tipo, descrizione, autore_user_id, autore_ruolo, app)
    values (v_codice, a.horse_id, v_sc, a.cavallo_cliente_id, 'arrivo',
            'Accolto da ' || v_centro || ' (' || v_staff || ') dal ' || to_char(a.dal, 'DD/MM/YYYY'), v_me, 'scuderia', 'scuderia');
    v_testo := '✅ ' || v_centro || ' ha accolto ' || a.nome_cavallo || ': ora è tra i cavalli del centro.';
  else
    -- torna dov'era, se nel frattempo nessuno l'ha spostato di nuovo
    if not exists (select 1 from cavalli_storico st where st.tipo = 'spostamento' and st.created_at > a.created_at
                    and ((a.horse_id is not null and st.horse_id = a.horse_id) or (a.cavallo_cliente_id is not null and st.cavallo_cliente_id = a.cavallo_cliente_id))) then
      x := a.prima->'horse';
      if a.horse_id is not null and x is not null and jsonb_typeof(x) = 'object' then
        update horses set ubicazione_tipo = x->>'tipo', ubicazione_centro_id = (x->>'centro')::uuid, ubicazione_nome = x->>'nome',
          ubicazione_indirizzo = x->>'indirizzo', ubicazione_dal = (x->>'dal')::date where id = a.horse_id;
      end if;
      for x in select * from jsonb_array_elements(coalesce(a.prima->'righe', '[]'::jsonb)) loop
        update cavalli_clienti_mascalcia set ubicazione_tipo = x->>'tipo', ubicazione_cliente_id = (x->>'cliente')::uuid, ubicazione_nome = x->>'nome',
          ubicazione_indirizzo = x->>'indirizzo', ubicazione_dal = (x->>'dal')::date where id = (x->>'id')::uuid;
      end loop;
      update scuderia_cavalli set uscito_il = null, uscito_verso = null
       where id in (select (jsonb_array_elements_text(coalesce(a.prima->'usciti', '[]'::jsonb)))::uuid);
    end if;
    update cavalli_arrivi set stato = 'rifiutato', risposto_da = v_me, risposto_il = now() where id = a.id;
    insert into cavalli_storico (codice_equo, horse_id, scuderia_cavallo_id, cavallo_cliente_id, tipo, descrizione, autore_user_id, autore_ruolo, app)
    values (v_codice, a.horse_id, null, a.cavallo_cliente_id, 'arrivo_rifiutato',
            v_centro || ' segnala che ' || a.nome_cavallo || ' non è da loro (' || v_staff || '): torna «' || coalesce(a.prima->>'luogo', 'posizione di prima') || '»',
            v_me, 'scuderia', 'scuderia');
    v_testo := '⚠️ ' || v_centro || ' segnala che ' || a.nome_cavallo || ' non è da loro: ho rimesso dov''era prima (' || coalesce(a.prima->>'luogo', 'posizione di prima') || ').';
  end if;

  -- avviso a chi l'aveva spostato e agli altri maniscalchi (chat con la scuderia, se collegata)
  perform set_config('equo.collegamento', 'on', true);
  insert into messaggi_mascalcia (maniscalco_id, cliente_mascalcia_id, mittente_tipo, mittente_user_id, tipo, testo, letto)
  select distinct on (cm.maniscalco_id) cm.maniscalco_id, cm.id, 'cliente', v_me, 'testo', v_testo, false
    from clienti_mascalcia cm
   where cm.centro_id = a.centro_id and cm.collegamento_stato = 'attivo'
     and cm.maniscalco_id in (select cv.maniscalco_id from cavalli_clienti_mascalcia cv
                               where cv.id = a.cavallo_cliente_id or (a.horse_id is not null and cv.horse_id = a.horse_id))
   order by cm.maniscalco_id;
  perform set_config('equo.collegamento', '', true);
  return jsonb_build_object('ok', true, 'scuderia_cavallo_id', v_sc);
end $$;
grant execute on function public.equo_rispondi_arrivo(uuid, boolean) to authenticated;

-- 6. LETTURE ------------------------------------------------------------------
-- spostamenti del cavallo (scheda maniscalco, libretto proprietario, scheda scuderia)
create or replace function public.equo_spostamenti_cavallo(p_vista text, p_id uuid)
returns table (creato timestamptz, tipo text, descrizione text, ruolo text)
language plpgsql stable security definer set search_path = public as $$
declare k record;
begin
  select * into k from equo_chiavi_cavallo(p_vista, p_id);
  if not coalesce(k.ok, false) then return; end if;
  return query
    select st.created_at, st.tipo, st.descrizione, st.autore_ruolo from cavalli_storico st
     where st.tipo in ('spostamento','uscita','arrivo','arrivo_rifiutato')
       and ((k.horse is not null and st.horse_id = k.horse) or st.cavallo_cliente_id = any(k.righe) or st.scuderia_cavallo_id = any(k.schede))
     order by st.created_at desc limit 40;
end $$;
grant execute on function public.equo_spostamenti_cavallo(text, uuid) to authenticated;

-- ricerca delle scuderie su Equo Scuderia (per il proprietario)
create or replace function public.equo_cerca_centri(p_q text)
returns table (id uuid, nome text, citta text, provincia text)
language sql stable security definer set search_path = public as $$
  select c.id, c.nome, c.citta, c.provincia from centri c
   where auth.uid() is not null and char_length(equo_norm(p_q)) >= 2
     and (equo_norm(c.nome) like '%' || equo_norm(p_q) || '%' or equo_norm(coalesce(c.citta, '')) like equo_norm(p_q) || '%')
   order by c.nome limit 20;
$$;
grant execute on function public.equo_cerca_centri(text) to authenticated;

-- 7. GUIDE --------------------------------------------------------------------
insert into public.ai_conoscenze (ambito, categoria, attivo, titolo, contenuto, aggiornato_il, verificato_il)
select 'maniscalco', 'guida', true, 'Come sposto un cavallo (a casa, in una scuderia)',
'Dove: Clienti → apri il cliente → tocca il cavallo → riquadro "Dove sta" → "Sposta"
Passi:
1. Scegli dove va: "A casa / privato" (indirizzo del cliente o un altro), una delle tue scuderie (cerca per nome) oppure "+ Nuova scuderia" con nome e indirizzo.
2. Scegli da che giorno e tocca "Sposta".
3. Il cliente che paga resta lo stesso: cambia solo il luogo. I prossimi appuntamenti del cavallo in Agenda passano sotto il nuovo luogo e "Naviga" porta lì.
Esempio: Aurora di Marco Rossi va alla Scuderia Le Querce: in Agenda il martedì trovi il blocco "Scuderia Le Querce" con Aurora (di Marco Rossi) e Brezza; Marco continua a ricevere le richieste di pagamento.
Note: Lo spostamento resta per sempre nello storico del cavallo e nel libretto del proprietario. Se il proprietario è collegato riceve un messaggio in chat; anche lui può spostare il cavallo dalla sua app e tu lo vedi subito. Se la scuderia usa Equo Scuderia riceve la richiesta di accoglierlo; se risponde "Non è da noi" il cavallo torna dov''era e ricevi l''avviso. I lavori già fatti ricordano dove sono stati fatti.
Parole chiave: sposta, spostare cavallo, cambio scuderia, trasferimento, dove sta, ubicazione, maneggio, centro ippico, a casa, privato, raggruppamento agenda, giro',
now(), current_date
where not exists (select 1 from public.ai_conoscenze where titolo = 'Come sposto un cavallo (a casa, in una scuderia)');

insert into public.ai_conoscenze (ambito, categoria, attivo, titolo, contenuto, aggiornato_il, verificato_il)
select 'proprietario', 'guida', true, 'Come indico dove sta il mio cavallo (Sposta)',
'Dove: I miei cavalli → tocca il cavallo → riquadro "Dove sta" → "Sposta"
Passi:
1. Scegli "A casa" (il tuo indirizzo o un altro), una scuderia su Equo (cerca per nome o città) oppure "Altra scuderia" scrivendo nome e indirizzo.
2. Scegli da che giorno e tocca "Sposta".
Esempio: Giulia porta Zeus al Maneggio Il Poggio: lo cerca, lo sceglie e conferma. Il suo maniscalco vede subito Zeus sotto "Maneggio Il Poggio" nel suo giro.
Note: Lo spostamento resta nel libretto del cavallo. I maniscalchi che seguono il cavallo ricevono un messaggio. Se la scuderia usa Equo Scuderia riceve la richiesta di accoglierlo: finché non risponde il riquadro dice "in attesa"; se risponde "Non è da noi" il cavallo torna dov''era. Chi paga il maniscalco non cambia.
Parole chiave: sposta, spostare cavallo, cambio scuderia, trasferimento, dove sta, pensione, maneggio, a casa',
now(), current_date
where not exists (select 1 from public.ai_conoscenze where titolo = 'Come indico dove sta il mio cavallo (Sposta)');

insert into public.ai_conoscenze (ambito, categoria, attivo, titolo, contenuto, aggiornato_il, verificato_il)
select 'scuderia', 'guida', true, 'Cavalli in arrivo e cavalli usciti',
'Dove: Cavalli → in alto "Cavalli in arrivo"
Passi:
1. Quando un proprietario o un maniscalco indica in Equo che un cavallo sta da voi, compare la richiesta "… in arrivo" con chi l''ha indicato e da che giorno.
2. "Accogli": il cavallo entra nei vostri cavalli (sezione Pensione) con la sua scheda Equo e il suo storico; se c''era già (anche uscito) si riattiva la stessa scheda, senza doppioni.
3. "Non è da noi": il cavallo torna dov''era e chi l''aveva indicato riceve l''avviso.
4. Quando il proprietario o il maniscalco sposta il cavallo altrove, la scheda non si cancella: passa in "Usciti dal centro" in fondo alla pagina, con la data e dove è andato, e il box si libera.
Esempio: arriva "Aurora in arrivo · indicato da Luca Verdi (maniscalco) dal 9 ottobre": l''amministratore tocca "Accogli" e Aurora compare in Pensione.
Note: Rispondono l''amministratore e chi ha il permesso Cavalli. I cavalli usciti non contano nel limite del pacchetto.
Parole chiave: arrivo, cavallo in arrivo, accogli, nuovo cavallo, uscito, usciti, trasferimento, sposta, lascia il centro',
now(), current_date
where not exists (select 1 from public.ai_conoscenze where titolo = 'Cavalli in arrivo e cavalli usciti');

-- controllo finale: deve dare 5 · 4 · 1 · 4 · 3
select (select count(*) from information_schema.columns where table_name = 'cavalli_clienti_mascalcia' and column_name like 'ubicazione_%') as righe_maniscalco,
       (select count(*) from information_schema.columns where table_name = 'horses' and column_name like 'ubicazione_%' and column_name <> 'ubicazione_indirizzo') as horses,
       (select count(*) from information_schema.tables where table_name = 'cavalli_arrivi') as arrivi,
       (select count(*) from pg_proc where proname in ('equo_sposta_cavallo','equo_rispondi_arrivo','equo_spostamenti_cavallo','equo_cerca_centri')) as funzioni,
       (select count(*) from ai_conoscenze where titolo in ('Come sposto un cavallo (a casa, in una scuderia)','Come indico dove sta il mio cavallo (Sposta)','Cavalli in arrivo e cavalli usciti')) as guide;
