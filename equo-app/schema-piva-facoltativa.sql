-- Equo: collegamento maniscalco → struttura senza P.IVA obbligatoria (ottobre 2026)
-- La P.IVA resta consigliata (badge Equo Certified): la funzione restituisce senza_piva e l'app mostra il consiglio.
create or replace function public.pro_richiedi_collegamento_struttura(p_codice text, p_cliente_id uuid default null)
returns json language plpgsql security definer set search_path = public as $$
declare
  v_me uuid := auth.uid(); v_pro record; v_centro record; v_es record; v_id uuid; v_senza boolean;
begin
  if v_me is null then return json_build_object('ok', false, 'errore', 'Accedi di nuovo.'); end if;
  select ruolo, ruolo_secondario, dati_pagamento_piva_cf into v_pro from profiles where id = v_me;
  if 'maniscalco' not in (coalesce(v_pro.ruolo, ''), coalesce(v_pro.ruolo_secondario, '')) then
    return json_build_object('ok', false, 'errore', 'Per ora il collegamento con le strutture è disponibile per i maniscalchi.');
  end if;
  -- P.IVA / codice fiscale mancanti: si consiglia, non si blocca
  v_senza := coalesce(trim(v_pro.dati_pagamento_piva_cf), '') = '';
  select id, nome, telefono into v_centro from centri where upper(join_code) = upper(trim(coalesce(p_codice, ''))) limit 1;
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
end $$;

-- controllo finale: deve restituire false (nessun blocco sulla P.IVA)
select pg_get_functiondef('public.pro_richiedi_collegamento_struttura(text,uuid)'::regprocedure) like '%Inserisci prima P.IVA%' as blocco_ancora_presente;
