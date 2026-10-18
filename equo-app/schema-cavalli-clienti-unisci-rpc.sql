-- Unione manuale di due schede dello stesso cavallo nel cliente del maniscalco (avviso "sembra lo stesso cavallo").
-- Chiamata dall'app: rpc('equo_unisci_cavalli_cliente', { p_togli, p_tieni, p_horse }).
--  p_togli = scheda inserita a mano (senza collegamento) che sparisce;
--  p_tieni = scheda collegata al cavallo del proprietario che resta (se esiste già la riga);
--  p_horse = cavallo condiviso del proprietario (se non esiste ancora la riga: la scheda manuale viene agganciata e rinominata).
-- Vince sempre il nome del proprietario. Lavori, problemi, allegati e arrivi passano alla scheda che resta.

create or replace function equo_unisci_cavalli_cliente(p_togli uuid, p_tieni uuid default null, p_horse uuid default null)
returns json
language plpgsql security definer set search_path to 'public' as $fn$
declare d cavalli_clienti_mascalcia; k cavalli_clienti_mascalcia; v_h horses; v_nome text;
begin
  if auth.uid() is null then return json_build_object('ok', false, 'motivo', 'non_autenticato'); end if;
  select * into d from cavalli_clienti_mascalcia where id = p_togli and maniscalco_id = auth.uid();
  if d.id is null then return json_build_object('ok', false, 'motivo', 'scheda_non_trovata'); end if;
  if d.horse_id is not null or d.scuderia_cavallo_id is not null then return json_build_object('ok', false, 'motivo', 'scheda_gia_collegata'); end if;

  if p_tieni is not null then
    select * into k from cavalli_clienti_mascalcia where id = p_tieni and maniscalco_id = auth.uid() and cliente_mascalcia_id = d.cliente_mascalcia_id and id <> d.id;
    if k.id is null then return json_build_object('ok', false, 'motivo', 'scheda_da_tenere_non_trovata'); end if;
  elsif p_horse is not null then
    if not exists (select 1 from cavalli_condivisi_cliente(d.cliente_mascalcia_id) h where h.id = p_horse) then
      return json_build_object('ok', false, 'motivo', 'cavallo_non_condiviso');
    end if;
    select * into v_h from horses where id = p_horse;
    if v_h.id is null then return json_build_object('ok', false, 'motivo', 'cavallo_non_trovato'); end if;
    -- la scheda manuale diventa quella del cavallo del proprietario (nome del proprietario)
    update cavalli_clienti_mascalcia set horse_id = v_h.id, nome = v_h.name, microchip = coalesce(nullif(microchip, ''), v_h.microchip) where id = d.id;
    insert into cavalli_storico (codice_equo, horse_id, scuderia_cavallo_id, cavallo_cliente_id, tipo, descrizione, autore_user_id, autore_ruolo, app)
    select codice_equo, horse_id, null, id, 'unione',
      'Scheda inserita a mano dal maniscalco (' || d.nome || ') collegata al cavallo del proprietario (' || v_h.name || '): resta il nome scelto dal proprietario',
      auth.uid(), 'maniscalco', 'app' from cavalli_clienti_mascalcia where id = d.id;
    return json_build_object('ok', true, 'nome', v_h.name, 'scheda', d.id);
  else
    return json_build_object('ok', false, 'motivo', 'manca_destinazione');
  end if;

  perform set_config('equo.unisci_manuali', 'on', true);
  update interventi_mascalcia set cavallo_cliente_id = k.id where cavallo_cliente_id = d.id;
  update cavalli_problemi_piede set cavallo_cliente_id = k.id where cavallo_cliente_id = d.id;
  update cavalli_allegati set cavallo_cliente_id = k.id where cavallo_cliente_id = d.id;
  update cavalli_arrivi set cavallo_cliente_id = k.id where cavallo_cliente_id = d.id;
  update cavalli_clienti_mascalcia set
    avviso_sicurezza = coalesce(nullif(avviso_sicurezza, ''), d.avviso_sicurezza),
    ferratura_tipo   = case when ferratura_tipo = 'completa' and d.ferratura_tipo is not null then d.ferratura_tipo else ferratura_tipo end,
    ferro_tipo       = case when ferro_tipo = 'standard' and d.ferro_tipo is not null then d.ferro_tipo else ferro_tipo end,
    ferro_note       = coalesce(nullif(ferro_note, ''), d.ferro_note),
    ferro_tipo_post  = coalesce(ferro_tipo_post, d.ferro_tipo_post),
    ferro_sistema    = coalesce(ferro_sistema, d.ferro_sistema),
    ferro_numero     = coalesce(ferro_numero, d.ferro_numero),
    razza            = coalesce(nullif(razza, ''), d.razza),
    microchip        = coalesce(nullif(microchip, ''), d.microchip)
   where id = k.id;
  insert into cavalli_storico (codice_equo, horse_id, scuderia_cavallo_id, cavallo_cliente_id, tipo, descrizione, autore_user_id, autore_ruolo, app)
  values (k.codice_equo, k.horse_id, null, k.id, 'unione',
    'Scheda inserita a mano dal maniscalco (' || d.nome || ', codice ' || coalesce(d.codice_equo, '-') || ') unita alla scheda (' || k.nome || '): resta il nome della scheda collegata',
    auth.uid(), 'maniscalco', 'app');
  delete from cavalli_clienti_mascalcia where id = d.id;
  perform set_config('equo.unisci_manuali', '', true);
  return json_build_object('ok', true, 'nome', k.nome, 'scheda', k.id);
end
$fn$;

revoke all on function equo_unisci_cavalli_cliente(uuid, uuid, uuid) from public, anon;
grant execute on function equo_unisci_cavalli_cliente(uuid, uuid, uuid) to authenticated;
