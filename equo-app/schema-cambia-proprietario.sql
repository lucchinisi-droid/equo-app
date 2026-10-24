-- 24/10/2026 CAMBIA PROPRIETARIO di uno o piu cavalli (richiesta del 24/10: cavalli di proprietari esterni in scuderia)
-- Il cavallo passa al nuovo cliente (chi paga) ma resta DOVE STA: se prima era intestato a una scuderia, resta in quella scuderia
-- (compare in «Qui stanno»). Gli appuntamenti futuri passano al nuovo proprietario. I lavori fatti e DA SALDARE passano solo se
-- p_aperti = true (scelta del maniscalco); quelli gia saldati o gia messi in un conto restano dove sono. Si puo rieseguire senza danni.
create or replace function public.pro_cambia_proprietario(p_cavalli uuid[], p_cliente uuid, p_aperti boolean default false) returns jsonb
language plpgsql security definer set search_path to 'public' as $fn$
declare v_me uuid := auth.uid(); v_dest clienti_mascalcia; r record; v_n int := 0; v_lav int := 0; k int;
begin
  if v_me is null then return jsonb_build_object('ok', false, 'errore', 'Accesso richiesto.'); end if;
  select * into v_dest from clienti_mascalcia where id = p_cliente and maniscalco_id = v_me;
  if v_dest.id is null or v_dest.archiviato_il is not null then
    return jsonb_build_object('ok', false, 'errore', 'Scegli uno dei tuoi clienti attivi.');
  end if;
  for r in
    select cv.*, c.nome as da_nome, (c.tipo_cliente = 'struttura' or c.centro_id is not null) as da_struttura
      from cavalli_clienti_mascalcia cv join clienti_mascalcia c on c.id = cv.cliente_mascalcia_id
     where cv.id = any(p_cavalli) and cv.maniscalco_id = v_me and cv.cliente_mascalcia_id <> p_cliente
  loop
    update cavalli_clienti_mascalcia set cliente_mascalcia_id = p_cliente,
           ubicazione_tipo      = case when r.ubicazione_tipo is null and r.da_struttura then 'scuderia' else ubicazione_tipo end,
           ubicazione_cliente_id = case when r.ubicazione_tipo is null and r.da_struttura then r.cliente_mascalcia_id else ubicazione_cliente_id end,
           ubicazione_nome      = case when r.ubicazione_tipo is null and r.da_struttura then r.da_nome else ubicazione_nome end,
           ubicazione_dal       = case when r.ubicazione_tipo is null and r.da_struttura then coalesce(ubicazione_dal, current_date) else ubicazione_dal end
     where id = r.id;
    -- se la scuderia era il nuovo luogo del cavallo e ora il cavallo torna «a casa» del nuovo proprietario non si tocca nulla: resta dove sta
    update interventi_mascalcia set cliente_mascalcia_id = p_cliente
     where cavallo_cliente_id = r.id and maniscalco_id = v_me and stato in ('programmato','richiesto','proposto') and gruppo_id is null;
    if p_aperti then
      update interventi_mascalcia i set cliente_mascalcia_id = p_cliente, luogo_cliente_id = coalesce(i.luogo_cliente_id, r.cliente_mascalcia_id)
       where i.cavallo_cliente_id = r.id and i.maniscalco_id = v_me and i.stato = 'fatto' and i.stato_pagamento = 'da_saldare'
         and i.cliente_mascalcia_id = r.cliente_mascalcia_id
         and not exists (select 1 from conti_mascalcia_righe cr join conti_mascalcia co on co.id = cr.conto_id
                          where cr.intervento_id = i.id and co.stato <> 'annullato');
      get diagnostics k = row_count; v_lav := v_lav + k;
    end if;
    insert into cavalli_storico (codice_equo, horse_id, scuderia_cavallo_id, cavallo_cliente_id, tipo, descrizione, autore_user_id, autore_ruolo, app)
    values (r.codice_equo, r.horse_id, r.scuderia_cavallo_id, r.id, 'spostamento',
            'Proprietario: «' || coalesce(r.da_nome, 'cliente') || '» → «' || v_dest.nome || '»'
            || case when r.ubicazione_tipo is null and r.da_struttura then ' · resta in «' || r.da_nome || '»' else '' end
            || ' (maniscalco ' || equo_nome_profilo(v_me) || ')',
            v_me, 'maniscalco', 'app');
    v_n := v_n + 1;
  end loop;
  return jsonb_build_object('ok', true, 'spostati', v_n, 'lavori', v_lav);
end $fn$;
revoke all on function public.pro_cambia_proprietario(uuid[], uuid, boolean) from public, anon;
grant execute on function public.pro_cambia_proprietario(uuid[], uuid, boolean) to authenticated;

-- controllo
select count(*) funzione from pg_proc where proname = 'pro_cambia_proprietario';
