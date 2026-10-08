-- Equo: ARCHIVIO CLIENTI DEL MANISCALCO (8 ottobre 2026)
-- Un cliente con cavalli, interventi o messaggi non si cancella più: si archivia. Cavalli e storico restano a vita.
-- Prima dell'archiviazione i cavalli si possono spostare in un altro cliente (con voce nello storico del cavallo).

-- 1. colonna archivio
alter table public.clienti_mascalcia add column if not exists archiviato_il timestamptz;

-- 2. blocco nel database: niente eliminazione di un cliente che ha storico
--    (resta permessa solo per il cliente vuoto e quando si elimina l'intero account del maniscalco)
create or replace function public.clienti_mascalcia_no_delete()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if pg_trigger_depth() > 1 or not exists (select 1 from auth.users where id = old.maniscalco_id) then
    return old;  -- cancellazione a cascata dell'account
  end if;
  if coalesce(old.collegamento_stato, '') like 'da_confermare%'
     and not exists (select 1 from interventi_mascalcia where cliente_mascalcia_id = old.id) then
    return old;  -- invito di una scuderia rifiutato o annullato prima di lavorarci
  end if;
  if exists (select 1 from cavalli_clienti_mascalcia where cliente_mascalcia_id = old.id)
     or exists (select 1 from interventi_mascalcia where cliente_mascalcia_id = old.id)
     or exists (select 1 from messaggi_mascalcia where cliente_mascalcia_id = old.id) then
    raise exception 'CLIENTE_CON_STORICO: questo cliente ha cavalli, interventi o messaggi. Archivialo: cavalli e storico restano.';
  end if;
  return old;
end $$;
drop trigger if exists trg_clienti_mascalcia_no_delete on public.clienti_mascalcia;
create trigger trg_clienti_mascalcia_no_delete before delete on public.clienti_mascalcia
  for each row execute function public.clienti_mascalcia_no_delete();

-- 3. limite Free: contano solo i clienti attivi (anche quando se ne ripristina uno archiviato)
create or replace function public.limite_clienti_free()
returns trigger language plpgsql security definer set search_path = public as $$
declare n bigint;
begin
  if auth.uid() is null or auth.uid() <> new.maniscalco_id then return new; end if;
  if new.archiviato_il is not null then return new; end if;
  if tg_op = 'UPDATE' and old.archiviato_il is null then return new; end if;
  if equo_premium_pro(new.maniscalco_id) then return new; end if;
  select count(*) into n from clienti_mascalcia where maniscalco_id = new.maniscalco_id and archiviato_il is null and id <> new.id;
  if n >= 10 then
    raise exception 'LIMITE_CLIENTI_FREE: hai raggiunto i 10 clienti del piano Free. Passa a Premium per aggiungerne altri.';
  end if;
  return new;
end $$;
drop trigger if exists trg_limite_clienti_free on public.clienti_mascalcia;
create trigger trg_limite_clienti_free before insert or update of archiviato_il on public.clienti_mascalcia
  for each row execute function public.limite_clienti_free();

-- 4. storico del cavallo quando il cliente viene archiviato o ripristinato
create or replace function public.clienti_mascalcia_storico_archivio()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (old.archiviato_il is null) = (new.archiviato_il is null) then return null; end if;
  insert into cavalli_storico (codice_equo, horse_id, scuderia_cavallo_id, cavallo_cliente_id, tipo, descrizione, autore_user_id, autore_ruolo, app)
  select cv.codice_equo, cv.horse_id, cv.scuderia_cavallo_id, cv.id,
         case when new.archiviato_il is null then 'cliente_ripristinato' else 'cliente_archiviato' end,
         case when new.archiviato_il is null
              then 'Cliente «' || new.nome || '» ripristinato dal maniscalco ' || equo_nome_profilo(new.maniscalco_id)
              else 'Cliente «' || new.nome || '» archiviato dal maniscalco ' || equo_nome_profilo(new.maniscalco_id) || ': cavallo e storico restano' end,
         auth.uid(), 'maniscalco', 'app'
    from cavalli_clienti_mascalcia cv where cv.cliente_mascalcia_id = new.id;
  return null;
end $$;
drop trigger if exists trg_clienti_mascalcia_storico_archivio on public.clienti_mascalcia;
create trigger trg_clienti_mascalcia_storico_archivio after update of archiviato_il on public.clienti_mascalcia
  for each row execute function public.clienti_mascalcia_storico_archivio();

-- 5. spostare i cavalli in un altro cliente (con gli appuntamenti non ancora fatti); gli interventi fatti restano al cliente di allora
create or replace function public.pro_sposta_cavalli(p_cavalli uuid[], p_cliente uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_me uuid := auth.uid(); v_dest clienti_mascalcia; r record; v_n int := 0;
begin
  if v_me is null then return jsonb_build_object('ok', false, 'errore', 'Accesso richiesto.'); end if;
  select * into v_dest from clienti_mascalcia where id = p_cliente and maniscalco_id = v_me;
  if v_dest.id is null or v_dest.archiviato_il is not null then
    return jsonb_build_object('ok', false, 'errore', 'Scegli uno dei tuoi clienti attivi.');
  end if;
  for r in
    select cv.*, c.nome as da_nome from cavalli_clienti_mascalcia cv join clienti_mascalcia c on c.id = cv.cliente_mascalcia_id
     where cv.id = any(p_cavalli) and cv.maniscalco_id = v_me and cv.cliente_mascalcia_id <> p_cliente
  loop
    update cavalli_clienti_mascalcia set cliente_mascalcia_id = p_cliente where id = r.id;
    update interventi_mascalcia set cliente_mascalcia_id = p_cliente
     where cavallo_cliente_id = r.id and maniscalco_id = v_me and stato in ('programmato','richiesto','proposto') and gruppo_id is null;
    insert into cavalli_storico (codice_equo, horse_id, scuderia_cavallo_id, cavallo_cliente_id, tipo, descrizione, autore_user_id, autore_ruolo, app)
    values (r.codice_equo, r.horse_id, r.scuderia_cavallo_id, r.id, 'spostamento',
            'Spostato dal cliente «' || coalesce(r.da_nome, 'cliente') || '» al cliente «' || v_dest.nome || '» (maniscalco ' || equo_nome_profilo(v_me) || ')',
            v_me, 'maniscalco', 'app');
    v_n := v_n + 1;
  end loop;
  return jsonb_build_object('ok', true, 'spostati', v_n);
end $$;
revoke execute on function public.pro_sposta_cavalli(uuid[], uuid) from public, anon;
grant execute on function public.pro_sposta_cavalli(uuid[], uuid) to authenticated;

-- 6. scadenze: i clienti archiviati non generano richiami
create or replace function public.richiami_maniscalco(p_giorni integer default 60)
returns table(intervento_id uuid, cliente_mascalcia_id uuid, cliente_nome text, tipo_cliente text, cavallo_cliente_id uuid, horse_id uuid, cavallo_nome text, tipo_ferratura text, tipo_altro text, misura_sistema text, numero_ferro text, quantita_ferri integer, data_intervento date, prossima_scadenza date, scadenza date, rimandato boolean, giorni integer)
language sql stable security definer set search_path to 'public' as $function$
  with oggi as (select (now() at time zone 'Europe/Rome')::date d),
  fatti as (
    select i.*, coalesce(i.cavallo_cliente_id::text, i.horse_id::text, 'c:' || i.cliente_mascalcia_id::text) chiave,
      row_number() over (partition by coalesce(i.cavallo_cliente_id::text, i.horse_id::text, 'c:' || i.cliente_mascalcia_id::text)
                         order by i.data_intervento desc, i.created_at desc) rn
    from interventi_mascalcia i
    where i.maniscalco_id = auth.uid() and i.stato = 'fatto'
  ),
  in_agenda as (
    select distinct coalesce(i.cavallo_cliente_id::text, i.horse_id::text, 'c:' || i.cliente_mascalcia_id::text) chiave
    from interventi_mascalcia i
    where i.maniscalco_id = auth.uid() and i.stato in ('programmato','richiesto','proposto')
  )
  select f.id, f.cliente_mascalcia_id, c.nome, c.tipo_cliente,
    f.cavallo_cliente_id, f.horse_id, coalesce(cv.nome, h.name, c.nome_cavallo),
    f.tipo_ferratura, f.tipo_altro, f.misura_sistema, f.numero_ferro, f.quantita_ferri,
    f.data_intervento, f.prossima_scadenza,
    coalesce(rs.rimandato_al, f.prossima_scadenza),
    rs.rimandato_al is not null,
    (coalesce(rs.rimandato_al, f.prossima_scadenza) - (select d from oggi))::int
  from fatti f
  join clienti_mascalcia c on c.id = f.cliente_mascalcia_id
  left join cavalli_clienti_mascalcia cv on cv.id = f.cavallo_cliente_id
  left join horses h on h.id = f.horse_id
  left join richiami_stato rs on rs.intervento_id = f.id
  where f.rn = 1 and f.prossima_scadenza is not null
    and c.archiviato_il is null
    and rs.chiuso_il is null
    and f.chiave not in (select chiave from in_agenda)
    and coalesce(rs.rimandato_al, f.prossima_scadenza) <= (select d from oggi) + p_giorni
  order by 15, 3;
$function$;

-- 7. guide del maniscalco
update public.ai_conoscenze set aggiornato_il = now(), verificato_il = current_date,
  titolo = 'Come archivio o elimino un cliente',
  contenuto = 'Dove: "Clienti" → cliente → "Archivia cliente" (anche in "Modifica cliente"); i clienti archiviati sono in fondo alla lista Clienti in "Clienti archiviati"
Passi:
1. Apri la scheda del cliente e tocca "Archivia cliente".
2. Se vuoi, tocca "Sposta i cavalli in un altro cliente": scegli i cavalli e il cliente di destinazione (es. la scuderia dove ora stanno) e tocca "Sposta". Gli appuntamenti non ancora fatti seguono il cavallo.
3. Tocca "Archivia cliente": sparisce dalla lista, dalle scadenze e dalla scelta del cliente negli appuntamenti.
4. Per riaverlo: "Clienti archiviati" → cliente → "Ripristina".
Esempio: Paolo Neri ha venduto Brio, che resta alla Scuderia Le Querce: Luca sposta Brio nella scuderia e archivia Paolo.
Note: Cavalli, interventi, incassi e messaggi non si perdono mai: ogni cavallo ha uno storico a vita e lo spostamento resta registrato. Un cliente senza cavalli, interventi né messaggi (es. creato per sbaglio) si elimina definitivamente con "Elimina cliente". I clienti archiviati non contano nei 10 clienti del piano Free; per ripristinarne uno serve un posto libero.
Parole chiave: eliminare cliente, cancellare cliente, archiviare cliente, rimuovere cliente, togliere cliente, ripristinare cliente, clienti archiviati, spostare cavalli, cavalli spariti'
where id = 'e4a5aaed-b83d-4f16-abf5-9a54ab953c33';

update public.ai_conoscenze set aggiornato_il = now(), verificato_il = current_date,
  contenuto = replace(contenuto, 'Note: Se l''appuntamento non viene salvato, il cliente appena creato viene tolto per evitare doppioni.',
                                 'Note: Se l''appuntamento non viene salvato, il cliente e il cavallo appena creati vengono tolti per evitare doppioni.')
where id = '3e186a8e-f8b4-491a-833c-daea1f91c77b';

-- controllo finale: deve dare 1 · 1 · 1 · 1 · 1
select (select count(*) from information_schema.columns where table_name = 'clienti_mascalcia' and column_name = 'archiviato_il') as colonna,
       (select count(*) from pg_trigger where tgname = 'trg_clienti_mascalcia_no_delete') as blocco,
       (select count(*) from pg_proc where proname = 'pro_sposta_cavalli') as sposta,
       (select count(*) from ai_conoscenze where id = 'e4a5aaed-b83d-4f16-abf5-9a54ab953c33' and titolo = 'Come archivio o elimino un cliente') as guida,
       (select count(*) from ai_conoscenze where id = '3e186a8e-f8b4-491a-833c-daea1f91c77b' and contenuto like '%il cliente e il cavallo appena creati%') as guida2;
