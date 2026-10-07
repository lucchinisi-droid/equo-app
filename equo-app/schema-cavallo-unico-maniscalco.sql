-- Equo: SCHEDA CAVALLO UNICA, passo 1b — anche per il maniscalco un cavallo è UNA sola riga (7 ottobre 2026)
-- Se lo stesso cavallo (scheda della struttura collegata al cavallo del proprietario) compare in più clienti dello stesso maniscalco,
-- resta la riga presso la struttura (dove il cavallo sta): gli interventi delle altre righe passano lì, le righe doppie spariscono,
-- tutto in cavalli_storico. Nel cliente proprietario il cavallo continua a vedersi con «📍 presso …».

create or replace function public.equo_unisci_righe_maniscalco(p_scheda uuid, p_maniscalco uuid default null, p_tieni uuid default null)
returns int language plpgsql security definer set search_path = public as $$
declare v_h uuid; m record; k cavalli_clienti_mascalcia; d record; v_n int := 0; v_dove text;
begin
  select horse_id into v_h from scuderia_cavalli where id = p_scheda;
  if v_h is null then return 0; end if;
  perform set_config('equo.unisci_righe', 'on', true);
  for m in
    select distinct maniscalco_id from cavalli_clienti_mascalcia
     where (scuderia_cavallo_id = p_scheda or horse_id = v_h) and (p_maniscalco is null or maniscalco_id = p_maniscalco)
  loop
    -- riga da tenere: quella indicata (se è presso la scheda) oppure la più vecchia presso la scheda della struttura
    select * into k from cavalli_clienti_mascalcia
     where maniscalco_id = m.maniscalco_id and scuderia_cavallo_id = p_scheda and (horse_id is null or horse_id = v_h)
     order by (id = p_tieni) desc, created_at, id limit 1;
    if k.id is null then continue; end if;
    select nome into v_dove from clienti_mascalcia where id = k.cliente_mascalcia_id;
    for d in
      select cv.*, c.nome as cliente_nome from cavalli_clienti_mascalcia cv join clienti_mascalcia c on c.id = cv.cliente_mascalcia_id
       where cv.maniscalco_id = m.maniscalco_id and cv.id <> k.id
         and ((cv.horse_id = v_h and (cv.scuderia_cavallo_id is null or cv.scuderia_cavallo_id = p_scheda))
           or (cv.scuderia_cavallo_id = p_scheda and (cv.horse_id is null or cv.horse_id = v_h)))
    loop
      update interventi_mascalcia set cavallo_cliente_id = k.id where cavallo_cliente_id = d.id;
      update cavalli_clienti_mascalcia set
        horse_id = coalesce(horse_id, v_h),
        microchip = coalesce(nullif(microchip, ''), d.microchip),
        razza = coalesce(nullif(razza, ''), d.razza)
       where id = k.id;
      insert into cavalli_storico (codice_equo, horse_id, scuderia_cavallo_id, cavallo_cliente_id, tipo, descrizione, autore_user_id, autore_ruolo, app)
      values (k.codice_equo, v_h, p_scheda, k.id, 'unione',
              'Stesso cavallo in due clienti del maniscalco ' || equo_nome_profilo(m.maniscalco_id) || ': la riga di «' || coalesce(d.cliente_nome, 'cliente')
              || '» è unita a quella presso «' || coalesce(v_dove, 'struttura') || '» (interventi e storico in un''unica scheda)',
              auth.uid(), 'sistema', 'app');
      delete from cavalli_clienti_mascalcia where id = d.id;
      v_n := v_n + 1;
    end loop;
    -- anche senza doppioni la riga presso la struttura sa di quale cavallo del proprietario si tratta
    update cavalli_clienti_mascalcia set horse_id = v_h where id = k.id and horse_id is null;
  end loop;
  perform set_config('equo.unisci_righe', '', true);
  return v_n;
end $$;
revoke execute on function public.equo_unisci_righe_maniscalco(uuid, uuid, uuid) from public, anon, authenticated;

-- quando una scheda della struttura viene collegata al cavallo del proprietario
create or replace function public.equo_scheda_collegata_unisci()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.horse_id is not null and new.horse_id is distinct from old.horse_id then
    perform equo_unisci_righe_maniscalco(new.id);
  end if;
  return null;
end $$;
drop trigger if exists trg_scuderia_cavalli_unisci_righe on public.scuderia_cavalli;
create trigger trg_scuderia_cavalli_unisci_righe after update of horse_id on public.scuderia_cavalli
  for each row execute function public.equo_scheda_collegata_unisci();

-- quando il maniscalco riceve/sposta una riga che punta a un cavallo già collegato (collegamento struttura, codice Equo, richiesta)
create or replace function public.equo_riga_maniscalco_unisci()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_scheda uuid;
begin
  if coalesce(current_setting('equo.unisci_righe', true), '') = 'on' then return null; end if;
  if new.scuderia_cavallo_id is not null and exists (select 1 from scuderia_cavalli where id = new.scuderia_cavallo_id and horse_id is not null) then
    v_scheda := new.scuderia_cavallo_id;
  elsif new.horse_id is not null then
    select sc.id into v_scheda from scuderia_cavalli sc
     where sc.horse_id = new.horse_id
       and exists (select 1 from cavalli_clienti_mascalcia x where x.maniscalco_id = new.maniscalco_id and x.scuderia_cavallo_id = sc.id)
     limit 1;
  end if;
  if v_scheda is not null then
    perform equo_unisci_righe_maniscalco(v_scheda, new.maniscalco_id, new.id);
  end if;
  return null;
end $$;
drop trigger if exists trg_cavalli_clienti_unisci_righe on public.cavalli_clienti_mascalcia;
create trigger trg_cavalli_clienti_unisci_righe after insert or update of scuderia_cavallo_id, horse_id on public.cavalli_clienti_mascalcia
  for each row execute function public.equo_riga_maniscalco_unisci();

-- subito: unisce i doppioni già esistenti (oggi: Rio di Riccardo, cliente proprietario + Scuderia Colleferro)
do $$
declare r record;
begin
  for r in select id from scuderia_cavalli where horse_id is not null loop
    perform public.equo_unisci_righe_maniscalco(r.id);
  end loop;
end $$;

-- guida del maniscalco aggiornata
update public.ai_conoscenze set aggiornato_il = now(), verificato_il = current_date,
  contenuto = replace(contenuto,
    'Note: Se lo stesso cavallo compare in due tuoi clienti (proprietario e struttura), usa «Codice Equo del cavallo» nel cliente dove si trova davvero per spostarlo: resta una sola scheda.',
    'Note: Se lo stesso cavallo era in due tuoi clienti (il proprietario e la struttura dove sta), Equo lo tiene una volta sola presso la struttura, con tutti gli interventi; nel cliente proprietario lo vedi con «📍 presso …» e puoi continuare a fissargli appuntamenti. Se il cavallo cambia struttura usa «Codice Equo del cavallo» nel nuovo cliente.')
where titolo = 'Perché è cambiato il codice Equo di un cavallo';

-- controllo finale: deve dare 1 · 1 (Rio una sola volta per Riccardo, guida aggiornata)
select (select count(*) from cavalli_clienti_mascalcia
         where maniscalco_id = 'f2f5099c-4d8d-4e64-b8a5-99e2032032f6'
           and (horse_id = '0099bf7f-5d0b-41c2-8d7f-8716c5ddb4b3' or scuderia_cavallo_id = '53ad24ec-c4de-41e0-9c41-5ee893c8879d')) as rio_riccardo,
       (select count(*) from ai_conoscenze where titolo = 'Perché è cambiato il codice Equo di un cavallo' and contenuto like '%presso la struttura, con tutti gli interventi%') as guida;
